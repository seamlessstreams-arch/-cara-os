// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION READINESS INTELLIGENCE ENGINE
// Meta-engine: real-time Ofsted inspection preparedness score.
// Maps all care domains to SCCIF judgment areas, identifies evidence gaps,
// computes weighted readiness, and generates action priorities.
// Pure deterministic. No LLM calls, no DB access.
// CHR 2015 (all regulations). SCCIF: All three judgment areas.
// ══════════════════════════════════════════════════════════════════════════════

import { meanOf, meets, below } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface InspectionReadinessInput {
  today: string;
  home_name: string;
  total_children: number;
  total_staff: number;

  domain_metrics: DomainMetric[];

  reg44_status: Reg44Status;
  reg45_status: Reg45Status;
  notifiable_events: NotifiableEventStatus;
  self_evaluation: SelfEvaluationStatus;
  complaints_summary: ComplaintsSummary;
  staff_compliance: StaffComplianceSummary;
  children_plans: ChildrenPlansSummary;
  safeguarding_summary: SafeguardingSummary;
}

export interface DomainMetric {
  domain: string;
  domain_label: string;
  /**
   * null = nothing recorded in this domain, so its compliance is UNKNOWN.
   *
   * This used to default to a flattering literal (safeguarding was
   * `criticalIncidents === 0 ? 85 : 60`), which meant a home that had evidenced
   * nothing still scored 85% on safeguarding readiness. Ofsted judges on
   * evidence — an empty domain is a gap, not a pass — so an unmeasured domain
   * now scores nothing and is reported under `gaps` instead.
   */
  compliance_rate: number | null;
  critical_alerts: number;
  high_alerts: number;
  overdue_count: number;
  evidence_count: number;
  last_updated: string | null;
}

export interface Reg44Status {
  last_visit_date: string | null;
  next_due_date: string | null;
  actions_outstanding: number;
  visits_in_12_months: number;
}

export interface Reg45Status {
  last_report_date: string | null;
  next_due_date: string | null;
  report_submitted_on_time: boolean;
}

export interface NotifiableEventStatus {
  pending_notifications: number;
  overdue_notifications: number;
  total_this_quarter: number;
}

export interface SelfEvaluationStatus {
  has_current_sef: boolean;
  last_updated: string | null;
  judgment_area_coverage: number;
  action_completion_rate: number;
}

export interface ComplaintsSummary {
  open_complaints: number;
  complaints_this_quarter: number;
  average_resolution_days: number;
  escalated_to_ofsted: number;
}

export interface StaffComplianceSummary {
  // null when there are no staff / no mandatory-training records to measure
  // against. An empty register is not 100% compliance.
  dbs_compliance_rate: number | null;
  training_compliance_rate: number | null;
  supervision_compliance_rate: number | null;
  staff_with_overdue_dbs: number;
  staff_with_overdue_training: number;
  staff_with_overdue_supervision: number;
}

export interface ChildrenPlansSummary {
  children_with_current_care_plan: number;
  children_with_current_risk_assessment: number;
  children_with_overdue_lac_review: number;
  children_with_health_assessment: number;
  pep_completion_rate: number | null;
}

export interface SafeguardingSummary {
  open_referrals: number;
  lado_referrals_this_year: number;
  return_interview_completion_rate: number | null;
  missing_episodes_this_quarter: number;
  exploitation_screenings_current: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type ReadinessGrade = "outstanding" | "good" | "requires_improvement" | "inadequate";
export type JudgmentArea = "overall_experiences" | "helped_and_protected" | "leadership_and_management";

export interface InspectionReadinessResult {
  generated_at: string;
  home_name: string;
  // null when not one judgment area could be measured — a home with no records
  // has no readiness position, and inventing one is the failure mode this
  // engine exists to avoid.
  overall_readiness_score: number | null;
  overall_grade: ReadinessGrade | null;
  headline: string;
  /** Domains with no records at all, named so the UI can say what is missing. */
  unmeasured_domains: string[];

