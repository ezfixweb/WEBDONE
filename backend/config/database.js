/**
 * Database Configuration
 * SQLite database setup and connection management
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dbPath = path.join(__dirname, '../database/ezfix.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create/open database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database at', dbPath);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT,
                role TEXT DEFAULT 'customer',
                reset_token TEXT,
                reset_expires DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) reject(err);
            db.all(`PRAGMA table_info(users)`, (usersErr, cols) => {
                if (usersErr) {
                    console.error('Failed to read users table info:', usersErr);
                } else if (Array.isArray(cols)) {
                    const hasResetToken = cols.some(c => c.name === 'reset_token');
                    const hasResetExpires = cols.some(c => c.name === 'reset_expires');
                    if (!hasResetToken) {
                        db.run(`ALTER TABLE users ADD COLUMN reset_token TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add reset_token column:', alterErr);
                            else console.log('Added missing column reset_token to users');
                        });
                    }
                    if (!hasResetExpires) {
                        db.run(`ALTER TABLE users ADD COLUMN reset_expires DATETIME`, (alterErr) => {
                            if (alterErr) console.error('Failed to add reset_expires column:', alterErr);
                            else console.log('Added missing column reset_expires to users');
                        });
                    }
                }
            });
        });

        // Create default manager user if not exists
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(
            `INSERT OR IGNORE INTO users (username, password_hash, email, role) 
             VALUES (?, ?, ?, ?)`,
            ['admin', hashedPassword, 'admin@ezfix.local', 'manager'],
            (err) => {
                if (err) console.error('Error creating default manager:', err);
                else console.log('Default manager user ensured (admin/admin123)');
            }
        );

        // Migrate legacy admin roles to manager
        db.run(
            `UPDATE users SET role = 'manager' WHERE role = 'admin'`,
            (err) => {
                if (err) console.error('Error migrating admin roles:', err);
            }
        );

        // Ensure owner role for configured username
        const ownerUsername = (process.env.OWNER_USERNAME || 'samu').trim().toLowerCase();
        if (ownerUsername) {
            db.run(
                `UPDATE users SET role = 'owner' WHERE LOWER(username) = ?`,
                [ownerUsername],
                (err) => {
                    if (err) console.error('Error assigning owner role:', err);
                }
            );
        }

        // Create orders table
        db.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                user_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                customer_address TEXT,
                customer_city TEXT,
                customer_zip TEXT,
                service_type TEXT,
                delivery_fee REAL DEFAULT 0,
                payment_method TEXT,
                payment_fee REAL DEFAULT 0,
                payment_status TEXT DEFAULT 'pending',
                packeta_point_json TEXT,
                packeta_tracking_number TEXT,
                status TEXT DEFAULT 'pending',
                total REAL NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) reject(err);
            // Add missing columns if they don't exist (for backward compatibility)
            db.all(`PRAGMA table_info(orders)`, (err, cols) => {
                if (err) {
                    console.error('Failed to read orders table info:', err);
                } else if (Array.isArray(cols)) {
                    const hasCity = cols.some(c => c.name === 'customer_city');
                    const hasZip = cols.some(c => c.name === 'customer_zip');
                    const hasCountry = cols.some(c => c.name === 'country');
                    const hasDeliveryFee = cols.some(c => c.name === 'delivery_fee');
                    const hasPaymentMethod = cols.some(c => c.name === 'payment_method');
                    const hasPaymentFee = cols.some(c => c.name === 'payment_fee');
                    const hasPaymentStatus = cols.some(c => c.name === 'payment_status');
                    const hasPacketa = cols.some(c => c.name === 'packeta_point_json');
                    if (!hasCity) {
                        db.run(`ALTER TABLE orders ADD COLUMN customer_city TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add customer_city column:', alterErr);
                            else console.log('Added missing column customer_city to orders');
                        });
                    }
                    if (!hasZip) {
                        db.run(`ALTER TABLE orders ADD COLUMN customer_zip TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add customer_zip column:', alterErr);
                            else console.log('Added missing column customer_zip to orders');
                        });
                    }
                    if (!hasCountry) {
                        db.run(`ALTER TABLE orders ADD COLUMN country TEXT DEFAULT 'Czech Republic'`, (alterErr) => {
                            if (alterErr) console.error('Failed to add country column:', alterErr);
                            else console.log('Added missing column country to orders');
                        });
                    }
                    if (!hasDeliveryFee) {
                        db.run(`ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0`, (alterErr) => {
                            if (alterErr) console.error('Failed to add delivery_fee column:', alterErr);
                            else console.log('Added missing column delivery_fee to orders');
                        });
                    }
                    if (!hasPaymentMethod) {
                        db.run(`ALTER TABLE orders ADD COLUMN payment_method TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add payment_method column:', alterErr);
                            else console.log('Added missing column payment_method to orders');
                        });
                    }
                    if (!hasPaymentFee) {
                        db.run(`ALTER TABLE orders ADD COLUMN payment_fee REAL DEFAULT 0`, (alterErr) => {
                            if (alterErr) console.error('Failed to add payment_fee column:', alterErr);
                            else console.log('Added missing column payment_fee to orders');
                        });
                    }
                    if (!hasPaymentStatus) {
                        db.run(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'`, (alterErr) => {
                            if (alterErr) console.error('Failed to add payment_status column:', alterErr);
                            else console.log('Added missing column payment_status to orders');
                        });
                    }
                    if (!hasPacketa) {
                        db.run(`ALTER TABLE orders ADD COLUMN packeta_point_json TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add packeta_point_json column:', alterErr);
                            else console.log('Added missing column packeta_point_json to orders');
                        });
                    }
                }
            });
        });

        // Create order items table
        db.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                device TEXT NOT NULL,
                brand TEXT NOT NULL,
                model TEXT NOT NULL,
                repair_type TEXT NOT NULL,
                repair_name TEXT NOT NULL,
                price REAL NOT NULL,
                printer TEXT,
                filament TEXT,
                color TEXT,
                parts INTEGER,
                file_name TEXT,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) reject(err);
            db.all(`PRAGMA table_info(order_items)`, (colsErr, cols) => {
                if (colsErr) {
                    console.error('Failed to read order_items table info:', colsErr);
                } else if (Array.isArray(cols)) {
                    const hasPrinter = cols.some(c => c.name === 'printer');
                    const hasFilament = cols.some(c => c.name === 'filament');
                    const hasColor = cols.some(c => c.name === 'color');
                    const hasParts = cols.some(c => c.name === 'parts');
                    const hasFile = cols.some(c => c.name === 'file_name');
                    if (!hasPrinter) {
                        db.run(`ALTER TABLE order_items ADD COLUMN printer TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add printer column:', alterErr);
                        });
                    }
                    if (!hasFilament) {
                        db.run(`ALTER TABLE order_items ADD COLUMN filament TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add filament column:', alterErr);
                        });
                    }
                    if (!hasColor) {
                        db.run(`ALTER TABLE order_items ADD COLUMN color TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add color column:', alterErr);
                        });
                    }
                    if (!hasParts) {
                        db.run(`ALTER TABLE order_items ADD COLUMN parts INTEGER`, (alterErr) => {
                            if (alterErr) console.error('Failed to add parts column:', alterErr);
                        });
                    }
                    if (!hasFile) {
                        db.run(`ALTER TABLE order_items ADD COLUMN file_name TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add file_name column:', alterErr);
                        });
                    }
                }
            });
        });

        // Create cart table
        db.run(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                device TEXT NOT NULL,
                device_name TEXT NOT NULL,
                brand TEXT NOT NULL,
                brand_name TEXT NOT NULL,
                model TEXT NOT NULL,
                repair_type TEXT NOT NULL,
                repair_name TEXT NOT NULL,
                repair_desc TEXT,
                price REAL NOT NULL,
                printer TEXT,
                filament TEXT,
                color TEXT,
                parts INTEGER,
                file_name TEXT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) reject(err);
            db.all(`PRAGMA table_info(cart_items)`, (colsErr, cols) => {
                if (colsErr) {
                    console.error('Failed to read cart_items table info:', colsErr);
                } else if (Array.isArray(cols)) {
                    const hasPrinter = cols.some(c => c.name === 'printer');
                    const hasFilament = cols.some(c => c.name === 'filament');
                    const hasColor = cols.some(c => c.name === 'color');
                    const hasParts = cols.some(c => c.name === 'parts');
                    const hasFile = cols.some(c => c.name === 'file_name');
                    if (!hasPrinter) {
                        db.run(`ALTER TABLE cart_items ADD COLUMN printer TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add printer column:', alterErr);
                        });
                    }
                    if (!hasFilament) {
                        db.run(`ALTER TABLE cart_items ADD COLUMN filament TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add filament column:', alterErr);
                        });
                    }
                    if (!hasColor) {
                        db.run(`ALTER TABLE cart_items ADD COLUMN color TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add color column:', alterErr);
                        });
                    }
                    if (!hasParts) {
                        db.run(`ALTER TABLE cart_items ADD COLUMN parts INTEGER`, (alterErr) => {
                            if (alterErr) console.error('Failed to add parts column:', alterErr);
                        });
                    }
                    if (!hasFile) {
                        db.run(`ALTER TABLE cart_items ADD COLUMN file_name TEXT`, (alterErr) => {
                            if (alterErr) console.error('Failed to add file_name column:', alterErr);
                        });
                    }
                }
            });
        });

        // Create custom builds table
        db.run(`
            CREATE TABLE IF NOT EXISTS custom_builds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                build_id TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                cpu_id TEXT,
                gpu_id TEXT,
                motherboard_id TEXT,
                ram_id TEXT,
                storage_id TEXT,
                psu_id TEXT,
                case_id TEXT,
                cooler_id TEXT,
                total_price REAL,
                build_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) reject(err);
        });

        // Create admin users table (for multi-user admin)
        db.run(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                permissions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Database tables initialized successfully');
                resolve();
            }
        });

        // Create catalog table (JSON blob for editable catalog data)
        db.run(`
            CREATE TABLE IF NOT EXISTS catalog (
                key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Failed to create catalog table:', err);
            }
        });
    });
}

/**
 * Run database query with promise support
 */
db.runAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

/**
 * Get single row from database
 */
db.getAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

/**
 * Get all rows from database
 */
db.allAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

module.exports = {
    db,
    initializeDatabase
};
