const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const uploadBufferToCloudinary = (buffer, folder = 'dearlys') =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(Object.assign(new Error('Cloudinary is not configured'), { statusCode: 503 }));
      return;
    }

    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
      });
    });

    stream.end(buffer);
  });

const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }
  await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  uploadBufferToCloudinary,
  deleteCloudinaryAsset,
};
