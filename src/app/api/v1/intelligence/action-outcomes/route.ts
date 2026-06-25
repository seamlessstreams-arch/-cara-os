import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { ActionOutcome } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  const homeId = searchParams.get("home_id") ?? "home_oak";
  const status = searchParams.get("status");

  let results: ActionOutcome[];

  if (childId) {
    results = intelligenceDb.actionOutcomes.findByChild(childId);
  } else {
    results = intelligenceDb.actionOutcomes.findAll(homeId);
  }

  if (status) {
    results = results.filter((a) => a.status === status);
  }

  return NextResponse.json({
    data: results,
    meta: {
      total: results.length,
      open: results.filter((a) => a.status === "open").length,
      in_progress: results.filter((a) => a.status === "in_progress").length,
      completed: results.filter((a) => a.status === "completed").length,
      overdue: results.filter((a) => a.status === "overdue").length,
    },
  });
}

export async function POST(req: NextRequest) {

  const identity = await getRequestIdentity(req);
  if (identity instanceof NextResponse) return identity;
  const body = await req.json() as Partial<ActionOutcome>;
  const denied = assertChildHomeAccess(identity, (body as { child_id?: string }).child_id);
  if (denied) return denied;

  const required = ["title", "what_was_agreed", "why_it_matters"] as const;
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  const outcome = intelligenceDb.actionOutcomes.create({
    home_id: body.home_id ?? "home_oak",
    task_id: body.task_id ?? null,
    child_id: body.child_id ?? null,
    title: body.title!,
    what_was_agreed: body.what_was_agreed!,
    why_it_matters: body.why_it_matters!,
    owner_id: body.owner_id ?? null,
    due_date: body.due_date ?? null,
    completed_at: null,
    what_was_done: null,
    what_changed: null,
    effectiveness: null,
    effectiveness_notes: null,
    status: body.status ?? "open",
    linked_evidence: body.linked_evidence ?? [],
    should_continue: null,
    created_by: body.created_by ?? "staff_darren",
  });

  return NextResponse.json({ data: outcome }, { status: 201 });
}
