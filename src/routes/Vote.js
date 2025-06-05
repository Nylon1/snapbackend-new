const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  voteType: { type: String, enum: ['verified', 'fake', 'satire', 'context'], required: true },
  ipHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vote', voteSchema);
