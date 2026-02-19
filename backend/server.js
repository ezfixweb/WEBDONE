/**
 * EzFix Backend Server
 * Main Express application setup
 * Handles routing, middleware, and server initialization
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const { initializeDatabase } = require('./config/database');
const { errorHandler } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const servicesRoutes = require('./routes/services');
const buildsRoutes = require('./routes/builds');
const emailRoutes = require('./routes/email');
const catalogRoutes = require('./routes/catalog');
const uploadsRoutes = require('./routes/uploads');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

const ACTIVE_VISITOR_WINDOW_MS = Number(process.env.ACTIVE_VISITOR_WINDOW_MS || 2 * 60 * 1000);
const activeVisitors = new Map();

function cleanupActiveVisitors() {
    const now = Date.now();
    for (const [visitorId, lastSeenAt] of activeVisitors.entries()) {
        if (now - lastSeenAt > ACTIVE_VISITOR_WINDOW_MS) {
            activeVisitors.delete(visitorId);
        }
    }
}

function getActiveVisitorsCount() {
    cleanupActiveVisitors();
    return activeVisitors.size;
}

setInterval(cleanupActiveVisitors, 30 * 1000);

// Reduce fingerprinting surface
app.disable('x-powered-by');

/**
 * Middleware Setup
 */

// Security headers with helmet
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "data:", "https://images.unsplash.com"],
            "script-src": ["'self'", "https://widget.packeta.com"],
            "script-src-attr": ["'unsafe-inline'"],
            "frame-src": [
                "'self'",
                "https://www.google.com",
                "https://www.google.com/maps",
                "https://maps.google.com",
                "https://widget.packeta.com"
            ],
            "connect-src": ["'self'", "https://widget.packeta.com"]
        }
    }
}));

// Gzip/brotli compression for faster responses
app.use(compression());

// Rate limiting for auth endpoints
const authWindowMs = Number(process.env.AUTH_RATE_WINDOW_MS || 15 * 60 * 1000);
const authMax = Number(
    process.env.AUTH_RATE_MAX || (process.env.NODE_ENV === 'development' ? 1000 : 5)
);
const authLimiter = rateLimit({
    windowMs: authWindowMs,
    max: authMax,
    message: 'Too many authentication attempts, please try again later',
    skip: (req) => {
        const path = req.path || '';
        if (req.method === 'OPTIONS') return true;
        return path === '/google' || path === '/google/callback';
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({
            success: false,
            message: options.message
        });
    },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false
});

// CORS configuration - restrict to specific origins (API routes only)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use('/api', cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin || origin === 'null' || origin === 'file://') {
            callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

/**
 * Routes Setup
 */

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

app.post('/api/presence/heartbeat', (req, res) => {
    const rawVisitorId = typeof req.body?.visitorId === 'string' ? req.body.visitorId.trim() : '';
    const safeVisitorId = /^[a-zA-Z0-9._-]{6,100}$/.test(rawVisitorId)
        ? rawVisitorId
        : `${req.ip || 'unknown'}:${req.headers['user-agent'] || 'ua'}`;

    activeVisitors.set(safeVisitorId, Date.now());

    res.json({
        success: true,
        activeVisitors: getActiveVisitorsCount()
    });
});

app.get('/api/presence/active', (req, res) => {
    res.json({
        success: true,
        activeVisitors: getActiveVisitorsCount()
    });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/orders', apiLimiter, ordersRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/services', apiLimiter, servicesRoutes);
app.use('/api/builds', apiLimiter, buildsRoutes);
app.use('/api/email', apiLimiter, emailRoutes);
app.use('/api/catalog', apiLimiter, catalogRoutes);
app.use('/api/uploads', apiLimiter, uploadsRoutes);

// Serve frontend static files from the project root (one level up from backend)
const path = require('path');
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir, {
    setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return;
        }
        if (/\.(css|js)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Root route - serve index.html for browser access
app.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// Avoid favicon 404 noise
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

/**
 * Server Initialization
 */

async function startServer() {
    try {
        // Initialize database
        console.log('[DATABASE] Initializing database...');
        await initializeDatabase();
        console.log('[DATABASE] Database initialized successfully');

        // Start listening
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║         EzFix Backend Server            ║
║         ✓ Running Successfully          ║
╠════════════════════════════════════════╣
║ Environment: ${process.env.NODE_ENV || 'development'}.padEnd(28) ║
║ Port:        ${PORT.toString().padEnd(28)} ║
║ Database:    ${process.env.DB_PATH || './database/ezfix.db'} ║
╠════════════════════════════════════════╣
║ Endpoints:                              ║
║   • Auth:     /api/auth                 ║
║   • Cart:     /api/cart                 ║
║   • Orders:   /api/orders               ║
║   • Admin:    /api/admin                ║
║   • Services: /api/services             ║
║   • Builds:   /api/builds               ║
║   • Email:    /api/email                ║
║   • Health:   /api/health               ║
╚════════════════════════════════════════╝
            `);
        });
    } catch (err) {
        console.error('[ERROR] Failed to start server:', err);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
