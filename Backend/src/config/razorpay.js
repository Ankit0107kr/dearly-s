const Razorpay = require('razorpay');
const { env } = require('./env');

let razorpayClient = null;

const isRazorpayConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    const error = new Error('Razorpay is not configured');
    error.statusCode = 503;
    throw error;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    });
  }

  return razorpayClient;
};

module.exports = { getRazorpayClient, isRazorpayConfigured };
