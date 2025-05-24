const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');

router.get('/watch/:filename', (req, res) => {
  const filename = req.params.filename;

  const filePath = path.join(uploadsPath, filename);

  // Check if video exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).render('404', { message: 'Snap not found' });
  }

  const fullVideoURL = `/uploads/${filename}`;
  const staticPreviewImage = `/assets/preview.png`; // Placeholder, replace later

  res.render('watch', {
    filename,
    videoPath: fullVideoURL,
    previewImage: staticPreviewImage
  });
});

module.exports = router;
