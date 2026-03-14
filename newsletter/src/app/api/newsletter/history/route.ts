import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const [newsletters, total] = await Promise.all([
    prisma.newsletter.findMany({
      select: {
        id: true,
        subject: true,
        sentAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.newsletter.count(),
  ]);

  return NextResponse.json({
    total,
    limit,
    offset,
    newsletters,
  });
}
