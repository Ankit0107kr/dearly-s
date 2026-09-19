const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const logger = require('../config/logger');

let transporter = null;

const isEmailConfigured = () =>
  Boolean(env.smtp.host && env.smtp.port && env.smtp.user && env.smtp.password);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: Number(env.smtp.port),
      secure: Number(env.smtp.port) === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.password,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();
  if (!mailer) {
    logger.info({ to, subject }, 'Email skipped: SMTP not configured');
    return { skipped: true };
  }

  const info = await mailer.sendMail({
    from: env.smtp.user,
    to,
    subject,
    html,
    text,
  });

  return info;
};

const sendOrderConfirmationEmail = async (user, order) => {
  const reference = order.orderNumber || order._id;
  return sendEmail({
    to: user.email,
    subject: `Order confirmed — ${reference}`,
    text: `Hi ${user.firstName}, your order total is INR ${order.totalAmount}.`,
    html: `<p>Hi ${user.firstName},</p><p>Your order <strong>${reference}</strong> has been placed. Total: INR ${order.totalAmount}.</p>`,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  isEmailConfigured,
};
