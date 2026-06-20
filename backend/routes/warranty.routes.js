import express from "express";
import {
    createWarranty,
    getWarrantyById,
    getUserWarranties,
    createWarrantyClaim,
    generateWarrantyPDF
} from "../controllers/warranty.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createWarrantyClaimSchema } from '../validators/warranty.validator.js';

const router = express.Router();

router.post("/booking/:bookingId", authenticate, authorize('admin'), createWarranty);
router.get("/:id", authenticate, getWarrantyById);
router.get("/user/:userId", authenticate, getUserWarranties);
router.post("/:warrantyId/claims", authenticate, validate(createWarrantyClaimSchema), createWarrantyClaim);
router.get("/:warrantyId/pdf", authenticate, generateWarrantyPDF);

export default router;
