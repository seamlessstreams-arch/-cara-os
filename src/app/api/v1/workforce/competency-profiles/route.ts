import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staff_id");
  const homeId = searchParams.get("home_id");

  let results = db.competencyProfiles.findAll();
  if (staffId) {
    const single = db.competencyProfiles.findByStaff(staffId);
    return NextResponse.json({ data: single ?? null });
  }
  if (homeId) results = results.filter((p) => p.home_id === homeId);

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      avg_readiness: results.length
        ? Math.round(results.reduce((s, p) => s + p.overall_readiness_score, 0) / results.length)
        : 0,
    },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const profile = db.competencyProfiles.create({
    ...body,
    home_id: body.home_id ?? "home_oak",
    domain_scores: body.domain_scores ?? [],
    strengths: body.strengths ?? [],
    development_areas: body.development_areas ?? [],
  });
  return NextResponse.json({ data: profile }, { status: 201 });
}
