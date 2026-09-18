const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null }) => {
  const payload = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (res, { statusCode = 500, message = 'Something went wrong', error = null }) => {
  const payload = {
    success: false,
    message,
  };

  if (error !== null && error !== undefined) {
    payload.error = error;
  }

  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
