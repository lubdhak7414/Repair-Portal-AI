import { createWarranty as createWarrantyModel, getWarrantyById as getWarrantyByIdModel, getWarrantyByBooking, getUserWarranties as getUserWarrantiesModel, updateWarranty } from "../models/warranty.model.js";
import { getBookingById } from "../models/booking.model.js";
import { getInvoiceByBooking } from "../models/invoice.model.js";
import { getUserById } from "../models/user.model.js";
import { getTechnicianById } from "../models/technician.model.js";
import { getServiceById } from "../models/service.model.js";
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WARRANTIES_DIR = join(__dirname, '..', 'uploads', 'warranties');

if (!existsSync(WARRANTIES_DIR)) {
  mkdirSync(WARRANTIES_DIR, { recursive: true });
}

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

        // Get booking (synchronous SQLite)
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

        // Generate real QR code for warranty verification
        const verificationUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/warranty/verify/${warrantyNumber}`;
        let qrCode;
        try {
            qrCode = await QRCode.toDataURL(verificationUrl, {
                width: 150, margin: 2,
                color: { dark: '#1e3a5f', light: '#ffffff' }
            });
        } catch (qrErr) {
            console.error('QR generation failed:', qrErr.message);
            qrCode = verificationUrl; // fallback to URL string
        }

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
            qrCode,
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

// Generate real warranty PDF with QR code using pdfkit
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

        // Enrich with related data
        const warrantyUser = getUserById(warranty.user);
        const warrantyTechnician = warranty.technician ? getTechnicianById(warranty.technician) : null;

        // Generate QR code as data URL
        const verificationUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/warranty/verify/${warranty.warrantyNumber}`;
        let qrDataUrl;
        try {
            qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 150,
                margin: 2,
                color: { dark: '#1e3a5f', light: '#ffffff' }
            });
        } catch (qrErr) {
            console.error('QR generation failed (non-fatal):', qrErr.message);
            qrDataUrl = null;
        }

        // Generate PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Warranty ${warranty.warrantyNumber}`,
                Author: 'Repair Portal',
            }
        });

        const fileName = `${warranty.warrantyNumber}.pdf`;
        const filePath = join(WARRANTIES_DIR, fileName);

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            writeFileSync(filePath, pdfBuffer);

            // Save QR code and PDF URL to warranty (synchronous SQLite)
            updateWarranty(warrantyId, {
                qrCode: qrDataUrl || warranty.qrCode,
                pdfUrl: `/uploads/warranties/${fileName}`
            });

            res.status(200).json({
                message: "Warranty PDF generated successfully",
                pdfUrl: `/uploads/warranties/${fileName}`,
                warranty: { ...warranty, qrCode: qrDataUrl || warranty.qrCode, pdfUrl: `/uploads/warranties/${fileName}` }
            });
        });

        // --- PDF Content ---

        // Header
        doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a5f').text('WARRANTY CERTIFICATE', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor('#666')
            .text(`#${warranty.warrantyNumber}`, { align: 'center' });
        doc.moveDown(1);

        // Decorative line
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1e3a5f').lineWidth(2).stroke();
        doc.moveDown(1);

        // Warranty Info Box
        doc.rect(50, doc.y, 495, 120).fillColor('#f0f4ff').fill();
        const infoBoxY = doc.y + 10;
        doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(12).text('Warranty Information', 65, infoBoxY);
        doc.moveDown(0.5);
        doc.font('Helvetica').fillColor('#333').fontSize(10);
        doc.text(`Service: ${warranty.service?.name || warranty.serviceName || 'N/A'}`, 65, infoBoxY + 24);
        doc.text(`Category: ${warranty.service?.category || warranty.serviceCategory || 'N/A'}`, 65, infoBoxY + 42);
        doc.text(`Issued To: ${warrantyUser?.name || 'N/A'}`, 65, infoBoxY + 60);
        doc.text(`Service Date: ${warranty.serviceDate ? new Date(warranty.serviceDate).toLocaleDateString() : 'N/A'}`, 300, infoBoxY + 24);
        doc.text(`Expiry Date: ${warranty.expiryDate ? new Date(warranty.expiryDate).toLocaleDateString() : 'N/A'}`, 300, infoBoxY + 42);

        doc.y = infoBoxY + 130;

        // Warranty Period
        doc.font('Helvetica-Bold').fillColor('#1e3a5f').fontSize(12).text('Warranty Period', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').fillColor('#333').fontSize(10);
        const durationText = warranty.warrantyDuration
            ? `${warranty.warrantyDuration} ${warranty.warrantyUnit || 'days'}`
            : 'Standard coverage period';
        doc.text(durationText, 50, doc.y);
        doc.moveDown(2);

        // Coverage Details
        doc.font('Helvetica-Bold').fillColor('#1e3a5f').fontSize(12).text('Coverage Details', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').fillColor('#333').fontSize(10);

        const coverageList = warranty.coverageDetails;
        if (Array.isArray(coverageList) && coverageList.length > 0) {
            for (const item of coverageList) {
                const status = item.covered ? 'Covered' : 'Not Covered';
                doc.text(`- ${item.item || 'Item'} -- ${item.description || ''} [${status}]`, 65, doc.y);
                doc.moveDown(0.5);
            }
        } else {
            doc.text('Standard parts and labor coverage applies.', 50, doc.y);
            doc.moveDown(0.5);
        }
        doc.moveDown(1);

        // Terms & Conditions
        doc.font('Helvetica-Bold').fillColor('#1e3a5f').fontSize(12).text('Terms & Conditions', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').fillColor('#333').fontSize(10);

        const termsList = warranty.terms;
        if (Array.isArray(termsList) && termsList.length > 0) {
            for (const term of termsList) {
                doc.text(`- ${term}`, 65, doc.y);
                doc.moveDown(0.5);
            }
        } else {
            doc.text('Standard warranty terms apply.', 50, doc.y);
        }
        doc.moveDown(2);

        // QR Code Section
        if (qrDataUrl) {
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
            doc.moveDown(1);
            doc.font('Helvetica-Bold').fillColor('#1e3a5f').fontSize(11).text('Verify Warranty', { align: 'center' });
            doc.moveDown(0.3);
            doc.font('Helvetica').fillColor('#666').fontSize(9).text('Scan to verify warranty authenticity', { align: 'center' });
            doc.moveDown(0.5);

            // Place QR code (centered)
            const qrWidth = 100;
            const qrX = (doc.page.width - qrWidth) / 2;
            try {
                const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
                const qrImage = Buffer.from(base64Data, 'base64');
                doc.image(qrImage, qrX, doc.y, { width: qrWidth });
            } catch (imgErr) {
                console.error('Failed to embed QR image:', imgErr.message);
            }
            doc.moveDown(4);
        }

        // Footer
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#999').text('Repair Portal -- Your Trusted Service Partner', { align: 'center' });
        doc.text(`Warranty #${warranty.warrantyNumber} -- Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.text(`Verify at: ${verificationUrl}`, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error("Generate Warranty PDF Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
