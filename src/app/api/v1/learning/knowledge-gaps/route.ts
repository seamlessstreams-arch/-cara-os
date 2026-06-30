import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const gaps = intelligenceDb.knowledgeGaps.findAll(homeId);
  return NextResponse.json({
    data: gaps,
    meta: { total: gaps.length, critical: gaps.filter((g) => g.severity === "critical").length },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const record = intelligenceDb.knowledgeGaps.create({
    home_id: body.home_id ?? "home_oak",
    gap_area: body.gap_area ?? "",
    severity: body.severity ?? "moderate",
    identified_from: body.identified_from ?? "supervision",
    status: "open",
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
