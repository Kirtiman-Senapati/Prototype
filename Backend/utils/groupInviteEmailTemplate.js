export const generateGroupInviteTemplate = ({
    invitedStudentName,
    adminName,
    projectTitle,
    groupName,
    acceptUrl,
    declineUrl,
}) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Project Invitation</title>
    </head>

    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">

        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

            <div style="background:#0f172a;padding:24px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:22px;">
                    Academic Monitor
                </h1>
            </div>

            <div style="padding:32px;color:#334155;line-height:1.7;">

                <h2 style="margin-top:0;color:#0f172a;">
                    Project Group Invitation
                </h2>

                <p>
                    Hello <strong>${invitedStudentName}</strong>,
                </p>

                <p>
                    <strong>${adminName}</strong> invited you to join an academic project group.
                </p>

                <div style="background:#f8fafc;padding:18px;border-radius:10px;border:1px solid #e2e8f0;margin:24px 0;">

                    <p style="margin:0 0 10px 0;">
                        <strong>Project Title:</strong> ${projectTitle}
                    </p>

                    <p style="margin:0;">
                        <strong>Group Name:</strong> ${groupName || "Project Team"}
                    </p>

                </div>

                <p style="margin-top:10px;color:#475569;">
                    You can accept or decline the invitation directly from email.
                </p>

                <div style="margin:30px 0;text-align:center;">

                    <a
                        href="${acceptUrl}"
                        style="
                            background:#0f172a;
                            color:#ffffff;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:8px;
                            display:inline-block;
                            margin-right:12px;
                            font-weight:bold;
                        "
                    >
                        Accept Invitation
                    </a>

                    <a
                        href="${declineUrl}"
                        style="
                            background:#e2e8f0;
                            color:#0f172a;
                            text-decoration:none;
                            padding:12px 24px;
                            border-radius:8px;
                            display:inline-block;
                            font-weight:bold;
                        "
                    >
                        Decline Invitation
                    </a>

                </div>
                <p style="margin-top:30px;color:#334155;">
                    Academic Project Monitor System
                </p>

            </div>

                <div style="
                    padding:18px;
                    background:#f8fafc;
                    border-top:1px solid #e2e8f0;
                    text-align:center;
                    font-size:12px;
                    color:#64748b;
                ">
                    This is an automated email notification.
                </div>

            </div>
        </body>
        </html>
    `;
};