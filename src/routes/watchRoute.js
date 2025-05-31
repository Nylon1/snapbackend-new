const express = require('express');
const axios = require('axios');
const router = express.Router();

// MediaCMS base API URL
const MEDIACMS_API = 'https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/';

router.get('/:filename', async (req, res) => {
  try {
    // Fetch video details from MediaCMS
    const { data: video } = await axios.get(MEDIACMS_API + req.params.filename);

    // If no video, show 404
    if (!video) return res.status(404).render('404', { message: 'Snap not found' });

    // Render the EJS template, passing video info
    res.render('watch', {
      video: {
        title: video.title,
        description: video.description,
        file: video.file, // This may be a direct MP4 URL or streaming URL
        thumbnail_url: video.thumbnail_url,
        friendly_token: video.friendly_token,
        add_date: video.add_date
      }
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).render('404', { message: 'Snap not found' });
    }
    console.error('MediaCMS fetch error:', err.message || err);
    res.status(500).render('500', { message: 'Server error' });
  }
});

module.exports = router;

