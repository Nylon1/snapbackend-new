const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    index: true
  },
  voteType: {
    type: String,
    enum: ['verified', 'fake', 'satire', 'context'],
    required: true
  },
  ipHash: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24  // Optional: auto-delete after 24 hours
  }
});

module.exports = mongoose.model('Vote', voteSchema);

