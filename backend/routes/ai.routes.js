import express from "express";
import { getDiagnosis } from "../controllers/ai.controller.js";
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { diagnosisSchema } from '../validators/diagnosis.validator.js';

const router = express.Router();

// AI diagnosis requires authentication (costly API calls)
router.post("/", authenticate, validate(diagnosisSchema), getDiagnosis);

export default router;
