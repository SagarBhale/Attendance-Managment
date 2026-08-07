require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Attendance = require('./src/models/Attendance');
const OvertimeRequest = require('./src/models/OvertimeRequest');
const logger = require('./src/config/logger');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await OvertimeRequest.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@attendiq.com',
      password: 'admin123',
      role: 'admin',
      department: 'Executive',
    });

    // Create Manager
    const manager = await User.create({
      name: 'Sarah Manager',
      email: 'manager@attendiq.com',
      password: 'manager123',
      role: 'manager',
      department: 'Engineering',
    });

    // Create Employee
    const employee = await User.create({
      name: 'John Employee',
      email: 'employee@attendiq.com',
      password: 'employee123',
      role: 'employee',
      department: 'Engineering',
      managerId: manager._id,
    });

    logger.info('Demo Users Created:');
    logger.info('1. Admin: admin@attendiq.com / admin123');
    logger.info('2. Manager: manager@attendiq.com / manager123');
    logger.info('3. Employee: employee@attendiq.com / employee123');

    // Create Sample Attendance for today
    const today = new Date().toISOString().split('T')[0];
    const punchInTime = new Date();
    punchInTime.setHours(9, 0, 0, 0);

    const attendance = await Attendance.create({
      userId: employee._id,
      date: today,
      punchIn: {
        time: punchInTime,
        selfie: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        location: { latitude: 28.6139, longitude: 77.2090, address: 'Connaught Place, New Delhi' },
        withinGeofence: true,
      },
      status: 'incomplete',
      validationStatus: 'pending',
    });

    logger.info('Sample Attendance Record Created for Today');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
