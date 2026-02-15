/**
 * Upload Routes (admin only)
 * POST /api/uploads - Upload an image to assets/uploads
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { verifyToken, verifyManager } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', '..', 'assets', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeBase = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 60);
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        const stamp = Date.now();
        cb(null, `${safeBase}_${stamp}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', verifyToken, verifyManager, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const relativePath = `/assets/uploads/${req.file.filename}`;
    res.json({ success: true, url: relativePath });
});

module.exports = router;
