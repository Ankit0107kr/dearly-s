const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');
const { asyncHandler } = require('../utils/helpers');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  authService.setAuthCookie(res, token);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  authService.setAuthCookie(res, token);

  return sendSuccess(res, {
    message: 'Login successful',
    data: { user },
  });
});

const logout = asyncHandler(async (req, res) => {
  authService.clearAuthCookie(res);
  await authService.logout();

  return sendSuccess(res, {
    message: 'Logged out successfully',
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  return sendSuccess(res, {
    message: 'Profile fetched successfully',
    data: { user },
  });
});

const google = asyncHandler(async (req, res) => {
  const { user, token } = await authService.googleAuth(req.body.credential);
  authService.setAuthCookie(res, token);

  return sendSuccess(res, {
    message: 'Login successful',
    data: { user },
  });
});

const config = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Auth config',
    data: authService.getPublicConfig(),
  })
);

module.exports = {
  register,
  login,
  logout,
  getMe,
  google,
  config,
};
