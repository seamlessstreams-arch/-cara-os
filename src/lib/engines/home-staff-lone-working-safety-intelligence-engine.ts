// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF LONE WORKING SAFETY INTELLIGENCE ENGINE
// Pure deterministic engine: risk assessment completion, check-in compliance,
// safety protocol adherence, communication device availability, incident
// reporting during lone working.
// STAFF-FOCUSED engine — uses total_staff from store.staff.
// HOME-LEVEL engine.
// Ofsted CHR 2015 Reg 16 (workforce), Reg 25 (premises safety).
// SCCIF: "Safety" — Ofsted assesses whether the home has robust lone working
// procedures, check-in protocols, and incident reporting to protect staff
// and the children in their care.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface RiskAssessmentRecordInput {
  id: string;
  staff_id: string;
  assessment_date: string;
  review_date: string;
  risk_level: string; // "low" | "medium" | "high"
  status: string; // "current" | "due_review" | "expired" | "completed"
  hazards_identified: number;
  control_measures_count: number;
  approved: boolean;
  assessor_id: string;
  location: string;
  shift_type: string; // "day" | "evening" | "night" | "sleep_in" | "waking_night"
  emergency_procedure_documented: boolean;
  personal_alarm_included: boolean;
  notes: string;
}

export interface CheckInRecordInput {
  id: string;
  staff_id: string;
  shift_date: string;
  shift_type: string; // "day" | "evening" | "night" | "sleep_in" | "waking_night"
  scheduled_check_ins: number;
  completed_check_ins: number;
  missed_check_ins: number;
  late_check_ins: number;
  response_timely: boolean;
  escalation_triggered: boolean;
  escalation_reason: string;
  welfare_confirmed: boolean;
  method: string; // "phone" | "radio" | "app" | "in_person" | "text"
}

export interface SafetyProtocolRecordInput {
  id: string;
  staff_id: string;
  protocol_type: string; // "lone_working_policy" | "risk_assessment" | "emergency_procedure" | "check_in_protocol" | "device_usage" | "reporting_procedure"
  date_acknowledged: string;
  understood: boolean;
  signed: boolean;
  training_completed: boolean;
  training_date: string;
  refresher_due: string;
  refresher_completed: boolean;
  competency_assessed: boolean;
  competency_passed: boolean;
}

export interface CommunicationDeviceRecordInput {
  id: string;
  staff_id: string;
  device_type: string; // "mobile_phone" | "radio" | "personal_alarm" | "lone_worker_device" | "panic_button"
  issued: boolean;
  issued_date: string;
  tested: boolean;
  last_test_date: string;
  test_passed: boolean;
  battery_checked: boolean;
  signal_confirmed: boolean;
  returned: boolean;
  condition: string; // "good" | "fair" | "poor" | "faulty"
}

export interface IncidentReportingRecordInput {
  id: string;
  staff_id: string;
  incident_date: string;
  reported_date: string;
  incident_type: string; // "near_miss" | "minor_injury" | "verbal_threat" | "physical_assault" | "property_damage" | "security_breach" | "medical_emergency" | "other"
  severity: string; // "low" | "medium" | "high" | "critical"
  reported_timely: boolean;
  investigation_completed: boolean;
  follow_up_actions: number;
  follow_up_completed: number;
  lessons_learned_documented: boolean;
  manager_notified: boolean;
  safeguarding_referral_made: boolean;
  risk_assessment_updated: boolean;
  debrief_offered: boolean;
  debrief_completed: boolean;
}

export interface StaffLoneWorkingInput {
  today: string;
  total_staff: number;
  risk_assessment_records: RiskAssessmentRecordInput[];
  check_in_records: CheckInRecordInput[];
  safety_protocol_records: SafetyProtocolRecordInput[];
  communication_device_records: CommunicationDeviceRecordInput[];
  incident_reporting_records: IncidentReportingRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffLoneWorkingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LoneWorkingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface LoneWorkingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffLoneWorkingResult {
  lone_working_rating: StaffLoneWorkingRating;
  lone_working_score: number | null;
  headline: string;
  risk_assessment_rate: number | null;
  check_in_compliance_rate: number | null;
  safety_protocol_rate: number | null;
  communication_device_rate: number | null;
  incident_reporting_rate: number | null;
  staff_confidence_rate: number | null;
  total_risk_assessments: number;
  current_assessments: number;
  expired_assessments: number;
  high_risk_assessments: number;
  total_check_ins: number;
  missed_check_ins: number;
  escalations_triggered: number;
  total_protocols: number;
  protocols_signed: number;
  training_completed_count: number;
  refresher_overdue_count: number;
  total_devices: number;
  devices_tested: number;
  devices_faulty: number;
  total_incidents: number;
  incidents_reported_timely: number;
  investigations_completed: number;
  debriefs_offered: number;
  debriefs_completed: number;
  strengths: string[];
  concerns: string[];
  recommendations: LoneWorkingRecommendation[];
  insights: LoneWorkingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffLoneWorkingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffLoneWorkingSafety(
  input: StaffLoneWorkingInput,
): StaffLoneWorkingResult {
  const {
    total_staff,
    risk_assessment_records,
    check_in_records,
    safety_protocol_records,
    communication_device_records,
    incident_reporting_records,
  } = input;

  const allEmpty =
    risk_assessment_records.length === 0 &&
    check_in_records.length === 0 &&
    safety_protocol_records.length === 0 &&
    communication_device_records.length === 0 &&
    incident_reporting_records.length === 0;

  // ── Special case: all empty + 0 staff → insufficient_data ────────────
  if (allEmpty && total_staff === 0) {
    return {
      lone_working_rating: "insufficient_data",
      lone_working_score: 0,
      headline:
        "Insufficient data — no staff recorded and no lone working safety records available.",
      risk_assessment_rate: null,
      check_in_compliance_rate: null,
      safety_protocol_rate: null,
      communication_device_rate: null,
      incident_reporting_rate: null,
      staff_confidence_rate: null,
      total_risk_assessments: 0,
      current_assessments: 0,
      expired_assessments: 0,
      high_risk_assessments: 0,
      total_check_ins: 0,
      missed_check_ins: 0,
      escalations_triggered: 0,
      total_protocols: 0,
      protocols_signed: 0,
      training_completed_count: 0,
      refresher_overdue_count: 0,
      total_devices: 0,
      devices_tested: 0,
      devices_faulty: 0,
      total_incidents: 0,
      incidents_reported_timely: 0,
      investigations_completed: 0,
      debriefs_offered: 0,
      debriefs_completed: 0,
      strengths: [],
      concerns: [],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Record staff and lone working safety data to enable compliance analysis.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16",
        },
      ],
      insights: [
        {
          text: "No staff or lone working safety data available. Cannot assess lone working safety compliance.",
          severity: "warning",
        },
      ],
    };
  }

