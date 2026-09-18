const User = require('../models/User');
const { ROLES } = require('../utils/constants');
const { signAccessToken, setAuthCookie, clearAuthCookie } = require('../utils/generateToken');

const sanitizeUser = (user) => {
  const obj = user.toJSON ? user.toJSON() : user;
  delete obj.password;
  return obj;
};

const register = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const userData = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
    role: ROLES.CUSTOMER,
  };

  if (payload.phone) {
    userData.phone = payload.phone;
  }

  const user = await User.create(userData);
  const token = signAccessToken(user._id.toString());

  return {
    user: sanitizeUser(user),
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.isActive) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = signAccessToken(user._id.toString());
  user.password = undefined;

  return {
    user: sanitizeUser(user),
    token,
  };
};

const logout = () => ({ message: 'Logged out successfully' });

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return sanitizeUser(user);
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  setAuthCookie,
  clearAuthCookie,
};
