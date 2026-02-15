/**
 * Email Routes
 * POST /api/email/send-order-status - Send order status update email
 * POST /api/email/send-custom - Send custom email to customer
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { verifyToken, verifyOrderManager } = require('../middleware/auth');
const { sendOrderStatusEmail, sendCustomEmail } = require('../services/email');

/**
 * Send order status update email
 * POST /api/email/send-order-status
 */
router.post('/send-order-status', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and status are required'
            });
        }

        // Get order details
        const order = await db.getAsync(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Send email
        const emailResult = await sendOrderStatusEmail(
            order.customer_email,
            order.customer_name,
            order.order_number,
            status,
            order
        );

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: emailResult.messageId
        });
    } catch (err) {
        console.error('Send order status email error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: err.message
        });
    }
});

/**
 * Send custom email to customer
 * POST /api/email/send-custom
 */
router.post('/send-custom', verifyToken, verifyOrderManager, async (req, res) => {
    try {
        const { orderId, customerEmail, subject, message } = req.body;

        if (!customerEmail || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Customer email, subject, and message are required'
            });
        }

        let order = {};
        if (orderId) {
            order = await db.getAsync(
                'SELECT * FROM orders WHERE id = ?',
                [orderId]
            ) || {};
        }

        // Send email
        const emailResult = await sendCustomEmail(
            customerEmail,
            subject,
            message,
            order
        );

        res.json({
            success: true,
            message: 'Email sent successfully',
            messageId: emailResult.messageId
        });
    } catch (err) {
        console.error('Send custom email error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: err.message
        });
    }
});

module.exports = router;