  judgment_areas: JudgmentAreaScore[];
  regulatory_gaps: RegulatoryGap[];
  evidence_strength: EvidenceStrength[];
  action_priorities: ReadinessAction[];
  compliance_matrix: ComplianceItem[];
  key_risks: KeyRisk[];
  insights: ReadinessInsight[];
}

export interface JudgmentAreaScore {
  area: JudgmentArea;
  area_label: string;
  /** null when no contributing domain has any records. */
  score: number | null;
  grade: ReadinessGrade | null;
  contributing_domains: string[];
  strengths: string[];
  gaps: string[];
}

export interface RegulatoryGap {
  regulation: string;
  regulation_label: string;
  gap_description: string;
  severity: "critical" | "significant" | "minor";
  judgment_area: JudgmentArea;
  remediation: string;
}

export interface EvidenceStrength {
  category: string;
  category_label: string;
  strength: "strong" | "adequate" | "weak" | "missing";
  evidence_count: number;
  last_updated: string | null;
}

export interface ReadinessAction {
  rank: number;
  action: string;
  regulation: string;
  judgment_area: JudgmentArea;
  severity: "critical" | "high" | "medium" | "low";
  deadline_suggestion: string;
}

export interface ComplianceItem {
  area: string;
  regulation: string;
  /** Unmeasured is never compliant — absence of evidence is not evidence of compliance. */
  compliant: boolean;
  rate: number | null;
  detail: string;
}

export interface KeyRisk {
  risk: string;
  impact: string;
  judgment_area: JudgmentArea;
  severity: "critical" | "high" | "medium";
}

export interface ReadinessInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

// ── Constants ───────────────────────────────────────────────────────────────

const SCCIF_DOMAIN_MAP: Record<string, JudgmentArea> = {
  safeguarding: "helped_and_protected",
  behaviour: "overall_experiences",
  health: "overall_experiences",
  education: "overall_experiences",
  placement: "overall_experiences",
  contact: "overall_experiences",
  workforce: "leadership_and_management",
  quality_assurance: "leadership_and_management",
  complaints: "leadership_and_management",
  supervision: "leadership_and_management",
  finance: "leadership_and_management",
  medication: "helped_and_protected",
  missing: "helped_and_protected",
  risk_assessment: "helped_and_protected",
  restraint: "helped_and_protected",
  premises: "leadership_and_management",
};

const JUDGMENT_LABELS: Record<JudgmentArea, string> = {
  overall_experiences: "The Overall Experiences and Progress of Children",
  helped_and_protected: "How Well Children are Helped and Protected",
  leadership_and_management: "The Effectiveness of Leaders and Managers",
};

function scoreToGrade(score: number): ReadinessGrade {
  if (score >= 85) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "requires_improvement";
  return "inadequate";
}

// ── Core Compute ────────────────────────────────────────────────────────────

export function computeInspectionReadiness(input: InspectionReadinessInput): InspectionReadinessResult {
  const judgmentAreas = computeJudgmentAreas(input);
  const regulatoryGaps = identifyRegulatoryGaps(input);
  const evidenceStrength = assessEvidenceStrength(input);
  const complianceMatrix = buildComplianceMatrix(input);
  const keyRisks = identifyKeyRisks(input);
  const actionPriorities = buildActionPriorities(input, regulatoryGaps, keyRisks);
  const insights = generateInsights(input, judgmentAreas, regulatoryGaps);

  // Measured areas only. An area with no records contributes nothing rather
  // than a default, so a single evidenced domain cannot be diluted — or
  // flattered — by the silence around it.
  const overallScore = meanOf(judgmentAreas.map((j) => j.score));
  const overallGrade = overallScore === null ? null : scoreToGrade(overallScore);
  const unmeasuredDomains = input.domain_metrics
    .filter((d) => d.compliance_rate === null)
    .map((d) => d.domain_label);
  const headline = generateHeadline(
    input.home_name,
    overallGrade,
    overallScore,
    regulatoryGaps,
    unmeasuredDomains,
  );

  return {
    generated_at: input.today,
    home_name: input.home_name,
    overall_readiness_score: overallScore,
    overall_grade: overallGrade,
    headline,
    unmeasured_domains: unmeasuredDomains,
    judgment_areas: judgmentAreas,
    regulatory_gaps: regulatoryGaps,
    evidence_strength: evidenceStrength,
    action_priorities: actionPriorities,
    compliance_matrix: complianceMatrix,
    key_risks: keyRisks,
    insights,
  };
}

// ── Judgment Area Scores ────────────────────────────────────────────────────

function computeJudgmentAreas(input: InspectionReadinessInput): JudgmentAreaScore[] {
  const areas: JudgmentArea[] = ["overall_experiences", "helped_and_protected", "leadership_and_management"];

  return areas.map((area) => {
    const domains = input.domain_metrics.filter(
      (d) => (SCCIF_DOMAIN_MAP[d.domain] ?? "leadership_and_management") === area,
    );
    const contributingDomains = domains.map((d) => d.domain_label);

    // Only domains that actually hold records can score the area. When none do,
    // the area stays null all the way through: the deductions below would
    // otherwise manufacture a precise-looking number (70 minus a few fives)
    // out of an empty home.
    let score = meanOf(domains.map((d) => d.compliance_rate));

    if (score !== null) {
      // Adjust based on area-specific factors
      if (area === "helped_and_protected") {
        if (input.safeguarding_summary.open_referrals > 0) score -= 5;
        if (below(input.safeguarding_summary.return_interview_completion_rate, 100)) score -= 5;
        if (input.safeguarding_summary.missing_episodes_this_quarter > 2) score -= 5;
        if (input.children_plans.children_with_current_risk_assessment < input.total_children) score -= 5;
      }

      if (area === "overall_experiences") {
        if (input.children_plans.children_with_overdue_lac_review > 0) score -= 5;
        if (below(input.children_plans.pep_completion_rate, 100)) score -= 3;
        const totalCritical = domains.reduce((s, d) => s + d.critical_alerts, 0);
        if (totalCritical > 0) score -= totalCritical * 5;
      }

      if (area === "leadership_and_management") {
        if (!input.self_evaluation.has_current_sef) score -= 10;
        if (below(input.staff_compliance.dbs_compliance_rate, 100)) score -= 10;
        if (below(input.staff_compliance.supervision_compliance_rate, 85)) score -= 5;
        if (input.reg44_status.actions_outstanding > 3) score -= 5;
        if (!input.reg45_status.report_submitted_on_time) score -= 5;
      }

      score = Math.max(0, Math.min(100, score));
    }

    const strengths: string[] = [];
    const gaps: string[] = [];

    for (const d of domains) {
      // An unmeasured domain is an evidence gap, not a neutral omission —
      // Ofsted judges on what a home can show, so "nothing recorded" is itself
      // the finding and belongs in front of the manager.
      if (d.compliance_rate === null) {
        gaps.push(`${d.domain_label}: no records yet — nothing to evidence`);
        continue;
      }
      if (meets(d.compliance_rate, 90) && d.critical_alerts === 0) {
        strengths.push(`${d.domain_label} at ${d.compliance_rate}% compliance`);
      }
      if (below(d.compliance_rate, 80)) {
        gaps.push(`${d.domain_label} compliance at ${d.compliance_rate}%`);
      }
      if (d.overdue_count > 0) {
        gaps.push(`${d.domain_label}: ${d.overdue_count} overdue item(s)`);
      }
    }

    return {
      area,
      area_label: JUDGMENT_LABELS[area],
      score,
      grade: score === null ? null : scoreToGrade(score),
      contributing_domains: contributingDomains,
      strengths: strengths.slice(0, 5),
      gaps: gaps.slice(0, 5),
    };
  });
}

// ── Regulatory Gaps ─────────────────────────────────────────────────────────

function identifyRegulatoryGaps(input: InspectionReadinessInput): RegulatoryGap[] {
  const gaps: RegulatoryGap[] = [];

  if (below(input.staff_compliance.dbs_compliance_rate, 100)) {
    gaps.push({
      regulation: "Reg 32",
      regulation_label: "Fitness of workers",
      gap_description: `${input.staff_compliance.staff_with_overdue_dbs} staff member(s) with DBS not current`,
      severity: "critical",
      judgment_area: "leadership_and_management",
      remediation: "Expedite DBS renewals or suspend staff pending clearance",
    });
  }

  if (below(input.staff_compliance.supervision_compliance_rate, 85)) {
    gaps.push({
      regulation: "Reg 33",
      regulation_label: "Employment of staff",
      gap_description: `Supervision compliance at ${input.staff_compliance.supervision_compliance_rate}% (${input.staff_compliance.staff_with_overdue_supervision} staff overdue)`,
      severity: "significant",
      judgment_area: "leadership_and_management",
      remediation: "Schedule and complete overdue supervision sessions",
    });
  }

  if (input.children_plans.children_with_current_care_plan < input.total_children) {
    const missing = input.total_children - input.children_plans.children_with_current_care_plan;
    gaps.push({
      regulation: "Reg 9",
      regulation_label: "Care plans",
      gap_description: `${missing} child(ren) without current care plan`,
      severity: "critical",
      judgment_area: "overall_experiences",
      remediation: "Ensure all children have up-to-date placement plans",
    });
  }

  if (input.children_plans.children_with_current_risk_assessment < input.total_children) {
    const missing = input.total_children - input.children_plans.children_with_current_risk_assessment;
    gaps.push({
      regulation: "Reg 12",
      regulation_label: "Protection of children",
      gap_description: `${missing} child(ren) without current risk assessment`,
      severity: "critical",
      judgment_area: "helped_and_protected",
      remediation: "Complete risk assessments for all children",
    });
  }

  if (below(input.safeguarding_summary.return_interview_completion_rate, 100)) {
    gaps.push({
      regulation: "Reg 34",
      regulation_label: "Contact and access",
      gap_description: `Return interview completion rate at ${input.safeguarding_summary.return_interview_completion_rate}%`,
      severity: "significant",
      judgment_area: "helped_and_protected",
      remediation: "Complete outstanding return interviews within 72 hours",
    });
  }

  if (!input.self_evaluation.has_current_sef) {
    gaps.push({
      regulation: "Reg 45",
      regulation_label: "Quality of care review",
      gap_description: "No current self-evaluation form (SEF) in place",
      severity: "significant",
      judgment_area: "leadership_and_management",
      remediation: "Complete and submit SEF covering all three SCCIF judgment areas",
    });
  }

  if (input.reg44_status.next_due_date && input.reg44_status.next_due_date < input.today) {
    gaps.push({
      regulation: "Reg 44",
      regulation_label: "Independent person: visits and reports",
      gap_description: "Reg 44 visit overdue",
      severity: "critical",
      judgment_area: "leadership_and_management",
      remediation: "Arrange Reg 44 visit immediately",
    });
  }

  if (input.notifiable_events.overdue_notifications > 0) {
    gaps.push({
      regulation: "Reg 40",
      regulation_label: "Notification of serious events",
      gap_description: `${input.notifiable_events.overdue_notifications} overdue notifiable event notification(s)`,
      severity: "critical",
      judgment_area: "helped_and_protected",
      remediation: "Submit overdue notifications to Ofsted immediately",
    });
  }

  if (input.complaints_summary.escalated_to_ofsted > 0) {
    gaps.push({
      regulation: "Reg 39",
      regulation_label: "Complaints",
      gap_description: `${input.complaints_summary.escalated_to_ofsted} complaint(s) escalated to Ofsted`,
      severity: "significant",
      judgment_area: "leadership_and_management",
      remediation: "Ensure thorough investigation and resolution evidence is available",
    });
  }

  if (below(input.staff_compliance.training_compliance_rate, 85)) {
    gaps.push({
      regulation: "Reg 33",
      regulation_label: "Employment of staff",
      gap_description: `Training compliance at ${input.staff_compliance.training_compliance_rate}%`,
      severity: "significant",
      judgment_area: "leadership_and_management",
      remediation: "Complete mandatory training for all staff",
    });
  }

  if (input.children_plans.children_with_overdue_lac_review > 0) {
    gaps.push({
      regulation: "Reg 9",
      regulation_label: "Care plans",
      gap_description: `${input.children_plans.children_with_overdue_lac_review} child(ren) with overdue LAC review`,
      severity: "significant",
      judgment_area: "overall_experiences",
      remediation: "Schedule LAC reviews and notify IRO",
    });
  }

  return gaps.sort((a, b) => {
    const sev = { critical: 0, significant: 1, minor: 2 };
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
  });
}

// ── Evidence Strength ───────────────────────────────────────────────────────

function assessEvidenceStrength(input: InspectionReadinessInput): EvidenceStrength[] {
  const categories: { category: string; label: string; domain?: string; check: () => { strength: "strong" | "adequate" | "weak" | "missing"; count: number; updated: string | null } }[] = [
    {
      category: "care_plans",
      label: "Care Plans & Placement Plans",
      check: () => {
        const rate = input.total_children > 0 ? input.children_plans.children_with_current_care_plan / input.total_children : 0;
        return { strength: rate >= 1 ? "strong" : rate >= 0.8 ? "adequate" : rate > 0 ? "weak" : "missing", count: input.children_plans.children_with_current_care_plan, updated: null };
      },
    },
    {
      category: "risk_assessments",
      label: "Risk Assessments",
      check: () => {
        const rate = input.total_children > 0 ? input.children_plans.children_with_current_risk_assessment / input.total_children : 0;
        return { strength: rate >= 1 ? "strong" : rate >= 0.8 ? "adequate" : rate > 0 ? "weak" : "missing", count: input.children_plans.children_with_current_risk_assessment, updated: null };
      },
    },
    {
      category: "staff_files",
      label: "Staff Safer Recruitment Files",
      check: () => {
        const pct = input.staff_compliance.dbs_compliance_rate;
        if (pct === null) return { strength: "missing", count: 0, updated: null };
        const rate = pct / 100;
        return { strength: rate >= 1 ? "strong" : rate >= 0.9 ? "adequate" : rate > 0 ? "weak" : "missing", count: Math.round(rate * input.total_staff), updated: null };
      },
    },
    {
      category: "self_evaluation",
      label: "Self-Evaluation (SEF)",
      check: () => ({
        strength: input.self_evaluation.has_current_sef && input.self_evaluation.action_completion_rate >= 80 ? "strong" :
                  input.self_evaluation.has_current_sef ? "adequate" : "missing",
        count: input.self_evaluation.has_current_sef ? 1 : 0,
        updated: input.self_evaluation.last_updated,
      }),
    },
    {
      category: "reg44_reports",
      label: "Reg 44 Visit Reports",
      check: () => ({
        strength: input.reg44_status.visits_in_12_months >= 12 ? "strong" :
                  input.reg44_status.visits_in_12_months >= 10 ? "adequate" :
                  input.reg44_status.visits_in_12_months > 0 ? "weak" : "missing",
        count: input.reg44_status.visits_in_12_months,
        updated: input.reg44_status.last_visit_date,
      }),
    },
    {
      category: "reg45_report",
      label: "Reg 45 Quality of Care Report",
      check: () => ({
        strength: input.reg45_status.report_submitted_on_time ? "strong" :
                  input.reg45_status.last_report_date ? "adequate" : "missing",
        count: input.reg45_status.last_report_date ? 1 : 0,
        updated: input.reg45_status.last_report_date,
      }),
    },
    {
      category: "supervision",
      label: "Staff Supervision Records",
      check: () => ({
        strength: meets(input.staff_compliance.supervision_compliance_rate, 90) ? "strong" :
                  meets(input.staff_compliance.supervision_compliance_rate, 75) ? "adequate" :
                  meets(input.staff_compliance.supervision_compliance_rate, 1) ? "weak" : "missing",
        count: Math.round((input.staff_compliance.supervision_compliance_rate ?? 0) * input.total_staff / 100),
        updated: null,
      }),
    },
    {
      category: "training",
      label: "Training Records",
      check: () => ({
        strength: meets(input.staff_compliance.training_compliance_rate, 90) ? "strong" :
                  meets(input.staff_compliance.training_compliance_rate, 75) ? "adequate" :
                  meets(input.staff_compliance.training_compliance_rate, 1) ? "weak" : "missing",
        count: Math.round((input.staff_compliance.training_compliance_rate ?? 0) * input.total_staff / 100),
        updated: null,
      }),
    },
  ];

  return categories.map((c) => {
    const result = c.check();
    return {
      category: c.category,
      category_label: c.label,
      strength: result.strength,
      evidence_count: result.count,
      last_updated: result.updated,
    };
  });
}

// ── Compliance Matrix ───────────────────────────────────────────────────────

function buildComplianceMatrix(input: InspectionReadinessInput): ComplianceItem[] {
  const items: ComplianceItem[] = [];

  items.push({
    area: "DBS Checks",
    regulation: "Reg 32",
    compliant: meets(input.staff_compliance.dbs_compliance_rate, 100),
    rate: input.staff_compliance.dbs_compliance_rate,
    detail: input.staff_compliance.staff_with_overdue_dbs > 0
      ? `${input.staff_compliance.staff_with_overdue_dbs} staff overdue`
      : "All current",
  });

  items.push({
    area: "Staff Supervision",
    regulation: "Reg 33",
    compliant: meets(input.staff_compliance.supervision_compliance_rate, 85),
    rate: input.staff_compliance.supervision_compliance_rate,
    detail: `${input.staff_compliance.staff_with_overdue_supervision} overdue`,
  });

  items.push({
    area: "Training",
    regulation: "Reg 33",
    compliant: meets(input.staff_compliance.training_compliance_rate, 85),
    rate: input.staff_compliance.training_compliance_rate,
    detail: `${input.staff_compliance.staff_with_overdue_training} staff need training`,
  });

  items.push({
    area: "Care Plans",
    regulation: "Reg 9",
    compliant: input.children_plans.children_with_current_care_plan >= input.total_children,
    rate: input.total_children > 0 ? Math.round((input.children_plans.children_with_current_care_plan / input.total_children) * 100) : 100,
    detail: `${input.children_plans.children_with_current_care_plan}/${input.total_children} current`,
  });

  items.push({
    area: "Risk Assessments",
    regulation: "Reg 12",
    compliant: input.children_plans.children_with_current_risk_assessment >= input.total_children,
    rate: input.total_children > 0 ? Math.round((input.children_plans.children_with_current_risk_assessment / input.total_children) * 100) : 100,
    detail: `${input.children_plans.children_with_current_risk_assessment}/${input.total_children} current`,
  });

  items.push({
    area: "Reg 44 Visits",
    regulation: "Reg 44",
    compliant: input.reg44_status.visits_in_12_months >= 12,
    rate: Math.round((input.reg44_status.visits_in_12_months / 12) * 100),
    detail: `${input.reg44_status.visits_in_12_months}/12 visits`,
  });

  items.push({
    area: "Reg 45 Report",
    regulation: "Reg 45",
    compliant: input.reg45_status.report_submitted_on_time,
    rate: input.reg45_status.report_submitted_on_time ? 100 : 0,
    detail: input.reg45_status.report_submitted_on_time ? "Submitted on time" : "Late or missing",
  });

  items.push({
    area: "Notifiable Events",
    regulation: "Reg 40",
    compliant: input.notifiable_events.overdue_notifications === 0,
    rate: input.notifiable_events.overdue_notifications === 0 ? 100 : 0,
    detail: input.notifiable_events.overdue_notifications > 0
      ? `${input.notifiable_events.overdue_notifications} overdue`
      : "All notified",
  });

  return items;
}

// ── Key Risks ───────────────────────────────────────────────────────────────

function identifyKeyRisks(input: InspectionReadinessInput): KeyRisk[] {
  const risks: KeyRisk[] = [];

  if (below(input.staff_compliance.dbs_compliance_rate, 100)) {
    risks.push({
      risk: "Staff working without current DBS",
      impact: "Immediate judgment of inadequate on leadership if discovered during inspection",
      judgment_area: "leadership_and_management",
      severity: "critical",
    });
  }

  if (input.notifiable_events.overdue_notifications > 0) {
    risks.push({
      risk: "Overdue notifiable events to Ofsted",
      impact: "Regulatory breach — demonstrates failure in statutory duties",
      judgment_area: "helped_and_protected",
      severity: "critical",
    });
  }

  if (input.safeguarding_summary.missing_episodes_this_quarter > 3) {
    risks.push({
      risk: "High volume of missing episodes",
      impact: "Inspector will scrutinise contextual safeguarding response and prevention strategies",
      judgment_area: "helped_and_protected",
      severity: "high",
    });
  }

  if (input.complaints_summary.escalated_to_ofsted > 0) {
    risks.push({
      risk: "Complaints escalated to Ofsted",
      impact: "Inspector will examine complaint handling and whether lessons have been embedded",
      judgment_area: "leadership_and_management",
      severity: "high",
    });
  }

  if (!input.self_evaluation.has_current_sef) {
    risks.push({
      risk: "No current self-evaluation form",
      impact: "Demonstrates lack of reflective leadership practice",
      judgment_area: "leadership_and_management",
      severity: "high",
    });
  }

  if (input.children_plans.children_with_overdue_lac_review > 0) {
    risks.push({
      risk: "Overdue LAC reviews",
      impact: "Statutory duty not met — impacts care planning evidence",
      judgment_area: "overall_experiences",
      severity: "high",
    });
  }

  const totalOverdue = input.domain_metrics.reduce((s, d) => s + d.overdue_count, 0);
  if (totalOverdue > 5) {
    risks.push({
      risk: `${totalOverdue} overdue items across domains`,
      impact: "Pattern of non-compliance will be identified during inspection",
      judgment_area: "leadership_and_management",
      severity: "medium",
    });
  }

  return risks.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2 };
    return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
  }).slice(0, 8);
}

