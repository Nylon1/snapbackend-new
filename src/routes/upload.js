const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Multer setup (videos only, 200MB max)
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

// Helper: Get JWT token from MediaCMS
async function getMediaCMSJwt() {
  const LOGIN_URL = 'https://mediacms-cw-u46015.vm.elestio.app/api/v1/login';
  const TOKEN_URL = 'https://mediacms-cw-u46015.vm.elestio.app/api/v1/user/token';

  const username = process.env.MEDIACMS_ADMIN_USER;
  const password = process.env.MEDIACMS_ADMIN_PASSWORD;

  // 1. Login for session cookie
  const loginRes = await axios.post(LOGIN_URL, { username, password }, { withCredentials: true });
  const cookies = loginRes.headers['set-cookie'];
  if (!cookies) throw new Error('Failed to get login cookies from MediaCMS');

  // 2. Use cookie to get JWT
  const tokenRes = await axios.get(TOKEN_URL, { headers: { Cookie: cookies.join(';') } });
  if (!tokenRes.data.token) throw new Error('Failed to obtain JWT from MediaCMS');
  return tokenRes.data.token;
}

// Main route: Proxy upload to MediaCMS
router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).send('No video uploaded.');

  const { title, description, category } = req.body;
  try {
    // A. Get JWT token
    const jwt = await getMediaCMSJwt();

    // B. Prepare FormData with proper filename!
    const form = new FormData();
    form.append('media_file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
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

    // D. Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.status(201).json({ success: true, detail: 'Video uploaded successfully!', mcms: uploadRes.data });
  } catch (err) {
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

module.exports = router;
