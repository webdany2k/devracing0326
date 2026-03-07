import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const newsletter = await prisma.newsletter.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!newsletter) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      id: newsletter.id,
      subject: newsletter.subject,
      htmlContent: newsletter.htmlContent,
      createdAt: newsletter.createdAt,
    });
  } catch (error) {
    console.error("Latest newsletter error:", error);
    return NextResponse.json(null);
  }
}
