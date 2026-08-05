// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY TREND API ROUTE
// GET /api/v1/recording-quality-trend
//
// Weekly trajectory of recording quality (and the child's voice) — composes the
// recording-quality engine over time. CHR 2015 Reg 13 (driving improvement).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { computeRecordingQuality } from "@/lib/recording-quality/recording-quality-engine";
import { mapStoreToRecords } from "@/lib/recording-quality/store-records";
import { computeRecordingQualityTrend } from "@/lib/recording-quality-trend/recording-quality-trend-engine";

export async function GET() {
  const [dailyLog, incidents, keyWorkingSessions, youngPeople] = await Promise.all([dal.dailyLog.findAll(), dal.incidents.findAll(), dal.keyWorkingSessions.findAll(), dal.youngPeople.findAll()]);
  const quality = computeRecordingQuality({ records: mapStoreToRecords({ dailyLog, incidents, keyWorkingSessions, youngPeople }) });
  const result = computeRecordingQualityTrend({ records: quality.records, weeks: 8 });
  return NextResponse.json({ data: result });
}
