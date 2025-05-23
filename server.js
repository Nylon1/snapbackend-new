require('dotenv').config();
console.log("🔑 SESSION_SECRET is:", process.env.SESSION_SECRET);

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const cors       = require('cors');
const path       = require('path');

// Import controllers and routes
const adminController    = require('./server/controllers/adminController');
const adminRoutes        = require('./server/routes/admin');
const publicRoutes       = require('./server/routes/public');
const { authenticateAdmin } = require('./server/middleware/auth');

const app = express();

// 🔥 Enable CORS globally — must come before mounting any routes
app.use(cors({
  origin: [
    'https://snap-news-admin-panel-1234.onrender.com',
   
    'http://localhost:5173',
    'https://snap-news.onrender.com',
    'https://snapbackend-new.onrender.com'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.options('*', cors());

// Debug origin logging
app.use((req, res, next) => {
  console.log('🔍 Request Origin:', req.headers.origin);
  next();
});

// Serve static admin UI files
app.use(express.static(path.join(__dirname, 'server', 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Body parsers and session
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Public (no auth) login route
app.post('/admin/login', adminController.login);

// Protected admin API routes
app.use('/admin', authenticateAdmin, adminRoutes);

// Public content API routes
app.use('/public', publicRoutes);

// Admin UI pages
const ui = path.join(__dirname, 'server', 'public');
app.get(['/', '/dashboard'],   (req, res) => res.sendFile(path.join(ui, 'admin-dashboard.html')));
app.get('/content',             (req, res) => res.sendFile(path.join(ui, 'admin-content.html')));
app.get('/analytics',           (req, res) => res.sendFile(path.join(ui, 'admin-analytics.html')));
app.get('/create',              (req, res) => res.sendFile(path.join(ui, 'admin-create.html')));
app.get('/login',               (req, res) => res.sendFile(path.join(ui, 'admin-login.html')));

// CORS test endpoint
app.get('/cors-check', (req, res) => {
  res.json({ message: 'CORS is working ✅' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


