/**
 * Services Routes
 * GET /api/services - Get all available services/repairs
 * GET /api/services/:deviceType - Get repairs for specific device type
 */

const express = require('express');
const router = express.Router();

/**
 * Services data structure
 * Contains all available device types and their repair options
 */
const servicesData = {
    'Phone': {
        type: 'Phone',
        icon: '📱',
        repairs: [
            { name: 'Screen Repair/Replacement', price: 150 },
            { name: 'Battery Replacement', price: 80 },
            { name: 'Charging Port Repair', price: 60 },
            { name: 'Water Damage Repair', price: 120 },
            { name: 'Speaker Repair', price: 70 },
            { name: 'Microphone Repair', price: 50 },
            { name: 'Software Update/Troubleshooting', price: 40 }
        ]
    },
    'Laptop': {
        type: 'Laptop',
        icon: '💻',
        repairs: [
            { name: 'Hard Drive/SSD Replacement', price: 200 },
            { name: 'Battery Replacement', price: 120 },
            { name: 'Screen Replacement', price: 250 },
            { name: 'Keyboard Replacement', price: 100 },
            { name: 'RAM Upgrade', price: 150 },
            { name: 'Cooling Fan Replacement', price: 80 },
            { name: 'Software Installation/Update', price: 60 }
        ]
    },
    'Tablet': {
        type: 'Tablet',
        icon: '📲',
        repairs: [
            { name: 'Screen Replacement', price: 180 },
            { name: 'Battery Replacement', price: 100 },
            { name: 'Charging Port Repair', price: 60 },
            { name: 'Camera Repair', price: 90 },
            { name: 'Water Damage Repair', price: 110 },
            { name: 'Software Troubleshooting', price: 45 }
        ]
    },
    'Desktop': {
        type: 'Desktop',
        icon: '🖥️',
        repairs: [
            { name: 'Hard Drive Replacement', price: 150 },
            { name: 'RAM Upgrade', price: 120 },
            { name: 'Graphics Card Replacement', price: 300 },
            { name: 'Power Supply Replacement', price: 180 },
            { name: 'Motherboard Repair/Replacement', price: 250 },
            { name: 'CPU Upgrade', price: 200 },
            { name: 'Case/Cooling Upgrade', price: 100 }
        ]
    },
    '3D Printer': {
        type: '3D Printer',
        icon: '🖨️',
        repairs: [
            { name: 'Nozzle Cleaning/Replacement', price: 50 },
            { name: 'Bed Leveling/Calibration', price: 40 },
            { name: 'Extruder Repair', price: 100 },
            { name: 'Firmware Update/Troubleshooting', price: 60 },
            { name: 'Power Supply Replacement', price: 120 },
            { name: 'Build Platform Replacement', price: 150 },
            { name: 'Full Maintenance Service', price: 80 }
        ]
    }
};

/**
 * Get all available services
 * GET /api/services
 */
router.get('/', (req, res) => {
    try {
        const services = Object.values(servicesData).map(service => ({
            type: service.type,
            icon: service.icon,
            repairCount: service.repairs.length,
            priceRange: {
                min: Math.min(...service.repairs.map(r => r.price)),
                max: Math.max(...service.repairs.map(r => r.price))
            }
        }));

        res.json({
            success: true,
            services
        });
    } catch (err) {
        console.error('Get services error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get services', 
            error: err.message 
        });
    }
});

/**
 * Get repairs for a specific device type
 * GET /api/services/:deviceType
 */
router.get('/:deviceType', (req, res) => {
    try {
        const { deviceType } = req.params;
        
        // Normalize device type
        const normalizedType = Object.keys(servicesData).find(
            key => key.toLowerCase() === deviceType.toLowerCase()
        );

        if (!normalizedType) {
            return res.status(404).json({ 
                success: false, 
                message: 'Device type not found' 
            });
        }

        const service = servicesData[normalizedType];

        res.json({
            success: true,
            service: {
                type: service.type,
                icon: service.icon,
                repairs: service.repairs
            }
        });
    } catch (err) {
        console.error('Get device repairs error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get device repairs', 
            error: err.message 
        });
    }
});

module.exports = router;
