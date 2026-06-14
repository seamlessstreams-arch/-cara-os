import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

export async function GET(req: NextRequest) {
  const homeId  = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const childId = req.nextUrl.searchParams.get("child_id");

  if (childId) {
    const plan = intelligenceDb.carePlans.findByChild(childId);
    if (!plan) return NextResponse.json({ data: null });
    return NextResponse.json({ data: plan });
  }

  const plans = intelligenceDb.carePlans.findAll(homeId);

  // Headline counts must reflect LIVE plans only. An archived plan (child
  // discharged, or a superseded version) keeps its old next_lac_review date —
  // by definition in the past — so counting it produced a phantom statutory
  // breach that could never be cleared. Mirrors the service-layer convention
  // (care-planning-service.ts excludes "archived").
  const livePlans = plans.filter((p) => p.status !== "archived");

  const attentionCount = livePlans.reduce(
    (n, p) => n + p.goals.filter((g) => g.status === "attention_needed").length,
    0,
  );
  const lacOverdue = livePlans.filter((p) => {
    if (!p.next_lac_review) return false;
    return new Date(p.next_lac_review) < new Date();
  }).length;

  return NextResponse.json({
    data: plans,
    meta: { total: plans.length, attention_needed: attentionCount, lac_overdue: lacOverdue },
  });
}

export async function POST(req: NextRequest) {
  const body   = await req.json();
  const record = intelligenceDb.carePlans.create({
    home_id:                   body.home_id ?? "home_oak",
    child_id:                  body.child_id ?? "",
    version:                   body.version ?? 1,
    status:                    "active",
    placement_start:           body.placement_start ?? new Date().toISOString().split("T")[0],
    current_placement_type:    body.current_placement_type ?? "Full-time residential",
    legal_status:              body.legal_status ?? "",
    goals:                     body.goals ?? [],
    last_lac_review:           body.last_lac_review ?? null,
    next_lac_review:           body.next_lac_review ?? null,
    lac_review_frequency_months: body.lac_review_frequency_months ?? 6,
    keyworker_id:              body.keyworker_id ?? null,
    rm_id:                     body.rm_id ?? null,
    rm_sign_off_date:          null,
    rm_sign_off_by:            null,
    strengths_summary:         null,
    concerns_summary:          null,
    cara_overview:             null,
    created_by:                body.created_by ?? "staff_darren",
  });
  return NextResponse.json({ data: record }, { status: 201 });
}
