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

const CATALOG_KEY = 'main';

function withTimeout(promise, timeoutMs, timeoutMessage) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise])
        .finally(() => clearTimeout(timeoutId));
}

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
 * Get currently logged-in user's own orders only
 * GET /api/orders/mine
 */
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const orders = await db.allAsync(
            `SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.status, o.total,
                    o.created_at, o.updated_at, COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, orders });
    } catch (err) {
        console.error('Get own orders error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get own orders',
            error: err.message
        });
    }
});

/**
 * Create a manual order from admin panel (admin only)
 * POST /api/orders/admin/manual
 */
router.post('/admin/manual', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            customerCity,
            customerZip,
            country,
            serviceType,
            notes,
            status,
            item,
            items
        } = req.body || {};

        const safeName = String(customerName || '').trim();
        const safeEmail = String(customerEmail || '').trim().toLowerCase();
        const safePhone = String(customerPhone || '').trim();
        const safeAddress = String(customerAddress || '').trim();
        const safeCity = String(customerCity || '').trim();
        const safeZip = String(customerZip || '').trim();
        const safeCountry = String(country || '').trim() || 'Czech Republic';
        const safeServiceType = String(serviceType || 'pickup').trim().toLowerCase();
        const safeStatus = String(status || 'pending').trim().toLowerCase();
        const safeNotes = String(notes || '').trim();

        const rawItems = Array.isArray(items)
            ? items
            : (item && typeof item === 'object' ? [item] : []);

        const safeItems = rawItems.map((raw) => {
            const source = raw && typeof raw === 'object' ? raw : {};
            const priceRaw = typeof source.price === 'number'
                ? source.price
                : parseFloat(String(source.price || '0'));
            const safePrice = Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : NaN;

            return {
                device: String(source.device || '').trim().toLowerCase(),
                brand: String(source.brand || '').trim(),
                model: String(source.model || '').trim(),
                repairType: String(source.repairType || 'manual').trim(),
                repairName: String(source.repairName || '').trim(),
                price: safePrice,
                fileName: String(source.fileName || source.file_name || '').trim()
            };
        }).filter((entry) => entry.repairName && Number.isFinite(entry.price));

        if (!safeName || !safeEmail || !safePhone) {
            return res.status(400).json({
                success: false,
                message: 'Customer name, email and phone are required'
            });
        }

        const validServiceTypes = ['delivery', 'pickup', 'zasilkovna', 'ceska-posta', 'ppl', 'dpd', 'gls'];
        if (!validServiceTypes.includes(safeServiceType)) {
            return res.status(400).json({ success: false, message: 'Invalid service type' });
        }

        const validStatuses = ['pending', 'in-progress', 'waiting', 'delivering', 'completed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(safeStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        if (!safeItems.length) {
            return res.status(400).json({
                success: false,
                message: 'At least one item with repair name and valid price is required'
            });
        }

        const totalAmount = safeItems.reduce((sum, current) => sum + current.price, 0);

        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `EZF-${Date.now()}-${randomSuffix}`;

        const orderResult = await db.runAsync(
            `INSERT INTO orders
             (order_number, user_id, customer_name, customer_email, customer_phone,
              customer_address, customer_city, customer_zip, service_type, delivery_fee,
              payment_method, payment_fee, payment_status, packeta_point_json, country, total, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                orderNumber,
                null,
                safeName,
                safeEmail,
                safePhone,
                safeAddress || 'N/A',
                safeCity,
                safeZip,
                safeServiceType,
                0,
                'manual',
                0,
                'pending',
                null,
                safeCountry,
                totalAmount,
                safeNotes,
                safeStatus
            ]
        );

        for (const safeItem of safeItems) {
            await db.runAsync(
                `INSERT INTO order_items
                 (order_id, device, brand, model, repair_type, repair_name, price, printer, filament, color, parts, file_name)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderResult.lastID,
                    safeItem.device || 'other',
                    safeItem.brand || 'N/A',
                    safeItem.model || 'N/A',
                    safeItem.repairType,
                    safeItem.repairName,
                    safeItem.price,
                    null,
                    null,
                    null,
                    null,
                    safeItem.fileName || null
                ]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Manual order created successfully',
            order: {
                id: orderResult.lastID,
                orderNumber,
                status: safeStatus,
                total: totalAmount,
                itemCount: safeItems.length
            }
        });
    } catch (err) {
        console.error('Create manual order error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create manual order',
            error: err.message
        });
    }
});

/**
 * Create invoice from admin panel (manager/owner)
 * POST /api/orders/admin/invoices
 */
router.post('/admin/invoices', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const {
            invoiceNumber,
            orderId,
            customerName,
            customerEmail,
            description,
            amount,
            dueDate,
            status,
            notes,
            scanFileUrl
        } = req.body || {};

        const safeCustomerName = String(customerName || '').trim();
        const safeCustomerEmail = String(customerEmail || '').trim().toLowerCase();
        const safeDescription = String(description || '').trim();
        const safeNotes = String(notes || '').trim();
        const safeStatus = String(status || 'issued').trim().toLowerCase();
        const safeScanFileUrl = String(scanFileUrl || '').trim();
        const parsedAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || '0'));
        const safeAmount = Number.isFinite(parsedAmount) ? Math.max(0, parsedAmount) : NaN;

        if (!safeCustomerName) {
            return res.status(400).json({ success: false, message: 'Customer name is required' });
        }

        if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const validStatuses = ['issued', 'paid', 'cancelled', 'overdue'];
        if (!validStatuses.includes(safeStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid invoice status' });
        }

        let safeOrderId = null;
        if (orderId !== undefined && orderId !== null && String(orderId).trim() !== '') {
            const parsedOrderId = Number(orderId);
            if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid order ID' });
            }

            const orderExists = await db.getAsync('SELECT id FROM orders WHERE id = ?', [parsedOrderId]);
            if (!orderExists) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            safeOrderId = parsedOrderId;
        }

        const now = new Date();
        const generatedInvoiceNumber = `INV-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;
        const nextInvoiceNumber = String(invoiceNumber || '').trim() || generatedInvoiceNumber;

        const dueDateText = String(dueDate || '').trim();
        let safeDueDate = null;
        if (dueDateText) {
            const ts = Date.parse(dueDateText);
            if (!Number.isFinite(ts)) {
                return res.status(400).json({ success: false, message: 'Invalid due date' });
            }
            safeDueDate = new Date(ts).toISOString().slice(0, 10);
        }

        const existingInvoice = await db.getAsync(
            'SELECT id FROM invoices WHERE invoice_number = ?',
            [nextInvoiceNumber]
        );
        if (existingInvoice) {
            return res.status(400).json({ success: false, message: 'Invoice number already exists' });
        }

        const insertResult = await db.runAsync(
            `INSERT INTO invoices
             (invoice_number, order_id, customer_name, customer_email, description, amount, currency, status, due_date, scan_file_url, notes, created_by_user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nextInvoiceNumber,
                safeOrderId,
                safeCustomerName,
                safeCustomerEmail || null,
                safeDescription || null,
                safeAmount,
                'CZK',
                safeStatus,
                safeDueDate,
                safeScanFileUrl || null,
                safeNotes || null,
                req.user?.id || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice: {
                id: insertResult.lastID,
                invoiceNumber: nextInvoiceNumber,
                orderId: safeOrderId,
                customerName: safeCustomerName,
                customerEmail: safeCustomerEmail || null,
                amount: safeAmount,
                currency: 'CZK',
                status: safeStatus,
                dueDate: safeDueDate,
                scanFileUrl: safeScanFileUrl || null
            }
        });
    } catch (err) {
        console.error('Create invoice error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create invoice',
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


        let catalogCheckout = {};
        try {
            const catalogRow = await db.getAsync('SELECT data FROM catalog WHERE key = ?', [CATALOG_KEY]);
            if (catalogRow && catalogRow.data) {
                const parsedCatalog = JSON.parse(catalogRow.data);
                catalogCheckout = parsedCatalog && typeof parsedCatalog.checkout === 'object'
                    ? parsedCatalog.checkout
                    : {};
            }
        } catch (catalogErr) {
            console.warn('Could not load checkout config for order email context:', catalogErr.message || catalogErr);
        }

        const emailContext = {
            created_at: new Date().toISOString(),
            service_type: serviceType,
            delivery_fee: safeDeliveryFee,
            packeta_point_json: packetaPoint ? JSON.stringify(packetaPoint) : null,
            payment_method: paymentMethod || 'pay_on_delivery',
            bank_transfer_account: String(catalogCheckout.bankTransferAccount || '').trim(),
            bank_transfer_iban: String(catalogCheckout.bankTransferIban || '').trim()
        };

        let customerEmailStatus = 'queued';
        try {
            const confirmationResult = await withTimeout(
                sendOrderConfirmationEmail(
                    customerEmail,
                    customerName,
                    orderNumber,
                    orderItems,
                    total,
                    emailContext
                ),
                Number(process.env.ORDER_CONFIRM_EMAIL_TIMEOUT_MS || 20000),
                'Order confirmation email timeout'
            );

            if (confirmationResult && confirmationResult.success) {
                customerEmailStatus = 'sent';
            } else if (confirmationResult && confirmationResult.skipped) {
                customerEmailStatus = 'skipped';
            } else {
                customerEmailStatus = 'failed';
            }
        } catch (emailError) {
            customerEmailStatus = 'failed';
            console.error('Failed to send order confirmation email:', emailError.message);
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
            },
            email: {
                customer: customerEmailStatus
            }
        });

        // Send owner notification asynchronously to keep checkout responsive
        setImmediate(async () => {
            try {
                const defaultOwnerEmails = [
                    'djsamu.jb@gmail.com',
                    'ezfix.podpora@gmail.com',
                    'jbalda@ezfix.cz'
                ];
                const ownerEmails = (process.env.OWNER_NOTIFY_EMAILS || process.env.OWNER_NOTIFY_EMAIL || '')
                    .split(',')
                    .map(email => email.trim())
                    .filter(Boolean);
                const notificationRecipients = ownerEmails.length > 0 ? ownerEmails : defaultOwnerEmails;

                await sendNewOrderNotificationEmail(
                    notificationRecipients.join(', '),
                    orderNumber,
                    customerName,
                    customerEmail,
                    total,
                    emailContext
                );
                console.log(`Owner notification email sent to ${notificationRecipients.join(', ')} for order ${orderNumber}`);
            } catch (emailError) {
                console.error('Failed to send owner notification email:', emailError.message);
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
