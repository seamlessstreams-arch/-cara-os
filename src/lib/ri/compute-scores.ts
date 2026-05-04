// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RI GOVERNANCE SCORING ENGINE
// Shared between RI Command Centre hub and RI Scorecard page
// ══════════════════════════════════════════════════════════════════════════════

import type { TrainingNeed } from "@/types/extended";
import type { TrainingRecord, DailyLogEntry, CareForm } from "@/types/index";
import type { RiAlert, RiReg45Evidence } from "@/types/extended";
import type { Incident } from "@/types/index";
import type { Supervision } from "@/types/index";
import type { Audit } from "@/types/extended";
import type { RiChallengeLog } from "@/types/extended";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(v)));
}

export interface RiScoreInputs {
  trainingNeeds: TrainingNeed[];
  trainingRecords: TrainingRecord[];
  alerts: RiAlert[];
  incidents: Incident[];
  supervisionsMeta?: { overdue?: number };
  auditsMeta?: { overdue?: number };
  audits: Audit[];
  medicationAudits: Audit[];
  reg45Items: RiReg45Evidence[];
  challenges: RiChallengeLog[];
  // Live inputs for previously-estimated metrics
  careForms?: CareForm[];
  dailyLogs?: DailyLogEntry[];
  activeCandidates?: { compliance_score: number }[];
  ypCount?: number;
}

export interface RiScores {
  overall_governance_score: number;
  safeguarding_oversight_score: number;
  incident_management_score: number;
  missing_episodes_score: number;
  reg45_compliance_score: number;
  staff_supervision_score: number;
  training_compliance_score: number;
  medication_governance_score: number;
  care_planning_score: number;
  child_voice_score: number;
  complaint_management_score: number;
  building_safety_score: number;
  recruitment_compliance_score: number;
  oversight_quality_score: number;
  outcome_evidence_score: number;
  challenge_log_score: number;
}

