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

function sanitizeRichHtml(value, maxLength = 12000) {
    const raw = String(value || '').slice(0, maxLength);
    return raw
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--([\s\S]*?)-->/g, '')
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/<\/?(?!p\b|br\b|strong\b|b\b|em\b|i\b|u\b|s\b|strike\b|ul\b|ol\b|li\b|a\b)[^>]*>/gi, '');
}

function sanitizeNewsArray(news) {
    if (!Array.isArray(news)) return [];

    return news.slice(0, 100).map((item, index) => {
        const source = item && typeof item === 'object' ? item : {};
        const fallbackId = `news-${Date.now()}-${index}`;
        const id = String(source.id || fallbackId)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 80) || fallbackId;

        const title = String(source.title || '')
            .trim()
            .slice(0, 180) || `News ${index + 1}`;

        const image = String(source.image || '').trim().slice(0, 1200);
        const safeImage = /^https?:\/\//i.test(image) ? image : '';

        const summary = sanitizeRichHtml(source.summary || '', 6000);
        const content = sanitizeRichHtml(source.content || '', 20000);

        const publishedAtRaw = String(source.publishedAt || '').trim();
        const publishedAtTs = publishedAtRaw ? new Date(publishedAtRaw).getTime() : NaN;
        const publishedAt = Number.isFinite(publishedAtTs) ? new Date(publishedAtTs).toISOString() : null;

        const sortOrderNumber = Number(source.sortOrder);
        const sortOrder = Number.isFinite(sortOrderNumber)
            ? Math.max(0, Math.floor(sortOrderNumber))
            : index;

        return {
            id,
            title,
            image: safeImage,
            summary,
            content,
            active: source.active !== false,
            publishedAt,
            sortOrder
        };
    });
}

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

        const sanitizedCatalog = {
            ...catalog,
            news: sanitizeNewsArray(catalog.news)
        };

        const data = JSON.stringify(sanitizedCatalog);
        await db.runAsync(
            `INSERT INTO catalog (key, data, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
            [CATALOG_KEY, data]
        );

        res.json({ success: true, message: 'Catalog updated', catalog: sanitizedCatalog });
    } catch (err) {
        console.error('Update catalog error:', err);
        res.status(500).json({ success: false, message: 'Failed to update catalog' });
    }
});

module.exports = router;
