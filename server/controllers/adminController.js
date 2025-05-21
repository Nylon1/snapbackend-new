const Content = require('../../models/Content'); // ✅ correct

const { signToken } = require('../utils/jwt');

// ==================== Login ====================
exports.login = (req, res) => {
  try {
    console.log("📥 Login body:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    if (username === 'admin' && password === 'password123') {
      const token = signToken({ role: 'Super Admin' });
      console.log("✅ Token created:", token);
      return res.json({ token });
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error("❌ Login crash:", err);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

// ==================== Dashboard ====================
exports.getDashboardMetrics = async (req, res) => {
  try {
    const total = await Content.countDocuments();
    const pending = await Content.countDocuments({ status: 'pending' });
    const approved = await Content.countDocuments({ status: 'approved' });
    res.json({
      usersCount: 1,
      articlesCount: total,
      pendingCount: pending,
      approvedCount: approved
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics.' });
  }
};

// ==================== Content Moderation ====================
exports.listContent = async (req, res) => {
  try {
    const items = await Content.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content.' });
  }
};

exports.approveContent = async (req, res) => {
  try {
    await Content.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ message: 'Content approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve content.' });
  }
};

exports.rejectContent = async (req, res) => {
  try {
    await Content.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    res.json({ message: 'Content rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject content.' });
  }
};
exports.listPendingContent = async (req, res) => {
  try {
    const items = await Content.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load content' });
  }
};

// ==================== Users ====================
exports.listUsers = (req, res) => {
  res.json([{ id: 1, username: "admin", role: "Super Admin" }]);
};

exports.banUser = (req, res) => {
  res.json({ message: 'User banned' });
};

exports.unbanUser = (req, res) => {
  res.json({ message: 'User unbanned' });
};

// ==================== Settings ====================
exports.getSettings = (req, res) => {
  res.json({ siteName: "Snap News", moderation: true });
};

exports.updateSettings = (req, res) => {
  res.json({ message: 'Settings updated' });
};
const Trending = require('../models/Trending');

// List all trending videos
exports.getTrending = async (req, res) => {
  try {
    const trending = await Trending.find().sort({ createdAt: -1 });
    res.json(trending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending videos.' });
  }
};

// Add a new trending video
exports.addTrending = async (req, res) => {
  try {
    const { title, videoUrl, description } = req.body;
    const item = new Trending({ title, videoUrl, description });
    await item.save();
    res.json({ message: 'Trending video added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add trending video.' });
  }
};

// Remove a trending video
exports.deleteTrending = async (req, res) => {
  try {
    await Trending.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trending video removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trending video.' });
  }
};
exports.createContent = async (req, res) => {
  try {
    const { title, videoUrl, type, description, status } = req.body;
    const Content = require('../models/Content');
    const content = new Content({ title, videoUrl, type, description, status });
    await content.save();
    res.json({ message: 'Content created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create content' });
  }
};
exports.getAnalytics = async (req, res) => {
  const Content = require('../models/Content');
  try {
    const approved = await Content.countDocuments({ status: 'approved' });
    const pending = await Content.countDocuments({ status: 'pending' });
    const rejected = await Content.countDocuments({ status: 'rejected' });

    const all = await Content.find();
    const types = {};
    all.forEach(item => {
      types[item.type] = (types[item.type] || 0) + 1;
    });

    res.json({ approved, pending, rejected, types });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analytics." });
  }
};
// ==================== Public Access (Frontend) ====================
exports.getApprovedContent = async (req, res) => {
  try {
    const items = await Content.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching approved content:', err);
    res.status(500).json({ message: 'Failed to fetch approved content.' });
  }
};
