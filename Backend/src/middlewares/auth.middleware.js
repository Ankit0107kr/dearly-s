const User = require('../models/User');
const { verifyAccessToken, AUTH_COOKIE_NAME } = require('../utils/generateToken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      const error = new Error('Invalid or expired session');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      const error = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
