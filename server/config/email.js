const nodemailer = require("nodemailer");
const { decrypt } = require("./encryption");

let _t = null;
const getT = () => {
  if (!_t) _t = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "Gmail",
    auth: { user: process.env.EMAIL, pass: process.env.PASSWORD },
  });
  return _t;
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendVerificationEmail = async ({ to, name, otp }) => {
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
    <h1 style="color:#2563eb;text-align:center">Echo</h1>
    <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #e5e7eb">
      <h2>Verify your email</h2>
      <p>Hi <strong>${name}</strong>, enter this code to verify your account:</p>
      <div style="background:#eff6ff;padding:16px;text-align:center;border-radius:8px;margin:14px 0">
        <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2563eb">${otp}</div>
        <p style="color:#9ca3af;font-size:12px;margin:6px 0 0">Expires in 10 minutes</p>
      </div>
      <p style="color:#9ca3af;font-size:12px">If you didn't create an Echo account, ignore this email.</p>
    </div>
  </div>`;
  return getT().sendMail({ from: `Echo <${process.env.EMAIL}>`, to, subject: "Verify your Echo account", html });
};

const sendSuspiciousLoginEmail = async ({ to, name, otp, context }) => {
  const ip = context.encryptedIp ? decrypt(context.encryptedIp) : context.ip || "Unknown";
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px">
      <h2 style="color:#991b1b">⚠️ Suspicious Login Detected</h2>
      <p>Hi <strong>${name}</strong>, sign-in from unrecognised device:</p>
      <p><strong>Browser:</strong> ${context.browser}<br/><strong>OS:</strong> ${context.os}<br/>
      <strong>IP:</strong> ${ip}<br/><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <div style="background:#fff;padding:12px;text-align:center;border-radius:8px;margin-top:10px">
        <p style="margin:0 0 6px;font-size:13px">Your security code:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb">${otp}</div>
        <p style="color:#9ca3af;font-size:11px;margin:6px 0 0">Expires in 10 minutes. Never share this.</p>
      </div>
    </div>
  </div>`;
  return getT().sendMail({ from: `Echo Security <${process.env.EMAIL}>`, to, subject: "⚠️ New sign-in to your Echo account", html });
};

const sendPasswordResetEmail = async ({ to, name, otp }) => {
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
    <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #e5e7eb">
      <h2>Reset your password</h2>
      <p>Hi <strong>${name}</strong>, your password reset code:</p>
      <div style="background:#eff6ff;padding:16px;text-align:center;border-radius:8px;margin:14px 0">
        <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2563eb">${otp}</div>
        <p style="color:#9ca3af;font-size:12px;margin:6px 0 0">Expires in 10 minutes</p>
      </div>
    </div>
  </div>`;
  return getT().sendMail({ from: `Echo <${process.env.EMAIL}>`, to, subject: "Reset your Echo password", html });
};

module.exports = { generateOTP, sendVerificationEmail, sendSuspiciousLoginEmail, sendPasswordResetEmail };
