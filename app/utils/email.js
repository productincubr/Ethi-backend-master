// app/utils/email.js
const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set. Emails will NOT be sent.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "ETHI App";

async function sendEmail({ to, subject, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("DEV MODE: Email not sent, log only:", { to, subject });
    return;
  }

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject,
    html,
  };

  await sgMail.send(msg);
}

module.exports = {
  sendEmail,
};
