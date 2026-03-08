import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      servername: "mail.dreamhost.com",
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

export async function sendConfirmationEmail(
  email: string,
  name: string | null,
  token: string,
  appUrl: string
) {
  const confirmUrl = `${appUrl}/api/confirm?token=${token}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">TechPulse MX</h1>
      <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">Confirma tu suscripcion</p>
    </div>
    <div style="background:#111111;padding:32px;border-radius:0 0 16px 16px;">
      <p style="color:#e2e8f0;font-size:16px;line-height:1.6;">
        Hola${name ? ` ${name}` : ""},
      </p>
      <p style="color:#94a3b8;font-size:15px;line-height:1.6;">
        Gracias por suscribirte a TechPulse MX. Para confirmar tu email y empezar a recibir
        las mejores noticias de tech, AI y startups, haz clic en el boton:
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">
          Confirmar suscripcion
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.5;">
        Si no solicitaste esta suscripcion, simplemente ignora este email.
      </p>
    </div>
    <p style="color:#475569;font-size:11px;text-align:center;margin-top:16px;">
      TechPulse MX - Tu dosis semanal de tech, AI y startups
    </p>
  </div>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: "Confirma tu suscripcion a TechPulse MX",
    html,
  });
}

export async function sendBulkEmails(
  subscribers: { email: string; token: string }[],
  subject: string,
  htmlTemplate: string,
  appUrl: string
) {
  const results: { email: string; status: string; error?: string }[] = [];
  for (const sub of subscribers) {
    const personalizedHtml = htmlTemplate.replace(
      /\{\{unsubscribe_url\}\}/g,
      `${appUrl}/api/unsubscribe?token=${sub.token}`
    );
    try {
      await sendEmail({ to: sub.email, subject, html: personalizedHtml });
      results.push({ email: sub.email, status: "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to send to ${sub.email}:`, msg);
      results.push({ email: sub.email, status: "failed", error: msg });
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}
