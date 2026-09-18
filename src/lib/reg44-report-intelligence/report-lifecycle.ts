// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT LIFECYCLE (pure, tamper-evident)
//
// The lifecycle of a persisted Reg 44 report: draft → signed (LOCKED) → amended
// (by controlled addendum only). A signed report is immutable — edits are refused
// — but a named person may append a dated correction/addendum, which never alters
// the signed content. Every action writes an append-only audit entry. Sign-off
// runs the slice-2 gate: a blocked report cannot be signed without a named
// override reason.
//
// Deterministic; the caller stamps the time. No store access.
// ══════════════════════════════════════════════════════════════════════════════

import type { Reg44Section } from "./report-assembly";
import {
  validateReg44Report,
  applySignOffDecision,
  type Reg44ReportDraft,
  type SignOffDecision,
} from "./report-validation";

export const REG44_LIFECYCLE_VERSION = "1.0.0";

export type Reg44ReportStatus = "draft" | "signed" | "amended";

export interface Reg44AuditEntry {
  at: string;
  actor: string;
  action: "created" | "edited" | "validated" | "signed" | "addendum" | "edit_refused" | "responded";
  detail: string;
}

export interface Reg44Addendum {
  id: string;
  at: string;
  author: string;
  text: string;
}

export interface Reg44Response {
  text: string;
  at: string;
  by: string;
}

export type Reg44ResponseRole = "manager" | "ri";

