// ══════════════════════════════════════════════════════════════════════════════
// CARA — Compliance oversight engine (pure / deterministic)
//
// The "is anything rotting in a folder?" brain. Across every compliance document
// Cara has read, joined to the tasks created from their actions, it computes:
//   • per-document status — current / expiring (≤30d) / overdue / no-date, and
//     how its actions are progressing (done / open / overdue)
//   • the home's compliance picture — counts, a RAG rating, a 0-100 score
//   • critical dates in the next 60 days (reviews & expiries) — worst-first
//   • recommendations the manager can act on
// `today` injected; no clock; no store. Fully unit-testable.
// ══════════════════════════════════════════════════════════════════════════════

import type { DocumentIntelCategory, DocumentIntelStatus, DocumentIntelRisk } from "@/types/documents";

/** Home / compliance document categories the oversight surface tracks. */
export const COMPLIANCE_CATEGORIES = new Set<DocumentIntelCategory>([
  "statement_of_purpose", "workforce_development_plan", "home_development_plan",
  "fire_risk_assessment", "health_safety_check", "insurance_certificate",
  "policy_document", "audit_document", "reg44_report", "reg45_review",
  "ofsted_communication", "training_matrix", "la_contract", "medication_audit",
  "maintenance_record", "vehicle_check_doc", "safer_recruitment",
]);

export type DocComplianceState = "current" | "expiring" | "overdue" | "no_date";
export type ComplianceRating = "good" | "adequate" | "needs_attention" | "inadequate";

export interface OversightDoc {
  id: string;
  title: string;
  category: DocumentIntelCategory;
  category_label: string;
  review_due: string | null;
  expiry: string | null;
  risk_level: DocumentIntelRisk;
  status: DocumentIntelStatus;
  actions_suggested: number;
  uploaded_at: string;
}

export interface OversightTask {
  id: string;
  linked_document_id: string | null;
  status: string; // TaskStatus
  due_date: string | null;
}

export interface OversightInput {
  today: string;
  documents: OversightDoc[];
  tasks: OversightTask[];
  /** Days ahead that counts as "expiring soon". Default 30. */
  expiringWindowDays?: number;
}

export interface DocProfile {
  id: string;
  title: string;
  category_label: string;
  state: DocComplianceState;
  key_date: string | null; // soonest of review_due / expiry
  key_date_kind: "review" | "expiry" | null;
  days_until: number | null;
  risk_level: DocumentIntelRisk;
  actions_total: number;
  actions_open: number;
  actions_overdue: number;
  actions_done: number;
  message: string;
}

export interface CriticalDate {
  document_id: string;
  title: string;
  kind: "review" | "expiry";
  date: string;
  days_until: number;
}

export interface ComplianceOversightResult {
  today: string;
  rating: ComplianceRating;
  score: number; // 0-100
  headline: string;
  summary: {
    total_documents: number;
    overdue_documents: number;
    expiring_documents: number;
    no_date_documents: number;
    total_actions: number;
    open_actions: number;
    overdue_actions: number;
  };
  documents: DocProfile[]; // worst-first
  critical_dates: CriticalDate[]; // next 60 days, soonest first
  recommendations: { rank: number; action: string; urgency: "immediate" | "soon" | "planned" }[];
}

const DAY = 864e5;
function toMs(d: string): number { return Date.parse(`${d.slice(0, 10)}T00:00:00Z`); }
function daysBetween(from: string, to: string): number { return Math.round((toMs(to) - toMs(from)) / DAY); }
const DONE = new Set(["completed", "cancelled"]);

function profileFor(doc: OversightDoc, tasks: OversightTask[], today: string, win: number): DocProfile {
  // Pick the soonest meaningful date (expiry usually harder than review).
  const candidates: { kind: "review" | "expiry"; date: string }[] = [];
  if (doc.review_due) candidates.push({ kind: "review", date: doc.review_due });
  if (doc.expiry) candidates.push({ kind: "expiry", date: doc.expiry });
  candidates.sort((a, b) => (a.date < b.date ? -1 : 1));
  const key = candidates[0] ?? null;
  const days_until = key ? daysBetween(today, key.date) : null;

  let state: DocComplianceState;
  if (!key) state = "no_date";
  else if (days_until! < 0) state = "overdue";
  else if (days_until! <= win) state = "expiring";
  else state = "current";

  const mine = tasks.filter((t) => t.linked_document_id === doc.id);
  const actions_done = mine.filter((t) => DONE.has(t.status)).length;
  const open = mine.filter((t) => !DONE.has(t.status));
  const actions_overdue = open.filter((t) => t.due_date && daysBetween(today, t.due_date) < 0).length;
  const actions_open = open.length;
  const actions_total = mine.length;

  const dateBit =
    state === "overdue" ? `${key!.kind === "expiry" ? "Expired" : "Review overdue"} ${Math.abs(days_until!)} day${Math.abs(days_until!) === 1 ? "" : "s"} ago (${key!.date}).`
    : state === "expiring" ? `${key!.kind === "expiry" ? "Expires" : "Review due"} in ${days_until} day${days_until === 1 ? "" : "s"} (${key!.date}).`
    : state === "current" ? `${key!.kind === "expiry" ? "Valid until" : "Next review"} ${key!.date}.`
    : "No review or expiry date recorded.";
  const actionBit = actions_total > 0 ? ` ${actions_open} of ${actions_total} action${actions_total === 1 ? "" : "s"} open${actions_overdue ? `, ${actions_overdue} overdue` : ""}.` : doc.actions_suggested > 0 ? ` ${doc.actions_suggested} suggested action${doc.actions_suggested === 1 ? "" : "s"} not yet tracked.` : "";

  return {
    id: doc.id, title: doc.title, category_label: doc.category_label,
    state, key_date: key?.date ?? null, key_date_kind: key?.kind ?? null, days_until,
    risk_level: doc.risk_level, actions_total, actions_open, actions_overdue, actions_done,
    message: `${dateBit}${actionBit}`,
  };
}

