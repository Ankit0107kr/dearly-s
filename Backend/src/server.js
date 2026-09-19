const app = require('./app');
const connectDB = require('./config/db');
const { env, validateEnv } = require('./config/env');
const { releaseExpiredReservations } = require('./services/reservation.service');
const logger = require('./config/logger');

const RESERVATION_SWEEP_MS = 5 * 60 * 1000;

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
    });

    setInterval(() => {
      releaseExpiredReservations().catch((error) =>
        logger.error({ err: error }, 'Reservation sweep failed')
      );
    }, RESERVATION_SWEEP_MS).unref();
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