// ── Action Priorities ───────────────────────────────────────────────────────

function buildActionPriorities(
  input: InspectionReadinessInput,
  gaps: RegulatoryGap[],
  risks: KeyRisk[],
): ReadinessAction[] {
  const actions: ReadinessAction[] = [];
  let rank = 0;

  for (const gap of gaps.filter((g) => g.severity === "critical")) {
    actions.push({
      rank: ++rank,
      action: gap.remediation,
      regulation: gap.regulation,
      judgment_area: gap.judgment_area,
      severity: "critical",
      deadline_suggestion: "Immediately",
    });
  }

  for (const gap of gaps.filter((g) => g.severity === "significant")) {
    actions.push({
      rank: ++rank,
      action: gap.remediation,
      regulation: gap.regulation,
      judgment_area: gap.judgment_area,
      severity: "high",
      deadline_suggestion: "Within 7 days",
    });
  }

  if (input.self_evaluation.action_completion_rate < 80 && input.self_evaluation.has_current_sef) {
    actions.push({
      rank: ++rank,
      action: `Complete SEF action plan — currently at ${input.self_evaluation.action_completion_rate}%`,
      regulation: "Reg 45",
      judgment_area: "leadership_and_management",
      severity: "medium",
      deadline_suggestion: "Within 14 days",
    });
  }

  if (input.complaints_summary.open_complaints > 0) {
    actions.push({
      rank: ++rank,
      action: `Resolve ${input.complaints_summary.open_complaints} open complaint(s)`,
      regulation: "Reg 39",
      judgment_area: "leadership_and_management",
      severity: "medium",
      deadline_suggestion: "Within 14 days",
    });
  }

  return actions.slice(0, 12);
}

