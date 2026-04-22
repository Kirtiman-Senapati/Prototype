export const generateNotificationEmailTemplate = (message, details) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Notification Activity</title>
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
          background-color: #1e3a8a;
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
        .message-content {
          font-size: 16px;
          padding: 15px;
          background-color: #f9fafb;
          border-left: 4px solid #2563eb;
          margin: 20px 0;
          border-radius: 4px;
        }
        .details-content {
          font-size: 15px;
          color: #4b5563;
          margin-top: 10px;
          white-space: pre-wrap;
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
          <div class="email-header">
            <h1>Activity Notification</h1>
          </div>
          <div class="email-body">
            <p>Hello,</p>
            <p>You have a new update in your Project Management account:</p>
            <div class="message-content">
              <strong>${message}</strong>
              ${details ? `<div class="details-content">${details}</div>` : ''}
            </div>
            <p>Please log in to your dashboard to view more details.</p>
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} Project Management System. All rights reserved.</p>
            <p>This is an automated system email, please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};