export interface PersistedReg44Report {
  id: string;
  homeId: string;
  month: string;
  status: Reg44ReportStatus;
  locked: boolean;
  draft: Reg44ReportDraft;
  /**
   * The assembled A–Q section text as it stood when the report was created,
   * and — once signed — as it was signed. Stored so the words a visitor signs
   * are the words that persist; without this the narrative was regenerated
   * from live evidence at every export and could drift after signing.
   * Optional for reports persisted before this field existed.
   */
  sections?: Reg44Section[];
  /** Frozen at sign-off — the immutable record of what was signed. */
  signedSnapshot: Reg44ReportDraft | null;
  /** The sections frozen alongside signedSnapshot. */
  signedSections?: Reg44Section[] | null;
  addenda: Reg44Addendum[];
  /** Engine version that assembled the draft, for provenance. */
  engineVersion?: string;
  /**
   * Reg 44(7): the report goes to the registered person, and the response is
   * how the home evidences what it did with it. A response is NOT an edit to
   * the visitor's report — it is permitted after signing and never touches the
   * signed snapshot. Absent on reports that pre-date the visit-tracker fold.
   */
  managerResponse?: Reg44Response | null;
  riResponse?: Reg44Response | null;
  auditTrail: Reg44AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LifecycleOutcome {
  ok: boolean;
  refusedReason?: string;
  report?: PersistedReg44Report;
}

const audit = (report: PersistedReg44Report, entry: Reg44AuditEntry): Reg44AuditEntry[] => [...report.auditTrail, entry];

export function createReg44Report(input: { id: string; homeId: string; month: string; draft: Reg44ReportDraft; createdBy: string; at: string; sections?: Reg44Section[]; engineVersion?: string }): PersistedReg44Report {
  return {
    id: input.id,
    homeId: input.homeId,
    month: input.month,
    status: "draft",
    locked: false,
    draft: input.draft,
    sections: input.sections ?? [],
    signedSnapshot: null,
    signedSections: null,
    addenda: [],
    engineVersion: input.engineVersion,
    auditTrail: [{ at: input.at, actor: input.createdBy, action: "created", detail: `Draft created for ${input.month}.` }],
    createdAt: input.at,
    updatedAt: input.at,
  };
}

/** Edit the draft. Refused once the report is locked (signed) — the audit records the attempt. */
export function editReg44Report(report: PersistedReg44Report, patch: Partial<Reg44ReportDraft>, ctx: { by: string; at: string }): LifecycleOutcome {
  if (report.locked) {
    const refused: PersistedReg44Report = {
      ...report,
      auditTrail: audit(report, { at: ctx.at, actor: ctx.by, action: "edit_refused", detail: "Edit refused — the report is signed and locked. Use an addendum." }),
      updatedAt: ctx.at,
    };
    return { ok: false, refusedReason: "The report is signed and locked. Record a dated addendum instead.", report: refused };
  }
  const next: PersistedReg44Report = {
    ...report,
    draft: { ...report.draft, ...patch },
    auditTrail: audit(report, { at: ctx.at, actor: ctx.by, action: "edited", detail: "Draft edited." }),
    updatedAt: ctx.at,
  };
  return { ok: true, report: next };
}

/**
 * Edit the narrative of one or more sections (by key) while the report is
 * unsigned. Refused once locked, exactly like editReg44Report — a signed
 * report's words change only by dated addendum. Unknown keys are ignored
 * rather than creating sections the form doesn't have.
 */
export function editReg44Sections(
  report: PersistedReg44Report,
  patch: Array<{ key: string; content: string }>,
  ctx: { by: string; at: string },
): LifecycleOutcome {
  if (report.locked) {
    const refused: PersistedReg44Report = {
      ...report,
      auditTrail: audit(report, { at: ctx.at, actor: ctx.by, action: "edit_refused", detail: "Section edit refused — the report is signed and locked. Use an addendum." }),
      updatedAt: ctx.at,
    };
    return { ok: false, refusedReason: "The report is signed and locked. Record a dated addendum instead.", report: refused };
  }
  const byKey = new Map(patch.map((p) => [p.key, p.content]));
  const touched: string[] = [];
  const sections = (report.sections ?? []).map((s) => {
    if (!byKey.has(s.key)) return s;
    touched.push(s.key);
    return { ...s, content: byKey.get(s.key) ?? "", status: "drafted_from_evidence" as const, visitorMustComplete: false };
  });
  const next: PersistedReg44Report = {
    ...report,
    sections,
    auditTrail: audit(report, { at: ctx.at, actor: ctx.by, action: "edited", detail: touched.length ? `Sections edited: ${touched.join(", ")}.` : "Section edit: no matching sections." }),
    updatedAt: ctx.at,
  };
  return { ok: true, report: next };
}

/**
 * Sign off the report. Runs the slice-2 gate: a blocked report can only be
 * approved with a named override reason. On success the report is LOCKED and the
 * signed content is frozen into signedSnapshot.
 */
export function signReg44Report(report: PersistedReg44Report, input: { decision: SignOffDecision; decidedBy: string; overrideReason?: string; at: string }): LifecycleOutcome {
  if (report.locked) return { ok: false, refusedReason: "This report is already signed and locked." };

  const validation = validateReg44Report(report.draft);
  const gate = applySignOffDecision(report.draft, { decision: input.decision, decidedBy: input.decidedBy, decidedAt: input.at, overrideReason: input.overrideReason });
  if (!gate.ok) {
    const refused: PersistedReg44Report = {
      ...report,
      auditTrail: audit(report, { at: input.at, actor: input.decidedBy || "unknown", action: "validated", detail: gate.refusedReason ?? "Sign-off refused." }),
      updatedAt: input.at,
    };
    return { ok: false, refusedReason: gate.refusedReason, report: refused };
  }

  // returned / escalated / senior_review don't lock — they keep the report open.
  const isFinalising = input.decision === "approved" || input.decision === "approved_with_actions";
  const signedDraft = gate.draft!;

  const next: PersistedReg44Report = {
    ...report,
    draft: signedDraft,
    status: isFinalising ? "signed" : "draft",
    locked: isFinalising,
    signedSnapshot: isFinalising ? signedDraft : report.signedSnapshot,
    signedSections: isFinalising ? (report.sections ?? []) : (report.signedSections ?? null),
    auditTrail: audit(report, {
      at: input.at,
      actor: input.decidedBy,
      action: isFinalising ? "signed" : "validated",
      detail: `${input.decision.replace(/_/g, " ")}${input.overrideReason ? ` (override: ${input.overrideReason})` : ""}${validation.blocks.length ? ` — ${validation.blocks.length} block(s) at sign-off` : ""}.`,
    }),
    updatedAt: input.at,
  };
  return { ok: true, report: next };
}

/**
 * Add a dated addendum/correction to a signed report. This is the ONLY way to
 * change a locked report — it never alters the signed content, and it is audited.
 */
export function addReg44Addendum(report: PersistedReg44Report, input: { id: string; text: string; author: string; at: string }): LifecycleOutcome {
  if (!report.locked) return { ok: false, refusedReason: "Addenda apply to signed reports. Edit the draft directly while it is unsigned." };
  if (!input.text.trim()) return { ok: false, refusedReason: "An addendum needs text." };
  if (!input.author.trim()) return { ok: false, refusedReason: "A named author is required." };

  const next: PersistedReg44Report = {
    ...report,
    status: "amended",
    addenda: [...report.addenda, { id: input.id, at: input.at, author: input.author, text: input.text.trim() }],
    auditTrail: audit(report, { at: input.at, actor: input.author, action: "addendum", detail: "Dated addendum added to the signed report." }),
    updatedAt: input.at,
  };
  return { ok: true, report: next };
}

export { REG44_LIFECYCLE_VERSION as _lv };

/**
 * Record the registered person's (manager) or responsible individual's response
 * to the report. Allowed whether or not the report is signed: the response is
 * the home's, not the visitor's, and lives beside the report rather than in it.
 * An empty response is refused — a blank save is not a response.
 */
export function recordReg44Response(
  report: PersistedReg44Report,
  input: { role: Reg44ResponseRole; text: string; by: string; at: string },
): LifecycleOutcome {
  const text = input.text.trim();
  if (!text) return { ok: false, refusedReason: "A response needs some text.", report };
  const response: Reg44Response = { text, at: input.at, by: input.by };
  const label = input.role === "manager" ? "Registered person's response" : "Responsible individual's response";
  const next: PersistedReg44Report = {
    ...report,
    ...(input.role === "manager" ? { managerResponse: response } : { riResponse: response }),
    auditTrail: audit(report, { at: input.at, actor: input.by, action: "responded", detail: `${label} recorded (${text.length} chars)` }),
    updatedAt: input.at,
  };
  return { ok: true, report: next };
}
