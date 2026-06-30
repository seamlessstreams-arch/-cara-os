import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const needs = intelligenceDb.trainingNeeds.findAll(homeId);
  return NextResponse.json({
    data: needs,
    meta: {
      total: needs.length,
      urgent: needs.filter((n) => n.priority === "urgent").length,
      open: needs.filter((n) => !["completed", "no_action"].includes(n.status)).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const record = intelligenceDb.trainingNeeds.create({
    home_id: body.home_id ?? "home_oak",
    identified_by: body.identified_by ?? "manual",
    need_type: body.need_type ?? "safeguarding",
    title: body.title ?? "Training Need",
    description: body.description ?? "",
    priority: body.priority ?? "medium",
    status: "identified",
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
