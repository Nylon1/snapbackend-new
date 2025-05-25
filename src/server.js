// src/server.js

require('dotenv').config();
console.log('📍 Loaded server.js from:', __filename);
console.log('🔑 SESSION_SECRET is:', process.env.SESSION_SECRET);

const express      = require('express');
const cors         = require('cors');
const mongoose     = require('mongoose');
const session      = require('express-session');
const path         = require('path');
const fs           = require('fs');
const fileUpload   = require('express-fileupload');
const MongoStore   = require('connect-mongo');
const cookieParser = require('cookie-parser');
const { authenticateAdmin }   = require('./middleware/auth');
const { listPendingContent }  = require('./controllers/adminController');
const adminController         = require('./controllers/adminController');
const app = express();

// Global CORS
// Define your CORS settings once
const corsOptions = {
  origin: [
    'https://snap-news.onrender.com',
    'https://snapbackend-new.onrender.com',
    'https://snap-news-admin-panel-1234.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
};

// Apply CORS globally
app.use(cors(corsOptions));
// Answer preflights for every route
app.options('*', cors(corsOptions));

// Explicit CORS + auth for pending-content
app.get(
  '/admin/pending-content',
  cors(corsOptions),        // ← applies CORS headers to the GET
  authenticateAdmin,        // ← then enforce auth
  listPendingContent        // ← finally call your controller
);


// Parse JSON bodies and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 0️⃣ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Configure EJS view engine
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// Enable file uploads
app.use(fileUpload());




// 1️⃣ Parse cookies
app.use(cookieParser());

// 2️⃣ Session middleware (v4+ connect-mongo)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 60 * 60 * 24,      // 1 day in seconds
      autoRemove: 'native'
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'none',                   // allow cross-site
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24         // 1 day in milliseconds
    }
  })
);

// 3️⃣ Static assets
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 4️⃣ Health check
app.get('/health', (req, res) => res.send('OK'));

app.get('/upload', (req, res) => {
  res.render('upload');
});

// 5️⃣ Inline upload endpoint
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

// 6️⃣ Feed & watch routes
app.get('/feed', require('./routes/feedRoute'));
app.get('/watch/:filename', require('./routes/watchRoute'));

// 7️⃣ Admin & public endpoints

const adminRoutes        = require('./routes/admin');
const publicRoutes       = require('./routes/public');


app.post('/admin/login', adminController.login);
app.use('/admin', authenticateAdmin, adminRoutes);
app.use('/public', publicRoutes);

// 8️⃣ Debug: list mounted routes
app.get('/routes', (req, res) => {
  const routes = app._router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).map(m => m.toUpperCase())
    }));
  res.json(routes);
});

console.log('—— MOUNTED ROUTES ——');
app._router.stack
  .filter(layer => layer.route)
  .forEach(layer =>
    console.log(
      Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(','),
      layer.route.path
    )
);

// 9️⃣ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
