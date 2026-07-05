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
  action: "created" | "edited" | "validated" | "signed" | "addendum" | "edit_refused";
  detail: string;
}

export interface Reg44Addendum {
  id: string;
  at: string;
  author: string;
  text: string;
}

export interface PersistedReg44Report {
  id: string;
  homeId: string;
  month: string;
  status: Reg44ReportStatus;
  locked: boolean;
  draft: Reg44ReportDraft;
  /** Frozen at sign-off — the immutable record of what was signed. */
  signedSnapshot: Reg44ReportDraft | null;
  addenda: Reg44Addendum[];
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

export function createReg44Report(input: { id: string; homeId: string; month: string; draft: Reg44ReportDraft; createdBy: string; at: string }): PersistedReg44Report {
  return {
    id: input.id,
    homeId: input.homeId,
    month: input.month,
    status: "draft",
    locked: false,
    draft: input.draft,
    signedSnapshot: null,
    addenda: [],
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
