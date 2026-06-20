import express from "express";
import {
    createBid,
    getBookingBids,
    acceptBid,
    getTechnicianBids
} from "../controllers/bid.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBidSchema } from '../validators/bid.validator.js';

const router = express.Router();

router.post("/", authenticate, authorize('technician'), validate(createBidSchema), createBid);
router.get("/booking/:bookingId", authenticate, getBookingBids);
router.put("/:bidId/accept", authenticate, authorize('user'), acceptBid);
router.get("/technician/:technicianId", authenticate, authorize('technician'), getTechnicianBids);

export default router;
