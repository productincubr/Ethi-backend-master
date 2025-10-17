const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

function getMessage(to_send_youer,otpsend) {
  const body = 'This is a test email using SendGrid from Node.js';
  return {
    to: to_send_youer,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Test email with Node.js and SendGrid',
    text: body,
    html: `<strong>${body}</strong>`,
  };
}

async function sendEmail(to_send_youer,otpsend) {
  try {
    await sendGridMail.send(getMessage(to_send_youer,otpsend));
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email');
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
  }
}

(async () => {
  console.log('Sending test email');
  await sendEmail();
})();