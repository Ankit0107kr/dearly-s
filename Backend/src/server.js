const app = require('./app');
const connectDB = require('./config/db');
const { env, validateEnv } = require('./config/env');

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
