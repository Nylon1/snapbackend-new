// routes/upload.js
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const Content = require('../models/Content');

// Ensure uploads dir
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// POST /upload
router.post('/', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Grab whichever file was sent
    const fileKey = Object.keys(req.files)[0];
    const file    = req.files[fileKey];

    // Move to uploads folder
    const filename = `${Date.now()}-${file.name}`;
    await file.mv(path.join(uploadDir, filename));

    // Save to Mongo
    const newContent = new Content({
      title:     req.body.title || file.name,
      filePath:  `/uploads/${filename}`,
      mimeType:  file.mimetype,
      createdBy: req.user?.id || null
    });
    await newContent.save();

    return res.status(201).json({ success: true, content: newContent });
  } catch (err) {
    console.error('🛑 Upload handler error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

