// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure storage and file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Use timestamp + original name to avoid collisions
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// File filter (optional): accept only certain MIME types
const fileFilter = (req, file, cb) => {
  // Example: only images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Mongoose model (adjusted path to root models)
const Content = require('../models/content');
