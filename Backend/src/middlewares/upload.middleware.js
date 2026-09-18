const multer = require('multer');

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(Object.assign(new Error('Only image uploads are allowed'), { statusCode: 400 }));
      return;
    }
    cb(null, true);
  },
});

module.exports = {
  imageUpload,
};
