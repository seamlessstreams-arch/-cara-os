// ─────────────────────────────────────────────────────────────────────────────
// Inspection Intelligence Engine
//
// Philosophy: "Evidence is the protection."
//
// Ofsted inspects a children's home against the Social Care Common Inspection
// Framework (SCCIF), making judgements in three areas:
//   1. The overall experiences and progress of children and young people
//   2. How well children and young people are helped and protected
//   3. The effectiveness of leaders and managers
//
// This engine is a PURE PROJECTION over the records the home already holds. For
// each SCCIF area it inventories the EVIDENCE the home can show an inspector and
// surfaces the GAPS an inspector would probe — then gives an honest evidence-
// STRENGTH signal (strong / developing / limited).
//
// ❗ AI BEHAVIOUR RULE: this engine NEVER predicts or assigns an Ofsted grade.
// "Evidence strength" is a self-evaluation readiness signal to direct the
// leader's attention — the inspection judgement is Ofsted's alone. Intelligence
// informs practice; people make the decisions. Deterministic (injected `now`,
// no LLM) → works in production with no AI key.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  KeyWorkingSession,
  DebriefRecord,
  MissingEpisode,
  ReturnInterview,
  PositiveAchievement,
  EducationRecord,
  LACReview,
  RiskAssessment,
  WelfareCheck,
  CarePlan,
} from "@/types/extended";
import type { Incident, Supervision, TrainingRecord } from "@/types";

// ── Vocabulary ───────────────────────────────────────────────────────────────

export type SccifAreaKey = "experiences_progress" | "protection" | "leadership";
export type EvidenceStrength = "strong" | "developing" | "limited";

