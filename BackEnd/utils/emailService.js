import nodemailer from 'nodemailer';

/**
 * Email Service using Nodemailer
 * Handles OTP verification, notifications, and transactional emails
 * 
 * CRITICAL: All email functions are designed to be NON-BLOCKING.
 * If email fails (e.g., wrong credentials), the app continues working.
 * For OTP, the code is logged to console as a fallback.
 */

/**
 * Safely create transporter - handles missing config gracefully
 */
const createTransporter = () => {
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;

  if (!email || !password || email.includes('your_email') || password.includes('your_app_password')) {
    console.warn('[EmailService] SMTP credentials not configured. Emails will be logged to console instead.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: email,
      pass: password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email wrapper - NEVER throws, always returns result object
 */
export const sendEmail = async (options) => {
  const transporter = createTransporter();

  // If no transporter (missing config), log and return
  if (!transporter) {
    console.log(`[EmailService] MOCK EMAIL (no SMTP configured):\n  To: ${options.to}\n  Subject: ${options.subject}\n  Body: ${options.text?.substring(0, 100)}...`);
    return { success: false, mock: true, message: 'SMTP not configured - email logged to console' };
  }

  const message = {
    from: `${process.env.FROM_NAME || 'AgriSmart'} <${process.env.FROM_EMAIL || 'noreply@agrismart.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('[EmailService] Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EmailService] Email send error:', error.message);
    // Return failure gracefully - do NOT throw
    return { success: false, error: error.message };
  }
};

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP Verification Email
 * CRITICAL: If email fails, OTP is still returned for console fallback
 */
export const sendOTPVerification = async (email, otp, name) => {
  const subject = 'AgriSmart - Email Verification';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d6a4f;">Welcome to AgriSmart, ${name}!</h2>
      <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
      <div style="background: #e9f5ec; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #2d6a4f; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This OTP will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">AgriSmart - Empowering Agriculture</p>
    </div>
  `;

  const result = await sendEmail({
    to: email,
    subject,
    html,
    text: `Your AgriSmart verification OTP is: ${otp}. It expires in 10 minutes.`,
  });

  // Always log OTP to console as fallback
  console.log(`\n================================================`);
  console.log(`[EmailService] OTP FALLBACK (in case email fails)`);
  console.log(`  Email: ${email}`);
  console.log(`  Name: ${name}`);
  console.log(`  OTP: ${otp}`);
  console.log(`================================================\n`);

  return result;
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (email, resetToken, name) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const subject = 'AgriSmart - Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d6a4f;">Hello ${name},</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #2d6a4f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this link:</p>
      <p style="word-break: break-all; color: #2d6a4f;">${resetUrl}</p>
      <p>This link will expire in <strong>30 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Reset your password: ${resetUrl}`,
  });
};

/**
 * Send Order Confirmation Email
 */
export const sendOrderConfirmation = async (email, order, name) => {
  const orderId = order._id?.toString() || 'unknown';
  const shortId = orderId.slice(-6);
  const total = order.totalAmount || 0;

  const subject = `AgriSmart - Order #${shortId} Confirmed`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d6a4f;">Thank you for your order, ${name}!</h2>
      <p>Your order has been confirmed. Here are the details:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total Amount:</strong> ₹${total}</p>
        <p><strong>Status:</strong> ${order.status || 'pending'}</p>
      </div>
      <p>You can track your order in your dashboard.</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
    text: `Order confirmed. ID: ${orderId}. Total: ₹${total}`,
  });
};

