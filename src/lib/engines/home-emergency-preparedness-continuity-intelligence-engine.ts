// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMERGENCY PREPAREDNESS & BUSINESS CONTINUITY ENGINE
// Evaluates the home's readiness for emergencies and business continuity:
// fire drill compliance, evacuation plan currency, emergency contact accuracy,
// business continuity planning, first aid coverage, and emergency equipment
// maintenance.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Fire precautions), Reg 40 (Notification of significant events),
// Reg 5 (Registered person: fitness), SCCIF: "Safety and well-being".
// Store keys: fireDrillRecords, evacuationPlans, emergencyContacts,
//             businessContinuityPlans, firstAidRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FireDrillRecordInput {
  id: string;
  drill_date: string;
  drill_type: "day" | "night" | "weekend" | "unannounced";
  all_children_participated: boolean;
  all_staff_participated: boolean;
  evacuation_time_seconds: number;
  target_evacuation_time_seconds: number;
  issues_identified: string[];
  issues_resolved: boolean;
  debrief_completed: boolean;
  debrief_notes: string | null;
  next_drill_due: string | null;
  conducted_by: string;
  created_at: string;
}

export interface EvacuationPlanInput {
  id: string;
  plan_name: string;
  plan_type: "fire" | "flood" | "gas_leak" | "intruder" | "chemical" | "general";
  last_reviewed: string;
  review_due: string;
  approved_by: string | null;
  is_current: boolean;
  covers_all_exits: boolean;
  includes_assembly_point: boolean;
  includes_roll_call_procedure: boolean;
  includes_vulnerable_children_provisions: boolean;
  displayed_in_home: boolean;
  staff_trained_on_plan: boolean;
  children_briefed: boolean;
  created_at: string;
}

export interface EmergencyContactInput {
  id: string;
  contact_type: "police" | "fire_service" | "ambulance" | "hospital" | "social_worker" | "ofsted" | "local_authority" | "utility" | "on_call_manager" | "registered_manager" | "maintenance" | "other";
  contact_name: string;
  phone_number: string;
  email: string | null;
  verified: boolean;
  last_verified_date: string | null;
  verification_due: string | null;
  is_current: boolean;
  notes: string | null;
  created_at: string;
}

export interface BusinessContinuityPlanInput {
  id: string;
  plan_name: string;
  scenario: "pandemic" | "staff_shortage" | "building_damage" | "utility_failure" | "cyber_attack" | "extreme_weather" | "regulatory_action" | "other";
  last_reviewed: string;
  review_due: string;
  approved_by: string | null;
  is_current: boolean;
  tested: boolean;
  last_tested_date: string | null;
  includes_communication_plan: boolean;
  includes_alternative_accommodation: boolean;
  includes_data_backup: boolean;
  includes_staffing_contingency: boolean;
  staff_aware: boolean;
  created_at: string;
}

export interface FirstAidRecordInput {
  id: string;
  record_type: "certificate" | "equipment_check" | "training" | "incident";
  staff_id: string | null;
  staff_name: string | null;
  certificate_type: string | null;
  certificate_expiry: string | null;
  is_current: boolean;
  equipment_name: string | null;
  equipment_location: string | null;
  equipment_checked: boolean;
  equipment_check_date: string | null;
  equipment_next_check_due: string | null;
  equipment_in_date: boolean;
  items_replaced: string[];
  training_date: string | null;
  training_provider: string | null;
  created_at: string;
}

