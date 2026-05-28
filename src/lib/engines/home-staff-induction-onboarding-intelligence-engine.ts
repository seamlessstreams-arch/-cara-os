// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF INDUCTION & ONBOARDING INTELLIGENCE ENGINE
// Cross-domain composite: assesses the quality and completeness of the home's
// staff induction and onboarding processes, including permanent staff, agency
// staff, and shadowing compliance.
// Store keys: staffInductionRecords, agencyInductions, staffShadowingRecords,
//             staffHandbookAcknowledgementRecords
// CHR 2015 Reg 33 (Employment of staff), Reg 34 (Fitness of staff),
// Sch 2 (Information about workers), Reg 32 (Fitness of premises).
// SCCIF: "Leadership and management" — Ofsted checks induction processes are
// thorough, timely, and cover all mandatory areas before lone working.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface StaffInductionInput {
  id: string;
  staff_id: string;
  start_date: string;
  completion_date: string | null;
  status: string; // "completed" | "in_progress" | "overdue" | "not_started"
  modules_total: number;
  modules_completed: number;
  safeguarding_covered: boolean;
  medication_covered: boolean;
  fire_safety_covered: boolean;
  children_intro_completed: boolean;
  policy_review_completed: boolean;
  signed_off_by: string | null;
  created_at: string;
}

export interface AgencyInductionInput {
  id: string;
  staff_name: string;
  agency_name: string;
  induction_date: string;
  completed: boolean;
  safeguarding_briefed: boolean;
  medication_briefed: boolean;
  fire_procedures_briefed: boolean;
  children_needs_briefed: boolean;
  house_rules_briefed: boolean;
  emergency_contacts_given: boolean;
  conducted_by: string;
  created_at: string;
}

export interface ShadowingRecordInput {
  id: string;
  staff_id: string;
  shadow_date: string;
  shift_type: string; // "day" | "evening" | "night" | "sleep_in"
  hours: number;
  mentor_id: string;
  competency_confirmed: boolean;
  areas_of_strength: string[];
  areas_for_development: string[];
  ready_for_lone_working: boolean;
  created_at: string;
}

export interface HandbookAcknowledgementInput {
  id: string;
  staff_id: string;
  acknowledged_date: string;
  version: string;
  key_policies_read: boolean;
  safeguarding_policy_read: boolean;
  behaviour_management_read: boolean;
  whistleblowing_policy_read: boolean;
  signed: boolean;
  created_at: string;
}

export interface StaffInductionOnboardingInput {
  today: string;
  total_staff: number;
  staff_inductions: StaffInductionInput[];
  agency_inductions: AgencyInductionInput[];
  shadowing_records: ShadowingRecordInput[];
  handbook_acknowledgements: HandbookAcknowledgementInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type InductionOnboardingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface InductionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface InductionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffInductionOnboardingResult {
  induction_rating: InductionOnboardingRating;
  induction_score: number;
  headline: string;
  total_inductions: number;
  completion_rate: number;
  agency_induction_completion_rate: number;
  safeguarding_coverage_rate: number;
  medication_coverage_rate: number;
  fire_safety_coverage_rate: number;
  shadowing_completion_rate: number;
  shadowing_competency_rate: number;
  handbook_acknowledgement_rate: number;
  lone_working_readiness_rate: number;
  average_module_completion: number;
  strengths: string[];
  concerns: string[];
  recommendations: InductionRecommendation[];
  insights: InductionInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function toRating(score: number): InductionOnboardingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffInductionOnboarding(
  input: StaffInductionOnboardingInput,
): StaffInductionOnboardingResult {
  const {
    total_staff,
    staff_inductions,
    agency_inductions,
    shadowing_records,
    handbook_acknowledgements,
  } = input;

  const allEmpty =
    staff_inductions.length === 0 &&
    agency_inductions.length === 0 &&
    shadowing_records.length === 0 &&
    handbook_acknowledgements.length === 0;

  // ── Special case: all empty + 0 staff → insufficient_data ────────────
  if (allEmpty && total_staff === 0) {
    return {
      induction_rating: "insufficient_data",
      induction_score: 0,
      headline:
        "Insufficient data — no staff recorded and no induction records available.",
      total_inductions: 0,
      completion_rate: 0,
      agency_induction_completion_rate: 0,
      safeguarding_coverage_rate: 0,
      medication_coverage_rate: 0,
      fire_safety_coverage_rate: 0,
      shadowing_completion_rate: 0,
      shadowing_competency_rate: 0,
      handbook_acknowledgement_rate: 0,
      lone_working_readiness_rate: 0,
      average_module_completion: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Record staff induction and onboarding data to enable compliance analysis.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        },
      ],
      insights: [
        {
          text: "No staff or induction data available. Cannot assess induction and onboarding quality.",
          severity: "warning",
        },
      ],
    };
  }

