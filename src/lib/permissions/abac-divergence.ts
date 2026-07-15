// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABAC DIVERGENCE TELEMETRY (the evidence for the enforcing flip)
//
// The ABAC engine runs in ADVISORY mode beside the enforced flat permission
// check. Where the two disagree is the whole question: flipping ABAC to
// enforcing turns every "ABAC would have denied" into a real denial — for real
// staff, mid-shift, on a child's record.
//
// Until now that signal was a console.warn: it scrolled past in a serverless
// log and nothing could answer "what would enforcing have denied last week?".
// Flipping without that answer is a guess.
//
// This records each divergence on the EXISTING durable audit spine
// (recordEntityAudit — in-memory trail + best-effort cs_audit_log) under a
// dedicated entityType, and summarises it. No new storage, no new lifecycle.
//
// Recording is fire-and-forget and never throws: telemetry must not be able to
// break the route it is observing.
// ══════════════════════════════════════════════════════════════════════════════

import { recordEntityAudit, getRecordAuditTrail } from "@/lib/audit/audit-recorder";

/** The dedicated audit entityType for advisory-vs-enforced disagreements. */
export const ABAC_DIVERGENCE_ENTITY = "abac_divergence";

export interface AbacDivergenceInput {
  userId: string;
  role: string;
  /** The confidential resource the caller reached (entityType, not the record id). */
  resource: string;
  action: string;
  homeId?: string | null;
  /** The engine's stated reason for the would-be denial. */
  reason: string;
  /** True when decided on the actor's REAL attributes — only these are evidence. */
  contextReal: boolean;
}

/**
 * Record one advisory-vs-enforced disagreement. Called only when the flat check
 * ALLOWED and ABAC would have DENIED — i.e. exactly the access that flipping to
 * enforcing would take away.
 */
export function recordAbacDivergence(input: AbacDivergenceInput): void {
  try {
    void recordEntityAudit({
      entityType: ABAC_DIVERGENCE_ENTITY,
      entityId: input.resource,
      homeId: input.homeId ?? null,
      action: "view",
      performedBy: input.userId,
      metadata: {
        abac: true,
        wouldDeny: true,
        role: input.role,
        resource: input.resource,
        attemptedAction: input.action,
        reason: input.reason,
        // Divergence measured against a fabricated context proves nothing —
        // the summary keeps the two apart rather than averaging them together.
        contextReal: input.contextReal,
      },
    });
  } catch {
    // Telemetry must never affect the route it observes.
  }
}

export interface AbacDivergenceRow {
  at: string;
  userId: string;
  role: string;
  resource: string;
  action: string;
  reason: string;
  contextReal: boolean;
}

export interface AbacDivergenceSummary {
  /** Divergences decided on REAL attributes — the only flip-relevant evidence. */
  evidenceCount: number;
  /** Divergences decided on the unknown-actor fallback — noise, not evidence. */
  fallbackCount: number;
  total: number;
  /** How many distinct staff would have been denied (real-context only). */
  affectedUsers: number;
  /** Denial reason → count (real-context only), commonest first. */
  byReason: { reason: string; count: number }[];
  /** Resource → count (real-context only), commonest first. */
  byResource: { resource: string; count: number }[];
  rows: AbacDivergenceRow[];
  /** Plain-English read on whether the flip is evidenced yet. */
  verdict: string;
}

function str(v: unknown, fallback = "unknown"): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

/** Summarise recorded divergence. Pure over the audit trail. */
export function summariseAbacDivergence(limit = 500): AbacDivergenceSummary {
  const entries = getRecordAuditTrail({ entityType: ABAC_DIVERGENCE_ENTITY, limit });

  const rows: AbacDivergenceRow[] = entries.map((e) => {
    const m = (e.metadata ?? {}) as Record<string, unknown>;
    return {
      at: e.at,
      userId: e.performedBy,
      role: str(m.role),
      resource: str(m.resource, e.entityId),
      action: str(m.attemptedAction, "view"),
      reason: str(m.reason),
      contextReal: m.contextReal === true,
    };
  });

  const real = rows.filter((r) => r.contextReal);
  const tally = (key: (r: AbacDivergenceRow) => string) => {
    const counts = new Map<string, number>();
    for (const r of real) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
    return [...counts].map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
  };

  const byReason = tally((r) => r.reason).map(({ k, count }) => ({ reason: k, count }));
  const byResource = tally((r) => r.resource).map(({ k, count }) => ({ resource: k, count }));
  const affectedUsers = new Set(real.map((r) => r.userId)).size;

  // Honest about what the numbers can and cannot support. No divergence is NOT
  // the same as "safe to flip" — it may only mean nobody exercised the path.
  const verdict =
    real.length === 0
      ? rows.length === 0
        ? "No divergence recorded yet. That is not evidence the flip is safe — it may only mean these routes haven't been exercised since the last restart."
        : "Only unknown-actor fallback divergence recorded — not evidence. Exercise the sensitive routes as real staff to gather it."
      : `${real.length} real-context divergence(s) across ${affectedUsers} staff. Enforcing today would deny exactly these — review each reason before flipping.`;

  return {
    evidenceCount: real.length,
    fallbackCount: rows.length - real.length,
    total: rows.length,
    affectedUsers,
    byReason,
    byResource,
    rows: rows.slice(0, 100),
    verdict,
  };
}
