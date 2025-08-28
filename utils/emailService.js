const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    this.transporter = await this.createTransporter();
  }

  async createTransporter() {
    // For development, you can use Gmail or any SMTP service
    // For production, consider using services like SendGrid, AWS SES, etc.

    if (process.env.NODE_ENV === "production") {
      // Production email configuration
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
        },
      });
    } else {
      // Development - use Ethereal Email for testing (creates test account automatically)
      try {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch (error) {
        console.log(
          "Failed to create test account, using fallback configuration"
        );
        // Fallback to a simple configuration that won't crash
        return nodemailer.createTransport({
          streamTransport: true,
          newline: "unix",
          buffer: true,
        });
      }
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName = "") {
    // Ensure transporter is initialized
    if (!this.transporter) {
      await this.initializeTransporter();
    }

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Resume Builder" <${
        process.env.EMAIL_FROM || "noreply@resumebuilder.com"
      }>`,
      to: email,
      subject: "Password Reset Request - Resume Builder",
      html: this.getPasswordResetTemplate(resetUrl, userName),
      text: `
        Hi ${userName || "there"},
        
        You requested a password reset for your Resume Builder account.
        
        Please click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 10 minutes for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        Resume Builder Team
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent successfully!");
      console.log("📧 Email details:", {
        messageId: info.messageId,
        to: email,
        resetUrl: resetUrl,
      });

      // For development, log the preview URL if available
      if (process.env.NODE_ENV !== "production" && info.messageId) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("🔗 Preview URL:", previewUrl);
        }
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending password reset email:", error.message);

      // In development, don't throw error - just log it and return success
      if (process.env.NODE_ENV !== "production") {
        console.log("🔧 Development mode: Simulating email sent successfully");
        console.log("📧 Would have sent email to:", email);
        console.log("🔗 Reset URL would be:", resetUrl);
        return { success: true, messageId: "dev-simulation-" + Date.now() };
      }

      throw new Error("Failed to send password reset email");
    }
  }

  getPasswordResetTemplate(resetUrl, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Resume Builder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName || "there"}!</h2>
            <p>You requested a password reset for your Resume Builder account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Important:</strong> This link will expire in 10 minutes for security reasons.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2024 Resume Builder. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
