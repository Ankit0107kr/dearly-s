const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const { env } = require('./config/env');
const apiRoutes = require('./routes');
const paymentController = require('./controllers/payment.controller');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { asyncHandler } = require('./utils/helpers');
const logger = require('./config/logger');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

app.set('trust proxy', 1);

app.use(pinoHttp({ logger }));

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(paymentController.webhook)
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: { uptime: process.uptime() },
  });
});

app.use('/api/v1', apiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