export function computeRiScores(inputs: RiScoreInputs): RiScores {
  const {
    trainingNeeds, trainingRecords, alerts, incidents,
    supervisionsMeta, auditsMeta, audits, medicationAudits,
    reg45Items, challenges,
    careForms, dailyLogs, activeCandidates, ypCount,
  } = inputs;

  // Training compliance
  const urgentN = trainingNeeds.filter((n) => n.priority === "urgent" && !["completed", "no_action"].includes(n.status)).length;
  const highN = trainingNeeds.filter((n) => n.priority === "high" && !["completed", "no_action"].includes(n.status)).length;
  const mandatory = trainingRecords.filter((r) => r.is_mandatory);
  const mc = mandatory.length || 1;
  const compliant = mandatory.filter((r) => r.status === "compliant").length;
  const expiring = mandatory.filter((r) => r.status === "expiring_soon").length;
  const training_compliance_score = clamp(
    (compliant + expiring * 0.6) / mc * 95 - urgentN * 8 - highN * 3,
    30, 95
  );

  // Safeguarding oversight
  const criticalU = alerts.filter((a) => !a.is_resolved && a.severity === "critical").length;
  const highU = alerts.filter((a) => !a.is_resolved && a.severity === "high").length;
  const safeguarding_oversight_score = clamp(95 - criticalU * 15 - highU * 8, 45, 95);

  // Incident management
  const unactioned = incidents.filter((i) => i.requires_oversight && !i.oversight_note).length;
  const openHC = incidents.filter((i) => i.status === "open" && (i.severity === "high" || i.severity === "critical")).length;
  const incident_management_score = clamp(90 - unactioned * 10 - openHC * 5, 40, 95);

  // Supervision
  const overdueS = supervisionsMeta?.overdue ?? 0;
  const staff_supervision_score = clamp(85 - overdueS * 10, 40, 90);

  // Challenge log
  const openC = challenges.filter((c) => c.status === "open" || c.status === "action_pending").length;
  const challenge_log_score = clamp(90 - openC * 12, 40, 92);

  // Reg 45
  const latestReg45 = reg45Items[0];
  const reg45_compliance_score =
    latestReg45?.status === "submitted" ? 100
    : latestReg45?.status === "approved" ? 88
    : latestReg45?.status === "reviewed" ? 72
    : latestReg45?.status === "in_progress" ? 58
    : latestReg45?.status === "draft" ? 45
    : 40;

  // Oversight quality
  const overdueA = auditsMeta?.overdue ?? 0;
  const totalU = alerts.filter((a) => !a.is_resolved).length;
  const oversight_quality_score = clamp(88 - overdueA * 8 - totalU * 4, 45, 92);

  // Medication governance
  const medication_governance_score = clamp(
    medicationAudits.length > 0
      ? Math.round(medicationAudits.reduce((s, a) => s + (a.score / Math.max(a.max_score, 1)) * 100, 0) / medicationAudits.length)
      : 78,
    40, 98
  );

  // Building safety
  const bAudits = audits.filter((a) => ["building_safety", "fire_safety", "health_and_safety", "health_safety"].includes(a.category));
  const building_safety_score = bAudits.length > 0
    ? clamp(Math.round(bAudits.reduce((s, a) => s + (a.score / Math.max(a.max_score, 1)) * 100, 0) / bAudits.length), 40, 98)
    : 82;

  // Missing episodes (derived from open high/critical incidents)
  const missing_episodes_score = clamp(75 - openHC * 3, 40, 90);

  // Care planning — based on care form completion status
  const care_planning_score = (() => {
    if (!careForms || careForms.length === 0) return 76;
    const today = new Date().toISOString().slice(0, 10);
    const total = careForms.length;
    const approved = careForms.filter((f) => f.status === "approved").length;
    const reviewed = careForms.filter((f) => f.status === "submitted").length;
    const overdue = careForms.filter((f) =>
      (f.status === "draft" || f.status === "pending_review") && f.due_date != null && f.due_date < today
    ).length;
    return clamp((approved + reviewed * 0.7) / total * 95 - overdue * 5, 35, 95);
  })();

  // Child voice — average mood coverage and log volume across YP
  const child_voice_score = (() => {
    if (!dailyLogs || dailyLogs.length === 0) return 68;
    const recent = dailyLogs.filter((l) => {
      const d = new Date(l.created_at);
      return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    });
    const yps = new Set(recent.map((l) => l.child_id)).size;
    const coverage = ypCount ? yps / ypCount : 1;
    const moodEntries = recent.filter((l) => l.mood_score !== null && l.mood_score !== undefined);
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((s, l) => s + (l.mood_score ?? 5), 0) / moodEntries.length
      : 5;
    return clamp(coverage * 60 + avgMood * 4, 30, 92);
  })();

  // Complaint management — derived from incidents of type "complaint"
  const complaint_management_score = (() => {
    const complaints = incidents.filter((i) => i.type === "complaint");
    const openComplaints = complaints.filter((i) => i.status === "open" || i.status === "under_review").length;
    const unactioned = complaints.filter((i) => i.requires_oversight && !i.oversight_note).length;
    return clamp(92 - openComplaints * 8 - unactioned * 12, 40, 95);
  })();

  // Recruitment compliance — average compliance score across active candidates
  const recruitment_compliance_score = (() => {
    if (!activeCandidates || activeCandidates.length === 0) return 85;
    const avg = activeCandidates.reduce((s, c) => s + c.compliance_score, 0) / activeCandidates.length;
    return clamp(avg, 30, 100);
  })();

  // Outcome evidence — daily log coverage over last 30 days
  const outcome_evidence_score = (() => {
    if (!dailyLogs || dailyLogs.length === 0 || !ypCount) return 70;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recent30 = dailyLogs.filter((l) => l.created_at >= cutoff);
    const significantEntries = recent30.filter((l) => l.is_significant).length;
    const avgPerYP = recent30.length / (ypCount || 1);
    return clamp(Math.min(avgPerYP / 2, 1) * 60 + significantEntries * 2, 30, 92);
  })();

  // Weighted composite
  const weighted = [
    { s: safeguarding_oversight_score, w: 2.0 },
    { s: incident_management_score, w: 1.5 },
    { s: reg45_compliance_score, w: 1.5 },
    { s: staff_supervision_score, w: 1.5 },
    { s: training_compliance_score, w: 1.5 },
    { s: missing_episodes_score, w: 1.0 },
    { s: medication_governance_score, w: 1.0 },
    { s: care_planning_score, w: 1.0 },
    { s: child_voice_score, w: 1.0 },
    { s: complaint_management_score, w: 1.0 },
    { s: building_safety_score, w: 1.0 },
    { s: recruitment_compliance_score, w: 1.0 },
    { s: oversight_quality_score, w: 1.5 },
    { s: outcome_evidence_score, w: 1.0 },
    { s: challenge_log_score, w: 1.0 },
  ];
  const tw = weighted.reduce((s, e) => s + e.w, 0);
  const overall_governance_score = clamp(
    weighted.reduce((s, e) => s + e.s * e.w, 0) / tw,
    0, 100
  );

  return {
    overall_governance_score,
    safeguarding_oversight_score,
    incident_management_score,
    missing_episodes_score,
    reg45_compliance_score,
    staff_supervision_score,
    training_compliance_score,
    medication_governance_score,
    care_planning_score,
    child_voice_score,
    complaint_management_score,
    building_safety_score,
    recruitment_compliance_score,
    oversight_quality_score,
    outcome_evidence_score,
    challenge_log_score,
  };
}
