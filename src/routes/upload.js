// routes/upload.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const Content = require('../models/Content');

// Ensure uploads dir
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Multer setup (no fileFilter, just accept anything for debug)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// DEBUG: accept any files and log them
router.post('/', upload.any(), async (req, res) => {
  console.log('🛠️ Multer saw fields:', Object.keys(req.body), 'files:', req.files.map(f => f.fieldname));
  
  // If you want to short-circuit here:
  if (req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'Multer saw no files' });
  }

  // For now, just return that debug info
  return res.json({ success: true, files: req.files.map(f => ({ field: f.fieldname, original: f.originalname })) });
});

module.exports = router;
