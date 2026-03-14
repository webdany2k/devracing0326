import { NextRequest, NextResponse } from "next/server";
import { runWeeklyCron } from "@/lib/cron-helpers";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyCron();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Weekly cron error:", error);
    return NextResponse.json(
      { error: "Error en cron semanal" },
      { status: 500 }
    );
  }
}
