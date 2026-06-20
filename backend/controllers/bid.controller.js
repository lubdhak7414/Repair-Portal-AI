import { createBid as createBidModel, getBidById, getBidsByBooking, getBidsByTechnician, getBidByBookingAndTechnician, updateBid, updateBidsByBooking } from "../models/bid.model.js";
import { getBookingById, updateBooking } from "../models/booking.model.js";
import { getUserById } from "../models/user.model.js";

// Create bid on booking
export const createBid = async (req, res) => {
    try {
        const { booking, technician, bidAmount, message, estimatedDuration } = req.body;

        // Validate booking
        const existingBooking = getBookingById(booking);

        if (!existingBooking || !['pending', 'bidding'].includes(existingBooking.status.toLowerCase())) {
            return res.status(400).json({
                message: "Booking not available for bidding"
            });
        }

        // Validate technician
        const user = getUserById(technician);

        if (!user || user.role !== 'technician') {
            return res.status(400).json({
                message: "Technician not found or not authorized to bid"
            });
        }

        // Check for existing bid
        const existingBid = getBidByBookingAndTechnician(booking, technician);

        if (existingBid) {
            return res.status(400).json({
                message: "You have already placed a bid on this booking"
            });
        }

        // Create bid
        const bid = createBidModel({
            booking,
            technician,
            bidAmount,
            message,
            estimatedDuration
        });

        // Enrich with related data
        const techUser = getUserById(bid.technician);
        const bookingData = getBookingById(bid.booking);
        bid.technicianData = techUser ? { id: techUser.id, name: techUser.name, picture: techUser.picture, phone: techUser.phone } : null;
        bid.bookingData = bookingData ? { id: bookingData.id, service: bookingData.service, description: bookingData.description } : null;

        res.status(201).json({
            message: "Bid placed successfully",
            bid
        });

    } catch (error) {
        console.error("Create Bid Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get bids for booking
export const getBookingBids = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { sortBy = 'bidAmount' } = req.query;

        const bids = getBidsByBooking(bookingId, { status: 'pending', sortBy });

        // Enrich with technician data
        const enrichedBids = bids.map(bid => {
            const techUser = getUserById(bid.technician);
            bid.technicianData = techUser ? { id: techUser.id, name: techUser.name, picture: techUser.picture, phone: techUser.phone } : null;
            return bid;
        });

        res.status(200).json({
            bids: enrichedBids,
            count: enrichedBids.length
        });
    } catch (error) {
        console.error("Get Booking Bids Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Accept bid
export const acceptBid = async (req, res) => {
    try {
        const { bidId } = req.params;

        const bid = getBidById(bidId);

        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        // Owner check: must be the booking owner
        const booking = getBookingById(bid.booking);
        if (!booking || booking.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to accept this bid' });
        }

        // Reject all other bids for this booking
        updateBidsByBooking(bid.booking, bidId, { status: 'rejected' });

        // Accept the selected bid
        updateBid(bidId, {
            status: 'accepted',
            acceptedAt: new Date().toISOString()
        });

        // Update booking with technician and cost details
        updateBooking(bid.booking, {
            technician: bid.technician,
            estimatedCost: bid.bidAmount,
            status: 'accepted'
        });

        res.status(200).json({
            message: "Bid accepted successfully",
            bidId: bid.id
        });
    } catch (error) {
        console.error("Accept Bid Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get technician's bids
export const getTechnicianBids = async (req, res) => {
    try {
        const { technicianId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;

        const technician = getUserById(technicianId);

        if (!technician || technician.role !== 'technician') {
            return res.status(400).json({
                message: "User is not a technician"
            });
        }

        const result = getBidsByTechnician(technicianId, { status, page: Number(page), limit: Number(limit) });

        // Enrich bids with booking data
        const enrichedBids = result.bids.map(bid => {
            const bookingData = getBookingById(bid.booking);
            bid.bookingData = bookingData;
            return bid;
        });

        res.status(200).json({
            bids: enrichedBids,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            total: result.total
        });
    } catch (error) {
        console.error("Get Technician Bids Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
