import { google } from 'googleapis';

export interface SendEmailOptions {
  email: string;
  subject: string;
  message: string;
}

export const sendEmail = async (options: { email: string; subject: string; message: string }): Promise<boolean> => {
  try {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    const senderEmail = process.env.GMAIL_SENDER_EMAIL;

    if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
      console.warn(
        '[GMAIL API WARNING] Missing Gmail API credentials in environment variables (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, or GMAIL_SENDER_EMAIL). Email dispatch skipped.'
      );
      return false;
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    // Set credentials with refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Construct RFC 2822 compliant raw email string
    const emailLines = [
      `From: ${senderEmail}`,
      `To: ${options.email}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${options.subject}`,
      '',
      options.message,
    ];
    const rawEmailString = emailLines.join('\r\n');

    // Base64Url encode the raw email string
    const base64EncodedEmail = Buffer.from(rawEmailString, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send email via Gmail API REST endpoint over HTTPS (port 443)
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: base64EncodedEmail,
      },
    });

    console.log(`[GMAIL API] Email successfully dispatched to ${options.email}. Message ID: ${response.data.id}`);
    return true;
  } catch (error: any) {
    console.error('[GMAIL API ERROR] Failed to send email via Gmail API:', error?.response?.data || error?.message || error);
    // Return false instead of throwing so auth flow can gracefully continue
    return false;
  }
};



