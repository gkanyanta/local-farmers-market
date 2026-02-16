import { Resend } from "resend";

let resend: Resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "noreply@example.com";
  const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: fromEmail,
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
