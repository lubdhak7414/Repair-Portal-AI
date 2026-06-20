import { createBooking as createBookingModel, getBookingById as getBookingByIdModel, getAllBookings as getAllBookingsModel, updateBooking as updateBookingModel, deleteBooking as deleteBookingModel, updateManyBookings, getBookingsForTechnician, getBookingsForTechnicianOrPendingServices } from "../models/booking.model.js";
import { getUserById } from "../models/user.model.js";
import { getTechnicianById, getTechnicianByUserId, technicianHasService } from "../models/technician.model.js";
import { getServiceById } from "../models/service.model.js";

// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const {
            user,
            technician,
            service,
            description,
            images,
            preferredDate,
            preferredTime,
            urgency,
            address,
            estimatedCost,
            isBidding,
            biddingDeadline
        } = req.body;

        const bookingData = {
            user,
            service,
            description,
            images,
            preferredDate,
            preferredTime,
            urgency,
            address,
            estimatedCost,
            isBidding: !!isBidding,
            ...(biddingDeadline ? { biddingDeadline: new Date(biddingDeadline).toISOString() } : {}),
            ...(isBidding ? {} : { technician })
        };

        if (isBidding) bookingData.status = "bidding";

        const booking = createBookingModel(bookingData);
        res.status(201).json(booking);
    } catch (error) {
        console.error("Create Booking Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
    try {
        const booking = getBookingByIdModel(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Owner check: must be booking owner, assigned technician, or admin
        if (req.user.role !== 'admin' &&
            booking.user !== req.user.id &&
            (!booking.technician || booking.technician !== req.user.id)) {
          // Also check if user is the technician's user_id
          let isTechOwner = false;
          if (booking.technician) {
            const tech = getTechnicianById(booking.technician);
            if (tech && tech.user === req.user.id) isTechOwner = true;
          }
          if (!isTechOwner) {
            return res.status(403).json({ message: 'Not authorized to view this booking' });
          }
        }

        // Populate related data
        booking.userData = getUserById(booking.user);
        booking.technicianData = booking.technician ? getTechnicianById(booking.technician) : null;
        booking.serviceData = getServiceById(booking.service);

        res.status(200).json(booking);
    } catch (error) {
        console.error("Get Booking Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update booking
export const updateBooking = async (req, res) => {
    try {
        const updatedBooking = updateBookingModel(req.params.id, req.body);

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        console.error("Update Booking Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete booking (soft delete — sets status to 'cancelled')
export const deleteBooking = async (req, res) => {
    try {
        const existing = getBookingByIdModel(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const cancelledBooking = updateBookingModel(req.params.id, {
            status: 'cancelled',
            cancellationReason: 'Deleted by admin',
            cancelledAt: new Date().toISOString(),
        });
        res.status(200).json({ message: "Booking cancelled successfully", booking: cancelledBooking });
    } catch (error) {
        console.error("Delete Booking Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
    try {
        const bookings = getAllBookingsModel();

        // Populate related data for each booking
        const populatedBookings = bookings.map(b => {
            b.userData = getUserById(b.user);
            b.technicianData = b.technician ? getTechnicianById(b.technician) : null;
            b.serviceData = getServiceById(b.service);
            return b;
        });

        res.status(200).json(populatedBookings);
    } catch (error) {
        console.error("Get All Bookings Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellationReason } = req.body;

        const booking = getBookingByIdModel(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && booking.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        }

        if (booking.status === "completed") {
            return res.status(400).json({
                message: "Cannot cancel a completed booking"
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking is already cancelled"
            });
        }

        const cancelledBooking = updateBookingModel(id, {
            status: "cancelled",
            cancellationReason: cancellationReason || "Cancelled by user",
            cancelledAt: new Date().toISOString()
        });

        res.status(200).json({
            message: "Booking cancelled successfully",
            booking: cancelledBooking
        });

    } catch (error) {
        console.error("Cancel Booking Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Reschedule booking
export const rescheduleBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { preferredDate, preferredTime, rescheduleReason } = req.body;

        if (!preferredDate || !preferredTime) {
            return res.status(400).json({
                message: "Preferred date and time are required for rescheduling"
            });
        }

        const booking = getBookingByIdModel(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && booking.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to reschedule this booking' });
        }

        if (booking.status === "completed") {
            return res.status(400).json({
                message: "Cannot reschedule a completed booking"
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Cannot reschedule a cancelled booking"
            });
        }

        const newDate = new Date(preferredDate);
        const currentDate = new Date();
        if (newDate <= currentDate) {
            return res.status(400).json({
                message: "New preferred date must be in the future"
            });
        }

        const updateFields = {
            preferredDate: newDate.toISOString(),
            preferredTime,
        };
        if (booking.status === "accepted") {
            updateFields.status = "pending";
        }

        const rescheduledBooking = updateBookingModel(id, updateFields);

        res.status(200).json({
            message: "Booking rescheduled successfully",
            booking: rescheduledBooking
        });

    } catch (error) {
        console.error("Reschedule Booking Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get booking cancellation/reschedule history
export const getBookingHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = getBookingByIdModel(id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Owner check
        if (req.user.role !== 'admin' && booking.user !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this history' });
        }

        const history = {
            bookingId: booking.id,
            currentStatus: booking.status,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
            cancellation: booking.status === "cancelled" ? {
                cancelledAt: booking.cancelledAt,
                reason: booking.cancellationReason
            } : null,
            rescheduleHistory: [],
            completion: booking.status === "completed" ? {
                completedAt: booking.completedAt
            } : null
        };

        res.status(200).json(history);

    } catch (error) {
        console.error("Get Booking History Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get user's cancellable bookings
export const getUserCancellableBookings = async (req, res) => {
    try {
        const { userId } = req.params;

        // Owner check
        if (req.user.role !== 'admin' && String(req.user.id) !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const cancellableBookings = getAllBookingsModel({
            userId,
            excludeStatuses: ["completed", "cancelled"]
        });

        res.status(200).json({
            message: "Cancellable bookings retrieved successfully",
            count: cancellableBookings.length,
            bookings: cancellableBookings
        });

    } catch (error) {
        console.error("Get Cancellable Bookings Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Bulk cancel bookings (admin feature)
export const bulkCancelBookings = async (req, res) => {
    try {
        const { bookingIds, reason } = req.body;

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({
                message: "Booking IDs array is required and cannot be empty"
            });
        }

        // Filter to only cancellable bookings
        const cancellableIds = bookingIds.filter(id => {
            const b = getBookingByIdModel(id);
            return b && !["completed", "cancelled"].includes(b.status);
        });

        if (cancellableIds.length === 0) {
            return res.status(400).json({
                message: "No cancellable bookings found"
            });
        }

        const result = updateManyBookings(cancellableIds, {
            status: "cancelled",
            cancellationReason: reason || "Bulk cancellation",
            cancelledAt: new Date().toISOString()
        });

        res.status(200).json({
            message: `${result.changes} bookings cancelled successfully`,
            cancelledCount: result.changes,
            requestedCount: bookingIds.length
        });

    } catch (error) {
        console.error("Bulk Cancel Bookings Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get live booking status
export const getBookingStatus = async (req, res) => {
    try {
        const booking = getBookingByIdModel(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Owner check: must be booking owner, assigned technician, or admin
        if (req.user.role !== 'admin' &&
            booking.user !== req.user.id &&
            (!booking.technician || booking.technician !== req.user.id)) {
          let isTechOwner = false;
          if (booking.technician) {
            const tech = getTechnicianById(booking.technician);
            if (tech && tech.user === req.user.id) isTechOwner = true;
          }
          if (!isTechOwner) {
            return res.status(403).json({ message: 'Not authorized' });
          }
        }

        res.status(200).json({ status: booking.status });
    } catch (error) {
        console.error("Get Booking Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all bookings for a specific user
export const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;

        // Owner check
        if (req.user.role !== 'admin' && String(req.user.id) !== userId) {
            return res.status(403).json({ message: 'Not authorized to view these bookings' });
        }

        const bookings = getAllBookingsModel({ userId });

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this user" });
        }

        // Populate related data
        const populatedBookings = bookings.map(b => {
            b.technicianData = b.technician ? getTechnicianById(b.technician) : null;
            b.serviceData = getServiceById(b.service);
            return b;
        });

        res.status(200).json({
            message: "Bookings retrieved successfully",
            count: populatedBookings.length,
            bookings: populatedBookings
        });

    } catch (error) {
        console.error("Get User Bookings Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all bookings with bidding enabled
export const getBiddingBookings = async (req, res) => {
    try {
        const biddingBookings = getAllBookingsModel({ isBidding: true });

        if (!biddingBookings || biddingBookings.length === 0) {
            return res.status(404).json({ message: "No bookings found with bidding enabled" });
        }

        // Populate related data
        const populatedBookings = biddingBookings.map(b => {
            b.userData = getUserById(b.user);
            b.technicianData = b.technician ? getTechnicianById(b.technician) : null;
            b.serviceData = getServiceById(b.service);
            return b;
        });

        res.status(200).json({
            message: "Bidding bookings retrieved successfully",
            count: populatedBookings.length,
            bookings: populatedBookings
        });
    } catch (error) {
        console.error("Get Bidding Bookings Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get bookings for a technician with status filter (from BookingRoutes.js)
export const getTechnicianBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        // Owner check: technician can only view own bookings
        if (String(req.user.id) !== userId) {
            return res.status(403).json({ message: 'Not authorized to view these bookings' });
        }

        if (!/^\d+$/.test(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const technician = getTechnicianByUserId(userId);
        if (!technician) {
            return res.status(404).json({ message: "Technician not found for this user" });
        }

        let bookings;

        if (status === 'pending') {
            // Get pending bookings for services this technician offers
            const serviceIds = (technician.services || []).map(s => s.id);
            if (serviceIds.length === 0) {
                bookings = [];
            } else {
                bookings = getAllBookingsModel({ status: 'pending' }).filter(b =>
                    serviceIds.includes(b.service)
                );
            }
        } else {
            bookings = getBookingsForTechnician(technician.id, status || undefined);
        }

        // Enrich with user and service data
        const enrichedBookings = bookings.map(booking => {
            booking.userData = getUserById(booking.user);
            booking.serviceData = getServiceById(booking.service);
            return booking;
        });

        res.status(200).json(enrichedBookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all bookings for a technician (from BookingRoutes.js)
export const getAllTechnicianBookings = async (req, res) => {
    try {
        const { userId } = req.params;

        // Owner check
        if (String(req.user.id) !== userId) {
            return res.status(403).json({ message: 'Not authorized to view these bookings' });
        }

        if (!/^\d+$/.test(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const technician = getTechnicianByUserId(userId);
        if (!technician) {
            return res.status(404).json({ message: 'Technician not found for this user' });
        }

        const serviceIds = (technician.services || []).map(s => s.id);
        const bookings = getBookingsForTechnicianOrPendingServices(technician.id, serviceIds);

        // Enrich with user and service data
        const enrichedBookings = bookings.map(booking => {
            booking.userData = getUserById(booking.user);
            booking.serviceData = getServiceById(booking.service);
            return booking;
        }).filter(booking => booking && booking.id && (booking.userData || booking.status === 'pending'));

        res.status(200).json(enrichedBookings);
    } catch (error) {
        console.error('Error fetching all technician bookings:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update booking status by technician (from BookingRoutes.js)
export const updateTechnicianBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, userId, cancellationReason } = req.body;

        if (!["accepted", "rejected", "in-progress", "completed", "cancelled", "pending"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const technician = getTechnicianByUserId(userId);
        if (!technician) {
            return res.status(404).json({ message: "Technician not found for this user" });
        }

        const booking = getBookingByIdModel(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const updateFields = {};

        // For pending -> accepted: Assign technician
        if (booking.status === 'pending' && status === 'accepted') {
            if (!technicianHasService(technician.id, booking.service)) {
                return res.status(403).json({ message: "Technician doesn't offer this service" });
            }

            updateFields.technician = technician.id;
            updateFields.status = 'accepted';
        }
        // For pending -> rejected/cancelled
        else if (booking.status === 'pending' && (status === 'rejected' || status === 'cancelled')) {
            updateFields.status = status;
            if (cancellationReason) {
                updateFields.cancellationReason = cancellationReason;
            }
            updateFields.cancelledAt = new Date().toISOString();
        }
        // For other status updates
        else {
            // Validate technician ownership
            if (booking.technician && booking.technician.toString() !== technician.id.toString()) {
                return res.status(403).json({ message: "Unauthorized action" });
            }

            // Validate status transitions
            const validTransitions = {
                'accepted': ['in-progress', 'cancelled'],
                'in-progress': ['completed', 'cancelled'],
                'pending': ['cancelled', 'rejected']
            };

            if (!validTransitions[booking.status]?.includes(status)) {
                return res.status(400).json({
                    message: `Invalid status transition from ${booking.status} to ${status}`
                });
            }

            updateFields.status = status;

            // Record timestamps
            if (status === 'completed') updateFields.completedAt = new Date().toISOString();
            if (status === 'cancelled') {
                updateFields.cancelledAt = new Date().toISOString();
                if (cancellationReason) {
                    updateFields.cancellationReason = cancellationReason;
                }
            }
        }

        const updatedBooking = updateBookingModel(bookingId, updateFields);
        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
