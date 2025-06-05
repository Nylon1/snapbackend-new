const express = require('express');
const Vote = require('../models/Vote');
const crypto = require('crypto');
const router = express.Router();

// Utility: Hash IP
const hashIP = (ip) => crypto.createHash('sha256').update(ip).digest('hex');

/**
 * GET /api/votes?videoIds=a,b,c
 * Returns vote results for multiple videos
 */
router.get('/', async (req, res) => {
  const videoIds = req.query.videoIds?.split(',') || [];
  if (!videoIds.length) {
    return res.status(400).json({ message: 'Missing videoIds' });
  }

  console.log('[GET /api/votes] videoIds:', videoIds);

  const votes = await Vote.aggregate([
    { $match: { videoId: { $in: videoIds } } },
    { $group: { _id: { videoId: '$videoId', voteType: '$voteType' }, count: { $sum: 1 } } }
  ]);

  const result = {};
  videoIds.forEach(id => {
    result[id] = { verified: 0, fake: 0, satire: 0, context: 0 };
  });
  votes.forEach(v => {
    const { videoId, voteType } = v._id;
    if (result[videoId]) result[videoId][voteType] = v.count;
  });

  res.json(result);
});

/**
 * GET /api/votes/:videoId
 * Returns vote breakdown for a single video
 */
router.get('/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  console.log('[GET /api/votes/:videoId] videoId:', videoId);

  const votes = await Vote.aggregate([
    { $match: { videoId } },
    { $group: { _id: '$voteType', count: { $sum: 1 } } }
  ]);

  const result = { verified: 0, fake: 0, satire: 0, context: 0 };
  votes.forEach(v => result[v._id] = v.count);
  res.json(result);
});

/**
 * POST /api/votes
 * Save a vote from a hashed IP
 */
router.post('/', async (req, res) => {
  const { videoId, voteType } = req.body;

  if (!videoId || !voteType) {
    return res.status(400).json({ message: 'Missing videoId or voteType' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ipHash = hashIP(ip);

  const alreadyVoted = await Vote.findOne({ videoId, ipHash });
  if (alreadyVoted) {
    return res.status(409).json({ message: 'Already voted' });
  }

  const vote = new Vote({ videoId, voteType, ipHash });
  await vote.save();

  console.log(`[VOTE] ${new Date().toISOString()} - ${voteType} - ${videoId} - IP hashed`);

  res.status(201).json({ message: 'Vote saved' });
});

module.exports = router;
