import nodemailer from 'nodemailer';

/**
 * Sends a password change verification OTP email to the user.
 * Falls back to console logging in development mode if SMTP details are missing.
 * 
 * @param {string} email - Recipient's email address
 * @param {string} otp - Generated verification code
 * @param {string} userName - Name of the user
 * @returns {Promise<{success: boolean, mode: string, error?: string}>}
 */
export const sendOTPEmail = async (email, otp, userName) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Development Fallback: If credentials are not set in .env, log to console
  if (!emailUser || !emailPass) {
    console.log('\n==================================================');
    console.log('                 FOODSHARE SECURITY               ');
    console.log('==================================================');
    console.log(`[DEVELOPMENT MODE] Verification OTP Email`);
    console.log(`To:        ${email}`);
    console.log(`Name:      ${userName}`);
    console.log(`OTP Code:  ${otp}`);
    console.log('--------------------------------------------------');
    console.log('Note: To send real emails, configure EMAIL_USER and');
    console.log('EMAIL_PASS in backend/.env');
    console.log('==================================================\n');
    return { success: true, mode: 'console' };
  }

  // Create standard transporter configuration for Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    from: `"FoodShare Security" <${emailUser}>`,
    to: email,
    subject: 'Verification Code for Password Change',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">FoodShare Security</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Protecting Your Account</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">We received a request to change your account password. Please use the following verification OTP code to confirm your request:</p>
        
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 6px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1e293b; margin: 25px 0;">
          ${otp}
        </div>
        
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">This code is valid for <strong>5 minutes</strong> and can only be used once. If you did not make this request, you can safely ignore this email; your password will remain unchanged.</p>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 15px;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
          This is an automated system email. Please do not reply directly to this message.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] OTP email sent successfully to ${email}`);
    return { success: true, mode: 'smtp' };
  } catch (error) {
    console.error(`[SMTP] Failed to send email via SMTP to ${email}:`, error.message);
    // Graceful fallback to console logging so the application doesn't crash/block user if Gmail SMTP fails (e.g. wrong password)
    console.log('\n==================================================');
    console.log(`[SMTP FALLBACK] OTP Code for ${email}: ${otp}`);
    console.log('==================================================\n');
    return { success: false, mode: 'console_fallback', error: error.message };
  }
};
