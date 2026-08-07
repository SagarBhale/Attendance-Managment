const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_db';
    if (!process.env.MONGO_URI) {
      logger.warn('MONGO_URI environment variable not set. Using default fallback URI.');
    }
    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed database if empty (ensures demo accounts exist in cloud DB)
    const seedDB = require('../../seed');
    await seedDB(false);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
