import express from "express";
import {
    createService,
    getAllServices,
    getServiceById,
    getServiceCategories,
    updateService,
    deleteService
} from "../controllers/service.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service.validator.js';

const router = express.Router();

// Public routes (no auth required)
router.get("/", getAllServices);
router.get("/categories", getServiceCategories);
router.get("/:id", getServiceById);

// Admin only
router.post("/", authenticate, authorize('admin'), validate(createServiceSchema), createService);
router.put("/:id", authenticate, authorize('admin'), validate(updateServiceSchema), updateService);
router.delete("/:id", authenticate, authorize('admin'), deleteService);

export default router;
