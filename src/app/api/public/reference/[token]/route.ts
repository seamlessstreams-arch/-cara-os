// ══════════════════════════════════════════════════════════════════════════════
// CARA — PUBLIC REFEREE REFERENCE FORM API
//
// Token-authenticated (one-time, hashed, 7-day) — no session required.
// GET  → minimal context for the form (data minimisation: candidate name,
//        role and referee name only; nothing else leaves the system).
// POST → validated submission; adverse answers route to manager review.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { createRecruitmentAuditRecord, updateCandidateReferenceRecord } from "@/lib/supabase/recruitment-persist";
import {
  validateToken,
  applySubmission,
  type ReferenceSubmission,
} from "@/lib/safer-recruitment/reference-link-service";

export const dynamic = "force-dynamic";

const REJECTION_MESSAGES: Record<string, string> = {
  invalid: "This reference link isn't recognised. Please check the link or ask the home to issue a new one.",
  expired: "This reference link has expired (links are valid for 7 days). Please ask the home to issue a fresh one.",
  already_used: "This reference has already been submitted — thank you. Nothing further is needed.",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const now = new Date().toISOString();
  const result = validateToken(db.candidateReferences.findAll(), token, now);
  if (!result.ok) {
    return NextResponse.json({ error: REJECTION_MESSAGES[result.reason], reason: result.reason }, { status: result.reason === "invalid" ? 404 : 410 });
  }
  const reference = result.reference;
  const candidate = db.candidateProfiles.findById(reference.candidate_id);
  const vacancy = candidate?.vacancy_id ? db.vacancies.findById(candidate.vacancy_id) : null;
  return NextResponse.json({
    data: {
      candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : "the candidate",
      role_title: vacancy?.title ?? "a role working with children",
      referee_name: reference.referee_name,
      is_most_recent_employer: reference.is_most_recent_employer,
      expires_at: reference.token_expires_at,
    },
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const now = new Date().toISOString();
  const result = validateToken(db.candidateReferences.findAll(), token, now);
  if (!result.ok) {
    return NextResponse.json({ error: REJECTION_MESSAGES[result.reason], reason: result.reason }, { status: result.reason === "invalid" ? 404 : 410 });
  }

  let body: ReferenceSubmission;
  try {
    body = (await req.json()) as ReferenceSubmission;
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent");
  const outcome = applySubmission(result.reference, body, { nowIso: now, ip, user_agent: userAgent });

  if (!outcome.valid || !outcome.update) {
    return NextResponse.json({ error: outcome.errors.join(" "), errors: outcome.errors }, { status: 422 });
  }

  updateCandidateReferenceRecord(result.reference.id, outcome.update);
  createRecruitmentAuditRecord({
    candidate_id: result.reference.candidate_id,
    actor_id: "referee_via_secure_link",
    event_type: "reference_received",
    entity_type: "candidate_reference",
    entity_id: result.reference.id,
    before_state: { status: result.reference.status },
    after_state: { status: outcome.update.status },
    notes: outcome.adverse
      ? "Reference received via secure link — ADVERSE ANSWERS PRESENT, routed to manager review (concerns_noted)."
      : "Reference received via secure link — awaiting manager assessment.",
  });

  return NextResponse.json({ data: { ok: true } });
}
