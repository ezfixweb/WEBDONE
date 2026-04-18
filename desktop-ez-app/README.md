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

Installer/uninstaller improvements already enabled:

- selectable install directory
- desktop and start-menu shortcuts
- uninstall entry name is clear (`EzFix Manager`)
- app data cleanup on uninstall

## Auto-update from GitHub releases

This app is configured to check updates after startup and periodically while running.

When a newer GitHub release exists:

1. app downloads the update automatically in background
2. update installs automatically on next app restart/close

For end users this is simple: install once, then just use the app and restart it normally.

### How to publish an update (maintainer)

1. Increase version in `desktop-ez-app/package.json`.
2. Commit and push the version change.
3. On Windows in `desktop-ez-app`, set GitHub token for publishing:
  - CMD: `set GH_TOKEN=your_github_token`
  - PowerShell: `$env:GH_TOKEN="your_github_token"`
4. Build and publish release assets:
  - `npm install`
  - `npm run dist:publish`

Important:

- `GH_TOKEN` must have repo release permissions.
- If you only run `npm run dist`, it builds installer locally but does not publish updates.

## Troubleshooting: winCodeSign / symbolic link error on Windows

If you see an error like `Cannot create symbolic link` or `exit status 2` while building:

1. Close the terminal.
2. Open a new terminal as Administrator.
3. Remove broken electron-builder cache:
  - `rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"`
4. Disable auto code-sign lookup for local builds:
  - CMD: `set CSC_IDENTITY_AUTO_DISCOVERY=false`
  - PowerShell: `$env:CSC_IDENTITY_AUTO_DISCOVERY="false"`
5. Run build again:
  - `npm run dist`

Notes:

- This project now uses `signAndEditExecutable: false` for Windows build to reduce signing-related failures on local machines.
- If your company requires signed executables, use a proper code-sign certificate in CI/release workflow.

## API Endpoints required by desktop app

- `POST /auth/login`
- `GET /auth/me`
- `GET /orders`
- `GET /orders/:id`
- `GET /catalog`
- `PUT /catalog`
- `GET /admin/users` (owner)
- `POST /admin/users` (owner)

## Features included

- Orders list with filters and inline detail drawer
- Full-screen order detail panel (Celá obrazovka)
- Order status change directly from desktop (`PATCH /orders/:id`)
- Status change uses backend flow that sends customer status email
- CSV and XLSX export
- Inventory edit mode with save to API
- User management tab for creating additional login accounts (owner only)
- One-click delete user action in User management (owner only)
- Notification settings (interval, toggle, sound)
- Czech UI labels and EzFix branding
