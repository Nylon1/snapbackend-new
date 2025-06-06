// models/Vote.js
const mongoose = require('mongoose');

const VideoVoteSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    verified: {
      type: Number,
      default: 0,
      min: 0,
    },
    fake: {
      type: Number,
      default: 0,
      min: 0,
    },
    satire: {
      type: Number,
      default: 0,
      min: 0,
    },
    context: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// If a document for this videoId doesn’t exist yet, we’ll create it when first voting
module.exports = mongoose.model('VideoVote', VideoVoteSchema);
