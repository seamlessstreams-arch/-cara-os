// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY TREND API ROUTE
// GET /api/v1/recording-quality-trend
//
// Weekly trajectory of recording quality (and the child's voice) — composes the
// recording-quality engine over time. CHR 2015 Reg 13 (driving improvement).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeRecordingQuality } from "@/lib/recording-quality/recording-quality-engine";
import { mapStoreToRecords } from "@/lib/recording-quality/store-records";
import { computeRecordingQualityTrend } from "@/lib/recording-quality-trend/recording-quality-trend-engine";

export async function GET() {
  const quality = computeRecordingQuality({ records: mapStoreToRecords(getStore()) });
  const result = computeRecordingQualityTrend({ records: quality.records, weeks: 8 });
  return NextResponse.json({ data: result });
}
