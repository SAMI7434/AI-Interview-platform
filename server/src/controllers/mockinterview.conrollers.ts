import { Request, Response } from "express";
import MockInterviewModel from "../models/mockinterview.model";
import User from "../models/user.model";

// Create a new mock interview
export const createMockInterview = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id; // Assuming user ID is set in req.user by auth middleware
    const {
      jobRole,
      overallReview,
      overallRating,
      experienceLevel,
      targetCompany,
      skills,
      dsaQuestions,
      technicalQuestions,
      coreSubjectQuestions,
    } = req.body;

    // DEBUG: Log request body and each field
    console.log("=== BACKEND DEBUG ===");
    console.log("REQ BODY:", JSON.stringify(req.body, null, 2));
    console.log("req.body.jobRole:", req.body.jobRole);
    console.log("req.body.experienceLevel:", req.body.experienceLevel);
    console.log("req.body.skills:", req.body.skills);
    console.log("req.body.targetCompany:", req.body.targetCompany);
    console.log("req.body.overallRating:", req.body.overallRating);
    
    console.log("Extracted fields:", { 
      jobRole: jobRole || "MISSING", 
      experienceLevel: experienceLevel || "MISSING", 
      targetCompany: targetCompany || "MISSING", 
      overallRating: overallRating !== undefined ? overallRating : "MISSING",
      skills: skills?.length || 0
    });

    // Validate required fields - check for empty strings and undefined
    console.log("=== VALIDATION CHECK ===");
    console.log("jobRole type:", typeof jobRole, "value:", jobRole, "truthy:", !!jobRole);
    console.log("experienceLevel type:", typeof experienceLevel, "value:", experienceLevel, "truthy:", !!experienceLevel);
    console.log("targetCompany type:", typeof targetCompany, "value:", targetCompany, "truthy:", !!targetCompany);
    console.log("overallRating type:", typeof overallRating, "value:", overallRating, "undefined?:", overallRating === undefined);
    
    const missingFields: string[] = [];
    
    // Check jobRole
    if (!jobRole || (typeof jobRole === 'string' && jobRole.trim() === "")) {
      console.log("❌ jobRole is missing or empty");
      missingFields.push("jobRole");
    } else {
      console.log("✅ jobRole is valid");
    }
    
    // Check experienceLevel
    if (!experienceLevel || (typeof experienceLevel === 'string' && experienceLevel.trim() === "")) {
      console.log("❌ experienceLevel is missing or empty");
      missingFields.push("experienceLevel");
    } else {
      console.log("✅ experienceLevel is valid");
    }
    
    // Check targetCompany
    if (!targetCompany || (typeof targetCompany === 'string' && targetCompany.trim() === "")) {
      console.log("❌ targetCompany is missing or empty");
      missingFields.push("targetCompany");
    } else {
      console.log("✅ targetCompany is valid");
    }
    
    // Check overallRating
    if (overallRating === undefined || overallRating === null) {
      console.log("❌ overallRating is missing");
      missingFields.push("overallRating");
    } else {
      console.log("✅ overallRating is valid:", overallRating);
    }
    
    if (missingFields.length > 0) {
      console.log("❌ VALIDATION FAILED. Missing fields:", missingFields);
      return res.status(400).json({ 
        message: "Please fill all details",
        missingFields: missingFields
      });
    }
    
    console.log("✅ VALIDATION PASSED - All fields present");

    const newMockInterview = new MockInterviewModel({
      user: userId,
      jobRole,
      overallReview,
      overallRating,
      experienceLevel,
      targetCompany,
      skills,
      dsaQuestions,
      technicalQuestions,
      coreSubjectQuestions,
    });

    const savedMockInterview = await newMockInterview.save();
    res.status(201).json(savedMockInterview);
  } catch (error: any) {
    console.error("Error creating interview:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ 
        message: "Validation error",
        errors: errors
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: error.message || "Internal server error" 
    });
  }
};

// Delete a mock interview
export const deleteMockInterview = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id; // Assuming user ID is set in req.user by auth middleware
    const { id } = req.params;

    const mockInterview = await MockInterviewModel.findOneAndDelete({
      _id: id,
      user: userId,
    });
    if (!mockInterview) {
      return res.status(404).json({ message: "Mock interview not found" });
    }

    res.status(200).json({ message: "Mock interview deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Edit a mock interview
export const editMockInterview = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id; // Assuming user ID is set in req.user by auth middleware
    const { id } = req.params;
    const updates = req.body;

    const mockInterview = await MockInterviewModel.findOneAndUpdate(
      { _id: id, user: userId },
      updates,
      { new: true }
    );

    if (!mockInterview) {
      return res.status(404).json({ message: "Mock interview not found" });
    }

    res.status(200).json(mockInterview);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Get all mock interviews for a user
export const getMockInterviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id; // Assuming user ID is set in req.user by auth middleware
    const mockInterviews = await MockInterviewModel.find({ user: userId });
    res.status(200).json(mockInterviews);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Get a single mock interview by ID
export const getMockInterviewById = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id; // Assuming user ID is set in req.user by auth middleware
    const { id } = req.params;
    // console.log(id);
    const mockInterview = await MockInterviewModel.findOne({
      _id: id,
      user: userId,
    });

    if (!mockInterview) {
      return res.status(404).json({ message: "Mock interview not found" });
    }

    res.status(200).json(mockInterview);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
