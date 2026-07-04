// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ESCALATION DECISION SERVICE (the write path)
//
// createEscalationSuggestion → a decision record awaiting a human decision.
// recordManagerDecision      → confirm / amend / reject, by a NAMED manager.
//
// Rules enforced here (and pinned by tests):
//   • a suggestion must cite ≥1 source record (the Ethical Intelligence
//     traceability rule) — refused otherwise;
//   • a decision must name the human who made it — Cara never escalates;
//   • AMEND requires a different level AND a reason;
//   • REJECT requires a reason (and triggers no actions);
//   • the confirmed level's required actions are frozen onto the record.
//
// Optionally writes the decision into a linked Ethical Intelligence event
// (the slice-1 spine), so escalation decisions join the learning cycle.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isTraceable } from "@/lib/ethical-intelligence/ethical-intelligence-engine";
import { recordDecision as recordEthicalDecision } from "@/lib/ethical-intelligence/capture-service";
import {
  ESCALATION_LEVEL_DEFINITIONS,
  suggestEscalationLevel,
} from "./risk-escalation-engine";
import type {
  EscalationAgreement,
  EscalationDecision,
  EscalationEvidenceInput,
  EscalationLevel,
} from "./types";

export type EscalationResult<T> = { ok: true; value: T } | { ok: false; reason: string };

const UNTRACED =
  "Refused: this assessment cites no source record. If Cara cannot trace it, Cara cannot claim it — link at least one record (recordType + recordId).";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

function audit(actor: string, action: string, detail?: string) {
  return { at: new Date().toISOString(), actor, action, detail };
}

// ── Suggest ────────────────────────────────────────────────────────────────────

export function createEscalationSuggestion(
  createdBy: string,
  evidence: EscalationEvidenceInput,
): EscalationResult<EscalationDecision> {
  if (!nonEmpty(createdBy)) return { ok: false, reason: "Refused: a named human must raise the assessment." };
  if (!nonEmpty(evidence.summary)) return { ok: false, reason: "Refused: describe the concern being assessed." };
  if (!isTraceable(evidence.sourceRecords)) return { ok: false, reason: UNTRACED };

  const suggestion = suggestEscalationLevel(evidence);
  const now = new Date().toISOString();
  const decision: EscalationDecision = {
    id: generateId("escd"),
    createdAt: now,
    createdBy,
    childId: evidence.childId,
    childName: evidence.childName,
    concernSummary: evidence.summary,
    suggestedLevel: suggestion.level,
    suggestedAt: now,
    suggestionEvidence: suggestion.evidence,
    engineVersion: suggestion.engineVersion,
    status: "awaiting_decision",
    actionsTriggered: [],
    sourceRecords: evidence.sourceRecords,
    auditTrail: [audit(createdBy, "suggestion_created", `Cara suggested ${suggestion.definition.label}`)],
  };
  db.escalationDecisions.append(decision);
  return { ok: true, value: decision };
}

// ── Decide ─────────────────────────────────────────────────────────────────────

export interface ManagerDecisionInput {
  decisionMaker: string;
  decisionMakerRole?: string;
  agreement: EscalationAgreement;
  /** Required when amending; must differ from the suggested level. */
  amendedLevel?: EscalationLevel;
  /** Required when amending or rejecting. */
  reason?: string;
  /** The evidence the manager relied on, in their words. */
  evidenceUsed?: string[];
  /** Optional: also record this decision on a linked Ethical Intelligence event. */
  ethicalEventId?: string;
}

export function recordManagerDecision(
  decisionId: string,
  input: ManagerDecisionInput,
): EscalationResult<EscalationDecision> {
  const decision = db.escalationDecisions.findById(decisionId);
  if (!decision) return { ok: false, reason: "Escalation decision not found." };
  if (decision.status === "decided") return { ok: false, reason: "This escalation has already been decided." };
  if (!nonEmpty(input.decisionMaker)) {
    return { ok: false, reason: "Refused: a decision must name the human who made it — Cara never escalates on its own." };
  }

  let confirmedLevel: EscalationLevel | undefined;
  switch (input.agreement) {
    case "confirmed":
      confirmedLevel = decision.suggestedLevel;
      break;
    case "amended": {
      if (!input.amendedLevel) return { ok: false, reason: "Amending requires the level you are amending to." };
      if (input.amendedLevel === decision.suggestedLevel) {
        return { ok: false, reason: "Amending to the suggested level is a confirmation — choose confirm, or pick a different level." };
      }
      if (!nonEmpty(input.reason)) return { ok: false, reason: "Amending requires your reason — it becomes part of the audit trail." };
      confirmedLevel = input.amendedLevel;
      break;
    }
    case "rejected":
      if (!nonEmpty(input.reason)) return { ok: false, reason: "Rejecting requires your reason — it becomes part of the audit trail." };
      confirmedLevel = undefined;
      break;
    default:
      return { ok: false, reason: "Unknown agreement — expected confirmed, amended or rejected." };
  }

  decision.status = "decided";
  decision.agreement = input.agreement;
  decision.confirmedLevel = confirmedLevel;
  decision.decisionMaker = input.decisionMaker;
  decision.decisionMakerRole = input.decisionMakerRole;
  decision.decisionReason = input.reason;
  decision.evidenceUsed = (input.evidenceUsed ?? []).filter((s) => nonEmpty(s));
  decision.actionsTriggered = confirmedLevel ? [...ESCALATION_LEVEL_DEFINITIONS[confirmedLevel].requiredActions] : [];
  decision.decidedAt = new Date().toISOString();
  decision.auditTrail.push(
    audit(
      input.decisionMaker,
      `decision_${input.agreement}`,
      confirmedLevel
        ? `${ESCALATION_LEVEL_DEFINITIONS[confirmedLevel].label} — ${decision.actionsTriggered.length} required actions triggered`
        : `Rejected: ${input.reason}`,
    ),
  );

  // Join the learning cycle: record the human's escalation decision on the
  // linked Ethical Intelligence event (refusals surface in the audit trail,
  // they never block the escalation decision itself).
  if (input.ethicalEventId) {
    const ethical = recordEthicalDecision(input.ethicalEventId, {
      decisionSummary: confirmedLevel
        ? `Risk escalation ${input.agreement}: ${ESCALATION_LEVEL_DEFINITIONS[confirmedLevel].label}`
        : `Risk escalation rejected: ${decision.concernSummary}`,
      decisionMaker: input.decisionMaker,
      decisionMakerRole: input.decisionMakerRole,
      evidence: decision.evidenceUsed?.length ? decision.evidenceUsed : decision.suggestionEvidence.map((e) => e.because),
      sourceRecords: decision.sourceRecords,
    });
    decision.auditTrail.push(
      audit(
        input.decisionMaker,
        ethical.ok ? "ethical_cycle_recorded" : "ethical_cycle_refused",
        ethical.ok ? `Decision recorded on ${input.ethicalEventId}` : ethical.reason,
      ),
    );
  }

  return { ok: true, value: decision };
}

// ── Reads ──────────────────────────────────────────────────────────────────────

export function listEscalationDecisions(filter?: {
  childId?: string;
  status?: "awaiting_decision" | "decided";
}): EscalationDecision[] {
  let items = db.escalationDecisions.findAll();
  if (filter?.childId) items = items.filter((d) => d.childId === filter.childId);
  if (filter?.status) items = items.filter((d) => d.status === filter.status);
  return [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getEscalationDecision(id: string): EscalationDecision | undefined {
  return db.escalationDecisions.findById(id);
}
