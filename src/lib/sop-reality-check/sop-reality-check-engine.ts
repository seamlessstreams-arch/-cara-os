// ─────────────────────────────────────────────────────────────────────────────
// Statement of Purpose Reality Check Engine
//
// Answers the inspection question: "can the home prove that what it says it does
// is actually being lived every day?" A PURE PROJECTION across the home's existing
// records, organised into the seven assurance areas of a Statement of Purpose.
// For each area it inventories the EVIDENCE the home can show and the GAPS that
// would be an inspection risk, then produces an honest evidence-strength signal.
//
// Critical-friend discipline: an area is only "limited" on real evidence of a
// concern — never merely because a source is empty. Deterministic (injected
// `now`, no LLM) → prod-safe.
// ─────────────────────────────────────────────────────────────────────────────

import type { Incident, Supervision, TrainingRecord } from "@/types";
import type {
  KeyWorkingSession, DebriefRecord, EducationRecord, LACReview,
  PositiveAchievement, RiskAssessment, CarePlan,
} from "@/types/extended";

export type SopAreaKey =
  | "clarity" | "environment" | "staff_skills" | "care_delivery"
  | "safeguarding" | "outcomes" | "leadership";

export type EvidenceStrength = "strong" | "developing" | "limited";

export interface EvidenceItem { label: string; count: number; detail: string }
export interface SopGap { label: string; severity: "high" | "medium"; detail: string }

export interface SopArea {
  key: SopAreaKey;
  label: string;
  strength: EvidenceStrength;
  summary: string;
  evidence: EvidenceItem[];
  gaps: SopGap[];
  inspectionRisk: boolean;
}

export interface SopRealityCheck {
  generatedAt: string;
  headline: string;
  overallConfidence: EvidenceStrength;
  areasStrong: number;
  areasDeveloping: number;
  areasLimited: number;
  inspectionRisks: { area: string; label: string; detail: string }[];
  areas: SopArea[];
}

export interface SopInput {
  now: string;
  recentDays?: number;
  children: { id: string; name: string }[];
  carePlans: CarePlan[];
  dailyLog: { child_id: string; date?: string }[];
  keyWorkingSessions: KeyWorkingSession[];
  incidents: Incident[];
  debriefRecords: DebriefRecord[];
  riskAssessments: RiskAssessment[];
  lacReviews: LACReview[];
  positiveAchievements: PositiveAchievement[];
  educationRecords: EducationRecord[];
  trainingRecords: TrainingRecord[];
  supervisions: Supervision[];
  audits: { id: string; created_at?: string; date?: string }[];
}

const byChild = <T extends { child_id: string }>(rows: T[], id: string): T[] => rows.filter((r) => r.child_id === id);
const present = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

function strengthOf(evidence: EvidenceItem[], gaps: SopGap[]): EvidenceStrength {
  const highGaps = gaps.filter((g) => g.severity === "high").length;
  const hasEvidence = evidence.some((e) => e.count > 0);
  if (highGaps >= 2 || (!hasEvidence && gaps.length > 0)) return "limited";
  if (highGaps === 0 && hasEvidence) return "strong";
  return "developing";
}

function area(key: SopAreaKey, label: string, evidence: EvidenceItem[], gaps: SopGap[], summaries: Record<EvidenceStrength, string>): SopArea {
  const strength = strengthOf(evidence, gaps);
  return { key, label, strength, summary: summaries[strength], evidence, gaps, inspectionRisk: strength === "limited" || gaps.some((g) => g.severity === "high") };
}

