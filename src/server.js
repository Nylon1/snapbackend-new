require('dotenv').config();
console.log('📍 Loaded server.js from:', __filename);

console.log("🔑 SESSION_SECRET is:", process.env.SESSION_SECRET);

const express      = require('express');
const cors         = require('cors');
const mongoose     = require('mongoose');
const session      = require('express-session');
const path         = require('path');
const fs           = require('fs');
const fileUpload   = require('express-fileupload');
const { authenticateAdmin } = require('./auth');


// Configure EJS view engine
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Enable file uploads (express-fileupload)
app.use(fileUpload());

// Global CORS
app.use(cors({
  origin: [
    'https://snap-news.onrender.com',
    'https://snapbackend-new.onrender.com',
    'https://snap-news-admin-panel-1234.onrender.com', // ← comma added here
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true        // ← allows cookies/auth headers
}));

app.options('*', cors());

// Body parsing & sessions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Serve static files (public assets)
app.use(express.static(path.join(__dirname, '../public')));

// 1) Health check
app.get('/health', (req, res) => res.send('OK'));

// 2) Inline upload endpoint
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.post('/upload', async (req, res) => {
  try {
    if (!req.files || !Object.keys(req.files).length) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const key      = Object.keys(req.files)[0];
    const file     = req.files[key];
    const filename = `${Date.now()}-${file.name}`;
    const filePath = `/uploads/${filename}`;

    await file.mv(path.join(uploadDir, filename));

    const Content = require('./models/Content');
    const newContent = new Content({
      title:     req.body.title || file.name,
      filePath,
      videoUrl:  filePath,
      mimeType:  file.mimetype,
      createdBy: req.user?.id || null
    });
    await newContent.save();

    res.status(201).json({ success: true, content: newContent });
  } catch (err) {
    console.error('🛑 Upload handler error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3) Feed route — render feed.ejs with approved videos
app.get('/feed', require('./routes/feedRoute'));

// 4) Watch route — render watch.ejs for individual video
app.get('/watch/:filename', require('./routes/watchRoute'));

// 5) Admin and public routes
const adminController = require('./controllers/adminController');
const adminRoutes     = require('./routes/admin');
const publicRoutes    = require('./routes/public');
const { authenticateAdmin } = require('./middleware/auth');

app.post('/admin/login', adminController.login);
app.use('/admin', authenticateAdmin, adminRoutes);
app.use('/public', publicRoutes);

// 6) Debug: list mounted routes
app.get('/routes', (req, res) => {
  const routes = app._router.stack
    .filter(layer => layer.route)
    .map(layer => ({ path: layer.route.path, methods: Object.keys(layer.route.methods).map(m => m.toUpperCase()) }));
  res.json(routes);
});

console.log('—— MOUNTED ROUTES ——');
app._router.stack
  .filter(layer => layer.route)
  .forEach(layer => console.log(Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(','), layer.route.path));

// Start server after DB connect
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB error:', err));
