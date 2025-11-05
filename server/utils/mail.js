const nodemailer = require('nodemailer');

const createTransporter = () => {
  // If using Gmail service, use simpler configuration
  if (process.env.MAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS // Must be App Password, not regular password
      }
    });
  }

  // Otherwise use custom SMTP configuration
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_PORT == 465 || process.env.MAIL_PORT == '465',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

const sendInviteEmail = async (email, inviteToken, roomName, inviterName) => {
  try {
    const transporter = createTransporter();
    const inviteLink = `${process.env.FRONTEND_URL}/join/${inviteToken}`;

    const mailOptions = {
      from: `"${inviterName}" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Join My Collaborative Code Session',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Collaborative Code Editor</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${inviterName}</strong> has invited you to join a collaborative coding session in room: <strong>${roomName}</strong>.</p>
              <p>Click the link below to join instantly:</p>
              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Join Room</a>
              </p>
              <p>Or copy this link:</p>
              <p style="word-break: break-all; color: #4F46E5;">${inviteLink}</p>
              <p><small>This invitation expires in 24 hours.</small></p>
            </div>
            <div class="footer">
              <p>This is an automated email from Collab Editor</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendInviteEmail };

