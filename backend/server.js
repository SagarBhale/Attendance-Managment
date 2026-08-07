require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const logger = require('./src/config/logger');
const errorHandler = require('./src/middleware/errorHandler');
const setupSocket = require('./src/socket');

// Routes
const authRoutes = require('./src/routes/auth');
const attendanceRoutes = require('./src/routes/attendance');
const overtimeRoutes = require('./src/routes/overtime');
const reportsRoutes = require('./src/routes/reports');
const usersRoutes = require('./src/routes/users');

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);
setupSocket(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' })); // 10mb for base64 selfies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan HTTP logging (stream to Winston)
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance Management System API is running smoothly 🚀',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      attendance: '/api/attendance',
      overtime: '/api/overtime',
      reports: '/api/reports',
      users: '/api/users',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
