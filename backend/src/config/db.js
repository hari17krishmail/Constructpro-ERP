const mongoose = require('mongoose');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.name === 'MongoServerSelectionError') {
      console.error('Hint: Check that your IP is whitelisted in MongoDB Atlas → Network Access.');
    }

    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    throw err;
  }
};

module.exports = connectDB;
