/**
 * Authentication Middleware
 * JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await db.getAsync(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token', 
            error: err.message 
        });
    }
};

const isOrderManagerRole = (role) => role === 'worker' || role === 'manager' || role === 'owner';
const isManagerRole = (role) => role === 'manager' || role === 'owner';
const isOwnerRole = (role) => role === 'owner';

/**
 * Verify user is manager or owner
 */
const verifyManager = async (req, res, next) => {
    try {
        if (!isManagerRole(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Manager access required'
            });
        }
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Permission denied',
            error: err.message
        });
    }
};

/**
 * Verify user can manage orders (worker/manager/owner)
 */
const verifyOrderManager = async (req, res, next) => {
    try {
        if (!isOrderManagerRole(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Order manager access required'
            });
        }
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Permission denied',
            error: err.message
        });
    }
};

/**
 * Verify user is owner
 */
const verifyOwner = async (req, res, next) => {
    try {
        if (!isOwnerRole(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Owner access required'
            });
        }
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Permission denied',
            error: err.message
        });
    }
};

/**
 * Verify user is admin (legacy)
 */
const verifyAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }
        next();
    } catch (err) {
        return res.status(403).json({ 
            success: false, 
            message: 'Permission denied', 
            error: err.message 
        });
    }
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const status = err.status || 500;
    const message = err.message || 'Internal server error';

    res.status(status).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyManager,
    verifyOrderManager,
    verifyOwner,
    isManagerRole,
    isOrderManagerRole,
    isOwnerRole,
    errorHandler
};
