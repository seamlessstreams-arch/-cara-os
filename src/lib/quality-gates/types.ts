// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUALITY-GATE ENFORCEMENT (types)
//
// §30 is the ENFORCEMENT counterpart to §26 (Continuous Health Check, which
// DETECTS what is missing). A quality gate blocks a record from PROGRESSING —
// closing, signing, marking reviewed — until the elements that make it safe and
// defensible are present.
//
// A gate does NOT change practice or make a judgement. It refuses an unsafe
// transition and says exactly what is needed. The block is always overridable by
// completing the requirement — never by a machine deciding the practice is "good
// enough". (Where a named override is appropriate, that is a human recording a
// reason, as in the Reg 44 sign-off gate.)
// ══════════════════════════════════════════════════════════════════════════════

export const QUALITY_GATES_VERSION = "1.0.0";

export type GateKind =
  | "incident_close" // a notifiable / oversight-required incident cannot close without management oversight
  | "restraint_review" // a restraint cannot be signed off as reviewed without the child's debrief
  | "missing_episode_close" // a missing episode cannot close without an independent return home interview
  | "task_complete"; // a task requiring sign-off cannot complete without it

export interface GateBlock {
  requirement: string;
  reason: string;
  howToResolve: string;
  statutoryBasis: string;
}

export interface GateTransition {
  recordType: string;
  recordId: string;
  childId?: string;
  from: string;
  to: string;
}

export interface GateDecision {
  allowed: boolean;
  gate: GateKind | null;
  transition: GateTransition;
  blocks: GateBlock[];
}

export interface GateBoardEntry {
  gate: GateKind;
  recordType: string;
  recordId: string;
  childId?: string;
  currentStatus: string;
  proposedTransition: string;
  blocked: boolean;
  blocks: GateBlock[];
}

export interface GateBoard {
  homeId: string;
  asOf: string;
  entries: GateBoardEntry[];
  summary: { total: number; blocked: number; byGate: Partial<Record<GateKind, number>> };
  disclaimer: string;
  engineVersion: string;
}

// ── Inputs (pure engine; routes read the store) ───────────────────────────────

export interface GateIncident {
  id: string;
  status: string;
  requires_oversight: boolean;
  has_oversight: boolean;
  child_id?: string;
}

export interface GateRestraint {
  id: string;
  review_status: string;
  child_debriefed: boolean;
  child_id?: string;
}

export interface GateMissingEpisode {
  id: string;
  status: string;
  has_return_interview: boolean;
  child_id?: string;
}

export interface GateTask {
  id: string;
  status: string;
  requires_sign_off: boolean;
  signed_off: boolean;
  child_id?: string;
}

export interface GateBoardInput {
  homeId: string;
  asOf: string;
  incidents: GateIncident[];
  restraints: GateRestraint[];
  missingEpisodes: GateMissingEpisode[];
  tasks: GateTask[];
}
