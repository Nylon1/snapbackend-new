require('dotenv').config();
console.log("🔑 SESSION_SECRET is:", process.env.SESSION_SECRET);

const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const session  = require('express-session');
const path     = require('path');

// Route & controller imports
const uploadRoute     = require('./routes/upload');
const adminController = require('./controllers/adminController');
const adminRoutes     = require('./routes/admin');
const publicRoutes    = require('./routes/public');
const { authenticateAdmin } = require('./middleware/auth');

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

// Parse bodies and sessions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Mount routes in order
app.use(uploadRoute);                    // handles GET/POST /upload
app.post('/admin/login', adminController.login);
app.use('/admin', authenticateAdmin, adminRoutes);
app.use('/public', publicRoutes);

// Serve admin UI
app.use(express.static(path.join(__dirname, 'public')));
const ui = path.join(__dirname, 'public');
app.get(['/', '/dashboard'], (req, res) => res.sendFile(path.join(ui, 'admin-dashboard.html')));
app.get('/content',      (req, res) => res.sendFile(path.join(ui, 'admin-content.html')));
app.get('/analytics',    (req, res) => res.sendFile(path.join(ui, 'admin-analytics.html')));
app.get('/create',       (req, res) => res.sendFile(path.join(ui, 'admin-create.html')));
app.get('/login',        (req, res) => res.sendFile(path.join(ui, 'admin-login.html')));

// Start the server after DB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected');
  const PORT = process.env.PORT || 3000;

  // Expose all registered routes at GET /routes
  app.get('/routes', (req, res) => {
    const routes = app._router.stack
      .filter(layer => layer.route)           // only entries with a route
      .map(layer => {
        const methods = Object.keys(layer.route.methods)
          .map(m => m.toUpperCase());
        return { path: layer.route.path, methods };
      });
    res.json(routes);
  });

  // Now start listening
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB error:', err);
});
