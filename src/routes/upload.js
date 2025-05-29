const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 1️⃣ Multer config (video files only, max 200MB)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// 2️⃣ Helper: Login to MediaCMS and get JWT
async function getMediaCMSJwt() {
  const LOGIN_URL = 'https://mediacms-cw-u46015.vm.elestio.app/api/v1/login';
  const TOKEN_URL = 'https://mediacms-cw-u46015.vm.elestio.app/api/v1/user/token';

  // These should be kept secret (env var!)
  const username = process.env.MEDIACMS_ADMIN_USER || 'admin';
  const password = process.env.MEDIACMS_ADMIN_PASSWORD || 'your_password_here';

  // 1. Login to get session cookie
  const loginRes = await axios.post(
    LOGIN_URL,
    { username, password },
    { withCredentials: true }
  );
  const cookies = loginRes.headers['set-cookie'];
  if (!cookies) throw new Error('Failed to get login cookies from MediaCMS');

  // 2. Get JWT using session cookie
  const tokenRes = await axios.get(
    TOKEN_URL,
    { headers: { Cookie: cookies.join(';') } }
  );
  if (!tokenRes.data.token) throw new Error('Failed to obtain JWT from MediaCMS');
  return tokenRes.data.token;
}

// 3️⃣ The Main Proxy Upload Handler
router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).send('No video uploaded.');

  const { title, description, category } = req.body;

  try {
    // A. Get JWT from MediaCMS
    const jwt = await getMediaCMSJwt();

    // B. Prepare FormData
    const form = new FormData();
    form.append('media_file', fs.createReadStream(req.file.path), req.file.originalname);
    if (title) form.append('title', title);
    if (description) form.append('description', description);
    if (category) form.append('category', category);

    // C. Upload to MediaCMS
    const uploadRes = await axios.post(
      'https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${jwt}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // D. Delete temp file
    fs.unlink(req.file.path, () => {});

    // E. Success
    res.status(201).json({ success: true, detail: 'Video uploaded successfully!', mcms: uploadRes.data });
  } catch (err) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

module.exports = router;
