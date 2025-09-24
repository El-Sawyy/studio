'use server';

import nodemailer from 'nodemailer';

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM || 'ahmed.elsawy@tempo.fit';

let transporter: nodemailer.Transporter | null = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass, // Use an "App Password" from your Google account
    },
  });
}

type EmailData = {
  to: string;
  agentName: string;
  type: 'coaching' | 'plan' | 'warning';
  documentType: string;
  documentDate: string;
  createdBy: string;
};

function getEmailContent(data: EmailData) {
  const subject = `New ${data.type} document added to your profile`;
  const text = `
Hello ${data.agentName},

A new ${data.type} document has been added to your profile.

Type: ${data.documentType}
Date: ${data.documentDate}
Added By: ${data.createdBy}

You can view it now by logging into your Tempo Triumph dashboard.

Thank you,
Your Management Team
  `;
  const html = `
<p>Hello ${data.agentName},</p>
<p>A new <strong>${data.type} document</strong> has been added to your profile.</p>
<ul>
  <li><strong>Document Type:</strong> ${data.documentType}</li>
  <li><strong>Date:</strong> ${data.documentDate}</li>
  <li><strong>Added By:</strong> ${data.createdBy}</li>
</ul>
<p>You can view it now by logging into your Tempo Triumph dashboard.</p>
<p>Thank you,<br>Your Management Team</p>
  `;

  return { subject, text, html };
}

export async function sendNotificationEmail(data: EmailData) {
  if (!emailUser || !emailPass) {
    const message = "Email service not configured. The EMAIL_USER and EMAIL_PASS environment variables are missing.";
    console.warn(message);
    return { success: false, message };
  }
  
  if (!transporter) {
     const message = "Email transporter is not initialized. Check your email configuration.";
     console.error(message);
     return { success: false, message };
  }

  const { subject, text, html } = getEmailContent(data);

  const msg = {
    to: data.to,
    from: emailFrom,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(msg);
    console.log('Notification email sent to:', data.to, 'Message ID:', info.messageId);
    return { success: true, message: "Email sent successfully." };
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    // This is important for debugging. Google might block sign-in attempts.
    return { success: false, message: `Failed to send email. Please check server logs and ensure your Gmail account allows less secure apps or has an App Password set up. Error: ${error.message}` };
  }
}
