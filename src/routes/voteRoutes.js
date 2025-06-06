// src/routes/voteRoutes.js
const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote'); // adjust path if your structure differs

/**
 * POST /api/votes
 * Body: { videoId: String, vote: String }
 * - vote must be one of: "verified", "fake", "satire", "context"
 * 
 * Responds with JSON:
 *   { verified: <int%>, fake: <int%>, satire: <int%>, context: <int%> }
 */
router.post('/', async (req, res) => {
  try {
    const { videoId, vote } = req.body;

    // 1) Basic validation
    if (typeof videoId !== 'string' || typeof vote !== 'string') {
      return res
        .status(400)
        .json({ error: '`videoId` and `vote` are both required strings.' });
    }

    const validCategories = ['verified', 'fake', 'satire', 'context'];
    if (!validCategories.includes(vote)) {
      return res
        .status(400)
        .json({ error: `\`vote\` must be one of: ${validCategories.join(', ')}` });
    }

    // 2) Atomically increment the chosen counter (and upsert if doc doesn't exist)
    const updatedDoc = await Vote.findOneAndUpdate(
      { videoId },
      { $inc: { [vote]: 1 } },
      { new: true, upsert: true }
    ).exec();

    // 3) Read back the four counters
    const counts = {
      verified: updatedDoc.verified,
      fake:     updatedDoc.fake,
      satire:   updatedDoc.satire,
      context:  updatedDoc.context,
    };

    const totalVotes =
      counts.verified + counts.fake + counts.satire + counts.context;

    // 4) Compute percentages (rounded to nearest integer)
    if (totalVotes === 0) {
      // Edge case: should not happen after an upsert increment, but just in case
      return res.json({ verified: 0, fake: 0, satire: 0, context: 0 });
    }

    const percentages = {
      verified: Math.round((counts.verified / totalVotes) * 100),
      fake:     Math.round((counts.fake     / totalVotes) * 100),
      satire:   Math.round((counts.satire   / totalVotes) * 100),
      context:  Math.round((counts.context  / totalVotes) * 100),
    };

    // 5) Return the four percentages
    return res.json(percentages);
  } catch (err) {
    console.error('Error in POST /api/votes:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
