import { createPayment as createPaymentModel, getPaymentById, getPaymentByBooking as getPaymentByBookingModel, updatePayment } from "../models/payment.model.js";
import { getBookingById } from "../models/booking.model.js";
import { getUserById } from "../models/user.model.js";
import { getTechnicianById } from "../models/technician.model.js";

// Create payment
export const createPayment = async (req, res) => {
    try {
        const {
            booking,
            user,
            technician,
            amount,
            paymentMethod
        } = req.body;

        // Verify booking exists and is completed
        const existingBooking = getBookingById(booking);
        if (!existingBooking || existingBooking.status !== 'completed') {
            return res.status(400).json({
                message: "Booking not found or not completed"
            });
        }

        const platformFeeRate = 0.05; // 5% platform fee
        const platformFee = amount * platformFeeRate;
        const technicianAmount = amount - platformFee;

        const payment = createPaymentModel({
            booking,
            user,
            technician,
            amount,
            paymentMethod,
            platformFee,
            technicianAmount
        });

        res.status(201).json({
            message: "Payment initiated successfully",
            payment
        });
    } catch (error) {
        console.error("Create Payment Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Process payment (mock gateway integration)
export const processPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { transactionId, gatewayResponse } = req.body;

        const payment = updatePayment(paymentId, {
            status: 'completed',
            transactionId,
            gatewayResponse,
            paidAt: new Date().toISOString()
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json({
            message: "Payment processed successfully",
            payment
        });
    } catch (error) {
        console.error("Process Payment Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get payment by booking
export const getPaymentByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const payment = getPaymentByBookingModel(bookingId);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && payment.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this payment' });
        }

        // Enrich with related data
        payment.userData = getUserById(payment.user);
        payment.technicianData = getTechnicianById(payment.technician);
        payment.bookingData = getBookingById(payment.booking);

        res.status(200).json(payment);
    } catch (error) {
        console.error("Get Payment Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
