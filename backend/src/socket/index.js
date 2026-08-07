const logger = require('../config/logger');

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join user-specific and role-specific rooms
    socket.on('join', ({ userId, role }) => {
      socket.join(`user_${userId}`);
      socket.join(`role_${role}`);
      logger.debug(`Socket ${socket.id} joined user_${userId} and role_${role}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
