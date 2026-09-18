const User = require('../models/User');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');

const getProfile = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Profile fetched successfully',
    data: { user: req.user },
  })
);

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['firstName', 'lastName', 'phone'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });
  await req.user.save();

  return sendSuccess(res, {
    message: 'Profile updated successfully',
    data: { user: req.user },
  });
});

module.exports = {
  getProfile,
  updateProfile,
};
