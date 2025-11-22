const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SHOP_EMAIL_HOST,
  port: process.env.SHOP_EMAIL_PORT,
  secure: process.env.SHOP_EMAIL_PORT == 465, // true for SSL
  auth: {
    user: process.env.SHOP_EMAIL_USER,
    pass: process.env.SHOP_EMAIL_PASS
  }
});

async function sendMail(to, subject, html) {
  const mailOptions = {
    from: process.env.SHOP_EMAIL_FROM,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
}

module.exports = { sendMail };
