# EzFix Backend API

Node.js + Express backend for the EzFix repair services platform.

## Features

- ✅ User Authentication (Register/Login with JWT)
- ✅ Shopping Cart Management
- ✅ Order Processing
- ✅ Admin Dashboard & User Management
- ✅ Services/Repairs Catalog
- ✅ Custom PC Builder with Component Library
- ✅ SQLite Database with Persistent Storage
- ✅ Password Hashing with bcryptjs
- ✅ Input Validation
- ✅ Role-Based Access Control

## Installation

1. Install dependencies:
```bash
npm install
```

2. Environment Configuration (`.env`):
```
PORT=3000
NODE_ENV=development
DB_PATH=./database/ezfix.db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:8000
```

## Running the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/logout` - Logout

### Cart (`/api/cart`)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:itemId` - Remove item from cart
- `DELETE /api/cart` - Clear entire cart

### Orders (`/api/orders`)
- `GET /api/orders` - Get orders (user-specific or all for admin)
- `GET /api/orders/:orderId` - Get specific order with items
- `POST /api/orders` - Create order from cart
- `PATCH /api/orders/:orderId` - Update order status (admin only)
- `DELETE /api/orders/:orderId` - Delete order (admin only)

### Admin (`/api/admin`)
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create new admin user (admin only)
- `POST /api/admin/users/:userId/password` - Reset user password (admin only)
- `DELETE /api/admin/users/:userId` - Delete user (admin only)
- `GET /api/admin/stats` - Get platform statistics (admin only)

### Services (`/api/services`)
- `GET /api/services` - Get all available services
- `GET /api/services/:deviceType` - Get repairs for specific device

### Custom PC Builds (`/api/builds`)
- `GET /api/builds/parts` - Get available PC components
- `GET /api/builds` - Get user's saved builds
- `GET /api/builds/:buildId` - Get specific build
- `POST /api/builds` - Save new build
- `PATCH /api/builds/:buildId` - Update build
- `DELETE /api/builds/:buildId` - Delete build

### Health (`/api/health`)
- `GET /api/health` - Check server status

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - User email
- `password_hash` - Hashed password
- `role` - 'customer' or 'admin'
- `created_at`, `updated_at` - Timestamps

### Orders Table
- `id` - Primary key
- `order_number` - Unique order identifier (EZF-timestamp)
- `user_id` - Foreign key to users
- `status` - Order status (pending, completed, etc.)
- `total` - Order total with pickup fee
- `device_type`, `brand`, `model` - Device info
- `repair_type`, `description` - Repair details
- `created_at`, `updated_at` - Timestamps

### Cart Items Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `device_type`, `brand`, `model` - Device info
- `repair_type`, `price` - Repair details
- `quantity` - Item quantity
- `added_at` - Timestamp

### Custom Builds Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `name` - Build name
- `description` - Build description
- `parts_json` - JSON of selected components
- `total_price` - Total build cost
- `created_at`, `updated_at` - Timestamps

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. User registers/logs in → receives JWT token
2. Token stored in frontend (localStorage)
3. Include token in `Authorization: Bearer <token>` header for protected routes
4. Token expires after 7 days (configurable)

## Error Handling

All endpoints return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Security Features

- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ Environment variables for sensitive data
- ✅ Input validation on all endpoints
- ✅ CORS protection
- ✅ Role-based access control
- ✅ Foreign key constraints for data integrity
- ✅ User ownership verification

## Development Notes

- All routes use async/await with proper error handling
- Database queries wrapped in Promise helpers for consistency
- Middleware stacking for authentication and error handling
- Modular route structure for maintainability
- Comprehensive JSDoc comments on all functions

## Next Steps

1. Connect frontend to backend API
2. Update script.js to make HTTP requests instead of using localStorage
3. Deploy to production server
4. Configure production environment variables
5. Set up SSL/HTTPS
6. Add additional validation and security measures
