import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      where: { sentAt: { not: null } },
      select: {
        id: true,
        subject: true,
        type: true,
        sentAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json(newsletters);
  } catch (error) {
    console.error("Recent newsletters error:", error);
    return NextResponse.json([]);
  }
}
