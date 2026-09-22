import nodemailer from 'nodemailer';

export const sendEmail = async (options: { email: string; subject: string; message: string }): Promise<boolean> => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.log('----------------------------------------------------');
    console.log('SMTP Config Missing. Logging email to console instead:');
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log('----------------------------------------------------');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465, // true for 465, false for 587/other
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      connectionTimeout: 10000, // 10s connection timeout
      greetingTimeout: 5000,
      socketTimeout: 10000,
    } as any);

    const mailOptions = {
      from: `"BhoomiSetu" <${SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Successfully sent email to ${options.email} (${options.subject})`);
    return true;
  } catch (error: any) {
    // Catch all network errors (including ENETUNREACH, ETIMEDOUT, IPv6 reachability issues on Render)
    // NEVER throw the error so the registration controller can send HTTP 201 cleanly
    console.error(`[SMTP ERROR] Failed to send email to ${options.email}:`, error?.message || error);
    return false;
  }
};

