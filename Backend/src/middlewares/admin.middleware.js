const { ROLES } = require('../utils/constants');

const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    return next(error);
  }

  if (req.user.role !== ROLES.ADMIN) {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    return next(error);
  }

  return next();
};

module.exports = authorizeAdmin;
