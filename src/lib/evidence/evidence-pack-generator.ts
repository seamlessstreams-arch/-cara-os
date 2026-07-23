// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE PACK GENERATOR
// Pure deterministic engine that compiles a comprehensive evidence pack
// from all store data for Ofsted inspection preparation.
// No LLM calls, no DB access. Uses getStore() pattern.
// CHR 2015 (all regulations). SCCIF: All three judgment areas.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  EvidenceSection,
  EvidenceItem,
  InspectionEvidencePack,
} from "./types";
import type { SopRealityCheck } from "@/lib/sop-reality-check/sop-reality-check-engine";
import type { OrgRiskDashboard } from "@/lib/org-risk/org-risk-engine";
import { rate, meanOf, formatRate } from "@/lib/metrics/rate";

// ── Input type ─────────────────────────────────────────────────────────────

export interface EvidencePackInput {
  today: string;
  home_id: string;
  home_name: string;
  period_from: string;
  period_to: string;
  generated_by: string;

  // Core collections — mirrors store shape
  youngPeople: any[];
  staff: any[];
  careForms: any[];
  riskAssessments: any[];
  incidents: any[];
  missingEpisodes: any[];
  exploitationScreenings: any[];
  keyWorkingSessions: any[];
  keyworkerSessions: any[];
  educationRecords: any[];
  healthAssessments: any[];
  dentalRecords: any[];
  mentalHealthCheckIns: any[];
  annualHealthAssessments: any[];
  familyTimeSessions: any[];
  contactPlans: any[];
  multiAgencyMeetings: any[];
  lacReviews: any[];
  supervisions: any[];
  audits: any[];
  qaAuditRecords: any[];
  caseFileAudits: any[];
  tasks: any[];
  dailyLog: any[];
  behaviourLog: any[];
  restraints: any[];
  significantEvents: any[];
  notifiableEvents: any[];
  outcomeTargets: any[];
  outcomeReviews: any[];
  trainingRecords: any[];
  medications: any[];
  medicationAdministrations: any[];
  independenceSkillsRecords: any[];
  disclosures: any[];
  safeguardingReferrals: any[];
  complaintOutcomeRecords: any[];
  chronology: any[];
  handovers: any[];
  therapeuticChildImpact: any[];
  ypFeedback: any[];
  advocacyRecords: any[];
  participationEntries: any[];
  improvementObjectives: any[];
  lessonsLearned: any[];

  // 23/06 Practice Intelligence Update — record-based module evidence
  restrictionReviews: any[];
  postIncidentReflections: any[];
  stayingSafePlans: any[];
  relationshipEntries: any[];

