import bcrypt from "bcryptjs";
import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";
import { validationResult } from "express-validator";
import admin from "../firebase/firebase";

const getAuthCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 18000000,
  };
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = {
      ...req.user._doc,
      password: undefined,
      firebaseUID: undefined,
      _id: undefined,
      __v: undefined,
    };
    if (!user) {
      return res.status(404).json({ message: "User not Authorized" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, firebaseUID } = req.body;
  console.log("Register attempt:", { name, email, hasPassword: !!password, firebaseUID: !!firebaseUID });
  try {
    if (!name || !email || !(firebaseUID || password)) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user already exists
    let user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password if provided
    let hashedPassword;
    if (password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Create a new user
    user = new UserModel({
      name,
      email,
      ...(hashedPassword && { password: hashedPassword }),
      ...(firebaseUID && { firebaseUID }),
    });

    await user.save();

    // Generate a JWT token
    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET as string, {
      expiresIn: "1h",
    });

    res.cookie("token", token, getAuthCookieOptions());
    // Send response
    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    console.log("Login attempt:", req.body);
    const { email, password, firebaseUID } = req.body;

    if (firebaseUID) {
      try {
        console.log("Verifying Firebase token");
        const decodedToken = await admin.auth().verifyIdToken(firebaseUID);
        console.log("Decoded token:", { email: decodedToken.email, uid: decodedToken.uid, name: decodedToken.name });
        
        if (!decodedToken?.email) {
          console.error("Firebase token missing email");
          return res
            .status(400)
            .json({ message: "Invalid Firebase credentials: email not found" });
        }

        // Try to find user by email first
        let user = await UserModel.findOne({ email: decodedToken.email });
        
        if (!user) {
          console.log("User not found, creating new user with email:", decodedToken.email);
          try {
            const newUser = new UserModel({
              name: decodedToken.name || decodedToken.email?.split('@')[0] || "User",
              email: decodedToken.email,
              firebaseUID: decodedToken.uid,
            });
            await newUser.save();
            console.log("New user created successfully:", newUser.id);
            return generateAndSendToken(res, newUser.id.toString());
          } catch (createError: any) {
            console.error("Error creating user:", createError);
            // If user creation fails due to duplicate, try to find again
            if (createError.code === 11000 || createError.name === 'MongoServerError') {
              user = await UserModel.findOne({ email: decodedToken.email });
              if (user) {
                console.log("User found after creation error (race condition), using existing user");
                return generateAndSendToken(res, user.id.toString());
              }
            }
            return res
              .status(400)
              .json({ message: "Failed to create user account" });
          }
        }

        // User exists - update firebaseUID if not set (for users who registered with email/password first)
        if (!user.firebaseUID && decodedToken.uid) {
          console.log("Updating existing user with firebaseUID");
          user.firebaseUID = decodedToken.uid;
          await user.save();
        }

        console.log("User found, logging in:", user.id);
        return generateAndSendToken(res, user.id.toString());
      } catch (error: any) {
        console.error("Error in Firebase authentication:", error);
        
        // Provide more specific error messages
        if (error.code === 'auth/id-token-expired') {
          return res.status(400).json({ message: "Firebase token expired" });
        }
        if (error.code === 'auth/argument-error') {
          return res.status(400).json({ message: "Invalid Firebase token format" });
        }
        
        return res
          .status(400)
          .json({ message: error.message || "Invalid Firebase credentials" });
      }
    }

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    console.log("Finding user:", email);
    const user = await UserModel.findOne({ email });
    if (!user || !user.password) {
      console.log("User not found or no password:", user);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Login successful for:", user.id);
    return generateAndSendToken(res, user.id);
  } catch (error) {
    console.error("Error in user login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logOutUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return Promise.resolve(
    res.status(200).json({ message: "Logged out successfully" })
  );
};

const generateAndSendToken = (res: Response, userId: string): Response => {
  const JWT_SECRET = process.env.JWT_SECRET as string;
  const payload = { user: { id: userId } };

  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "5h" });
    res.cookie("token", token, getAuthCookieOptions());
    return res.json({ message: "User Logged in Successfully" });
  } catch (err) {
    console.error("JWT Sign Error:", err);
    return res.status(500).json({ message: "Token generation failed" });
  }
};

export const editUser = async (req: Request, res: Response) => {
  const { name, email, password, firebaseUID } = req.body;
  try {
    let user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    await user.save();

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
