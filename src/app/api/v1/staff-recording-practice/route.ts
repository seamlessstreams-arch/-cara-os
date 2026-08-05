// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RECORDING PRACTICE API ROUTE
// GET /api/v1/staff-recording-practice
//
// Rolls the per-record recording-quality scores up by staff member, so leaders
// can target recording support in supervision. Composes the recording-quality
// engine. CHR 2015 Reg 33 (supervision) / Reg 36 (records) / Reg 13.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { computeRecordingQuality } from "@/lib/recording-quality/recording-quality-engine";
import { mapStoreToRecords } from "@/lib/recording-quality/store-records";
import { computeStaffRecordingPractice } from "@/lib/staff-recording-practice/staff-recording-practice-engine";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
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
  const [dailyLog, incidents, keyWorkingSessions, youngPeople] = await Promise.all([dal.dailyLog.findAll(), dal.incidents.findAll(), dal.keyWorkingSessions.findAll(), dal.youngPeople.findAll()]);
  const quality = computeRecordingQuality({ records: mapStoreToRecords({ dailyLog, incidents, keyWorkingSessions, youngPeople }) });
  const staff = ((await safeList(dal.staff.findAll())) as any[]).map((s: any) => ({
    id: s.id,
    name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
  }));
  const result = computeStaffRecordingPractice({ records: quality.records, staff });
  return NextResponse.json({ data: result });
}
