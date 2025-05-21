const mongoose = require('mongoose');

const TrendingSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Trending', TrendingSchema);
