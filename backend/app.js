import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { getDb } from "./config/db.js";
import apiRoutes from "./routes/index.js";
import cors from "cors";
import { errorHandler } from './middleware/error-handler.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

// Rate limiting is skipped under tests so the suite stays deterministic.
const skipRateLimit = () => process.env.NODE_ENV === 'test';

// ---- Security Headers ----
app.use(helmet());

// ---- Rate Limiting ----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter for AI diagnosis endpoint (5 req/min)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  message: { message: 'Too many diagnosis requests. Please wait before trying again.' },
});

// ---- CORS Configuration ----
app.use(cors({ origin: corsOrigin }));

// Middleware — single express.json
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files (invoices, warranties, booking images)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Initialize DB
getDb();

// Apply AI rate limiter before the diagnosis route
app.use("/api/diagnosis", aiLimiter);

// API Routes — single mount point
app.use("/api", apiRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

// Error handler (must be last middleware)
app.use(errorHandler);

export default app;
