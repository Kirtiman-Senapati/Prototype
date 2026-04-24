export const getEmailTemplate = (type, data) => {
  const baseHtml = (content) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Academic Project System</h2>
      </div>
      <div style="padding: 30px; color: #374151; line-height: 1.6;">
        ${content}
      </div>
      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">This is an automated notification. Please do not reply.</p>
      </div>
    </div>
  `;

  switch (type) {
    case "PROJECT_ASSIGNED":
      return {
        subject: "New Project Assigned",
        html: baseHtml(`
          <h3 style="color: #1f2937; margin-top: 0;">You have a new project assignment</h3>
          <p>Hello <strong>${data.supervisorName}</strong>,</p>
          <p>You have been assigned as the supervisor for a new academic project.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Project Title:</strong> ${data.title}</p>
            <p style="margin: 0;"><strong>Student:</strong> ${data.studentName}</p>
          </div>
          <p>Please log in to your dashboard to review the proposal details.</p>
        `)
      };

    case "PROJECT_COMPLETED":
      return {
        subject: "Project Completed Notification",
        html: baseHtml(`
          <h3 style="color: #059669; margin-top: 0;">Project Completed</h3>
          <p>Hello,</p>
          <p>The following project has been marked as completed:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0 border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0;"><strong>Project Title:</strong> ${data.title}</p>
            <p style="margin: 0;"><strong>Completed by Student:</strong> ${data.studentName}</p>
          </div>
          <p>Please log in to your dashboard to review the final submission.</p>
        `)
      };

    case "DEADLINE_REMINDER":
      return {
        subject: "⏰ Deadline Nearing Notification",
        html: baseHtml(`
          <h3 style="color: #b45309; margin-top: 0;">Action Required: Deadline Approaching</h3>
          <p>Hello <strong>${data.studentName}</strong>,</p>
          <p>This is an automated reminder that the deadline for your academic project is approaching in 1 day.</p>
          <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Project Title:</strong> ${data.title}</p>
            <p style="margin: 0;"><strong>Deadline:</strong> ${data.deadline}</p>
          </div>
          <p>Please log in to your dashboard and ensure your project is completed and submitted before the deadline to avoid any academic penalties.</p>
        `)
      };

    case "DEADLINE_MISSED":
      return {
        subject: "❌ Urgent: Project Deadline Missed",
        html: baseHtml(`
          <h3 style="color: #dc2626; margin-top: 0;">Notice: Project Deadline Missed</h3>
          <p>Hello,</p>
          <p>This is to notify you that the deadline for the following project has passed without the project being marked as completed.</p>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0;"><strong>Project Title:</strong> ${data.title}</p>
            <p style="margin: 0;"><strong>Student:</strong> ${data.studentName}</p>
          </div>
          <p>This event has been logged in the system. Please review the project status on your dashboard immediately.</p>
        `)
      };

    default:
      return null;
  }
};
