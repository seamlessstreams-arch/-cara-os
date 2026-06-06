import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { withShiftAccess } from "@/lib/permissions/with-shift-access";

export const dynamic = "force-dynamic";

// GET /api/v1/daily-log/:id — single daily log entry (guarded: daily_log / view)
// Dual-mode: real Supabase `daily_log_entries` table when enabled, store otherwise.
async function getDailyLogEntry(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await dal.dailyLog.findAll();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entry = (all as any[]).find((e) => e.id === id);
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  return NextResponse.json({ data: entry });
}

export const GET = withShiftAccess("daily_log", "view", getDailyLogEntry);
