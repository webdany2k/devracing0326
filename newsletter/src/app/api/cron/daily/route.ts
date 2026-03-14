import { NextRequest, NextResponse } from "next/server";
import { runDailyCron } from "@/lib/cron-helpers";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyCron();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Daily cron error:", error);
    return NextResponse.json(
      { error: "Error en cron diario" },
      { status: 500 }
    );
  }
}
