import express from "express";
import {
    createTechnician,
    createOrUpdateTechnician,
    searchTechnicians,
    searchTechniciansByPost,
    getTechnicianById,
    getAllTechniciansListing,
    deleteTechnicianById,
    getTechnicianDashboard,
    updateBookingStatus
} from "../controllers/technician.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTechnicianSchema, searchTechniciansSchema } from '../validators/technician.validator.js';

const router = express.Router();

// Public routes
router.get("/", getAllTechniciansListing);
router.post("/search", validate(searchTechniciansSchema), searchTechniciansByPost);
router.get("/search", searchTechnicians);
router.get("/:id", getTechnicianById);

// Authenticated — technician registration
router.post("/", authenticate, validate(createTechnicianSchema), createOrUpdateTechnician);

// Admin only
router.delete("/:id", authenticate, authorize('admin'), deleteTechnicianById);

// Technician only
router.get("/:technicianId/dashboard", authenticate, authorize('technician'), getTechnicianDashboard);
router.put("/bookings/:bookingId/status", authenticate, authorize('technician'), updateBookingStatus);

export default router;
