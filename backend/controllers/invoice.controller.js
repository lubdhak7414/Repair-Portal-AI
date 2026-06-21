import { createInvoice as createInvoiceModel, getInvoiceById as getInvoiceByIdModel, getInvoiceByBooking, getUserInvoices as getUserInvoicesModel, updateInvoice } from "../models/invoice.model.js";
import { getBookingById } from "../models/booking.model.js";
import { getPaymentByBooking } from "../models/payment.model.js";
import { getUserById } from "../models/user.model.js";
import { getTechnicianById } from "../models/technician.model.js";
import { getServiceById } from "../models/service.model.js";
import PDFDocument from 'pdfkit';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INVOICES_DIR = join(__dirname, '..', 'uploads', 'invoices');

// Ensure invoices directory exists
if (!existsSync(INVOICES_DIR)) {
  mkdirSync(INVOICES_DIR, { recursive: true });
}

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

        // Get booking with all related data (synchronous SQLite calls)
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

// Generate real PDF invoice using pdfkit
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

        // Enrich with related data for PDF content
        const invoiceUser = getUserById(invoice.user);
        const invoiceTechnician = invoice.technician ? getTechnicianById(invoice.technician) : null;

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Invoice ${invoice.invoiceNumber}`,
                Author: 'Repair Portal',
            }
        });

        const fileName = `${invoice.invoiceNumber}.pdf`;
        const filePath = join(INVOICES_DIR, fileName);

        // Collect PDF chunks and write to file
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            writeFileSync(filePath, pdfBuffer);

            // Update invoice with PDF path (synchronous SQLite)
            updateInvoice(invoiceId, { pdfUrl: `/uploads/invoices/${fileName}` });

            res.status(200).json({
                message: "PDF generated successfully",
                pdfUrl: `/uploads/invoices/${fileName}`,
                invoice
            });
        });

        // --- PDF Content ---

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').fillColor('#666')
            .text(`#${invoice.invoiceNumber}`, { align: 'center' });
        doc.moveDown(1);

        // Horizontal rule
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(1);

        // From / To section
        const startY = doc.y;
        doc.fontSize(11).fillColor('#333');

        // Company info (left)
        doc.font('Helvetica-Bold').text('Repair Portal', 50, startY);
        doc.font('Helvetica').fillColor('#666')
            .text('123 Service Street')
            .text('support@repairportal.com')
            .text('+1-800-REPAIR');
        doc.moveDown(1);

        // Billing info (right)
        const companyBoxEnd = doc.y;
        doc.y = startY;
        const rightX = 350;
        doc.font('Helvetica-Bold').fillColor('#333').text('Bill To:', rightX, startY);
        doc.font('Helvetica').fillColor('#666')
            .text(invoiceUser?.name || 'N/A', rightX)
            .text(invoiceUser?.email || '', rightX)
            .text(invoiceUser?.phone || '', rightX);
        doc.moveDown(2);

        // Info table
        const infoY = Math.max(companyBoxEnd, doc.y) + 10;
        doc.y = infoY;
        doc.font('Helvetica-Bold').fillColor('#333').text('Invoice Details', 50, doc.y);
        doc.moveDown(0.5);

        const infoTop = doc.y;
        doc.font('Helvetica').fillColor('#666');
        doc.text('Service:', 50, infoTop);
        doc.text(`${invoice.service?.name || 'N/A'}`, 150, infoTop);
        doc.text('Date:', 350, infoTop);
        doc.text(`${invoice.serviceDate ? new Date(invoice.serviceDate).toLocaleDateString() : 'N/A'}`, 420, infoTop);
        doc.moveDown(1);

        doc.text('Status:', 350, doc.y);
        doc.text(`${invoice.status || 'sent'}`, 420, doc.y);
        doc.moveDown(2);

        // Items Table Header
        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 20).fillColor('#2563eb').fill();
        doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10);
        doc.text('Description', 60, tableTop + 5);
        doc.text('Qty', 350, tableTop + 5, { width: 30, align: 'center' });
        doc.text('Unit Price', 400, tableTop + 5, { width: 80, align: 'right' });
        doc.text('Total', 480, tableTop + 5, { width: 55, align: 'right' });

        // Items Table Rows
        doc.fillColor('#333').font('Helvetica').fontSize(10);
        let rowY = tableTop + 25;

        if (invoice.itemsBreakdown && invoice.itemsBreakdown.length > 0) {
            for (const item of invoice.itemsBreakdown) {
                doc.text(item.description || 'Service', 60, rowY);
                doc.text(String(item.quantity || 1), 350, rowY, { width: 30, align: 'center' });
                doc.text(`$${Number(item.unitPrice || 0).toFixed(2)}`, 400, rowY, { width: 80, align: 'right' });
                doc.text(`$${Number(item.totalPrice || 0).toFixed(2)}`, 480, rowY, { width: 55, align: 'right' });
                rowY += 20;
            }
        } else {
            doc.text(invoice.service?.name || 'Repair Service', 60, rowY);
            doc.text('1', 350, rowY, { width: 30, align: 'center' });
            doc.text(`$${Number(invoice.subtotal || 0).toFixed(2)}`, 400, rowY, { width: 80, align: 'right' });
            doc.text(`$${Number(invoice.subtotal || 0).toFixed(2)}`, 480, rowY, { width: 55, align: 'right' });
            rowY += 20;
        }

        // Totals
        rowY += 10;
        doc.moveTo(350, rowY).lineTo(545, rowY).strokeColor('#ccc').stroke();
        rowY += 10;

        const totals = [
            { label: 'Subtotal', value: invoice.subtotal || 0 },
            { label: 'Platform Fee', value: invoice.platformFee || 0 },
            { label: 'Total', value: invoice.totalAmount || 0, bold: true },
        ];

        for (const item of totals) {
            doc.font(item.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#333').fontSize(10);
            doc.text(item.label, 350, rowY);
            doc.text(`$${Number(item.value).toFixed(2)}`, 480, rowY, { width: 55, align: 'right' });
            rowY += 18;
        }

        // Footer
        doc.moveDown(3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(1);
        doc.fontSize(9).fillColor('#999').text('Thank you for your business!', { align: 'center' });
        doc.text(`Invoice #${invoice.invoiceNumber} -- Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

        // Finalize
        doc.end();
    } catch (error) {
        console.error("Generate PDF Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
