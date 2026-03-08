import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Suscriptor no encontrado" },
        { status: 404 }
      );
    }

    if (subscriber.confirmed) {
      return new NextResponse(
        confirmationHtml("Ya confirmado", "Tu email ya estaba confirmado. Ya estas recibiendo TechPulse MX."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    await prisma.subscriber.update({
      where: { token },
      data: { confirmed: true },
    });

    return new NextResponse(
      confirmationHtml("Suscripcion confirmada", "Tu email ha sido confirmado exitosamente. Empezaras a recibir TechPulse MX muy pronto."),
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Confirm error:", error);
    return NextResponse.json({ error: "Error al confirmar" }, { status: 500 });
  }
}

function confirmationHtml(title: string, message: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#030305;color:#e2e8f0;font-family:system-ui;margin:0;">
  <div style="text-align:center;max-width:440px;padding:40px;">
    <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:20px;">
      &#10003;
    </div>
    <h1 style="background:linear-gradient(to right,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:28px;margin:0 0 12px;">${title}</h1>
    <p style="color:#94a3b8;font-size:16px;line-height:1.6;">${message}</p>
    <a href="/" style="display:inline-block;margin-top:24px;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">
      Volver al inicio
    </a>
  </div>
</body>
</html>`;
}
