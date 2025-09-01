const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

module.exports = async (to, subject, text, html) => {
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to, subject,
    text: text || undefined,
    html: html || undefined
  });
};
