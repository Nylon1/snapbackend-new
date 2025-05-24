const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const Content = require('../models/Content');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

router.post('/', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Grab the first file under whatever field name your front end uses
    const key  = Object.keys(req.files)[0];
    const file = req.files[key];

    // Move file into uploads folder
    const filename = `${Date.now()}-${file.name}`;
    await file.mv(path.join(uploadDir, filename));

    // Save to DB
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
