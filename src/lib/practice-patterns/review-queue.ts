// ══════════════════════════════════════════════════════════════════════════════
// Cara — Practice-pattern review queue (Phase 4d)
//
// Pure decisions over intake candidates:
//   • orderReviewQueue — pending candidates, curator tier 1 → 3 first, then
//     untiered; oldest first within a tier. The tier orders; it never approves.
//   • decideCandidate — a NAMED human reviewer approves or rejects, always
//     with a recorded reason. Approval builds a PracticePattern from the
//     reviewer's own final wording and runs it through the Phase 1 validator.
//   • mergeWithSeededLibrary — approved runtime patterns join the code-seeded
//     library with no deploy (P4-6). Malformed, unattributed or wrongly-based
//     records are skipped and counted, never merged silently.
//
// Safety rails held here:
//   • An intake pattern is one practitioner's view or good practice — never a
//     "regulation" or "quality standard" basis (those come from source texts).
//   • Only regulation numbers verified against the catalogue are cited.
//   • P4-5, paraphrase only: approved wording containing a direct quotation
//     is refused.
// ══════════════════════════════════════════════════════════════════════════════

import { isPatternDomain } from "./domains";
import {
  PRACTICE_PATTERNS,
  validatePracticePattern,
  type ClaimBasis,
  type PatternDomain,
  type PracticePattern,
} from "./practice-patterns";
import type { CandidateDecision, PatternCandidate } from "./intake-pipeline";
import type { VoiceTier } from "./trusted-voices";

// ── Ordering ──────────────────────────────────────────────────────────────────

function tierRank(t: VoiceTier | null): number {
  return t === null ? 4 : t;
}

/** Pending candidates only: tier 1, 2, 3, then untiered; oldest first within each. */
export function orderReviewQueue(candidates: readonly PatternCandidate[]): PatternCandidate[] {
  return candidates
    .filter((c) => c.status === "pending_review")
    .slice()
    .sort((a, b) => {
      const byTier = tierRank(a.tier) - tierRank(b.tier);
      if (byTier !== 0) return byTier;
      return a.received_at < b.received_at ? -1 : a.received_at > b.received_at ? 1 : 0;
    });
}

// ── Decisions ─────────────────────────────────────────────────────────────────

/** The only bases an intake pattern may carry. */
export const INTAKE_CLAIM_BASES: readonly ClaimBasis[] = ["practitioner_view", "good_practice"];

export interface ApprovalWording {
  name: string;
  summary: string;
  key_questions: string[];
  evidence_indicators?: string[];
  failure_modes?: string[];
  claim_basis?: ClaimBasis;
  domains?: string[];
}

export type ReviewInput =
  | { decision: "approve"; reason: string; pattern: ApprovalWording }
  | { decision: "reject"; reason: string };

export interface Reviewer {
  userId: string;
  /** From the staff record. A decision without a resolvable name is refused. */
  name: string | null;
}

export type DecisionResult =
  | { ok: false; status: 403 | 409 | 422; error: string; details?: string[] }
  | { ok: true; outcome: "rejected"; decision: CandidateDecision }
  | { ok: true; outcome: "approved"; decision: CandidateDecision; pattern: Omit<PracticePattern, "id"> };

export const MIN_REASON_CHARS = 10;

