const express = require('express');
const router = express.Router();
const axios = require('axios');

// /watch/:token
router.get('/:token', async (req, res) => {
  const token = req.params.token;

  try {
    // Replace with your MediaCMS URL and any required auth
    const response = await axios.get(
      `https://mediacms-cw-u46015.vm.elestio.app/api/v1/media/${token}`
    );
    const video = response.data;

    if (!video) {
      return res.status(404).render('404', { message: 'Snap not found' });
    }

    res.render('watch', {
      filename: token,
      videoPath: video.file, // or whatever field is correct
      previewImage: video.thumbnail_url,
      video // pass the whole video object if you want
    });

  } catch (error) {
    console.error(error.message);
    return res.status(404).render('404', { message: 'Snap not found' });
  }
});

module.exports = router;

