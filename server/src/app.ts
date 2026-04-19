import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database/database";

import userRoutes from "./routes/user.routes";
import mockinterviewRoutes from "./routes/mockinterview.routes";
import geminiRoutes from "./routes/gemini.routes"
import healthRoutes from "./routes/health.routes";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/$/, "").toLowerCase())
  .filter(Boolean);

const normalizeOrigin = (origin: string): string => origin.trim().replace(/\/$/, "").toLowerCase();

const isAllowedOrigin = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  // Allow localhost during development if not explicitly configured.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
    return true;
  }

  // Allow Vercel deployments to reduce CORS deployment friction.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(normalizedOrigin)) {
    return true;
  }

  // Allow common hosted frontend domains when explicit env configuration is missing.
  if (/^https:\/\/[a-z0-9-]+\.(onrender\.com|netlify\.app)$/.test(normalizedOrigin)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.static("./public"));
app.use(express.json()); //To parse incoming JSON requests;

connectDB();

// Routes
app.use("/api/users", userRoutes);
app.use("/api/mockinterview", mockinterviewRoutes);
app.use("/api/ai", geminiRoutes);
app.use("/api/health", healthRoutes);

export default app;
