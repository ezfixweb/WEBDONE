/**
 * Orders Routes
 * GET /api/orders - Get user's orders
 * POST /api/orders - Create new order
 * GET /api/orders/:orderId - Get order details
 * PATCH /api/orders/:orderId - Update order status (admin)
 * DELETE /api/orders/:orderId - Delete order (admin)
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyOrderManager, isOrderManagerRole } = require('../middleware/auth');
const { sendOrderStatusEmail, sendOrderConfirmationEmail, sendNewOrderNotificationEmail } = require('../services/email');

/**
 * Get user's orders or all orders (admin)
 * GET /api/orders
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        let orders;

        if (isOrderManagerRole(req.user.role)) {
            // Admin sees all orders
            orders = await db.allAsync(
                `SELECT o.id, o.order_number, o.customer_name, o.customer_email, 
                        o.customer_phone, o.status, o.total, o.created_at, o.updated_at,
                        COUNT(oi.id) as item_count
                 FROM orders o
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 GROUP BY o.id
                 ORDER BY o.created_at DESC`
            );
        } else {
            // Customer sees only their orders
            orders = await db.allAsync(
                `SELECT o.id, o.order_number, o.customer_name, o.status, o.total, 
                        o.created_at, COUNT(oi.id) as item_count
                 FROM orders o
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 WHERE o.user_id = ?
                 GROUP BY o.id
                 ORDER BY o.created_at DESC`,
                [req.user.id]
            );
        }

        // Calculate statistics
        let statsQuery, statsParams;
        if (isOrderManagerRole(req.user.role)) {
            statsQuery = `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status IN ('in-progress', 'waiting', 'delivering') THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completed
             FROM orders`;
            statsParams = [];
        } else {
            statsQuery = `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status IN ('in-progress', 'waiting', 'delivering') THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status IN ('completed', 'delivered') THEN 1 ELSE 0 END) as completed
             FROM orders
             WHERE user_id = ?`;
            statsParams = [req.user.id];
        }
        const stats = await db.getAsync(statsQuery, statsParams);

        res.json({
            success: true,
            orders,
            statistics: stats || { total: 0, pending: 0, in_progress: 0, completed: 0 }
        });
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get orders', 
            error: err.message 
        });
    }
});

/**
 * Track order by order number and email (public)
 * POST /api/orders/track
 */
router.post('/track', async (req, res) => {
    try {
        const { orderNumber, email } = req.body || {};

        if (!orderNumber || !email) {
            return res.status(400).json({
                success: false,
                message: 'Order number and email are required'
            });
        }

        const normalizedOrderNumber = String(orderNumber).trim().replace(/^#/, '');

        const order = await db.getAsync(
            `SELECT id, order_number, customer_name, customer_email, customer_phone,
                    customer_address, customer_city, customer_zip, service_type, delivery_fee, packeta_point_json, country,
                    status, total, created_at, updated_at
             FROM orders
             WHERE UPPER(order_number) = UPPER(?) AND LOWER(customer_email) = LOWER(?)`,
            [normalizedOrderNumber, email]
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const items = await db.allAsync(
            `SELECT id, device, brand, model, repair_type, repair_name, price, printer, filament, color, parts, file_name
             FROM order_items
             WHERE order_id = ?`,
            [order.id]
        );

        res.json({
            success: true,
            order: { ...order, items }
        });
    } catch (err) {
        console.error('Track order error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to track order',
            error: err.message
        });
    }
});

/**
 * Get order details with items
 * GET /api/orders/:orderId
 */
router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const canManage = isOrderManagerRole(req.user.role);
        const order = await db.getAsync(
            canManage
                ? 'SELECT * FROM orders WHERE id = ?'
                : 'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            canManage ? [orderId] : [orderId, req.user.id]
        );

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const items = await db.allAsync(
            `SELECT id, device, brand, model, repair_type, repair_name, price, printer, filament, color, parts, file_name 
             FROM order_items 
             WHERE order_id = ?`,
            [orderId]
        );

        res.json({
            success: true,
            order: { ...order, items }
        });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get order', 
            error: err.message 
        });
    }
});

/**
 * Create new order from cart
 * POST /api/orders
 */
