// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRE SAFETY & EMERGENCY DRILL INTELLIGENCE ENGINE
// Tracks fire safety compliance: fire drill frequency and evacuation times,
// fire risk assessments, fire equipment maintenance, staff fire training,
// and fire safety documentation.
// Critical for Ofsted under Children's Homes Regulations 2015 (Reg 25 —
// Fire precautions), Regulatory Reform (Fire Safety) Order 2005, SCCIF safety.
// HOME-LEVEL engine.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: fireDrillRecords, fireRiskAssessmentRecords,
//             fireEquipmentCheckRecords, fireTrainingRecords,
//             fireSafetyDocumentRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FireDrillRecordInput {
  id: string;
  date: string; // YYYY-MM-DD
  time_of_day: "day" | "night" | "evening" | "early_morning";
  drill_type: "scheduled" | "unannounced" | "night_drill" | "partial" | "full_evacuation";
  evacuation_time_seconds: number;
  target_evacuation_time_seconds: number;
  within_target: boolean;
  all_occupants_evacuated: boolean;
  children_present_count: number;
  staff_present_count: number;
  result: "satisfactory" | "issues_identified" | "failed" | "not_completed";
  issues_found: string[];
  actions_taken: string[];
  all_issues_resolved: boolean;
  conducted_by: string;
  notes: string;
  created_at: string;
}

export interface FireRiskAssessmentRecordInput {
  id: string;
  assessment_date: string; // YYYY-MM-DD
  next_review_date: string; // YYYY-MM-DD
  assessor: string;
  risk_level: "low" | "medium" | "high" | "critical";
  areas_assessed: number;
  areas_compliant: number;
  actions_required: number;
  actions_completed: number;
  significant_findings: string[];
  is_current: boolean; // not expired past review date
  documented: boolean;
  shared_with_staff: boolean;
  created_at: string;
}

export interface FireEquipmentCheckRecordInput {
  id: string;
  check_date: string; // YYYY-MM-DD
  equipment_type: "fire_extinguisher" | "smoke_alarm" | "fire_blanket" | "sprinkler" | "emergency_lighting" | "fire_door" | "alarm_panel" | "other";
  location: string;
  passed: boolean;
  defects_found: string[];
  defects_rectified: boolean;
  next_check_due: string; // YYYY-MM-DD
  checked_by: string;
  professional_service: boolean;
  certificate_held: boolean;
  notes: string;
  created_at: string;
}

export interface FireTrainingRecordInput {
  id: string;
  staff_id: string;
  training_date: string; // YYYY-MM-DD
  training_type: "induction" | "annual_refresher" | "fire_marshal" | "extinguisher_use" | "evacuation_procedure" | "specialist" | "other";
  completed: boolean;
  passed: boolean;
  certificate_issued: boolean;
  expiry_date: string | null; // YYYY-MM-DD or null
  provider: string;
  duration_hours: number;
  notes: string;
  created_at: string;
}

export interface FireSafetyDocumentRecordInput {
  id: string;
  document_type: "fire_policy" | "evacuation_plan" | "fire_risk_assessment" | "fire_log_book" | "emergency_contacts" | "peep" | "fire_safety_order" | "other";
  title: string;
  is_current: boolean;
  last_reviewed: string; // YYYY-MM-DD
  next_review_due: string; // YYYY-MM-DD
  approved_by: string;
  accessible_to_staff: boolean;
  accessible_to_children: boolean;
  version: string;
  notes: string;
  created_at: string;
}