export interface EmergencyPreparednessContinuityInput {
  today: string;
  total_children: number;
  fire_drill_records: FireDrillRecordInput[];
  evacuation_plans: EvacuationPlanInput[];
  emergency_contacts: EmergencyContactInput[];
  business_continuity_plans: BusinessContinuityPlanInput[];
  first_aid_records: FirstAidRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type EmergencyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface EmergencyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface EmergencyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EmergencyPreparednessContinuityResult {
  emergency_rating: EmergencyRating;
  emergency_score: number;
  headline: string;
  fire_drill_compliance_rate: number;
  evacuation_plan_currency_rate: number;
  emergency_contact_accuracy_rate: number;
  business_continuity_score: number;
  first_aid_coverage_rate: number;
  equipment_maintenance_rate: number;
  total_drills: number;
  total_evacuation_plans: number;
  total_emergency_contacts: number;
  total_continuity_plans: number;
  total_first_aid_records: number;
  strengths: string[];
  concerns: string[];
  recommendations: EmergencyRecommendation[];
  insights: EmergencyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): EmergencyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: EmergencyRating,
  score: number,
  headline: string,
): EmergencyPreparednessContinuityResult {
  return {
    emergency_rating: rating,
    emergency_score: score,
    headline,
    fire_drill_compliance_rate: 0,
    evacuation_plan_currency_rate: 0,
    emergency_contact_accuracy_rate: 0,
    business_continuity_score: 0,
    first_aid_coverage_rate: 0,
    equipment_maintenance_rate: 0,
    total_drills: 0,
    total_evacuation_plans: 0,
    total_emergency_contacts: 0,
    total_continuity_plans: 0,
    total_first_aid_records: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeEmergencyPreparednessContinuity(
  input: EmergencyPreparednessContinuityInput,
): EmergencyPreparednessContinuityResult {
  const {
    today,
    total_children,
    fire_drill_records,
    evacuation_plans,
    emergency_contacts,
    business_continuity_plans,
    first_aid_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    fire_drill_records.length === 0 &&
    evacuation_plans.length === 0 &&
    emergency_contacts.length === 0 &&
    business_continuity_plans.length === 0 &&
    first_aid_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess emergency preparedness and business continuity.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No emergency preparedness or business continuity data recorded despite children on placement — fire safety, evacuation planning, and emergency readiness require urgent attention.",
      ),
      concerns: [
        "No fire drill records, evacuation plans, emergency contacts, business continuity plans, or first aid records exist despite children being on placement — the home cannot evidence compliance with fire safety regulations or emergency preparedness.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately implement a fire drill schedule with documented records of all drills, including evacuation times, participation, and debrief outcomes. Fire drills must be conducted regularly and cover day, night, and unannounced scenarios.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
        },
        {
          rank: 2,
          recommendation:
            "Develop and display evacuation plans for all emergency scenarios, ensure emergency contacts are documented and verified, and create business continuity plans covering staffing, accommodation, and communication contingencies.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness",
        },
      ],
      insights: [
        {
          text: "The complete absence of emergency preparedness records means Ofsted cannot verify that children are safe in an emergency. This represents a fundamental gap in Reg 25 compliance (fire precautions) and may indicate the home is not meeting its duty of care for the safety and well-being of children.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Fire drill metrics ---
  const totalDrills = fire_drill_records.length;

  // Compliance = drills where all children participated AND evacuation within target
  const compliantDrills = fire_drill_records.filter(
    (d) =>
      d.all_children_participated &&
      d.evacuation_time_seconds <= d.target_evacuation_time_seconds,
  ).length;
  const fireDrillComplianceRate = pct(compliantDrills, totalDrills);

  // Drill type coverage: how many of the 4 types have been covered
  const drillTypesCovered = new Set(fire_drill_records.map((d) => d.drill_type)).size;
  const drillTypeCoverageRate = pct(drillTypesCovered, 4);

  // Drills with debrief completed
  const drillsWithDebrief = fire_drill_records.filter((d) => d.debrief_completed).length;
  const drillDebriefRate = pct(drillsWithDebrief, totalDrills);

  // Drills with all staff participation
  const drillsAllStaff = fire_drill_records.filter((d) => d.all_staff_participated).length;
  const staffDrillParticipationRate = pct(drillsAllStaff, totalDrills);

  // Drills with issues that were subsequently resolved
  const drillsWithIssues = fire_drill_records.filter(
    (d) => d.issues_identified.length > 0,
  ).length;
  const drillsWithIssuesResolved = fire_drill_records.filter(
    (d) => d.issues_identified.length > 0 && d.issues_resolved,
  ).length;
  const drillIssueResolutionRate = pct(drillsWithIssuesResolved, drillsWithIssues);

  // Average evacuation time compared to target
  const avgEvacTime =
    totalDrills > 0
      ? Math.round(
          fire_drill_records.reduce((sum, d) => sum + d.evacuation_time_seconds, 0) /
            totalDrills,
        )
      : 0;
  const avgTargetTime =
    totalDrills > 0
      ? Math.round(
          fire_drill_records.reduce(
            (sum, d) => sum + d.target_evacuation_time_seconds,
            0,
          ) / totalDrills,
        )
      : 0;

  // Check if most recent drill is overdue (> 30 days ago)
  const sortedDrills = [...fire_drill_records].sort(
    (a, b) => new Date(b.drill_date).getTime() - new Date(a.drill_date).getTime(),
  );
  const lastDrillDate = sortedDrills.length > 0 ? sortedDrills[0].drill_date : null;
  const daysSinceLastDrill = lastDrillDate ? daysBetween(lastDrillDate, today) : -1;
  const drillOverdue = daysSinceLastDrill > 30 && totalDrills > 0;

  // Night drills in last 6 months
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);
  const recentNightDrills = fire_drill_records.filter(
    (d) => d.drill_type === "night" && d.drill_date >= sixMonthsAgoStr,
  ).length;

  // Unannounced drills in last 6 months
  const recentUnannouncedDrills = fire_drill_records.filter(
    (d) => d.drill_type === "unannounced" && d.drill_date >= sixMonthsAgoStr,
  ).length;

  // --- Evacuation plan metrics ---
  const totalEvacPlans = evacuation_plans.length;

  // Current plans (not past review_due and is_current)
  const currentPlans = evacuation_plans.filter(
    (p) => p.is_current && p.review_due >= today,
  ).length;
  const evacuationPlanCurrencyRate = pct(currentPlans, totalEvacPlans);

  // Plans covering all critical elements
  const comprehensivePlans = evacuation_plans.filter(
    (p) =>
      p.covers_all_exits &&
      p.includes_assembly_point &&
      p.includes_roll_call_procedure &&
      p.includes_vulnerable_children_provisions,
  ).length;
  const planComprehensivenessRate = pct(comprehensivePlans, totalEvacPlans);

  // Plans displayed in home
  const displayedPlans = evacuation_plans.filter((p) => p.displayed_in_home).length;
  const planDisplayRate = pct(displayedPlans, totalEvacPlans);

  // Staff trained on plans
  const staffTrainedPlans = evacuation_plans.filter((p) => p.staff_trained_on_plan).length;
  const staffTrainedOnPlansRate = pct(staffTrainedPlans, totalEvacPlans);

  // Children briefed on plans
  const childrenBriefedPlans = evacuation_plans.filter((p) => p.children_briefed).length;
  const childrenBriefedRate = pct(childrenBriefedPlans, totalEvacPlans);

  // Plans with approval
  const approvedPlans = evacuation_plans.filter(
    (p) => p.approved_by !== null && p.approved_by !== "",
  ).length;
  const planApprovalRate = pct(approvedPlans, totalEvacPlans);

  // Plan type coverage
  const planTypesCovered = new Set(evacuation_plans.map((p) => p.plan_type)).size;
  const planTypesTotal = 6; // fire, flood, gas_leak, intruder, chemical, general
  const planTypeCoverageRate = pct(planTypesCovered, planTypesTotal);

  // Plans overdue for review
  const plansOverdue = evacuation_plans.filter(
    (p) => p.review_due < today,
  ).length;
  const plansOverdueRate = pct(plansOverdue, totalEvacPlans);

  // --- Emergency contact metrics ---
  const totalContacts = emergency_contacts.length;

  // Verified and current contacts
  const verifiedCurrentContacts = emergency_contacts.filter(
    (c) => c.verified && c.is_current,
  ).length;
  const emergencyContactAccuracyRate = pct(verifiedCurrentContacts, totalContacts);

  // Contacts overdue for verification
  const contactsOverdue = emergency_contacts.filter(
    (c) => c.verification_due !== null && c.verification_due < today,
  ).length;
  const contactsOverdueRate = pct(contactsOverdue, totalContacts);

  // Essential contact types coverage
  const essentialTypes = ["police", "fire_service", "ambulance", "hospital", "social_worker", "ofsted", "on_call_manager", "registered_manager"];
  const coveredEssentialTypes = essentialTypes.filter((type) =>
    emergency_contacts.some((c) => c.contact_type === type && c.is_current),
  ).length;
  const essentialCoverageRate = pct(coveredEssentialTypes, essentialTypes.length);

  // Recently verified contacts (within 90 days)
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);
  const recentlyVerified = emergency_contacts.filter(
    (c) =>
      c.last_verified_date !== null && c.last_verified_date >= ninetyDaysAgoStr,
  ).length;
  const recentVerificationRate = pct(recentlyVerified, totalContacts);

  // --- Business continuity metrics ---
  const totalContinuityPlans = business_continuity_plans.length;

  // Current and approved
  const currentContinuityPlans = business_continuity_plans.filter(
    (p) => p.is_current && p.review_due >= today,
  ).length;
  const continuityPlanCurrencyRate = pct(currentContinuityPlans, totalContinuityPlans);

  // Tested plans
  const testedPlans = business_continuity_plans.filter((p) => p.tested).length;
  const planTestingRate = pct(testedPlans, totalContinuityPlans);

  // Plans with communication plan
  const plansWithComms = business_continuity_plans.filter(
    (p) => p.includes_communication_plan,
  ).length;
  const commsPlanRate = pct(plansWithComms, totalContinuityPlans);

  // Plans with alternative accommodation
  const plansWithAccomm = business_continuity_plans.filter(
    (p) => p.includes_alternative_accommodation,
  ).length;
  const altAccommRate = pct(plansWithAccomm, totalContinuityPlans);

  // Plans with data backup
  const plansWithBackup = business_continuity_plans.filter(
    (p) => p.includes_data_backup,
  ).length;
  const dataBackupRate = pct(plansWithBackup, totalContinuityPlans);

  // Plans with staffing contingency
  const plansWithStaffing = business_continuity_plans.filter(
    (p) => p.includes_staffing_contingency,
  ).length;
  const staffingContingencyRate = pct(plansWithStaffing, totalContinuityPlans);

  // Staff awareness
  const staffAwarePlans = business_continuity_plans.filter(
    (p) => p.staff_aware,
  ).length;
  const staffAwarenessRate = pct(staffAwarePlans, totalContinuityPlans);

  // Business continuity composite score (average of key components)
  const bcpComponents = totalContinuityPlans > 0
    ? [continuityPlanCurrencyRate, planTestingRate, commsPlanRate, altAccommRate, dataBackupRate, staffingContingencyRate, staffAwarenessRate]
    : [];
  const businessContinuityScore = bcpComponents.length > 0
    ? Math.round(bcpComponents.reduce((s, v) => s + v, 0) / bcpComponents.length)
    : 0;

  // Scenario coverage
  const scenariosCovered = new Set(business_continuity_plans.map((p) => p.scenario)).size;
  const scenariosTotal = 8; // pandemic, staff_shortage, building_damage, utility_failure, cyber_attack, extreme_weather, regulatory_action, other
  const scenarioCoverageRate = pct(scenariosCovered, scenariosTotal);

  // Continuity plans overdue for review
  const continuityPlansOverdue = business_continuity_plans.filter(
    (p) => p.review_due < today,
  ).length;
  const continuityOverdueRate = pct(continuityPlansOverdue, totalContinuityPlans);

  // --- First aid metrics ---
  const totalFirstAidRecords = first_aid_records.length;

  // Certificate records
  const certificateRecords = first_aid_records.filter(
    (r) => r.record_type === "certificate",
  );
  const currentCertificates = certificateRecords.filter(
    (r) => r.is_current && r.certificate_expiry !== null && r.certificate_expiry >= today,
  ).length;
  const certificateCurrencyRate = pct(currentCertificates, certificateRecords.length);

  // Unique staff with current certificates
  const staffWithCerts = new Set(
    certificateRecords
      .filter(
        (r) => r.is_current && r.certificate_expiry !== null && r.certificate_expiry >= today && r.staff_id,
      )
      .map((r) => r.staff_id),
  ).size;

  // First aid coverage rate (certificates that are current)
  const firstAidCoverageRate = pct(currentCertificates, certificateRecords.length > 0 ? certificateRecords.length : 0);

  // Expiring soon (within 30 days)
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysFromNowStr = thirtyDaysFromNow.toISOString().slice(0, 10);
  const expiringCerts = certificateRecords.filter(
    (r) =>
      r.certificate_expiry !== null &&
      r.certificate_expiry >= today &&
      r.certificate_expiry <= thirtyDaysFromNowStr,
  ).length;

  // Equipment records
  const equipmentRecords = first_aid_records.filter(
    (r) => r.record_type === "equipment_check",
  );
  const checkedEquipment = equipmentRecords.filter(
    (r) => r.equipment_checked && r.equipment_in_date,
  ).length;
  const equipmentMaintenanceRate = pct(checkedEquipment, equipmentRecords.length);

  // Equipment overdue for check
  const equipmentOverdue = equipmentRecords.filter(
    (r) =>
      r.equipment_next_check_due !== null && r.equipment_next_check_due < today,
  ).length;
  const equipmentOverdueRate = pct(equipmentOverdue, equipmentRecords.length);

  // Training records
  const trainingRecords = first_aid_records.filter(
    (r) => r.record_type === "training",
  );
  const recentTraining = trainingRecords.filter((r) => {
    if (!r.training_date) return false;
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    return r.training_date >= twelveMonthsAgo.toISOString().slice(0, 10);
  }).length;
  const trainingCurrencyRate = pct(recentTraining, trainingRecords.length);

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // 9 bonus categories summing to exactly 28 (max 80 = outstanding)

  let score = 52;

  // --- Bonus 1: fireDrillComplianceRate (>=90: +4, >=70: +2) --- [max 4]
  if (fireDrillComplianceRate >= 90) score += 4;
  else if (fireDrillComplianceRate >= 70) score += 2;

  // --- Bonus 2: evacuationPlanCurrencyRate (>=100: +4, >=80: +2) --- [max 4]
  if (evacuationPlanCurrencyRate >= 100) score += 4;
  else if (evacuationPlanCurrencyRate >= 80) score += 2;

  // --- Bonus 3: emergencyContactAccuracyRate (>=100: +3, >=80: +1) --- [max 3]
  if (emergencyContactAccuracyRate >= 100) score += 3;
  else if (emergencyContactAccuracyRate >= 80) score += 1;

  // --- Bonus 4: businessContinuityScore (>=80: +3, >=60: +1) --- [max 3]
  if (businessContinuityScore >= 80) score += 3;
  else if (businessContinuityScore >= 60) score += 1;

  // --- Bonus 5: firstAidCoverageRate (>=100: +3, >=80: +1) --- [max 3]
  if (firstAidCoverageRate >= 100) score += 3;
  else if (firstAidCoverageRate >= 80) score += 1;

  // --- Bonus 6: equipmentMaintenanceRate (>=100: +3, >=80: +1) --- [max 3]
  if (equipmentMaintenanceRate >= 100) score += 3;
  else if (equipmentMaintenanceRate >= 80) score += 1;

  // --- Bonus 7: drillDebriefRate (>=90: +2, >=70: +1) --- [max 2]
  if (drillDebriefRate >= 90) score += 2;
  else if (drillDebriefRate >= 70) score += 1;

  // --- Bonus 8: planComprehensivenessRate (>=90: +3, >=70: +1) --- [max 3]
  if (planComprehensivenessRate >= 90) score += 3;
  else if (planComprehensivenessRate >= 70) score += 1;

  // --- Bonus 9: essentialCoverageRate (>=100: +3, >=75: +1) --- [max 3]
  if (essentialCoverageRate >= 100) score += 3;
  else if (essentialCoverageRate >= 75) score += 1;

  // Total max bonuses: 4+4+3+3+3+3+2+3+3 = 28
  // Max score: 52 + 28 = 80

  // ── Penalties ─────────────────────────────────────────────────────────

  // fireDrillComplianceRate < 50 → -5 (guard: totalDrills > 0)
  if (fireDrillComplianceRate < 50 && totalDrills > 0) score -= 5;

  // evacuationPlanCurrencyRate < 50 → -5 (guard: totalEvacPlans > 0)
  if (evacuationPlanCurrencyRate < 50 && totalEvacPlans > 0) score -= 5;

  // emergencyContactAccuracyRate < 50 → -4 (guard: totalContacts > 0)
  if (emergencyContactAccuracyRate < 50 && totalContacts > 0) score -= 4;

  // equipmentMaintenanceRate < 50 → -4 (guard: equipmentRecords.length > 0)
  if (equipmentMaintenanceRate < 50 && equipmentRecords.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const emergency_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Fire drill compliance strengths
  if (fireDrillComplianceRate >= 100 && totalDrills > 0) {
    strengths.push(
      "Every fire drill fully compliant — all children participated and evacuation completed within target times, demonstrating excellent fire safety practice.",
    );
  } else if (fireDrillComplianceRate >= 80 && totalDrills > 0) {
    strengths.push(
      `${fireDrillComplianceRate}% fire drill compliance — the majority of drills meet full participation and target evacuation time requirements.`,
    );
  }

  // Drill type coverage
  if (drillTypesCovered >= 4 && totalDrills > 0) {
    strengths.push(
      "Fire drills cover all four scenario types (day, night, weekend, unannounced) — comprehensive drill programme demonstrating thorough emergency preparedness.",
    );
  } else if (drillTypesCovered >= 3 && totalDrills > 0) {
    strengths.push(
      `Fire drills cover ${drillTypesCovered} of 4 scenario types — strong variety in drill coverage.`,
    );
  }

  // Drill debrief
  if (drillDebriefRate >= 100 && totalDrills > 0) {
    strengths.push(
      "Debrief completed after every fire drill — the home consistently reviews drill outcomes to identify and address issues.",
    );
  } else if (drillDebriefRate >= 80 && totalDrills > 0) {
    strengths.push(
      `${drillDebriefRate}% debrief completion rate — the home regularly reviews drill outcomes for continuous improvement.`,
    );
  }

  // Staff drill participation
  if (staffDrillParticipationRate >= 100 && totalDrills > 0) {
    strengths.push(
      "All staff participated in every fire drill — the entire team is practised in evacuation procedures.",
    );
  } else if (staffDrillParticipationRate >= 80 && totalDrills > 0) {
    strengths.push(
      `${staffDrillParticipationRate}% staff participation rate in fire drills — strong staff engagement in emergency preparedness.`,
    );
  }

  // Drill issue resolution
  if (drillIssueResolutionRate >= 100 && drillsWithIssues > 0) {
    strengths.push(
      "All issues identified during fire drills have been resolved — the home acts on drill findings to improve safety.",
    );
  } else if (drillIssueResolutionRate >= 80 && drillsWithIssues > 0) {
    strengths.push(
      `${drillIssueResolutionRate}% of drill issues resolved — the home generally addresses safety concerns identified during drills.`,
    );
  }

  // Night and unannounced drills
  if (recentNightDrills >= 1 && recentUnannouncedDrills >= 1) {
    strengths.push(
      "Both night and unannounced drills conducted within the last 6 months — the home tests emergency readiness under realistic conditions.",
    );
  }

  // Evacuation plan currency
  if (evacuationPlanCurrencyRate >= 100 && totalEvacPlans > 0) {
    strengths.push(
      "All evacuation plans are current and within review date — comprehensive, up-to-date emergency documentation.",
    );
  } else if (evacuationPlanCurrencyRate >= 80 && totalEvacPlans > 0) {
    strengths.push(
      `${evacuationPlanCurrencyRate}% of evacuation plans are current — strong plan maintenance.`,
    );
  }

  // Plan comprehensiveness
  if (planComprehensivenessRate >= 100 && totalEvacPlans > 0) {
    strengths.push(
      "Every evacuation plan covers all exits, assembly points, roll call procedures, and vulnerable children provisions — plans are fully comprehensive.",
    );
  } else if (planComprehensivenessRate >= 80 && totalEvacPlans > 0) {
    strengths.push(
      `${planComprehensivenessRate}% of evacuation plans include all critical elements — strong plan comprehensiveness.`,
    );
  }

  // Plans displayed
  if (planDisplayRate >= 100 && totalEvacPlans > 0) {
    strengths.push(
      "All evacuation plans displayed in the home — children and staff can reference them immediately in an emergency.",
    );
  } else if (planDisplayRate >= 80 && totalEvacPlans > 0) {
    strengths.push(
      `${planDisplayRate}% of evacuation plans displayed — good visibility of emergency procedures.`,
    );
  }

  // Staff trained on plans
  if (staffTrainedOnPlansRate >= 100 && totalEvacPlans > 0) {
    strengths.push(
      "Staff trained on every evacuation plan — the team is fully prepared to implement emergency procedures.",
    );
  } else if (staffTrainedOnPlansRate >= 80 && totalEvacPlans > 0) {
    strengths.push(
      `${staffTrainedOnPlansRate}% staff training coverage on evacuation plans — strong staff preparedness.`,
    );
  }

  // Children briefed
  if (childrenBriefedRate >= 100 && totalEvacPlans > 0) {
    strengths.push(
      "Children briefed on every evacuation plan — children know what to do in an emergency, supporting their safety and reducing anxiety.",
    );
  } else if (childrenBriefedRate >= 80 && totalEvacPlans > 0) {
    strengths.push(
      `${childrenBriefedRate}% of plans have been briefed to children — good communication of emergency procedures.`,
    );
  }

  // Plan type coverage
  if (planTypeCoverageRate >= 80 && totalEvacPlans > 0) {
    strengths.push(
      `Evacuation plans cover ${planTypesCovered} of ${planTypesTotal} emergency scenarios — broad risk coverage.`,
    );
  }

  // Emergency contact accuracy
  if (emergencyContactAccuracyRate >= 100 && totalContacts > 0) {
    strengths.push(
      "All emergency contacts are verified and current — the home can reach every critical contact immediately.",
    );
  } else if (emergencyContactAccuracyRate >= 80 && totalContacts > 0) {
    strengths.push(
      `${emergencyContactAccuracyRate}% emergency contact accuracy — most contacts are verified and current.`,
    );
  }

  // Essential contact coverage
  if (essentialCoverageRate >= 100 && totalContacts > 0) {
    strengths.push(
      "All essential emergency contact types covered (police, fire, ambulance, hospital, social worker, Ofsted, on-call manager, registered manager) — complete emergency contact coverage.",
    );
  } else if (essentialCoverageRate >= 75 && totalContacts > 0) {
    strengths.push(
      `${essentialCoverageRate}% essential contact type coverage — most critical contacts are in place.`,
    );
  }

  // Recent verification
  if (recentVerificationRate >= 90 && totalContacts > 0) {
    strengths.push(
      `${recentVerificationRate}% of contacts verified within the last 90 days — proactive contact verification.`,
    );
  }

  // Business continuity
  if (businessContinuityScore >= 80 && totalContinuityPlans > 0) {
    strengths.push(
      `Business continuity score at ${businessContinuityScore}% — comprehensive continuity planning covering testing, communications, staffing, and data backup.`,
    );
  } else if (businessContinuityScore >= 60 && totalContinuityPlans > 0) {
    strengths.push(
      `Business continuity score at ${businessContinuityScore}% — solid continuity planning foundations in place.`,
    );
  }

  // Plan testing
  if (planTestingRate >= 100 && totalContinuityPlans > 0) {
    strengths.push(
      "All business continuity plans have been tested — the home validates its contingency arrangements, not just documents them.",
    );
  } else if (planTestingRate >= 80 && totalContinuityPlans > 0) {
    strengths.push(
      `${planTestingRate}% of continuity plans tested — good validation of contingency arrangements.`,
    );
  }

  // Staff awareness of continuity plans
  if (staffAwarenessRate >= 100 && totalContinuityPlans > 0) {
    strengths.push(
      "All staff are aware of business continuity plans — the team knows what to do if the home faces a disruption.",
    );
  } else if (staffAwarenessRate >= 80 && totalContinuityPlans > 0) {
    strengths.push(
      `${staffAwarenessRate}% staff awareness of continuity plans — good team knowledge of contingency arrangements.`,
    );
  }

  // Scenario coverage
  if (scenarioCoverageRate >= 75 && totalContinuityPlans > 0) {
    strengths.push(
      `Business continuity plans cover ${scenariosCovered} of ${scenariosTotal} potential disruption scenarios — broad risk mitigation.`,
    );
  }

  // First aid coverage
  if (firstAidCoverageRate >= 100 && certificateRecords.length > 0) {
    strengths.push(
      "All first aid certificates are current — full first aid coverage with no gaps.",
    );
  } else if (firstAidCoverageRate >= 80 && certificateRecords.length > 0) {
    strengths.push(
      `${firstAidCoverageRate}% first aid certificate currency — strong first aid coverage across the team.`,
    );
  }

  // Equipment maintenance
  if (equipmentMaintenanceRate >= 100 && equipmentRecords.length > 0) {
    strengths.push(
      "All first aid equipment checked and in date — equipment is maintained and ready for use.",
    );
  } else if (equipmentMaintenanceRate >= 80 && equipmentRecords.length > 0) {
    strengths.push(
      `${equipmentMaintenanceRate}% equipment maintenance rate — most first aid equipment is checked and in date.`,
    );
  }

  // Training currency
  if (trainingCurrencyRate >= 90 && trainingRecords.length > 0) {
    strengths.push(
      `${trainingCurrencyRate}% of first aid training is within the last 12 months — staff skills are current and well-maintained.`,
    );
  } else if (trainingCurrencyRate >= 70 && trainingRecords.length > 0) {
    strengths.push(
      `${trainingCurrencyRate}% first aid training currency — good ongoing training provision.`,
    );
  }

  // Multiple staff with certs
  if (staffWithCerts >= 3) {
    strengths.push(
      `${staffWithCerts} staff members hold current first aid certificates — strong first aid capacity ensuring coverage across shifts.`,
    );
  } else if (staffWithCerts === 2) {
    strengths.push(
      "2 staff members hold current first aid certificates — basic first aid capacity across shifts.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Fire drill concerns
  if (fireDrillComplianceRate < 50 && totalDrills > 0) {
    concerns.push(
      `Only ${fireDrillComplianceRate}% fire drill compliance — the majority of drills fail to achieve full participation or meet target evacuation times, raising serious fire safety concerns.`,
    );
  } else if (fireDrillComplianceRate >= 50 && fireDrillComplianceRate < 80 && totalDrills > 0) {
    concerns.push(
      `Fire drill compliance at ${fireDrillComplianceRate}% — some drills fail to meet participation or evacuation time targets.`,
    );
  }

  if (totalDrills === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No fire drill records exist despite children being on placement — fire drills are a fundamental regulatory requirement and must be conducted and documented regularly.",
    );
  }

  if (drillOverdue) {
    concerns.push(
      `Last fire drill was ${daysSinceLastDrill} days ago — drills should be conducted at least monthly to maintain emergency readiness and comply with fire safety regulations.`,
    );
  }

  if (drillTypesCovered <= 1 && totalDrills > 0) {
    concerns.push(
      `Fire drills only cover ${drillTypesCovered} scenario type — drills should include day, night, weekend, and unannounced scenarios to ensure comprehensive preparedness.`,
    );
  } else if (drillTypesCovered === 2 && totalDrills > 0) {
    concerns.push(
      `Fire drills cover only ${drillTypesCovered} of 4 scenario types — expand to include night and unannounced drills to test true emergency readiness.`,
    );
  }

  if (recentNightDrills === 0 && totalDrills > 0) {
    concerns.push(
      "No night fire drills conducted in the last 6 months — night-time evacuations present unique challenges and must be practised regularly.",
    );
  }

  if (recentUnannouncedDrills === 0 && totalDrills > 0) {
    concerns.push(
      "No unannounced fire drills in the last 6 months — unannounced drills are essential to test genuine emergency readiness rather than rehearsed responses.",
    );
  }

  if (drillDebriefRate < 50 && totalDrills > 0) {
    concerns.push(
      `Only ${drillDebriefRate}% of fire drills include a debrief — without post-drill review, the home cannot identify and address issues to improve emergency response.`,
    );
  } else if (drillDebriefRate >= 50 && drillDebriefRate < 80 && totalDrills > 0) {
    concerns.push(
      `Drill debrief rate at ${drillDebriefRate}% — not all drills are followed by a review to capture learning and improvements.`,
    );
  }

  if (drillIssueResolutionRate < 50 && drillsWithIssues > 0) {
    concerns.push(
      `Only ${drillIssueResolutionRate}% of issues identified during fire drills have been resolved — unresolved drill issues represent ongoing safety risks.`,
    );
  }

  if (staffDrillParticipationRate < 70 && totalDrills > 0) {
    concerns.push(
      `Staff drill participation at only ${staffDrillParticipationRate}% — not all staff are practised in evacuation procedures, which could compromise safety in a real emergency.`,
    );
  }

  // Evacuation plan concerns
  if (evacuationPlanCurrencyRate < 50 && totalEvacPlans > 0) {
    concerns.push(
      `Only ${evacuationPlanCurrencyRate}% of evacuation plans are current — out-of-date plans may contain incorrect information and could endanger children in an emergency.`,
    );
  } else if (evacuationPlanCurrencyRate >= 50 && evacuationPlanCurrencyRate < 80 && totalEvacPlans > 0) {
    concerns.push(
      `Evacuation plan currency at ${evacuationPlanCurrencyRate}% — some plans are overdue for review and may not reflect current arrangements.`,
    );
  }

  if (totalEvacPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No evacuation plans documented — the home must have written, reviewed, and displayed evacuation plans for all foreseeable emergencies.",
    );
  }

  if (planComprehensivenessRate < 50 && totalEvacPlans > 0) {
    concerns.push(
      `Only ${planComprehensivenessRate}% of evacuation plans include all critical elements (exits, assembly points, roll call, vulnerable children) — incomplete plans risk confusion during emergencies.`,
    );
  }

  if (planDisplayRate < 80 && totalEvacPlans > 0) {
    concerns.push(
      `Only ${planDisplayRate}% of evacuation plans displayed in the home — plans must be visibly displayed so everyone knows what to do in an emergency.`,
    );
  }

  if (staffTrainedOnPlansRate < 70 && totalEvacPlans > 0) {
    concerns.push(
      `Only ${staffTrainedOnPlansRate}% of plans have associated staff training — untrained staff cannot safely implement evacuation procedures.`,
    );
  }

  if (childrenBriefedRate < 70 && totalEvacPlans > 0) {
    concerns.push(
      `Only ${childrenBriefedRate}% of evacuation plans have been briefed to children — children must understand evacuation procedures to keep themselves safe.`,
    );
  }

  if (plansOverdueRate > 30 && totalEvacPlans > 0) {
    concerns.push(
      `${plansOverdueRate}% of evacuation plans are overdue for review — plans must be reviewed within scheduled timeframes to remain reliable.`,
    );
  }

  // Emergency contact concerns
  if (emergencyContactAccuracyRate < 50 && totalContacts > 0) {
    concerns.push(
      `Only ${emergencyContactAccuracyRate}% of emergency contacts are verified and current — inaccurate contacts could prevent the home from reaching critical services during emergencies.`,
    );
  } else if (emergencyContactAccuracyRate >= 50 && emergencyContactAccuracyRate < 80 && totalContacts > 0) {
    concerns.push(
      `Emergency contact accuracy at ${emergencyContactAccuracyRate}% — some contacts may be out of date and unreliable.`,
    );
  }

  if (totalContacts === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No emergency contacts documented — the home must maintain a verified, current list of all essential emergency contacts.",
    );
  }

  if (essentialCoverageRate < 75 && totalContacts > 0) {
    concerns.push(
      `Only ${essentialCoverageRate}% of essential contact types covered — missing contacts for critical services could delay emergency response.`,
    );
  }

  if (contactsOverdueRate > 20 && totalContacts > 0) {
    concerns.push(
      `${contactsOverdueRate}% of emergency contacts are overdue for verification — unverified contacts may no longer be accurate.`,
    );
  }

  // Business continuity concerns
  if (businessContinuityScore < 40 && totalContinuityPlans > 0) {
    concerns.push(
      `Business continuity score at only ${businessContinuityScore}% — continuity planning is inadequate to protect children if the home faces a major disruption.`,
    );
  } else if (businessContinuityScore >= 40 && businessContinuityScore < 60 && totalContinuityPlans > 0) {
    concerns.push(
      `Business continuity score at ${businessContinuityScore}% — continuity planning needs strengthening to ensure the home can maintain care during disruptions.`,
    );
  }

  if (totalContinuityPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No business continuity plans documented — the home lacks contingency arrangements for disruptions such as staffing crises, building damage, or pandemic scenarios.",
    );
  }

  if (planTestingRate < 50 && totalContinuityPlans > 0) {
    concerns.push(
      `Only ${planTestingRate}% of continuity plans have been tested — untested plans cannot be relied upon in a real disruption.`,
    );
  }

  if (staffAwarenessRate < 70 && totalContinuityPlans > 0) {
    concerns.push(
      `Only ${staffAwarenessRate}% staff awareness of continuity plans — staff who do not know the plans cannot implement them effectively.`,
    );
  }

  if (continuityOverdueRate > 30 && totalContinuityPlans > 0) {
    concerns.push(
      `${continuityOverdueRate}% of business continuity plans overdue for review — plans must be regularly reviewed to remain relevant and effective.`,
    );
  }

  // First aid concerns
  if (firstAidCoverageRate < 50 && certificateRecords.length > 0) {
    concerns.push(
      `Only ${firstAidCoverageRate}% of first aid certificates are current — the home may not have adequate first aid coverage to respond to injuries or medical emergencies.`,
    );
  } else if (firstAidCoverageRate >= 50 && firstAidCoverageRate < 80 && certificateRecords.length > 0) {
    concerns.push(
      `First aid certificate currency at ${firstAidCoverageRate}% — some certificates have expired, reducing first aid capacity.`,
    );
  }

  if (certificateRecords.length === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No first aid certificate records — the home must ensure sufficient staff hold current first aid qualifications at all times.",
    );
  }

  if (expiringCerts > 0) {
    concerns.push(
      `${expiringCerts} first aid certificate${expiringCerts !== 1 ? "s" : ""} expiring within 30 days — renewal must be arranged promptly to avoid gaps in first aid coverage.`,
    );
  }

  if (equipmentMaintenanceRate < 50 && equipmentRecords.length > 0) {
    concerns.push(
      `Only ${equipmentMaintenanceRate}% of first aid equipment is checked and in date — poorly maintained equipment may fail when needed most.`,
    );
  } else if (equipmentMaintenanceRate >= 50 && equipmentMaintenanceRate < 80 && equipmentRecords.length > 0) {
    concerns.push(
      `Equipment maintenance at ${equipmentMaintenanceRate}% — some first aid equipment may be out of date or not properly checked.`,
    );
  }

  if (equipmentOverdueRate > 20 && equipmentRecords.length > 0) {
    concerns.push(
      `${equipmentOverdueRate}% of first aid equipment is overdue for checking — equipment must be checked within scheduled timeframes.`,
    );
  }

  if (staffWithCerts === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No staff currently hold a valid first aid certificate — the home cannot evidence that a first aider is available at all times, which is a serious safety gap.",
    );
  } else if (staffWithCerts === 1 && total_children > 0) {
    concerns.push(
      "Only 1 staff member holds a current first aid certificate — this provides no cover for holidays, sickness, or shift patterns. At least 2 certified first aiders are recommended.",
    );
  }

  if (trainingCurrencyRate < 50 && trainingRecords.length > 0) {
    concerns.push(
      `Only ${trainingCurrencyRate}% of first aid training is within the last 12 months — staff skills may be out of date.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: EmergencyRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations (critical gaps)

  if (totalDrills === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately commence regular fire drills covering day, night, weekend, and unannounced scenarios. Document all drill outcomes including evacuation times, participation, and debrief findings.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (fireDrillComplianceRate < 50 && totalDrills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review fire drill procedures — the majority of drills fail compliance standards. Address evacuation time issues, ensure all children and staff participate, and implement corrective actions from drill debriefs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (drillOverdue) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a fire drill immediately — the last drill was over 30 days ago. Establish and maintain a monthly drill schedule to ensure ongoing emergency readiness.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (totalEvacPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and display evacuation plans for all foreseeable emergencies (fire, flood, gas leak, intruder, chemical, general). Plans must cover all exits, assembly points, roll call procedures, and provisions for vulnerable children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (evacuationPlanCurrencyRate < 50 && totalEvacPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and update all evacuation plans immediately — the majority are out of date and may not reflect current building layout, staffing, or children's needs. Ensure each plan is approved, displayed, and briefed to staff and children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (emergencyContactAccuracyRate < 50 && totalContacts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Verify and update all emergency contacts urgently — the majority are unverified or not current, which could prevent the home from reaching critical services in an emergency.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of significant events",
    });
  }

  if (totalContacts === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create and maintain a comprehensive emergency contacts list covering all essential services (police, fire, ambulance, hospital, social workers, Ofsted, on-call management). Verify all contacts and schedule regular re-verification.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of significant events",
    });
  }

  if (staffWithCerts === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange first aid training for at least two staff members immediately — the home currently has no staff with valid first aid certificates, which is a serious safety gap.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (equipmentMaintenanceRate < 50 && equipmentRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Check and restock all first aid equipment immediately — the majority of equipment is either unchecked or out of date, which could compromise the home's ability to respond to medical emergencies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (firstAidCoverageRate < 50 && certificateRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Renew expired first aid certificates urgently — the majority of certificates have lapsed, leaving the home with insufficient qualified first aiders.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  // Soon recommendations (improvement areas)

  if (fireDrillComplianceRate >= 50 && fireDrillComplianceRate < 80 && totalDrills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve fire drill compliance to at least 80% — review why some drills fail to achieve full participation or meet target evacuation times, and implement targeted improvements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (recentNightDrills === 0 && totalDrills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule a night fire drill within the next month — night-time evacuations present unique challenges including children being asleep, reduced staffing, and limited visibility. Regular practice is essential.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (recentUnannouncedDrills === 0 && totalDrills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an unannounced fire drill to test genuine emergency readiness — announced drills allow preparation that may mask weaknesses in the evacuation process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (drillDebriefRate < 80 && totalDrills > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every fire drill is followed by a documented debrief — debriefs are essential for identifying improvements and ensuring drill findings lead to action.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (drillIssueResolutionRate < 80 && drillsWithIssues > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all outstanding issues identified during fire drills — unresolved issues represent ongoing safety risks that must be addressed before the next drill.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (evacuationPlanCurrencyRate >= 50 && evacuationPlanCurrencyRate < 80 && totalEvacPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all evacuation plans up to date — review and update plans that are past their review due dates to ensure accuracy and completeness.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (planComprehensivenessRate < 80 && totalEvacPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance evacuation plans to include all critical elements — every plan should cover all exits, assembly points, roll call procedures, and specific provisions for vulnerable children.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (childrenBriefedRate < 80 && totalEvacPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Brief all children on evacuation procedures — children must understand what to do in each type of emergency. Use age-appropriate methods and revisit briefings regularly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (emergencyContactAccuracyRate >= 50 && emergencyContactAccuracyRate < 80 && totalContacts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Verify and update emergency contacts to achieve at least 80% accuracy — contacts that are unverified or out of date could cause delays in emergency response.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of significant events",
    });
  }

  if (essentialCoverageRate < 100 && totalContacts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Fill gaps in essential contact coverage — ensure current, verified contacts exist for all critical services including police, fire, ambulance, hospital, social workers, Ofsted, on-call manager, and registered manager.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 40 — Notification of significant events",
    });
  }

  if (totalContinuityPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop business continuity plans covering pandemic, staffing shortage, building damage, utility failure, and other foreseeable disruptions. Plans should include communication, alternative accommodation, data backup, and staffing contingencies.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness",
    });
  }

  if (planTestingRate < 50 && totalContinuityPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Test business continuity plans through tabletop exercises or scenario simulations — untested plans may contain gaps or assumptions that only surface during a real disruption.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness",
    });
  }

  if (staffAwarenessRate < 80 && totalContinuityPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff are made aware of business continuity plans — staff who do not know the contingency arrangements cannot implement them when needed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness",
    });
  }

  if (expiringCerts > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Renew ${expiringCerts} first aid certificate${expiringCerts !== 1 ? "s" : ""} expiring within 30 days — book refresher training now to avoid gaps in first aid coverage.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  // Planned recommendations (enhancement)

  if (firstAidCoverageRate >= 50 && firstAidCoverageRate < 80 && certificateRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve first aid certificate currency to at least 80% — schedule renewal training for staff with expired or expiring certificates.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (equipmentMaintenanceRate >= 50 && equipmentMaintenanceRate < 80 && equipmentRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve equipment maintenance rate to at least 80% — establish a regular checking schedule and ensure all items are in date and fully stocked.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (businessContinuityScore >= 40 && businessContinuityScore < 60 && totalContinuityPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen business continuity planning — ensure plans include communication strategies, alternative accommodation, data backup, and staffing contingencies. Test plans and ensure staff awareness.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness",
    });
  }

  if (scenarioCoverageRate < 50 && totalContinuityPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand business continuity scenario coverage — develop plans for additional disruption scenarios including pandemic, extreme weather, cyber attack, and regulatory action.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Registered person: fitness",
    });
  }

  if (planTypeCoverageRate < 50 && totalEvacPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop evacuation plans for additional emergency scenarios — the home should have plans covering fire, flood, gas leak, intruder, chemical spill, and general emergencies.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (trainingCurrencyRate < 70 && trainingRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Update first aid training provision — schedule refresher training to ensure staff skills remain current and effective.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (staffWithCerts === 1 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train at least one additional staff member in first aid — having only one certified first aider provides no cover during absences and is insufficient for shift coverage.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: EmergencyInsight[] = [];

  // -- Critical insights --

  if (fireDrillComplianceRate < 50 && totalDrills > 0) {
    insights.push({
      text: `Only ${fireDrillComplianceRate}% fire drill compliance. Ofsted will view this as evidence that children may not be safely evacuated in a real fire. Reg 25 requires the home to demonstrate that effective fire precautions are in place, and consistent drill failure undermines this entirely.`,
      severity: "critical",
    });
  }

  if (totalDrills === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No fire drills recorded despite children being on placement. This is a fundamental Reg 25 compliance failure — Ofsted inspectors will expect documented evidence of regular fire drills covering multiple scenarios. The absence of drills means the home cannot demonstrate that children and staff know how to evacuate safely.",
      severity: "critical",
    });
  }

  if (evacuationPlanCurrencyRate < 50 && totalEvacPlans > 0) {
    insights.push({
      text: `Only ${evacuationPlanCurrencyRate}% of evacuation plans are current. Out-of-date plans may reference former staff, changed building layouts, or children who have moved on. In an actual emergency, outdated plans could cause dangerous confusion.`,
      severity: "critical",
    });
  }

  if (totalEvacPlans === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No evacuation plans exist. Without written, approved, and displayed evacuation plans, neither staff nor children have clear guidance on what to do in an emergency. This represents a critical safety gap that Ofsted will identify under Reg 25.",
      severity: "critical",
    });
  }

  if (emergencyContactAccuracyRate < 50 && totalContacts > 0) {
    insights.push({
      text: `Only ${emergencyContactAccuracyRate}% of emergency contacts are verified and current. In a real emergency, the home may be unable to reach critical services, social workers, or management. This undermines the home's ability to respond effectively under Reg 40.`,
      severity: "critical",
    });
  }

  if (staffWithCerts === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No staff currently hold a valid first aid certificate. This means there is no qualified first aider available in the home, which is a serious safeguarding gap. Children who sustain injuries or experience medical emergencies will not receive competent first aid response.",
      severity: "critical",
    });
  }

  if (equipmentMaintenanceRate < 50 && equipmentRecords.length > 0) {
    insights.push({
      text: `Only ${equipmentMaintenanceRate}% of first aid equipment is maintained. Out-of-date or unchecked equipment — such as expired medications, depleted bandages, or non-functional defibrillators — cannot be relied upon in a medical emergency.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (fireDrillComplianceRate >= 50 && fireDrillComplianceRate < 80 && totalDrills > 0) {
    insights.push({
      text: `Fire drill compliance at ${fireDrillComplianceRate}% — while improving, some drills still fail to achieve full participation or meet target evacuation times. Each failed drill represents a scenario where children may not reach safety in time.`,
      severity: "warning",
    });
  }

  if (drillOverdue) {
    insights.push({
      text: `Last fire drill was ${daysSinceLastDrill} days ago. Ofsted expects regular fire drills — gaps of more than one month indicate the home may not be maintaining adequate emergency preparedness. Skills and knowledge degrade without regular practice.`,
      severity: "warning",
    });
  }

  if (recentNightDrills === 0 && totalDrills > 0) {
    insights.push({
      text: "No night drills in the last 6 months. Night-time evacuations are statistically the most dangerous — children may be disoriented, staffing levels are typically lower, and visibility is reduced. Ofsted inspectors specifically look for evidence of night drill practice.",
      severity: "warning",
    });
  }

  if (evacuationPlanCurrencyRate >= 50 && evacuationPlanCurrencyRate < 80 && totalEvacPlans > 0) {
    insights.push({
      text: `Evacuation plan currency at ${evacuationPlanCurrencyRate}% — some plans are overdue for review. Plans that are not regularly reviewed may contain outdated information about exits, assembly points, or children's specific needs.`,
      severity: "warning",
    });
  }

  if (planComprehensivenessRate < 80 && totalEvacPlans > 0) {
    insights.push({
      text: `Only ${planComprehensivenessRate}% of evacuation plans include all critical elements. Plans missing exit routes, assembly points, roll call procedures, or vulnerable children provisions may leave gaps that become dangerous during an actual emergency.`,
      severity: "warning",
    });
  }

  if (childrenBriefedRate < 80 && totalEvacPlans > 0) {
    insights.push({
      text: `Only ${childrenBriefedRate}% of plans have been briefed to children. Children who do not understand evacuation procedures may panic, freeze, or take incorrect actions during an emergency. Regular briefings, adapted to each child's age and understanding, are essential.`,
      severity: "warning",
    });
  }

  if (emergencyContactAccuracyRate >= 50 && emergencyContactAccuracyRate < 80 && totalContacts > 0) {
    insights.push({
      text: `Emergency contact accuracy at ${emergencyContactAccuracyRate}% — some contacts may be unreliable. Regular verification ensures the home can reach every critical service when needed. Even one incorrect number could cause dangerous delays.`,
      severity: "warning",
    });
  }

  if (essentialCoverageRate < 100 && essentialCoverageRate >= 50 && totalContacts > 0) {
    insights.push({
      text: `Essential contact type coverage at ${essentialCoverageRate}% — gaps in coverage for police, fire, ambulance, hospital, social workers, Ofsted, or management contacts could compromise emergency response. All essential contacts should be documented and readily accessible.`,
      severity: "warning",
    });
  }

  if (businessContinuityScore >= 40 && businessContinuityScore < 60 && totalContinuityPlans > 0) {
    insights.push({
      text: `Business continuity score at ${businessContinuityScore}% — while plans exist, they need strengthening. The COVID-19 pandemic demonstrated that children's homes must be able to maintain safe care through major disruptions. Untested or incomplete plans may fail when needed most.`,
      severity: "warning",
    });
  }

  if (totalContinuityPlans === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No business continuity plans exist. Recent experience (pandemics, extreme weather, staffing crises) has shown that children's homes must plan for disruptions. Without continuity plans, the home risks being unable to maintain safe care during foreseeable events.",
      severity: "warning",
    });
  }

  if (planTestingRate < 50 && totalContinuityPlans > 0) {
    insights.push({
      text: `Only ${planTestingRate}% of continuity plans tested. Plans that exist only on paper may contain assumptions that do not work in practice — regular testing through tabletop exercises or simulations is essential to validate arrangements.`,
      severity: "warning",
    });
  }

  if (firstAidCoverageRate >= 50 && firstAidCoverageRate < 80 && certificateRecords.length > 0) {
    insights.push({
      text: `First aid coverage at ${firstAidCoverageRate}% — some certificates have expired. Gaps in first aid qualification mean the home may not always have a competent first aider on shift, particularly during nights and weekends.`,
      severity: "warning",
    });
  }

  if (expiringCerts > 0) {
    insights.push({
      text: `${expiringCerts} first aid certificate${expiringCerts !== 1 ? "s" : ""} expiring within 30 days. Without prompt renewal, the home's first aid capacity will reduce further. Arrange refresher training now to prevent gaps.`,
      severity: "warning",
    });
  }

  if (equipmentMaintenanceRate >= 50 && equipmentMaintenanceRate < 80 && equipmentRecords.length > 0) {
    insights.push({
      text: `Equipment maintenance at ${equipmentMaintenanceRate}% — some equipment may be out of date or inadequately checked. First aid kits, fire extinguishers, and emergency lighting all require regular maintenance to remain effective.`,
      severity: "warning",
    });
  }

  if (trainingCurrencyRate < 70 && trainingRecords.length > 0) {
    insights.push({
      text: `Only ${trainingCurrencyRate}% of first aid training is within the last 12 months. First aid skills degrade without regular refreshment — the Resuscitation Council recommends annual updates to maintain competence.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (emergency_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding emergency preparedness and business continuity — fire drills are compliant, evacuation plans are current and comprehensive, emergency contacts are verified, continuity plans are tested, and first aid coverage is strong. This is exemplary practice under Reg 25.",
      severity: "positive",
    });
  }

  if (fireDrillComplianceRate >= 90 && totalDrills > 0) {
    insights.push({
      text: `${fireDrillComplianceRate}% fire drill compliance — the home consistently achieves full participation and meets target evacuation times. This demonstrates that children and staff are well-prepared for fire emergencies, which Ofsted will view as strong evidence of Reg 25 compliance.`,
      severity: "positive",
    });
  }

  if (drillTypesCovered >= 4 && totalDrills > 0) {
    insights.push({
      text: "Fire drills cover all four scenario types (day, night, weekend, unannounced). This comprehensive approach ensures the home tests emergency readiness under all realistic conditions, not just convenient ones.",
      severity: "positive",
    });
  }

  if (evacuationPlanCurrencyRate >= 100 && totalEvacPlans > 0 && planComprehensivenessRate >= 100) {
    insights.push({
      text: "All evacuation plans are current, comprehensive, and cover all critical elements. This means the home has clear, up-to-date guidance for every foreseeable emergency scenario, giving staff and children confidence in their safety.",
      severity: "positive",
    });
  }

  if (emergencyContactAccuracyRate >= 100 && totalContacts > 0 && essentialCoverageRate >= 100) {
    insights.push({
      text: "Every emergency contact is verified and current, with all essential service types covered. The home can reach any critical contact immediately in an emergency, demonstrating thorough preparation under Reg 40.",
      severity: "positive",
    });
  }

  if (businessContinuityScore >= 80 && totalContinuityPlans > 0) {
    insights.push({
      text: `Business continuity score at ${businessContinuityScore}% — the home has comprehensive, tested contingency plans covering communications, alternative accommodation, data backup, and staffing. This resilience ensures children's care continues through disruptions.`,
      severity: "positive",
    });
  }

  if (firstAidCoverageRate >= 100 && certificateRecords.length > 0 && equipmentMaintenanceRate >= 100 && equipmentRecords.length > 0) {
    insights.push({
      text: "All first aid certificates are current and all equipment is checked and in date — the home is fully prepared to respond to medical emergencies with qualified staff and properly maintained equipment.",
      severity: "positive",
    });
  }

  if (staffWithCerts >= 3) {
    insights.push({
      text: `${staffWithCerts} staff members hold current first aid certificates, providing strong coverage across all shift patterns. This means a qualified first aider is likely available at all times, which is best practice for children's home safety.`,
      severity: "positive",
    });
  }

  if (drillIssueResolutionRate >= 100 && drillsWithIssues > 0) {
    insights.push({
      text: "Every issue identified during fire drills has been resolved — the home treats drill findings as actionable safety improvements, not just paperwork exercises. This demonstrates a genuine safety culture.",
      severity: "positive",
    });
  }

  if (recentNightDrills >= 1 && recentUnannouncedDrills >= 1 && totalDrills > 0) {
    insights.push({
      text: "Both night and unannounced drills conducted recently — the home tests emergency readiness under the most challenging and realistic conditions, going beyond minimum requirements.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (emergency_rating === "outstanding") {
    headline =
      "Outstanding emergency preparedness and business continuity — fire drills are compliant, evacuation plans are current, emergency contacts verified, and first aid coverage is strong.";
  } else if (emergency_rating === "good") {
    headline = `Good emergency preparedness — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (emergency_rating === "adequate") {
    headline = `Adequate emergency preparedness — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are safe in emergencies and the home can maintain continuity of care.`;
  } else {
    headline = `Emergency preparedness is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure fire safety, evacuation readiness, and emergency response capability.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    emergency_rating,
    emergency_score: score,
    headline,
    fire_drill_compliance_rate: fireDrillComplianceRate,
    evacuation_plan_currency_rate: evacuationPlanCurrencyRate,
    emergency_contact_accuracy_rate: emergencyContactAccuracyRate,
    business_continuity_score: businessContinuityScore,
    first_aid_coverage_rate: firstAidCoverageRate,
    equipment_maintenance_rate: equipmentMaintenanceRate,
    total_drills: totalDrills,
    total_evacuation_plans: totalEvacPlans,
    total_emergency_contacts: totalContacts,
    total_continuity_plans: totalContinuityPlans,
    total_first_aid_records: totalFirstAidRecords,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
