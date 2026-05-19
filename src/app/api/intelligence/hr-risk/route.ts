import { NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { hrCases, hrOverdueTasks, hrRecruitment } from "@/lib/intelligence/fallback-store";

export async function GET() {
  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      ok: true,
      cases: [...hrCases],
      overdueTasks: [...hrOverdueTasks],
      recruitment: [...hrRecruitment],
      persisted: true,
    });
  }
  return NextResponse.json({
    ok: true,
    cases: [],
    overdueTasks: [],
    recruitment: [],
    persisted: false,
  });
}
