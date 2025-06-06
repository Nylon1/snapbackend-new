// src/routes/voteRoutes.js
console.log('🔌 voteRoutes.js loaded');

const express = require('express');
const router  = express.Router();
const Vote    = require('../models/Vote');

// ─────────── POST /api/votes ───────────
router.post('/', async (req, res) => {
  console.log('📩 POST /api/votes body:', req.body);
  const { videoId, vote } = req.body;
  if (typeof videoId !== 'string' || typeof vote !== 'string') {
    return res.status(400).json({ error: '`videoId` and `vote` must be strings.' });
  }
  const valid = ['verified','fake','satire','context'];
  if (!valid.includes(vote)) {
    return res.status(400).json({ error: `vote must be one of: ${valid.join(', ')}` });
  }

  try {
    const updatedDoc = await Vote.findOneAndUpdate(
      { videoId },
      { $inc: { [vote]: 1 } },
      { new: true, upsert: true }
    ).exec();

    const counts = {
      verified: updatedDoc.verified,
      fake:     updatedDoc.fake,
      satire:   updatedDoc.satire,
      context:  updatedDoc.context,
    };
    const total = counts.verified + counts.fake + counts.satire + counts.context;
    if (total === 0) {
      return res.json({ verified: 0, fake: 0, satire: 0, context: 0 });
    }
    const percentages = {
      verified: Math.round((counts.verified / total) * 100),
      fake:     Math.round((counts.fake     / total) * 100),
      satire:   Math.round((counts.satire   / total) * 100),
      context:  Math.round((counts.context  / total) * 100),
    };
    return res.json(percentages);
  } catch (err) {
    console.error('Error in POST /api/votes:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────── GET /api/votes/:videoId ───────────
router.get('/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  try {
    const doc = await Vote.findOne({ videoId }).exec();
    if (!doc) {
      // No votes yet: return all zeros
      return res.json({ verified: 0, fake: 0, satire: 0, context: 0 });
    }
    const counts = {
      verified: doc.verified,
      fake:     doc.fake,
      satire:   doc.satire,
      context:  doc.context,
    };
    const total = counts.verified + counts.fake + counts.satire + counts.context;
    if (total === 0) {
      return res.json({ verified: 0, fake: 0, satire: 0, context: 0 });
    }
    const percentages = {
      verified: Math.round((counts.verified / total) * 100),
      fake:     Math.round((counts.fake     / total) * 100),
      satire:   Math.round((counts.satire   / total) * 100),
      context:  Math.round((counts.context  / total) * 100),
    };
    return res.json(percentages);
  } catch (err) {
    console.error('Error in GET /api/votes/:videoId:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
