import { createInvoice as createInvoiceModel, getInvoiceById as getInvoiceByIdModel, getInvoiceByBooking, getUserInvoices as getUserInvoicesModel, updateInvoice } from "../models/invoice.model.js";
import { getBookingById } from "../models/booking.model.js";
import { getPaymentByBooking } from "../models/payment.model.js";
import { getUserById } from "../models/user.model.js";
import { getTechnicianById } from "../models/technician.model.js";
import { getServiceById } from "../models/service.model.js";

// Generate invoice number helper
const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `INV-${timestamp}-${randomStr}`.toUpperCase();
};

// Create invoice
export const createInvoice = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking with all related data
        const booking = getBookingById(bookingId);

        if (!booking || booking.status !== 'completed') {
            return res.status(400).json({
                message: "Booking not found or not completed"
            });
        }

        const bookingUser = getUserById(booking.user);
        const bookingTechnician = booking.technician ? getTechnicianById(booking.technician) : null;
        const bookingService = getServiceById(booking.service);

        // Check if payment exists
        const payment = getPaymentByBooking(bookingId);
        if (!payment) {
            return res.status(400).json({
                message: "Payment not found for this booking"
            });
        }

        // Check if invoice already exists
        const existingInvoice = getInvoiceByBooking(bookingId);
        if (existingInvoice) {
            return res.status(400).json({
                message: "Invoice already exists for this booking"
            });
        }

        const invoiceNumber = generateInvoiceNumber();

        const invoice = createInvoiceModel({
            booking: bookingId,
            payment: payment.id,
            invoiceNumber,
            user: booking.user,
            technician: bookingTechnician ? bookingTechnician.id : booking.technician,
            service: {
                name: bookingService ? bookingService.name : '',
                description: booking.description
            },
            itemsBreakdown: [{
                description: bookingService ? bookingService.name : '',
                quantity: 1,
                unitPrice: booking.finalCost,
                totalPrice: booking.finalCost
            }],
            subtotal: booking.finalCost,
            platformFee: payment.platformFee,
            totalAmount: booking.finalCost,
            billingAddress: booking.address ? { street: booking.address } : {},
            serviceDate: booking.completedAt
        });

        res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });
    } catch (error) {
        console.error("Create Invoice Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = getInvoiceByIdModel(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && invoice.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }

        // Enrich with related data
        invoice.userData = getUserById(invoice.user);
        invoice.technicianData = getTechnicianById(invoice.technician);
        invoice.bookingData = getBookingById(invoice.booking);

        res.status(200).json(invoice);
    } catch (error) {
        console.error("Get Invoice Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get invoices by user
export const getUserInvoices = async (req, res) => {
    try {
        const { userId } = req.params;

        // Owner check
        if (req.user.role !== 'admin' && String(req.user.id) !== userId) {
            return res.status(403).json({ message: 'Not authorized to view these invoices' });
        }

        const { page = 1, limit = 10, status } = req.query;

        const result = getUserInvoicesModel(userId, {
            status,
            page: Number(page),
            limit: Number(limit)
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Get User Invoices Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Generate PDF invoice (mock implementation)
export const generateInvoicePDF = async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = getInvoiceByIdModel(invoiceId);

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && invoice.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Mock PDF generation
        const pdfUrl = `https://your-cdn.com/invoices/${invoice.invoiceNumber}.pdf`;

        updateInvoice(invoiceId, { pdfUrl });

        res.status(200).json({
            message: "PDF generated successfully",
            pdfUrl,
            invoice
        });
    } catch (error) {
        console.error("Generate PDF Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
