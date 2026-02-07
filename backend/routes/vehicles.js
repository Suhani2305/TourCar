const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/vehicles
// @desc    Get all vehicles
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { search, status, type, createdBy } = req.query;

        // Build query
        let query = {};

        // Role-based filtering: normal users see only their vehicles
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        } else if (createdBy) {
            // Super admin can filter by specific user
            query.createdBy = createdBy;
        }

        if (search) {
            query.$or = [
                { vehicleNumber: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.status = status;
        }

        if (type) {
            query.type = type;
        }

        const vehicles = await Vehicle.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles
        });
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicles',
            error: error.message
        });
    }
});

// @route   GET /api/vehicles/:id
// @desc    Get single vehicle
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        res.status(200).json({
            success: true,
            vehicle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle'
        });
    }
});

// @route   POST /api/vehicles
// @desc    Create new vehicle
// @access  Private (Admin/SuperAdmin)
router.post('/', protect, async (req, res) => {
    try {
        const { vehicleNumber, type, brand, model, capacity, color, year, notes } = req.body;

        // Check if vehicle number already exists
        const existingVehicle = await Vehicle.findOne({
            vehicleNumber: vehicleNumber.toUpperCase()
        });

        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle with this number already exists'
            });
        }

        const vehicle = await Vehicle.create({
            vehicleNumber: vehicleNumber.toUpperCase(),
            type,
            brand,
            model,
            capacity,
            color,
            year,
            notes,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Vehicle created successfully',
            vehicle
        });
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating vehicle',
            error: error.message
        });
    }
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (Admin/SuperAdmin)
router.put('/:id', protect, async (req, res) => {
    try {
        let vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // If vehicle number is being updated, check for duplicates
        if (req.body.vehicleNumber && req.body.vehicleNumber !== vehicle.vehicleNumber) {
            const existingVehicle = await Vehicle.findOne({
                vehicleNumber: req.body.vehicleNumber.toUpperCase(),
                _id: { $ne: req.params.id }
            });

            if (existingVehicle) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle with this number already exists'
                });
            }
        }

        // Update vehicle
        vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Vehicle updated successfully',
            vehicle
        });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating vehicle',
            error: error.message
        });
    }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (Admin/SuperAdmin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        await vehicle.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting vehicle'
        });
    }
});

// @route   GET /api/vehicles/stats/summary
// @desc    Get vehicle statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
    try {
        const total = await Vehicle.countDocuments();
        const active = await Vehicle.countDocuments({ status: 'active' });
        const inactive = await Vehicle.countDocuments({ status: 'inactive' });

        res.status(200).json({
            success: true,
            stats: {
                total,
                active,
                inactive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router;