// ── Headline ────────────────────────────────────────────────────────────────

function generateHeadline(
  homeName: string,
  grade: ReadinessGrade | null,
  score: number | null,
  gaps: RegulatoryGap[],
  unmeasuredDomains: string[],
): string {
  const criticalGaps = gaps.filter((g) => g.severity === "critical").length;

  // Nothing recorded anywhere. Say so plainly rather than reaching for the
  // "inadequate" wording — a home that has not started recording is not the
  // same as a home that is failing, and the manager needs the difference.
  if (grade === null || score === null) {
    return `${homeName} has no records yet to assess inspection readiness against — readiness appears once daily recording begins`;
  }

  const caveat = unmeasuredDomains.length > 0
    ? ` (${unmeasuredDomains.length} domain${unmeasuredDomains.length === 1 ? "" : "s"} not yet evidenced: ${unmeasuredDomains.join(", ")})`
    : "";

  if (grade === "outstanding") return `${homeName} is well-prepared for inspection — ${score}% readiness across all SCCIF areas${caveat}`;
  if (grade === "good") return `${homeName} demonstrates good inspection readiness at ${score}% — ${criticalGaps > 0 ? `${criticalGaps} critical gap(s) to address` : "continue strengthening evidence"}${caveat}`;
  if (grade === "requires_improvement") return `${homeName} has significant gaps at ${score}% readiness — ${criticalGaps} critical regulatory gap(s) require immediate action${caveat}`;
  return `${homeName} has serious regulatory non-compliance at ${score}% readiness — urgent remediation required across multiple areas${caveat}`;
}

