// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF RECORDING PRACTICE API ROUTE
// GET /api/v1/staff-recording-practice
//
// Rolls the per-record recording-quality scores up by staff member, so leaders
// can target recording support in supervision. Composes the recording-quality
// engine. CHR 2015 Reg 33 (supervision) / Reg 36 (records) / Reg 13.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeRecordingQuality } from "@/lib/recording-quality/recording-quality-engine";
import { mapStoreToRecords } from "@/lib/recording-quality/store-records";
import { computeStaffRecordingPractice } from "@/lib/staff-recording-practice/staff-recording-practice-engine";

export async function GET() {
  const store = getStore();
  const quality = computeRecordingQuality({ records: mapStoreToRecords(store) });
  const staff = ((store.staff ?? []) as any[]).map((s: any) => ({
    id: s.id,
    name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
  }));
  const result = computeStaffRecordingPractice({ records: quality.records, staff });
  return NextResponse.json({ data: result });
}
