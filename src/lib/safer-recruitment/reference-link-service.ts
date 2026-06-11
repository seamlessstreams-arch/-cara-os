// ══════════════════════════════════════════════════════════════════════════════
// CARA — SECURE REFERENCE LINK SERVICE
//
// Pure logic for the referee-facing one-time reference form:
//   • issueToken      — mint a link token (stored as a SHA-256 hash, 7-day expiry)
//   • validateToken   — hash-match + expiry + single-use checks
//   • applySubmission — turn the referee's answers into a reference update
//
// Safety contract:
//   • The raw token is returned ONCE for the manager to share — it is never
//     persisted, only its hash. Nothing is auto-sent externally.
//   • A submission can never auto-clear a candidate: adverse answers set the
//     reference to "concerns_noted" for manager review; clean submissions are
//     "received" and still need a manager to assess them as satisfactory.
//   • Tokens are single-use and expire after 7 days.
// ══════════════════════════════════════════════════════════════════════════════

import { createHash, randomBytes } from "crypto";
import type { CandidateReference } from "@/types/recruitment";

export const TOKEN_TTL_DAYS = 7;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintToken(): string {
  return randomBytes(24).toString("base64url");
}

export interface IssuedToken {
  token: string; // show once, never store
  secure_token_hash: string;
  token_expires_at: string;
}

export function issueToken(nowIso: string, token: string = mintToken()): IssuedToken {
  const expires = new Date(new Date(nowIso).getTime() + TOKEN_TTL_DAYS * 86_400_000).toISOString();
  return { token, secure_token_hash: hashToken(token), token_expires_at: expires };
}

export type TokenValidation =
  | { ok: true; reference: CandidateReference }
  | { ok: false; reason: "invalid" | "expired" | "already_used" };

export function validateToken(
  references: CandidateReference[],
  token: string,
  nowIso: string,
): TokenValidation {
  const hash = hashToken(token);
  const reference = references.find((r) => r.secure_token_hash === hash);
  if (!reference) return { ok: false, reason: "invalid" };
  if (reference.token_used_at) return { ok: false, reason: "already_used" };
  if (!reference.token_expires_at || reference.token_expires_at < nowIso) return { ok: false, reason: "expired" };
  return { ok: true, reference };
}

// ── Submission ────────────────────────────────────────────────────────────────

export interface ReferenceSubmission {
  referee_name: string;
  referee_job_title: string;
  organisation: string;
  work_email: string;
  phone: string | null;
  authorised_to_provide: boolean;
  relationship: string;
  employed_by_organisation: boolean;
  employment_dates: string | null;
  role_held: string | null;
  worked_with_children: boolean | null;
  reason_for_leaving: string | null;
  disciplinary_concerns: boolean;
  disciplinary_details: string | null;
  safeguarding_concerns: boolean;
  safeguarding_details: string | null;
  boundary_concerns: boolean;
  honesty_concerns: boolean;
  would_re_employ: boolean | null;
  suitable_for_children: boolean | null;
  anything_else: string | null;
  declaration_confirmed: boolean;
}

export interface SubmissionOutcome {
  valid: boolean;
  errors: string[];
  adverse: boolean;
  update: Partial<CandidateReference> | null;
}

export function applySubmission(
  reference: CandidateReference,
  submission: ReferenceSubmission,
  ctx: { nowIso: string; ip: string | null; user_agent: string | null },
): SubmissionOutcome {
  const errors: string[] = [];
  if (!submission.declaration_confirmed) errors.push("The declaration must be confirmed before the reference can be submitted.");
  if (!submission.referee_name.trim()) errors.push("Your full name is required.");
  if (!submission.referee_job_title.trim()) errors.push("Your job title is required.");
  if (!submission.organisation.trim()) errors.push("Your organisation is required.");
  if (!submission.work_email.trim() || !submission.work_email.includes("@")) errors.push("A work email address is required.");
  if (!submission.authorised_to_provide) errors.push("References must be provided by someone authorised to do so. If that isn't you, please pass this link to the right person.");
  if (submission.disciplinary_concerns && !submission.disciplinary_details?.trim()) errors.push("Please give brief factual details of the disciplinary concerns.");
  if (submission.safeguarding_concerns && !submission.safeguarding_details?.trim()) errors.push("Please give brief factual details of the safeguarding concerns.");
  if (errors.length > 0) return { valid: false, errors, adverse: false, update: null };

  const adverse =
    submission.disciplinary_concerns ||
    submission.safeguarding_concerns ||
    submission.boundary_concerns ||
    submission.honesty_concerns ||
    submission.would_re_employ === false ||
    submission.suitable_for_children === false;

  const commentParts: string[] = [];
  if (submission.reason_for_leaving) commentParts.push(`Reason for leaving: ${submission.reason_for_leaving}`);
  if (submission.disciplinary_details) commentParts.push(`Disciplinary: ${submission.disciplinary_details}`);
  if (submission.safeguarding_details) commentParts.push(`Safeguarding: ${submission.safeguarding_details}`);
  if (submission.boundary_concerns) commentParts.push("Referee flagged professional-boundary concerns.");
  if (submission.honesty_concerns) commentParts.push("Referee flagged honesty/conduct/reliability/recording concerns.");
  if (submission.anything_else) commentParts.push(`Additional: ${submission.anything_else}`);
  if (submission.employment_dates) commentParts.push(`Employment dates: ${submission.employment_dates}`);

  const update: Partial<CandidateReference> = {
    referee_name: submission.referee_name.trim(),
    referee_role: submission.referee_job_title.trim(),
    organisation_name: submission.organisation.trim(),
    email: submission.work_email.trim(),
    phone: submission.phone?.trim() || null,
    relationship_to_candidate: submission.relationship.trim() || reference.relationship_to_candidate,
    received_at: ctx.nowIso,
    // Adverse answers go to the manager as concerns — never silently absorbed.
    // Clean submissions are "received": a manager still has to assess them.
    status: adverse ? "concerns_noted" : "received",
    structured_response: {
      dates_of_employment_confirmed: submission.employed_by_organisation ? !!submission.employment_dates : false,
      role_confirmed: !!submission.role_held,
      performance_rating: null,
      disciplinary_concerns: submission.disciplinary_concerns,
      safeguarding_concerns: submission.safeguarding_concerns,
      would_re_employ: submission.would_re_employ,
      additional_comments: commentParts.join(" · ") || null,
    },
    token_used_at: ctx.nowIso,
    submission_meta: { ip: ctx.ip, user_agent: ctx.user_agent },
  };

  return { valid: true, errors: [], adverse, update };
}
