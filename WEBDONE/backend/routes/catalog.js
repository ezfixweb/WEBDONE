/**
 * Catalog Routes
 * GET /api/catalog - Get catalog data (public)
 * PUT /api/catalog - Update catalog data (admin)
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyManager } = require('../middleware/auth');

const CATALOG_KEY = 'main';

router.get('/', async (req, res) => {
    try {
        const row = await db.getAsync('SELECT data, updated_at FROM catalog WHERE key = ?', [CATALOG_KEY]);
        if (!row) {
            return res.json({ success: true, initialized: false });
        }

        let catalog = null;
        try {
            catalog = JSON.parse(row.data);
        } catch (e) {
            return res.status(500).json({ success: false, message: 'Invalid catalog data' });
        }

        res.json({ success: true, initialized: true, catalog, updatedAt: row.updated_at });
    } catch (err) {
        console.error('Get catalog error:', err);
        res.status(500).json({ success: false, message: 'Failed to load catalog' });
    }
});

router.put('/', verifyToken, verifyManager, async (req, res) => {
    try {
        const { catalog } = req.body || {};
        if (!catalog || typeof catalog !== 'object') {
            return res.status(400).json({ success: false, message: 'Catalog payload is required' });
        }

        const data = JSON.stringify(catalog);
        await db.runAsync(
            `INSERT INTO catalog (key, data, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
            [CATALOG_KEY, data]
        );

        res.json({ success: true, message: 'Catalog updated' });
    } catch (err) {
        console.error('Update catalog error:', err);
        res.status(500).json({ success: false, message: 'Failed to update catalog' });
    }
});

module.exports = router;
