/**
 * Cart Routes
 * GET /api/cart - Get user cart
 * POST /api/cart - Add item to cart
 * DELETE /api/cart/:itemId - Remove item from cart
 * DELETE /api/cart - Clear entire cart
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

/**
 * Get user's cart items
 * GET /api/cart
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const cartItems = await db.allAsync(
            `SELECT id, device, device_name, brand, brand_name, model, 
                    repair_type, repair_name, repair_desc, price, printer, filament, color, parts, file_name, added_at 
             FROM cart_items 
             WHERE user_id = ? 
             ORDER BY added_at DESC`,
            [req.user.id]
        );

        const total = cartItems.reduce((sum, item) => sum + item.price, 0);

        res.json({
            success: true,
            cart: cartItems,
            total,
            itemCount: cartItems.length
        });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get cart', 
            error: err.message 
        });
    }
});

/**
 * Add item to cart
 * POST /api/cart
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            device, deviceName, brand, brandName, model,
            repairType, repairName, repairDesc, price,
            printer, filament, color, parts, fileName
        } = req.body;

        const deviceNormalized = String(device || '').toLowerCase();
        const isPrinting = deviceNormalized === 'printing' || deviceNormalized === '3d-printing';
        const priceNumber = typeof price === 'number' ? price : parseFloat(price);
        const resolvedBrand = brand || (isPrinting ? (req.body.printerName || printer || '3D Printing') : brand);
        const resolvedModel = model || (isPrinting ? (req.body.filamentName || filament || '3D Print') : model);

        // Validation
        if (!device || !repairType || !repairName || Number.isNaN(priceNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        if (!isPrinting && (!resolvedBrand || !resolvedModel)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const result = await db.runAsync(
            `INSERT INTO cart_items 
             (user_id, device, device_name, brand, brand_name, model, 
                repair_type, repair_name, repair_desc, price, printer, filament, color, parts, file_name) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [req.user.id, device, deviceName, resolvedBrand, brandName || resolvedBrand, resolvedModel,
               repairType, repairName, repairDesc, priceNumber, printer || null, filament || null, color || null, parts || null, fileName || null]
        );

        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            itemId: result.lastID
        });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add to cart', 
            error: err.message 
        });
    }
});

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
router.delete('/:itemId', verifyToken, async (req, res) => {
    try {
        const { itemId } = req.params;

        // Verify item belongs to user
        const item = await db.getAsync(
            'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
            [itemId, req.user.id]
        );

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart item not found' 
            });
        }

        await db.runAsync(
            'DELETE FROM cart_items WHERE id = ?',
            [itemId]
        );

        res.json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove from cart', 
            error: err.message 
        });
    }
});

/**
 * Clear entire cart
 * DELETE /api/cart
 */
router.delete('/', verifyToken, async (req, res) => {
    try {
        await db.runAsync(
            'DELETE FROM cart_items WHERE user_id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to clear cart', 
            error: err.message 
        });
    }
});

module.exports = router;
