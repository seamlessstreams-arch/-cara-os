import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { generateId, todayStr } from "@/lib/utils";
import type { DailyLogEntry } from "@/types";

// GET /api/v1/daily-log
// Query params: ?child_id= &date= &entry_type= &days=7
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const child_id = searchParams.get("child_id");
  const date = searchParams.get("date");
  const entry_type = searchParams.get("entry_type") as DailyLogEntry["entry_type"] | null;
  const days = searchParams.has("days") ? parseInt(searchParams.get("days")!, 10) : null;

  let entries = db.dailyLog.findAll();

  if (child_id) {
    entries = entries.filter((e) => e.child_id === child_id);
  }
  if (date) {
    entries = entries.filter((e) => e.date === date);
  }
  if (entry_type) {
    entries = entries.filter((e) => e.entry_type === entry_type);
  }
  if (days !== null && !date) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    entries = entries.filter((e) => e.date >= cutoffStr);
  }

  // Sort newest first (by date + time)
  const sorted = [...entries].sort((a, b) => {
    const ta = `${a.date}T${a.time}`;
    const tb = `${b.date}T${b.time}`;
    return tb.localeCompare(ta);
  });

  // Count by entry_type
  const counts: Record<string, number> = {};
  for (const e of sorted) {
    counts[e.entry_type] = (counts[e.entry_type] || 0) + 1;
  }

  return NextResponse.json({
    data: sorted,
    meta: { total: sorted.length, by_type: counts },
  });
}

// POST /api/v1/daily-log
// Required: child_id, entry_type, content
export async function POST(req: NextRequest) {
  let body: {
    child_id?: string;
    entry_type?: DailyLogEntry["entry_type"];
    content?: string;
    mood_score?: number | null;
    is_significant?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { child_id, entry_type, content, mood_score, is_significant } = body;

  if (!child_id || !entry_type || !content) {
    return NextResponse.json({ error: "child_id, entry_type, and content are required" }, { status: 400 });
  }

  const now = new Date();
  const time = now.toTimeString().slice(0, 5); // "HH:MM"
  const nowIso = now.toISOString();

  const newEntry: DailyLogEntry = {
    id: generateId("log"),
    child_id,
    entry_type,
    content,
    date: todayStr(),
    time,
    mood_score: mood_score ?? null,
    staff_id: "staff_darren",
    linked_incident_id: null,
    is_significant: is_significant ?? false,
    home_id: "home_oak",
    created_at: nowIso,
    updated_at: nowIso,
    created_by: "staff_darren",
    updated_by: "staff_darren",
  };

  const created = db.dailyLog.create(newEntry);

  return NextResponse.json({ data: created }, { status: 201 });
}