export interface FireSafetyInput {
  today: string; // YYYY-MM-DD
  total_children: number;
  fire_drill_records: FireDrillRecordInput[];
  fire_risk_assessment_records: FireRiskAssessmentRecordInput[];
  fire_equipment_check_records: FireEquipmentCheckRecordInput[];
  fire_training_records: FireTrainingRecordInput[];
  fire_safety_document_records: FireSafetyDocumentRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FireSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FireSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FireSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface FireSafetyResult {
  fire_safety_rating: FireSafetyRating;
  fire_safety_score: number;
  headline: string;
  total_drill_records: number;
  total_risk_assessment_records: number;
  total_equipment_check_records: number;
  total_training_records: number;
  total_document_records: number;
  drill_compliance_rate: number;
  evacuation_time_rate: number;
  risk_assessment_currency_rate: number;
  equipment_check_rate: number;
  staff_training_rate: number;
  documentation_compliance_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: FireSafetyRecommendation[];
  insights: FireSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FireSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.floor((db.getTime() - da.getTime()) / 86400000);
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FireSafetyRating,
  score: number,
  headline: string,
): FireSafetyResult {
  return {
    fire_safety_rating: rating,
    fire_safety_score: score,
    headline,
    total_drill_records: 0,
    total_risk_assessment_records: 0,
    total_equipment_check_records: 0,
    total_training_records: 0,
    total_document_records: 0,
    drill_compliance_rate: 0,
    evacuation_time_rate: 0,
    risk_assessment_currency_rate: 0,
    equipment_check_rate: 0,
    staff_training_rate: 0,
    documentation_compliance_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFireSafetyEmergencyDrill(
  input: FireSafetyInput,
): FireSafetyResult {
  const {
    today,
    total_children,
    fire_drill_records,
    fire_risk_assessment_records,
    fire_equipment_check_records,
    fire_training_records,
    fire_safety_document_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    fire_drill_records.length === 0 &&
    fire_risk_assessment_records.length === 0 &&
    fire_equipment_check_records.length === 0 &&
    fire_training_records.length === 0 &&
    fire_safety_document_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess fire safety and emergency drill compliance.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No fire safety or emergency drill data recorded despite children on placement — fire precautions require urgent attention.",
      ),
      concerns: [
        "No fire drill records, fire risk assessments, equipment checks, staff fire training, or fire safety documentation exist despite children being on placement — the home cannot evidence compliance with fire safety legislation or regulatory requirements.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately implement a structured fire safety management system including regular fire drills, current fire risk assessment, equipment maintenance schedules, staff fire training programme, and up-to-date fire safety documentation.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
        },
        {
          rank: 2,
          recommendation:
            "Commission a fire risk assessment by a competent person as required under the Regulatory Reform (Fire Safety) Order 2005 and ensure all findings are acted upon within specified timescales.",
          urgency: "immediate",
          regulatory_ref: "Fire Safety Order 2005 Art 9",
        },
      ],
      insights: [
        {
          text: "The complete absence of fire safety records represents a critical regulatory failing. Under the Children's Homes Regulations 2015 Reg 25 and the Regulatory Reform (Fire Safety) Order 2005, the responsible person must ensure adequate fire precautions are in place. Without drills, risk assessments, equipment checks, training, or documentation, children's safety cannot be evidenced.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Fire drill metrics ---
  const totalDrillRecords = fire_drill_records.length;
  const satisfactoryDrills = fire_drill_records.filter(
    (d) => d.result === "satisfactory",
  ).length;
  const drillComplianceRate = pct(satisfactoryDrills, totalDrillRecords);

  const failedDrills = fire_drill_records.filter(
    (d) => d.result === "failed" || d.result === "not_completed",
  ).length;
  const failedDrillRate = pct(failedDrills, totalDrillRecords);

  const withinTargetDrills = fire_drill_records.filter(
    (d) => d.within_target,
  ).length;
  const evacuationTimeRate = pct(withinTargetDrills, totalDrillRecords);

  const allEvacuatedDrills = fire_drill_records.filter(
    (d) => d.all_occupants_evacuated,
  ).length;
  const fullEvacuationRate = pct(allEvacuatedDrills, totalDrillRecords);

  const issuesDrills = fire_drill_records.filter(
    (d) => d.issues_found.length > 0,
  );
  const resolvedIssueDrills = issuesDrills.filter(
    (d) => d.all_issues_resolved,
  ).length;
  const issueResolutionRate = pct(resolvedIssueDrills, issuesDrills.length);

  // Drill variety: count unique drill types
  const drillTypes = new Set(fire_drill_records.map((d) => d.drill_type));
  const drillTypeVariety = drillTypes.size;

  // Night drills
  const nightDrills = fire_drill_records.filter(
    (d) => d.time_of_day === "night" || d.time_of_day === "early_morning",
  ).length;
  const nightDrillRate = pct(nightDrills, totalDrillRecords);

  // Unannounced drills
  const unannouncedDrills = fire_drill_records.filter(
    (d) => d.drill_type === "unannounced",
  ).length;
  const unannouncedDrillRate = pct(unannouncedDrills, totalDrillRecords);

  // Average evacuation time
  const evacTimes = fire_drill_records
    .map((d) => d.evacuation_time_seconds)
    .filter((t) => t > 0);
  const avgEvacTime =
    evacTimes.length > 0
      ? Math.round(evacTimes.reduce((a, b) => a + b, 0) / evacTimes.length)
      : 0;

  // --- Fire risk assessment metrics ---
  const totalRiskAssessments = fire_risk_assessment_records.length;
  const currentAssessments = fire_risk_assessment_records.filter(
    (r) => r.is_current,
  ).length;
  const riskAssessmentCurrencyRate = pct(currentAssessments, totalRiskAssessments);

  const overdueAssessments = fire_risk_assessment_records.filter(
    (r) => daysBetween(r.next_review_date, today) > 0,
  ).length;

  const highCriticalAssessments = fire_risk_assessment_records.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical",
  ).length;
  const highCriticalRate = pct(highCriticalAssessments, totalRiskAssessments);

  const totalRaActions = fire_risk_assessment_records.reduce(
    (sum, r) => sum + r.actions_required,
    0,
  );
  const completedRaActions = fire_risk_assessment_records.reduce(
    (sum, r) => sum + r.actions_completed,
    0,
  );
  const raActionCompletionRate = pct(completedRaActions, totalRaActions);

  const documentedAssessments = fire_risk_assessment_records.filter(
    (r) => r.documented,
  ).length;
  const documentedAssessmentRate = pct(documentedAssessments, totalRiskAssessments);

  const sharedWithStaffAssessments = fire_risk_assessment_records.filter(
    (r) => r.shared_with_staff,
  ).length;
  const sharedWithStaffRate = pct(sharedWithStaffAssessments, totalRiskAssessments);

  const compliantAreaTotal = fire_risk_assessment_records.reduce(
    (sum, r) => sum + r.areas_assessed,
    0,
  );
  const compliantAreaCount = fire_risk_assessment_records.reduce(
    (sum, r) => sum + r.areas_compliant,
    0,
  );
  const areaComplianceRate = pct(compliantAreaCount, compliantAreaTotal);

  // --- Fire equipment check metrics ---
  const totalEquipmentChecks = fire_equipment_check_records.length;
  const passedEquipmentChecks = fire_equipment_check_records.filter(
    (e) => e.passed,
  ).length;
  const equipmentCheckRate = pct(passedEquipmentChecks, totalEquipmentChecks);

  const defectiveEquipment = fire_equipment_check_records.filter(
    (e) => e.defects_found.length > 0,
  );
  const rectifiedDefects = defectiveEquipment.filter(
    (e) => e.defects_rectified,
  ).length;
  const defectRectificationRate = pct(rectifiedDefects, defectiveEquipment.length);

  const overdueEquipmentChecks = fire_equipment_check_records.filter(
    (e) => daysBetween(e.next_check_due, today) > 0,
  ).length;
  const overdueEquipmentRate = pct(overdueEquipmentChecks, totalEquipmentChecks);

  const professionalServiceChecks = fire_equipment_check_records.filter(
    (e) => e.professional_service,
  ).length;
  const professionalServiceRate = pct(professionalServiceChecks, totalEquipmentChecks);

  const certificateHeldChecks = fire_equipment_check_records.filter(
    (e) => e.certificate_held,
  ).length;
  const certificateHeldRate = pct(certificateHeldChecks, totalEquipmentChecks);

  // Equipment type coverage
  const equipmentTypes = new Set(fire_equipment_check_records.map((e) => e.equipment_type));
  const equipmentTypeCoverage = equipmentTypes.size;

  // --- Staff fire training metrics ---
  const totalTrainingRecords = fire_training_records.length;
  const completedTraining = fire_training_records.filter(
    (t) => t.completed,
  ).length;
  const staffTrainingRate = pct(completedTraining, totalTrainingRecords);

  const passedTraining = fire_training_records.filter(
    (t) => t.completed && t.passed,
  ).length;
  const trainingPassRate = pct(passedTraining, totalTrainingRecords);

  const certificateIssuedTraining = fire_training_records.filter(
    (t) => t.completed && t.certificate_issued,
  ).length;
  const certificateIssuedRate = pct(certificateIssuedTraining, totalTrainingRecords);

  const expiredTraining = fire_training_records.filter(
    (t) => t.expiry_date !== null && daysBetween(t.expiry_date!, today) > 0,
  ).length;
  const expiredTrainingRate = pct(expiredTraining, totalTrainingRecords);

  // Unique staff trained
  const uniqueStaffTrained = new Set(
    fire_training_records.filter((t) => t.completed).map((t) => t.staff_id),
  ).size;

  // Fire marshal training
  const fireMarshalTraining = fire_training_records.filter(
    (t) => t.training_type === "fire_marshal" && t.completed,
  ).length;

  // Training types coverage
  const trainingTypes = new Set(
    fire_training_records.filter((t) => t.completed).map((t) => t.training_type),
  );
  const trainingTypeCoverage = trainingTypes.size;

  // --- Fire safety documentation metrics ---
  const totalDocumentRecords = fire_safety_document_records.length;
  const currentDocuments = fire_safety_document_records.filter(
    (d) => d.is_current,
  ).length;
  const documentCurrencyRate = pct(currentDocuments, totalDocumentRecords);

  const overdueDocuments = fire_safety_document_records.filter(
    (d) => daysBetween(d.next_review_due, today) > 0,
  ).length;
  const overdueDocumentRate = pct(overdueDocuments, totalDocumentRecords);

  const staffAccessibleDocs = fire_safety_document_records.filter(
    (d) => d.accessible_to_staff,
  ).length;
  const staffAccessRate = pct(staffAccessibleDocs, totalDocumentRecords);

  const childAccessibleDocs = fire_safety_document_records.filter(
    (d) => d.accessible_to_children,
  ).length;
  const childAccessRate = pct(childAccessibleDocs, totalDocumentRecords);

  const approvedDocs = fire_safety_document_records.filter(
    (d) => d.approved_by !== "",
  ).length;
  const approvedDocRate = pct(approvedDocs, totalDocumentRecords);

  // Documentation compliance composite: currency + staff access + approval
  const documentationComplianceRate =
    totalDocumentRecords > 0
      ? Math.round((documentCurrencyRate + staffAccessRate + approvedDocRate) / 3)
      : 0;

  // Document type coverage
  const docTypes = new Set(fire_safety_document_records.map((d) => d.document_type));
  const docTypeCoverage = docTypes.size;

  // Key documents present
  const hasFirePolicy = docTypes.has("fire_policy");
  const hasEvacuationPlan = docTypes.has("evacuation_plan");
  const hasFireRiskAssessment = docTypes.has("fire_risk_assessment");
  const hasFireLogBook = docTypes.has("fire_log_book");
  const hasEmergencyContacts = docTypes.has("emergency_contacts");
  const keyDocCount = [hasFirePolicy, hasEvacuationPlan, hasFireRiskAssessment, hasFireLogBook, hasEmergencyContacts].filter(Boolean).length;
  const keyDocRate = pct(keyDocCount, 5);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: drillComplianceRate (>=90: +4, >=70: +2) ---
  if (drillComplianceRate >= 90) score += 4;
  else if (drillComplianceRate >= 70) score += 2;

  // --- Bonus 2: evacuationTimeRate (>=90: +4, >=70: +2) ---
  if (evacuationTimeRate >= 90) score += 4;
  else if (evacuationTimeRate >= 70) score += 2;

  // --- Bonus 3: riskAssessmentCurrencyRate (>=90: +3, >=70: +1) ---
  if (riskAssessmentCurrencyRate >= 90) score += 3;
  else if (riskAssessmentCurrencyRate >= 70) score += 1;

  // --- Bonus 4: equipmentCheckRate (>=90: +3, >=70: +1) ---
  if (equipmentCheckRate >= 90) score += 3;
  else if (equipmentCheckRate >= 70) score += 1;

  // --- Bonus 5: staffTrainingRate (>=90: +3, >=70: +1) ---
  if (staffTrainingRate >= 90) score += 3;
  else if (staffTrainingRate >= 70) score += 1;

  // --- Bonus 6: documentationComplianceRate (>=90: +3, >=70: +1) ---
  if (documentationComplianceRate >= 90) score += 3;
  else if (documentationComplianceRate >= 70) score += 1;

  // --- Bonus 7: issueResolutionRate (>=90: +3, >=70: +1) ---
  if (issueResolutionRate >= 90) score += 3;
  else if (issueResolutionRate >= 70) score += 1;

  // --- Bonus 8: raActionCompletionRate (>=90: +3, >=70: +1) ---
  if (raActionCompletionRate >= 90) score += 3;
  else if (raActionCompletionRate >= 70) score += 1;

  // --- Bonus 9: nightDrillRate (>=20: +2) AND unannouncedDrillRate (>=20: +2 combined max +2) ---
  if (nightDrillRate >= 20 && unannouncedDrillRate >= 20) score += 2;
  else if (nightDrillRate >= 20 || unannouncedDrillRate >= 20) score += 1;

  // ── Penalties (4 penalties, guarded by array.length > 0) ──────────────

  // Penalty 1: drillComplianceRate < 40 → -5 (guarded)
  if (drillComplianceRate < 40 && fire_drill_records.length > 0) score -= 5;

  // Penalty 2: equipmentCheckRate < 50 → -5 (guarded)
  if (equipmentCheckRate < 50 && fire_equipment_check_records.length > 0) score -= 5;

  // Penalty 3: staffTrainingRate < 40 → -4 (guarded)
  if (staffTrainingRate < 40 && fire_training_records.length > 0) score -= 4;

  // Penalty 4: riskAssessmentCurrencyRate < 50 → -4 (guarded)
  if (riskAssessmentCurrencyRate < 50 && fire_risk_assessment_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const fire_safety_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (drillComplianceRate >= 90 && totalDrillRecords > 0) {
    strengths.push(
      `${drillComplianceRate}% of fire drills achieved a satisfactory result — the home demonstrates excellent fire drill practice and emergency preparedness.`,
    );
  } else if (drillComplianceRate >= 70 && totalDrillRecords > 0) {
    strengths.push(
      `${drillComplianceRate}% fire drill compliance — the home maintains a good standard of fire drill practice with the majority of drills completing satisfactorily.`,
    );
  }

  if (evacuationTimeRate >= 90 && totalDrillRecords > 0) {
    strengths.push(
      `${evacuationTimeRate}% of evacuations completed within target time — evacuation procedures are well-rehearsed and staff respond efficiently to emergency scenarios.`,
    );
  } else if (evacuationTimeRate >= 70 && totalDrillRecords > 0) {
    strengths.push(
      `${evacuationTimeRate}% of evacuations within target time — good evacuation performance demonstrating effective emergency procedures.`,
    );
  }

  if (riskAssessmentCurrencyRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentCurrencyRate}% of fire risk assessments are current — the home maintains up-to-date risk assessments as required by the Fire Safety Order 2005.`,
    );
  } else if (riskAssessmentCurrencyRate >= 70 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentCurrencyRate}% fire risk assessment currency rate — the home generally maintains current fire risk assessments.`,
    );
  }

  if (equipmentCheckRate >= 90 && totalEquipmentChecks > 0) {
    strengths.push(
      `${equipmentCheckRate}% of fire equipment checks passed — fire safety equipment is well-maintained and in good working order across the home.`,
    );
  } else if (equipmentCheckRate >= 70 && totalEquipmentChecks > 0) {
    strengths.push(
      `${equipmentCheckRate}% fire equipment pass rate — the majority of fire safety equipment is maintained to a satisfactory standard.`,
    );
  }

  if (staffTrainingRate >= 90 && totalTrainingRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff fire training completion rate — staff are well-trained in fire safety procedures and emergency response.`,
    );
  } else if (staffTrainingRate >= 70 && totalTrainingRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff fire training rate — the majority of staff have completed their fire safety training.`,
    );
  }

  if (documentationComplianceRate >= 90 && totalDocumentRecords > 0) {
    strengths.push(
      `${documentationComplianceRate}% fire safety documentation compliance — fire safety documents are current, accessible, and properly approved.`,
    );
  } else if (documentationComplianceRate >= 70 && totalDocumentRecords > 0) {
    strengths.push(
      `${documentationComplianceRate}% documentation compliance rate — fire safety documentation is generally well-maintained and accessible.`,
    );
  }

  if (issueResolutionRate >= 90 && issuesDrills.length > 0) {
    strengths.push(
      `${issueResolutionRate}% of drill issues resolved — the home demonstrates a strong commitment to addressing fire drill findings promptly and effectively.`,
    );
  } else if (issueResolutionRate >= 70 && issuesDrills.length > 0) {
    strengths.push(
      `${issueResolutionRate}% drill issue resolution rate — the home generally addresses fire drill findings in a timely manner.`,
    );
  }

  if (raActionCompletionRate >= 90 && totalRaActions > 0) {
    strengths.push(
      `${raActionCompletionRate}% of risk assessment actions completed — fire risk assessment findings are being acted upon comprehensively.`,
    );
  } else if (raActionCompletionRate >= 70 && totalRaActions > 0) {
    strengths.push(
      `${raActionCompletionRate}% risk assessment action completion — the home generally follows through on fire risk assessment recommendations.`,
    );
  }

  if (fullEvacuationRate >= 95 && totalDrillRecords > 0) {
    strengths.push(
      `${fullEvacuationRate}% full evacuation rate — all occupants are consistently evacuated during fire drills, demonstrating effective emergency procedures.`,
    );
  }

  if (nightDrillRate >= 20 && totalDrillRecords > 0) {
    strengths.push(
      `Night drills represent ${nightDrillRate}% of all drills — the home tests emergency procedures during vulnerable night-time periods as recommended by fire safety best practice.`,
    );
  }

  if (unannouncedDrillRate >= 20 && totalDrillRecords > 0) {
    strengths.push(
      `${unannouncedDrillRate}% of drills are unannounced — the home tests genuine emergency response capability rather than relying solely on scheduled exercises.`,
    );
  }

  if (drillTypeVariety >= 4 && totalDrillRecords > 0) {
    strengths.push(
      `Fire drills cover ${drillTypeVariety} different drill types — comprehensive testing of varied emergency scenarios strengthens overall preparedness.`,
    );
  }

  if (defectRectificationRate >= 90 && defectiveEquipment.length > 0) {
    strengths.push(
      `${defectRectificationRate}% of equipment defects rectified — the home responds effectively to fire equipment faults, minimising risk to children and staff.`,
    );
  }

  if (fireMarshalTraining >= 2) {
    strengths.push(
      `${fireMarshalTraining} staff have completed fire marshal training — the home has dedicated fire safety leadership to support emergency response.`,
    );
  }

  if (keyDocRate === 100 && totalDocumentRecords > 0) {
    strengths.push(
      "All five key fire safety documents are in place (fire policy, evacuation plan, fire risk assessment, fire log book, emergency contacts) — comprehensive fire safety documentation framework.",
    );
  }

  if (certificateHeldRate >= 90 && totalEquipmentChecks > 0) {
    strengths.push(
      `${certificateHeldRate}% of equipment checks have certificates held — strong evidence base for fire equipment maintenance compliance.`,
    );
  }

  if (areaComplianceRate >= 90 && compliantAreaTotal > 0) {
    strengths.push(
      `${areaComplianceRate}% of assessed areas compliant — fire risk assessments show a high standard of compliance across the premises.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (drillComplianceRate < 40 && totalDrillRecords > 0) {
    concerns.push(
      `Only ${drillComplianceRate}% of fire drills achieved a satisfactory result — the majority of drills reveal issues or failures, indicating fundamental weaknesses in the home's fire safety procedures.`,
    );
  } else if (drillComplianceRate < 70 && drillComplianceRate >= 40 && totalDrillRecords > 0) {
    concerns.push(
      `Fire drill compliance at ${drillComplianceRate}% — a significant proportion of drills do not achieve satisfactory outcomes, requiring review of evacuation procedures and staff competency.`,
    );
  }

  if (evacuationTimeRate < 40 && totalDrillRecords > 0) {
    concerns.push(
      `Only ${evacuationTimeRate}% of evacuations completed within target time — slow evacuation times represent a direct risk to children's safety in a genuine fire emergency.`,
    );
  } else if (evacuationTimeRate < 70 && evacuationTimeRate >= 40 && totalDrillRecords > 0) {
    concerns.push(
      `Evacuation time compliance at ${evacuationTimeRate}% — not all drills meet the target evacuation time, suggesting procedures or building layout need review.`,
    );
  }

  if (riskAssessmentCurrencyRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Only ${riskAssessmentCurrencyRate}% of fire risk assessments are current — expired or overdue assessments mean the home cannot evidence that fire risks are being managed in line with the Fire Safety Order 2005.`,
    );
  } else if (riskAssessmentCurrencyRate < 70 && riskAssessmentCurrencyRate >= 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Fire risk assessment currency at ${riskAssessmentCurrencyRate}% — some assessments are overdue for review, which could leave unidentified risks unmanaged.`,
    );
  }

