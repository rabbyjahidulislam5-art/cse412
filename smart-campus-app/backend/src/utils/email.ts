import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass,
  },
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!config.email.smtp.user || !config.email.smtp.pass) {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL CONTENT]\n${html}`);
    return;
  }
  
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
}

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  await sendEmail(email, 'Smart Campus - OTP Verification', `
    <div style="max-width:600px;margin:0 auto;font-family:Inter,sans-serif">
      <h1 style="color:#1A3C6E">Smart Campus App</h1>
      <p>Your verification code is:</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2E75B6;text-align:center;padding:20px">${otp}</div>
      <p>This code expires in 5 minutes. Do not share this code with anyone.</p>
      <p style="color:#666;font-size:12px">East West University - Smart Campus App</p>
    </div>
  `);
}
