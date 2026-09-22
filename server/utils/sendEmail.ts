export const sendEmail = async (options: { email: string; subject: string; message: string }): Promise<boolean> => {
  // Mock email delivery for prototype - bypasses outbound SMTP blocks on cloud hosts like Render
  console.log('[MOCK EMAIL] OTP Sent to:', options.email);
  console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
  console.log(`[MOCK EMAIL] Content: ${options.message}`);
  return true;
};


