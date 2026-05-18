import { NextRequest, NextResponse } from "next/server";
import {
  generateEqualityDiversityIntelligence,
  getDemoProfiles,
  getDemoTrainingRecords,
  getDemoIncidents,
  getDemoAudits,
} from "@/lib/equality-diversity";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");

  if (!homeId) {
    return NextResponse.json({ error: "homeId required" }, { status: 400 });
  }

  const periodStart = searchParams.get("periodStart") ?? "2026-01-01";
  const periodEnd = searchParams.get("periodEnd") ?? "2026-05-18";
  const totalStaff = parseInt(searchParams.get("totalStaff") ?? "4", 10);

  // Use demo data (in production this would come from Supabase)
  const profiles = getDemoProfiles();
  const trainingRecords = getDemoTrainingRecords();
  const incidents = getDemoIncidents();
  const audits = getDemoAudits();

  const result = generateEqualityDiversityIntelligence(
    profiles,
    trainingRecords,
    incidents,
    audits,
    totalStaff,
    homeId,
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ ok: true, data: result });
}
