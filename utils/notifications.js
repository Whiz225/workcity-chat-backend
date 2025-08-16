const nodemailer = require("nodemailer");
const webpush = require("web-push");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Initialize web push only if keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("VAPID keys not set - push notifications disabled");
}

exports.sendEmailNotification = async ({ to, subject, text }) => {
  await transporter.sendMail({
    from: `"Workcity Chat" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

exports.sendPushNotification = (subscription, payload) => {
  webpush
    .sendNotification(subscription, JSON.stringify(payload))
    .catch((err) => console.error("Push notification error:", err));
};

exports.initializePushNotifications = () => {
  // Can be extended with background jobs
  console.log("Push notifications initialized");
};
