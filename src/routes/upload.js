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

// Multer storage & filter (you can re-add fileFilter if you like)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// — Explicitly accept one file under the 'video' field name —
router.post(
  '/', 
  upload.fields([{ name: 'video', maxCount: 1 }]),
  async (req, res) => {
    try {
      const fileArr = req.files.video;
      if (!fileArr || fileArr.length === 0) {
        return res.status(400).json({ success: false, message: 'No video file uploaded' });
      }
      const file = fileArr[0];

      // Save metadata
      const newContent = new Content({
        title:     req.body.title  || file.originalname,
        filePath:  `/uploads/${file.filename}`,
        mimeType:  file.mimetype,
        createdBy: req.user?.id || null
      });
      await newContent.save();

      res.status(201).json({ success: true, content: newContent });
    } catch (err) {
      console.error('🛑 Upload handler error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