  if (equipmentCheckRate < 50 && totalEquipmentChecks > 0) {
    concerns.push(
      `Only ${equipmentCheckRate}% of fire equipment checks passed — a significant proportion of fire safety equipment is failing checks, creating direct risk to life safety.`,
    );
  } else if (equipmentCheckRate < 70 && equipmentCheckRate >= 50 && totalEquipmentChecks > 0) {
    concerns.push(
      `Fire equipment pass rate at ${equipmentCheckRate}% — some fire safety equipment is not meeting required standards, requiring attention to maintain safety compliance.`,
    );
  }

  if (staffTrainingRate < 40 && totalTrainingRecords > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% staff fire training completion — the majority of staff have not completed required fire safety training, leaving them unprepared to respond to a fire emergency.`,
    );
  } else if (staffTrainingRate < 70 && staffTrainingRate >= 40 && totalTrainingRecords > 0) {
    concerns.push(
      `Staff fire training rate at ${staffTrainingRate}% — a significant number of staff have incomplete fire safety training, which may compromise emergency response.`,
    );
  }

  if (documentationComplianceRate < 50 && totalDocumentRecords > 0) {
    concerns.push(
      `Fire safety documentation compliance at only ${documentationComplianceRate}% — fire safety documents are not current, not accessible to staff, or lack proper approval.`,
    );
  } else if (documentationComplianceRate < 70 && documentationComplianceRate >= 50 && totalDocumentRecords > 0) {
    concerns.push(
      `Documentation compliance at ${documentationComplianceRate}% — fire safety documentation requires improvement in currency, accessibility, or approval processes.`,
    );
  }

  if (failedDrillRate >= 20 && totalDrillRecords > 0) {
    concerns.push(
      `${failedDrillRate}% of fire drills failed or were not completed — this level of drill failure represents a significant concern about the home's emergency preparedness.`,
    );
  }

  if (fullEvacuationRate < 80 && totalDrillRecords > 0) {
    concerns.push(
      `Only ${fullEvacuationRate}% of drills achieved full evacuation — not all occupants are consistently evacuated during fire drills, which could have life-threatening consequences in a real emergency.`,
    );
  }

  if (highCriticalRate >= 30 && totalRiskAssessments > 0) {
    concerns.push(
      `${highCriticalRate}% of fire risk assessments rated high or critical risk — a concerning proportion of assessments identify significant fire hazards requiring urgent remediation.`,
    );
  }

  if (raActionCompletionRate < 50 && totalRaActions > 0) {
    concerns.push(
      `Only ${raActionCompletionRate}% of fire risk assessment actions completed — identified fire risks are not being addressed, leaving known hazards unmitigated.`,
    );
  } else if (raActionCompletionRate < 70 && raActionCompletionRate >= 50 && totalRaActions > 0) {
    concerns.push(
      `Risk assessment action completion at ${raActionCompletionRate}% — some identified fire risks remain unaddressed, requiring follow-through on outstanding actions.`,
    );
  }

  if (overdueEquipmentRate >= 20 && totalEquipmentChecks > 0) {
    concerns.push(
      `${overdueEquipmentRate}% of fire equipment checks are overdue — equipment with lapsed maintenance schedules may not function in an emergency.`,
    );
  }

  if (expiredTrainingRate >= 20 && totalTrainingRecords > 0) {
    concerns.push(
      `${expiredTrainingRate}% of fire training records have expired — staff with lapsed fire training may not be competent to respond effectively to a fire emergency.`,
    );
  }

  if (nightDrills === 0 && totalDrillRecords >= 3) {
    concerns.push(
      "No night-time fire drills recorded despite multiple drills being conducted — the home is not testing emergency procedures during the period of highest vulnerability when children are sleeping.",
    );
  }

  if (keyDocRate < 60 && totalDocumentRecords > 0) {
    concerns.push(
      `Only ${keyDocRate}% of the five key fire safety documents are in place — missing core documents (fire policy, evacuation plan, fire risk assessment, fire log book, emergency contacts) represents a significant gap in fire safety governance.`,
    );
  }

  if (defectRectificationRate < 50 && defectiveEquipment.length > 0) {
    concerns.push(
      `Only ${defectRectificationRate}% of equipment defects rectified — known equipment faults are not being resolved, leaving fire safety systems potentially non-functional.`,
    );
  }

  if (issueResolutionRate < 50 && issuesDrills.length > 0) {
    concerns.push(
      `Only ${issueResolutionRate}% of fire drill issues resolved — identified problems from drills are not being addressed, meaning the same failures are likely to recur.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FireSafetyRecommendation[] = [];
  let rank = 0;

  if (drillComplianceRate < 40 && totalDrillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review fire drill procedures — the high failure rate indicates fundamental issues with evacuation processes, staff understanding, or building layout. Consider engaging the local fire service for guidance and conducting additional practice drills.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (equipmentCheckRate < 50 && totalEquipmentChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission an urgent review and maintenance of all fire safety equipment — a high equipment failure rate places children and staff at direct risk. Arrange professional servicing for all equipment types and replace any equipment that cannot be repaired.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 17 — Maintenance",
    });
  }

  if (staffTrainingRate < 40 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an urgent fire training programme for all staff — the majority of staff lack completed fire safety training, leaving the home without adequate competency to respond to a fire emergency. All staff must receive induction fire training and regular refreshers.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 21 — Training",
    });
  }

  if (riskAssessmentCurrencyRate < 50 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all fire risk assessments up to date immediately — expired assessments fail to identify and manage current fire risks. Under the Fire Safety Order 2005, the responsible person must maintain a suitable and sufficient fire risk assessment reviewed at appropriate intervals.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 9 — Risk assessment",
    });
  }

  if (evacuationTimeRate < 40 && totalDrillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve evacuation procedures to reduce evacuation times — slow evacuations endanger lives. Assess escape routes, signage, staff deployment, and any barriers to rapid egress. Consider whether Personal Emergency Evacuation Plans (PEEPs) need updating for any children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (raActionCompletionRate < 50 && totalRaActions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish an action tracker for fire risk assessment findings with named owners and deadlines — identified fire hazards must be remediated to comply with the Fire Safety Order 2005. Incomplete actions represent known, unmanaged risks.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 10 — Principles of prevention",
    });
  }

  if (fullEvacuationRate < 80 && totalDrillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate why full evacuation is not being achieved in all drills — every occupant must be accounted for during evacuation. Review roll-call procedures, assembly point arrangements, and whether any children or staff have mobility or sensory needs requiring additional support.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (nightDrills === 0 && totalDrillRecords >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule night-time fire drills to test emergency procedures during sleeping hours — night fires represent the highest risk period and the home must evidence that evacuation can be safely achieved when children are asleep.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (issueResolutionRate < 50 && issuesDrills.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured process for resolving fire drill issues — each finding must have a named owner, deadline, and evidence of completion. Unresolved drill issues mean the home is knowingly tolerating fire safety weaknesses.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (defectRectificationRate < 50 && defectiveEquipment.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise rectification of outstanding fire equipment defects — known faults in fire safety equipment must be resolved urgently. Consider temporary mitigations (e.g., additional fire extinguishers, portable smoke alarms) while repairs are completed.",
      urgency: "soon",
      regulatory_ref: "Fire Safety Order 2005 Art 17 — Maintenance",
    });
  }

  if (keyDocRate < 60 && totalDocumentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all five key fire safety documents are in place — fire policy, evacuation plan, fire risk assessment, fire log book, and emergency contacts list. These documents form the foundation of the home's fire safety governance framework.",
      urgency: "soon",
      regulatory_ref: "Fire Safety Order 2005 Art 11 — Fire safety arrangements",
    });
  }

  if (
    drillComplianceRate >= 40 &&
    drillComplianceRate < 70 &&
    totalDrillRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve fire drill outcomes through staff debriefing, role clarification, and additional practice — target a consistent 70%+ satisfactory drill rate to demonstrate effective emergency preparedness.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (
    staffTrainingRate >= 40 &&
    staffTrainingRate < 70 &&
    totalTrainingRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Accelerate staff fire training completion — ensure all staff complete fire safety training within induction and receive annual refresher training. Consider diversifying training methods to improve completion rates.",
      urgency: "soon",
      regulatory_ref: "Fire Safety Order 2005 Art 21 — Training",
    });
  }

  if (
    equipmentCheckRate >= 50 &&
    equipmentCheckRate < 70 &&
    totalEquipmentChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve fire equipment maintenance to achieve at least 70% pass rate — review the maintenance schedule, arrange professional servicing, and replace ageing or unreliable equipment.",
      urgency: "planned",
      regulatory_ref: "Fire Safety Order 2005 Art 17 — Maintenance",
    });
  }

  if (
    documentationComplianceRate >= 50 &&
    documentationComplianceRate < 70 &&
    totalDocumentRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen fire safety documentation by ensuring all documents are current, formally approved, and accessible to all staff — documentation gaps weaken the home's ability to evidence fire safety compliance during regulatory inspections.",
      urgency: "planned",
      regulatory_ref: "Fire Safety Order 2005 Art 11 — Fire safety arrangements",
    });
  }

  if (
    evacuationTimeRate >= 40 &&
    evacuationTimeRate < 70 &&
    totalDrillRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work to improve evacuation times through practice, clear signage, unobstructed escape routes, and staff deployment planning — aim for at least 70% of drills meeting the target evacuation time.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (expiredTrainingRate >= 20 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and renew expired fire training records — staff with lapsed training certificates may not meet regulatory requirements. Implement a training expiry tracker to prevent future lapses.",
      urgency: "planned",
      regulatory_ref: "Fire Safety Order 2005 Art 21 — Training",
    });
  }

  if (unannouncedDrills === 0 && totalDrillRecords >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include unannounced fire drills in the drill programme to test genuine emergency response capability — scheduled-only drills allow preparation that may not reflect real evacuation performance.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (
    riskAssessmentCurrencyRate >= 50 &&
    riskAssessmentCurrencyRate < 70 &&
    totalRiskAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all fire risk assessments are reviewed before their due dates — implement a review schedule with reminders and named responsible persons to maintain currency across all assessments.",
      urgency: "planned",
      regulatory_ref: "Fire Safety Order 2005 Art 9 — Risk assessment",
    });
  }

  if (totalRiskAssessments === 0 && !allEmpty && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a fire risk assessment by a competent person as a matter of urgency — the Regulatory Reform (Fire Safety) Order 2005 requires the responsible person to carry out a fire risk assessment and implement its findings.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 9 — Risk assessment",
    });
  }

  if (totalDrillRecords === 0 && !allEmpty && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular fire drills immediately — CHR 2015 Reg 25 requires the home to take precautions against the risk of fire. Regular drills are essential to test evacuation procedures and ensure all staff and children know what to do in a fire emergency.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Fire precautions",
    });
  }

  if (totalTrainingRecords === 0 && !allEmpty && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a fire safety training programme for all staff — the Fire Safety Order 2005 requires the responsible person to provide adequate safety training. All staff must receive fire training on induction and regular refresher training.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 21 — Training",
    });
  }

  if (totalEquipmentChecks === 0 && !allEmpty && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a fire equipment maintenance and checking schedule — all fire safety equipment must be regularly tested and maintained in accordance with the Fire Safety Order 2005 to ensure it functions in an emergency.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005 Art 17 — Maintenance",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FireSafetyInsight[] = [];

  // -- Critical insights --

  if (drillComplianceRate < 40 && totalDrillRecords > 0) {
    insights.push({
      text: `Only ${drillComplianceRate}% of fire drills satisfactory. This level of drill failure indicates that the home's fire safety procedures are fundamentally inadequate. Under CHR 2015 Reg 25, the registered person must take adequate steps to protect children from the risk of fire. Ofsted would view this as a serious safeguarding concern.`,
      severity: "critical",
    });
  }

  if (equipmentCheckRate < 50 && totalEquipmentChecks > 0) {
    insights.push({
      text: `Only ${equipmentCheckRate}% of fire equipment passed checks. Fire safety equipment exists to protect lives — when the majority of equipment is failing checks, children and staff are at direct risk. The Regulatory Reform (Fire Safety) Order 2005 Art 17 requires equipment to be maintained in an efficient state and effective working order.`,
      severity: "critical",
    });
  }

  if (staffTrainingRate < 40 && totalTrainingRecords > 0) {
    insights.push({
      text: `Only ${staffTrainingRate}% of staff fire training completed. Staff who have not completed fire safety training cannot be relied upon to respond effectively in an emergency. The Fire Safety Order 2005 Art 21 requires the responsible person to provide adequate fire safety training — this level of non-completion represents a regulatory breach.`,
      severity: "critical",
    });
  }

  if (riskAssessmentCurrencyRate < 50 && totalRiskAssessments > 0) {
    insights.push({
      text: `Only ${riskAssessmentCurrencyRate}% of fire risk assessments current. Out-of-date risk assessments mean the home is managing fire risks based on historic rather than current conditions. The Fire Safety Order 2005 requires assessments to be reviewed regularly — this gap could mask new or changed fire hazards.`,
      severity: "critical",
    });
  }

  if (evacuationTimeRate < 40 && totalDrillRecords > 0) {
    insights.push({
      text: `Only ${evacuationTimeRate}% of evacuations within target time. In a real fire, every second counts. The average evacuation time of ${avgEvacTime} seconds suggests barriers to rapid egress that must be identified and resolved. Consider escape route obstructions, locked doors, inadequate signage, or insufficient staff deployment.`,
      severity: "critical",
    });
  }

  if (fullEvacuationRate < 70 && totalDrillRecords > 0) {
    insights.push({
      text: `Only ${fullEvacuationRate}% of drills achieved full evacuation of all occupants. Any individual unaccounted for during a fire could lose their life. This represents the most fundamental measure of fire safety — every person must be evacuated every time.`,
      severity: "critical",
    });
  }

  if (highCriticalRate >= 50 && totalRiskAssessments > 0) {
    insights.push({
      text: `${highCriticalRate}% of fire risk assessments rated high or critical. A majority of assessments identifying severe fire risks suggests the premises has fundamental fire safety issues requiring significant investment and remediation.`,
      severity: "critical",
    });
  }

  if (totalDrillRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No fire drill records despite children being on placement and other fire safety data existing. Fire drills are a fundamental fire precaution required under CHR 2015 Reg 25 — without regular drills, the home cannot demonstrate that evacuation procedures are tested and effective.",
      severity: "critical",
    });
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No fire risk assessment records despite children being on placement. The Regulatory Reform (Fire Safety) Order 2005 makes it a legal requirement for the responsible person to carry out a suitable and sufficient fire risk assessment. Its absence is a regulatory breach.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    drillComplianceRate >= 40 &&
    drillComplianceRate < 70 &&
    totalDrillRecords > 0
  ) {
    insights.push({
      text: `Fire drill compliance at ${drillComplianceRate}% — while not critically low, a significant proportion of drills are not achieving satisfactory outcomes. Staff debriefing and targeted practice could improve performance and demonstrate stronger emergency preparedness for regulatory inspections.`,
      severity: "warning",
    });
  }

  if (
    evacuationTimeRate >= 40 &&
    evacuationTimeRate < 70 &&
    totalDrillRecords > 0
  ) {
    insights.push({
      text: `Evacuation time compliance at ${evacuationTimeRate}% with average evacuation time of ${avgEvacTime} seconds. Inconsistent evacuation performance suggests some drills are well-executed while others encounter delays. Analyse which scenarios or times of day produce slower evacuations.`,
      severity: "warning",
    });
  }

  if (
    equipmentCheckRate >= 50 &&
    equipmentCheckRate < 70 &&
    totalEquipmentChecks > 0
  ) {
    insights.push({
      text: `Fire equipment pass rate at ${equipmentCheckRate}% — while the majority of equipment passes, the failure rate is above acceptable levels for life-safety equipment. Focus on recurring failure types and consider equipment replacement where repeated maintenance is not achieving compliance.`,
      severity: "warning",
    });
  }

  if (
    staffTrainingRate >= 40 &&
    staffTrainingRate < 70 &&
    totalTrainingRecords > 0
  ) {
    insights.push({
      text: `Staff fire training at ${staffTrainingRate}% — a notable proportion of staff have incomplete fire training. In a fire emergency, every staff member's competence matters. Prioritise training for staff on night shifts and those working most closely with children who need assistance to evacuate.`,
      severity: "warning",
    });
  }

  if (
    riskAssessmentCurrencyRate >= 50 &&
    riskAssessmentCurrencyRate < 70 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: `Fire risk assessment currency at ${riskAssessmentCurrencyRate}% — some assessments are becoming outdated. Fire risk changes with building modifications, occupancy changes, and seasonal factors. Ensure reviews are scheduled proactively rather than reactively.`,
      severity: "warning",
    });
  }

  if (
    documentationComplianceRate >= 50 &&
    documentationComplianceRate < 70 &&
    totalDocumentRecords > 0
  ) {
    insights.push({
      text: `Fire safety documentation compliance at ${documentationComplianceRate}% — gaps in document currency, accessibility, or approval could weaken the home's position during a Reg 44 or Ofsted inspection. Systematically review and update all fire safety documentation.`,
      severity: "warning",
    });
  }

  if (
    raActionCompletionRate >= 50 &&
    raActionCompletionRate < 70 &&
    totalRaActions > 0
  ) {
    insights.push({
      text: `Risk assessment action completion at ${raActionCompletionRate}% — some identified fire hazards have not been remediated. Partial completion may give a false sense of security while leaving known risks unmanaged.`,
      severity: "warning",
    });
  }

  if (
    issueResolutionRate >= 50 &&
    issueResolutionRate < 70 &&
    issuesDrills.length > 0
  ) {
    insights.push({
      text: `Fire drill issue resolution at ${issueResolutionRate}% — while some findings are being addressed, unresolved issues accumulate over time and could compound into more serious fire safety failures.`,
      severity: "warning",
    });
  }

  if (overdueEquipmentRate >= 10 && overdueEquipmentRate < 20 && totalEquipmentChecks > 0) {
    insights.push({
      text: `${overdueEquipmentRate}% of equipment checks overdue — while not yet critical, any lapse in maintenance scheduling could result in equipment failing when needed most. Implement automated reminders for upcoming check dates.`,
      severity: "warning",
    });
  }

  if (expiredTrainingRate >= 10 && expiredTrainingRate < 20 && totalTrainingRecords > 0) {
    insights.push({
      text: `${expiredTrainingRate}% of fire training records have expired — staff with lapsed training may retain knowledge but cannot evidence current competency. Schedule refresher training before certificates expire.`,
      severity: "warning",
    });
  }

  if (drillTypeVariety <= 2 && totalDrillRecords >= 4) {
    insights.push({
      text: `Only ${drillTypeVariety} drill type${drillTypeVariety === 1 ? "" : "s"} recorded across ${totalDrillRecords} drills. Limited drill variety means the home is not testing a range of emergency scenarios. Consider including unannounced drills, night drills, partial evacuations, and full evacuations.`,
      severity: "warning",
    });
  }

  if (sharedWithStaffRate < 70 && totalRiskAssessments > 0) {
    insights.push({
      text: `Only ${sharedWithStaffRate}% of fire risk assessments shared with staff. Staff who are unaware of identified fire risks cannot take appropriate precautions. Under the Fire Safety Order, employees must be provided with comprehensible and relevant information about fire risks.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (fire_safety_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding fire safety and emergency drill compliance — drills are well-conducted with good evacuation times, fire risk assessments are current, equipment is maintained, staff are trained, and documentation is comprehensive. This provides strong evidence of compliance with CHR 2015 Reg 25 and the Fire Safety Order 2005.",
      severity: "positive",
    });
  }

  if (
    drillComplianceRate >= 90 &&
    evacuationTimeRate >= 90 &&
    totalDrillRecords > 0
  ) {
    insights.push({
      text: `${drillComplianceRate}% drill compliance with ${evacuationTimeRate}% within target evacuation time — the home demonstrates excellent emergency preparedness. Staff and children clearly understand evacuation procedures and can execute them efficiently under test conditions.`,
      severity: "positive",
    });
  }

  if (
    riskAssessmentCurrencyRate >= 90 &&
    raActionCompletionRate >= 90 &&
    totalRiskAssessments > 0 &&
    totalRaActions > 0
  ) {
    insights.push({
      text: `${riskAssessmentCurrencyRate}% risk assessment currency with ${raActionCompletionRate}% action completion — fire risks are being systematically identified, assessed, and remediated. This demonstrates a mature fire risk management approach that would satisfy regulatory scrutiny.`,
      severity: "positive",
    });
  }

  if (
    equipmentCheckRate >= 90 &&
    defectRectificationRate >= 90 &&
    totalEquipmentChecks > 0
  ) {
    insights.push({
      text: `${equipmentCheckRate}% equipment pass rate with ${defectRectificationRate >= 90 && defectiveEquipment.length > 0 ? defectRectificationRate + "% defect rectification" : "minimal defects"} — fire safety equipment is comprehensively maintained, providing confidence that it will function when needed.`,
      severity: "positive",
    });
  }

  if (
    staffTrainingRate >= 90 &&
    trainingPassRate >= 90 &&
    totalTrainingRecords > 0
  ) {
    insights.push({
      text: `${staffTrainingRate}% training completion with ${trainingPassRate}% pass rate — the staff team is well-equipped with fire safety knowledge and competence. This level of training provides strong assurance of effective emergency response capability.`,
      severity: "positive",
    });
  }

  if (
    documentationComplianceRate >= 90 &&
    keyDocRate >= 80 &&
    totalDocumentRecords > 0
  ) {
    insights.push({
      text: `${documentationComplianceRate}% documentation compliance with ${keyDocRate}% of key documents in place — the home maintains a robust fire safety documentation framework that supports regulatory compliance and provides clear reference for staff.`,
      severity: "positive",
    });
  }

  if (
    nightDrillRate >= 20 &&
    unannouncedDrillRate >= 20 &&
    totalDrillRecords > 0
  ) {
    insights.push({
      text: `The drill programme includes both night drills (${nightDrillRate}%) and unannounced drills (${unannouncedDrillRate}%) — this comprehensive approach tests genuine emergency response capability across the most challenging scenarios, providing strong evidence of fire safety preparedness.`,
      severity: "positive",
    });
  }

  if (
    fullEvacuationRate >= 95 &&
    totalDrillRecords > 0
  ) {
    insights.push({
      text: `${fullEvacuationRate}% full evacuation achievement rate — virtually every drill successfully accounts for all occupants. This is the single most important measure of fire safety effectiveness.`,
      severity: "positive",
    });
  }

  if (
    areaComplianceRate >= 90 &&
    compliantAreaTotal > 0 &&
    highCriticalRate < 10
  ) {
    insights.push({
      text: `${areaComplianceRate}% of assessed areas compliant with very few high-risk findings — the premises demonstrates a high standard of fire safety across all assessed areas.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (fire_safety_rating === "outstanding") {
    headline =
      "Outstanding fire safety and emergency drill compliance — drills are effective, risk assessments current, equipment maintained, staff trained, and documentation comprehensive.";
  } else if (fire_safety_rating === "good") {
    headline = `Good fire safety and emergency drill compliance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (fire_safety_rating === "adequate") {
    headline = `Adequate fire safety and emergency drill compliance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to meet fire safety standards and regulatory requirements.`;
  } else {
    headline = `Fire safety and emergency drill compliance is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children and staff and comply with fire safety legislation.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    fire_safety_rating,
    fire_safety_score: score,
    headline,
    total_drill_records: totalDrillRecords,
    total_risk_assessment_records: totalRiskAssessments,
    total_equipment_check_records: totalEquipmentChecks,
    total_training_records: totalTrainingRecords,
    total_document_records: totalDocumentRecords,
    drill_compliance_rate: drillComplianceRate,
    evacuation_time_rate: evacuationTimeRate,
    risk_assessment_currency_rate: riskAssessmentCurrencyRate,
    equipment_check_rate: equipmentCheckRate,
    staff_training_rate: staffTrainingRate,
    documentation_compliance_rate: documentationComplianceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
