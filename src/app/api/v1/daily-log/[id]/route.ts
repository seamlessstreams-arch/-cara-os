import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";

export const dynamic = "force-dynamic";

// GET /api/v1/daily-log/:id — single daily log entry (guarded: daily_log / view)
async function getDailyLogEntry(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = db.dailyLog.findAll().find((e) => e.id === id);
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  return NextResponse.json({ data: entry });
}

export const GET = withShiftAccess("daily_log", "view", getDailyLogEntry);
