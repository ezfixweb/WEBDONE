/**
 * Custom PC Builds Routes
 * GET /api/builds - Get user's saved PC builds
 * POST /api/builds - Save a new PC build
 * GET /api/builds/:buildId - Get specific build
 * PATCH /api/builds/:buildId - Update build
 * DELETE /api/builds/:buildId - Delete build
 * GET /api/parts - Get available PC components
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

/**
 * PC components library
 * Organized by category with typical price ranges
 */
const pcComponents = {
    cpu: [
        { id: 'cpu_1', name: 'Intel Core i5-13600K', price: 290, specs: '13th Gen, 14 cores' },
        { id: 'cpu_2', name: 'Intel Core i7-13700K', price: 420, specs: '13th Gen, 16 cores' },
        { id: 'cpu_3', name: 'Intel Core i9-13900K', price: 590, specs: '13th Gen, 24 cores' },
        { id: 'cpu_4', name: 'AMD Ryzen 5 7600X', price: 270, specs: '7000 Series, 6 cores' },
        { id: 'cpu_5', name: 'AMD Ryzen 7 7700X', price: 380, specs: '7000 Series, 8 cores' },
        { id: 'cpu_6', name: 'AMD Ryzen 9 7950X', price: 550, specs: '7000 Series, 16 cores' }
    ],
    motherboard: [
        { id: 'mb_1', name: 'ASUS ROG STRIX Z790-E', price: 350, specs: 'Intel Z790, ATX' },
        { id: 'mb_2', name: 'MSI MPG B760 CARBON', price: 280, specs: 'Intel B760, ATX' },
        { id: 'mb_3', name: 'ASUS ROG STRIX X870-E', price: 400, specs: 'AMD X870, ATX' },
        { id: 'mb_4', name: 'MSI MPG B850 EDGE', price: 320, specs: 'AMD B850, ATX' },
        { id: 'mb_5', name: 'Gigabyte Z790 AORUS', price: 340, specs: 'Intel Z790, ATX' }
    ],
    gpu: [
        { id: 'gpu_1', name: 'NVIDIA RTX 4060 Ti', price: 450, specs: '8GB GDDR6' },
        { id: 'gpu_2', name: 'NVIDIA RTX 4070 Super', price: 620, specs: '12GB GDDR6X' },
        { id: 'gpu_3', name: 'NVIDIA RTX 4080 Super', price: 990, specs: '16GB GDDR6X' },
        { id: 'gpu_4', name: 'AMD Radeon RX 7600', price: 200, specs: '16GB GDDR6' },
        { id: 'gpu_5', name: 'AMD Radeon RX 7700 XT', price: 380, specs: '12GB GDDR6' },
        { id: 'gpu_6', name: 'AMD Radeon RX 7900 XTX', price: 750, specs: '24GB GDDR6' }
    ],
    ram: [
        { id: 'ram_1', name: 'Corsair Vengeance 16GB DDR5', price: 90, specs: '5600MHz, CAS 36' },
        { id: 'ram_2', name: 'G.Skill Trident Z5 32GB', price: 150, specs: '6000MHz, CAS 30' },
        { id: 'ram_3', name: 'Kingston FURY Beast 32GB', price: 130, specs: '5600MHz, CAS 36' },
        { id: 'ram_4', name: 'Corsair Dominator Platinum 64GB', price: 350, specs: '6400MHz' },
        { id: 'ram_5', name: 'Kingston FURY Renegade 16GB', price: 85, specs: '6000MHz, CAS 28' }
    ],
    storage: [
        { id: 'ssd_1', name: 'Samsung 990 PRO 1TB', price: 130, specs: 'NVMe, 7450 MB/s' },
        { id: 'ssd_2', name: 'WD Black SN850X 2TB', price: 180, specs: 'NVMe, 7100 MB/s' },
        { id: 'ssd_3', name: 'Corsair MP600 CORE XT 4TB', price: 250, specs: 'NVMe, 4950 MB/s' },
        { id: 'ssd_4', name: 'Kingston NV2 1TB', price: 70, specs: 'NVMe, 3500 MB/s' },
        { id: 'ssd_5', name: 'Sabrent Rocket 4 Plus 2TB', price: 140, specs: 'NVMe, 7000 MB/s' }
    ],
    psu: [
        { id: 'psu_1', name: 'Corsair RM1000e 1000W', price: 180, specs: '80+ Gold, Modular' },
        { id: 'psu_2', name: 'EVGA SuperNOVA 850W', price: 130, specs: '80+ Gold, Modular' },
        { id: 'psu_3', name: 'Seasonic PRIME PX-1000W', price: 210, specs: '80+ Platinum' },
        { id: 'psu_4', name: 'MSI MPG A1000G PCIE5', price: 200, specs: '80+ Gold, PCIe 5' },
        { id: 'psu_5', name: 'be quiet! DARK POWER PRO 1000W', price: 190, specs: '80+ Platinum' }
    ],
    case: [
        { id: 'case_1', name: 'NZXT H7 Flow RGB', price: 160, specs: 'Mid Tower, Tempered Glass' },
        { id: 'case_2', name: 'Corsair Crystal Series 680X', price: 200, specs: 'Mid Tower, Dual TG' },
        { id: 'case_3', name: 'Lian Li LANCOOL 3', price: 120, specs: 'Mid Tower, Mesh' },
        { id: 'case_4', name: 'Fractal Design Torrent', price: 240, specs: 'Mid Tower, Airflow' },
        { id: 'case_5', name: 'Corsair 5000T RGB', price: 360, specs: 'Full Tower, Premium' }
    ],
    cooling: [
        { id: 'cool_1', name: 'Noctua NH-D15', price: 110, specs: 'Air Cooler, 250W' },
        { id: 'cool_2', name: 'Corsair H150i Elite Capellix', price: 190, specs: '360mm AIO' },
        { id: 'cool_3', name: 'NZXT Kraken X73', price: 210, specs: '360mm AIO, LCD' },
        { id: 'cool_4', name: 'be quiet! Dark Rock Pro 4', price: 90, specs: 'Air Cooler, 250W' },
        { id: 'cool_5', name: 'Lian Li Galahad 240 UNI', price: 140, specs: '240mm AIO' }
    ]
};