  // ── Special case: all empty + staff > 0 → inadequate ─────────────────
  if (allEmpty && total_staff > 0) {
    return {
      induction_rating: "inadequate",
      induction_score: 15,
      headline:
        "Inadequate — staff exist but no induction, shadowing, or handbook records found.",
      total_inductions: 0,
      completion_rate: 0,
      agency_induction_completion_rate: 0,
      safeguarding_coverage_rate: 0,
      medication_coverage_rate: 0,
      fire_safety_coverage_rate: 0,
      shadowing_completion_rate: 0,
      shadowing_competency_rate: 0,
      handbook_acknowledgement_rate: 0,
      lone_working_readiness_rate: 0,
      average_module_completion: 0,
      strengths: [],
      concerns: [
        `${total_staff} staff recorded but no induction or onboarding records exist — Reg 33 requires all staff to receive a structured induction before working with children.`,
        "No agency induction records — agency staff must receive a home-specific induction on every placement.",
        "No shadowing records — staff competency and readiness for lone working cannot be evidenced.",
        "No handbook acknowledgement records — staff may not be aware of key policies and procedures.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured staff induction programme immediately — all staff must complete induction before working unsupervised with children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33",
        },
        {
          rank: 2,
          recommendation:
            "Establish an agency staff induction checklist covering safeguarding, medication, fire safety, children's needs, and house rules.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34",
        },
        {
          rank: 3,
          recommendation:
            "Introduce shadowing requirements for all new staff with mentor sign-off before lone working is permitted.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Sch 2",
        },
        {
          rank: 4,
          recommendation:
            "Ensure all staff read and sign the staff handbook covering key policies, safeguarding, behaviour management, and whistleblowing.",
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 33",
        },
      ],
      insights: [
        {
          text: `${total_staff} staff are recorded but there are no induction records whatsoever. Under Regulation 33, the registered person must ensure that all persons employed receive appropriate training, supervision, and appraisal. The absence of induction records represents a serious compliance failure that Ofsted will treat as a leadership and management shortfall.`,
          severity: "critical",
        },
      ],
    };
  }

  // ── Metric 1: Staff induction completion ─────────────────────────────
  const totalInductions = staff_inductions.length;
  const completedInductions = staff_inductions.filter(
    (i) => i.status === "completed",
  ).length;
  const overdueInductions = staff_inductions.filter(
    (i) => i.status === "overdue",
  ).length;
  const inProgressInductions = staff_inductions.filter(
    (i) => i.status === "in_progress",
  ).length;
  const notStartedInductions = staff_inductions.filter(
    (i) => i.status === "not_started",
  ).length;
  const completionRate = pct(completedInductions, totalInductions);

  // ── Metric 2: Agency induction completion ────────────────────────────
  const totalAgency = agency_inductions.length;
  const completedAgency = agency_inductions.filter(
    (a) => a.completed,
  ).length;
  const agencyCompletionRate = pct(completedAgency, totalAgency);

  // ── Metric 3: Safeguarding coverage ──────────────────────────────────
  // Counts across both permanent and agency inductions
  const permanentSafeguarding = staff_inductions.filter(
    (i) => i.safeguarding_covered,
  ).length;
  const agencySafeguarding = agency_inductions.filter(
    (a) => a.safeguarding_briefed,
  ).length;
  const totalInductionRecords = totalInductions + totalAgency;
  const safeguardingCoverage = pct(
    permanentSafeguarding + agencySafeguarding,
    totalInductionRecords,
  );

  // ── Metric 4: Medication coverage ────────────────────────────────────
  const permanentMedication = staff_inductions.filter(
    (i) => i.medication_covered,
  ).length;
  const agencyMedication = agency_inductions.filter(
    (a) => a.medication_briefed,
  ).length;
  const medicationCoverage = pct(
    permanentMedication + agencyMedication,
    totalInductionRecords,
  );

  // ── Metric 5: Fire safety coverage ───────────────────────────────────
  const permanentFire = staff_inductions.filter(
    (i) => i.fire_safety_covered,
  ).length;
  const agencyFire = agency_inductions.filter(
    (a) => a.fire_procedures_briefed,
  ).length;
  const fireSafetyCoverage = pct(
    permanentFire + agencyFire,
    totalInductionRecords,
  );

  // ── Metric 6: Shadowing completion & competency ──────────────────────
  const totalShadowing = shadowing_records.length;
  const competencyConfirmed = shadowing_records.filter(
    (s) => s.competency_confirmed,
  ).length;
  const shadowingCompletionRate = pct(totalShadowing, total_staff);
  const shadowingCompetencyRate = pct(competencyConfirmed, totalShadowing);

  // ── Metric 7: Lone working readiness ─────────────────────────────────
  const readyForLoneWorking = shadowing_records.filter(
    (s) => s.ready_for_lone_working,
  ).length;
  const loneWorkingReadiness = pct(readyForLoneWorking, totalShadowing);

  // ── Metric 8: Handbook acknowledgement ───────────────────────────────
  const totalHandbooks = handbook_acknowledgements.length;
  const signedHandbooks = handbook_acknowledgements.filter(
    (h) => h.signed,
  ).length;
  const handbookAckRate = pct(signedHandbooks, totalHandbooks);

  // ── Metric 9: Average module completion ──────────────────────────────
  const avgModuleCompletion =
    totalInductions > 0
      ? Math.round(
          staff_inductions.reduce((sum, i) => {
            const moduleRate =
              i.modules_total > 0
                ? (i.modules_completed / i.modules_total) * 100
                : 0;
            return sum + moduleRate;
          }, 0) / totalInductions,
        )
      : 0;

  // ── Metric 10: Additional agency metrics ─────────────────────────────
  const agencyChildrenBriefed = agency_inductions.filter(
    (a) => a.children_needs_briefed,
  ).length;
  const agencyHouseRulesBriefed = agency_inductions.filter(
    (a) => a.house_rules_briefed,
  ).length;
  const agencyEmergencyContacts = agency_inductions.filter(
    (a) => a.emergency_contacts_given,
  ).length;

  // ── Metric 11: Additional handbook metrics ───────────────────────────
  const safeguardingPolicyRead = handbook_acknowledgements.filter(
    (h) => h.safeguarding_policy_read,
  ).length;
  const behaviourMgmtRead = handbook_acknowledgements.filter(
    (h) => h.behaviour_management_read,
  ).length;
  const whistleblowingRead = handbook_acknowledgements.filter(
    (h) => h.whistleblowing_policy_read,
  ).length;
  const keyPoliciesRead = handbook_acknowledgements.filter(
    (h) => h.key_policies_read,
  ).length;

  // ── Metric 12: Children intro & policy review ────────────────────────
  const childrenIntroCompleted = staff_inductions.filter(
    (i) => i.children_intro_completed,
  ).length;
  const policyReviewCompleted = staff_inductions.filter(
    (i) => i.policy_review_completed,
  ).length;
  const signedOffCount = staff_inductions.filter(
    (i) => i.signed_off_by !== null,
  ).length;

  // ── Metric 13: Shadowing shift coverage ──────────────────────────────
  const uniqueShadowStaff = new Set(shadowing_records.map((s) => s.staff_id));
  const shiftTypes = new Set(shadowing_records.map((s) => s.shift_type));
  const totalShadowHours = shadowing_records.reduce(
    (sum, s) => sum + s.hours,
    0,
  );

  // ── Scoring (base 52, max bonuses ~28–30) ────────────────────────────
  let score = 52;

  // Bonus 1: Induction completion rate (+4 / +2)
  if (completionRate >= 100) score += 4;
  else if (completionRate >= 85) score += 2;

  // Bonus 2: Agency induction completion rate (+3 / +1)
  if (agencyCompletionRate >= 100) score += 3;
  else if (agencyCompletionRate >= 80) score += 1;

  // Bonus 3: Safeguarding coverage (+4 / +2)
  if (safeguardingCoverage >= 100) score += 4;
  else if (safeguardingCoverage >= 90) score += 2;

  // Bonus 4: Medication coverage (+3 / +1)
  if (medicationCoverage >= 100) score += 3;
  else if (medicationCoverage >= 85) score += 1;

  // Bonus 5: Fire safety coverage (+2 / +1)
  if (fireSafetyCoverage >= 100) score += 2;
  else if (fireSafetyCoverage >= 90) score += 1;

  // Bonus 6: Shadowing competency rate (+3 / +1)
  if (shadowingCompetencyRate >= 100) score += 3;
  else if (shadowingCompetencyRate >= 80) score += 1;

  // Bonus 7: Handbook acknowledgement rate (+3 / +1)
  if (handbookAckRate >= 100) score += 3;
  else if (handbookAckRate >= 85) score += 1;

  // Bonus 8: Lone working readiness (+3 / +1)
  if (loneWorkingReadiness >= 100) score += 3;
  else if (loneWorkingReadiness >= 80) score += 1;

  // Bonus 9: Average module completion (+3 / +1)
  if (avgModuleCompletion >= 95) score += 3;
  else if (avgModuleCompletion >= 80) score += 1;

  // Penalty 1: Safeguarding coverage < 50%
  if (safeguardingCoverage < 50) score -= 5;

  // Penalty 2: Completion rate < 50%
  if (completionRate < 50) score -= 5;

  // Penalty 3: Agency completion rate < 50%
  if (agencyCompletionRate < 50) score -= 5;

  // Penalty 4: Fire safety coverage < 70%
  if (fireSafetyCoverage < 70) score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (completionRate >= 100 && totalInductions > 0) {
    strengths.push(
      `All ${totalInductions} staff inductions completed — 100% completion demonstrates a rigorous onboarding process.`,
    );
  } else if (completionRate >= 85 && totalInductions > 0) {
    strengths.push(
      `${completionRate}% induction completion rate — the majority of staff have completed their structured induction.`,
    );
  }

  if (agencyCompletionRate >= 100 && totalAgency > 0) {
    strengths.push(
      `All ${totalAgency} agency staff inductions completed — agency workers are properly briefed before working with children.`,
    );
  } else if (agencyCompletionRate >= 80 && totalAgency > 0) {
    strengths.push(
      `${agencyCompletionRate}% agency induction completion rate — most agency staff receive a home-specific induction.`,
    );
  }

  if (safeguardingCoverage >= 100 && totalInductionRecords > 0) {
    strengths.push(
      "Safeguarding covered in 100% of inductions — every staff member and agency worker is briefed on safeguarding responsibilities.",
    );
  } else if (safeguardingCoverage >= 90 && totalInductionRecords > 0) {
    strengths.push(
      `Safeguarding coverage at ${safeguardingCoverage}% across inductions — strong safeguarding awareness during onboarding.`,
    );
  }

  if (medicationCoverage >= 100 && totalInductionRecords > 0) {
    strengths.push(
      "Medication procedures covered in all inductions — staff are prepared for safe medication administration.",
    );
  }

  if (fireSafetyCoverage >= 100 && totalInductionRecords > 0) {
    strengths.push(
      "Fire safety covered in all inductions — every staff member knows fire procedures from day one.",
    );
  }

  if (shadowingCompetencyRate >= 100 && totalShadowing > 0) {
    strengths.push(
      `All ${totalShadowing} shadowing records confirm competency — staff demonstrate readiness through supervised practice.`,
    );
  } else if (shadowingCompetencyRate >= 80 && totalShadowing > 0) {
    strengths.push(
      `${shadowingCompetencyRate}% of shadowing assessments confirm competency — most staff are demonstrating capability during shadowing.`,
    );
  }

  if (handbookAckRate >= 100 && totalHandbooks > 0) {
    strengths.push(
      `All ${totalHandbooks} handbook acknowledgements signed — staff are confirmed as having read key policies.`,
    );
  } else if (handbookAckRate >= 85 && totalHandbooks > 0) {
    strengths.push(
      `${handbookAckRate}% handbook acknowledgement rate — the majority of staff have read and signed the handbook.`,
    );
  }

  if (loneWorkingReadiness >= 100 && totalShadowing > 0) {
    strengths.push(
      "All shadowed staff assessed as ready for lone working — mentors confirm competency before unsupervised shifts.",
    );
  }

  if (avgModuleCompletion >= 95 && totalInductions > 0) {
    strengths.push(
      `Average module completion at ${avgModuleCompletion}% — staff are completing virtually all induction modules.`,
    );
  }

  if (
    signedOffCount === totalInductions &&
    totalInductions > 0 &&
    completedInductions === totalInductions
  ) {
    strengths.push(
      "All completed inductions have manager sign-off — evidencing management oversight of the induction process.",
    );
  }

  if (shiftTypes.size >= 3 && totalShadowing > 0) {
    strengths.push(
      `Shadowing covers ${shiftTypes.size} different shift types — staff experience a range of working patterns before lone working.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (overdueInductions > 0) {
    concerns.push(
      `${overdueInductions} staff induction${overdueInductions > 1 ? "s are" : " is"} overdue — Reg 33 requires timely completion of induction before unsupervised work.`,
    );
  }

  if (notStartedInductions > 0) {
    concerns.push(
      `${notStartedInductions} induction${notStartedInductions > 1 ? "s have" : " has"} not started — staff may be working without adequate preparation.`,
    );
  }

  if (completionRate < 50 && totalInductions > 0) {
    concerns.push(
      `Only ${completionRate}% of staff inductions completed — more than half of staff lack a completed induction programme.`,
    );
  }

  if (agencyCompletionRate < 50 && totalAgency > 0) {
    concerns.push(
      `Only ${agencyCompletionRate}% of agency inductions completed — agency staff may be working without adequate home-specific briefing.`,
    );
  }

  if (safeguardingCoverage < 50 && totalInductionRecords > 0) {
    concerns.push(
      `Safeguarding covered in only ${safeguardingCoverage}% of inductions — a critical gap that Ofsted will scrutinise under Reg 34.`,
    );
  } else if (
    safeguardingCoverage < 80 &&
    safeguardingCoverage >= 50 &&
    totalInductionRecords > 0
  ) {
    concerns.push(
      `Safeguarding coverage at ${safeguardingCoverage}% — not all staff are receiving safeguarding briefing during induction.`,
    );
  }

  if (medicationCoverage < 70 && totalInductionRecords > 0) {
    concerns.push(
      `Medication procedures covered in only ${medicationCoverage}% of inductions — staff may not be equipped for safe medication administration.`,
    );
  }

  if (fireSafetyCoverage < 70 && totalInductionRecords > 0) {
    concerns.push(
      `Fire safety covered in only ${fireSafetyCoverage}% of inductions — staff may not know evacuation procedures, breaching Reg 32.`,
    );
  }

  if (shadowingCompetencyRate < 50 && totalShadowing > 0) {
    concerns.push(
      `Only ${shadowingCompetencyRate}% of shadowing assessments confirm competency — significant proportion of staff not yet assessed as competent.`,
    );
  }

  if (loneWorkingReadiness < 50 && totalShadowing > 0) {
    concerns.push(
      `Only ${loneWorkingReadiness}% of shadowed staff assessed as ready for lone working — staff may be working unsupervised before they are competent.`,
    );
  }

  if (handbookAckRate < 50 && totalHandbooks > 0) {
    concerns.push(
      `Only ${handbookAckRate}% of handbook acknowledgements signed — staff may not be aware of key policies and procedures.`,
    );
  }

  if (avgModuleCompletion < 50 && totalInductions > 0) {
    concerns.push(
      `Average module completion is only ${avgModuleCompletion}% — staff are not completing enough of the induction programme.`,
    );
  }

  const unsignedInductions = completedInductions - signedOffCount;
  if (unsignedInductions > 0 && completedInductions > 0) {
    concerns.push(
      `${unsignedInductions} completed induction${unsignedInductions > 1 ? "s lack" : " lacks"} manager sign-off — management oversight of the induction process is incomplete.`,
    );
  }

  const incompleteAgency = totalAgency - completedAgency;
  if (incompleteAgency > 0) {
    const agencyChildrenGap = totalAgency - agencyChildrenBriefed;
    if (agencyChildrenGap > 0) {
      concerns.push(
        `${agencyChildrenGap} agency induction${agencyChildrenGap > 1 ? "s" : ""} did not include briefing on children's individual needs — agency staff may lack essential child-specific knowledge.`,
      );
    }
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: InductionRecommendation[] = [];
  let rank = 1;

  if (overdueInductions > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Complete ${overdueInductions} overdue staff induction${overdueInductions > 1 ? "s" : ""} immediately — no staff member should work unsupervised without a completed induction. This is a Reg 33 requirement.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (safeguardingCoverage < 80 && totalInductionRecords > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase safeguarding coverage from ${safeguardingCoverage}% to 100% — every induction must include safeguarding awareness. Reg 34 requires staff to be fit, which includes safeguarding competence.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34",
    });
  }

  if (agencyCompletionRate < 80 && totalAgency > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve agency induction completion from ${agencyCompletionRate}% — all agency staff must receive a home-specific induction before working with children. Use a standardised agency induction checklist.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (fireSafetyCoverage < 90 && totalInductionRecords > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve fire safety coverage from ${fireSafetyCoverage}% — every staff member and agency worker must know fire procedures. Reg 32 requires the premises to be safe, which depends on staff knowing evacuation routes.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32",
    });
  }

  if (completionRate < 85 && totalInductions > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase staff induction completion rate from ${completionRate}% — target 100% within the first two weeks of employment. Sch 2 requires evidence that workers have received appropriate induction.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (medicationCoverage < 85 && totalInductionRecords > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase medication coverage from ${medicationCoverage}% — all staff must understand medication procedures before administering or witnessing medication.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34",
    });
  }

  if (shadowingCompetencyRate < 80 && totalShadowing > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review shadowing programme — only ${shadowingCompetencyRate}% confirm competency. Extend shadowing periods or provide additional mentoring support for staff not yet meeting the standard.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (loneWorkingReadiness < 80 && totalShadowing > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Address lone working readiness — only ${loneWorkingReadiness}% of shadowed staff are confirmed ready. No staff should work lone shifts until competency is verified by a mentor.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34",
    });
  }

  if (handbookAckRate < 85 && totalHandbooks > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve handbook acknowledgement rate from ${handbookAckRate}% — all staff must read and sign the handbook as part of induction. Include safeguarding, behaviour management, and whistleblowing policies.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (notStartedInductions > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Initiate ${notStartedInductions} outstanding induction${notStartedInductions > 1 ? "s" : ""} — ensure the induction programme starts from the first day of employment as required by Sch 2.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Sch 2",
    });
  }

  if (avgModuleCompletion < 80 && totalInductions > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Average module completion is ${avgModuleCompletion}% — review induction module structure and allocate protected time for staff to complete all required modules.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (totalShadowing > 0 && shiftTypes.size < 3) {
    recs.push({
      rank: rank++,
      recommendation: `Shadowing currently covers only ${shiftTypes.size} shift type${shiftTypes.size > 1 ? "s" : ""} — consider expanding to include day, evening, and night/sleep-in shifts so staff experience the full range of care demands.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  if (unsignedInductions > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Ensure manager sign-off on ${unsignedInductions} completed induction${unsignedInductions > 1 ? "s" : ""} — management oversight of induction completion is essential for evidencing compliance.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: InductionInsight[] = [];

  // Critical insights
  if (safeguardingCoverage < 50 && totalInductionRecords > 0) {
    insights.push({
      text: `Safeguarding is covered in fewer than half of all inductions (${safeguardingCoverage}%). This is a serious deficiency. Under Regulation 34, the registered person must ensure staff are fit to work with children, and safeguarding awareness is fundamental to fitness. Ofsted will view this as a significant leadership failure.`,
      severity: "critical",
    });
  }

  if (overdueInductions >= 3) {
    insights.push({
      text: `${overdueInductions} staff inductions are overdue. A pattern of overdue inductions suggests systemic problems with induction planning and resource allocation. Ofsted inspectors will ask to see evidence that all staff received a thorough induction before working unsupervised.`,
      severity: "critical",
    });
  } else if (overdueInductions > 0) {
    insights.push({
      text: `${overdueInductions} staff induction${overdueInductions > 1 ? "s are" : " is"} overdue — address promptly to ensure all staff are properly prepared before unsupervised working.`,
      severity: "warning",
    });
  }

  if (completionRate < 50 && totalInductions > 0) {
    insights.push({
      text: `Fewer than half of staff inductions are completed (${completionRate}%). This means the majority of staff may be working without having gone through the full induction programme. Regulation 33 requires staff to be suitably trained, and the induction is the foundation of that training.`,
      severity: "critical",
    });
  }

  if (
    agencyCompletionRate < 50 &&
    totalAgency > 0
  ) {
    insights.push({
      text: `Agency induction completion is critically low at ${agencyCompletionRate}%. Agency staff present a higher safeguarding risk as they are less familiar with the home, the children, and the specific procedures. Every agency worker must receive a home-specific induction on every placement.`,
      severity: "critical",
    });
  }

  // Warning insights
  if (
    loneWorkingReadiness < 50 &&
    totalShadowing > 0
  ) {
    insights.push({
      text: `Only ${loneWorkingReadiness}% of shadowed staff are assessed as ready for lone working. If staff are working unsupervised before being confirmed ready, this creates a safeguarding risk. Review shift rotas to ensure no unconfirmed staff are working lone shifts.`,
      severity: "warning",
    });
  }

  if (handbookAckRate < 50 && totalHandbooks > 0) {
    insights.push({
      text: `Handbook acknowledgement rate is only ${handbookAckRate}%. Staff who have not read and signed the handbook may not understand key policies including safeguarding, behaviour management, and whistleblowing procedures. This weakens the home's compliance position.`,
      severity: "warning",
    });
  }

  if (
    medicationCoverage < 70 &&
    totalInductionRecords > 0
  ) {
    insights.push({
      text: `Medication procedures are covered in only ${medicationCoverage}% of inductions. Staff who have not been briefed on medication protocols may make errors in administration, storage, or recording. This is a health and safety concern that Ofsted will investigate.`,
      severity: "warning",
    });
  }

  if (
    fireSafetyCoverage < 70 &&
    totalInductionRecords > 0
  ) {
    insights.push({
      text: `Fire safety is covered in only ${fireSafetyCoverage}% of inductions. Under Regulation 32, the home must ensure premises safety, and this depends on all staff knowing fire procedures. Staff who are not briefed on evacuation routes and fire protocols represent a risk to children.`,
      severity: "warning",
    });
  }

  if (totalShadowing > 0 && uniqueShadowStaff.size < total_staff && total_staff > 0) {
    const unshadowed = total_staff - uniqueShadowStaff.size;
    if (unshadowed > 0) {
      insights.push({
        text: `${unshadowed} staff member${unshadowed > 1 ? "s have" : " has"} no shadowing records. Shadowing is a critical step in evidencing staff competency before independent working. Consider whether these staff are working unsupervised without documented mentoring.`,
        severity: "warning",
      });
    }
  }

  // Positive insights
  if (
    completionRate >= 100 &&
    agencyCompletionRate >= 100 &&
    safeguardingCoverage >= 100 &&
    handbookAckRate >= 100 &&
    totalInductionRecords > 0
  ) {
    insights.push({
      text: `Exemplary induction and onboarding: 100% induction completion, 100% agency induction completion, universal safeguarding coverage, and full handbook acknowledgement. This demonstrates a home that takes onboarding seriously and ensures every staff member and agency worker is thoroughly prepared before working with children. Well-placed for positive Ofsted findings on leadership and management.`,
      severity: "positive",
    });
  } else if (
    completionRate >= 85 &&
    safeguardingCoverage >= 90 &&
    shadowingCompetencyRate >= 80 &&
    totalInductionRecords > 0
  ) {
    insights.push({
      text: `Good induction framework in place — ${completionRate}% completion, ${safeguardingCoverage}% safeguarding coverage, and ${shadowingCompetencyRate}% shadowing competency confirmation. Minor improvements could elevate this to outstanding practice.`,
      severity: "positive",
    });
  }

  if (
    totalShadowing > 0 &&
    totalShadowHours > 0 &&
    loneWorkingReadiness >= 80
  ) {
    const avgHours =
      totalShadowing > 0
        ? Math.round(totalShadowHours / totalShadowing)
        : 0;
    if (avgHours >= 8) {
      insights.push({
        text: `Shadowing programme is robust — averaging ${avgHours} hours per staff member with ${loneWorkingReadiness}% lone working readiness. This provides strong evidence that staff are properly prepared through supervised practice.`,
        severity: "positive",
      });
    }
  }

  if (
    totalHandbooks > 0 &&
    safeguardingPolicyRead === totalHandbooks &&
    behaviourMgmtRead === totalHandbooks &&
    whistleblowingRead === totalHandbooks
  ) {
    insights.push({
      text: "All staff have confirmed reading the safeguarding, behaviour management, and whistleblowing policies — critical policy awareness is universal across the team.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding induction and onboarding — ${completionRate}% completion, ${safeguardingCoverage}% safeguarding coverage, ${shadowingCompetencyRate}% shadowing competency across ${totalInductionRecords} induction records.`;
  } else if (rating === "good") {
    const issues: string[] = [];
    if (overdueInductions > 0)
      issues.push(`${overdueInductions} overdue induction${overdueInductions > 1 ? "s" : ""}`);
    if (agencyCompletionRate < 100 && totalAgency > 0)
      issues.push(`agency completion at ${agencyCompletionRate}%`);
    if (handbookAckRate < 100 && totalHandbooks > 0)
      issues.push(`handbook acknowledgement at ${handbookAckRate}%`);
    headline =
      issues.length > 0
        ? `Good induction and onboarding practice — attention needed on ${issues.join(", ")}.`
        : "Good staff induction and onboarding — processes are well-established across key areas.";
  } else if (rating === "adequate") {
    headline =
      "Adequate induction practice — gaps in completion, safeguarding coverage, or shadowing require focused improvement.";
  } else {
    headline =
      "Induction and onboarding is inadequate — statutory requirements under Reg 33/34 are unmet and children may be at risk from unprepared staff.";
  }

  // ── Return ────────────────────────────────────────────────────────────
  return {
    induction_rating: rating,
    induction_score: score,
    headline,
    total_inductions: totalInductionRecords,
    completion_rate: completionRate,
    agency_induction_completion_rate: agencyCompletionRate,
    safeguarding_coverage_rate: safeguardingCoverage,
    medication_coverage_rate: medicationCoverage,
    fire_safety_coverage_rate: fireSafetyCoverage,
    shadowing_completion_rate: shadowingCompletionRate,
    shadowing_competency_rate: shadowingCompetencyRate,
    handbook_acknowledgement_rate: handbookAckRate,
    lone_working_readiness_rate: loneWorkingReadiness,
    average_module_completion: avgModuleCompletion,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
