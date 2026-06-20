import express from "express";
import {
    createInvoice,
    getInvoiceById,
    getUserInvoices,
    generateInvoicePDF
} from "../controllers/invoice.controller.js";
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post("/booking/:bookingId", authenticate, authorize('admin'), createInvoice);
router.get("/:id", authenticate, getInvoiceById);
router.get("/user/:userId", authenticate, getUserInvoices);
router.get("/:invoiceId/pdf", authenticate, generateInvoicePDF);

export default router;