/** A run of 15+ characters inside double quotes reads as a direct quotation. */
const DIRECT_QUOTATION = /["“”][^"“”]{15,}["“”]/;

export function containsDirectQuotation(texts: readonly string[]): boolean {
  return texts.some((t) => DIRECT_QUOTATION.test(t));
}

function verifiedRegulationRefs(c: PatternCandidate): string[] {
  const refs: string[] = [];
  for (const r of c.regulation_refs) {
    const n = r.ref.match(/\d+/)?.[0];
    if (r.verified && n && refs.indexOf(`reg-${n}`) === -1) refs.push(`reg-${n}`);
  }
  return refs;
}

const SOURCE_NOTE =
  "Paraphrased in Cara's own words from a practitioner's public post, submitted by a manager and approved by a named reviewer. Not the author's wording.";

export function decideCandidate(
  candidate: PatternCandidate,
  input: ReviewInput,
  reviewer: Reviewer,
  clock: { now: string; today: string },
): DecisionResult {
  const name = reviewer.name?.trim() ?? "";
  if (!reviewer.userId?.trim() || !name) {
    return {
      ok: false,
      status: 403,
      error: "A decision needs a named reviewer. Your staff record has no name, so nothing was decided.",
    };
  }
  if (candidate.status !== "pending_review") {
    return { ok: false, status: 409, error: `This candidate was already ${candidate.status === "approved" ? "approved" : "rejected"}.` };
  }
  const reason = input.reason?.trim() ?? "";
  if (reason.length < MIN_REASON_CHARS) {
    return { ok: false, status: 422, error: `Record the reason for the decision (at least ${MIN_REASON_CHARS} characters).` };
  }

  const base = { by: reviewer.userId, by_name: name, at: clock.now, reason };
  if (input.decision === "reject") {
    return { ok: true, outcome: "rejected", decision: { outcome: "rejected", ...base } };
  }

  const w = input.pattern;
  const claimBasis = w.claim_basis ?? "practitioner_view";
  if (!INTAKE_CLAIM_BASES.some((b) => b === claimBasis)) {
    return {
      ok: false,
      status: 422,
      error: "An intake pattern is a practitioner's view or good practice. Regulation and quality-standard bases come only from the source texts.",
    };
  }

  const keyQuestions = (w.key_questions ?? []).map((q) => q.trim()).filter(Boolean);
  const evidence = (w.evidence_indicators ?? []).map((q) => q.trim()).filter(Boolean);
  const failures = (w.failure_modes ?? []).map((q) => q.trim()).filter(Boolean);
  const wording = [w.name ?? "", w.summary ?? "", ...keyQuestions, ...evidence, ...failures];
  if (containsDirectQuotation(wording)) {
    return {
      ok: false,
      status: 422,
      error: "Paraphrase only (P4-5): remove the direct quotation and put the idea in Cara's own words.",
    };
  }
  if (keyQuestions.length === 0) {
    return { ok: false, status: 422, error: "Add at least one question the pattern asks." };
  }

  const domains: PatternDomain[] = (w.domains ?? candidate.domains).filter(isPatternDomain);
  if (domains.length === 0) {
    return { ok: false, status: 422, error: "Tag the pattern with at least one practice domain." };
  }

  const pattern: Omit<PracticePattern, "id"> = {
    name: w.name.trim(),
    summary: w.summary.trim(),
    domains,
    claim_basis: claimBasis,
    regulation_refs: verifiedRegulationRefs(candidate),
    quality_standard_refs: [],
    key_questions: keyQuestions,
    evidence_indicators: evidence,
    failure_modes: failures,
    source: {
      author: candidate.author,
      platform: candidate.platform,
      ...(candidate.published ? { published: candidate.published } : {}),
      url: candidate.url,
      note: SOURCE_NOTE,
    },
    provenance: "derived_external",
    confidence: "medium",
    retrieved_at: clock.today,
    status: "approved",
  };

  const check = validatePracticePattern({ id: "pending-approval", ...pattern });
  if (!check.ok) return { ok: false, status: 422, error: "The pattern is not valid.", details: check.errors };

  return { ok: true, outcome: "approved", decision: { outcome: "approved", ...base }, pattern };
}

// ── The merged library (P4-6) ─────────────────────────────────────────────────

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Rebuild a clean PracticePattern from an untrusted stored record, or null. */
export function toPracticePattern(value: unknown): PracticePattern | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  const source = p.source as Record<string, unknown> | undefined;
  if (
    typeof p.id !== "string" ||
    typeof p.name !== "string" ||
    typeof p.summary !== "string" ||
    !isStringArray(p.domains) ||
    !isStringArray(p.regulation_refs) ||
    !isStringArray(p.quality_standard_refs) ||
    !isStringArray(p.key_questions) ||
    !isStringArray(p.evidence_indicators) ||
    !isStringArray(p.failure_modes) ||
    !source ||
    typeof source !== "object" ||
    typeof source.author !== "string" ||
    typeof source.platform !== "string"
  ) {
    return null;
  }
  return {
    id: p.id,
    name: p.name,
    summary: p.summary,
    domains: p.domains.filter(isPatternDomain),
    claim_basis: p.claim_basis as ClaimBasis,
    regulation_refs: p.regulation_refs,
    quality_standard_refs: p.quality_standard_refs,
    key_questions: p.key_questions,
    evidence_indicators: p.evidence_indicators,
    failure_modes: p.failure_modes,
    source: {
      author: source.author,
      platform: source.platform,
      ...(typeof source.published === "string" ? { published: source.published } : {}),
      ...(typeof source.url === "string" ? { url: source.url } : {}),
      ...(typeof source.note === "string" ? { note: source.note } : {}),
    },
    provenance: p.provenance as PracticePattern["provenance"],
    confidence: p.confidence as PracticePattern["confidence"],
    retrieved_at: typeof p.retrieved_at === "string" ? p.retrieved_at : "",
    status: p.status as PracticePattern["status"],
  };
}

/**
 * The code-seeded library plus every valid, approved runtime pattern. A
 * runtime record that is malformed, unapproved, not derived_external, on a
 * basis other than practitioner_view / good_practice, fails the Phase 1
 * validator, or reuses a seeded id is skipped — and counted, so a caller can
 * say the library is partial instead of pretending it is whole.
 */
export function mergeWithSeededLibrary(
  runtime: readonly unknown[],
  seeds: readonly PracticePattern[] = PRACTICE_PATTERNS,
): { patterns: PracticePattern[]; skipped: number } {
  const ids = new Set(seeds.map((p) => p.id));
  const patterns = [...seeds];
  let skipped = 0;
  for (const raw of runtime) {
    const p = toPracticePattern(raw);
    if (
      !p ||
      p.status !== "approved" ||
      p.provenance !== "derived_external" ||
      !INTAKE_CLAIM_BASES.some((b) => b === p.claim_basis) ||
      !validatePracticePattern(p).ok ||
      ids.has(p.id)
    ) {
      skipped += 1;
      continue;
    }
    ids.add(p.id);
    patterns.push(p);
  }
  return { patterns, skipped };
}
