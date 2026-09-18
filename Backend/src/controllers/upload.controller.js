const { isCloudinaryConfigured } = require('../config/cloudinary');
const { asyncHandler } = require('../utils/helpers');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToCloudinary } = require('../utils/upload');

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('Image file is required');
    error.statusCode = 400;
    throw error;
  }

  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary is not configured');
    error.statusCode = 503;
    throw error;
  }

  const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'dearlys/uploads');
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Image uploaded successfully',
    data: uploaded,
  });
});

module.exports = { uploadImage };