/**
 * Get available PC components
 * GET /api/builds/parts
 */
router.get('/parts', (req, res) => {
    try {
        res.json({
            success: true,
            components: pcComponents
        });
    } catch (err) {
        console.error('Get parts error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get components', 
            error: err.message 
        });
    }
});

/**
 * Get user's saved PC builds
 * GET /api/builds
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const builds = await db.allAsync(
            'SELECT * FROM custom_builds WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        const parsedBuilds = builds.map(build => ({
            id: build.id,
            name: build.name,
            description: build.description,
            parts: JSON.parse(build.parts_json),
            totalPrice: build.total_price,
            createdAt: build.created_at,
            updatedAt: build.updated_at
        }));

        res.json({
            success: true,
            builds: parsedBuilds
        });
    } catch (err) {
        console.error('Get builds error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get builds', 
            error: err.message 
        });
    }
});

/**
 * Get specific build
 * GET /api/builds/:buildId
 */
router.get('/:buildId', verifyToken, async (req, res) => {
    try {
        const { buildId } = req.params;

        const build = await db.getAsync(
            'SELECT * FROM custom_builds WHERE id = ? AND user_id = ?',
            [buildId, req.user.id]
        );

        if (!build) {
            return res.status(404).json({ 
                success: false, 
                message: 'Build not found' 
            });
        }

        res.json({
            success: true,
            build: {
                id: build.id,
                name: build.name,
                description: build.description,
                parts: JSON.parse(build.parts_json),
                totalPrice: build.total_price,
                createdAt: build.created_at,
                updatedAt: build.updated_at
            }
        });
    } catch (err) {
        console.error('Get build error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get build', 
            error: err.message 
        });
    }
});

/**
 * Save a new PC build
 * POST /api/builds
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, parts } = req.body;

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Build name is required' 
            });
        }

        if (!parts || typeof parts !== 'object' || Object.keys(parts).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one component must be selected' 
            });
        }

        // Calculate total price
        let totalPrice = 0;
        for (const [category, componentId] of Object.entries(parts)) {
            if (componentId && pcComponents[category]) {
                const component = pcComponents[category].find(c => c.id === componentId);
                if (component) {
                    totalPrice += component.price;
                }
            }
        }

        const result = await db.runAsync(
            'INSERT INTO custom_builds (user_id, name, description, parts_json, total_price) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, name, description || null, JSON.stringify(parts), totalPrice]
        );

        res.status(201).json({
            success: true,
            message: 'Build saved successfully',
            build: {
                id: result.lastID,
                name,
                description,
                parts,
                totalPrice
            }
        });
    } catch (err) {
        console.error('Create build error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save build', 
            error: err.message 
        });
    }
});

/**
 * Update build
 * PATCH /api/builds/:buildId
 */
router.patch('/:buildId', verifyToken, async (req, res) => {
    try {
        const { buildId } = req.params;
        const { name, description, parts } = req.body;

        const build = await db.getAsync(
            'SELECT * FROM custom_builds WHERE id = ? AND user_id = ?',
            [buildId, req.user.id]
        );

        if (!build) {
            return res.status(404).json({ 
                success: false, 
                message: 'Build not found' 
            });
        }

        const updatedParts = parts || JSON.parse(build.parts_json);
        let totalPrice = 0;

        for (const [category, componentId] of Object.entries(updatedParts)) {
            if (componentId && pcComponents[category]) {
                const component = pcComponents[category].find(c => c.id === componentId);
                if (component) {
                    totalPrice += component.price;
                }
            }
        }

        await db.runAsync(
            'UPDATE custom_builds SET name = ?, description = ?, parts_json = ?, total_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name || build.name, description !== undefined ? description : build.description, JSON.stringify(updatedParts), totalPrice, buildId]
        );

        res.json({
            success: true,
            message: 'Build updated successfully',
            build: {
                id: buildId,
                name: name || build.name,
                description: description !== undefined ? description : build.description,
                parts: updatedParts,
                totalPrice
            }
        });
    } catch (err) {
        console.error('Update build error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update build', 
            error: err.message 
        });
    }
});

/**
 * Delete build
 * DELETE /api/builds/:buildId
 */
router.delete('/:buildId', verifyToken, async (req, res) => {
    try {
        const { buildId } = req.params;

        const result = await db.runAsync(
            'DELETE FROM custom_builds WHERE id = ? AND user_id = ?',
            [buildId, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Build not found' 
            });
        }

        res.json({
            success: true,
            message: 'Build deleted successfully'
        });
    } catch (err) {
        console.error('Delete build error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete build', 
            error: err.message 
        });
    }
});

module.exports = router;
