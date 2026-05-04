import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json() as {
    status?: string;
    what_was_done?: string;
    what_changed?: string;
    effectiveness?: string;
    effectiveness_notes?: string;
    should_continue?: boolean;
    completed_at?: string;
    due_date?: string;
    owner_id?: string;
  };

  const validStatuses = ["open", "in_progress", "completed", "overdue", "stalled", "cancelled"];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const validEffectiveness = ["very_effective", "effective", "partially_effective", "ineffective", "unknown"];
  if (body.effectiveness && !validEffectiveness.includes(body.effectiveness)) {
    return NextResponse.json(
      { error: `effectiveness must be one of: ${validEffectiveness.join(", ")}` },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.what_was_done !== undefined) patch.what_was_done = body.what_was_done;
  if (body.what_changed !== undefined) patch.what_changed = body.what_changed;
  if (body.effectiveness !== undefined) patch.effectiveness = body.effectiveness;
  if (body.effectiveness_notes !== undefined) patch.effectiveness_notes = body.effectiveness_notes;
  if (body.should_continue !== undefined) patch.should_continue = body.should_continue;
  if (body.due_date !== undefined) patch.due_date = body.due_date;
  if (body.owner_id !== undefined) patch.owner_id = body.owner_id;

  // Auto-set completed_at when status moves to completed
  if (body.status === "completed" && !body.completed_at) {
    patch.completed_at = new Date().toISOString();
  } else if (body.completed_at !== undefined) {
    patch.completed_at = body.completed_at;
  }

  const updated = intelligenceDb.actionOutcomes.patch(id, patch);

  if (!updated) {
    return NextResponse.json({ error: "Action outcome not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
