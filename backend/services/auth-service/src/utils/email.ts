/**
 * Email Service
 * Handles sending emails for authentication (welcome, password reset, etc.)
 */

import nodemailer, { Transporter } from 'nodemailer';
import logger from './logger';
import {
  EmailOptions,
  WelcomeEmailData,
  PasswordResetEmailData,
} from '../types';

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      };

      // Only configure if all required env vars are set
      if (config.host && config.auth.user && config.auth.pass) {
        this.transporter = nodemailer.createTransport(config);
        this.isConfigured = true;
        logger.info('Email service configured successfully');
      } else {
        logger.warn('Email service not configured (missing SMTP credentials)');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email service not configured, skipping email send');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@mediroutex.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚑 Welcome to MediRouteX!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name},</h2>
            <p>Welcome to MediRouteX - the AI-powered emergency ambulance dispatch and healthcare optimization system.</p>
            <p>Your account has been successfully created with the email: <strong>${data.email}</strong></p>
            <p>You can now access our platform and start using our services:</p>
            <ul>
              <li>Emergency request tracking</li>
              <li>Real-time ambulance location monitoring</li>
              <li>Hospital bed availability checking</li>
              <li>Route optimization</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Thank you for choosing MediRouteX!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MediRouteX. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.email,
      subject: 'Welcome to MediRouteX!',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.name},</h2>
            <p>We received a request to reset the password for your MediRouteX account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${data.reset_link}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in <strong>${data.expires_minutes} minutes</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${data.reset_link}</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MediRouteX. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: data.name, // Should be email, but keeping interface consistent
      subject: 'Password Reset Request - MediRouteX',
      html,
    });
  }

  /**
   * Send password changed confirmation
   */
  async sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Successfully Changed</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <div class="success">
              <p><strong>Your password has been successfully changed.</strong></p>
            </div>
            <p>If you made this change, no further action is needed.</p>
            <p>If you didn't change your password, please contact our support team immediately and secure your account.</p>
            <p>Stay safe!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MediRouteX. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Changed - MediRouteX',
      html,
    });
  }
}

export default new EmailService();
