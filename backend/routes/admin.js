/**
 * Admin Routes
 * GET /api/admin/users - Get all users
 * POST /api/admin/users - Create admin user
 * DELETE /api/admin/users/:userId - Delete user
 * POST /api/admin/users/:userId/password - Reset user password
 * POST /api/admin/users/reset-all - Reset all users and passwords
 * GET /api/admin/stats - Get platform statistics
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { verifyToken, verifyOwner } = require('../middleware/auth');

const ALLOWED_ROLES = new Set(['customer', 'worker', 'manager', 'owner']);
const ALLOWED_PERMISSION_KEYS = new Set(['orders', 'catalog', 'chats', 'credentials']);
const ROLE_DEFAULT_PERMISSIONS = {
    customer: [],
    worker: ['orders', 'chats'],
    manager: ['orders', 'catalog', 'chats'],
    owner: ['orders', 'catalog', 'chats', 'credentials']
};

const normalizeRole = (role, fallback = 'manager') => {
    const normalized = String(role || '').trim().toLowerCase();
    if (ALLOWED_ROLES.has(normalized)) return normalized;
    return fallback;
};

const parsePermissions = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return [];
    }
};

const normalizeRequestedPermissions = (value, role) => {
    if (role === 'owner') return [...ROLE_DEFAULT_PERMISSIONS.owner];
    const fallback = ROLE_DEFAULT_PERMISSIONS[role] || [];
    const source = Array.isArray(value) ? value : fallback;
    return [...new Set(source
        .map(item => String(item || '').trim().toLowerCase())
        .filter(item => ALLOWED_PERMISSION_KEYS.has(item) && item !== 'credentials'))];
};

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
router.get('/users', verifyToken, verifyOwner, async (req, res) => {
    try {
        const users = await db.allAsync(
            `SELECT id, username, email, role, permissions, created_at FROM users ORDER BY created_at DESC`
        );

        const usersWithPermissions = users.map(user => ({
            ...user,
            permissions: parsePermissions(user.permissions)
        }));

        res.json({
            success: true,
            users: usersWithPermissions
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
 * Get detailed user snapshot (admin only)
 * GET /api/admin/users/:userId/details
 */
router.get('/users/:userId/details', verifyToken, verifyOwner, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await db.getAsync(
            'SELECT id, username, email, role, permissions, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const orders = await db.allAsync(
            `SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.status, o.total,
                    o.created_at, o.updated_at, COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT 60`,
            [user.id]
        );

        let chats = [];
        const email = String(user.email || '').trim().toLowerCase();
        if (email) {
            chats = await db.allAsync(
                `SELECT
                    s.id,
                    s.customer_name,
                    s.customer_email,
                    s.help_topic,
                    s.assigned_admin_name,
                    s.status,
                    s.last_message_at,
                    s.created_at,
                    lm.sender_type AS last_sender_type,
                    lm.message AS last_message
                 FROM chat_sessions s
                 LEFT JOIN LATERAL (
                    SELECT sender_type, message
                    FROM chat_messages cm
                    WHERE cm.session_id = s.id
                    ORDER BY cm.created_at DESC
                    LIMIT 1
                 ) lm ON TRUE
                 WHERE LOWER(COALESCE(s.customer_email, '')) = ?
                 ORDER BY s.last_message_at DESC, s.created_at DESC
                 LIMIT 60`,
                [email]
            );
        }

        res.json({
            success: true,
            user: {
                ...user,
                permissions: parsePermissions(user.permissions)
            },
            orders,
            chats
        });
    } catch (err) {
        console.error('Get user details error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load user details',
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
        const { username, password, email, role, permissions } = req.body;
        const normalizedEmail = (email || '').trim().toLowerCase();
        const normalizedUsername = (username || '').trim();
        const nextRole = normalizeRole(role, 'manager');
        const nextPermissions = normalizeRequestedPermissions(permissions, nextRole);

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
                'UPDATE users SET role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [nextRole, JSON.stringify(nextPermissions), existing.id]
            );

            return res.json({
                success: true,
                message: `User role updated to ${nextRole}`,
                user: {
                    id: existing.id,
                    username: existing.username,
                    email: existing.email,
                    role: nextRole,
                    permissions: nextPermissions
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
            'INSERT INTO users (username, password_hash, email, role, permissions) VALUES (?, ?, ?, ?, ?)',
            [normalizedUsername, hashedPassword, normalizedEmail || null, nextRole, JSON.stringify(nextPermissions)]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: result.lastID,
                username: normalizedUsername,
                email: normalizedEmail || null,
                role: nextRole,
                permissions: nextPermissions
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
        const { username, email, password, role, permissions } = req.body;

        if (!username && !email && !password && role === undefined && permissions === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required to update'
            });
        }

        const user = await db.getAsync(
            'SELECT id, username, email, role, permissions FROM users WHERE id = ?',
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
            const nextPermissions = normalizeRequestedPermissions(permissions, nextRole);
            fields.push('permissions = ?');
            params.push(JSON.stringify(nextPermissions));
        } else if (permissions !== undefined) {
            const nextPermissions = normalizeRequestedPermissions(permissions, user.role);
            fields.push('permissions = ?');
            params.push(JSON.stringify(nextPermissions));
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
            'SELECT id, username, email, role, permissions, created_at FROM users WHERE id = ?',
            [userId]
        );

        const responseUser = {
            ...updated,
            permissions: parsePermissions(updated.permissions)
        };

        res.json({
            success: true,
            message: 'User updated successfully',
            user: responseUser
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
 * Reset all users and passwords (owner only)
 * POST /api/admin/users/reset-all
 */
router.post('/users/reset-all', verifyToken, verifyOwner, async (req, res) => {
    try {
        const confirmation = String(req.body?.confirmation || '').trim();
        if (confirmation !== 'RESET_ALL_USERS') {
            return res.status(400).json({
                success: false,
                message: 'Confirmation text must be RESET_ALL_USERS'
            });
        }

        const bootstrapUsername = (process.env.BOOTSTRAP_ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin').trim();
        const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
        const bootstrapEmail = `${bootstrapUsername}@ezfix.local`;

        if (!bootstrapPassword) {
            return res.status(400).json({
                success: false,
                message: 'Set BOOTSTRAP_ADMIN_PASSWORD (or ADMIN_PASSWORD) before running reset'
            });
        }

        const hashedPassword = await bcrypt.hash(bootstrapPassword, 10);

        await db.query('BEGIN');
        try {
            // Orders are retained; unlink users before wiping accounts.
            await db.query('UPDATE orders SET user_id = NULL');

            // Remove all user records and recreate a single bootstrap owner account.
            await db.query('DELETE FROM users');
            await db.query(
                'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
                [bootstrapUsername, hashedPassword, bootstrapEmail, 'owner']
            );

            await db.query('COMMIT');
        } catch (txErr) {
            await db.query('ROLLBACK');
            throw txErr;
        }

        res.json({
            success: true,
            message: 'All users were reset. Login with bootstrap credentials from environment variables.',
            bootstrapUsername
        });
    } catch (err) {
        console.error('Reset all users error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to reset all users',
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
