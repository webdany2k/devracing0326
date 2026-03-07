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

    await prisma.subscriber.update({
      where: { token },
      data: { active: false },
    });

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Desuscrito</title></head>
        <body style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#e2e8f0;font-family:system-ui;">
          <div style="text-align:center;max-width:400px;">
            <h1 style="color:#818cf8;">Hasta pronto</h1>
            <p>Te has desuscrito exitosamente de TechPulse MX.</p>
            <p style="color:#64748b;">Si cambias de opinion, siempre puedes volver a suscribirte.</p>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Error al procesar" },
      { status: 500 }
    );
  }
}
