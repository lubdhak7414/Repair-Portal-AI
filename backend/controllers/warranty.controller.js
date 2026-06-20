import { createWarranty as createWarrantyModel, getWarrantyById as getWarrantyByIdModel, getWarrantyByBooking, getUserWarranties as getUserWarrantiesModel, updateWarranty } from "../models/warranty.model.js";
import { getBookingById } from "../models/booking.model.js";
import { getInvoiceByBooking } from "../models/invoice.model.js";
import { getUserById } from "../models/user.model.js";
import { getTechnicianById } from "../models/technician.model.js";
import { getServiceById } from "../models/service.model.js";

// Generate warranty number helper
const generateWarrantyNumber = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `WAR-${timestamp}-${randomStr}`.toUpperCase();
};

// Create warranty card
export const createWarranty = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking
        const booking = getBookingById(bookingId);

        if (!booking || booking.status !== 'completed') {
            return res.status(400).json({
                message: "Booking not found or not completed"
            });
        }

        const bookingUser = getUserById(booking.user);
        const bookingTechnician = booking.technician ? getTechnicianById(booking.technician) : null;
        const bookingService = getServiceById(booking.service);

        const invoice = getInvoiceByBooking(bookingId);
        if (!invoice) {
            return res.status(400).json({
                message: "Invoice not found for this booking"
            });
        }

        // Check if warranty already exists
        const existingWarranty = getWarrantyByBooking(bookingId);
        if (existingWarranty) {
            return res.status(400).json({
                message: "Warranty already exists for this booking"
            });
        }

        const warrantyNumber = generateWarrantyNumber();

        // Default warranty terms based on service category
        const getWarrantyPeriod = (category) => {
            const periods = {
                'electronics': { duration: 90, unit: 'days' },
                'appliances': { duration: 6, unit: 'months' },
                'plumbing': { duration: 30, unit: 'days' },
                'electrical': { duration: 60, unit: 'days' }
            };
            return periods[category] || { duration: 30, unit: 'days' };
        };

        const warrantyPeriod = getWarrantyPeriod(bookingService ? bookingService.category : '');

        const warranty = createWarrantyModel({
            booking: bookingId,
            invoice: invoice.id,
            warrantyNumber,
            user: booking.user,
            technician: bookingTechnician ? bookingTechnician.id : booking.technician,
            serviceName: bookingService ? bookingService.name : '',
            serviceCategory: bookingService ? bookingService.category : '',
            warrantyDuration: warrantyPeriod.duration,
            warrantyUnit: warrantyPeriod.unit,
            coverageDetails: [
                {
                    item: "Parts Replacement",
                    description: "Defective parts will be replaced free of charge",
                    covered: true
                },
                {
                    item: "Labor Charges",
                    description: "Labor costs for warranty repairs",
                    covered: true
                }
            ],
            terms: [
                "Warranty is valid only for defects in workmanship",
                "Physical damage or misuse voids warranty",
                "Original invoice must be presented for warranty claims",
                "Warranty is non-transferable"
            ],
            serviceDate: booking.completedAt,
            qrCode: `warranty-${warrantyNumber}`
        });

        res.status(201).json({
            message: "Warranty card created successfully",
            warranty
        });
    } catch (error) {
        console.error("Create Warranty Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get warranty by ID
export const getWarrantyById = async (req, res) => {
    try {
        const warranty = getWarrantyByIdModel(req.params.id);

        if (!warranty) {
            return res.status(404).json({ message: "Warranty not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && warranty.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this warranty' });
        }

        // Enrich with related data
        warranty.userData = getUserById(warranty.user);
        warranty.technicianData = getTechnicianById(warranty.technician);
        warranty.bookingData = getBookingById(warranty.booking);

        res.status(200).json(warranty);
    } catch (error) {
        console.error("Get Warranty Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get user warranties
export const getUserWarranties = async (req, res) => {
    try {
        const { userId } = req.params;

        // Owner check
        if (req.user.role !== 'admin' && String(req.user.id) !== userId) {
            return res.status(403).json({ message: 'Not authorized to view these warranties' });
        }

        const { page = 1, limit = 10, status = 'active' } = req.query;

        const result = getUserWarrantiesModel(userId, {
            status,
            page: Number(page),
            limit: Number(limit)
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Get User Warranties Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Create warranty claim
export const createWarrantyClaim = async (req, res) => {
    try {
        const { warrantyId } = req.params;
        const { description } = req.body;

        const warranty = getWarrantyByIdModel(warrantyId);
        if (!warranty) {
            return res.status(404).json({ message: "Warranty not found" });
        }

        // Owner check
        if (warranty.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to claim on this warranty' });
        }

        // Check if warranty is still active
        if (!warranty.isActive || new Date(warranty.expiryDate) < new Date()) {
            return res.status(400).json({ message: "Warranty has expired" });
        }

        // Add claim to warranty history
        const claimsHistory = warranty.claimsHistory || [];
        claimsHistory.push({
            claimDate: new Date().toISOString(),
            description,
            status: 'pending'
        });

        const updatedWarranty = updateWarranty(warrantyId, {
            claimsHistory
        });

        res.status(200).json({
            message: "Warranty claim submitted successfully",
            warranty: updatedWarranty
        });
    } catch (error) {
        console.error("Create Warranty Claim Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Generate warranty PDF
export const generateWarrantyPDF = async (req, res) => {
    try {
        const { warrantyId } = req.params;

        const warranty = getWarrantyByIdModel(warrantyId);

        if (!warranty) {
            return res.status(404).json({ message: "Warranty not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && warranty.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Mock PDF generation
        const pdfUrl = `https://your-cdn.com/warranties/${warranty.warrantyNumber}.pdf`;

        updateWarranty(warrantyId, { pdfUrl });

        res.status(200).json({
            message: "Warranty PDF generated successfully",
            pdfUrl,
            warranty
        });
    } catch (error) {
        console.error("Generate Warranty PDF Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
