require("dotenv").config();
const nodemailer = require("nodemailer");

function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_ENABLED !== "false",
  );
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * @returns {{ sent: boolean, skipped?: boolean, reason?: string, error?: string }}
 */
async function sendMail({ to, subject, text, html }) {
  if (!isMailConfigured()) {
    return { sent: false, skipped: true, reason: "not_configured" };
  }
  try {
    const transporter = buildTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || `<pre style="font-family:sans-serif">${escapeHtml(text)}</pre>`,
    });
    return { sent: true };
  } catch (err) {
    console.error("sendMail:", err.message);
    return { sent: false, error: err.message };
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendLoginCredentialsEmail({
  to,
  recipientName,
  loginEmail,
  password,
  subject,
}) {
  const sub = subject || "Your reimbursement system login";
  const text = [
    `Hello ${recipientName || "there"},`,
    "",
    "Your account is ready. Use these credentials to sign in:",
    "",
    `Login (email): ${loginEmail}`,
    `Password: ${password}`,
    "",
    "Please sign in and change your password from your profile when possible.",
    "",
    "— Reimbursement Management System",
  ].join("\n");

  const html = `
    <p>Hello ${escapeHtml(recipientName || "there")},</p>
    <p>Your account is ready. Use these credentials to sign in:</p>
    <ul>
      <li><strong>Login (email):</strong> ${escapeHtml(loginEmail)}</li>
      <li><strong>Password:</strong> ${escapeHtml(password)}</li>
    </ul>
    <p>Please sign in and change your password from your profile when possible.</p>
    <p>— Reimbursement Management System</p>
  `;

  const result = await sendMail({ to, subject: sub, text, html });
  return { to, ...result };
}

module.exports = {
  isMailConfigured,
  sendMail,
  sendLoginCredentialsEmail,
};
