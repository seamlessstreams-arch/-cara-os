// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT GOVERNANCE BOARD (Doc-Version-Workflow · Module 1)
//
// The scoping audit's finding: review/expiry logic is re-implemented in ≥5
// document silos (home policies, policy review tracker, document expiry tracker,
// file documents, Statement of Purpose / Children's Guide) and nothing answers
// "which governance documents need attention?" in one place.
//
// This is that one place — a PURE, read-only, cross-type projection (the
// operational-spine/calendar pattern). It consolidates by PROJECTION, invents
// nothing, and is explicit about coverage: every source reports whether it fed
// the board, is empty, or lives only in the live database (SoP/Guide in demo).
// Versioning/supersession is NOT this module — the board's caveat says which
// types carry no history yet (that is Modules 2+).
// ══════════════════════════════════════════════════════════════════════════════

export type GovDocType =
  | "home_policy"
  | "policy_review"
  | "tracked_document"
  | "file_document";

export const GOV_DOC_TYPE_LABEL: Record<GovDocType, string> = {
  home_policy: "Home policy",
  policy_review: "Policy review",
  tracked_document: "Tracked document",
  file_document: "File document",
};

export type GovState = "overdue" | "due_soon" | "current" | "no_date";

export interface GovRow {
  doc_type: GovDocType;
  id: string;
  title: string;
  version: string | null;
  owner: string | null;
  /** The governing date (review or expiry), ISO date, when one exists. */
  date: string | null;
  date_kind: "review" | "expiry" | null;
  state: GovState;
  days_until: number | null; // negative = overdue by N days
  href: string;
}

export interface GovCoverage {
  source: string;
  status: "included" | "empty" | "live_database_only";
  count: number;
  note: string;
}

export interface GovernanceBoard {
  date: string;
  summary: { overdue: number; due_soon: number; current: number; no_date: number; total: number };
  rows: GovRow[];
  coverage: GovCoverage[];
  /** The honesty caveat about versioning — rendered verbatim in the UI. */
  versioning_note: string;
}

const VERSIONING_NOTE =
  "This board consolidates review and expiry dates across the document silos. Version history / supersession does not exist yet for these types — a policy update currently overwrites the record.";

// ── Lite inputs (route maps store rows → these) ──────────────────────────────

export interface HomePolicyLite {
  id: string;
  title: string;
  version?: string | null;
  owner_id?: string | null;
  next_review_date?: string | null;
}

export interface PolicyReviewLite {
  id: string;
  title: string;
  version?: string | null;
  owner?: string | null;
  next_review_date?: string | null;
}

export interface TrackedDocumentLite {
  id: string;
  title: string;
  renewal_owner?: string | null;
  expiry_date?: string | null;
  /** Days before expiry that renewal work should start (per-row lead). */
  renewal_lead_time?: number | null;
}

export interface FileDocumentLite {
  id: string;
  title: string;
  version?: number | null;
  expiry_date?: string | null;
}

const DAY = 86_400_000;
function daysUntil(today: string, date: string): number {
  return Math.round((Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
}

function stateFor(days: number | null, leadDays: number): GovState {
  if (days == null) return "no_date";
  if (days < 0) return "overdue";
  if (days <= leadDays) return "due_soon";
  return "current";
}

const STATE_RANK: Record<GovState, number> = { overdue: 0, due_soon: 1, current: 2, no_date: 3 };

/** Compute the cross-type governance board. Pure. */
export function computeGovernanceBoard(input: {
  homePolicies: readonly HomePolicyLite[];
  policyReviews: readonly PolicyReviewLite[];
  trackedDocuments: readonly TrackedDocumentLite[];
  fileDocuments: readonly FileDocumentLite[];
  nowIso: string;
  /** Default "due soon" horizon in days (TrackedDocument rows use their own lead). */
  dueSoonDays?: number;
}): GovernanceBoard {
  const today = input.nowIso.slice(0, 10);
  const lead = input.dueSoonDays ?? 30;
  const rows: GovRow[] = [];

  const push = (
    doc_type: GovDocType,
    id: string,
    title: string,
    version: string | null,
    owner: string | null,
    date: string | null | undefined,
    date_kind: "review" | "expiry",
    href: string,
    rowLead?: number | null,
  ) => {
    const d = date ? date.slice(0, 10) : null;
    const days = d ? daysUntil(today, d) : null;
    rows.push({
      doc_type,
      id,
      title,
      version,
      owner,
      date: d,
      date_kind: d ? date_kind : null,
      state: stateFor(days, rowLead && rowLead > 0 ? rowLead : lead),
      days_until: days,
      href,
    });
  };

  for (const p of input.homePolicies) {
    push("home_policy", p.id, p.title, p.version ?? null, p.owner_id ?? null, p.next_review_date, "review", "/policies");
  }
  for (const r of input.policyReviews) {
    push("policy_review", r.id, r.title, r.version ?? null, r.owner ?? null, r.next_review_date, "review", "/policy-review-tracker");
  }
  for (const t of input.trackedDocuments) {
    push("tracked_document", t.id, t.title, null, t.renewal_owner ?? null, t.expiry_date, "expiry", "/document-expiry-tracker", t.renewal_lead_time);
  }
  for (const f of input.fileDocuments) {
    push("file_document", f.id, f.title, f.version != null ? `v${f.version}` : null, null, f.expiry_date, "expiry", "/documents");
  }

  rows.sort(
    (a, b) =>
      STATE_RANK[a.state] - STATE_RANK[b.state] ||
      (a.days_until ?? Number.MAX_SAFE_INTEGER) - (b.days_until ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title),
  );

  const count = (s: GovState) => rows.filter((r) => r.state === s).length;

  const coverageFor = (source: string, n: number, note: string): GovCoverage => ({
    source,
    status: n > 0 ? "included" : "empty",
    count: n,
    note,
  });

  return {
    date: today,
    summary: {
      overdue: count("overdue"),
      due_soon: count("due_soon"),
      current: count("current"),
      no_date: count("no_date"),
      total: rows.length,
    },
    rows,
    coverage: [
      coverageFor("Home policies", input.homePolicies.length, "next_review_date per policy"),
      coverageFor("Policy review tracker", input.policyReviews.length, "review cycle + next review date"),
      coverageFor("Document expiry tracker", input.trackedDocuments.length, "expiry date with per-document renewal lead time"),
      coverageFor("File documents", input.fileDocuments.length, "expiry date where recorded"),
      {
        source: "Statement of Purpose & Children's Guide",
        status: "live_database_only",
        count: 0,
        note: "Held in the live database — not visible in demo mode; their review dates join this board on activation.",
      },
    ],
    versioning_note: VERSIONING_NOTE,
  };
}
