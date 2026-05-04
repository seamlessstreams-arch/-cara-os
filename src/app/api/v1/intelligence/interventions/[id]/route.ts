import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { InterventionStatus, InterventionOutcome } from "@/types/extended";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json() as {
    status?: InterventionStatus;
    outcome?: InterventionOutcome;
    outcome_notes?: string;
    ended_at?: string;
    review_date?: string;
    agreed_by?: string;
  };

  const validStatuses: InterventionStatus[] = ["active", "paused", "completed", "stopped", "under_review"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const validOutcomes: InterventionOutcome[] = ["working", "not_working", "partially_working", "too_early", "unknown"];
  if (body.outcome && !validOutcomes.includes(body.outcome)) {
    return NextResponse.json(
      { error: `outcome must be one of: ${validOutcomes.join(", ")}` },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.outcome !== undefined) patch.outcome = body.outcome;
  if (body.outcome_notes !== undefined) patch.outcome_notes = body.outcome_notes;
  if (body.ended_at !== undefined) patch.ended_at = body.ended_at;
  if (body.review_date !== undefined) patch.review_date = body.review_date;
  if (body.agreed_by !== undefined) patch.agreed_by = body.agreed_by;

  const updated = intelligenceDb.interventions.patch(id, patch);

  if (!updated) {
    return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
