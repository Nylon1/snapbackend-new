const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const Content = require('../models/Content');

// ** point to the real uploads directory **
const uploadsPath = path.join(__dirname, '..', 'uploads');

router.get('/feed', async (req, res) => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // 1) Clean up expired
    const expiredVideos = await Content.find({ createdAt: { $lt: cutoff } });
    for (let vid of expiredVideos) {
      // pick whichever field stores the file URL
      const relPath = vid.videoUrl || vid.filePath;
      if (relPath) {
        // strip off any leading slash
        const filename = path.basename(relPath);
        const fullPath = path.join(uploadsPath, filename);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
      await Content.deleteOne({ _id: vid._id });
    }

    // 2) Fetch approved
    const approvedVideos = await Content
      .find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .lean();

    // 3) Enrich with expiresAt
    const videos = approvedVideos.map(v => ({
      ...v,
      expiresAt: new Date(v.createdAt.getTime() + 24 * 60 * 60 * 1000)
    }));

    // 4) Render feed.ejs
    return res.render('feed', { videos });

  } catch (err) {
    console.error('❌ Error loading feed:', err);
    return res.status(500).send('Server error loading feed.');
  }
});

module.exports = router;
