import { NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  hrInspectionWorkforce,
  hrInspectionRecruitment,
  hrInspectionCases,
  hrInspectionChronology,
  hrInspectionSuspensions,
  hrInspectionLado,
  hrInspectionCompliance,
  hrInspectionOversight,
} from "@/lib/intelligence/fallback-store";

export async function GET() {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      ok: true,
      workforce: { ...hrInspectionWorkforce },
      recruitment: [...hrInspectionRecruitment],
      cases: [...hrInspectionCases],
      chronology: [...hrInspectionChronology],
      suspensions: [...hrInspectionSuspensions],
      lado: [...hrInspectionLado],
      compliance: [...hrInspectionCompliance],
      oversight: [...hrInspectionOversight],
      persisted: true,
    });
  }
  return NextResponse.json({
    ok: true,
    workforce: null,
    recruitment: [],
    cases: [],
    chronology: [],
    suspensions: [],
    lado: [],
    compliance: [],
    oversight: [],
    persisted: false,
  });
}
