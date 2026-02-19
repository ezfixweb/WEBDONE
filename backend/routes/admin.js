/**
 * Admin Routes
 * GET /api/admin/users - Get all users
 * POST /api/admin/users - Create admin user
 * DELETE /api/admin/users/:userId - Delete user
 * POST /api/admin/users/:userId/password - Reset user password
 * GET /api/admin/stats - Get platform statistics
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { verifyToken, verifyOwner } = require('../middleware/auth');

const ALLOWED_ROLES = new Set(['customer', 'worker', 'manager', 'owner']);
const normalizeRole = (role, fallback = 'manager') => {
    const normalized = String(role || '').trim().toLowerCase();
    if (ALLOWED_ROLES.has(normalized)) return normalized;
    return fallback;
};

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
router.get('/users', verifyToken, verifyOwner, async (req, res) => {
    try {
        const users = await db.allAsync(
            `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users
        });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get users', 
            error: err.message 
        });
    }
});

/**
 * Create new admin user
 * POST /api/admin/users
 */
router.post('/users', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedUsername = (username || '').trim();
        const nextRole = normalizeRole(role, 'manager');

        if (!normalizedUsername && !normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: 'Username or email required'
            });
        }

        const existing = await db.getAsync(
            'SELECT id, username, email, role FROM users WHERE username = ? OR email = ?',
            [normalizedUsername || null, normalizedEmail || null]
        );

        if (existing) {
            if (existing.role === nextRole) {
                return res.json({
                    success: true,
                    message: `User already has role ${nextRole}`,
                    user: existing
                });
            }

            await db.runAsync(
                'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [nextRole, existing.id]
            );

            return res.json({
                success: true,
                message: `User role updated to ${nextRole}`,
                user: {
                    id: existing.id,
                    username: existing.username,
                    email: existing.email,
                    role: nextRole
                }
            });
        }

        if (!normalizedUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username required to create a new user'
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password required to create a new user'
            });
        }

        if (normalizedUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain uppercase, lowercase, number, and special character (any symbol)'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.runAsync(
            'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
            [normalizedUsername, hashedPassword, normalizedEmail || null, nextRole]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: result.lastID,
                username: normalizedUsername,
                email: normalizedEmail || null,
                role: nextRole
            }
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create user', 
            error: err.message 
        });
    }
});

/**
 * Update admin user details
 * PUT /api/admin/users/:userId
 */
router.put('/users/:userId', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, email, password, role } = req.body;

        if (!username && !email && !password && role === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required to update'
            });
        }

        const user = await db.getAsync(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const nextUsername = typeof username === 'string' ? username.trim() : null;
        const nextEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;

        if (nextUsername && nextUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters'
            });
        }

        if (nextEmail) {
            const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
            if (!emailRegex.test(nextEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email address'
                });
            }
        }

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters'
                });
            }
            if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must contain uppercase, lowercase, number, and special character (any symbol)'
                });
            }
        }

        if (nextUsername) {
            const usernameExists = await db.getAsync(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [nextUsername, userId]
            );
            if (usernameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already in use'
                });
            }
        }

        if (nextEmail) {
            const emailExists = await db.getAsync(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [nextEmail, userId]
            );
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        const fields = [];
        const params = [];

        if (role !== undefined) {
            const nextRole = normalizeRole(role, user.role);
            fields.push('role = ?');
            params.push(nextRole);
        }

        if (nextUsername) {
            fields.push('username = ?');
            params.push(nextUsername);
        }

        if (email !== undefined) {
            fields.push('email = ?');
            params.push(nextEmail || null);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password_hash = ?');
            params.push(hashedPassword);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');

        params.push(userId);

        await db.runAsync(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            params
        );

        const updated = await db.getAsync(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updated
        });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: err.message
        });
    }
});

/**
 * Reset user password (admin only)
 * POST /api/admin/users/:userId/password
 */
router.post('/users/:userId/password', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        const user = await db.getAsync(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.runAsync(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reset password', 
            error: err.message 
        });
    }
});

/**
 * Delete user (admin only)
 * DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting yourself
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete your own account' 
            });
        }

        const target = await db.getAsync(
            'SELECT role FROM users WHERE id = ?',
            [userId]
        );

        if (target && target.role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete owner account'
            });
        }

        const result = await db.runAsync(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete user', 
            error: err.message 
        });
    }
});

/**
 * Get platform statistics (admin only)
 * GET /api/admin/stats
 */
router.get('/stats', verifyToken, verifyOwner, async (req, res) => {
    try {
        const totalUsers = await db.getAsync('SELECT COUNT(*) as count FROM users');
        const totalOrders = await db.getAsync('SELECT COUNT(*) as count FROM orders');
        const pendingOrders = await db.getAsync(
            'SELECT COUNT(*) as count FROM orders WHERE status = ?',
            ['pending']
        );
        const totalRevenue = await db.getAsync(
            "SELECT SUM(total) as revenue FROM orders WHERE status IN ('completed', 'delivered')"
        );

        res.json({
            success: true,
            statistics: {
                totalUsers: totalUsers.count || 0,
                totalOrders: totalOrders.count || 0,
                pendingOrders: pendingOrders.count || 0,
                totalRevenue: totalRevenue.revenue || 0
            }
        });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get statistics', 
            error: err.message 
        });
    }
});

module.exports = router;
