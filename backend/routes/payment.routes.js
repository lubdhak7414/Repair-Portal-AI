import express from "express";
import {
    createPayment,
    processPayment,
    getPaymentByBooking
} from "../controllers/payment.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema, processPaymentSchema } from '../validators/payment.validator.js';

const router = express.Router();

router.post("/", authenticate, authorize('user'), validate(createPaymentSchema), createPayment);
router.put("/:paymentId/process", authenticate, authorize('admin'), validate(processPaymentSchema), processPayment);
router.get("/booking/:bookingId", authenticate, getPaymentByBooking);

export default router;
