const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Multer config: video files only, max 200MB
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Proxy POST route
router.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).send('No video uploaded.');

  // Get title, description, category from the form (optional)
  const { title, description, category } = req.body;

  try {
    // 1. Get MediaCMS token
    const tokenRes = await axios.post(
      'https://snapbackend-new.onrender.com/api/mediacms-token'
    );
    const token = tokenRes.data.token;
    if (!token) throw new Error('Failed to get MediaCMS token.');

    // 2. Prepare FormData for MediaCMS
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), req.file.originalname);
    if (title) form.append('title', title);
    if (description) form.append('description', description);
    if (category) form.append('category', category);

    // 3. Upload to MediaCMS
    const mcmsRes = await axios.post(
      'https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    // 4. Clean up (delete file)
    fs.unlink(req.file.path, () => {});

    // 5. Success
    res.send('Video uploaded successfully! (pending admin approval)');
  } catch (err) {
    // Delete file if something fails
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    // Multer file size or type error
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('File too large. Max 200MB allowed.');
      }
      return res.status(400).send('Upload error: ' + err.message);
    }
    // Other errors
    console.error('Upload error:', err.response?.data || err.message);
    res.status(500).send('Failed to upload: ' + (err.response?.data?.detail || err.message));
  }
});

module.exports = router;