  // Whole-home assurance — pre-computed by the route (each engine reads a wide
  // slice of the store) so the generator stays a pure mapping. Optional so every
  // existing caller/test keeps working (the section reports "not assessed").
  sopRealityCheck?: SopRealityCheck | null;
  orgRisk?: OrgRiskDashboard | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function isInPeriod(date: string | null | undefined, from: string, to: string): boolean {
  if (!date) return false;
  const d = date.slice(0, 10);
  return d >= from && d <= to;
}

function scoreToRating(
  score: number,
): "outstanding" | "good" | "adequate" | "inadequate" | "not_assessed" {
  if (score >= 85) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

/** An unscored section is "not assessed" — never a grade, in either direction. */
function ratingFor(
  score: number | null | undefined,
): "outstanding" | "good" | "adequate" | "inadequate" | "not_assessed" {
  return typeof score === "number" ? scoreToRating(score) : "not_assessed";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function childNameFrom(youngPeople: any[], id: string | undefined): string {
  if (!id) return "Child";
  const c = youngPeople.find((yp: any) => yp.id === id);
  return c ? (c.name ?? c.first_name ?? "Child") : "Child";
}

function hasText(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

// ── Core Compute ───────────────────────────────────────────────────────────

export function computeInspectionEvidencePack(
  input: EvidencePackInput,
): InspectionEvidencePack {
  const children = input.youngPeople.filter(
    (yp: any) => yp.status === "current",
  );
  const activeStaff = input.staff.filter((s: any) => s.is_active);

  const sections: EvidenceSection[] = [
    buildChildOverview(input, children),
    buildPlacementHistory(input, children),
    buildCarePlanProgress(input, children),
    buildRiskManagement(input, children),
    buildSafeguardingActions(input, children),
    buildDirectWorkSummary(input, children),
    buildIncidentsAndResponses(input, children),
    buildEducationNotes(input, children),
    buildHealthNotes(input, children),
    buildFamilyContact(input, children),
    buildProfessionalContact(input, children),
    buildManagementOversight(input, activeStaff),
    buildAuditTrail(input, children),
    buildOutstandingActions(input),
    buildEvidenceOfProgress(input, children),
    // 23/06 Practice Intelligence Update — record-based module evidence
    buildRightsAndRestrictionEvidence(input, children),
    buildLearningFromIncidents(input, children),
    buildChildSafetyPlanning(input, children),
    buildProtectiveRelationshipsEvidence(input, children),
    buildSopAndOrganisationalAssurance(input),
  ];

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  // Unassessed sections are excluded from the headline rather than scored as zero.
  const overallScore = meanOf(sections.map((s) => s.score));

  const strengths = identifyStrengths(sections);
  const areasForImprovement = identifyAreasForImprovement(sections);
  const outstandingActions = collectOutstandingActions(input);

  return {
    generated_at: input.today,
    generated_by: input.generated_by,
    home_id: input.home_id,
    home_name: input.home_name,
    period_from: input.period_from,
    period_to: input.period_to,
    overall_rating: ratingFor(overallScore),
    overall_score: overallScore,
    sections,
    strengths,
    areas_for_improvement: areasForImprovement,
    outstanding_actions: outstandingActions,
    total_evidence_items: totalItems,
    children_count: children.length,
    staff_count: activeStaff.length,
  };
}

// ── Section 1: Child Overview ──────────────────────────────────────────────

function buildChildOverview(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = children.map((c: any) => ({
    id: `ev_child_${c.id}`,
    type: "child_profile",
    title: `Profile: ${c.name ?? c.first_name ?? "Child"} ${c.surname ?? c.last_name ?? ""}`.trim(),
    date: c.date_of_placement ?? c.created_at ?? input.today,
    summary: `Age ${c.age ?? "unknown"}, placed since ${c.date_of_placement?.slice(0, 10) ?? "unknown"}. Status: ${c.status ?? "current"}.`,
    linked_record_type: "young_person",
    linked_record_id: c.id,
    child_id: c.id,
    tags: ["demographics", "placement"],
  }));

  const score =
    children.length > 0 ? clamp(70 + children.length * 5, 0, 100) : undefined;

  return {
    id: "child_overview",
    title: "Child Overview",
    description:
      "Profiles, placements, and demographics for all current children in placement.",
    ofsted_reference: "CHR 2015 Reg 5 — Engaging with the wider system",
    data_sources: ["youngPeople"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      children.length > 0
        ? `${children.length} children currently in placement. All profiles documented.`
        : "No children currently in placement — nothing to evidence in this section.",
  };
}

// ── Section 2: Placement History ───────────────────────────────────────────

function buildPlacementHistory(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = children.map((c: any) => {
    const placedDate = c.date_of_placement?.slice(0, 10) ?? "";
    const daysPlaced = placedDate
      ? daysBetween(placedDate, input.today)
      : 0;
    return {
      id: `ev_placement_${c.id}`,
      type: "placement_record",
      title: `Placement: ${c.name ?? c.first_name ?? "Child"} — ${daysPlaced} days`,
      date: placedDate || input.today,
      summary: `Placed for ${daysPlaced} days. Placement stability maintained.`,
      linked_record_type: "young_person",
      linked_record_id: c.id,
      child_id: c.id,
      tags: ["placement", "stability"],
    };
  });

  const avgDays = meanOf(
    items.map((i) => {
      const match = i.summary.match(/(\d+) days/);
      return match ? parseInt(match[1]) : null;
    }),
  );

  const score =
    avgDays === null ? undefined : clamp(Math.round(60 + Math.min(avgDays / 10, 30)), 0, 100);

  return {
    id: "placement_history",
    title: "Placement History",
    description:
      "Placement stability data, matching quality, and continuity evidence.",
    ofsted_reference: "CHR 2015 Reg 11 — The duty of the registered person to prepare a placement plan",
    data_sources: ["youngPeople"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      avgDays === null
        ? "No active placements recorded — placement stability cannot be evidenced."
        : `${children.length} placements active. Average placement duration: ${avgDays} days.`,
  };
}

// ── Section 3: Care Plan Progress ──────────────────────────────────────────

function buildCarePlanProgress(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const periodForms = input.careForms.filter((f: any) =>
    isInPeriod(f.created_at ?? f.date, input.period_from, input.period_to),
  );

  const items: EvidenceItem[] = periodForms.slice(0, 50).map((f: any) => ({
    id: `ev_careplan_${f.id}`,
    type: "care_plan",
    title: f.title ?? f.description ?? "Care Plan Entry",
    date: f.created_at?.slice(0, 10) ?? f.date ?? input.today,
    summary: `${f.form_type ?? f.category ?? "care"} record. Status: ${f.status ?? "active"}.`,
    linked_record_type: "care_form",
    linked_record_id: f.id,
    child_id: f.linked_child_id ?? f.child_id,
    tags: ["care_plan", f.form_type ?? "general"],
  }));

  const childrenWithPlan = children.filter((c: any) =>
    input.careForms.some(
      (f: any) =>
        (f.linked_child_id === c.id || f.child_id === c.id) &&
        (f.status === "active" || f.status === "approved"),
    ),
  ).length;

  const coverage = rate(childrenWithPlan, children.length);
  const score = coverage === null ? undefined : clamp(coverage, 0, 100);

  return {
    id: "care_plan_progress",
    title: "Care Plan Progress",
    description:
      "Care plans, goals, reviews, and outcomes tracking for all children.",
    ofsted_reference: "CHR 2015 Reg 14 — Placement plan and target review",
    data_sources: ["careForms", "outcomeTargets", "outcomeReviews"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      coverage === null
        ? `No children in placement to plan for. ${periodForms.length} care records in period.`
        : `${childrenWithPlan}/${children.length} children have current care plans. ${periodForms.length} care records in period.`,
  };
}

// ── Section 4: Risk Management ─────────────────────────────────────────────

function buildRiskManagement(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const periodRAs = input.riskAssessments.filter((r: any) =>
    isInPeriod(
      r.created_at ?? r.date ?? r.assessment_date,
      input.period_from,
      input.period_to,
    ),
  );

  const items: EvidenceItem[] = periodRAs.slice(0, 50).map((r: any) => ({
    id: `ev_risk_${r.id}`,
    type: "risk_assessment",
    title: r.title ?? r.risk_type ?? "Risk Assessment",
    date:
      r.created_at?.slice(0, 10) ??
      r.date ??
      r.assessment_date ??
      input.today,
    summary: `Risk level: ${r.risk_level ?? r.current_risk ?? "unknown"}. Status: ${r.status ?? "current"}.`,
    linked_record_type: "risk_assessment",
    linked_record_id: r.id,
    child_id: r.child_id,
    risk_level: r.risk_level ?? r.current_risk,
    tags: ["risk", r.risk_level ?? "unspecified"],
  }));

  const childrenWithRA = children.filter((c: any) =>
    input.riskAssessments.some(
      (r: any) => r.child_id === c.id && r.status === "current",
    ),
  ).length;

  const coverage = rate(childrenWithRA, children.length);
  const overdueCount = input.riskAssessments.filter((r: any) => {
    const reviewDate = r.review_date ?? r.next_review;
    return reviewDate && reviewDate < input.today && r.status === "current";
  }).length;

  const score = coverage === null ? undefined : clamp(coverage - overdueCount * 5, 0, 100);

  return {
    id: "risk_management",
    title: "Risk Management",
    description:
      "Risk assessments, controls, review timeliness, and mitigation evidence.",
    ofsted_reference: "CHR 2015 Reg 12 — The protection of children standard",
    data_sources: ["riskAssessments"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      coverage === null
        ? `No children in placement to risk assess. ${overdueCount} overdue reviews. ${periodRAs.length} assessments in period.`
        : `${childrenWithRA}/${children.length} children have current risk assessments. ${overdueCount} overdue reviews. ${periodRAs.length} assessments in period.`,
  };
}

// ── Section 5: Safeguarding Actions ────────────────────────────────────────

function buildSafeguardingActions(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = [];

  // Exploitation screenings
  const periodScreenings = input.exploitationScreenings.filter((e: any) =>
    isInPeriod(e.date ?? e.created_at, input.period_from, input.period_to),
  );
  periodScreenings.forEach((e: any) => {
    items.push({
      id: `ev_safeguarding_es_${e.id}`,
      type: "exploitation_screening",
      title: `${(e.exploitation_type ?? "").toUpperCase()} Screening — ${e.risk_level ?? "unknown"} risk`,
      date: e.date?.slice(0, 10) ?? e.created_at?.slice(0, 10) ?? input.today,
      summary: `${e.exploitation_type} screening. Risk: ${e.risk_level}. Status: ${e.status}.`,
      linked_record_type: "exploitation_screening",
      linked_record_id: e.id,
      child_id: e.child_id,
      risk_level: e.risk_level,
      tags: ["safeguarding", e.exploitation_type ?? "screening"],
    });
  });

  // Missing episodes
  const periodMissing = input.missingEpisodes.filter((m: any) =>
    isInPeriod(
      m.date_missing ?? m.date ?? m.created_at,
      input.period_from,
      input.period_to,
    ),
  );
  periodMissing.forEach((m: any) => {
    items.push({
      id: `ev_safeguarding_missing_${m.id}`,
      type: "missing_episode",
      title: `Missing Episode — ${m.status ?? "unknown"}`,
      date:
        m.date_missing?.slice(0, 10) ??
        m.date ??
        m.created_at?.slice(0, 10) ??
        input.today,
      summary: `Missing episode. Return interview: ${m.return_interview_completed ? "completed" : "pending"}.`,
      linked_record_type: "missing_episode",
      linked_record_id: m.id,
      child_id: m.child_id,
      risk_level: "high",
      tags: ["safeguarding", "missing"],
    });
  });

  // Disclosures
  const periodDisclosures = (input.disclosures ?? []).filter((d: any) =>
    isInPeriod(d.date ?? d.created_at, input.period_from, input.period_to),
  );
  periodDisclosures.forEach((d: any) => {
    items.push({
      id: `ev_safeguarding_disc_${d.id}`,
      type: "disclosure",
      title: `Disclosure — ${d.category ?? d.type ?? "general"}`,
      date: d.date?.slice(0, 10) ?? d.created_at?.slice(0, 10) ?? input.today,
      summary: `Safeguarding disclosure recorded. Referred: ${d.referred ? "yes" : "pending review"}.`,
      linked_record_type: "disclosure",
      linked_record_id: d.id,
      child_id: d.child_id,
      risk_level: d.risk_level ?? "high",
      tags: ["safeguarding", "disclosure"],
    });
  });

  const highRiskScreenings = periodScreenings.filter(
    (e: any) => e.risk_level === "high" || e.risk_level === "critical",
  ).length;
  const returnInterviewsDone = periodMissing.filter(
    (m: any) => m.return_interview_completed,
  ).length;
  // No missing episodes means no return interviews were due — there is nothing to
  // rate, and an empty register must not present as full safeguarding assurance.
  const riRate = rate(returnInterviewsDone, periodMissing.length);

  const score =
    riRate === null
      ? undefined
      : clamp(riRate - highRiskScreenings * 3 - periodMissing.length * 2, 0, 100);

  return {
    id: "safeguarding_actions",
    title: "Safeguarding Actions",
    description:
      "Safeguarding concerns, exploitation screenings, missing episodes, referrals, and response times.",
    ofsted_reference: "CHR 2015 Reg 12 — The protection of children standard",
    data_sources: [
      "exploitationScreenings",
      "missingEpisodes",
      "disclosures",
    ],
    items,
    score,
    rating: ratingFor(score),
    summary: `${periodScreenings.length} exploitation screenings, ${periodMissing.length} missing episodes, ${periodDisclosures.length} disclosures in period. Return interview completion: ${
      riRate === null ? "no missing episodes recorded" : formatRate(riRate)
    }.`,
  };
}

// ── Section 6: Direct Work Summary ─────────────────────────────────────────

function buildDirectWorkSummary(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const allSessions = [
    ...input.keyWorkingSessions,
    ...input.keyworkerSessions,
  ];
  const periodSessions = allSessions.filter((s: any) =>
    isInPeriod(s.date ?? s.created_at, input.period_from, input.period_to),
  );

  const items: EvidenceItem[] = periodSessions.slice(0, 50).map((s: any) => ({
    id: `ev_directwork_${s.id}`,
    type: "direct_work_session",
    title: s.title ?? s.focus ?? s.type ?? "Key Work Session",
    date: s.date?.slice(0, 10) ?? s.created_at?.slice(0, 10) ?? input.today,
    summary: `${s.type ?? "key_work"} session. Duration: ${s.duration ?? "unrecorded"} mins.`,
    linked_record_type: "key_working_session",
    linked_record_id: s.id,
    child_id: s.child_id,
    staff_id: s.staff_id,
    tags: ["direct_work", s.type ?? "key_work"],
  }));

  const childrenWithSessions = new Set(
    periodSessions.map((s: any) => s.child_id),
  ).size;
  const coverage = rate(childrenWithSessions, children.length);

  const score = coverage === null ? undefined : clamp(coverage, 0, 100);

  return {
    id: "direct_work_summary",
    title: "Direct Work Summary",
    description:
      "Key working sessions, therapeutic interventions, and direct work with children.",
    ofsted_reference: "CHR 2015 Reg 13 — The leadership and management standard",
    data_sources: ["keyWorkingSessions", "keyworkerSessions"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      coverage === null
        ? `${periodSessions.length} direct work sessions in period. No children in placement to receive direct work.`
        : `${periodSessions.length} direct work sessions in period. ${childrenWithSessions}/${children.length} children received direct work.`,
  };
}

// ── Section 7: Incidents & Responses ───────────────────────────────────────

function buildIncidentsAndResponses(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const periodIncidents = input.incidents.filter((i: any) =>
    isInPeriod(
      i.date ?? i.incident_date ?? i.created_at,
      input.period_from,
      input.period_to,
    ),
  );

  const items: EvidenceItem[] = periodIncidents
    .slice(0, 50)
    .map((i: any) => ({
      id: `ev_incident_${i.id}`,
      type: "incident",
      title: i.title ?? i.description?.slice(0, 60) ?? "Incident",
      date:
        i.date?.slice(0, 10) ??
        i.incident_date?.slice(0, 10) ??
        i.created_at?.slice(0, 10) ??
        input.today,
      summary: `Severity: ${i.severity ?? "unknown"}. Status: ${i.status ?? "open"}. Type: ${i.type ?? i.category ?? "general"}.`,
      linked_record_type: "incident",
      linked_record_id: i.id,
      child_id: i.child_id ?? i.young_person_id,
      risk_level: i.severity,
      tags: ["incident", i.severity ?? "unspecified"],
    }));

  // Add restraint records
  const periodRestraints = input.restraints.filter((r: any) =>
    isInPeriod(r.date ?? r.created_at, input.period_from, input.period_to),
  );
  periodRestraints.forEach((r: any) => {
    items.push({
      id: `ev_restraint_${r.id}`,
      type: "restraint",
      title: `Physical Intervention — ${r.technique ?? "unspecified"}`,
      date: r.date?.slice(0, 10) ?? r.created_at?.slice(0, 10) ?? input.today,
      summary: `Duration: ${r.duration ?? "unrecorded"} mins. Debrief: ${r.debrief_completed ? "completed" : "pending"}.`,
      linked_record_type: "restraint",
      linked_record_id: r.id,
      child_id: r.child_id,
      risk_level: "high",
      tags: ["incident", "restraint"],
    });
  });

  const criticalCount = periodIncidents.filter(
    (i: any) => i.severity === "critical",
  ).length;
  const closedCount = periodIncidents.filter(
    (i: any) => i.status === "closed" || i.status === "resolved",
  ).length;
  // No incidents recorded is an empty register, not a 100% closure record.
  const closureRate = rate(closedCount, periodIncidents.length);

  const score =
    closureRate === null
      ? undefined
      : clamp(closureRate - criticalCount * 10 - periodRestraints.length * 3, 0, 100);

  return {
    id: "incidents_responses",
    title: "Incidents & Responses",
    description:
      "Incident records, physical interventions, lessons learned, and trend analysis.",
    ofsted_reference: "CHR 2015 Reg 12(2)(b) — Measures to manage behaviour",
    data_sources: ["incidents", "restraints", "significantEvents"],
    items,
    score,
    rating: ratingFor(score),
    summary: `${periodIncidents.length} incidents (${criticalCount} critical), ${periodRestraints.length} restraints in period. Closure rate: ${
      closureRate === null ? "no incidents recorded" : formatRate(closureRate)
    }.`,
  };
}

// ── Section 8: Education Notes ─────────────────────────────────────────────

function buildEducationNotes(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const periodEdu = input.educationRecords.filter((r: any) =>
    isInPeriod(r.date ?? r.created_at, input.period_from, input.period_to),
  );

  const items: EvidenceItem[] = periodEdu.slice(0, 50).map((r: any) => ({
    id: `ev_education_${r.id}`,
    type: "education_record",
    title: r.title ?? r.record_type ?? "Education Record",
    date: r.date?.slice(0, 10) ?? r.created_at?.slice(0, 10) ?? input.today,
    summary: `Type: ${r.record_type ?? "general"}. ${r.summary ?? r.notes ?? ""}`.slice(0, 200),
    linked_record_type: "education_record",
    linked_record_id: r.id,
    child_id: r.child_id,
    tags: ["education", r.record_type ?? "general"],
  }));

  const childrenWithEdu = new Set(
    input.educationRecords.map((r: any) => r.child_id),
  ).size;
  const pepRecords = input.educationRecords.filter(
    (r: any) => r.record_type === "pep",
  );
  const childrenWithPEP = new Set(pepRecords.map((r: any) => r.child_id)).size;
  const pepRate = rate(childrenWithPEP, children.length);

  const score =
    pepRate === null
      ? undefined
      : clamp(Math.round((pepRate + (childrenWithEdu > 0 ? 70 : 40)) / 2), 0, 100);

  return {
    id: "education_notes",
    title: "Education Notes",
    description:
      "PEPs, attendance records, achievement tracking, and educational support evidence.",
    ofsted_reference: "CHR 2015 Reg 8 — The education standard",
    data_sources: ["educationRecords"],
    items,
    score,
    rating: ratingFor(score),
    summary: `${periodEdu.length} education records in period. PEP coverage: ${
      pepRate === null ? "no children in placement" : formatRate(pepRate)
    }. ${childrenWithEdu}/${children.length} children with education records.`,
  };
}

// ── Section 9: Health Notes ────────────────────────────────────────────────

function buildHealthNotes(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = [];

  // Health assessments
  input.healthAssessments
    .filter((h: any) =>
      isInPeriod(h.date ?? h.created_at, input.period_from, input.period_to),
    )
    .forEach((h: any) => {
      items.push({
        id: `ev_health_ha_${h.id}`,
        type: "health_assessment",
        title: `Health Assessment — ${h.type ?? "general"}`,
        date: h.date?.slice(0, 10) ?? h.created_at?.slice(0, 10) ?? input.today,
        summary: `Health assessment completed. Outcome: ${h.outcome ?? "recorded"}.`,
        linked_record_type: "health_assessment",
        linked_record_id: h.id,
        child_id: h.child_id,
        tags: ["health", "assessment"],
      });
    });

  // Dental records
  input.dentalRecords
    .filter((d: any) =>
      isInPeriod(d.date ?? d.created_at, input.period_from, input.period_to),
    )
    .forEach((d: any) => {
      items.push({
        id: `ev_health_dental_${d.id}`,
        type: "dental_record",
        title: "Dental Appointment",
        date: d.date?.slice(0, 10) ?? d.created_at?.slice(0, 10) ?? input.today,
        summary: `Dental visit completed. Outcome: ${d.outcome ?? "attended"}.`,
        linked_record_type: "dental_record",
        linked_record_id: d.id,
        child_id: d.child_id,
        tags: ["health", "dental"],
      });
    });

  // Mental health check-ins
  input.mentalHealthCheckIns
    .filter((m: any) =>
      isInPeriod(m.date ?? m.created_at, input.period_from, input.period_to),
    )
    .forEach((m: any) => {
      items.push({
        id: `ev_health_mh_${m.id}`,
        type: "mental_health_check",
        title: "Mental Health Check-in",
        date: m.date?.slice(0, 10) ?? m.created_at?.slice(0, 10) ?? input.today,
        summary: `Mental health check-in. Mood: ${m.mood ?? m.score ?? "recorded"}.`,
        linked_record_type: "mental_health_check_in",
        linked_record_id: m.id,
        child_id: m.child_id,
        tags: ["health", "mental_health"],
      });
    });

  // Annual health assessments
  input.annualHealthAssessments
    .filter((a: any) =>
      isInPeriod(a.date ?? a.created_at, input.period_from, input.period_to),
    )
    .forEach((a: any) => {
      items.push({
        id: `ev_health_annual_${a.id}`,
        type: "annual_health_assessment",
        title: "Annual Health Assessment",
        date: a.date?.slice(0, 10) ?? a.created_at?.slice(0, 10) ?? input.today,
        summary: `Annual statutory health assessment. Status: ${a.status ?? "completed"}.`,
        linked_record_type: "annual_health_assessment",
        linked_record_id: a.id,
        child_id: a.child_id,
        tags: ["health", "statutory"],
      });
    });

  const childrenWithHealth = new Set(
    input.healthAssessments.map((h: any) => h.child_id),
  ).size;
  const coverage = rate(childrenWithHealth, children.length);

  const score = coverage === null ? undefined : clamp(coverage, 0, 100);

  return {
    id: "health_notes",
    title: "Health Notes",
    description:
      "Health assessments, GP visits, dental appointments, mental health check-ins, and annual health assessments.",
    ofsted_reference: "CHR 2015 Reg 10 — The health and well-being standard",
    data_sources: [
      "healthAssessments",
      "dentalRecords",
      "mentalHealthCheckIns",
      "annualHealthAssessments",
    ],
    items,
    score,
    rating: ratingFor(score),
    summary: `${items.length} health records in period. Health assessment coverage: ${
      coverage === null ? "no children in placement" : formatRate(coverage)
    }.`,
  };
}

// ── Section 10: Family Contact ─────────────────────────────────────────────

function buildFamilyContact(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const periodFamilyTime = input.familyTimeSessions.filter((f: any) =>
    isInPeriod(f.date ?? f.created_at, input.period_from, input.period_to),
  );

  const items: EvidenceItem[] = periodFamilyTime
    .slice(0, 50)
    .map((f: any) => ({
      id: `ev_family_${f.id}`,
      type: "family_contact",
      title: f.title ?? `Family Time — ${f.contact_type ?? "visit"}`,
      date: f.date?.slice(0, 10) ?? f.created_at?.slice(0, 10) ?? input.today,
      summary: `Contact type: ${f.contact_type ?? "visit"}. Quality: ${f.quality ?? "not assessed"}. Outcome: ${f.outcome ?? "completed"}.`,
      linked_record_type: "family_time_session",
      linked_record_id: f.id,
      child_id: f.child_id,
      tags: ["family", "contact", f.contact_type ?? "visit"],
    }));

  // Contact plans
  input.contactPlans
    .filter((cp: any) =>
      isInPeriod(cp.created_at, input.period_from, input.period_to),
    )
    .forEach((cp: any) => {
      items.push({
        id: `ev_family_plan_${cp.id}`,
        type: "contact_plan",
        title: `Contact Plan — ${cp.relationship ?? "family"}`,
        date: cp.created_at?.slice(0, 10) ?? input.today,
        summary: `Contact plan for ${cp.relationship ?? "family member"}. Frequency: ${cp.frequency ?? "as agreed"}.`,
        linked_record_type: "contact_plan",
        linked_record_id: cp.id,
        child_id: cp.child_id,
        tags: ["family", "contact_plan"],
      });
    });

  const childrenWithContact = new Set(
    periodFamilyTime.map((f: any) => f.child_id),
  ).size;
  const coverage = rate(childrenWithContact, children.length);

  const score = coverage === null ? undefined : clamp(coverage, 0, 100);

  return {
    id: "family_contact",
    title: "Family Contact",
    description:
      "Contact logs, family time sessions, quality assessments, and consistency of contact.",
    ofsted_reference: "CHR 2015 Reg 9 — The contact standard",
    data_sources: ["familyTimeSessions", "contactPlans"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      coverage === null
        ? `${periodFamilyTime.length} family contact sessions in period. No children in placement.`
        : `${periodFamilyTime.length} family contact sessions in period. ${childrenWithContact}/${children.length} children had family contact.`,
  };
}

// ── Section 11: Professional Contact ───────────────────────────────────────

function buildProfessionalContact(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = [];

  // Multi-agency meetings
  const periodMAM = input.multiAgencyMeetings.filter((m: any) =>
    isInPeriod(m.date ?? m.created_at, input.period_from, input.period_to),
  );
  periodMAM.forEach((m: any) => {
    items.push({
      id: `ev_professional_mam_${m.id}`,
      type: "multi_agency_meeting",
      title: `${(m.meeting_type ?? "meeting").replace(/_/g, " ")} — ${m.chaired_by ?? "unrecorded"}`,
      date: m.date?.slice(0, 10) ?? m.created_at?.slice(0, 10) ?? input.today,
      summary: `Multi-agency ${m.meeting_type ?? "meeting"}. Status: ${m.meeting_status ?? "completed"}. Attendees: ${m.attendees?.length ?? 0}.`,
      linked_record_type: "multi_agency_meeting",
      linked_record_id: m.id,
      child_id: m.child_id,
      tags: ["professional", m.meeting_type ?? "meeting"],
    });
  });

  // LAC reviews
  const periodLAC = input.lacReviews.filter((r: any) =>
    isInPeriod(
      r.review_date ?? r.date ?? r.created_at,
      input.period_from,
      input.period_to,
    ),
  );
  periodLAC.forEach((r: any) => {
    items.push({
      id: `ev_professional_lac_${r.id}`,
      type: "lac_review",
      title: `LAC Review — ${r.child_id ?? ""}`,
      date:
        r.review_date?.slice(0, 10) ??
        r.date?.slice(0, 10) ??
        r.created_at?.slice(0, 10) ??
        input.today,
      summary: `LAC review. Outcome: ${r.outcome ?? "recorded"}.`,
      linked_record_type: "lac_review",
      linked_record_id: r.id,
      child_id: r.child_id,
      tags: ["professional", "lac_review", "statutory"],
    });
  });

  // With no meetings or reviews on record there is nothing to score — a baseline
  // "good" for an empty multi-agency register is assurance the home has not earned.
  const score =
    periodMAM.length > 0 || periodLAC.length > 0
      ? clamp(60 + periodMAM.length * 5 + periodLAC.length * 10, 0, 100)
      : undefined;

  return {
    id: "professional_contact",
    title: "Professional Contact",
    description:
      "Multi-agency working, LAC reviews, professional meetings, and inter-agency collaboration.",
    ofsted_reference: "CHR 2015 Reg 5 — Engaging with the wider system",
    data_sources: ["multiAgencyMeetings", "lacReviews"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      score === undefined
        ? "No multi-agency meetings or LAC reviews recorded in this period."
        : `${periodMAM.length} multi-agency meetings and ${periodLAC.length} LAC reviews in period.`,
  };
}

// ── Section 12: Management Oversight ───────────────────────────────────────

function buildManagementOversight(
  input: EvidencePackInput,
  activeStaff: any[],
): EvidenceSection {
  const items: EvidenceItem[] = [];

  // Supervisions
  const periodSupervisions = input.supervisions.filter((s: any) =>
    isInPeriod(
      s.actual_date ?? s.scheduled_date ?? s.created_at,
      input.period_from,
      input.period_to,
    ),
  );
  periodSupervisions.forEach((s: any) => {
    items.push({
      id: `ev_oversight_sup_${s.id}`,
      type: "supervision",
      title: `Supervision — ${s.supervisee_name ?? s.staff_id ?? "staff"}`,
      date:
        s.actual_date?.slice(0, 10) ??
        s.scheduled_date?.slice(0, 10) ??
        s.created_at?.slice(0, 10) ??
        input.today,
      summary: `Supervision session. Status: ${s.status ?? "completed"}. Type: ${s.type ?? "1:1"}.`,
      linked_record_type: "supervision",
      linked_record_id: s.id,
      staff_id: s.staff_id,
      tags: ["management", "supervision"],
    });
  });

  // QA Audits
  const periodAudits = input.qaAuditRecords.filter((a: any) =>
    isInPeriod(a.date ?? a.created_at, input.period_from, input.period_to),
  );
  periodAudits.forEach((a: any) => {
    items.push({
      id: `ev_oversight_qa_${a.id}`,
      type: "qa_audit",
      title: `QA Audit — ${a.audit_type ?? a.area ?? "general"}`,
      date: a.date?.slice(0, 10) ?? a.created_at?.slice(0, 10) ?? input.today,
      summary: `Quality assurance audit. Score: ${a.score ?? "N/A"}. Outcome: ${a.outcome ?? "recorded"}.`,
      linked_record_type: "qa_audit",
      linked_record_id: a.id,
      tags: ["management", "audit", "quality_assurance"],
    });
  });

  // Training records
  const periodTraining = input.trainingRecords.filter((t: any) =>
    isInPeriod(t.date ?? t.created_at, input.period_from, input.period_to),
  );
  periodTraining.slice(0, 20).forEach((t: any) => {
    items.push({
      id: `ev_oversight_training_${t.id}`,
      type: "training",
      title: `Training — ${t.name ?? t.course ?? "course"}`,
      date: t.date?.slice(0, 10) ?? t.created_at?.slice(0, 10) ?? input.today,
      summary: `Training record. Status: ${t.status ?? "completed"}.`,
      linked_record_type: "training_record",
      linked_record_id: t.id,
      staff_id: t.staff_id,
      tags: ["management", "training"],
    });
  });

  const supRate = rate(
    new Set(periodSupervisions.map((s: any) => s.staff_id)).size,
    activeStaff.length,
  );

  const score =
    supRate === null
      ? undefined
      : clamp(Math.round((supRate + (periodAudits.length > 0 ? 80 : 50)) / 2), 0, 100);

  return {
    id: "management_oversight",
    title: "Management Oversight",
    description:
      "Supervisions, audits, quality assurance, training records, and management governance.",
    ofsted_reference: "CHR 2015 Reg 13 — The leadership and management standard",
    data_sources: ["supervisions", "qaAuditRecords", "trainingRecords"],
    items,
    score,
    rating: ratingFor(score),
    summary: `${periodSupervisions.length} supervisions, ${periodAudits.length} audits, ${periodTraining.length} training records in period. Supervision coverage: ${
      supRate === null ? "no active staff on record" : formatRate(supRate)
    }.`,
  };
}

// ── Section 13: Audit Trail ────────────────────────────────────────────────

function buildAuditTrail(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = [];

  // Case file audits
  const periodCFA = input.caseFileAudits.filter((a: any) =>
    isInPeriod(a.date ?? a.created_at, input.period_from, input.period_to),
  );
  periodCFA.forEach((a: any) => {
    items.push({
      id: `ev_audit_cfa_${a.id}`,
      type: "case_file_audit",
      title: `Case File Audit — ${a.child_name ?? a.child_id ?? "unknown"}`,
      date: a.date?.slice(0, 10) ?? a.created_at?.slice(0, 10) ?? input.today,
      summary: `Case file audit. Grade: ${a.grade ?? a.outcome ?? "recorded"}. Score: ${a.score ?? "N/A"}.`,
      linked_record_type: "case_file_audit",
      linked_record_id: a.id,
      child_id: a.child_id,
      tags: ["audit", "case_file"],
    });
  });

  // Daily log entries (sample for record keeping quality)
  const periodLogs = input.dailyLog.filter((l: any) =>
    isInPeriod(l.date ?? l.created_at, input.period_from, input.period_to),
  );

  // Chronology entries
  const periodChronology = input.chronology.filter((c: any) =>
    isInPeriod(c.date ?? c.created_at, input.period_from, input.period_to),
  );

  const logDensity =
    children.length > 0 ? Math.round(periodLogs.length / children.length) : null;

  // Nothing audited and nothing logged is an absent audit trail, not a baseline pass.
  const hasRecordKeepingEvidence =
    periodCFA.length > 0 || periodLogs.length > 0 || periodChronology.length > 0;
  const score = hasRecordKeepingEvidence
    ? clamp(
        50 +
          periodCFA.length * 10 +
          (logDensity === null ? 0 : Math.min(logDensity, 20)),
        0,
        100,
      )
    : undefined;

  return {
    id: "audit_trail",
    title: "Audit Trail",
    description:
      "Record keeping quality, timeliness of entries, and documentation standards.",
    ofsted_reference:
      "CHR 2015 Reg 36 — Record keeping and notification requirements",
    data_sources: ["caseFileAudits", "dailyLog", "chronology"],
    items,
    score,
    rating: ratingFor(score),
    summary: `${periodCFA.length} case file audits, ${periodLogs.length} daily log entries, ${periodChronology.length} chronology entries in period. Log density: ${
      logDensity === null ? "not measurable — no children in placement" : `${logDensity} entries per child`
    }.`,
  };
}

// ── Section 14: Outstanding Actions ────────────────────────────────────────

function buildOutstandingActions(
  input: EvidencePackInput,
): EvidenceSection {
  const overdueTasks = input.tasks.filter((t: any) => {
    const isOpen =
      t.status !== "completed" &&
      t.status !== "closed" &&
      t.status !== "cancelled";
    const isOverdue = t.due_date && t.due_date < input.today;
    return isOpen && isOverdue;
  });

  const pendingTasks = input.tasks.filter((t: any) => {
    const isOpen =
      t.status !== "completed" &&
      t.status !== "closed" &&
      t.status !== "cancelled";
    return isOpen;
  });

  const items: EvidenceItem[] = overdueTasks.slice(0, 50).map((t: any) => ({
    id: `ev_outstanding_${t.id}`,
    type: "overdue_task",
    title: t.title ?? t.description?.slice(0, 60) ?? "Overdue Task",
    date: t.due_date?.slice(0, 10) ?? input.today,
    summary: `Overdue by ${daysBetween(t.due_date?.slice(0, 10) ?? input.today, input.today)} days. Priority: ${t.priority ?? "normal"}. Assigned: ${t.assigned_to ?? "unassigned"}.`,
    linked_record_type: "task",
    linked_record_id: t.id,
    child_id: t.child_id,
    staff_id: t.assigned_to,
    risk_level:
      t.priority === "urgent" || t.priority === "critical"
        ? "high"
        : "medium",
    tags: ["outstanding", "overdue", t.priority ?? "normal"],
  }));

  // An empty task register is not the same as nothing being overdue.
  const score =
    input.tasks.length > 0 ? clamp(100 - overdueTasks.length * 5, 0, 100) : undefined;

  return {
    id: "outstanding_actions",
    title: "Outstanding Actions",
    description:
      "Overdue tasks, pending reviews, outstanding assessments, and open actions.",
    ofsted_reference: "CHR 2015 Reg 13 — Monitoring",
    data_sources: ["tasks"],
    items,
    score,
    rating: ratingFor(score),
    summary:
      input.tasks.length === 0
        ? "No tasks recorded — action tracking cannot be evidenced for this period."
        : `${overdueTasks.length} overdue tasks, ${pendingTasks.length} total open tasks. Action completion needs attention.`,
  };
}

// ── Section 15: Evidence of Progress ───────────────────────────────────────

function buildEvidenceOfProgress(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const items: EvidenceItem[] = [];

  // Outcome targets & reviews
  input.outcomeTargets
    .filter((o: any) =>
      isInPeriod(o.created_at ?? o.date, input.period_from, input.period_to),
    )
    .forEach((o: any) => {
      items.push({
        id: `ev_progress_target_${o.id}`,
        type: "outcome_target",
        title: `Outcome Target — ${o.target ?? o.description?.slice(0, 50) ?? "target"}`,
        date: o.created_at?.slice(0, 10) ?? o.date ?? input.today,
        summary: `Outcome target. Status: ${o.status ?? "active"}. Progress: ${o.progress ?? "ongoing"}.`,
        linked_record_type: "outcome_target",
        linked_record_id: o.id,
        child_id: o.child_id,
        tags: ["progress", "outcome"],
      });
    });

  // Therapeutic impact
  input.therapeuticChildImpact
    .filter((t: any) =>
      isInPeriod(t.date ?? t.created_at, input.period_from, input.period_to),
    )
    .forEach((t: any) => {
      items.push({
        id: `ev_progress_therapeutic_${t.id}`,
        type: "therapeutic_impact",
        title: `Therapeutic Impact — ${t.area ?? "general"}`,
        date: t.date?.slice(0, 10) ?? t.created_at?.slice(0, 10) ?? input.today,
        summary: `Therapeutic impact recorded. Change: ${t.change ?? t.impact ?? "noted"}.`,
        linked_record_type: "therapeutic_child_impact",
        linked_record_id: t.id,
        child_id: t.child_id,
        tags: ["progress", "therapeutic"],
      });
    });

  // Independence skills
  input.independenceSkillsRecords
    .filter((r: any) =>
      isInPeriod(
        r.review_date ?? r.created_at,
        input.period_from,
        input.period_to,
      ),
    )
    .forEach((r: any) => {
      items.push({
        id: `ev_progress_independence_${r.id}`,
        type: "independence_skills",
        title: `Independence Skills — Readiness ${r.overall_readiness ?? 0}%`,
        date:
          r.review_date?.slice(0, 10) ??
          r.created_at?.slice(0, 10) ??
          input.today,
        summary: `Independence readiness: ${r.overall_readiness ?? 0}%. Skills assessed: ${r.skills?.length ?? 0}.`,
        linked_record_type: "independence_skills_record",
        linked_record_id: r.id,
        child_id: r.child_id,
        tags: ["progress", "independence"],
      });
    });

  // YP Feedback
  input.ypFeedback
    .filter((f: any) =>
      isInPeriod(f.date ?? f.created_at, input.period_from, input.period_to),
    )
    .forEach((f: any) => {
      items.push({
        id: `ev_progress_feedback_${f.id}`,
        type: "yp_feedback",
        title: "Young Person Feedback",
        date: f.date?.slice(0, 10) ?? f.created_at?.slice(0, 10) ?? input.today,
        summary: `Feedback from young person. Sentiment: ${f.sentiment ?? f.rating ?? "recorded"}.`,
        linked_record_type: "yp_feedback",
        linked_record_id: f.id,
        child_id: f.child_id,
        tags: ["progress", "voice_of_child"],
      });
    });

  // Advocacy records
  input.advocacyRecords
    .filter((a: any) =>
      isInPeriod(a.created_at, input.period_from, input.period_to),
    )
    .forEach((a: any) => {
      items.push({
        id: `ev_progress_advocacy_${a.id}`,
        type: "advocacy",
        title: `Advocacy — ${a.advocacy_type ?? "independent"}`,
        date: a.created_at?.slice(0, 10) ?? input.today,
        summary: `Advocacy type: ${a.advocacy_type}. Provider: ${a.provider ?? "unknown"}. Status: ${a.status}.`,
        linked_record_type: "advocacy_record",
        linked_record_id: a.id,
        child_id: a.child_id,
        tags: ["progress", "advocacy", "voice_of_child"],
      });
    });

  const avgReadiness = meanOf(
    input.independenceSkillsRecords.map((r: any) =>
      typeof r.overall_readiness === "number" ? r.overall_readiness : null,
    ),
  );

  const score =
    items.length > 0
      ? clamp(
          50 +
            items.length * 3 +
            (avgReadiness === null ? 0 : Math.round(avgReadiness / 5)),
          0,
          100,
        )
      : undefined;

  return {
    id: "evidence_of_progress",
    title: "Evidence of Progress",
    description:
      "Child impact, outcomes improvement, independence skills, therapeutic progress, and voice of the child.",
    ofsted_reference:
      "CHR 2015 Reg 6 — The quality and purpose of care standard",
    data_sources: [
      "outcomeTargets",
      "therapeuticChildImpact",
      "independenceSkillsRecords",
      "ypFeedback",
      "advocacyRecords",
    ],
    items,
    score,
    rating: ratingFor(score),
    summary:
      items.length === 0
        ? "No progress evidence recorded in this period."
        : `${items.length} progress evidence items. Average independence readiness: ${
            avgReadiness === null ? "not assessed" : formatRate(avgReadiness)
          }.`,
  };
}

// ── Strengths & Areas for Improvement ──────────────────────────────────────

// ── Section 16: Rights, Liberty & Least-Restrictive Practice ───────────────

function buildRightsAndRestrictionEvidence(
  input: EvidencePackInput,
  _children: any[],
): EvidenceSection {
  const reviews = (input.restrictionReviews ?? []).filter((r: any) =>
    isInPeriod(r.review_date ?? r.created_at, input.period_from, input.period_to),
  );

  const items: EvidenceItem[] = reviews.slice(0, 50).map((r: any) => {
    const childVoice = hasText(r.child_wishes_feelings);
    const leastRestrictive = hasText(r.least_restrictive_alternatives);
    return {
      id: `ev_restriction_${r.id}`,
      type: "restriction_review",
      title: `Restriction review — ${childNameFrom(input.youngPeople, r.child_id)}: ${
        r.restriction_description?.slice(0, 60) ?? r.restriction_kind ?? "restriction"
      }`,
      date: (r.review_date ?? r.created_at ?? input.today).slice(0, 10),
      summary: `${r.restriction_kind ?? "restriction"}. Child's wishes & feelings recorded: ${
        childVoice ? "yes" : "no"
      }. Least-restrictive alternatives considered: ${
        leastRestrictive ? "yes" : "no"
      }. Decision: ${r.manager_decision ?? "pending"}.`,
      linked_record_type: "restriction_review",
      linked_record_id: r.id,
      child_id: r.child_id,
      tags: ["rights", "restriction", r.restriction_kind ?? "restriction"],
    };
  });

  // Quality, not volume: how defensible are the reviews that exist (child voice
  // + least-restrictive reasoning + proportionality + a forward review date).
  let score: number | undefined;
  if (reviews.length > 0) {
    const quality =
      reviews.reduce((sum: number, r: any) => {
        const parts = [
          hasText(r.child_wishes_feelings),
          hasText(r.least_restrictive_alternatives),
          hasText(r.best_interests_reasoning) || hasText(r.proportionality_reasoning),
          !!r.next_review_date,
        ];
        return sum + parts.filter(Boolean).length / parts.length;
      }, 0) / reviews.length;
    score = Math.round(quality * 100);
  }

  const withVoice = reviews.filter((r: any) => hasText(r.child_wishes_feelings)).length;

  return {
    id: "rights_and_restriction",
    title: "Rights, Liberty & Least-Restrictive Practice",
    description:
      "Recorded reviews of any restriction on a child's liberty — the child's wishes, the least-restrictive alternatives considered, proportionality, and manager oversight.",
    ofsted_reference:
      "CHR 2015 Reg 11 & 12 — positive relationships and the protection of children; least-restrictive practice / deprivation of liberty",
    data_sources: ["restrictionReviews"],
    items,
    score,
    rating: score === undefined ? "not_assessed" : scoreToRating(score),
    summary:
      reviews.length === 0
        ? "No restriction reviews recorded in this period."
        : `${reviews.length} restriction review(s) recorded; ${withVoice} include the child's recorded wishes and feelings.`,
  };
}

// ── Section 17: Learning from Incidents (Post-Incident Reflection) ─────────

function buildLearningFromIncidents(
  input: EvidencePackInput,
  _children: any[],
): EvidenceSection {
  const reflections = (input.postIncidentReflections ?? []).filter((r: any) =>
    isInPeriod(r.incident_date ?? r.created_at, input.period_from, input.period_to),
  );

  const stageDone = (s: any) =>
    s?.status === "completed" || s?.status === "signed_off";

  const items: EvidenceItem[] = reflections.slice(0, 50).map((r: any) => {
    const stages = Array.isArray(r.stages) ? r.stages : [];
    const done = stages.filter(stageDone).length;
    const total = stages.length || 10;
    return {
      id: `ev_reflection_${r.id}`,
      type: "post_incident_reflection",
      title: `Post-incident reflection — ${childNameFrom(input.youngPeople, r.child_id)}`,
      date: (r.incident_date ?? r.created_at ?? input.today).slice(0, 10),
      summary: `Learning workflow ${done}/${total} stages complete. Status: ${
        r.status ?? "open"
      }. Linked to incident ${r.incident_id ?? "—"}.`,
      linked_record_type: "post_incident_reflection",
      linked_record_id: r.id,
      child_id: r.child_id,
      risk_level: typeof r.severity === "string" ? r.severity : undefined,
      tags: ["learning", "reflection", r.severity ?? "incident"],
    };
  });

  let score: number | undefined;
  if (reflections.length > 0) {
    const completion =
      reflections.reduce((sum: number, r: any) => {
        if (r.status === "signed_off" || r.status === "completed") return sum + 1;
        const stages = Array.isArray(r.stages) ? r.stages : [];
        const total = stages.length || 10;
        return sum + (total ? stages.filter(stageDone).length / total : 0);
      }, 0) / reflections.length;
    score = Math.round(completion * 100);
  }

  return {
    id: "learning_from_incidents",
    title: "Learning from Incidents",
    description:
      "Structured post-incident reflection — what happened, the child's experience, what was learned, and what changed as a result.",
    ofsted_reference:
      "CHR 2015 Reg 35 — behaviour management and discipline; Reg 13 — leadership and a learning culture",
    data_sources: ["postIncidentReflections", "incidents"],
    items,
    score,
    rating: score === undefined ? "not_assessed" : scoreToRating(score),
    summary:
      reflections.length === 0
        ? "No post-incident reflections recorded in this period."
        : `${reflections.length} reflection(s) recorded; ${
            reflections.filter((r: any) => r.status === "signed_off").length
          } signed off by a manager.`,
  };
}

// ── Section 18: Child-Friendly Safety Planning (Staying Safe Plans) ────────

function buildChildSafetyPlanning(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const plans = input.stayingSafePlans ?? [];

  const items: EvidenceItem[] = plans.slice(0, 50).map((p: any) => ({
    id: `ev_safeplan_${p.id}`,
    type: "staying_safe_plan",
    title: `Staying Safe Plan — ${
      p.preferred_name || childNameFrom(input.youngPeople, p.child_id)
    }`,
    date: (p.approved_at ?? p.created_at ?? input.today).slice(0, 10),
    summary: `Status: ${p.status ?? "draft"}. ${
      p.manager_approved ? "Manager approved." : "Awaiting manager approval."
    } Child's own contribution recorded: ${hasText(p.child_contribution) ? "yes" : "no"}.`,
    linked_record_type: "staying_safe_plan",
    linked_record_id: p.id,
    child_id: p.child_id,
    tags: ["safety_planning", "child_voice"],
  }));

  const childIdsWithActivePlan = new Set(
    plans.filter((p: any) => p.status === "active").map((p: any) => p.child_id),
  );
  const coverage =
    children.length > 0
      ? Math.round(
          (children.filter((c: any) => childIdsWithActivePlan.has(c.id)).length /
            children.length) *
            100,
        )
      : 0;
  const score = children.length > 0 ? clamp(coverage, 0, 100) : undefined;

  return {
    id: "child_safety_planning",
    title: "Child-Friendly Safety Planning",
    description:
      "Each child's own staying-safe plan — their early warning signs, what helps, trusted people, and what staff should and should not do — written with the child.",
    ofsted_reference:
      "CHR 2015 Reg 12 — the protection of children; Reg 6 — the quality and purpose of care",
    data_sources: ["stayingSafePlans"],
    items,
    score,
    rating: score === undefined ? "not_assessed" : scoreToRating(score),
    summary: `${childIdsWithActivePlan.size}/${children.length} children have an active staying-safe plan; ${
      plans.filter((p: any) => p.manager_approved).length
    } of ${plans.length} plan(s) manager-approved.`,
  };
}

// ── Section 19: Protective Relationships ───────────────────────────────────

function buildProtectiveRelationshipsEvidence(
  input: EvidencePackInput,
  children: any[],
): EvidenceSection {
  const entries = input.relationshipEntries ?? [];

  const items: EvidenceItem[] = children
    .map((c: any): EvidenceItem | null => {
      const childEntries = entries.filter((e: any) => e.child_id === c.id);
      if (childEntries.length === 0) return null;
      const protectiveCount = childEntries.filter(
        (e: any) => e.rating === "protective",
      ).length;
      const riskCount = childEntries.filter((e: any) => e.rating === "risk").length;
      return {
        id: `ev_relationships_${c.id}`,
        type: "protective_relationships",
        title: `Relationship map — ${childNameFrom(input.youngPeople, c.id)}`,
        date: input.today,
        summary: `${protectiveCount} protective relationship(s), ${riskCount} flagged as a risk, across ${childEntries.length} mapped relationship(s).`,
        linked_record_type: "young_person",
        linked_record_id: c.id,
        child_id: c.id,
        tags: ["relationships", "safeguarding"],
      };
    })
    .filter((x: EvidenceItem | null): x is EvidenceItem => x !== null);

  const childrenWithProtective = children.filter((c: any) =>
    entries.some((e: any) => e.child_id === c.id && e.rating === "protective"),
  ).length;
  const score =
    children.length > 0
      ? clamp(Math.round((childrenWithProtective / children.length) * 100), 0, 100)
      : undefined;

  return {
    id: "protective_relationships",
    title: "Protective Relationships",
    description:
      "Each child's network of trusted adults and positive relationships, and any relationships understood to carry risk — the relational core of safeguarding.",
    ofsted_reference:
      "CHR 2015 Reg 11 — positive relationships; relational safeguarding",
    data_sources: ["relationshipEntries"],
    items,
    score,
    rating: score === undefined ? "not_assessed" : scoreToRating(score),
    summary: `${childrenWithProtective}/${children.length} children have at least one protective relationship recorded.`,
  };
}

// ── Section: Statement of Purpose & Organisational Assurance (whole-home) ────
// Composes the Statement of Purpose Reality Check (can the home prove it lives
// its SoP every day?) with the Burnout & Organisational Risk dashboard into one
// whole-home leadership-and-management assurance section. Both results are pre-
// computed by the route (each engine reads a wide slice of the store) and passed
// in; this builder maps them to evidence items and an honest, critical-friend
// score — organisational pressure pulls assurance down, and it is only "not
// assessed" when neither engine produced a result.
function buildSopAndOrganisationalAssurance(
  input: EvidencePackInput,
): EvidenceSection {
  const sop = input.sopRealityCheck ?? null;
  const org = input.orgRisk ?? null;
  const items: EvidenceItem[] = [];

  // One evidence item per Statement-of-Purpose assurance area.
  if (sop) {
    for (const a of sop.areas) {
      const gapText =
        a.gaps.length > 0
          ? ` Gaps: ${a.gaps.map((g) => g.label).join("; ")}.`
          : "";
      items.push({
        id: `ev_sop_${a.key}`,
        type: "sop_assurance_area",
        title: `Statement of Purpose — ${a.label}: ${a.strength} evidence`,
        date: input.today,
        summary: `${a.summary}${gapText}`,
        linked_record_type: "sop_reality_check",
        linked_record_id: `sop_${a.key}`,
        risk_level:
          a.strength === "limited"
            ? "high"
            : a.inspectionRisk
              ? "medium"
              : undefined,
        tags: [
          "statement_of_purpose",
          "leadership",
          a.key,
          ...(a.inspectionRisk ? ["inspection_risk"] : []),
        ],
      });
    }
  }

  // Whole-home organisational picture: overall level + each high/critical
  // indicator (pressure points that can become safeguarding risks for children).
  if (org) {
    items.push({
      id: "ev_org_overall",
      type: "organisational_risk",
      title: `Organisational risk — ${org.overallLevel}`,
      date: input.today,
      summary: org.headline,
      linked_record_type: "org_risk_dashboard",
      linked_record_id: "org_overall",
      risk_level:
        org.overallLevel === "critical" || org.overallLevel === "high"
          ? "high"
          : org.overallLevel === "moderate"
            ? "medium"
            : "low",
      tags: ["organisational_risk", "leadership", "workforce"],
    });
    for (const ind of org.indicators.filter(
      (i) => i.level === "high" || i.level === "critical",
    )) {
      items.push({
        id: `ev_org_${ind.key}`,
        type: "organisational_risk_indicator",
        title: `${ind.label}: ${ind.value} (${ind.level})`,
        date: input.today,
        summary: ind.detail,
        linked_record_type: "org_risk_dashboard",
        linked_record_id: `org_${ind.key}`,
        risk_level: ind.level === "critical" ? "critical" : "high",
        tags: ["organisational_risk", "workforce", ind.key],
      });
    }
  }

  // Honest score (no false green): SoP evidence strength, reduced by
  // organisational-risk pressure. Limited SoP areas contribute 0.
  const ORG_PENALTY: Record<string, number> = {
    low: 0,
    moderate: 5,
    high: 15,
    critical: 25,
  };
  let score: number | undefined;
  if (sop && sop.areas.length > 0) {
    const sopScore = Math.round(
      (sop.areasStrong * 100 + sop.areasDeveloping * 50) / sop.areas.length,
    );
    score = clamp(
      sopScore - (org ? (ORG_PENALTY[org.overallLevel] ?? 0) : 0),
      0,
      100,
    );
  } else if (org) {
    score = clamp(100 - (ORG_PENALTY[org.overallLevel] ?? 0) * 3, 0, 100);
  } else {
    score = undefined;
  }

  const summary = sop
    ? `${sop.areasStrong}/${sop.areas.length} Statement-of-Purpose areas strongly evidenced; ${sop.inspectionRisks.length} inspection risk(s)${org ? `; organisational risk ${org.overallLevel}` : ""}.`
    : org
      ? `Organisational risk is ${org.overallLevel}. ${org.headline}`
      : "Statement of Purpose and organisational-risk assurance not yet assessed.";

  return {
    id: "sop_and_organisational_assurance",
    title: "Statement of Purpose & Organisational Assurance",
    description:
      "Whole-home leadership assurance: can the home prove it lives its Statement of Purpose every day, and are organisational pressures (staffing, supervision, training) being managed before they become risks for children?",
    ofsted_reference:
      "CHR 2015 Reg 16 (Statement of Purpose) & Reg 13 (leadership and management); SCCIF — leadership & management",
    data_sources: ["sopRealityCheck", "orgRisk"],
    items,
    score,
    rating: score === undefined ? "not_assessed" : scoreToRating(score),
    summary,
  };
}

function identifyStrengths(sections: EvidenceSection[]): string[] {
  const strengths: string[] = [];

  for (const section of sections) {
    if (section.rating === "outstanding") {
      strengths.push(
        `${section.title}: Outstanding evidence with ${section.items.length} documented items.`,
      );
    } else if (section.rating === "good" && section.items.length > 5) {
      strengths.push(
        `${section.title}: Good evidence base with comprehensive documentation.`,
      );
    }
  }

  if (strengths.length === 0) {
    // Only sections that were actually scored can be "strongest" — an unassessed
    // section has no score to hold up as a high-water mark.
    const scored = sections.filter(
      (s): s is EvidenceSection & { score: number } => typeof s.score === "number",
    );
    const bestSection = scored.reduce(
      (best, s) => (s.score > best.score ? s : best),
      scored[0],
    );
    if (bestSection) {
      strengths.push(
        `${bestSection.title}: Strongest area with score of ${bestSection.score}%.`,
      );
    }
  }

  return strengths;
}

function identifyAreasForImprovement(sections: EvidenceSection[]): string[] {
  const areas: string[] = [];

  for (const section of sections) {
    if (section.rating === "inadequate") {
      areas.push(
        `${section.title}: Significant improvement needed. Current score: ${formatRate(section.score)}.`,
      );
    } else if (section.rating === "adequate") {
      areas.push(
        `${section.title}: Requires improvement to reach good rating. Current score: ${formatRate(section.score)}.`,
      );
    } else if (section.rating === "not_assessed") {
      // An unevidenced area is a finding at inspection, not a neutral blank.
      areas.push(
        `${section.title}: Nothing recorded in this period, so nothing can be evidenced. Ofsted judges on evidence — an empty register is a gap, not a pass.`,
      );
    }
  }

  if (areas.length === 0) {
    const scored = sections.filter(
      (s): s is EvidenceSection & { score: number } => typeof s.score === "number",
    );
    const weakestSection = scored.reduce(
      (worst, s) => (s.score < worst.score ? s : worst),
      scored[0],
    );
    if (weakestSection && weakestSection.score < 85) {
      areas.push(
        `${weakestSection.title}: Lowest scoring area at ${weakestSection.score}%. Focus here for improvement.`,
      );
    }
  }

  return areas;
}

// ── Outstanding Actions Collector ──────────────────────────────────────────

function collectOutstandingActions(input: EvidencePackInput): EvidenceItem[] {
  const actions: EvidenceItem[] = [];

  // Overdue tasks
  input.tasks
    .filter((t: any) => {
      const isOpen =
        t.status !== "completed" &&
        t.status !== "closed" &&
        t.status !== "cancelled";
      const isOverdue = t.due_date && t.due_date < input.today;
      return isOpen && isOverdue;
    })
    .slice(0, 20)
    .forEach((t: any) => {
      actions.push({
        id: `action_task_${t.id}`,
        type: "overdue_task",
        title: t.title ?? t.description?.slice(0, 60) ?? "Overdue Task",
        date: t.due_date?.slice(0, 10) ?? input.today,
        summary: `Overdue by ${daysBetween(t.due_date?.slice(0, 10) ?? input.today, input.today)} days. Priority: ${t.priority ?? "normal"}.`,
        linked_record_type: "task",
        linked_record_id: t.id,
        child_id: t.child_id,
        staff_id: t.assigned_to,
        risk_level:
          t.priority === "urgent" || t.priority === "critical"
            ? "high"
            : "medium",
        tags: ["outstanding", "overdue"],
      });
    });

  // Overdue risk assessment reviews
  input.riskAssessments
    .filter((r: any) => {
      const reviewDate = r.review_date ?? r.next_review;
      return reviewDate && reviewDate < input.today && r.status === "current";
    })
    .slice(0, 10)
    .forEach((r: any) => {
      actions.push({
        id: `action_ra_${r.id}`,
        type: "overdue_risk_review",
        title: `Overdue Risk Assessment Review — ${r.title ?? r.risk_type ?? ""}`,
        date: r.review_date ?? r.next_review ?? input.today,
        summary: `Risk assessment review overdue. Risk level: ${r.risk_level ?? "unknown"}.`,
        linked_record_type: "risk_assessment",
        linked_record_id: r.id,
        child_id: r.child_id,
        risk_level: "high",
        tags: ["outstanding", "risk_review"],
      });
    });

  // Open incidents
  input.incidents
    .filter(
      (i: any) =>
        i.status !== "closed" &&
        i.status !== "resolved" &&
        i.severity === "critical",
    )
    .slice(0, 10)
    .forEach((i: any) => {
      actions.push({
        id: `action_incident_${i.id}`,
        type: "open_critical_incident",
        title: `Open Critical Incident — ${i.title ?? ""}`,
        date:
          i.date?.slice(0, 10) ??
          i.incident_date?.slice(0, 10) ??
          input.today,
        summary: `Critical incident still open. Requires urgent resolution.`,
        linked_record_type: "incident",
        linked_record_id: i.id,
        child_id: i.child_id ?? i.young_person_id,
        risk_level: "critical",
        tags: ["outstanding", "critical"],
      });
    });

  // Overdue restriction reviews — least-restrictive practice depends on timely review
  (input.restrictionReviews ?? [])
    .filter((r: any) => r.next_review_date && r.next_review_date < input.today)
    .slice(0, 10)
    .forEach((r: any) => {
      actions.push({
        id: `action_restriction_${r.id}`,
        type: "overdue_restriction_review",
        title: `Overdue restriction review — ${childNameFrom(input.youngPeople, r.child_id)}`,
        date: r.next_review_date?.slice(0, 10) ?? input.today,
        summary: `A restriction on this child's liberty is past its review date. Continued restriction must be reviewed for proportionality and least-restrictive practice.`,
        linked_record_type: "restriction_review",
        linked_record_id: r.id,
        child_id: r.child_id,
        risk_level: "high",
        tags: ["outstanding", "rights", "restriction"],
      });
    });

  // Active staying-safe plans awaiting manager approval
  (input.stayingSafePlans ?? [])
    .filter((p: any) => p.status === "active" && !p.manager_approved)
    .slice(0, 10)
    .forEach((p: any) => {
      actions.push({
        id: `action_safeplan_${p.id}`,
        type: "unapproved_safety_plan",
        title: `Staying-safe plan awaiting approval — ${p.preferred_name || childNameFrom(input.youngPeople, p.child_id)}`,
        date: (p.updated_at ?? p.created_at ?? input.today).slice(0, 10),
        summary: `An active staying-safe plan has not yet been approved by a manager.`,
        linked_record_type: "staying_safe_plan",
        linked_record_id: p.id,
        child_id: p.child_id,
        risk_level: "medium",
        tags: ["outstanding", "safety_planning"],
      });
    });

  return actions;
}
