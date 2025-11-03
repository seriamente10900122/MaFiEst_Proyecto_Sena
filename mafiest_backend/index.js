const app = require('./app');
const { sequelize } = require('./db');
const config = require('./utils/config');
const logger = require('./utils/logger');
const { User, Grabacion, Contact, Actividad } = require('./models');

const start = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    // Sync tables without forcing recreation
    await sequelize.sync({ force: false, alter: false });
    logger.info('Database tables synchronized');

    // Start server with error handling
    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use. Please try these steps:`);
        logger.error('1. Stop any other servers that might be running');
        logger.error(`2. Run: netstat -ano | findstr :${config.PORT}`);
        logger.error('3. Use taskkill /PID <PID> /F to stop the process');
        logger.error('4. Try starting the server again');
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

start();