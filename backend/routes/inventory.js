/**
 * Inventory Routes
 * GET /api/inventory/movements - List warehouse movements
 * POST /api/inventory/movements - Add/update one warehouse movement
 * DELETE /api/inventory/movements - Clear warehouse movement history
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyOrderManager } = require('../middleware/auth');

const MAX_LIMIT = 500;

function clampLimit(rawLimit) {
    const value = Number(rawLimit);
    if (!Number.isFinite(value)) return 250;
    return Math.max(1, Math.min(MAX_LIMIT, Math.floor(value)));
}

function normalizeText(value, fallback = '') {
    return String(value || fallback).trim();
}

function normalizeMovementPayload(rawPayload = {}) {
    const id = normalizeText(rawPayload.id);
    if (!id) {
        throw new Error('Movement id is required');
    }

    const rawType = normalizeText(rawPayload.type, 'fix').toLowerCase();
    const type = rawType === 'in' || rawType === 'out' ? rawType : 'fix';
    const parsedAt = new Date(rawPayload.at || Date.now());
    const at = Number.isFinite(parsedAt.getTime()) ? parsedAt.toISOString() : new Date().toISOString();
    const beforeQty = Number.isFinite(Number(rawPayload.beforeQty)) ? Math.max(0, Math.floor(Number(rawPayload.beforeQty))) : 0;
    const afterQty = Number.isFinite(Number(rawPayload.afterQty)) ? Math.max(0, Math.floor(Number(rawPayload.afterQty))) : 0;
    const deltaQty = Number.isFinite(Number(rawPayload.deltaQty))
        ? Math.floor(Number(rawPayload.deltaQty))
        : afterQty - beforeQty;

    return {
        id,
        at,
        type,
        name: normalizeText(rawPayload.name, '-').slice(0, 220),
        sku: normalizeText(rawPayload.sku, '-').slice(0, 120),
        location: normalizeText(rawPayload.location, '-').slice(0, 220),
        beforeQty,
        afterQty,
        deltaQty,
        operator: normalizeText(rawPayload.operator, 'Neznámý operátor').slice(0, 220),
        device: normalizeText(rawPayload.device, '-').slice(0, 220),
        idRef: normalizeText(rawPayload.idRef, '').slice(0, 220)
    };
}

router.get('/movements', verifyToken, async (req, res) => {
    try {
        const limit = clampLimit(req.query.limit);
        const rows = await db.allAsync(
            `SELECT movement_id, happened_at, movement_type, item_name, item_sku, item_location,
                    before_qty, after_qty, delta_qty, operator_label, device_label, id_ref
             FROM inventory_movements
             ORDER BY happened_at DESC, created_at DESC
             LIMIT ?`,
            [limit]
        );

        const movements = rows.map((row) => ({
            id: String(row.movement_id || ''),
            at: row.happened_at,
            type: String(row.movement_type || 'fix'),
            name: String(row.item_name || '-'),
            sku: String(row.item_sku || '-'),
            location: String(row.item_location || '-'),
            beforeQty: Number.isFinite(Number(row.before_qty)) ? Math.floor(Number(row.before_qty)) : 0,
            afterQty: Number.isFinite(Number(row.after_qty)) ? Math.floor(Number(row.after_qty)) : 0,
            deltaQty: Number.isFinite(Number(row.delta_qty)) ? Math.floor(Number(row.delta_qty)) : 0,
            operator: String(row.operator_label || 'Neznámý operátor'),
            device: String(row.device_label || '-'),
            idRef: String(row.id_ref || '')
        }));

        res.json({ success: true, movements });
    } catch (err) {
        console.error('Get inventory movements error:', err);
        res.status(500).json({ success: false, message: 'Failed to load inventory movements' });
    }
});

router.post('/movements', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const movement = normalizeMovementPayload(req.body?.movement || {});
        await db.runAsync(
            `INSERT INTO inventory_movements (
                movement_id, happened_at, movement_type, item_name, item_sku, item_location,
                before_qty, after_qty, delta_qty, operator_label, device_label, id_ref,
                created_by_user_id, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(movement_id) DO UPDATE SET
                happened_at = excluded.happened_at,
                movement_type = excluded.movement_type,
                item_name = excluded.item_name,
                item_sku = excluded.item_sku,
                item_location = excluded.item_location,
                before_qty = excluded.before_qty,
                after_qty = excluded.after_qty,
                delta_qty = excluded.delta_qty,
                operator_label = excluded.operator_label,
                device_label = excluded.device_label,
                id_ref = excluded.id_ref,
                created_by_user_id = excluded.created_by_user_id,
                updated_at = CURRENT_TIMESTAMP`,
            [
                movement.id,
                movement.at,
                movement.type,
                movement.name,
                movement.sku,
                movement.location,
                movement.beforeQty,
                movement.afterQty,
                movement.deltaQty,
                movement.operator,
                movement.device,
                movement.idRef,
                req.user.id
            ]
        );

        res.json({ success: true, movement });
    } catch (err) {
        const status = /required/i.test(String(err.message || '')) ? 400 : 500;
        if (status === 500) {
            console.error('Save inventory movement error:', err);
        }
        res.status(status).json({
            success: false,
            message: status === 400 ? err.message : 'Failed to save inventory movement'
        });
    }
});

router.delete('/movements', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        await db.runAsync('DELETE FROM inventory_movements');
        res.json({ success: true, message: 'Inventory movements cleared' });
    } catch (err) {
        console.error('Clear inventory movements error:', err);
        res.status(500).json({ success: false, message: 'Failed to clear inventory movements' });
    }
});

module.exports = router;