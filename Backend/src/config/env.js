require('dotenv').config();

const parseCloudinaryUrl = () => {
  const url = process.env.CLOUDINARY_URL;
  if (!url) {
    return null;
  }

  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url);
  if (!match) {
    return null;
  }

  return {
    apiKey: match[1],
    apiSecret: match[2],
    cloudName: match[3],
  };
};

const cloudinaryFromUrl = parseCloudinaryUrl();

const getMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI.replace(/\/$/, '');
    if (uri.includes('/?') || /\/[^/?]+\?/.test(uri)) {
      return uri;
    }
    return `${uri}/dearlys?retryWrites=true&w=majority`;
  }

  return undefined;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: getMongoUri(),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || cloudinaryFromUrl?.cloudName,
    apiKey: process.env.CLOUDINARY_API_KEY || cloudinaryFromUrl?.apiKey,
    apiSecret: process.env.CLOUDINARY_API_SECRET || cloudinaryFromUrl?.apiSecret,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
};

const validateEnv = () => {
  const missing = [];

  if (!env.mongoUri) {
    missing.push('MONGO_URI or MONGODB_URI');
  }
  if (!env.jwtSecret) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { env, validateEnv };
