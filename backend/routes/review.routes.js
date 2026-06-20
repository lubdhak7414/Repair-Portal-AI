import express from "express";
import {
    createReview,
    getTechnicianReviews,
    respondToReview
} from "../controllers/review.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema, respondToReviewSchema } from '../validators/review.validator.js';

const router = express.Router();

router.post("/", authenticate, authorize('user'), validate(createReviewSchema), createReview);
router.get("/technician/:technicianId", getTechnicianReviews);  // Public
router.put("/:reviewId/respond", authenticate, authorize('technician'), validate(respondToReviewSchema), respondToReview);

export default router;
