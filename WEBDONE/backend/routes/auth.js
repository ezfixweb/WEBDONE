/**
 * Authentication Routes
 * POST /api/auth/register - Register new user
 * POST /api/auth/login - Login user
 * GET /api/auth/me - Get current user
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/email');

const normalizeEmail = (value = '') => value.trim().toLowerCase();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const OWNER_USERNAME = (process.env.OWNER_USERNAME || 'samu').trim().toLowerCase();

const isManagerEmail = (email) => {
    const adminEmailList = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
    return adminEmailList.includes(normalizeEmail(email));
};

const ensureUniqueUsername = async (base) => {
    let candidate = base || `user_${Date.now()}`;
    let suffix = 0;
    while (true) {
        const existing = await db.getAsync(
            'SELECT id FROM users WHERE username = ?',
            [candidate]
        );
        if (!existing) return candidate;
        suffix += 1;
        candidate = `${base}_${suffix}`;
    }
};

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
    body('email').isEmail().withMessage('Invalid email address')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { username, password, email } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const normalizedUsername = String(username || '').trim();
        const usernameKey = normalizedUsername.toLowerCase();

        // Check if user exists
        const existingUser = await db.getAsync(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, normalizedEmail]
        );

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const role = usernameKey === OWNER_USERNAME
            ? 'owner'
            : (isManagerEmail(normalizedEmail) ? 'manager' : 'customer');
        const result = await db.runAsync(
            'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
            [normalizedUsername, hashedPassword, normalizedEmail, role]
        );

        // Generate token
        const token = jwt.sign(
            { id: result.lastID, username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: result.lastID,
                username,
                email,
                role
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed', 
            error: err.message 
        });
    }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { username, password } = req.body;
        const identifier = username.trim();
        const identifierKey = identifier.toLowerCase();
        console.log(`[LOGIN] Attempting login for identifier: ${identifier}`);

        // Find user
        const user = await db.getAsync(
            'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?',
            [identifier, identifier]
        );

        console.log(`[LOGIN] User found:`, user ? `${user.username} (role: ${user.role})` : 'NOT FOUND');

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log(`[LOGIN] Password valid: ${isPasswordValid}`);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        if (user.username && user.username.toLowerCase() === OWNER_USERNAME && user.role !== 'owner') {
            await db.runAsync(
                'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['owner', user.id]
            );
            user.role = 'owner';
        }

        if (user.email && user.role !== 'owner' && user.role !== 'manager' && isManagerEmail(user.email)) {
            await db.runAsync(
                'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['manager', user.id]
            );
            user.role = 'manager';
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        console.log(`[LOGIN] Token generated for ${username}`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed', 
            error: err.message 
        });
    }
});

/**
 * Get current user
 * GET /api/auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get user', 
            error: err.message 
        });
    }
});

/**
 * Logout (client-side token deletion)
 * POST /api/auth/logout
 */
router.post('/logout', verifyToken, (req, res) => {
    // Token is managed client-side, just confirm logout
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Invalid email address')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const email = normalizeEmail(req.body.email);
        const user = await db.getAsync(
            'SELECT id, username, email FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.json({
                success: true,
                message: 'If the email exists, a reset link has been sent.'
            });
        }

        const token = crypto.randomBytes(24).toString('hex');
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        await db.runAsync(
            'UPDATE users SET reset_token = ?, reset_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [tokenHash, expiresAt, user.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/#reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        await sendPasswordResetEmail(email, user.username, resetUrl);

        return res.json({
            success: true,
            message: 'If the email exists, a reset link has been sent.'
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send reset email',
            error: err.message
        });
    }
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
router.post('/reset-password', [
    body('email').isEmail().withMessage('Invalid email address'),
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain number')
        .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const email = normalizeEmail(req.body.email);
        const token = String(req.body.token || '').trim();
        const tokenHash = hashToken(token);

        const user = await db.getAsync(
            'SELECT id, reset_token, reset_expires FROM users WHERE email = ?',
            [email]
        );

        if (!user || !user.reset_token || user.reset_token !== tokenHash) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        if (!user.reset_expires || new Date(user.reset_expires).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await db.runAsync(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, user.id]
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
 * Google OAuth start
 * GET /api/auth/google
 */
router.get('/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
        return res.status(500).json({
            success: false,
            message: 'Google OAuth is not configured'
        });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 */
router.get('/google/callback', async (req, res) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const { code, error } = req.query;

        if (error) {
            return res.redirect(`${frontendUrl}/#oauth?error=${encodeURIComponent(error)}`);
        }

        if (!code) {
            return res.redirect(`${frontendUrl}/#oauth?error=missing_code`);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            return res.redirect(`${frontendUrl}/#oauth?error=oauth_not_configured`);
        }

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error('Google token error:', tokenData);
            return res.redirect(`${frontendUrl}/#oauth?error=token_exchange_failed`);
        }

        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();
        if (!userResponse.ok) {
            console.error('Google userinfo error:', userData);
            return res.redirect(`${frontendUrl}/#oauth?error=userinfo_failed`);
        }

        const email = normalizeEmail(userData.email || '');
        if (!email) {
            return res.redirect(`${frontendUrl}/#oauth?error=missing_email`);
        }

        let user = await db.getAsync(
            'SELECT id, username, email, role FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            const baseUsername = email.split('@')[0] || `user_${Date.now()}`;
            const username = await ensureUniqueUsername(baseUsername);
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const role = username.toLowerCase() === OWNER_USERNAME
                ? 'owner'
                : (isManagerEmail(email) ? 'manager' : 'customer');

            const result = await db.runAsync(
                'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, email, role]
            );

            user = {
                id: result.lastID,
                username,
                email,
                role
            };
        } else if (user.role !== 'owner' && user.role !== 'manager' && isManagerEmail(user.email)) {
            await db.runAsync(
                'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['manager', user.id]
            );
            user.role = 'manager';
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.redirect(`${frontendUrl}/#oauth?token=${encodeURIComponent(token)}`);
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/#oauth?error=oauth_failed`);
    }
});

module.exports = router;
