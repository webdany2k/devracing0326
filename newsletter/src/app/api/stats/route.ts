import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [subscriberCount, newsletterCount] = await Promise.all([
      prisma.subscriber.count({ where: { confirmed: true, active: true } }),
      prisma.newsletter.count({ where: { sentAt: { not: null } } }),
    ]);

    return NextResponse.json({ subscriberCount, newsletterCount });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ subscriberCount: 0, newsletterCount: 0 });
  }
}
