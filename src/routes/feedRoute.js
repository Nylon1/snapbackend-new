const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const Content = require('../models/Content'); // MongoDB Content model

const uploadsPath = path.join(__dirname, '..', 'public', 'uploads');

router.get('/feed', async (req, res) => {
  const now = Date.now();
  const cutoff = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    // 🧹 1. Find and delete expired videos from disk + DB
    const expiredVideos = await Content.find({ createdAt: { $lt: cutoff } });

    for (const video of expiredVideos) {
      const filePath = path.join(uploadsPath, path.basename(video.videoUrl));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await Content.findByIdAndDelete(video._id);
    }

    // 📦 2. Fetch approved videos
    const approvedVideos = await Content.find({ status: 'approved' }).sort({ createdAt: -1 });

    // ⏳ 3. Add expiresAt timestamp
    const enrichedVideos = approvedVideos.map(video => ({
      ...video.toObject(),
      expiresAt: new Date(video.createdAt.getTime() + 24 * 60 * 60 * 1000)
    }));

    // 🎥 4. Render to EJS
    res.render('feed', { videos: enrichedVideos });

  } catch (err) {
    console.error('❌ Error loading feed:', err.message);
    res.status(500).send('Server error loading feed.');
  }
});

module.exports = router;
