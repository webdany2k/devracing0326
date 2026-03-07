import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

export async function sendBulkEmails(
  subscribers: { email: string; token: string }[],
  subject: string,
  htmlTemplate: string,
  appUrl: string
) {
  const results = [];
  for (const sub of subscribers) {
    const personalizedHtml = htmlTemplate.replace(
      /\{\{unsubscribe_url\}\}/g,
      `${appUrl}/api/unsubscribe?token=${sub.token}`
    );
    try {
      await sendEmail({ to: sub.email, subject, html: personalizedHtml });
      results.push({ email: sub.email, status: "sent" });
    } catch (error) {
      results.push({ email: sub.email, status: "failed", error });
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}
