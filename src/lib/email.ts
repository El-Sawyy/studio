'use server';

import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email notifications will be disabled.');
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
  const subject = `New ${data.type} added to your profile`;
  const text = `
Hello ${data.agentName},

A new ${data.type} has been added to your profile.

Type: ${data.documentType}
Date: ${data.documentDate}
Added By: ${data.createdBy}

You can view it now by logging into your Tempo Triumph dashboard.

Thank you,
Your Management Team
  `;
  const html = `
<p>Hello ${data.agentName},</p>
<p>A new <strong>${data.type}</strong> has been added to your profile.</p>
<ul>
  <li><strong>Type:</strong> ${data.documentType}</li>
  <li><strong>Date:</strong> ${data.documentDate}</li>
  <li><strong>Added By:</strong> ${data.createdBy}</li>
</ul>
<p>You can view it now by logging into your Tempo Triumph dashboard.</p>
<p>Thank you,<br>Your Management Team</p>
  `;

  return { subject, text, html };
}

export async function sendNotificationEmail(data: EmailData) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email notifications disabled. Would have sent:', data);
    return;
  }

  const { subject, text, html } = getEmailContent(data);

  const msg = {
    to: data.to,
    from: 'notifications@tempo-triumph.com', // This should be a verified sender in your SendGrid account
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Notification email sent to:', data.to);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}