router.post('/', async (req, res) => {
    try {
        const {
            customerName, customerEmail, customerPhone, customerAddress, customerCity, customerZip,
            serviceType, notes, country, cartItems, deliveryFee, packetaPoint,
            paymentMethod, paymentFee
        } = req.body;

        console.log('[ORDER] POST /api/orders received:', {
            customerName, customerEmail, customerPhone, cartItemsLength: cartItems?.length, serviceType
        });

        // Validate required fields
        if (!customerName || !customerEmail || !customerPhone) {
            console.log('[ORDER] Validation failed - missing fields:', { customerName, customerEmail, customerPhone });
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required customer information',
                received: { customerName, customerEmail, customerPhone }
            });
        }

        // Validate cartItems is array and not empty
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cart is empty or invalid' 
            });
        }

        // Validate serviceType
        if (!serviceType || !['delivery', 'pickup', 'zasilkovna', 'ceska-posta', 'ppl', 'dpd', 'gls'].includes(serviceType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service type'
            });
        }

        if (serviceType === 'zasilkovna' && !packetaPoint) {
            return res.status(400).json({
                success: false,
                message: 'Pickup point is required'
            });
        }

        // Calculate total
        let total = cartItems.reduce((sum, item) => {
            const priceNumber = typeof item.price === 'number'
                ? item.price
                : parseFloat(item.price);
            if (Number.isNaN(priceNumber)) {
                throw new Error('Invalid item price');
            }
            return sum + priceNumber;
        }, 0);
        
        const parsedDeliveryFee = typeof deliveryFee === 'number'
            ? deliveryFee
            : parseFloat(deliveryFee || 0);
        const safeDeliveryFee = Number.isNaN(parsedDeliveryFee) ? 0 : Math.max(0, parsedDeliveryFee);

        const parsedPaymentFee = typeof paymentFee === 'number'
            ? paymentFee
            : parseFloat(paymentFee || 0);
        const safePaymentFee = Number.isNaN(parsedPaymentFee) ? 0 : Math.max(0, parsedPaymentFee);

        if (serviceType !== 'delivery') {
            total += safeDeliveryFee;
        }

        if (safePaymentFee > 0) {
            total += safePaymentFee;
        }

        // Generate order number
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `EZF-${Date.now()}-${randomSuffix}`;

        // Create order
        const orderResult = await db.runAsync(
            `INSERT INTO orders 
             (order_number, user_id, customer_name, customer_email, customer_phone,
                     customer_address, customer_city, customer_zip, service_type, delivery_fee, payment_method, payment_fee, payment_status, packeta_point_json, country, total, notes, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderNumber, req.user?.id || null, customerName, customerEmail, customerPhone,
                    customerAddress || 'N/A', customerCity || '', customerZip || '', serviceType, safeDeliveryFee,
                    paymentMethod || 'pay_on_delivery', safePaymentFee, 'pending',
                    packetaPoint ? JSON.stringify(packetaPoint) : null, country || 'Czech Republic', total, notes || '', 'pending']
        );

        // Add order items
        const orderItems = [];
        for (const item of cartItems) {
            const repairName = item.repair_name || item.repairName;
            const repairType = item.repair_type || item.repairType;
            const deviceNormalized = String(item.device || '').toLowerCase();
            const isPrinting = deviceNormalized === 'printing' || deviceNormalized === '3d-printing';
            const resolvedBrand = item.brand || item.brandName || (isPrinting ? (item.printerName || item.printer || '3D Printing') : 'N/A');
            const resolvedModel = item.model || (isPrinting ? (item.filamentName || item.filament || '3D Print') : 'N/A');
            
            await db.runAsync(
                `INSERT INTO order_items 
                 (order_id, device, brand, model, repair_type, repair_name, price, printer, filament, color, parts, file_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderResult.lastID, item.device, resolvedBrand, resolvedModel,
                 repairType, repairName, item.price, item.printer || null, item.filament || null, item.color || null, item.parts || null, item.fileName || item.file_name || null]
            );
            
            // Normalize item data for email
            orderItems.push({
                ...item,
                repair_name: repairName,
                repair_type: repairType
            });
        }


        // Send confirmation email to customer
        try {
            await sendOrderConfirmationEmail(
                customerEmail,
                customerName,
                orderNumber,
                orderItems,
                total,
                {
                    created_at: new Date().toISOString(),
                    service_type: serviceType,
                    delivery_fee: safeDeliveryFee,
                    packeta_point_json: packetaPoint ? JSON.stringify(packetaPoint) : null
                }
            );
            console.log(`Order confirmation email sent to ${customerEmail} for order ${orderNumber}`);
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError.message);
            // Don't fail the request if email fails, just log the error
        }

        // Send owner notification email
        try {
            const ownerEmail = process.env.OWNER_NOTIFY_EMAIL || 'djsamu.jb@gmail.com';
            await sendNewOrderNotificationEmail(
                ownerEmail,
                orderNumber,
                customerName,
                customerEmail,
                total,
                {
                    created_at: new Date().toISOString(),
                    service_type: serviceType,
                    delivery_fee: safeDeliveryFee,
                    packeta_point_json: packetaPoint ? JSON.stringify(packetaPoint) : null
                }
            );
            console.log(`Owner notification email sent to ${ownerEmail} for order ${orderNumber}`);
        } catch (emailError) {
            console.error('Failed to send owner notification email:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: {
                id: orderResult.lastID,
                orderNumber,
                total,
                itemCount: cartItems.length,
                status: 'pending'
            }
        });
    } catch (err) {
        console.error('Create order error:', err);
        const status = err.message && err.message.includes('Invalid item price') ? 400 : 500;
        res.status(status).json({ 
            success: false, 
            message: 'Failed to create order', 
            error: err.message 
        });
    }
});

/**
 * Update order status (admin only)
 * PATCH /api/orders/:orderId
 */
router.patch('/:orderId', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'in-progress', 'waiting', 'delivering', 'completed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        // Get order details before updating
        const order = await db.getAsync(
            'SELECT id, order_number, customer_name, customer_email, total, created_at FROM orders WHERE id = ?',
            [orderId]
        );

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const result = await db.runAsync(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, orderId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        // Send email to customer about status update
        try {
            await sendOrderStatusEmail(
                order.customer_email,
                order.customer_name,
                order.order_number,
                status,
                order
            );
            console.log(`Email sent to customer for order ${order.order_number} status: ${status}`);
        } catch (emailError) {
            console.error('Failed to send status update email:', emailError.message);
            // Don't fail the request if email fails, just log the error
        }

        res.json({
            success: true,
            message: 'Order status updated'
        });
    } catch (err) {
        console.error('Update order error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update order', 
            error: err.message 
        });
    }
});

/**
 * Delete order (admin only)
 * DELETE /api/orders/:orderId
 */
router.delete('/:orderId', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const { orderId } = req.params;

        const result = await db.runAsync(
            'DELETE FROM orders WHERE id = ?',
            [orderId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        res.json({
            success: true,
            message: 'Order deleted'
        });
    } catch (err) {
        console.error('Delete order error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete order', 
            error: err.message 
        });
    }
});

module.exports = router;