  // ── Special case: all empty + staff > 0 → inadequate/15 ─────────────
  if (allEmpty && total_staff > 0) {
    return {
      lone_working_rating: "inadequate",
      lone_working_score: 15,
      headline:
        "Inadequate — staff exist but no lone working safety records found. Regulatory requirements under Reg 16 and Reg 25 are unmet.",
      risk_assessment_rate: 0,
      check_in_compliance_rate: 0,
      safety_protocol_rate: 0,
      communication_device_rate: 0,
      incident_reporting_rate: 0,
      staff_confidence_rate: 0,
      total_risk_assessments: 0,
      current_assessments: 0,
      expired_assessments: 0,
      high_risk_assessments: 0,
      total_check_ins: 0,
      missed_check_ins: 0,
      escalations_triggered: 0,
      total_protocols: 0,
      protocols_signed: 0,
      training_completed_count: 0,
      refresher_overdue_count: 0,
      total_devices: 0,
      devices_tested: 0,
      devices_faulty: 0,
      total_incidents: 0,
      incidents_reported_timely: 0,
      investigations_completed: 0,
      debriefs_offered: 0,
      debriefs_completed: 0,
      strengths: [],
      concerns: [
        `${total_staff} staff recorded but no lone working risk assessments exist — Reg 16 requires the registered person to ensure sufficient staff with appropriate skills and experience.`,
        "No check-in compliance records — there is no evidence that staff welfare is being monitored during lone working shifts.",
        "No safety protocol acknowledgement records — staff may be working alone without understanding the home's lone working procedures.",
        "No communication device records — staff working alone may not have access to emergency communication equipment.",
        "No incident reporting records during lone working — the home cannot demonstrate that lone working incidents are being captured and investigated.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement individual lone working risk assessments for all staff immediately — every staff member who works alone must have a documented risk assessment covering hazards, control measures, and emergency procedures.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16",
        },
        {
          rank: 2,
          recommendation:
            "Establish a structured check-in protocol for all lone working shifts — regular welfare checks must be scheduled, completed, and recorded.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25",
        },
        {
          rank: 3,
          recommendation:
            "Ensure all staff acknowledge and sign the lone working safety policy, and receive training on emergency procedures and communication device usage.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16",
        },
        {
          rank: 4,
          recommendation:
            "Issue and test communication devices for all staff who work lone shifts — personal alarms, mobile phones, or lone worker devices must be available and in working order.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25",
        },
        {
          rank: 5,
          recommendation:
            "Implement an incident reporting framework for lone working events including near misses, threats, injuries, and security breaches.",
          urgency: "soon",
          regulatory_ref: "SCCIF Safety",
        },
      ],
      insights: [
        {
          text: `${total_staff} staff are recorded but there are no lone working safety records whatsoever. The Health and Safety Executive guidance on lone working requires employers to assess risks, implement control measures, provide communication devices, and monitor welfare through regular check-ins. The absence of any lone working safety records represents a serious compliance failure that Ofsted will treat as a leadership and management shortfall under Regulation 16.`,
          severity: "critical",
        },
      ],
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 1: Risk Assessment Completion Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalRiskAssessments = risk_assessment_records.length;
  const currentAssessments = risk_assessment_records.filter(
    (r) => r.status === "current" || r.status === "completed",
  ).length;
  const expiredAssessments = risk_assessment_records.filter(
    (r) => r.status === "expired",
  ).length;
  const dueReviewAssessments = risk_assessment_records.filter(
    (r) => r.status === "due_review",
  ).length;
  const highRiskAssessments = risk_assessment_records.filter(
    (r) => r.risk_level === "high",
  ).length;
  const approvedAssessments = risk_assessment_records.filter(
    (r) => r.approved,
  ).length;
  const emergencyDocumented = risk_assessment_records.filter(
    (r) => r.emergency_procedure_documented,
  ).length;

  // Unique staff with current risk assessments
  const staffWithCurrentAssessments = new Set(
    risk_assessment_records
      .filter((r) => r.status === "current" || r.status === "completed")
      .map((r) => r.staff_id),
  );
  const riskAssessmentRate = pct(staffWithCurrentAssessments.size, total_staff);

  // Shift type coverage in risk assessments
  const assessmentShiftTypes = new Set(
    risk_assessment_records.map((r) => r.shift_type),
  );
  const assessmentLocationsCovered = new Set(
    risk_assessment_records.map((r) => r.location),
  );

  const approvalRate = pct(approvedAssessments, totalRiskAssessments);
  const emergencyDocumentedRate = pct(emergencyDocumented, totalRiskAssessments);

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 2: Check-In Compliance Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalCheckIns = check_in_records.length;
  const totalScheduledCheckIns = check_in_records.reduce(
    (sum, c) => sum + c.scheduled_check_ins,
    0,
  );
  const totalCompletedCheckIns = check_in_records.reduce(
    (sum, c) => sum + c.completed_check_ins,
    0,
  );
  const totalMissedCheckIns = check_in_records.reduce(
    (sum, c) => sum + c.missed_check_ins,
    0,
  );
  const totalLateCheckIns = check_in_records.reduce(
    (sum, c) => sum + c.late_check_ins,
    0,
  );
  const checkInComplianceRate = pct(totalCompletedCheckIns, totalScheduledCheckIns);

  const timelyResponses = check_in_records.filter(
    (c) => c.response_timely,
  ).length;
  const timelyResponseRate = pct(timelyResponses, totalCheckIns);

  const escalationsTriggered = check_in_records.filter(
    (c) => c.escalation_triggered,
  ).length;

  const welfareConfirmed = check_in_records.filter(
    (c) => c.welfare_confirmed,
  ).length;
  const welfareConfirmRate = pct(welfareConfirmed, totalCheckIns);

  // Unique staff with check-in records
  const staffWithCheckIns = new Set(check_in_records.map((c) => c.staff_id));

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 3: Safety Protocol Adherence Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalProtocols = safety_protocol_records.length;
  const protocolsSigned = safety_protocol_records.filter(
    (p) => p.signed,
  ).length;
  const trainingCompleted = safety_protocol_records.filter(
    (p) => p.training_completed,
  ).length;
  const refresherOverdue = safety_protocol_records.filter(
    (p) => !p.refresher_completed && p.refresher_due !== "",
  ).length;
  const competencyAssessed = safety_protocol_records.filter(
    (p) => p.competency_assessed,
  ).length;
  const competencyPassed = safety_protocol_records.filter(
    (p) => p.competency_assessed && p.competency_passed,
  ).length;

  const safetyProtocolRate = pct(protocolsSigned, totalProtocols);
  const trainingCompletionRate = pct(trainingCompleted, totalProtocols);
  const competencyRate = pct(competencyPassed, competencyAssessed);

  // Unique staff with protocol records
  const staffWithProtocols = new Set(
    safety_protocol_records.map((p) => p.staff_id),
  );

  // Protocol type coverage
  const protocolTypes = new Set(
    safety_protocol_records.map((p) => p.protocol_type),
  );
  const expectedProtocolTypes = [
    "lone_working_policy",
    "risk_assessment",
    "emergency_procedure",
    "check_in_protocol",
    "device_usage",
    "reporting_procedure",
  ];
  const protocolTypeCoverage = pct(
    expectedProtocolTypes.filter((t) => protocolTypes.has(t)).length,
    expectedProtocolTypes.length,
  );

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 4: Communication Device Availability Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalDevices = communication_device_records.length;
  const devicesTested = communication_device_records.filter(
    (d) => d.tested,
  ).length;
  const devicesTestPassed = communication_device_records.filter(
    (d) => d.tested && d.test_passed,
  ).length;
  const devicesFaulty = communication_device_records.filter(
    (d) => d.condition === "faulty" || d.condition === "poor",
  ).length;
  const batteryChecked = communication_device_records.filter(
    (d) => d.battery_checked,
  ).length;
  const signalConfirmed = communication_device_records.filter(
    (d) => d.signal_confirmed,
  ).length;

  // Unique staff with devices
  const staffWithDevices = new Set(
    communication_device_records
      .filter((d) => d.issued)
      .map((d) => d.staff_id),
  );
  const communicationDeviceRate = pct(staffWithDevices.size, total_staff);

  const deviceTestRate = pct(devicesTested, totalDevices);
  const deviceTestPassRate = pct(devicesTestPassed, devicesTested);
  const batteryCheckRate = pct(batteryChecked, totalDevices);
  const signalConfirmRate = pct(signalConfirmed, totalDevices);

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 5: Incident Reporting Rate
  // ════════════════════════════════════════════════════════════════════════

  const totalIncidents = incident_reporting_records.length;
  const incidentsReportedTimely = incident_reporting_records.filter(
    (i) => i.reported_timely,
  ).length;
  const investigationsCompleted = incident_reporting_records.filter(
    (i) => i.investigation_completed,
  ).length;
  const lessonsDocumented = incident_reporting_records.filter(
    (i) => i.lessons_learned_documented,
  ).length;
  const riskAssessmentUpdated = incident_reporting_records.filter(
    (i) => i.risk_assessment_updated,
  ).length;
  const debriefsOffered = incident_reporting_records.filter(
    (i) => i.debrief_offered,
  ).length;
  const debriefsCompleted = incident_reporting_records.filter(
    (i) => i.debrief_completed,
  ).length;

  const incidentReportingRate = pct(incidentsReportedTimely, totalIncidents);
  const investigationRate = pct(investigationsCompleted, totalIncidents);
  const lessonsLearnedRate = pct(lessonsDocumented, totalIncidents);
  const debriefOfferRate = pct(debriefsOffered, totalIncidents);
  const debriefCompletionRate = pct(debriefsCompleted, debriefsOffered);

  // Follow-up completion
  const totalFollowUpActions = incident_reporting_records.reduce(
    (sum, i) => sum + i.follow_up_actions,
    0,
  );
  const totalFollowUpCompleted = incident_reporting_records.reduce(
    (sum, i) => sum + i.follow_up_completed,
    0,
  );
  const followUpCompletionRate = pct(totalFollowUpCompleted, totalFollowUpActions);

  // Incident severity breakdown
  const criticalIncidents = incident_reporting_records.filter(
    (i) => i.severity === "critical",
  ).length;
  const highSeverityIncidents = incident_reporting_records.filter(
    (i) => i.severity === "high",
  ).length;

  const nearMisses = incident_reporting_records.filter(
    (i) => i.incident_type === "near_miss",
  ).length;

  // ════════════════════════════════════════════════════════════════════════
  // METRIC 6: Staff Confidence Rate (composite)
  // ════════════════════════════════════════════════════════════════════════

  // Staff confidence is a composite of:
  // - Staff with current risk assessment
  // - Staff with protocol signed
  // - Staff with device issued
  // - Staff with check-in records
  const confidenceFactors: number[] = [];
  if (total_staff > 0) {
    confidenceFactors.push(pct(staffWithCurrentAssessments.size, total_staff));
    confidenceFactors.push(pct(staffWithProtocols.size, total_staff));
    confidenceFactors.push(pct(staffWithDevices.size, total_staff));
    confidenceFactors.push(pct(staffWithCheckIns.size, total_staff));
  }
  const staffConfidenceRate =
    confidenceFactors.length > 0
      ? Math.round(
          confidenceFactors.reduce((s, v) => s + v, 0) /
            confidenceFactors.length,
        )
      : null;

  // ════════════════════════════════════════════════════════════════════════
  // SCORING — base 52, max bonuses +28
  // ════════════════════════════════════════════════════════════════════════

  let score = 52;

  // Bonus 1: Risk assessment coverage (+4 / +2)
  if (riskAssessmentRate >= 100) score += 4;
  else if (riskAssessmentRate >= 85) score += 2;

  // Bonus 2: Check-in compliance (+4 / +2)
  if (checkInComplianceRate >= 100) score += 4;
  else if (checkInComplianceRate >= 85) score += 2;

  // Bonus 3: Safety protocol adherence (+4 / +2)
  if (safetyProtocolRate >= 100) score += 4;
  else if (safetyProtocolRate >= 85) score += 2;

  // Bonus 4: Communication device coverage (+4 / +2)
  if (communicationDeviceRate >= 100) score += 4;
  else if (communicationDeviceRate >= 85) score += 2;

  // Bonus 5: Incident reporting timeliness (+3 / +1)
  if (incidentReportingRate >= 100) score += 3;
  else if (incidentReportingRate >= 85) score += 1;

  // Bonus 6: Training completion rate (+3 / +1)
  if (trainingCompletionRate >= 100) score += 3;
  else if (trainingCompletionRate >= 85) score += 1;

  // Bonus 7: Emergency procedures documented (+3 / +1)
  if (emergencyDocumentedRate >= 100) score += 3;
  else if (emergencyDocumentedRate >= 85) score += 1;

  // Bonus 8: Investigation completion (+3 / +1)
  if (investigationRate >= 100) score += 3;
  else if (investigationRate >= 85) score += 1;

  // Penalty 1: Risk assessment coverage < 50%
  if (risk_assessment_records.length > 0 && riskAssessmentRate < 50) score -= 6;

  // Penalty 2: Check-in compliance < 50%
  if (check_in_records.length > 0 && checkInComplianceRate < 50) score -= 5;

  // Penalty 3: Communication device coverage < 50%
  if (communication_device_records.length > 0 && communicationDeviceRate < 50) score -= 5;

  // Penalty 4: Critical/high incidents without investigation
  if (incident_reporting_records.length > 0) {
    const uninvestigatedSevere = incident_reporting_records.filter(
      (i) =>
        (i.severity === "critical" || i.severity === "high") &&
        !i.investigation_completed,
    ).length;
    if (uninvestigatedSevere > 0) score -= 4;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (riskAssessmentRate >= 100 && totalRiskAssessments > 0) {
    strengths.push(
      `All ${total_staff} staff have current lone working risk assessments — 100% coverage demonstrates comprehensive risk management.`,
    );
  } else if (riskAssessmentRate >= 85 && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% of staff have current lone working risk assessments — strong risk assessment coverage across the team.`,
    );
  }

  if (checkInComplianceRate >= 100 && totalCheckIns > 0) {
    strengths.push(
      `100% check-in compliance across ${totalScheduledCheckIns} scheduled check-ins — every welfare check was completed during lone working shifts.`,
    );
  } else if (checkInComplianceRate >= 90 && totalCheckIns > 0) {
    strengths.push(
      `${checkInComplianceRate}% check-in compliance rate — the vast majority of scheduled welfare checks are being completed.`,
    );
  }

  if (safetyProtocolRate >= 100 && totalProtocols > 0) {
    strengths.push(
      `All ${totalProtocols} safety protocol acknowledgements signed — every staff member has confirmed understanding of lone working procedures.`,
    );
  } else if (safetyProtocolRate >= 85 && totalProtocols > 0) {
    strengths.push(
      `${safetyProtocolRate}% safety protocol sign-off rate — most staff have acknowledged and signed lone working safety protocols.`,
    );
  }

  if (communicationDeviceRate >= 100 && totalDevices > 0) {
    strengths.push(
      `All staff have communication devices issued — 100% coverage ensures every lone worker can summon help in an emergency.`,
    );
  } else if (communicationDeviceRate >= 85 && totalDevices > 0) {
    strengths.push(
      `${communicationDeviceRate}% communication device coverage — the majority of staff have devices for emergency communication during lone working.`,
    );
  }

  if (incidentReportingRate >= 100 && totalIncidents > 0) {
    strengths.push(
      `All ${totalIncidents} lone working incidents reported within the required timescale — timely reporting enables rapid response and learning.`,
    );
  } else if (incidentReportingRate >= 85 && totalIncidents > 0) {
    strengths.push(
      `${incidentReportingRate}% of lone working incidents reported timely — strong reporting culture supports continuous safety improvement.`,
    );
  }

  if (trainingCompletionRate >= 100 && totalProtocols > 0) {
    strengths.push(
      "All staff have completed lone working safety training — the team is equipped with the knowledge and skills to work safely alone.",
    );
  } else if (trainingCompletionRate >= 90 && totalProtocols > 0) {
    strengths.push(
      `${trainingCompletionRate}% lone working training completion — nearly all staff have received appropriate safety training.`,
    );
  }

  if (emergencyDocumentedRate >= 100 && totalRiskAssessments > 0) {
    strengths.push(
      "Emergency procedures documented in all risk assessments — every lone working scenario has a documented emergency response plan.",
    );
  }

  if (approvalRate >= 100 && totalRiskAssessments > 0) {
    strengths.push(
      `All ${totalRiskAssessments} risk assessments have management approval — evidencing robust management oversight of lone working safety.`,
    );
  }

  if (investigationRate >= 100 && totalIncidents > 0) {
    strengths.push(
      `All ${totalIncidents} lone working incidents have completed investigations — the home thoroughly investigates every incident to prevent recurrence.`,
    );
  }

  if (welfareConfirmRate >= 100 && totalCheckIns > 0) {
    strengths.push(
      "Welfare confirmed in 100% of check-ins — consistent evidence of staff wellbeing being actively monitored during lone shifts.",
    );
  }

  if (
    deviceTestRate >= 100 &&
    deviceTestPassRate >= 100 &&
    totalDevices > 0
  ) {
    strengths.push(
      `All ${totalDevices} communication devices tested and passed — equipment is verified as functional and reliable.`,
    );
  }

  if (lessonsLearnedRate >= 100 && totalIncidents > 0) {
    strengths.push(
      "Lessons learned documented for all incidents — a learning culture that continuously improves lone working safety.",
    );
  }

  if (
    debriefOfferRate >= 100 &&
    debriefCompletionRate >= 100 &&
    totalIncidents > 0 &&
    debriefsOffered > 0
  ) {
    strengths.push(
      "Debriefs offered and completed for all incidents — staff are supported through structured reflection after lone working events.",
    );
  }

  if (assessmentShiftTypes.size >= 4 && totalRiskAssessments > 0) {
    strengths.push(
      `Risk assessments cover ${assessmentShiftTypes.size} different shift types — comprehensive assessment across all working patterns including nights and sleep-ins.`,
    );
  }

  if (protocolTypeCoverage >= 100) {
    strengths.push(
      "All 6 lone working protocol types covered — policy, risk assessment, emergency, check-in, device usage, and reporting procedures are all addressed.",
    );
  }

  if (nearMisses > 0 && totalIncidents > 0) {
    const nearMissRate = pct(nearMisses, totalIncidents);
    if (nearMissRate >= 30) {
      strengths.push(
        `${nearMissRate}% of incidents are near misses — a healthy near-miss reporting rate indicates a proactive safety culture rather than reactive incident management.`,
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (expiredAssessments > 0) {
    concerns.push(
      `${expiredAssessments} lone working risk assessment${expiredAssessments > 1 ? "s have" : " has"} expired — staff may be working alone under outdated risk controls that no longer reflect current hazards.`,
    );
  }

  if (dueReviewAssessments > 0) {
    concerns.push(
      `${dueReviewAssessments} risk assessment${dueReviewAssessments > 1 ? "s are" : " is"} due for review — timely review ensures control measures remain proportionate and effective.`,
    );
  }

  if (riskAssessmentRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Only ${riskAssessmentRate}% of staff have a current lone working risk assessment — more than half the team lacks documented risk controls for working alone.`,
    );
  } else if (
    riskAssessmentRate < 80 &&
    riskAssessmentRate >= 50 &&
    totalRiskAssessments > 0
  ) {
    concerns.push(
      `Risk assessment coverage at ${riskAssessmentRate}% — not all staff who work alone have a current, individual risk assessment.`,
    );
  }

  if (highRiskAssessments > 0) {
    concerns.push(
      `${highRiskAssessments} staff assessed as high risk for lone working — these staff require enhanced control measures, more frequent check-ins, and potentially restricted lone working permissions.`,
    );
  }

  if (totalMissedCheckIns > 0) {
    concerns.push(
      `${totalMissedCheckIns} check-in${totalMissedCheckIns > 1 ? "s were" : " was"} missed during lone working shifts — missed welfare checks mean staff safety was not confirmed during these periods.`,
    );
  }

  if (totalLateCheckIns > 0) {
    concerns.push(
      `${totalLateCheckIns} check-in${totalLateCheckIns > 1 ? "s were" : " was"} completed late — delayed check-ins reduce the effectiveness of welfare monitoring.`,
    );
  }

  if (checkInComplianceRate < 50 && totalCheckIns > 0) {
    concerns.push(
      `Check-in compliance at only ${checkInComplianceRate}% — fewer than half of scheduled check-ins were completed, creating significant gaps in staff welfare monitoring.`,
    );
  }

  if (escalationsTriggered > 0) {
    concerns.push(
      `${escalationsTriggered} escalation${escalationsTriggered > 1 ? "s were" : " was"} triggered during lone working — escalation events indicate potential safety concerns that required immediate response.`,
    );
  }

  if (safetyProtocolRate < 50 && totalProtocols > 0) {
    concerns.push(
      `Only ${safetyProtocolRate}% of safety protocols signed — more than half of staff may not have formally acknowledged lone working procedures.`,
    );
  } else if (
    safetyProtocolRate < 80 &&
    safetyProtocolRate >= 50 &&
    totalProtocols > 0
  ) {
    concerns.push(
      `Safety protocol sign-off at ${safetyProtocolRate}% — some staff have not acknowledged understanding of lone working safety requirements.`,
    );
  }

  if (refresherOverdue > 0) {
    concerns.push(
      `${refresherOverdue} safety protocol refresher${refresherOverdue > 1 ? "s are" : " is"} overdue — staff knowledge may have deteriorated since initial training.`,
    );
  }

  if (trainingCompletionRate < 50 && totalProtocols > 0) {
    concerns.push(
      `Only ${trainingCompletionRate}% of staff have completed lone working safety training — the majority lack formal training in lone working procedures.`,
    );
  }

  if (communicationDeviceRate < 50 && totalDevices > 0) {
    concerns.push(
      `Only ${communicationDeviceRate}% of staff have communication devices — more than half the team may be working alone without the means to summon help in an emergency.`,
    );
  } else if (
    communicationDeviceRate < 80 &&
    communicationDeviceRate >= 50 &&
    totalDevices > 0
  ) {
    concerns.push(
      `Communication device coverage at ${communicationDeviceRate}% — not all lone workers have an issued device for emergency communication.`,
    );
  }

  if (devicesFaulty > 0) {
    concerns.push(
      `${devicesFaulty} communication device${devicesFaulty > 1 ? "s are" : " is"} in poor or faulty condition — unreliable devices compromise staff safety during lone working.`,
    );
  }

  if (deviceTestRate < 50 && totalDevices > 0) {
    concerns.push(
      `Only ${deviceTestRate}% of devices have been tested — untested equipment may fail when needed most.`,
    );
  }

  if (incidentReportingRate < 50 && totalIncidents > 0) {
    concerns.push(
      `Only ${incidentReportingRate}% of incidents reported within the required timescale — delayed reporting prevents timely investigation and remedial action.`,
    );
  }

  if (criticalIncidents > 0) {
    concerns.push(
      `${criticalIncidents} critical incident${criticalIncidents > 1 ? "s" : ""} during lone working — critical events demand immediate investigation, debrief, and potential policy revision.`,
    );
  }

  if (highSeverityIncidents > 0) {
    concerns.push(
      `${highSeverityIncidents} high severity incident${highSeverityIncidents > 1 ? "s" : ""} during lone working — review control measures and consider whether additional staffing is required for affected scenarios.`,
    );
  }

  if (investigationRate < 50 && totalIncidents > 0) {
    concerns.push(
      `Only ${investigationRate}% of incidents have completed investigations — uninvestigated incidents prevent learning and leave root causes unaddressed.`,
    );
  }

  if (followUpCompletionRate < 50 && totalFollowUpActions > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of follow-up actions completed — outstanding actions from incident investigations remain unresolved.`,
    );
  }

  if (debriefOfferRate < 50 && totalIncidents > 0) {
    concerns.push(
      `Debriefs offered for only ${debriefOfferRate}% of incidents — staff involved in lone working incidents may not be receiving adequate emotional and practical support.`,
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  const recs: LoneWorkingRecommendation[] = [];
  let rank = 1;

  if (expiredAssessments > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review and renew ${expiredAssessments} expired lone working risk assessment${expiredAssessments > 1 ? "s" : ""} immediately — no staff member should work alone under an expired assessment. Update hazards, control measures, and emergency procedures to reflect current conditions.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (riskAssessmentRate < 80 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase risk assessment coverage from ${riskAssessmentRate}% to 100% — every staff member who works alone must have an individual, current risk assessment. Reg 16 requires the home to ensure staff are safe and properly supported.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (checkInComplianceRate < 85 && totalCheckIns > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve check-in compliance from ${checkInComplianceRate}% — ensure all scheduled welfare checks are completed on time during lone working shifts. Consider automated reminders and escalation protocols for missed check-ins.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (communicationDeviceRate < 85 && total_staff > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase communication device coverage from ${communicationDeviceRate}% — all lone workers must have access to a functioning device (mobile phone, radio, personal alarm, or lone worker device) to summon help.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (devicesFaulty > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Replace or repair ${devicesFaulty} faulty/poor condition communication device${devicesFaulty > 1 ? "s" : ""} — equipment must be in good working order to ensure staff can contact help during emergencies.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (
    criticalIncidents > 0 &&
    incident_reporting_records.filter(
      (i) => i.severity === "critical" && !i.investigation_completed,
    ).length > 0
  ) {
    const uninvestigatedCritical = incident_reporting_records.filter(
      (i) => i.severity === "critical" && !i.investigation_completed,
    ).length;
    recs.push({
      rank: rank++,
      recommendation: `Complete investigation of ${uninvestigatedCritical} critical incident${uninvestigatedCritical > 1 ? "s" : ""} immediately — critical lone working incidents require thorough investigation, root cause analysis, and policy revision.`,
      urgency: "immediate",
      regulatory_ref: "SCCIF Safety",
    });
  }

  if (safetyProtocolRate < 85 && totalProtocols > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase safety protocol sign-off from ${safetyProtocolRate}% — all staff must formally acknowledge understanding of the lone working policy, check-in protocols, emergency procedures, and device usage before working alone.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (trainingCompletionRate < 85 && totalProtocols > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve lone working safety training completion from ${trainingCompletionRate}% — allocate protected time for all staff to complete mandatory training covering risk awareness, emergency response, and communication procedures.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (refresherOverdue > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Schedule ${refresherOverdue} overdue safety protocol refresher${refresherOverdue > 1 ? "s" : ""} — regular refresher training ensures staff knowledge remains current and safety practices do not deteriorate.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (emergencyDocumentedRate < 85 && totalRiskAssessments > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Document emergency procedures in all risk assessments — currently ${emergencyDocumentedRate}%. Each lone working scenario must have a clear, documented emergency response plan.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (incidentReportingRate < 85 && totalIncidents > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve incident reporting timeliness from ${incidentReportingRate}% — establish clear timescales for reporting lone working incidents and ensure staff understand the reporting process.`,
      urgency: "soon",
      regulatory_ref: "SCCIF Safety",
    });
  }

  if (investigationRate < 85 && totalIncidents > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Complete investigations for all lone working incidents — currently ${investigationRate}%. Every incident requires investigation to identify root causes and prevent recurrence.`,
      urgency: "soon",
      regulatory_ref: "SCCIF Safety",
    });
  }

  if (debriefOfferRate < 85 && totalIncidents > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Offer debriefs for all lone working incidents — currently ${debriefOfferRate}%. Staff need structured support after incidents to process the event and maintain wellbeing.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (followUpCompletionRate < 80 && totalFollowUpActions > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Complete outstanding follow-up actions from incident investigations — currently ${followUpCompletionRate}% completed. Unresolved actions undermine the learning from incidents.`,
      urgency: "soon",
      regulatory_ref: "SCCIF Safety",
    });
  }

  if (deviceTestRate < 85 && totalDevices > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Increase device testing from ${deviceTestRate}% — implement a regular testing schedule for all communication devices to ensure they function reliably when needed.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (lessonsLearnedRate < 80 && totalIncidents > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Improve lessons learned documentation from ${lessonsLearnedRate}% — documenting and sharing learning from incidents drives continuous improvement in lone working safety.`,
      urgency: "planned",
      regulatory_ref: "SCCIF Safety",
    });
  }

  if (protocolTypeCoverage < 100) {
    const missingTypes = expectedProtocolTypes.filter(
      (t) => !protocolTypes.has(t),
    );
    recs.push({
      rank: rank++,
      recommendation: `Address gaps in protocol coverage — the following protocol types are missing: ${missingTypes.join(", ")}. A comprehensive lone working framework requires all protocol types to be addressed.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (approvalRate < 85 && totalRiskAssessments > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Ensure management approval for all risk assessments — currently ${approvalRate}%. Unsigned assessments lack the management oversight required to evidence compliance.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16",
    });
  }

  if (assessmentShiftTypes.size < 3 && totalRiskAssessments > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Expand risk assessment coverage across shift types — currently covering ${assessmentShiftTypes.size} type${assessmentShiftTypes.size > 1 ? "s" : ""}. Risk assessments should cover day, evening, night, sleep-in, and waking night shifts as each presents different hazards.`,
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  const insights: LoneWorkingInsight[] = [];

  // ── Critical insights ────────────────────────────────────────────────

  if (riskAssessmentRate < 50 && total_staff > 0) {
    insights.push({
      text: `Fewer than half of staff have a current lone working risk assessment (${riskAssessmentRate}%). This is a serious deficiency. Under Regulation 16, the registered person must ensure staff are deployed safely with appropriate skills and experience. Without individual risk assessments, the home cannot demonstrate it has identified and mitigated the specific hazards associated with lone working for each member of staff. Ofsted will view this as a significant leadership and management failure.`,
      severity: "critical",
    });
  }

  if (checkInComplianceRate < 50 && totalCheckIns > 0) {
    insights.push({
      text: `Check-in compliance is critically low at ${checkInComplianceRate}%. When staff work alone, scheduled welfare checks are the primary mechanism for confirming their safety. Fewer than half of scheduled check-ins were completed, meaning staff welfare was unconfirmed for significant periods during lone working shifts. This creates an unacceptable safety gap that must be addressed immediately.`,
      severity: "critical",
    });
  }

  if (communicationDeviceRate < 50 && total_staff > 0) {
    insights.push({
      text: `Fewer than half of staff have a communication device issued (${communicationDeviceRate}%). Staff working alone without the ability to summon help are at serious risk. The Health and Safety Executive guidance on lone working is clear that employers must ensure lone workers can communicate with someone who can provide assistance. This represents a fundamental failure in the home's duty of care to its staff.`,
      severity: "critical",
    });
  }

  if (criticalIncidents >= 2) {
    insights.push({
      text: `${criticalIncidents} critical incidents have occurred during lone working. A pattern of critical incidents suggests systemic problems with the home's lone working arrangements. Review whether lone working is appropriate for the scenarios in which these incidents occurred, and consider whether additional staffing, enhanced security measures, or revised protocols are needed.`,
      severity: "critical",
    });
  } else if (criticalIncidents === 1) {
    insights.push({
      text: "A critical incident occurred during lone working. While isolated critical events can occur, this demands a thorough investigation, policy review, and consideration of whether the lone working arrangements for the affected scenario remain appropriate.",
      severity: "critical",
    });
  }

  if (
    totalIncidents > 0 &&
    investigationRate < 50
  ) {
    insights.push({
      text: `Fewer than half of lone working incidents have completed investigations (${investigationRate}%). Without thorough investigation, root causes remain unidentified and the same hazards continue to put staff at risk. The SCCIF expects homes to learn from incidents and adapt their practice accordingly.`,
      severity: "critical",
    });
  }

  if (
    expiredAssessments >= 3
  ) {
    insights.push({
      text: `${expiredAssessments} risk assessments have expired. A pattern of expired assessments suggests the home is not maintaining its risk management framework. Expired assessments mean staff are working under outdated risk controls that may no longer reflect the actual hazards they face. This is a compliance failure under Regulation 16 that Ofsted will scrutinise.`,
      severity: "critical",
    });
  }

  // ── Warning insights ─────────────────────────────────────────────────

  if (
    totalMissedCheckIns > 0 &&
    totalMissedCheckIns < totalScheduledCheckIns
  ) {
    const missedPct = pct(totalMissedCheckIns, totalScheduledCheckIns);
    if (missedPct >= 10 && missedPct < 50) {
      insights.push({
        text: `${totalMissedCheckIns} check-ins were missed (${missedPct}% of total). While the majority of check-ins are being completed, missed welfare checks represent periods where staff safety was not confirmed. Review the reasons for missed check-ins and whether the check-in schedule is realistic and well-understood.`,
        severity: "warning",
      });
    }
  }

  if (escalationsTriggered > 0) {
    insights.push({
      text: `${escalationsTriggered} escalation${escalationsTriggered > 1 ? "s were" : " was"} triggered during lone working check-ins. Escalations indicate that staff could not be contacted or welfare could not be confirmed at the scheduled time. Review escalation outcomes to determine whether the escalation protocol is effective and whether staff are at undue risk.`,
      severity: "warning",
    });
  }

  if (
    refresherOverdue >= 3
  ) {
    insights.push({
      text: `${refresherOverdue} safety protocol refreshers are overdue. Staff knowledge of lone working procedures deteriorates over time. Without regular refresher training, staff may forget key protocols, emergency numbers, or equipment operation procedures. Prioritise scheduling overdue refreshers for all affected staff.`,
      severity: "warning",
    });
  } else if (refresherOverdue > 0) {
    insights.push({
      text: `${refresherOverdue} safety protocol refresher${refresherOverdue > 1 ? "s are" : " is"} overdue — schedule these promptly to maintain staff competence in lone working safety procedures.`,
      severity: "warning",
    });
  }

  if (devicesFaulty > 0) {
    insights.push({
      text: `${devicesFaulty} communication device${devicesFaulty > 1 ? "s are" : " is"} in poor or faulty condition. A faulty device is potentially worse than no device at all, as staff may believe they can summon help when in reality the equipment will fail. Replace or repair faulty devices before the next lone working shift.`,
      severity: "warning",
    });
  }

  if (
    highRiskAssessments > 0 &&
    totalRiskAssessments > 0
  ) {
    const highRiskPct = pct(highRiskAssessments, totalRiskAssessments);
    if (highRiskPct >= 30) {
      insights.push({
        text: `${highRiskPct}% of risk assessments identify high risk lone working scenarios. A high proportion of high-risk assessments suggests the home's lone working arrangements may be inherently challenging. Consider whether some high-risk scenarios can be eliminated through additional staffing or whether enhanced control measures are needed.`,
        severity: "warning",
      });
    }
  }

  if (
    debriefOfferRate < 50 &&
    totalIncidents > 0
  ) {
    insights.push({
      text: `Debriefs were offered for only ${debriefOfferRate}% of incidents. Staff who experience lone working incidents without a structured debrief may develop anxiety about working alone, leading to increased sickness absence, reduced morale, and potential staff turnover. Offering debriefs is both a duty of care and a retention strategy.`,
      severity: "warning",
    });
  }

  if (
    followUpCompletionRate < 50 &&
    totalFollowUpActions > 0
  ) {
    insights.push({
      text: `Only ${followUpCompletionRate}% of incident follow-up actions are completed. Outstanding follow-up actions mean that the learning from incidents is not being translated into improved practice. Each incomplete action represents a missed opportunity to make lone working safer.`,
      severity: "warning",
    });
  }

  if (
    safetyProtocolRate < 70 &&
    safetyProtocolRate >= 50 &&
    totalProtocols > 0
  ) {
    insights.push({
      text: `Safety protocol sign-off rate is ${safetyProtocolRate}%. While more than half of staff have signed, a significant minority have not formally acknowledged the lone working procedures. This weakens the home's compliance position and means some staff may not understand the protocols they are expected to follow.`,
      severity: "warning",
    });
  }

  if (
    competencyRate < 80 &&
    competencyAssessed > 0
  ) {
    insights.push({
      text: `Only ${competencyRate}% of competency-assessed staff passed their assessment. Staff who do not pass competency assessments should not be permitted to work alone until they demonstrate adequate knowledge and skill. Review the training and support provided to staff who did not pass.`,
      severity: "warning",
    });
  }

  if (
    riskAssessmentUpdated < totalIncidents &&
    totalIncidents > 0
  ) {
    const updateRate = pct(riskAssessmentUpdated, totalIncidents);
    if (updateRate < 50) {
      insights.push({
        text: `Risk assessments were updated after only ${updateRate}% of incidents. Incidents should trigger a review of the relevant risk assessment to determine whether additional control measures are needed. Failing to update risk assessments after incidents means the same hazards may continue unchecked.`,
        severity: "warning",
      });
    }
  }

  // ── Positive insights ────────────────────────────────────────────────

  if (
    riskAssessmentRate >= 100 &&
    checkInComplianceRate >= 95 &&
    safetyProtocolRate >= 100 &&
    communicationDeviceRate >= 100 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: `Exemplary lone working safety: 100% risk assessment coverage, ${checkInComplianceRate}% check-in compliance, 100% protocol sign-off, and 100% device coverage. This demonstrates a home that takes lone working safety seriously and has embedded robust systems to protect staff working alone. Well-placed for positive Ofsted findings on safety and leadership.`,
      severity: "positive",
    });
  } else if (
    riskAssessmentRate >= 85 &&
    checkInComplianceRate >= 85 &&
    safetyProtocolRate >= 85 &&
    communicationDeviceRate >= 85 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: `Good lone working safety framework — ${riskAssessmentRate}% risk assessment coverage, ${checkInComplianceRate}% check-in compliance, ${safetyProtocolRate}% protocol adherence, and ${communicationDeviceRate}% device coverage. Minor improvements in the remaining gaps could elevate this to outstanding practice.`,
      severity: "positive",
    });
  }

  if (
    incidentReportingRate >= 100 &&
    investigationRate >= 100 &&
    lessonsLearnedRate >= 100 &&
    totalIncidents > 0
  ) {
    insights.push({
      text: `Incident management is exemplary — 100% timely reporting, 100% investigations completed, and lessons learned documented for every incident. This cycle of report-investigate-learn-improve is precisely what Ofsted expects to see in a well-managed home.`,
      severity: "positive",
    });
  } else if (
    incidentReportingRate >= 85 &&
    investigationRate >= 85 &&
    totalIncidents > 0
  ) {
    insights.push({
      text: `Strong incident reporting culture — ${incidentReportingRate}% timely reporting and ${investigationRate}% investigation completion. The home is demonstrating a commitment to learning from lone working incidents.`,
      severity: "positive",
    });
  }

  if (
    trainingCompletionRate >= 100 &&
    competencyRate >= 100 &&
    competencyAssessed > 0
  ) {
    insights.push({
      text: "All staff have completed lone working safety training and passed competency assessment — the team is fully equipped with the knowledge and skills to work safely alone. This evidences a thorough approach to staff development that Ofsted will recognise.",
      severity: "positive",
    });
  }

  if (
    welfareConfirmRate >= 100 &&
    timelyResponseRate >= 100 &&
    totalCheckIns > 0
  ) {
    insights.push({
      text: "Welfare confirmed in 100% of check-ins with 100% timely response rate — the check-in system is working effectively to monitor staff safety during lone working shifts.",
      severity: "positive",
    });
  }

  if (
    assessmentLocationsCovered.size >= 3 &&
    assessmentShiftTypes.size >= 3 &&
    totalRiskAssessments > 0
  ) {
    insights.push({
      text: `Risk assessments cover ${assessmentLocationsCovered.size} locations and ${assessmentShiftTypes.size} shift types — the home has taken a comprehensive approach to assessing risks across all contexts where lone working occurs.`,
      severity: "positive",
    });
  }

  if (
    totalDevices > 0 &&
    deviceTestRate >= 100 &&
    batteryCheckRate >= 100 &&
    signalConfirmRate >= 100
  ) {
    insights.push({
      text: "All communication devices have been tested, batteries checked, and signal confirmed — a thorough approach to equipment reliability that ensures devices will function when staff need them most.",
      severity: "positive",
    });
  }

  if (
    debriefOfferRate >= 100 &&
    debriefCompletionRate >= 80 &&
    totalIncidents > 0 &&
    debriefsOffered > 0
  ) {
    insights.push({
      text: `Debriefs offered for all incidents with ${debriefCompletionRate}% completion — staff are being actively supported following lone working events, demonstrating a commitment to staff wellbeing alongside safety.`,
      severity: "positive",
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ════════════════════════════════════════════════════════════════════════

  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding lone working safety — ${riskAssessmentRate}% risk assessment coverage, ${checkInComplianceRate}% check-in compliance, ${communicationDeviceRate}% device coverage across ${total_staff} staff.`;
  } else if (rating === "good") {
    const issues: string[] = [];
    if (expiredAssessments > 0)
      issues.push(`${expiredAssessments} expired assessment${expiredAssessments > 1 ? "s" : ""}`);
    if (checkInComplianceRate < 100 && totalCheckIns > 0)
      issues.push(`check-in compliance at ${checkInComplianceRate}%`);
    if (communicationDeviceRate < 100 && totalDevices > 0)
      issues.push(`device coverage at ${communicationDeviceRate}%`);
    if (refresherOverdue > 0)
      issues.push(`${refresherOverdue} overdue refresher${refresherOverdue > 1 ? "s" : ""}`);
    headline =
      issues.length > 0
        ? `Good lone working safety practice — attention needed on ${issues.join(", ")}.`
        : "Good lone working safety — systems are well-established to protect staff working alone.";
  } else if (rating === "adequate") {
    headline =
      "Adequate lone working safety — gaps in risk assessment coverage, check-in compliance, or device availability require focused improvement.";
  } else {
    headline =
      "Lone working safety is inadequate — statutory requirements under Reg 16 and Reg 25 are not being met, creating unacceptable risk to staff and children.";
  }

  // ════════════════════════════════════════════════════════════════════════
  // RETURN
  // ════════════════════════════════════════════════════════════════════════

  return {
    lone_working_rating: rating,
    lone_working_score: score,
    headline,
    risk_assessment_rate: riskAssessmentRate,
    check_in_compliance_rate: checkInComplianceRate,
    safety_protocol_rate: safetyProtocolRate,
    communication_device_rate: communicationDeviceRate,
    incident_reporting_rate: incidentReportingRate,
    staff_confidence_rate: staffConfidenceRate,
    total_risk_assessments: totalRiskAssessments,
    current_assessments: currentAssessments,
    expired_assessments: expiredAssessments,
    high_risk_assessments: highRiskAssessments,
    total_check_ins: totalCheckIns,
    missed_check_ins: totalMissedCheckIns,
    escalations_triggered: escalationsTriggered,
    total_protocols: totalProtocols,
    protocols_signed: protocolsSigned,
    training_completed_count: trainingCompleted,
    refresher_overdue_count: refresherOverdue,
    total_devices: totalDevices,
    devices_tested: devicesTested,
    devices_faulty: devicesFaulty,
    total_incidents: totalIncidents,
    incidents_reported_timely: incidentsReportedTimely,
    investigations_completed: investigationsCompleted,
    debriefs_offered: debriefsOffered,
    debriefs_completed: debriefsCompleted,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
