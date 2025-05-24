// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Ensure the uploads directory exists at project root
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure the uploads directory exists at project root (e.g., './uploads')
const uploadDir = path.join(__dirname, '../uploads');

// Configure storage and file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter: accept images and videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Import the Content model (filename is 'Content.js', so use correct case)
const Content = require('../models/Content');

// POST /upload
router.post('/', upload.single('video'), (req, res) => {
  console.log('Received Multer files:', req.files);
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const file = req.files[0];
  // existing logic, but use `file` instead of req.file…
});


    const newContent = new Content({
      title: req.body.title || req.file.originalname,
      filePath: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      createdBy: req.user?.id || null
    });

    await newContent.save();
    res.status(201).json({ success: true, content: newContent });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
