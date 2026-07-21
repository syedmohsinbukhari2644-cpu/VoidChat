const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // 587 uses STARTTLS
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER || 'syedmohsinbukhari2644@gmail.com',
    pass: process.env.EMAIL_PASS || 'xrkbpvllviyrjbwa'
  },
  tls: {
    rejectUnauthorized: false
  }
})

const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"VOID CHAT 🔓" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'VOID CHAT — Verification Code',
    html: `
      <div style="background:#0a0a0a;padding:40px;font-family:sans-serif;">
        <h1 style="color:#c8ff00;">VOID CHAT 🔓</h1>
        <p style="color:#f9fafb;font-size:16px;">
          Your verification code:
        </p>
        <h2 style="color:#c8ff00;font-size:48px;letter-spacing:8px;">
          ${otp}
        </h2>
        <p style="color:#6b7280;font-size:12px;">
          This code expires in 10 minutes.
          Do not share it with anyone!
        </p>
        <p style="color:#4b5563;font-size:11px;">
          🔐 E2E Encrypted • Privacy First
        </p>
      </div>
    `
  })
}

module.exports = { sendOTP }