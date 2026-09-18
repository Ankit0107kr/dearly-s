const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AUTH_COOKIE_NAME } = require('./constants');

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const getCookieMaxAgeMs = () => {
  const raw = env.jwtExpiresIn;
  const match = /^(\d+)([dhms])$/.exec(raw);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  return value * multipliers[unit];
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: getCookieMaxAgeMs(),
    path: '/',
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);

module.exports = {
  signAccessToken,
  setAuthCookie,
  clearAuthCookie,
  verifyAccessToken,
  AUTH_COOKIE_NAME,
};