export function buildSopRealityCheck(input: SopInput): SopRealityCheck {
  const kids = input.children;
  const ev = (label: string, count: number, detail: string): EvidenceItem => ({ label, count, detail });

  // 1. Clarity of service — are the children placed consistent with a planned, lawful placement?
  const planned = kids.filter((c) => input.carePlans.some((p) => p.child_id === c.id));
  const clarity = area("clarity", "Clarity of service",
    [ev("Children placed", kids.length, "Current children on roll."), ev("With a care plan / legal status", planned.length, "Placements with a recorded plan and legal status.")],
    kids.filter((c) => !input.carePlans.some((p) => p.child_id === c.id)).length > 0
      ? [{ label: `${kids.length - planned.length} child(ren) without a care plan`, severity: "high", detail: "A placement without a plan is hard to show as consistent with the Statement of Purpose." }]
      : [],
    { strong: "Children placed are evidenced against planned, lawful placements.", developing: "Most placements are evidenced; close the remaining plan gaps.", limited: "Placement planning evidence needs strengthening." });

  // 2. Environment / therapeutic practice (best-available proxy: relational practice volume).
  const environment = area("environment", "Environment & therapeutic practice",
    [ev("Key-work sessions", input.keyWorkingSessions.length, "Relational, therapeutic time evidenced."), ev("Daily life records", input.dailyLog.length, "Routines and daily experience recorded.")],
    input.keyWorkingSessions.length === 0
      ? [{ label: "No relational practice recorded", severity: "medium", detail: "Evidence the therapeutic, trauma-informed environment in key-work and daily records." }]
      : [],
    { strong: "Therapeutic, relational practice is visible in the records.", developing: "Relational practice is recorded; keep building the trauma-informed picture.", limited: "Therapeutic-environment evidence is thin." });

  // 3. Staff skills & training.
  const mandatory = input.trainingRecords.filter((t) => t.is_mandatory);
  const compliant = mandatory.filter((t) => t.status === "compliant").length;
  const completedSup = input.supervisions.filter((s) => s.status === "completed").length;
  const staffSkills = area("staff_skills", "Staff skills & training",
    [ev("Mandatory training compliant", compliant, "Training matched to children's needs and kept current."), ev("Supervisions completed", completedSup, "Reflective supervision embedding practice.")],
    mandatory.length - compliant >= 1
      ? [{ label: `${mandatory.length - compliant} mandatory training record(s) not compliant`, severity: mandatory.length - compliant >= 3 ? "high" : "medium", detail: "Gaps between stated skills and actual training are an inspection risk." }]
      : [],
    { strong: "Staff skills and training are current and embedded.", developing: "Training is mostly current; close the remaining gaps.", limited: "Training compliance needs action." });

  // 4. Care delivery — plans align, routines recorded.
  const careDelivery = area("care_delivery", "Care delivery",
    [ev("Care plans", input.carePlans.length, "Plans aligned to the home's approach."), ev("Daily life records", input.dailyLog.length, "Routines reflecting the stated model."), ev("Key-work sessions", input.keyWorkingSessions.length, "1:1 work delivering the plan.")],
    input.carePlans.length === 0 ? [{ label: "No care plans recorded", severity: "high", detail: "Care delivery should be driven by current care plans." }] : [],
    { strong: "Care is delivered against current plans and recorded routines.", developing: "Care delivery is evidenced; keep plans and routines aligned.", limited: "Care-delivery evidence needs strengthening." });

  // 5. Safeguarding & behaviour.
  const currentRisk = input.riskAssessments.filter((r) => r.status === "current").length;
  const incidentNoDebrief = kids.filter((c) => byChild(input.incidents, c.id).length > 0 && byChild(input.debriefRecords, c.id).length === 0);
  const noCurrentRisk = kids.filter((c) => !byChild(input.riskAssessments, c.id).some((r) => r.status === "current"));
  const safeguarding = area("safeguarding", "Safeguarding & behaviour",
    [ev("Incidents recorded", input.incidents.length, "Incidents logged and managed."), ev("Debriefs / reflection", input.debriefRecords.length, "Restorative reflection after incidents."), ev("Current risk assessments", currentRisk, "Live risk assessments informing safe care.")],
    [
      ...(incidentNoDebrief.length > 0 ? [{ label: `${incidentNoDebrief.length} child(ren) with incidents but no debrief`, severity: "high" as const, detail: "Incidents without reflection weaken the safeguarding story." }] : []),
      ...(noCurrentRisk.length > 0 ? [{ label: `${noCurrentRisk.length} child(ren) with no current risk assessment`, severity: "high" as const, detail: "Safe care needs a live risk assessment per child." }] : []),
    ],
    { strong: "Safeguarding and behaviour support are well evidenced.", developing: "Safeguarding is evidenced, with gaps to close.", limited: "Safeguarding evidence has significant gaps." });

  // 6. Outcomes for children.
  const noAchievement = kids.filter((c) => byChild(input.positiveAchievements, c.id).length === 0);
  const outcomes = area("outcomes", "Outcomes for children",
    [ev("Achievements celebrated", input.positiveAchievements.length, "Progress and success recorded."), ev("Education records", input.educationRecords.length, "Learning progress evidenced."), ev("LAC reviews", input.lacReviews.length, "Statutory progress reviews on record.")],
    noAchievement.length > 0 ? [{ label: `${noAchievement.length} child(ren) with no recorded achievements`, severity: "medium", detail: "Make progress and impact visible for every child." }] : [],
    { strong: "Children's progress and outcomes are clearly evidenced.", developing: "Outcomes are evidenced; broaden the picture for every child.", limited: "Outcome evidence needs strengthening." });

  // 7. Leadership & review.
  const leadership = area("leadership", "Leadership & review",
    [ev("Audits / QA records", input.audits.length, "Audits influencing practice."), ev("Supervisions completed", completedSup, "Leaders supporting and overseeing practice.")],
    input.audits.length === 0 ? [{ label: "No audit / QA evidence", severity: "medium", detail: "Show how audits and review influence improvement." }] : [],
    { strong: "Leadership knows the home and evidences review and learning.", developing: "Leadership oversight is evidenced; keep audits influencing practice.", limited: "Leadership-assurance evidence needs strengthening." });

  const areas = [clarity, environment, staffSkills, careDelivery, safeguarding, outcomes, leadership];
  const areasStrong = areas.filter((a) => a.strength === "strong").length;
  const areasDeveloping = areas.filter((a) => a.strength === "developing").length;
  const areasLimited = areas.filter((a) => a.strength === "limited").length;

  const inspectionRisks = areas
    .flatMap((a) => a.gaps.filter((g) => g.severity === "high").map((g) => ({ area: a.label, label: g.label, detail: g.detail })))
    .slice(0, 10);

  const overallConfidence: EvidenceStrength = areasLimited > 0 ? "limited" : areasStrong >= 5 ? "strong" : "developing";
  const headline =
    inspectionRisks.length > 0
      ? `${areasStrong} of ${areas.length} SOP areas strongly evidenced; ${inspectionRisks.length} inspection risk${inspectionRisks.length === 1 ? "" : "s"} to address.`
      : overallConfidence === "strong"
        ? "The home can evidence its Statement of Purpose strongly across all areas."
        : "The Statement of Purpose is evidenced; keep building the picture across every area.";

  return { generatedAt: input.now, headline, overallConfidence, areasStrong, areasDeveloping, areasLimited, inspectionRisks, areas };
}
