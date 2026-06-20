import express from "express";
import {
    createBooking,
    getBookingById,
    updateBooking,
    deleteBooking,
    getAllBookings,
    cancelBooking,
    rescheduleBooking,
    getBookingHistory,
    getUserCancellableBookings,
    bulkCancelBookings,
    getBookingStatus,
    getUserBookings,
    getBiddingBookings,
    getTechnicianBookings,
    getAllTechnicianBookings,
    updateTechnicianBookingStatus
} from "../controllers/booking.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema, cancelBookingSchema, rescheduleBookingSchema } from '../validators/booking.validator.js';

const router = express.Router();

// All booking routes require authentication
router.post("/", authenticate, validate(createBookingSchema), createBooking);
router.get("/single/:id", authenticate, getBookingById);
router.put("/:id", authenticate, updateBooking);
router.delete("/:id", authenticate, deleteBooking);
router.get("/", authenticate, authorize('admin'), getAllBookings);
router.put('/cancel/:id', authenticate, validate(cancelBookingSchema), cancelBooking);
router.put('/reschedule/:id', authenticate, validate(rescheduleBookingSchema), rescheduleBooking);
router.get('/history/:id', authenticate, getBookingHistory);
router.get('/user/:userId/cancellable', authenticate, getUserCancellableBookings);
router.put('/bulk-cancel', authenticate, authorize('admin'), bulkCancelBookings);
router.get("/status/:id", authenticate, getBookingStatus);
router.get("/user/:userId", authenticate, getUserBookings);
router.get('/bidding-bookings', authenticate, getBiddingBookings);

// Technician dashboard routes
router.get("/technician/:userId/bookings", authenticate, authorize('technician'), getTechnicianBookings);
router.get("/technician/:userId/all-bookings", authenticate, authorize('technician'), getAllTechnicianBookings);
router.patch("/technician/:bookingId/status", authenticate, authorize('technician'), updateTechnicianBookingStatus);

export default router;
