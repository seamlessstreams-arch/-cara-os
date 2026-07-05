// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING REPORT (types)
//
// A monthly/quarterly LEADERSHIP synthesis that reads across the whole Practice
// Intelligence signal set — incidents, behaviour, restraints, escalation
// decisions, ethical-intelligence cycles, feedback loops and child voice — and
// draws out what a Registered Manager / Responsible Individual needs to see:
// repeated themes, emerging risks, unresolved learning, practice strengths,
// child-voice themes, and evidence of improvement.
//
// It does NOT recompute the per-child or per-staff engines; it aggregates the
// records they already produced into a period picture. Every line is
// evidence-linked; where the data can't carry a theme it says "insufficient
// data" rather than inventing one.
// ══════════════════════════════════════════════════════════════════════════════

export const ORG_LEARNING_REPORT_VERSION = "1.0.0";

export type ReportPeriod = "month" | "quarter";

export type LearningThemeKind =
  | "repeated_theme"
  | "emerging_risk"
  | "unresolved_learning"
  | "practice_strength"
  | "child_voice_theme"
  | "improvement_evidence";

export type ThemeWeight = "notable" | "watch" | "priority" | "positive";

export interface LearningEvidenceRef {
  recordType: string;
  recordId: string;
}

export interface LearningTheme {
  id: string;
  kind: LearningThemeKind;
  weight: ThemeWeight;
  title: string;
  detail: string;
  evidenceCount: number;
  sources: LearningEvidenceRef[];
}

export interface OrgLearningReportSection {
  key: LearningThemeKind;
  label: string;
  /** Present but empty means: looked, found nothing this period. */
  themes: LearningTheme[];
  /** True when there wasn't enough data to read this section honestly. */
  insufficientData: boolean;
}

export interface OrgLearningReport {
  homeId: string;
  period: ReportPeriod;
  periodLabel: string;
  asOf: string;
  windowDays: number;
  headline: string;
  sections: OrgLearningReportSection[];
  totalEvidence: number;
  regulatoryLinks: string[];
  disclaimer: string;
  engineVersion: string;
}

// ── Input snapshots (the route reads the store; the engine stays pure) ────────

export interface OrgIncidentInput {
  id: string;
  date: string;
  type: string;
  severity: string;
  childId?: string;
}

export interface OrgBehaviourInput {
  id: string;
  date: string;
  direction: string;
  trigger: string;
}

export interface OrgEscalationInput {
  id: string;
  createdAt: string;
  status: string;
  confirmedLevel?: string;
}

export interface OrgEthicalInput {
  id: string;
  createdAt: string;
  /** From computeEthicalCycleStatus — the route computes this. */
  cycleComplete: boolean;
  /** Whether a learning stage was actually captured. */
  hasLearning: boolean;
  summary: string;
}

export interface OrgFeedbackLoopInput {
  id: string;
  feedbackDate: string;
  decisionMade: string; // acted_on_in_full | … | pending_consideration
}

export interface OrgVoiceInput {
  id: string;
  date: string;
  category: string;
  sentiment: string; // very_happy … very_unhappy
}

export interface OrgRestraintInput {
  id: string;
  date: string;
  childDebriefed: boolean;
  hasDebriefRecord: boolean;
}

export interface OrgLearningReportInput {
  homeId: string;
  asOf: string;
  period?: ReportPeriod;
  incidents: OrgIncidentInput[];
  behaviour: OrgBehaviourInput[];
  escalations: OrgEscalationInput[];
  ethical: OrgEthicalInput[];
  feedbackLoops: OrgFeedbackLoopInput[];
  voice: OrgVoiceInput[];
  restraints: OrgRestraintInput[];
}
