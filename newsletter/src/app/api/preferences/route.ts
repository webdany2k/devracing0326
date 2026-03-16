import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTopics } from "@/lib/topics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { token },
      select: {
        email: true,
        name: true,
        frequency: true,
        topics: true,
        customPrompt: true,
        active: true,
      },
    });

    if (!subscriber || !subscriber.active) {
      return NextResponse.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    }

    let topics: string[] = [];
    try {
      topics = JSON.parse(subscriber.topics);
    } catch {
      topics = ["techAI", "devTips", "startups"];
    }

    return NextResponse.json({
      email: subscriber.email,
      name: subscriber.name,
      frequency: subscriber.frequency,
      topics,
      customPrompt: subscriber.customPrompt,
    });
  } catch (error) {
    console.error("Preferences GET error:", error);
    return NextResponse.json({ error: "Error al obtener preferencias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, topics, frequency, customPrompt } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { token } });
    if (!subscriber || !subscriber.active) {
      return NextResponse.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    }

    const validTopics = validateTopics(topics);
    if (!validTopics) {
      return NextResponse.json({ error: "Debes seleccionar al menos un tema" }, { status: 400 });
    }

    const validFrequency = frequency === "daily" || frequency === "weekly" ? frequency : subscriber.frequency;

    await prisma.subscriber.update({
      where: { token },
      data: {
        topics: JSON.stringify(validTopics),
        frequency: validFrequency,
        customPrompt: customPrompt || null,
      },
    });

    return NextResponse.json({ message: "Preferencias actualizadas" });
  } catch (error) {
    console.error("Preferences POST error:", error);
    return NextResponse.json({ error: "Error al actualizar preferencias" }, { status: 500 });
  }
}
