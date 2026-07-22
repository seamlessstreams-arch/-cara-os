// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/recording-quality-intelligence
// Returns daily log recording compliance analysis, quality scores,
// staff recording profiles, and child mention coverage.
// Reg 36, SCCIF day-to-day evidence, child voice and mood capture.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import {
  computeRecordingQualityIntelligence,
  type DailyLogInput,
  type StaffRef,
  type ChildRef,
} from "@/lib/engines/recording-quality-intelligence-engine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const [dailyLog, staffList, youngPeople] = await Promise.all([
    safeList(dal.dailyLog.findAll()),
    safeList(dal.staff.findAll()),
    safeList(dal.youngPeople.findAll()),
  ]);

  // ── Map daily log entries ─────────────────────────────────────────────
  const entries: DailyLogInput[] = dailyLog.map((e: any) => ({
    id: e.id,
    child_id: e.child_id,
    date: e.date,
    time: e.time,
    entry_type: e.entry_type,
    content: e.content,
    mood_score: e.mood_score ?? null,
    staff_id: e.staff_id,
    is_significant: e.is_significant ?? false,
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const staff: StaffRef[] = staffList
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Map young people ──────────────────────────────────────────────────
  const children: ChildRef[] = youngPeople.map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeRecordingQualityIntelligence({
    entries,
    children,
    staff,
  });

  return NextResponse.json({ data: result });
}
