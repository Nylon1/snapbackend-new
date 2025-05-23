require('dotenv').config();
console.log("🔑 SESSION_SECRET is:", process.env.SESSION_SECRET);

const express  = require('express');
const mongoose = require('mongoose');
const session  = require('express-session');
const cors     = require('cors');
const path     = require('path');

// Route imports
const uploadRoute = require('./routes/upload');
const adminController = require('./controllers/adminController');
const adminRoutes   = require('./routes/admin');
const publicRoutes  = require('./routes/public');
const { authenticateAdmin } = require('./middleware/auth');
const { authenticateAdmin } = require('../middleware/auth');

const app = express();

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

// Debug origin
app.use((req, res, next) => {
  console.log('🔍 Request Origin:', req.headers.origin);
  next();
});

// Body parsers and session
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Mount routes
app.use(uploadRoute); // handles GET/POST /upload
app.post('/admin/login', adminController.login);           // public login
app.use('/admin', authenticateAdmin, adminRoutes);          // protected admin APIs
app.use('/public', publicRoutes);                           // public content APIs

// Serve static files for admin UI
app.use(express.static(path.join(__dirname, 'public')));

// Admin UI routes
const ui = path.join(__dirname, 'public');
app.get(['/', '/dashboard'],   (req, res) => res.sendFile(path.join(ui, 'admin-dashboard.html')));
app.get('/content',             (req, res) => res.sendFile(path.join(ui, 'admin-content.html')));
app.get('/analytics',           (req, res) => res.sendFile(path.join(ui, 'admin-analytics.html')));
app.get('/create',              (req, res) => res.sendFile(path.join(ui, 'admin-create.html')));
app.get('/login',               (req, res) => res.sendFile(path.join(ui, 'admin-login.html')));

// CORS test
app.get('/cors-check', (req, res) => res.json({ message: 'CORS OK' }));

// Mongo & start
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB error:', err));

