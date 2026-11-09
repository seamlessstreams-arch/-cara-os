// ══════════════════════════════════════════════════════════════════════════════
// POST /api/practice-patterns/queue/:id/decision — approve or reject (4d)
//
// A named reviewer decides, always with a recorded reason. The audit entry is
// written FIRST: if it cannot be recorded, nothing is decided (503). Approval
// saves the reviewer's own final wording as a runtime pattern, which joins the
// practice library with no deploy (P4-6). Nothing is ever approved by Cara.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { readJsonBody } from "@/lib/http/read-json";
import { todayStr } from "@/lib/utils";
import { isCandidateRecord, type PatternCandidate } from "@/lib/practice-patterns/intake-pipeline";
import {
  candidateStore,
  findRuntimePatternBySourceUrl,
  recordIntakeAudit,
  resolveStaffName,
  runtimePatternStore,
} from "@/lib/practice-patterns/intake-store";
import { decideCandidate } from "@/lib/practice-patterns/review-queue";

const WordingSchema = z.strictObject({
  name: z.string().min(3).max(140),
  summary: z.string().min(20).max(1200),
  key_questions: z.array(z.string().min(5).max(300)).min(1).max(8),
  evidence_indicators: z.array(z.string().min(3).max(300)).max(8).optional(),
  failure_modes: z.array(z.string().min(3).max(300)).max(8).optional(),
  claim_basis: z.enum(["practitioner_view", "good_practice"]).optional(),
  domains: z.array(z.string().max(40)).max(17).optional(),
});

const DecisionSchema = z.discriminatedUnion("decision", [
  z.strictObject({ decision: z.literal("approve"), reason: z.string().max(1000), pattern: WordingSchema }),
  z.strictObject({ decision: z.literal("reject"), reason: z.string().max(1000) }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.APPROVE_LEARNING_RESOURCES);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = await readJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = DecisionSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid decision",
        issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }

  let candidate: PatternCandidate | null;
  try {
    const found = await candidateStore.findById(id);
    candidate = isCandidateRecord(found) ? found : null;
  } catch {
    return NextResponse.json({ error: "Queue unavailable", detail: "The candidate could not be read." }, { status: 503 });
  }
  if (!candidate) {
    return NextResponse.json({ error: "Not found", detail: "No candidate with that id is in the review queue." }, { status: 404 });
  }

  const result = decideCandidate(
    candidate,
    parsed.data,
    { userId: auth.userId, name: await resolveStaffName(auth.userId) },
    { now: new Date().toISOString(), today: todayStr() },
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error, details: result.details }, { status: result.status });
  }

  // Audit first: no decision stands without a recorded who, when and why.
  const audit = await recordIntakeAudit({
    action: result.outcome === "approved" ? "pattern_candidate_approved" : "pattern_candidate_rejected",
    actorId: auth.userId,
    entityId: candidate.id,
    reason: result.decision.reason,
  });
  if (!audit.recorded) {
    return NextResponse.json(
      {
        error: "Not decided",
        detail: "The audit trail could not be written, so the decision was not saved. Nothing has changed.",
      },
      { status: 503 },
    );
  }

  try {
    if (result.outcome === "approved") {
      // Retry-safe: a pattern already saved from this link is reused, not duplicated.
      const saved =
        (await findRuntimePatternBySourceUrl(candidate.url)) ??
        (await runtimePatternStore.create({ ...result.pattern, created_by: auth.userId }));
      const updated = await candidateStore.update(candidate.id, {
        status: "approved",
        decision: { ...result.decision, pattern_id: saved.id },
        updated_by: auth.userId,
      });
      if (!updated) throw new Error("candidate update returned no row");
      return NextResponse.json({ data: updated, pattern: saved });
    }

    const updated = await candidateStore.update(candidate.id, {
      status: "rejected",
      decision: result.decision,
      updated_by: auth.userId,
    });
    if (!updated) throw new Error("candidate update returned no row");
    return NextResponse.json({ data: updated });
  } catch {
    await recordIntakeAudit({
      action: "pattern_decision_incomplete",
      actorId: auth.userId,
      entityId: candidate.id,
      reason: "audited, but the decision could not be saved",
    });
    return NextResponse.json(
      {
        error: "Not saved",
        detail: "The decision was audited but could not be saved. Check the queue before trying again.",
      },
      { status: 500 },
    );
  }
}