const STATE_RANK: Record<DocComplianceState, number> = { overdue: 0, expiring: 1, no_date: 2, current: 3 };

export function analyseComplianceOversight(input: OversightInput): ComplianceOversightResult {
  const win = input.expiringWindowDays ?? 30;
  const profiles = input.documents.map((d) => profileFor(d, input.tasks, input.today, win));

  const overdue_documents = profiles.filter((p) => p.state === "overdue").length;
  const expiring_documents = profiles.filter((p) => p.state === "expiring").length;
  const no_date_documents = profiles.filter((p) => p.state === "no_date").length;
  const total_actions = profiles.reduce((s, p) => s + p.actions_total, 0);
  const open_actions = profiles.reduce((s, p) => s + p.actions_open, 0);
  const overdue_actions = profiles.reduce((s, p) => s + p.actions_overdue, 0);

  // Score: start at 100, dock for overdue (heaviest), expiring, missing dates, overdue actions.
  let score = 100;
  score -= overdue_documents * 18;
  score -= expiring_documents * 6;
  score -= no_date_documents * 8;
  score -= overdue_actions * 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let rating: ComplianceRating;
  if (overdue_documents > 0 || score < 50) rating = overdue_documents >= 2 || score < 35 ? "inadequate" : "needs_attention";
  else if (expiring_documents > 0 || no_date_documents > 0 || open_actions > 0 || score < 80) rating = "adequate";
  else rating = "good";

  // Worst-first ordering for the document list.
  const documents = [...profiles].sort((a, b) =>
    STATE_RANK[a.state] - STATE_RANK[b.state] ||
    b.actions_overdue - a.actions_overdue ||
    ((a.days_until ?? 9999) - (b.days_until ?? 9999)),
  );

  // Critical dates: reviews + expiries within the next 60 days (incl. overdue), soonest first.
  const critical_dates: CriticalDate[] = [];
  for (const d of input.documents) {
    for (const [kind, date] of [["review", d.review_due], ["expiry", d.expiry]] as const) {
      if (!date) continue;
      const du = daysBetween(input.today, date);
      if (du <= 60) critical_dates.push({ document_id: d.id, title: d.title, kind, date, days_until: du });
    }
  }
  critical_dates.sort((a, b) => a.days_until - b.days_until);

  const recommendations: ComplianceOversightResult["recommendations"] = [];
  let rank = 1;
  if (overdue_documents > 0) recommendations.push({ rank: rank++, action: `${overdue_documents} compliance document${overdue_documents === 1 ? " is" : "s are"} overdue for review or expired — update ${overdue_documents === 1 ? "it" : "them"} now.`, urgency: "immediate" });
  if (overdue_actions > 0) recommendations.push({ rank: rank++, action: `${overdue_actions} compliance action${overdue_actions === 1 ? " is" : "s are"} overdue — chase or complete.`, urgency: "immediate" });
  if (expiring_documents > 0) recommendations.push({ rank: rank++, action: `${expiring_documents} document${expiring_documents === 1 ? "" : "s"} due for review within ${win} days — schedule the review.`, urgency: "soon" });
  if (no_date_documents > 0) recommendations.push({ rank: rank++, action: `${no_date_documents} document${no_date_documents === 1 ? " has" : "s have"} no review date — set a review cycle so ${no_date_documents === 1 ? "it doesn't" : "they don't"} drift.`, urgency: "soon" });
  const untracked = input.documents.filter((d) => d.actions_suggested > 0 && !input.tasks.some((t) => t.linked_document_id === d.id)).length;
  if (untracked > 0) recommendations.push({ rank: rank++, action: `${untracked} document${untracked === 1 ? " has" : "s have"} suggested actions not yet tracked — add them so they don't get forgotten.`, urgency: "planned" });

  const headline =
    input.documents.length === 0 ? "No compliance documents added yet — upload one to start tracking."
    : overdue_documents > 0 ? `${overdue_documents} overdue · ${expiring_documents} due soon · ${open_actions} open action${open_actions === 1 ? "" : "s"}`
    : expiring_documents > 0 || open_actions > 0 ? `${expiring_documents} due soon · ${open_actions} open action${open_actions === 1 ? "" : "s"}`
    : "Compliance is up to date across recorded documents.";

  return {
    today: input.today, rating, score, headline,
    summary: { total_documents: input.documents.length, overdue_documents, expiring_documents, no_date_documents, total_actions, open_actions, overdue_actions },
    documents, critical_dates, recommendations,
  };
}
