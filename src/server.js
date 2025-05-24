require('dotenv').config();
console.log('📍 Loaded server.js from:', __filename);

console.log("🔑 SESSION_SECRET is:", process.env.SESSION_SECRET);

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const session  = require('express-session');
const path     = require('path');

// Route & controller imports
const uploadRoute     = require('../routes/upload');
const adminController = require('../controllers/adminController');
const adminRoutes     = require('../routes/admin');
const publicRoutes    = require('../routes/public');
const { authenticateAdmin } = require('../middleware/auth');

const app = express();
const fileUpload = require('express-fileupload');
app.use(fileUpload());  // enable express-fileupload


// Global CORS
app.use(cors({
  origin: [
    'https://snap-news.onrender.com',
    'https://snapbackend-new.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.options('*', cors());

// Parse bodies and sessions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
// 1) Health check
app.get('/health', (req, res) => res.send('OK'));

// RIGHT after your health check in src/server.js:
const fs         = require('fs');

const fileUpload = require('express-fileupload');
const Content    = require('../models/Content');

// enable file uploads
app.use(fileUpload());

// ensure uploads dir exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// inline POST /upload handler
app.post('/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // pick the first file under any field name
    const key      = Object.keys(req.files)[0];
    const file     = req.files[key];
    const filename = `${Date.now()}-${file.name}`;

    // move file to disk
    await file.mv(path.join(uploadDir, filename));

    // save metadata in Mongo
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
