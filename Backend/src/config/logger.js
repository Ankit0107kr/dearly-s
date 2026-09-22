const pino = require('pino');
const { env } = require('./env');

// Redacted because request logging would otherwise persist the auth cookie.
const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : 'error',
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
});

module.exports = logger;
