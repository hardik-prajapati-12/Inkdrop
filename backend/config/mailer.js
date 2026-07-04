// config/mailer.js — Nodemailer transporter
const nodemailer = require('nodemailer');

/**
 * Build a fresh transporter each time so .env changes are picked up
 * without restarting the server.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host:    process.env.EMAIL_HOST  || 'smtp.gmail.com',
    port:    parseInt(process.env.EMAIL_PORT || '587'),
    secure:  process.env.EMAIL_SECURE === 'true',   // false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,   // ← fixes "self-signed certificate" error
    },
  });
}

// Verify on startup — logs warning but never crashes the server
createTransporter().verify((error) => {
  if (error) {
    console.warn('⚠  Email not configured:', error.message);
    console.warn('Set EMAIL_USER and EMAIL_PASS in backend/.env to enable emails.');
  } else {
    console.log('✅  Email transporter ready');
  }
});

/**
 * Send a reply email to a contact-form sender.
 */
async function sendReply({ to, toName, subject, body, originalMsg, originalTopic }) {
  const fromName  = process.env.EMAIL_FROM_NAME || 'InkDrop Blog';
  const fromEmail = process.env.EMAIL_FROM      || process.env.EMAIL_USER;

  const textBody = `Hi ${toName},\n\n${body}\n\n──\nBest regards,\nThe InkDrop Team\n\n--- Your original message (${originalTopic}) ---\n${originalMsg}`;

  const htmlBody = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0F0F0F;padding:28px 36px;">
            <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#F5F0E8;">
              ✒ InkDrop<span style="color:#D4A853">.</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 36px 0;">
            <p style="margin:0 0 8px;font-size:15px;color:#6B6055;">
              Hello <strong style="color:#0F0F0F;">${toName}</strong>,
            </p>
            <div style="font-size:15px;color:#3d3d3a;line-height:1.8;margin-top:16px;white-space:pre-wrap;">${body.replace(/\n/g, '<br>')}</div>
          </td>
        </tr>
        <tr><td style="padding:28px 36px 0;"><hr style="border:none;border-top:1px solid #e8e5df;"></td></tr>
        <tr>
          <td style="padding:20px 36px 0;">
            <p style="margin:0;font-size:14px;color:#6B6055;line-height:1.7;">
              Best regards,<br>
              <strong style="color:#0F0F0F;">${fromName}</strong><br>
              <a href="mailto:${fromEmail}" style="color:#D4A853;">${fromEmail}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 0;">
            <div style="background:#f9f8f6;border-left:3px solid #D4A853;padding:16px 20px;border-radius:0 6px 6px 0;">
              <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#A89880;font-weight:600;">
                Your original message · ${originalTopic}
              </p>
              <p style="margin:0;font-size:13px;color:#6B6055;line-height:1.7;white-space:pre-wrap;">${originalMsg}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 32px;">
            <p style="margin:0;font-size:11px;color:#A89880;text-align:center;">
              This is a reply to your InkDrop contact form submission.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return createTransporter().sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to:      `"${toName}" <${to}>`,
    subject: subject || `Re: Your message to ${fromName}`,
    text:    textBody,
    html:    htmlBody,
  });
}

/**
 * Send a 6-digit OTP for password reset.
 */
async function sendOTPEmail({ to, toName, otp }) {
  const fromName  = process.env.EMAIL_FROM_NAME || 'InkDrop Blog';
  const fromEmail = process.env.EMAIL_FROM      || process.env.EMAIL_USER;

  return createTransporter().sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to:      `"${toName}" <${to}>`,
    subject: `${otp} is your InkDrop password reset code`,
    text:    `Hi ${toName},\n\nYour InkDrop password reset code is:\n\n  ${otp}\n\nThis code expires in 10 minutes.\nIf you didn't request this, ignore this email.\n\n— InkDrop Team`,
    html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="max-width:480px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#0F0F0F;padding:20px 32px;">
            <span style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#F5F0E8;">
              ✒ InkDrop<span style="color:#D4A853">.</span>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 16px;text-align:center;">
            <p style="font-size:15px;color:#3d3d3a;margin:0 0 8px;">
              Hi <strong>${toName}</strong>, your password reset code is:
            </p>
            <p style="font-size:13px;color:#6B6055;margin:0 0 28px;">
              Enter this code in the InkDrop app to reset your password.
            </p>
            <div style="background:#0F0F0F;border-radius:12px;padding:28px 0;margin:0 0 24px;">
              <span style="font-family:Georgia,serif;font-size:52px;font-weight:700;letter-spacing:18px;color:#D4A853;">${otp}</span>
            </div>
            <p style="font-size:14px;color:#6B6055;margin:0 0 6px;">
              ⏱ This code expires in <strong>10 minutes</strong>.
            </p>
            <p style="font-size:13px;color:#A89880;margin:0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #e8e5df;">
            <p style="font-size:11px;color:#A89880;margin:0;">
              Do not share this code with anyone. InkDrop will never ask for it.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  });
}

module.exports = { sendReply, sendOTPEmail, createTransporter };