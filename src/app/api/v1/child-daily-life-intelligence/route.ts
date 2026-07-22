// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD DAILY LIFE INTELLIGENCE API ROUTE
// GET /api/v1/child-daily-life-intelligence?childId=yp_alex
// Per-child engine analysing daily log entries: mood patterns, recording
// frequency, entry type coverage, significant events.
// CHR 2015 Reg 10, 6, 36. SCCIF: "Quality of care."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db/dal";
import {
  computeChildDailyLife,
  type DailyLogEntryInput,
} from "@/lib/engines/child-daily-life-intelligence-engine";

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const [youngPeople, dailyLog] = await Promise.all([
    safeList(dal.youngPeople.findAll()),
    safeList(dal.dailyLog.findAll()),
  ]);

  // ── Child info ─────────────────────────────────────────────────────────
  const child = youngPeople.find((yp: any) => yp.id === childId) as any;
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = (child.name ?? `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim()) || childId;

  // ── Daily Log Entries ──────────────────────────────────────────────────
  const entries: DailyLogEntryInput[] = dailyLog
    .filter((e: any) => e.child_id === childId)
    .map((e: any) => ({
      id: e.id,
      date: (e.date ?? today).toString().slice(0, 10),
      time: e.time ?? "12:00",
      entry_type: e.entry_type ?? "general",
      mood_score: typeof e.mood_score === "number" ? e.mood_score : null,
      is_significant: !!e.is_significant,
      has_linked_incident: !!(e.linked_incident_id),
      staff_id: e.staff_id ?? "unknown",
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildDailyLife({
    today,
    child_id: childId,
    child_name: childName,
    entries,
  });

  return NextResponse.json({ data: result });
}
