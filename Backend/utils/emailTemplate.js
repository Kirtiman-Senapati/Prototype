
export const generateResetPasswordEmailTemplate = (resetPasswordUrl) =>
{   
    return `

   <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f3f4f6;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .email-wrapper {
        padding: 40px 20px;
        background-color: #f3f4f6;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .email-header {
        background-color: #1e3a8a; /* Professional Dark Blue for Academic Theme */
        padding: 25px 20px;
        text-align: center;
      }
      .email-header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 22px;
        font-weight: 600;
      }
      .email-body {
        padding: 35px 30px;
        color: #374151;
        line-height: 1.6;
        font-size: 16px;
      }
      .project-name {
        font-weight: 600;
        color: #1e3a8a;
      }
      .button-container {
        text-align: center;
        margin: 35px 0;
      }
      .reset-button {
        display: inline-block;
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        transition: background-color 0.3s ease;
      }
      .reset-button:hover {
        background-color: #1d4ed8;
      }
      .fallback-link {
        font-size: 14px;
        color: #6b7280;
        background-color: #f9fafb;
        padding: 12px;
        border-radius: 6px;
        word-break: break-all;
        border: 1px solid #e5e7eb;
      }
      .email-footer {
        background-color: #f9fafb;
        padding: 20px;
        text-align: center;
        font-size: 13px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-container">
        
        <!-- Header -->
        <div class="email-header">
          <h1>Password Reset Request</h1>
        </div>

        <!-- Body -->
        <div class="email-body">
          <p>Hello,</p>
          <p>We received a request to reset your password for the <span class="project-name">Academic Project Monitoring and Risk Identification System</span>.</p>
          <p>If you made this request, please click the button below to securely set a new password for your account:</p>
          
          <!-- Call to Action Button -->
          <div class="button-container">
            <a href="${resetPasswordUrl}" class="reset-button">Reset Password</a>
          </div>

          <p>If the button above doesn't work, you can copy and paste the following secure link into your web browser:</p>
          <p class="fallback-link"><a href="${resetPasswordUrl}" style="color: #2563eb; text-decoration: none;">${resetPasswordUrl}</a></p>
          
          <p style="margin-top: 30px;">If you did not request a password reset, you can safely ignore this email. Your account is secure.</p>
        </div>

        <!-- Footer -->
        <div class="email-footer">
          <p>&copy; ${new Date().getFullYear()} Academic Project Monitoring System. All rights reserved.</p>
          <p>This is an automated system email, please do not reply.</p>
        </div>

      </div>
    </div>
  </body>
  </html>
  `;
};