// ── Insights ────────────────────────────────────────────────────────────────

function generateInsights(
  input: InspectionReadinessInput,
  judgments: JudgmentAreaScore[],
  gaps: RegulatoryGap[],
): ReadinessInsight[] {
  const insights: ReadinessInsight[] = [];

  const allGood = judgments.every((j) => j.grade === "outstanding" || j.grade === "good");
  if (allGood) {
    insights.push({ text: "All three SCCIF judgment areas at good or above — strong position for inspection.", severity: "positive" });
  }

  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  if (criticalGaps.length > 0) {
    insights.push({ text: `${criticalGaps.length} critical regulatory gap(s) would likely result in requirements/actions during inspection.`, severity: "critical" });
  }

  if (below(input.staff_compliance.dbs_compliance_rate, 100)) {
    insights.push({ text: "DBS non-compliance is the single highest-risk finding in any Ofsted inspection — address immediately.", severity: "critical" });
  }

  if (input.self_evaluation.has_current_sef && input.self_evaluation.action_completion_rate >= 80) {
    insights.push({ text: "Strong self-evaluation with high action completion demonstrates reflective leadership practice.", severity: "positive" });
  }

  if (meets(input.safeguarding_summary.return_interview_completion_rate, 100) && input.safeguarding_summary.missing_episodes_this_quarter > 0) {
    insights.push({ text: "All return interviews completed — evidence of strong safeguarding response to missing episodes.", severity: "positive" });
  }

  const weakJudgment = judgments.find((j) => j.grade === "requires_improvement" || j.grade === "inadequate");
  if (weakJudgment) {
    insights.push({ text: `${weakJudgment.area_label} at ${weakJudgment.score}% — this area will be the inspector's primary focus.`, severity: "warning" });
  }

  if (input.complaints_summary.average_resolution_days > 20) {
    insights.push({ text: `Average complaint resolution at ${input.complaints_summary.average_resolution_days} days — inspector will examine whether resolution is timely.`, severity: "warning" });
  }

  if (input.reg44_status.actions_outstanding > 3) {
    insights.push({ text: `${input.reg44_status.actions_outstanding} outstanding Reg 44 actions — inspector will check action tracking and completion.`, severity: "warning" });
  }

  return insights.slice(0, 8);
}