export interface EvidenceItem {
  label: string;
  count: number;
  detail: string;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface GapItem {
  label: string;
  severity: "high" | "medium";
  detail: string;
  /** The specific children behind this gap, so a manager can act on it. */
  childRefs?: ChildRef[];
}

export interface SccifArea {
  key: SccifAreaKey;
  /** The Ofsted SCCIF judgement-area name. */
  label: string;
  strength: EvidenceStrength;
  summary: string;
  evidence: EvidenceItem[];
  gaps: GapItem[];
}

export interface InspectionReadiness {
  generatedAt: string;
  headline: string;
  areasStrong: number;
  areasDeveloping: number;
  areasLimited: number;
  /** High-severity gaps across all areas — the leader's priority list. */
  priorities: { area: string; label: string; detail: string; childRefs?: ChildRef[] }[];
  areas: SccifArea[];
}

export interface InspectionReadinessInput {
  now: string; // injected ISO timestamp → deterministic
  /** Recency window (days) for "recent" evidence such as key-work. Default 30. */
  recentDays?: number;
  children: { id: string; name: string }[];
  incidents: Incident[];
  debriefRecords: DebriefRecord[];
  missingEpisodes: MissingEpisode[];
  returnInterviews: ReturnInterview[];
  keyWorkingSessions: KeyWorkingSession[];
  lacReviews: LACReview[];
  positiveAchievements: PositiveAchievement[];
  educationRecords: EducationRecord[];
  riskAssessments: RiskAssessment[];
  welfareChecks: WelfareCheck[];
  carePlans: CarePlan[];
  supervisions: Supervision[];
  trainingRecords: TrainingRecord[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(dateIso: string | undefined | null, now: string): number {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return (n - t) / 86_400_000;
}

/** True if `date` is in the past relative to `now` (overdue). */
function isPast(dateIso: string | undefined | null, now: string): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return false;
  return t < n;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

const byChild = <T extends { child_id: string }>(rows: T[], id: string): T[] =>
  rows.filter((r) => r.child_id === id);

/**
 * Evidence strength from evidence presence vs gap severity. A genuine absence of
 * expected evidence (a high-severity gap) lowers strength; an empty home with no
 * concerns is not punished (no false red).
 */
function strengthOf(evidence: EvidenceItem[], gaps: GapItem[]): EvidenceStrength {
  const highGaps = gaps.filter((g) => g.severity === "high").length;
  const hasEvidence = evidence.some((e) => e.count > 0);
  if (highGaps >= 3 || (!hasEvidence && gaps.length > 0)) return "limited";
  if (highGaps === 0 && hasEvidence) return "strong";
  return "developing";
}

// ── Area 1: Experiences & progress ───────────────────────────────────────────

function buildExperiencesProgress(input: InspectionReadinessInput): SccifArea {
  const recentDays = input.recentDays ?? 30;
  const voiceFromKeywork = input.keyWorkingSessions.filter((s) => s.child_voice?.trim()).length;
  const voiceFromReviews = input.lacReviews.filter((l) => l.child_views?.trim()).length;

  const evidence: EvidenceItem[] = [
    { label: "Key-work sessions recorded", count: input.keyWorkingSessions.length, detail: "1:1 relational time with children, evidenced." },
    { label: "Child voice captured", count: voiceFromKeywork + voiceFromReviews, detail: "Wishes & feelings recorded in key-work and statutory reviews." },
    { label: "Achievements celebrated", count: input.positiveAchievements.length, detail: "Progress and success recorded for children." },
    { label: "Education records", count: input.educationRecords.length, detail: "Engagement, attainment and school progress evidenced." },
    { label: "LAC reviews held", count: input.lacReviews.length, detail: "Statutory looked-after reviews on record." },
  ];

  const gaps: GapItem[] = [];

  const noRecentKeywork = input.children.filter(
    (c) => !byChild(input.keyWorkingSessions, c.id).some((s) => daysSince(s.date, input.now) <= recentDays),
  );
  if (noRecentKeywork.length > 0) {
    gaps.push({
      label: `${noRecentKeywork.length} ${noRecentKeywork.length === 1 ? "child has" : "children have"} no key-work in ${recentDays} days`,
      severity: "high",
      detail: `No recent 1:1 relational time recorded for ${noRecentKeywork.map((c) => c.name).join(", ")}.`,
      childRefs: noRecentKeywork,
    });
  }

  const noVoice = input.children.filter(
    (c) =>
      !byChild(input.keyWorkingSessions, c.id).some((s) => s.child_voice?.trim()) &&
      !byChild(input.lacReviews, c.id).some((l) => l.child_views?.trim()),
  );
  if (noVoice.length > 0) {
    gaps.push({
      label: `${noVoice.length} ${noVoice.length === 1 ? "child has" : "children have"} no recorded voice`,
      severity: "high",
      detail: `No wishes & feelings on record for ${noVoice.map((c) => c.name).join(", ")} — a participation gap.`,
      childRefs: noVoice,
    });
  }

  const overdueReview = input.carePlans.filter(
    (cp) => cp.next_lac_review && isPast(cp.next_lac_review, input.now),
  ).length;
  if (overdueReview > 0) {
    gaps.push({
      label: `${overdueReview} overdue LAC review${overdueReview === 1 ? "" : "s"}`,
      severity: "high",
      detail: "A statutory review date has passed without a recorded review.",
    });
  }

  const noAchievement = input.children.filter((c) => byChild(input.positiveAchievements, c.id).length === 0);
  if (noAchievement.length > 0) {
    gaps.push({
      label: `${noAchievement.length} ${noAchievement.length === 1 ? "child has" : "children have"} no recorded achievements`,
      severity: "medium",
      detail: `Celebrate and record progress for ${noAchievement.map((c) => c.name).join(", ")}.`,
      childRefs: noAchievement,
    });
  }

  const strength = strengthOf(evidence, gaps);
  return {
    key: "experiences_progress",
    label: "Overall experiences and progress of children and young people",
    strength,
    summary:
      strength === "strong"
        ? "Children's progress and voice are well evidenced across the home."
        : gaps.length > 0
          ? "Good evidence of progress, with specific recording gaps to close before inspection."
          : "Building the evidence base for children's experiences and progress.",
    evidence,
    gaps,
  };
}

// ── Area 2: Help & protection ────────────────────────────────────────────────

function buildProtection(input: InspectionReadinessInput): SccifArea {
  const incidentsWithDebriefRate = pct(
    input.children.filter(
      (c) => byChild(input.incidents, c.id).length > 0 && byChild(input.debriefRecords, c.id).length > 0,
    ).length,
    Math.max(1, input.children.filter((c) => byChild(input.incidents, c.id).length > 0).length),
  );

  const currentRisk = input.riskAssessments.filter((r) => r.status === "current").length;

  const evidence: EvidenceItem[] = [
    { label: "Incidents recorded", count: input.incidents.length, detail: "Incidents logged for review and learning." },
    { label: "Debrief / reflection records", count: input.debriefRecords.length, detail: `Restorative debriefs after incidents (${incidentsWithDebriefRate}% of affected children have one).` },
    { label: "Return home interviews", count: input.returnInterviews.length, detail: "Children offered a conversation after going missing." },
    { label: "Current risk assessments", count: currentRisk, detail: "Live risk assessments informing safe care." },
    { label: "Welfare checks", count: input.welfareChecks.length, detail: "Routine welfare and safety checks evidenced." },
  ];

  const gaps: GapItem[] = [];

  const incidentNoDebrief = input.children.filter(
    (c) => byChild(input.incidents, c.id).length > 0 && byChild(input.debriefRecords, c.id).length === 0,
  );
  if (incidentNoDebrief.length > 0) {
    gaps.push({
      label: `${incidentNoDebrief.length} ${incidentNoDebrief.length === 1 ? "child has" : "children have"} incidents but no debrief`,
      severity: "high",
      detail: `No restorative reflection recorded for ${incidentNoDebrief.map((c) => c.name).join(", ")} — a learning & repair gap.`,
      childRefs: incidentNoDebrief,
    });
  }

  const missingNoRHI = input.children.filter(
    (c) => byChild(input.missingEpisodes, c.id).length > 0 && byChild(input.returnInterviews, c.id).length === 0,
  );
  if (missingNoRHI.length > 0) {
    gaps.push({
      label: `${missingNoRHI.length} missing-from-care without a return interview`,
      severity: "high",
      detail: `Statutory return home interview not recorded for ${missingNoRHI.map((c) => c.name).join(", ")}.`,
      childRefs: missingNoRHI,
    });
  }

  const noCurrentRisk = input.children.filter(
    (c) => !byChild(input.riskAssessments, c.id).some((r) => r.status === "current"),
  );
  if (noCurrentRisk.length > 0) {
    gaps.push({
      label: `${noCurrentRisk.length} ${noCurrentRisk.length === 1 ? "child has" : "children have"} no current risk assessment`,
      severity: "high",
      detail: `Safe-care planning needs a live risk assessment for ${noCurrentRisk.map((c) => c.name).join(", ")}.`,
      childRefs: noCurrentRisk,
    });
  }

  const overdueRiskReview = input.riskAssessments.filter(
    (r) => r.status === "current" && isPast(r.review_date, input.now),
  ).length;
  if (overdueRiskReview > 0) {
    gaps.push({
      label: `${overdueRiskReview} risk assessment${overdueRiskReview === 1 ? "" : "s"} overdue for review`,
      severity: "medium",
      detail: "A current risk assessment has passed its review date.",
    });
  }

  const unescalatedConcern = input.welfareChecks.filter(
    (w) => w.concern_details?.trim() && w.concern_escalated === false,
  ).length;
  if (unescalatedConcern > 0) {
    gaps.push({
      label: `${unescalatedConcern} welfare concern${unescalatedConcern === 1 ? "" : "s"} not escalated`,
      severity: "medium",
      detail: "A welfare check recorded a concern that was not marked as escalated.",
    });
  }

  const strength = strengthOf(evidence, gaps);
  return {
    key: "protection",
    label: "How well children and young people are helped and protected",
    strength,
    summary:
      strength === "strong"
        ? "Safeguarding is well evidenced — incidents are reflected on and risk is actively managed."
        : gaps.length > 0
          ? "Protection evidence is present, with safeguarding-critical gaps to close."
          : "Establishing the safeguarding evidence base.",
    evidence,
    gaps,
  };
}

// ── Area 3: Leaders & managers ───────────────────────────────────────────────

function buildLeadership(input: InspectionReadinessInput): SccifArea {
  const completedSup = input.supervisions.filter((s) => s.status === "completed").length;
  const mandatoryTraining = input.trainingRecords.filter((t) => t.is_mandatory);
  const compliantTraining = mandatoryTraining.filter((t) => t.status === "compliant").length;
  const trainingRate = pct(compliantTraining, mandatoryTraining.length);

  const evidence: EvidenceItem[] = [
    { label: "Supervisions completed", count: completedSup, detail: "Recorded staff supervision supporting reflective practice." },
    { label: "Mandatory training compliant", count: compliantTraining, detail: `${trainingRate}% of mandatory training records are compliant.` },
    { label: "Debrief / oversight records", count: input.debriefRecords.length, detail: "Management reflection and learning after events." },
  ];

  const gaps: GapItem[] = [];

  const overdueSup = input.supervisions.filter(
    (s) => s.status === "scheduled" && isPast(s.scheduled_date, input.now),
  ).length;
  if (overdueSup > 0) {
    gaps.push({
      label: `${overdueSup} overdue supervision${overdueSup === 1 ? "" : "s"}`,
      severity: "high",
      detail: "A scheduled supervision date has passed without being completed.",
    });
  }

  const expiredMandatory = mandatoryTraining.filter(
    (t) => t.status !== "compliant" || (t.expiry_date && isPast(t.expiry_date, input.now)),
  ).length;
  if (expiredMandatory > 0) {
    gaps.push({
      label: `${expiredMandatory} mandatory training record${expiredMandatory === 1 ? "" : "s"} not compliant`,
      severity: expiredMandatory >= 3 ? "high" : "medium",
      detail: "Mandatory training is expired, overdue or incomplete — a leadership assurance gap.",
    });
  }

  if (completedSup === 0 && input.supervisions.length > 0) {
    gaps.push({
      label: "No completed supervisions on record",
      severity: "high",
      detail: "Supervisions are scheduled but none are recorded as completed.",
    });
  }

  const strength = strengthOf(evidence, gaps);
  return {
    key: "leadership",
    label: "The effectiveness of leaders and managers",
    strength,
    summary:
      strength === "strong"
        ? "Leadership assurance is well evidenced — supervision and training are current."
        : gaps.length > 0
          ? "Leadership evidence is present, with supervision/training gaps to address."
          : "Building the leadership assurance evidence base.",
    evidence,
    gaps,
  };
}

// ── Public entry point — pure ────────────────────────────────────────────────

const STRENGTH_RANK: Record<EvidenceStrength, number> = { strong: 0, developing: 1, limited: 2 };

export function buildInspectionReadiness(input: InspectionReadinessInput): InspectionReadiness {
  const areas: SccifArea[] = [
    buildExperiencesProgress(input),
    buildProtection(input),
    buildLeadership(input),
  ];

  const areasStrong = areas.filter((a) => a.strength === "strong").length;
  const areasDeveloping = areas.filter((a) => a.strength === "developing").length;
  const areasLimited = areas.filter((a) => a.strength === "limited").length;

  const priorities = areas
    .flatMap((a) => a.gaps.filter((g) => g.severity === "high").map((g) => ({ area: a.label, label: g.label, detail: g.detail, childRefs: g.childRefs })))
    .slice(0, 8);

  const worst = [...areas].sort((a, b) => STRENGTH_RANK[b.strength] - STRENGTH_RANK[a.strength])[0];
  const headline =
    areasLimited === 0 && areasDeveloping === 0
      ? "Inspection evidence is strong across all three SCCIF areas — well prepared."
      : priorities.length > 0
        ? `${priorities.length} safeguarding-critical evidence gap${priorities.length === 1 ? "" : "s"} to close — strongest focus on "${worst.label}".`
        : "Evidence base is developing across the SCCIF areas — keep recording to strengthen it.";

  return {
    generatedAt: input.now,
    headline,
    areasStrong,
    areasDeveloping,
    areasLimited,
    priorities,
    areas,
  };
}
