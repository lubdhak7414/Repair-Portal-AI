import { createReview as createReviewModel, getReviewByBooking, getTechnicianReviews as getTechnicianReviewsModel, getAllReviewsByTechnician, updateReview, getTechnicianRatingStats } from "../models/review.model.js";
import { getBookingById } from "../models/booking.model.js";
import { updateTechnician, getTechnicianById as getTechnicianByIdModel } from "../models/technician.model.js";
import { getUserById } from "../models/user.model.js";

// Create review
export const createReview = async (req, res) => {
    try {
        const {
            booking,
            user,
            technician,
            rating,
            comment,
            images,
            wouldRecommend,
            isAnonymous
        } = req.body;

        // Check if booking is completed
        const existingBooking = getBookingById(booking);
        if (!existingBooking || existingBooking.status !== 'completed') {
            return res.status(400).json({
                message: "Can only review completed bookings"
            });
        }

        // Check if review already exists
        const existingReview = getReviewByBooking(booking);
        if (existingReview) {
            return res.status(400).json({
                message: "Review already exists for this booking"
            });
        }

        const review = createReviewModel({
            booking,
            user,
            technician,
            rating,
            comment,
            images,
            wouldRecommend,
            isAnonymous
        });

        // Update technician's average rating
        updateTechnicianRating(technician);

        res.status(201).json({
            message: "Review created successfully",
            review
        });
    } catch (error) {
        console.error("Create Review Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update technician rating helper function
const updateTechnicianRating = (technicianId) => {
    try {
        const reviews = getAllReviewsByTechnician(technicianId);
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating?.overall || 0), 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        updateTechnician(technicianId, {
            rating_average: averageRating,
            rating_count: reviews.length
        });
    } catch (error) {
        console.error("Update Technician Rating Error:", error);
    }
};

// Get reviews for technician
export const getTechnicianReviews = async (req, res) => {
    try {
        const { technicianId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const result = getTechnicianReviewsModel(technicianId, {
            isVisible: true,
            page: Number(page),
            limit: Number(limit)
        });

        // Enrich with user data
        const enrichedReviews = result.reviews.map(r => {
            r.userData = getUserById(r.user);
            r.bookingData = getBookingById(r.booking);
            return r;
        });

        res.status(200).json({
            reviews: enrichedReviews,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            total: result.total
        });
    } catch (error) {
        console.error("Get Technician Reviews Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Technician respond to review
export const respondToReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { comment, technicianId } = req.body;

        // Owner check: verify the technician belongs to the authenticated user
        if (technicianId) {
            const tech = getTechnicianByIdModel(technicianId);
            if (!tech || tech.user !== req.user.id) {
                return res.status(403).json({ message: 'Not authorized to respond to this review' });
            }
        }

        const review = updateReview(reviewId, {
            technicianResponse_comment: comment,
            technicianResponse_respondedAt: new Date().toISOString()
        });

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.status(200).json({
            message: "Response added successfully",
            review
        });
    } catch (error) {
        console.error("Respond to Review Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
