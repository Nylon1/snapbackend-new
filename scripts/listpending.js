// scripts/listPending.js
require('dotenv').config();
const mongoose = require('mongoose');
const Content  = require('../src/models/Content');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const pending = await Content.find({ status: 'pending' }).lean();
  console.log('Pending items:', pending);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
