const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/feed', async (req, res) => {
  try {
    // 1. Fetch recent videos from MediaCMS (last 24 hours)
    const response = await axios.get('https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/', {
      params: {
        ordering: '-add_date',
        limit: 50
      }
    });

    // Filter to videos only from the last 24 hours
    const now = Date.now();
    const videos = (response.data.results || []).filter(v => 
      new Date(v.add_date).getTime() > now - 24 * 60 * 60 * 1000
    );

    return res.render('feed', { videos });

  } catch (err) {
    console.error('❌ Error loading feed:', err?.response?.data || err);
    return res.status(500).send('Server error loading feed.');
  }
});

module.exports = router;

