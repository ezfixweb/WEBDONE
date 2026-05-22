/**
 * Catalog Routes
 * GET /api/catalog - Get catalog data (public)
 * PUT /api/catalog - Update catalog data (admin)
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyManager } = require('../middleware/auth');

const CATALOG_KEY = 'main';
const localCatalogBackupDir = process.env.LOCAL_CATALOG_BACKUP_DIR
    ? path.resolve(process.env.LOCAL_CATALOG_BACKUP_DIR)
    : null;
const backupToken = process.env.CATALOG_BACKUP_TOKEN ? String(process.env.CATALOG_BACKUP_TOKEN).trim() : null;

function ensureBackupDir() {
    if (!localCatalogBackupDir) return false;
    if (!fs.existsSync(localCatalogBackupDir)) {
        fs.mkdirSync(localCatalogBackupDir, { recursive: true });
    }
    return true;
}

function writeCatalogBackupFiles(catalog, suffix = 'mobile') {
    if (!ensureBackupDir()) return null;

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `catalog-backup-${suffix}-${timestamp}.json`;
    const latestFile = 'catalog-latest.json';

    const content = JSON.stringify(catalog, null, 2);
    const backupPath = path.join(localCatalogBackupDir, filename);
    const latestPath = path.join(localCatalogBackupDir, latestFile);

    fs.writeFileSync(backupPath, content, 'utf8');
    fs.writeFileSync(latestPath, content, 'utf8');

    return { backupPath, latestPath };
}

function isBackupAuthorized(req) {
    if (!backupToken) return true;
    const requestToken = req.header('x-ezfix-backup-token') || req.query.backupToken;
    return requestToken === backupToken;
}

function sanitizeBackupCatalog(rawCatalog) {
    const sanitized = { ...rawCatalog };
    if (Array.isArray(rawCatalog?.news)) {
        sanitized.news = sanitizeNewsArray(rawCatalog.news);
    }
    return sanitized;
}

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

        try {
            writeCatalogBackupFiles(sanitizedCatalog, 'admin');
        } catch (backupError) {
            console.error('Local catalog backup error:', backupError);
        }

        res.json({ success: true, message: 'Catalog updated', catalog: sanitizedCatalog });
    } catch (err) {
        console.error('Update catalog error:', err);
        res.status(500).json({ success: false, message: 'Failed to update catalog' });
    }
});

router.post('/backup', async (req, res) => {
    if (!isBackupAuthorized(req)) {
        return res.status(401).json({ success: false, message: 'Unauthorized backup request' });
    }

    const rawCatalog = req.body && typeof req.body.catalog === 'object' ? req.body.catalog : null;
    if (!rawCatalog) {
        return res.status(400).json({ success: false, message: 'Catalog payload is required' });
    }

    try {
        const sanitizedCatalog = sanitizeBackupCatalog(rawCatalog);
        const data = JSON.stringify(sanitizedCatalog);

        await db.runAsync(
            `INSERT INTO catalog (key, data, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP`,
            [CATALOG_KEY, data]
        );

        try {
            const source = String(req.body.source || 'mobile').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
            writeCatalogBackupFiles(sanitizedCatalog, source);
        } catch (writeError) {
            console.error('Local catalog backup error:', writeError);
        }

        res.json({ success: true, message: 'Catalog backup saved' });
    } catch (err) {
        console.error('Catalog backup error:', err);
        res.status(500).json({ success: false, message: 'Failed to save catalog backup' });
    }
});

module.exports = router;
