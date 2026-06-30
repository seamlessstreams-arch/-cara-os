import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { Intervention } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const homeId = searchParams.get("home_id") ?? "home_oak";
  const status = searchParams.get("status");

  let results: Intervention[];

  if (childId) {
    results = intelligenceDb.interventions.findByChild(childId);
  } else {
    results = intelligenceDb.interventions.findAll(homeId);
  }

  if (status) {
    results = results.filter((i) => i.status === status);
  }

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      active: results.filter((i) => i.status === "active").length,
      under_review: results.filter((i) => i.status === "under_review").length,
    },
  });
}

export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Partial<Intervention>;
  const denied = assertChildHomeAccess(identity, (body as { child_id?: string }).child_id);
  if (denied) return denied;

  const required = ["child_id", "title", "description", "rationale", "started_at", "intended_outcome"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const intervention = intelligenceDb.interventions.create({
    home_id: body.home_id ?? "home_oak",
    child_id: body.child_id!,
    title: body.title!,
    description: body.description!,
    rationale: body.rationale!,
    started_at: body.started_at!,
    review_date: body.review_date ?? null,
    ended_at: body.ended_at ?? null,
    agreed_by: body.agreed_by ?? null,
    status: body.status ?? "active",
    intended_outcome: body.intended_outcome!,
    outcome: body.outcome ?? "too_early",
    outcome_notes: body.outcome_notes ?? null,
    evidence_refs: body.evidence_refs ?? [],
    created_by: body.created_by ?? "staff_darren",
  });

  return NextResponse.json({ data: intervention }, { status: 201 });
}
