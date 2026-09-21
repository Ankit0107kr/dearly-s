const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { env } = require('../config/env');
const { ROLES } = require('../utils/constants');
const { signAccessToken, setAuthCookie, clearAuthCookie } = require('../utils/generateToken');

let googleClient;
const getGoogleClient = () => {
  if (!env.google.clientId) {
    return null;
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(env.google.clientId);
  }
  return googleClient;
};

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

const googleAuth = async (credential) => {
  const client = getGoogleClient();
  if (!client) {
    const error = new Error('Google sign-in is not configured');
    error.statusCode = 503;
    throw error;
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    const error = new Error('Invalid Google sign-in');
    error.statusCode = 401;
    throw error;
  }

  const email = payload?.email?.toLowerCase().trim();
  const googleId = payload?.sub;
  if (!email || !googleId) {
    const error = new Error('Google account did not return a usable email');
    error.statusCode = 400;
    throw error;
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.isActive) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
    if (user.googleId && user.googleId !== googleId) {
      const error = new Error('This email is linked to a different Google account');
      error.statusCode = 409;
      throw error;
    }
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  } else {
    const firstName = (payload.given_name || payload.name || 'Google').trim().slice(0, 80);
    const lastName = (payload.family_name || 'User').trim().slice(0, 80);
    user = await User.create({
      firstName: firstName || 'Google',
      lastName: lastName || 'User',
      email,
      googleId,
      role: ROLES.CUSTOMER,
    });
  }

  const token = signAccessToken(user._id.toString());
  return { user: sanitizeUser(user), token };
};

const getPublicConfig = () => ({
  googleConfigured: Boolean(env.google.clientId),
  googleClientId: env.google.clientId || undefined,
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  googleAuth,
  getPublicConfig,
  setAuthCookie,
  clearAuthCookie,
};
