import { createService as createServiceModel, getServiceById as getServiceByIdModel, getAllServices as getAllServicesModel, updateService as updateServiceModel, deleteService as deleteServiceModel, getDistinctCategories } from "../models/service.model.js";

// Create a new service
export const createService = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            estimatedPrice,
            estimatedDuration,
            image
        } = req.body;

        const service = createServiceModel({
            name,
            category,
            description,
            estimatedPrice,
            estimatedDuration,
            image
        });

        res.status(201).json({
            message: "Service created successfully",
            service
        });
    } catch (error) {
        console.error("Create Service Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all services (Browse Repair Services)
export const getAllServices = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;

        const result = getAllServicesModel({
            category,
            search,
            isActive: true,
            page: Number(page),
            limit: Number(limit)
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Get All Services Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get service by ID
export const getServiceById = async (req, res) => {
    try {
        const service = getServiceByIdModel(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json(service);
    } catch (error) {
        console.error("Get Service Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get service categories
export const getServiceCategories = async (req, res) => {
    try {
        const categories = getDistinctCategories();
        res.status(200).json(categories);
    } catch (error) {
        console.error("Get Categories Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update service
export const updateService = async (req, res) => {
    try {
        const fields = {};
        const { name, category, description, estimatedPrice, estimatedDuration, image, isActive } = req.body;
        if (name !== undefined) fields.name = name;
        if (category !== undefined) fields.category = category;
        if (description !== undefined) fields.description = description;
        if (image !== undefined) fields.image = image;
        if (isActive !== undefined) fields.isActive = isActive;
        if (estimatedPrice?.min !== undefined) fields.estimatedPrice_min = estimatedPrice.min;
        if (estimatedPrice?.max !== undefined) fields.estimatedPrice_max = estimatedPrice.max;
        if (estimatedDuration !== undefined) fields.estimatedDuration = estimatedDuration;

        const updatedService = updateServiceModel(req.params.id, fields);
        if (!updatedService) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.status(200).json(updatedService);
    } catch (error) {
        console.error("Update Service Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete service by ID
export const deleteService = async (req, res) => {
    try {
        const existing = getServiceByIdModel(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Service not found" });
        }

        deleteServiceModel(req.params.id);
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("Delete Service Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
