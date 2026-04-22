
import nodeMailer from 'nodemailer';

export const sendEmail = async ({to, subject, html, role}) => 
{
    try 
    {
        const transporter = nodeMailer.createTransport
        ({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: 
            {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            service: process.env.SMTP_SERVICE,
        });

        const senderName = role ? `${role} - Academic Project System` : "Academic Project System";

        const mailOptions = 
        {
            from: `"${senderName}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    }
    catch (error)
    {
        throw new Error(error.message||"Failed to send email");
    }
};