// ══════════════════════════════════════════════════════════════════════════════
// CARA — SELF-HEALING INTEGRITY ENGINE (types)
//
// The resting-state complement to the capture/dedup gate (which prevents
// duplicates at write time). This engine scans what is ALREADY in the store for
// STRUCTURAL integrity problems — dangling links, missing mirror references,
// conflicting links, duplicate ids — and proposes repairs.
//
// THE SAFETY INVARIANT (the whole point of this slice):
//   A self-healing system that REFUSES to auto-change anything carrying practice
//   meaning. Only structurally-safe, reversible, technical repairs to DERIVED
//   indexes are auto-applied. Anything that would delete, merge or reinterpret a
//   practice record — or where the right answer is ambiguous — is classified
//   needs_human and NEVER auto-applied.
//
// §25 (Self-Healing) extends §26 (Continuous Health Check): §26 asks "is the
// PRACTICE complete?"; §25 asks "is the DATA structurally sound?".
// ══════════════════════════════════════════════════════════════════════════════

export const SELF_HEALING_VERSION = "1.0.0";

export type RepairClassification = "safe_auto" | "needs_human";

export type RepairKind =
  | "missing_back_link" // one side asserts a link, the mirror index is simply missing it → safe to restore
  | "conflicting_link" // both sides carry links that disagree → a person must decide
  | "dangling_child_reference" // record points at a child not on the current roll
  | "duplicate_id"; // two records share an id within one collection (corruption)

export type RepairSeverity = "critical" | "high" | "medium" | "low";

export interface IntegrityRepair {
  id: string;
  kind: RepairKind;
  classification: RepairClassification;
  severity: RepairSeverity;
  recordType: string;
  recordId: string;
  relatedRecordId?: string;
  childId?: string;
  description: string;
  rationale: string;
  /** True only when the repair can be undone from the heal-log's `before`. */
  reversible: boolean;
  /** True when the repair target is an authoritative practice record's content/decision. */
  targetIsPractice: boolean;
  before: string;
  after: string;
}

export interface SelfHealingPlan {
  homeId: string;
  asOf: string;
  repairs: IntegrityRepair[];
  summary: {
    total: number;
    safeAuto: number;
    needsHuman: number;
    byKind: Partial<Record<RepairKind, number>>;
  };
  disclaimer: string;
  engineVersion: string;
}

// ── Apply path (executed only on explicit intent, never on a scan) ────────────

export interface HealEvent {
  id: string;
  at: string; // ISO
  repairId: string;
  kind: RepairKind;
  recordType: string;
  recordId: string;
  before: string;
  after: string;
  appliedBy: string;
}

export interface ApplySelection {
  apply: IntegrityRepair[];
  skip: Array<{ repair: IntegrityRepair; reason: string }>;
}

// ── Input snapshot (the route reads the store; the engine stays pure) ─────────

export interface SelfHealingInput {
  homeId: string;
  asOf: string; // YYYY-MM-DD
  childIds: string[];
  incidents: Array<{ id: string; linked_task_ids: string[]; child_id?: string }>;
  tasks: Array<{ id: string; linked_incident_id?: string; child_id?: string }>;
}
