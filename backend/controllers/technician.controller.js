import { createTechnician as createTechnicianModel, getTechnicianById as getTechnicianByIdModel, getTechnicianByUserId, getAllTechnicians as getAllTechniciansModel, searchTechnicians as searchTechniciansModel, updateTechnician, deleteTechnician as deleteTechnicianModel, addTechnicianService, addTechnicianAvailability, addTechnicianServiceArea, addTechnicianCertification, clearTechnicianServices, clearTechnicianAvailability, clearTechnicianServiceAreas, clearTechnicianCertifications } from "../models/technician.model.js";
import { getUserById, searchUsersByName } from "../models/user.model.js";
import { getBookingsForTechnician } from "../models/booking.model.js";
import { getServiceById, getServiceByName } from "../models/service.model.js";

// Create technician profile
export const createTechnician = async (req, res) => {
    try {
        const {
            user,
            services,
            experience,
            hourlyRate,
            availability,
            serviceArea,
            certifications
        } = req.body;

        // Check if user exists and is a technician
        const existingUser = getUserById(user);
        if (!existingUser || existingUser.role !== 'technician') {
            return res.status(400).json({
                message: "Invalid user or user is not a technician"
            });
        }

        const technician = createTechnicianModel({
            userId: user,
            experience,
            hourlyRate
        });

        // Add services
        if (services && Array.isArray(services)) {
            for (const svcId of services) {
                addTechnicianService(technician.id, svcId);
            }
        }

        // Add availability
        if (availability && typeof availability === 'object') {
            for (const [day, info] of Object.entries(availability)) {
                if (info) {
                    addTechnicianAvailability(technician.id, day, info.start, info.end, info.available);
                }
            }
        }

        // Add service areas
        if (serviceArea && Array.isArray(serviceArea)) {
            for (const area of serviceArea) {
                if (area.city) {
                    if (area.areas && Array.isArray(area.areas)) {
                        for (const a of area.areas) {
                            addTechnicianServiceArea(technician.id, area.city, a);
                        }
                    } else {
                        addTechnicianServiceArea(technician.id, area.city, '');
                    }
                }
            }
        }

        // Add certifications
        if (certifications && Array.isArray(certifications)) {
            for (const cert of certifications) {
                addTechnicianCertification(technician.id, cert);
            }
        }

        // Re-fetch to get all related data
        const fullTechnician = getTechnicianByIdModel(technician.id);

        res.status(201).json({
            message: "Technician profile created successfully",
            technician: fullTechnician
        });
    } catch (error) {
        console.error("Create Technician Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Search technicians
export const searchTechnicians = async (req, res) => {
    try {
        const {
            service,
            location,
            minRating,
            maxRate,
            availability,
            page = 1,
            limit = 10
        } = req.query;

        const result = searchTechniciansModel({
            service,
            city: location,
            minRating,
            maxRate,
            page: Number(page),
            limit: Number(limit)
        });

        // Enrich technicians with user data
        const enrichedTechnicians = result.technicians.map(tech => {
            tech.userData = getUserById(tech.user);
            return tech;
        });

        res.status(200).json({
            technicians: enrichedTechnicians,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            total: result.total
        });
    } catch (error) {
        console.error("Search Technicians Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get technician by ID
export const getTechnicianById = async (req, res) => {
    try {
        const technician = getTechnicianByIdModel(req.params.id);

        if (!technician) {
            return res.status(404).json({ message: "Technician not found" });
        }

        // Enrich with user data
        technician.userData = getUserById(technician.user);

        res.status(200).json(technician);
    } catch (error) {
        console.error("Get Technician Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get technician dashboard data
export const getTechnicianDashboard = async (req, res) => {
    try {
        const { technicianId } = req.params;

        const technician = getTechnicianByIdModel(technicianId);

        if (!technician) {
            return res.status(404).json({ message: "Technician not found" });
        }

        technician.userData = getUserById(technician.user);

        // Get pending bookings for this technician
        const pendingBookings = getBookingsForTechnician(technicianId, 'pending');

        // Enrich pending bookings with user and service data
        const enrichedPendingBookings = pendingBookings.map(b => {
            b.userData = getUserById(b.user);
            b.serviceData = getServiceById(b.service);
            return b;
        });

        const dashboard = {
            technician,
            pendingBookings: enrichedPendingBookings,
            totalJobs: technician.totalJobs,
            rating: technician.rating,
            isAvailable: technician.isAvailable
        };

        res.status(200).json(dashboard);
    } catch (error) {
        console.error("Get Technician Dashboard Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Accept/Reject booking
export const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, technicianId } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const { getBookingById: getBooking, updateBooking } = await import("../models/booking.model.js");
        const booking = getBooking(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Verify this technician is assigned to the booking
        if (booking.technician && booking.technician.toString() !== technicianId.toString()) {
            return res.status(403).json({ message: "Not authorized for this booking" });
        }

        const updatedBooking = updateBooking(bookingId, { status });

        // Enrich response
        updatedBooking.userData = getUserById(updatedBooking.user);
        updatedBooking.serviceData = getServiceById(updatedBooking.service);

        res.status(200).json({
            message: `Booking ${status} successfully`,
            booking: updatedBooking
        });
    } catch (error) {
        console.error("Update Booking Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all technicians with enriched user data (from TechnicianRoutes.js)
export const getAllTechniciansListing = async (req, res) => {
    try {
        const technicians = getAllTechniciansModel();

        // Enrich with user data
        const enrichedTechnicians = technicians.map(tech => {
            tech.userData = getUserById(tech.user);
            return tech;
        });

        res.json(enrichedTechnicians);
    } catch (error) {
        console.error('Error fetching technicians:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete technician (from TechnicianRoutes.js)
export const deleteTechnicianById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^\d+$/.test(id)) {
            return res.status(400).json({ message: 'Invalid technician ID format' });
        }

        const result = deleteTechnicianModel(id);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        res.json({ message: 'Technician deleted successfully' });
    } catch (error) {
        console.error('Error deleting technician:', error);
        res.status(500).json({
            message: 'Server error while deleting technician',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Search technicians by POST body (from TechnicianRoutes.js)
export const searchTechniciansByPost = async (req, res) => {
    try {
        const { name, services, minRating, city, area, experience } = req.body;

        // If filtering by service name (string), look up the service ID
        let serviceId = null;
        if (services) {
            if (/^\d+$/.test(services)) {
                serviceId = Number(services);
            } else {
                const service = getServiceByName(services);
                if (service) {
                    serviceId = service.id;
                } else {
                    return res.json([]);
                }
            }
        }

        // Use searchTechnicians for filtering
        const result = searchTechniciansModel({
            service: serviceId,
            city,
            area,
            minRating,
            minExperience: experience,
            page: 1,
            limit: 1000
        });

        let technicians = result.technicians;

        // Enrich with user data
        technicians = technicians.map(tech => {
            tech.userData = getUserById(tech.user);
            return tech;
        });

        // Apply name filter (search by user name)
        if (name) {
            const nameRegex = new RegExp(name, 'i');
            technicians = technicians.filter(tech =>
                tech.userData && nameRegex.test(tech.userData.name)
            );
        }

        res.json(technicians);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create or update technician profile (from TechnicianRoutes.js - more complete version)
export const createOrUpdateTechnician = async (req, res) => {
    try {
        const {
            userId,
            services,
            experience,
            hourlyRate,
            availability,
            serviceArea,
            certifications
        } = req.body;

        // Validate required fields
        if (!userId || !services || !experience || !hourlyRate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists and is a technician
        const user = getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'technician') {
            return res.status(400).json({ message: 'User is not a technician' });
        }

        // Check if technician profile already exists
        let technician = getTechnicianByUserId(userId);

        if (technician) {
            // Update existing technician
            updateTechnician(technician.id, { experience, hourlyRate });

            // Replace services
            clearTechnicianServices(technician.id);
            if (services && Array.isArray(services)) {
                for (const svcId of services) {
                    addTechnicianService(technician.id, svcId);
                }
            }

            // Replace availability
            if (availability && typeof availability === 'object') {
                clearTechnicianAvailability(technician.id);
                for (const [day, info] of Object.entries(availability)) {
                    if (info) {
                        addTechnicianAvailability(technician.id, day, info.start, info.end, info.available);
                    }
                }
            }

            // Replace service areas
            if (serviceArea && Array.isArray(serviceArea)) {
                clearTechnicianServiceAreas(technician.id);
                for (const areaObj of serviceArea) {
                    if (areaObj.city) {
                        if (areaObj.areas && Array.isArray(areaObj.areas)) {
                            for (const a of areaObj.areas) {
                                addTechnicianServiceArea(technician.id, areaObj.city, a);
                            }
                        } else {
                            addTechnicianServiceArea(technician.id, areaObj.city, '');
                        }
                    }
                }
            }

            // Replace certifications
            if (certifications && Array.isArray(certifications)) {
                clearTechnicianCertifications(technician.id);
                for (const cert of certifications) {
                    addTechnicianCertification(technician.id, cert);
                }
            }

            // Re-fetch full technician data
            technician = getTechnicianByUserId(userId);
        } else {
            // Create new technician
            technician = createTechnicianModel({ userId, experience, hourlyRate });

            // Add services
            if (services && Array.isArray(services)) {
                for (const svcId of services) {
                    addTechnicianService(technician.id, svcId);
                }
            }

            // Add availability
            if (availability && typeof availability === 'object') {
                for (const [day, info] of Object.entries(availability)) {
                    if (info) {
                        addTechnicianAvailability(technician.id, day, info.start, info.end, info.available);
                    }
                }
            }

            // Add service areas
            if (serviceArea && Array.isArray(serviceArea)) {
                for (const areaObj of serviceArea) {
                    if (areaObj.city) {
                        if (areaObj.areas && Array.isArray(areaObj.areas)) {
                            for (const a of areaObj.areas) {
                                addTechnicianServiceArea(technician.id, areaObj.city, a);
                            }
                        } else {
                            addTechnicianServiceArea(technician.id, areaObj.city, '');
                        }
                    }
                }
            }

            // Add certifications
            if (certifications && Array.isArray(certifications)) {
                for (const cert of certifications) {
                    addTechnicianCertification(technician.id, cert);
                }
            }

            // Re-fetch to get all related data
            technician = getTechnicianByUserId(userId);
        }

        res.status(201).json(technician);
    } catch (error) {
        console.error('Error saving technician profile:', error.message, error.stack);
        res.status(500).json({
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
