# EzFix Desktop App (All-in-One Guide)

This desktop app is an Electron admin panel for EzFix orders, inventory, exports, and notifications.

## Quick Answer: API, Username, Password

- API URL default in desktop app:
  - `https://api.ezfix.cz/api`
  - You can change it on the login screen (`API adresa`).
- Username and password are NOT hardcoded in this desktop app.
- They come from your backend user database.

If you do not know login credentials, use backend bootstrap admin variables.

## Where credentials come from

Backend supports one-time bootstrap admin creation via environment variables:

- `BOOTSTRAP_ADMIN_USERNAME` (default fallback: `admin`)
- `BOOTSTRAP_ADMIN_PASSWORD` (you must set this)

Relevant backend reference files:

- `backend/.env.example`
- `backend/README.md`
- `backend/config/database.js`

What happens:

1. On backend start, if `BOOTSTRAP_ADMIN_PASSWORD` exists, backend ensures/updates a manager user.
2. Username is `BOOTSTRAP_ADMIN_USERNAME` (or fallback `admin`).
3. You log in from desktop app using that username/password.

## Step-by-Step: Run Desktop App

1. Open terminal in this folder:
  - `cd /workspaces/WEBDONE/desktop-ez-app`
2. Install dependencies:
  - `npm install`
3. Start app:
  - `npm start`
4. Login in app:
  - API adresa: `https://api.ezfix.cz/api` (or your own backend URL)
  - Username: backend user (for example bootstrap admin username)
  - Password: matching backend password

## Step-by-Step: Build Windows .exe

Recommended: build on Windows host.

1. Open terminal in `desktop-ez-app`.
2. Install dependencies:
  - `npm install`
3. Build installer:
  - `npm run dist`
4. Find output in:
  - `desktop-ez-app/dist`

## API Endpoints required by desktop app

- `POST /auth/login`
- `GET /auth/me`
- `GET /orders`
- `GET /orders/:id`
- `GET /catalog`
- `PUT /catalog`

## Features included

- Orders list with filters and inline detail drawer
- CSV and XLSX export
- Inventory edit mode with save to API
- Notification settings (interval, toggle, sound)
- Czech UI labels and EzFix branding
