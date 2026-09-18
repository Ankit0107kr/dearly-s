const sendPushNotification = async ({ tokens = [], title, body, data = {} }) => {
  if (!tokens.length) {
    return { skipped: true, reason: 'No device tokens provided' };
  }

  // Firebase Cloud Messaging can be wired here when service account credentials are added.
  console.log('[fcm:skipped]', { title, body, tokenCount: tokens.length, data });
  return { skipped: true };
};

module.exports = {
  sendPushNotification,
};
