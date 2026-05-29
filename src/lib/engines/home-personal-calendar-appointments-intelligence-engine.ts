// ==============================================================================
// CORNERSTONE -- HOME PERSONAL CALENDAR & APPOINTMENTS INTELLIGENCE ENGINE
// Monitors appointment management quality: appointment attendance rates,
// calendar management effectiveness, medical/dental/educational appointment
// compliance, transport arrangement timeliness, and child preparation for
// appointments.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (health care), Reg 8 (education), Reg 5 (engaging with the
// wider community), SCCIF health and wellbeing.
// Store keys: appointmentRecords, calendarManagementRecords,
//             medicalComplianceRecords, transportArrangementRecords,
//             childPreparationRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface AppointmentRecordInput {
  id: string;
  child_id: string;
  appointment_type: "medical" | "dental" | "optician" | "mental_health" | "camhs" | "education" | "pep" | "lac_review" | "social_worker" | "therapy" | "specialist" | "other";
  date: string;
  time_slot: string;
  attended: boolean;
  cancelled: boolean;
  cancelled_reason: string;
  cancelled_by: "home" | "child" | "professional" | "other" | "";
  rescheduled: boolean;
  rescheduled_within_14_days: boolean;
  outcome_recorded: boolean;
  follow_up_actions_identified: boolean;
  follow_up_actions_completed: boolean;
  child_consented: boolean;
  staff_accompanied: boolean;
  waiting_time_weeks: number;
  is_overdue: boolean;
  notes: string;
  created_at: string;
}

export interface CalendarManagementRecordInput {
  id: string;
  child_id: string;
  month: string;
  total_appointments_scheduled: number;
  appointments_in_calendar: number;
  reminders_set: boolean;
  conflicts_identified: number;
  conflicts_resolved: number;
  advance_notice_days: number;
  calendar_shared_with_child: boolean;
  calendar_shared_with_social_worker: boolean;
  calendar_accurate: boolean;
  missed_from_calendar: number;
  double_bookings: number;
  created_at: string;
}

export interface MedicalComplianceRecordInput {
  id: string;
  child_id: string;
  compliance_type: "annual_health_assessment" | "dental_checkup" | "optician_checkup" | "immunisation" | "developmental_check" | "mental_health_review" | "specialist_followup" | "medication_review" | "other";
  due_date: string;
  completed: boolean;
  completed_date: string | null;
  overdue: boolean;
  days_overdue: number;
  reason_incomplete: string;
  health_plan_updated: boolean;
  consent_obtained: boolean;
  outcome_documented: boolean;
  professional_attending: string;
  created_at: string;
}

export interface TransportArrangementRecordInput {
  id: string;
  child_id: string;
  appointment_id: string;
  transport_type: "staff_vehicle" | "taxi" | "public_transport" | "walking" | "parent_transport" | "professional_transport" | "other";
  arranged_in_advance: boolean;
  advance_notice_hours: number;
  on_time: boolean;
  delay_minutes: number;
  child_comfortable: boolean;
  appropriate_vehicle: boolean;
  staff_driver_checked: boolean;
  backup_plan_in_place: boolean;
  cost_approved: boolean;
  distance_miles: number;
  created_at: string;
}

export interface ChildPreparationRecordInput {
  id: string;
  child_id: string;
  appointment_id: string;
  preparation_type: "verbal_explanation" | "social_story" | "visit_plan" | "visual_schedule" | "practice_session" | "written_information" | "peer_support" | "other";
  child_informed_in_advance: boolean;
  advance_notice_hours: number;
  child_anxieties_addressed: boolean;
  preferences_captured: boolean;
  child_chose_accompaniment: boolean;
  debrief_after: boolean;
  child_feedback_captured: boolean;
  child_satisfaction: number; // 1-5
  autonomy_supported: boolean;
  age_appropriate_information: boolean;
  created_at: string;
}

export interface PersonalCalendarInput {
  today: string;
  total_children: number;
  appointment_records: AppointmentRecordInput[];
  calendar_management_records: CalendarManagementRecordInput[];
  medical_compliance_records: MedicalComplianceRecordInput[];
  transport_arrangement_records: TransportArrangementRecordInput[];
  child_preparation_records: ChildPreparationRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type PersonalCalendarRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PersonalCalendarInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PersonalCalendarRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PersonalCalendarResult {
  calendar_rating: PersonalCalendarRating;
  calendar_score: number;
  headline: string;
  appointment_attendance_rate: number;
  calendar_accuracy_rate: number;
  medical_compliance_rate: number;
  transport_timeliness_rate: number;
  child_preparation_rate: number;
  child_autonomy_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PersonalCalendarRecommendation[];
  insights: PersonalCalendarInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PersonalCalendarRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: PersonalCalendarRating,
  score: number,
  headline: string,
): PersonalCalendarResult {
  return {
    calendar_rating: rating,
    calendar_score: score,
    headline,
    appointment_attendance_rate: 0,
    calendar_accuracy_rate: 0,
    medical_compliance_rate: 0,
    transport_timeliness_rate: 0,
    child_preparation_rate: 0,
    child_autonomy_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computePersonalCalendarAppointments(
  input: PersonalCalendarInput,
): PersonalCalendarResult {
  const {
    total_children,
    appointment_records,
    calendar_management_records,
    medical_compliance_records,
    transport_arrangement_records,
    child_preparation_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    appointment_records.length === 0 &&
    calendar_management_records.length === 0 &&
    medical_compliance_records.length === 0 &&
    transport_arrangement_records.length === 0 &&
    child_preparation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess appointment management quality.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No appointment or calendar management data recorded despite children on placement -- appointment attendance, medical compliance, and child preparation require urgent attention.",
      ),
      concerns: [
        "No appointment records, calendar management data, medical compliance records, transport arrangements, or child preparation records exist despite children being on placement -- the home cannot evidence that children's health, education, and welfare appointments are being managed.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of all children's appointments including attendance, outcomes, transport arrangements, and child preparation to evidence the home's commitment to children's health and educational needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 -- Health care",
        },
        {
          rank: 2,
          recommendation:
            "Establish a comprehensive calendar management system for every child that tracks scheduled appointments, reminders, outcomes, and follow-up actions across all appointment types.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 8 -- Education",
        },
      ],
      insights: [
        {
          text: "The complete absence of appointment and calendar management records means Ofsted cannot verify that children's health, dental, educational, and welfare appointments are being scheduled, attended, or followed up. This represents a fundamental gap in Reg 14 and Reg 8 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Appointment attendance ---
  const totalAppointments = appointment_records.length;
  const attendedAppointments = appointment_records.filter((r) => r.attended).length;
  const appointmentAttendanceRate = pct(attendedAppointments, totalAppointments);

  const cancelledAppointments = appointment_records.filter((r) => r.cancelled).length;
  const cancellationRate = pct(cancelledAppointments, totalAppointments);

  const homeCancelled = appointment_records.filter(
    (r) => r.cancelled && r.cancelled_by === "home",
  ).length;
  const homeCancellationRate = pct(homeCancelled, totalAppointments);

  const rescheduledAppointments = appointment_records.filter((r) => r.rescheduled).length;
  const rescheduledWithin14Days = appointment_records.filter(
    (r) => r.rescheduled && r.rescheduled_within_14_days,
  ).length;
  const reschedulingTimelinessRate = pct(rescheduledWithin14Days, rescheduledAppointments);

  const outcomeRecorded = appointment_records.filter((r) => r.outcome_recorded).length;
  const outcomeRecordingRate = pct(outcomeRecorded, totalAppointments);

  const followUpIdentified = appointment_records.filter(
    (r) => r.follow_up_actions_identified,
  ).length;
  const followUpCompleted = appointment_records.filter(
    (r) => r.follow_up_actions_identified && r.follow_up_actions_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpIdentified);

  const consentObtained = appointment_records.filter((r) => r.child_consented).length;
  const consentRate = pct(consentObtained, totalAppointments);

  const staffAccompanied = appointment_records.filter((r) => r.staff_accompanied).length;
  const staffAccompanimentRate = pct(staffAccompanied, totalAppointments);

  const overdueAppointments = appointment_records.filter((r) => r.is_overdue).length;
  const overdueRate = pct(overdueAppointments, totalAppointments);

  const uniqueChildrenWithAppointments = new Set(
    appointment_records.map((r) => r.child_id),
  ).size;

  // --- Appointment type breakdown ---
  const medicalAppointments = appointment_records.filter(
    (r) => r.appointment_type === "medical" || r.appointment_type === "specialist" || r.appointment_type === "mental_health" || r.appointment_type === "camhs",
  );
  const medicalAttended = medicalAppointments.filter((r) => r.attended).length;
  const medicalAttendanceRate = pct(medicalAttended, medicalAppointments.length);

  const dentalAppointments = appointment_records.filter(
    (r) => r.appointment_type === "dental" || r.appointment_type === "optician",
  );
  const dentalAttended = dentalAppointments.filter((r) => r.attended).length;
  const dentalAttendanceRate = pct(dentalAttended, dentalAppointments.length);

  const educationAppointments = appointment_records.filter(
    (r) => r.appointment_type === "education" || r.appointment_type === "pep" || r.appointment_type === "lac_review",
  );
  const educationAttended = educationAppointments.filter((r) => r.attended).length;
  const educationAttendanceRate = pct(educationAttended, educationAppointments.length);

  // --- Calendar management ---
  const totalCalendarRecords = calendar_management_records.length;
  const totalScheduled = calendar_management_records.reduce(
    (sum, r) => sum + r.total_appointments_scheduled, 0,
  );
  const totalInCalendar = calendar_management_records.reduce(
    (sum, r) => sum + r.appointments_in_calendar, 0,
  );
  const calendarCaptureRate = pct(totalInCalendar, totalScheduled);

  const calendarAccurate = calendar_management_records.filter(
    (r) => r.calendar_accurate,
  ).length;
  const calendarAccuracyRate = pct(calendarAccurate, totalCalendarRecords);

  const remindersSet = calendar_management_records.filter(
    (r) => r.reminders_set,
  ).length;
  const reminderRate = pct(remindersSet, totalCalendarRecords);

  const totalConflicts = calendar_management_records.reduce(
    (sum, r) => sum + r.conflicts_identified, 0,
  );
  const totalConflictsResolved = calendar_management_records.reduce(
    (sum, r) => sum + r.conflicts_resolved, 0,
  );
  const conflictResolutionRate = pct(totalConflictsResolved, totalConflicts);

  const sharedWithChild = calendar_management_records.filter(
    (r) => r.calendar_shared_with_child,
  ).length;
  const childShareRate = pct(sharedWithChild, totalCalendarRecords);

  const sharedWithSW = calendar_management_records.filter(
    (r) => r.calendar_shared_with_social_worker,
  ).length;
  const swShareRate = pct(sharedWithSW, totalCalendarRecords);

  const totalMissedFromCalendar = calendar_management_records.reduce(
    (sum, r) => sum + r.missed_from_calendar, 0,
  );
  const missedFromCalendarRate = pct(totalMissedFromCalendar, totalScheduled);

  const totalDoubleBookings = calendar_management_records.reduce(
    (sum, r) => sum + r.double_bookings, 0,
  );
  const doubleBookingRate = pct(totalDoubleBookings, totalScheduled);

  const avgAdvanceNotice =
    totalCalendarRecords > 0
      ? Math.round(
          calendar_management_records.reduce((sum, r) => sum + r.advance_notice_days, 0) /
            totalCalendarRecords,
        )
      : 0;

  // --- Medical compliance ---
  const totalMedicalCompliance = medical_compliance_records.length;
  const completedCompliance = medical_compliance_records.filter(
    (r) => r.completed,
  ).length;
  const medicalComplianceRate = pct(completedCompliance, totalMedicalCompliance);

  const overdueCompliance = medical_compliance_records.filter(
    (r) => r.overdue,
  ).length;
  const overdueComplianceRate = pct(overdueCompliance, totalMedicalCompliance);

  const healthPlanUpdated = medical_compliance_records.filter(
    (r) => r.health_plan_updated,
  ).length;
  const healthPlanUpdateRate = pct(healthPlanUpdated, totalMedicalCompliance);

  const complianceConsentObtained = medical_compliance_records.filter(
    (r) => r.consent_obtained,
  ).length;
  const complianceConsentRate = pct(complianceConsentObtained, totalMedicalCompliance);

  const complianceOutcomeDocumented = medical_compliance_records.filter(
    (r) => r.outcome_documented,
  ).length;
  const complianceOutcomeRate = pct(complianceOutcomeDocumented, totalMedicalCompliance);

  const avgDaysOverdue =
    overdueCompliance > 0
      ? Math.round(
          medical_compliance_records
            .filter((r) => r.overdue)
            .reduce((sum, r) => sum + r.days_overdue, 0) / overdueCompliance,
        )
      : 0;

  // --- Compliance type breakdown ---
  const annualHealthAssessments = medical_compliance_records.filter(
    (r) => r.compliance_type === "annual_health_assessment",
  );
  const ahaCompleted = annualHealthAssessments.filter((r) => r.completed).length;
  const ahaCompletionRate = pct(ahaCompleted, annualHealthAssessments.length);

  const dentalCheckups = medical_compliance_records.filter(
    (r) => r.compliance_type === "dental_checkup",
  );
  const dentalCompleted = dentalCheckups.filter((r) => r.completed).length;
  const dentalCompletionRate = pct(dentalCompleted, dentalCheckups.length);

  const immunisations = medical_compliance_records.filter(
    (r) => r.compliance_type === "immunisation",
  );
  const immunisationCompleted = immunisations.filter((r) => r.completed).length;
  const immunisationRate = pct(immunisationCompleted, immunisations.length);

  // --- Transport arrangements ---
  const totalTransportRecords = transport_arrangement_records.length;
  const onTimeTransport = transport_arrangement_records.filter(
    (r) => r.on_time,
  ).length;
  const transportTimelinessRate = pct(onTimeTransport, totalTransportRecords);

  const arrangedInAdvance = transport_arrangement_records.filter(
    (r) => r.arranged_in_advance,
  ).length;
  const advanceArrangementRate = pct(arrangedInAdvance, totalTransportRecords);

  const childComfortable = transport_arrangement_records.filter(
    (r) => r.child_comfortable,
  ).length;
  const childComfortRate = pct(childComfortable, totalTransportRecords);

  const appropriateVehicle = transport_arrangement_records.filter(
    (r) => r.appropriate_vehicle,
  ).length;
  const appropriateVehicleRate = pct(appropriateVehicle, totalTransportRecords);

  const driverChecked = transport_arrangement_records.filter(
    (r) => r.staff_driver_checked,
  ).length;
  const driverCheckRate = pct(driverChecked, totalTransportRecords);

  const backupPlan = transport_arrangement_records.filter(
    (r) => r.backup_plan_in_place,
  ).length;
  const backupPlanRate = pct(backupPlan, totalTransportRecords);

  const avgDelayMinutes =
    totalTransportRecords > 0
      ? Math.round(
          transport_arrangement_records.reduce((sum, r) => sum + r.delay_minutes, 0) /
            totalTransportRecords,
        )
      : 0;

  const lateTransport = transport_arrangement_records.filter(
    (r) => !r.on_time,
  ).length;
  const significantDelays = transport_arrangement_records.filter(
    (r) => r.delay_minutes > 15,
  ).length;
  const significantDelayRate = pct(significantDelays, totalTransportRecords);

  // --- Child preparation ---
  const totalPreparationRecords = child_preparation_records.length;
  const informedInAdvance = child_preparation_records.filter(
    (r) => r.child_informed_in_advance,
  ).length;
  const advanceInformationRate = pct(informedInAdvance, totalPreparationRecords);

  const anxietiesAddressed = child_preparation_records.filter(
    (r) => r.child_anxieties_addressed,
  ).length;
  const anxietyAddressRate = pct(anxietiesAddressed, totalPreparationRecords);

  const preferencesCapture = child_preparation_records.filter(
    (r) => r.preferences_captured,
  ).length;
  const preferencesCaptureRate = pct(preferencesCapture, totalPreparationRecords);

  const choseAccompaniment = child_preparation_records.filter(
    (r) => r.child_chose_accompaniment,
  ).length;
  const accompanimentChoiceRate = pct(choseAccompaniment, totalPreparationRecords);

  const debriefAfter = child_preparation_records.filter(
    (r) => r.debrief_after,
  ).length;
  const debriefRate = pct(debriefAfter, totalPreparationRecords);

  const feedbackCaptured = child_preparation_records.filter(
    (r) => r.child_feedback_captured,
  ).length;
  const feedbackCaptureRate = pct(feedbackCaptured, totalPreparationRecords);

  const childSatisfactionSum = child_preparation_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const childSatisfactionAvg =
    totalPreparationRecords > 0
      ? Math.round((childSatisfactionSum / totalPreparationRecords) * 100) / 100
      : 0;

  const autonomySupported = child_preparation_records.filter(
    (r) => r.autonomy_supported,
  ).length;
  const autonomyRate = pct(autonomySupported, totalPreparationRecords);

  const ageAppropriate = child_preparation_records.filter(
    (r) => r.age_appropriate_information,
  ).length;
  const ageAppropriateRate = pct(ageAppropriate, totalPreparationRecords);

  // --- Child preparation composite rate ---
  const childPreparationRate =
    totalPreparationRecords > 0
      ? Math.round(
          (advanceInformationRate + anxietyAddressRate + preferencesCaptureRate + debriefRate) / 4,
        )
      : 0;

  // --- Child autonomy composite rate ---
  const childAutonomyRate =
    totalPreparationRecords > 0
      ? Math.round(
          (autonomyRate + accompanimentChoiceRate + feedbackCaptureRate) / 3,
        )
      : 0;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: appointmentAttendanceRate (>=90: +4, >=75: +2) ---
  if (appointmentAttendanceRate >= 90) score += 4;
  else if (appointmentAttendanceRate >= 75) score += 2;

  // --- Bonus 2: calendarAccuracyRate (>=90: +3, >=70: +1) ---
  if (calendarAccuracyRate >= 90) score += 3;
  else if (calendarAccuracyRate >= 70) score += 1;

  // --- Bonus 3: medicalComplianceRate (>=95: +4, >=80: +2) ---
  if (medicalComplianceRate >= 95) score += 4;
  else if (medicalComplianceRate >= 80) score += 2;

  // --- Bonus 4: transportTimelinessRate (>=90: +3, >=75: +1) ---
  if (transportTimelinessRate >= 90) score += 3;
  else if (transportTimelinessRate >= 75) score += 1;

  // --- Bonus 5: childPreparationRate (>=85: +3, >=65: +1) ---
  if (childPreparationRate >= 85) score += 3;
  else if (childPreparationRate >= 65) score += 1;

  // --- Bonus 6: childAutonomyRate (>=80: +3, >=60: +1) ---
  if (childAutonomyRate >= 80) score += 3;
  else if (childAutonomyRate >= 60) score += 1;

  // --- Bonus 7: followUpCompletionRate (>=90: +3, >=70: +1) ---
  if (followUpCompletionRate >= 90) score += 3;
  else if (followUpCompletionRate >= 70) score += 1;

  // --- Bonus 8: outcomeRecordingRate (>=90: +3, >=70: +1) ---
  if (outcomeRecordingRate >= 90) score += 3;
  else if (outcomeRecordingRate >= 70) score += 1;

  // --- Bonus 9: reschedulingTimelinessRate (>=80: +2, >=50: +1) ---
  if (reschedulingTimelinessRate >= 80) score += 2;
  else if (reschedulingTimelinessRate >= 50) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // appointmentAttendanceRate < 50 -> -5
  if (appointmentAttendanceRate < 50 && totalAppointments > 0) score -= 5;

  // medicalComplianceRate < 50 -> -5
  if (medicalComplianceRate < 50 && totalMedicalCompliance > 0) score -= 5;

  // transportTimelinessRate < 50 -> -4
  if (transportTimelinessRate < 50 && totalTransportRecords > 0) score -= 4;

  // childPreparationRate < 30 -> -4
  if (childPreparationRate < 30 && totalPreparationRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const calendar_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (appointmentAttendanceRate >= 90 && totalAppointments > 0) {
    strengths.push(
      `${appointmentAttendanceRate}% appointment attendance rate -- the home demonstrates consistent commitment to ensuring children attend their health, education, and welfare appointments.`,
    );
  } else if (appointmentAttendanceRate >= 75 && totalAppointments > 0) {
    strengths.push(
      `${appointmentAttendanceRate}% appointment attendance rate -- most children's appointments are being attended with good overall management.`,
    );
  }

  if (medicalAttendanceRate >= 90 && medicalAppointments.length > 0) {
    strengths.push(
      `${medicalAttendanceRate}% medical appointment attendance -- children's health appointments are prioritised and consistently attended.`,
    );
  }

  if (dentalAttendanceRate >= 90 && dentalAppointments.length > 0) {
    strengths.push(
      `${dentalAttendanceRate}% dental/optician appointment attendance -- the home ensures children's routine health checks are maintained.`,
    );
  }

  if (educationAttendanceRate >= 90 && educationAppointments.length > 0) {
    strengths.push(
      `${educationAttendanceRate}% education appointment attendance -- PEP meetings, LAC reviews, and education-related appointments are consistently attended.`,
    );
  }

  if (outcomeRecordingRate >= 90 && totalAppointments > 0) {
    strengths.push(
      `Outcomes recorded for ${outcomeRecordingRate}% of appointments -- the home maintains excellent documentation of appointment outcomes and actions.`,
    );
  } else if (outcomeRecordingRate >= 70 && totalAppointments > 0) {
    strengths.push(
      `Outcomes recorded for ${outcomeRecordingRate}% of appointments -- good practice in documenting what happened at appointments and what needs to follow.`,
    );
  }

  if (followUpCompletionRate >= 90 && followUpIdentified > 0) {
    strengths.push(
      `${followUpCompletionRate}% of follow-up actions completed -- the home reliably completes actions arising from appointments, ensuring continuity of care.`,
    );
  } else if (followUpCompletionRate >= 70 && followUpIdentified > 0) {
    strengths.push(
      `${followUpCompletionRate}% follow-up action completion rate -- most actions arising from appointments are being completed.`,
    );
  }

  if (consentRate >= 90 && totalAppointments > 0) {
    strengths.push(
      `Child consent obtained for ${consentRate}% of appointments -- the home demonstrates strong practice in involving children in decisions about their healthcare and appointments.`,
    );
  }

  if (calendarAccuracyRate >= 90 && totalCalendarRecords > 0) {
    strengths.push(
      `${calendarAccuracyRate}% calendar accuracy rate -- appointment calendars are reliably maintained and reflect children's actual schedules.`,
    );
  } else if (calendarAccuracyRate >= 70 && totalCalendarRecords > 0) {
    strengths.push(
      `${calendarAccuracyRate}% calendar accuracy rate -- good calendar management supporting effective appointment scheduling.`,
    );
  }

  if (reminderRate >= 90 && totalCalendarRecords > 0) {
    strengths.push(
      `Reminders set for ${reminderRate}% of calendar periods -- proactive reminder systems reduce the risk of missed appointments.`,
    );
  }

  if (conflictResolutionRate >= 90 && totalConflicts > 0) {
    strengths.push(
      `${conflictResolutionRate}% of scheduling conflicts resolved -- the home effectively manages competing appointment demands.`,
    );
  }

  if (childShareRate >= 80 && totalCalendarRecords > 0) {
    strengths.push(
      `Calendar shared with children in ${childShareRate}% of cases -- children are kept informed about their upcoming appointments, supporting their autonomy and reducing anxiety.`,
    );
  }

  if (swShareRate >= 80 && totalCalendarRecords > 0) {
    strengths.push(
      `Calendar shared with social workers in ${swShareRate}% of cases -- good information sharing with placing authorities about children's appointment schedules.`,
    );
  }

  if (medicalComplianceRate >= 95 && totalMedicalCompliance > 0) {
    strengths.push(
      `${medicalComplianceRate}% medical compliance rate -- routine health assessments, dental checks, immunisations, and specialist follow-ups are completed on schedule.`,
    );
  } else if (medicalComplianceRate >= 80 && totalMedicalCompliance > 0) {
    strengths.push(
      `${medicalComplianceRate}% medical compliance rate -- most statutory and routine health requirements are being met on time.`,
    );
  }

  if (ahaCompletionRate >= 95 && annualHealthAssessments.length > 0) {
    strengths.push(
      `${ahaCompletionRate}% annual health assessment completion rate -- the home ensures every child's annual health assessment is completed as required under Reg 14.`,
    );
  }

  if (immunisationRate >= 95 && immunisations.length > 0) {
    strengths.push(
      `${immunisationRate}% immunisation compliance rate -- children's immunisation schedules are maintained ensuring their health protection.`,
    );
  }

  if (healthPlanUpdateRate >= 90 && totalMedicalCompliance > 0) {
    strengths.push(
      `Health plans updated after ${healthPlanUpdateRate}% of compliance activities -- appointment outcomes systematically feed into children's health plans.`,
    );
  }

  if (transportTimelinessRate >= 90 && totalTransportRecords > 0) {
    strengths.push(
      `${transportTimelinessRate}% transport timeliness rate -- children arrive at appointments on time with well-organised transport arrangements.`,
    );
  } else if (transportTimelinessRate >= 75 && totalTransportRecords > 0) {
    strengths.push(
      `${transportTimelinessRate}% transport timeliness rate -- most transport arrangements are effective and timely.`,
    );
  }

  if (advanceArrangementRate >= 90 && totalTransportRecords > 0) {
    strengths.push(
      `Transport arranged in advance for ${advanceArrangementRate}% of appointments -- proactive planning reduces last-minute disruption and child anxiety.`,
    );
  }

  if (childComfortRate >= 90 && totalTransportRecords > 0) {
    strengths.push(
      `Children comfortable with transport arrangements in ${childComfortRate}% of cases -- the home considers children's preferences and needs when arranging travel.`,
    );
  }

  if (driverCheckRate >= 95 && totalTransportRecords > 0) {
    strengths.push(
      `Staff driver checks completed for ${driverCheckRate}% of journeys -- strong safeguarding practice around transport safety.`,
    );
  }

  if (backupPlanRate >= 80 && totalTransportRecords > 0) {
    strengths.push(
      `Backup transport plans in place for ${backupPlanRate}% of appointments -- the home plans for contingencies to avoid missed appointments.`,
    );
  }

  if (childPreparationRate >= 85 && totalPreparationRecords > 0) {
    strengths.push(
      `Child preparation rate at ${childPreparationRate}% -- children are consistently informed, supported, and debriefed around their appointments.`,
    );
  } else if (childPreparationRate >= 65 && totalPreparationRecords > 0) {
    strengths.push(
      `Child preparation rate at ${childPreparationRate}% -- good practice in preparing children for their appointments.`,
    );
  }

  if (anxietyAddressRate >= 90 && totalPreparationRecords > 0) {
    strengths.push(
      `Children's anxieties addressed in ${anxietyAddressRate}% of cases -- staff proactively identify and manage appointment-related anxiety, enabling children to engage positively with healthcare and education professionals.`,
    );
  }

  if (childSatisfactionAvg >= 4.0 && totalPreparationRecords > 0) {
    strengths.push(
      `Children's satisfaction with appointment preparation averages ${childSatisfactionAvg}/5 -- children feel well informed and supported through the appointment process.`,
    );
  }

  if (autonomyRate >= 80 && totalPreparationRecords > 0) {
    strengths.push(
      `Autonomy supported in ${autonomyRate}% of appointment preparations -- children are empowered to make choices about their appointments and healthcare.`,
    );
  }

  if (debriefRate >= 85 && totalPreparationRecords > 0) {
    strengths.push(
      `Post-appointment debrief conducted in ${debriefRate}% of cases -- children have the opportunity to process and discuss their appointment experiences.`,
    );
  }

  if (ageAppropriateRate >= 90 && totalPreparationRecords > 0) {
    strengths.push(
      `Age-appropriate information provided in ${ageAppropriateRate}% of preparations -- information is tailored to each child's developmental stage and understanding.`,
    );
  }

  if (childAutonomyRate >= 80 && totalPreparationRecords > 0) {
    strengths.push(
      `Child autonomy rate at ${childAutonomyRate}% -- children's voices are central to how their appointments are managed, reflecting genuinely child-centred practice.`,
    );
  }

  if (reschedulingTimelinessRate >= 80 && rescheduledAppointments > 0) {
    strengths.push(
      `${reschedulingTimelinessRate}% of cancelled appointments rescheduled within 14 days -- the home ensures minimal disruption when appointments cannot be kept.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (appointmentAttendanceRate < 50 && totalAppointments > 0) {
    concerns.push(
      `Only ${appointmentAttendanceRate}% of appointments attended -- the majority of children's health, education, and welfare appointments are being missed, which is a fundamental failure of care and a serious Reg 14 compliance concern.`,
    );
  } else if (appointmentAttendanceRate < 75 && appointmentAttendanceRate >= 50 && totalAppointments > 0) {
    concerns.push(
      `Appointment attendance at ${appointmentAttendanceRate}% -- a significant proportion of children's appointments are not being attended, putting their health and educational outcomes at risk.`,
    );
  }

  if (homeCancellationRate >= 15 && totalAppointments > 0) {
    concerns.push(
      `The home cancelled ${homeCancellationRate}% of appointments -- cancellations initiated by the home suggest systemic issues with staffing, transport, or prioritisation that are preventing children from accessing essential services.`,
    );
  }

  if (cancellationRate >= 25 && totalAppointments > 0) {
    concerns.push(
      `Overall cancellation rate at ${cancellationRate}% -- one in four appointments is being cancelled, creating a pattern of disrupted care that undermines children's health and educational progress.`,
    );
  }

  if (overdueRate >= 20 && totalAppointments > 0) {
    concerns.push(
      `${overdueRate}% of appointments are overdue -- children are waiting too long for essential health and education appointments, with potential consequences for their wellbeing.`,
    );
  }

  if (outcomeRecordingRate < 50 && totalAppointments > 0) {
    concerns.push(
      `Outcomes recorded for only ${outcomeRecordingRate}% of appointments -- the home cannot evidence what happened at most appointments or what actions are needed, creating gaps in continuity of care.`,
    );
  } else if (outcomeRecordingRate < 70 && outcomeRecordingRate >= 50 && totalAppointments > 0) {
    concerns.push(
      `Outcome recording at ${outcomeRecordingRate}% -- not all appointment outcomes are being documented, risking important information being lost.`,
    );
  }

  if (followUpCompletionRate < 50 && followUpIdentified > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of follow-up actions completed -- the majority of actions arising from appointments are not being completed, undermining the purpose of attending appointments in the first place.`,
    );
  } else if (followUpCompletionRate < 70 && followUpCompletionRate >= 50 && followUpIdentified > 0) {
    concerns.push(
      `Follow-up action completion at ${followUpCompletionRate}% -- not all actions arising from appointments are being completed in a timely manner.`,
    );
  }

  if (consentRate < 50 && totalAppointments > 0) {
    concerns.push(
      `Child consent obtained for only ${consentRate}% of appointments -- children are not being adequately consulted about or consenting to their healthcare and appointments.`,
    );
  }

  if (calendarAccuracyRate < 50 && totalCalendarRecords > 0) {
    concerns.push(
      `Calendar accuracy at only ${calendarAccuracyRate}% -- calendars do not reliably reflect children's appointment schedules, increasing the risk of missed or double-booked appointments.`,
    );
  } else if (calendarAccuracyRate < 70 && calendarAccuracyRate >= 50 && totalCalendarRecords > 0) {
    concerns.push(
      `Calendar accuracy at ${calendarAccuracyRate}% -- appointment calendars need improvement to reliably support scheduling.`,
    );
  }

  if (missedFromCalendarRate >= 15 && totalScheduled > 0) {
    concerns.push(
      `${missedFromCalendarRate}% of scheduled appointments missing from calendars -- appointments are being scheduled but not recorded in the calendar system, creating blind spots in appointment management.`,
    );
  }

  if (doubleBookingRate >= 10 && totalScheduled > 0) {
    concerns.push(
      `Double booking rate at ${doubleBookingRate}% -- scheduling conflicts are occurring too frequently, forcing children to choose between important appointments.`,
    );
  }

  if (medicalComplianceRate < 50 && totalMedicalCompliance > 0) {
    concerns.push(
      `Only ${medicalComplianceRate}% medical compliance rate -- the majority of statutory and routine health requirements are not being met, which is a direct Reg 14 failure and a serious safeguarding concern.`,
    );
  } else if (medicalComplianceRate < 80 && medicalComplianceRate >= 50 && totalMedicalCompliance > 0) {
    concerns.push(
      `Medical compliance at ${medicalComplianceRate}% -- not all statutory health assessments, dental checks, and specialist follow-ups are being completed on schedule.`,
    );
  }

  if (overdueComplianceRate >= 25 && totalMedicalCompliance > 0) {
    concerns.push(
      `${overdueComplianceRate}% of medical compliance requirements are overdue -- children are waiting beyond required timescales for essential health assessments and follow-ups.`,
    );
  }

  if (avgDaysOverdue >= 30 && overdueCompliance > 0) {
    concerns.push(
      `Average overdue period is ${avgDaysOverdue} days -- significantly overdue medical requirements indicate systemic issues in appointment booking and follow-through.`,
    );
  }

  if (ahaCompletionRate < 80 && annualHealthAssessments.length > 0) {
    concerns.push(
      `Annual health assessment completion at only ${ahaCompletionRate}% -- this is a core Reg 14 requirement and incomplete assessments leave gaps in understanding children's health needs.`,
    );
  }

  if (dentalCompletionRate < 80 && dentalCheckups.length > 0) {
    concerns.push(
      `Dental checkup completion at only ${dentalCompletionRate}% -- looked-after children are entitled to regular dental care and the home must ensure these appointments are kept.`,
    );
  }

  if (healthPlanUpdateRate < 50 && totalMedicalCompliance > 0) {
    concerns.push(
      `Health plans updated after only ${healthPlanUpdateRate}% of compliance activities -- appointment outcomes are not feeding into children's health plans, undermining continuity of care.`,
    );
  }

  if (transportTimelinessRate < 50 && totalTransportRecords > 0) {
    concerns.push(
      `Only ${transportTimelinessRate}% transport timeliness rate -- the majority of transport arrangements result in children arriving late for appointments, which is unacceptable and may cause appointments to be missed entirely.`,
    );
  } else if (transportTimelinessRate < 75 && transportTimelinessRate >= 50 && totalTransportRecords > 0) {
    concerns.push(
      `Transport timeliness at ${transportTimelinessRate}% -- too many transport arrangements result in late arrivals, disrupting appointments and causing stress for children.`,
    );
  }

  if (significantDelayRate >= 15 && totalTransportRecords > 0) {
    concerns.push(
      `${significantDelayRate}% of transport arrangements have delays exceeding 15 minutes -- significant delays cause anxiety for children and may result in shortened or missed appointments.`,
    );
  }

  if (advanceArrangementRate < 50 && totalTransportRecords > 0) {
    concerns.push(
      `Transport arranged in advance for only ${advanceArrangementRate}% of appointments -- last-minute transport arrangements increase stress and the risk of missed appointments.`,
    );
  }

  if (childComfortRate < 50 && totalTransportRecords > 0) {
    concerns.push(
      `Children comfortable with transport in only ${childComfortRate}% of cases -- transport arrangements are not meeting children's needs and preferences.`,
    );
  }

  if (driverCheckRate < 80 && totalTransportRecords > 0) {
    concerns.push(
      `Staff driver checks completed for only ${driverCheckRate}% of journeys -- insufficient safeguarding checks around transport arrangements.`,
    );
  }

  if (childPreparationRate < 30 && totalPreparationRecords > 0) {
    concerns.push(
      `Child preparation rate at only ${childPreparationRate}% -- children are not being adequately informed, supported, or prepared for their appointments, causing unnecessary anxiety and disengagement.`,
    );
  } else if (childPreparationRate < 65 && childPreparationRate >= 30 && totalPreparationRecords > 0) {
    concerns.push(
      `Child preparation at ${childPreparationRate}% -- not all children are being adequately prepared for their appointments.`,
    );
  }

  if (anxietyAddressRate < 50 && totalPreparationRecords > 0) {
    concerns.push(
      `Children's appointment anxieties addressed in only ${anxietyAddressRate}% of cases -- many children are attending appointments without their worries being acknowledged or managed.`,
    );
  }

  if (childSatisfactionAvg < 3.0 && totalPreparationRecords > 0) {
    concerns.push(
      `Children's satisfaction with appointment preparation averages only ${childSatisfactionAvg}/5 -- children do not feel well supported through the appointment process.`,
    );
  }

  if (childAutonomyRate < 50 && totalPreparationRecords > 0) {
    concerns.push(
      `Child autonomy rate at only ${childAutonomyRate}% -- children's choices and voices are not central to how their appointments are managed, undermining child-centred practice.`,
    );
  }

  if (totalAppointments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No appointment records despite children being on placement -- the home may not be recording children's health, education, and welfare appointments or tracking their attendance.",
    );
  }

  if (totalMedicalCompliance === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No medical compliance records -- the home has not documented whether children's statutory health assessments, dental checks, and immunisations are up to date.",
    );
  }

  if (totalTransportRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No transport arrangement records -- the home has not documented how children are being transported to appointments or whether transport is timely and appropriate.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: PersonalCalendarRecommendation[] = [];
  let rank = 0;

  if (appointmentAttendanceRate < 50 && totalAppointments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review why the majority of appointments are not being attended -- conduct a root-cause analysis of missed appointments, implement a robust tracking and escalation system, and ensure staffing and transport are prioritised to support appointment attendance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (medicalComplianceRate < 50 && totalMedicalCompliance > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately address the medical compliance gap -- review all overdue health assessments, dental checks, and specialist follow-ups and create an urgent action plan to bring all children's statutory health requirements up to date.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (transportTimelinessRate < 50 && totalTransportRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul transport arrangements -- ensure all appointment transport is booked in advance, build in buffer time, establish backup plans, and review vehicle appropriateness to eliminate the pattern of late arrivals.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (childPreparationRate < 30 && totalPreparationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured child preparation protocol for all appointments -- children must be informed in advance, have their anxieties addressed, be given age-appropriate information, and receive a debrief after every appointment.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (outcomeRecordingRate < 50 && totalAppointments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure outcomes are recorded for every appointment attended -- implement a standard post-appointment recording template that captures what happened, professional advice given, and follow-up actions required.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (followUpCompletionRate < 50 && followUpIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a follow-up action tracker to ensure all actions arising from appointments are assigned, monitored, and completed within required timescales.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (calendarAccuracyRate < 50 && totalCalendarRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a reliable calendar management system for every child -- ensure all appointments are recorded, reminders are set, and calendars are regularly audited for accuracy.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (consentRate < 50 && totalAppointments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed informed consent processes for all appointments -- children must be consulted, their views recorded, and consent documented in line with their age and understanding.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (homeCancellationRate >= 15 && totalAppointments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and eliminate home-initiated appointment cancellations -- review staffing rotas, transport availability, and prioritisation to ensure the home does not cancel children's appointments.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (overdueComplianceRate >= 25 && totalMedicalCompliance > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create an overdue compliance action plan -- prioritise the most overdue health requirements, escalate to placing authorities where necessary, and implement a monitoring system to prevent future overdue items.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (ahaCompletionRate < 80 && annualHealthAssessments.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children receive their annual health assessment on time -- liaise with the LAC health team, book appointments proactively, and track completion against due dates.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (healthPlanUpdateRate < 50 && totalMedicalCompliance > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's health plans are updated following every compliance activity and appointment -- appointment outcomes must systematically inform ongoing health care planning.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (significantDelayRate >= 15 && totalTransportRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address recurring significant transport delays by reviewing departure times, route planning, and transport provider reliability. Build in contingency time for all appointments.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (driverCheckRate < 80 && totalTransportRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure staff driver checks are completed for every journey transporting children to appointments -- this is a safeguarding requirement and must be evidenced consistently.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 12 -- Safeguarding",
    });
  }

  if (anxietyAddressRate < 50 && totalPreparationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train staff in appointment anxiety management techniques and implement pre-appointment check-ins to identify and address children's worries before every appointment.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (appointmentAttendanceRate >= 50 && appointmentAttendanceRate < 75 && totalAppointments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve appointment attendance to at least 75% -- review reasons for non-attendance, strengthen reminder systems, and ensure staffing and transport support every appointment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (medicalComplianceRate >= 50 && medicalComplianceRate < 80 && totalMedicalCompliance > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen medical compliance tracking to achieve at least 80% -- implement a compliance dashboard, set automated reminders for due dates, and escalate overdue items promptly.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (transportTimelinessRate >= 50 && transportTimelinessRate < 75 && totalTransportRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve transport timeliness to at least 75% -- review transport arrangements, build in buffer time, and ensure backup plans are in place for every appointment.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  if (childPreparationRate >= 30 && childPreparationRate < 65 && totalPreparationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a consistent pre-appointment preparation framework covering advance information, anxiety management, preference capture, and post-appointment debrief for every child.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (childAutonomyRate < 50 && totalPreparationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child autonomy in appointment management -- involve children in scheduling, let them choose who accompanies them, and consistently capture their feedback to shape future practice.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (childShareRate < 50 && totalCalendarRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Share appointment calendars with children in an age-appropriate way so they know what appointments are coming up and can prepare themselves.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Health and wellbeing",
    });
  }

  if (totalAppointments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording all children's appointments including attendance, outcomes, and follow-up actions to build an evidence base for health and education compliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalMedicalCompliance === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement medical compliance tracking for every child -- document all statutory health assessments, dental checks, immunisations, and specialist follow-ups with due dates and completion status.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 -- Health care",
    });
  }

  if (totalTransportRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Start recording transport arrangements for appointments including timeliness, child comfort, and driver checks to evidence safe and effective transport provision.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging with the wider community",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: PersonalCalendarInsight[] = [];

  // --- Critical insights ---

  if (appointmentAttendanceRate < 50 && totalAppointments > 0) {
    insights.push({
      text: `Only ${appointmentAttendanceRate}% of appointments attended. Ofsted will view this pattern of missed appointments as evidence that the home is failing to ensure children access essential health, education, and welfare services -- a direct failure under Reg 14 and potentially Reg 8.`,
      severity: "critical",
    });
  }

  if (medicalComplianceRate < 50 && totalMedicalCompliance > 0) {
    insights.push({
      text: `Only ${medicalComplianceRate}% medical compliance rate. Failing to complete statutory health assessments, dental checks, and specialist follow-ups puts children's health at risk and represents a fundamental Reg 14 compliance failure that Ofsted will treat with serious concern.`,
      severity: "critical",
    });
  }

  if (transportTimelinessRate < 50 && totalTransportRecords > 0) {
    insights.push({
      text: `Only ${transportTimelinessRate}% transport timeliness rate. Persistent late arrivals undermine appointment effectiveness and cause unnecessary stress for children. Ofsted will question whether the home's infrastructure supports children's access to community services under Reg 5.`,
      severity: "critical",
    });
  }

  if (childPreparationRate < 30 && totalPreparationRecords > 0) {
    insights.push({
      text: `Child preparation rate at only ${childPreparationRate}%. Children are attending appointments without adequate information, anxiety support, or opportunity to express preferences. This is inconsistent with child-centred practice and undermines SCCIF health and wellbeing expectations.`,
      severity: "critical",
    });
  }

  if (totalAppointments === 0 && totalMedicalCompliance === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No appointment or medical compliance records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's health and education appointments are not being managed, scheduled, or tracked -- a significant omission under Reg 14.",
      severity: "critical",
    });
  }

  if (homeCancellationRate >= 15 && totalAppointments > 0) {
    insights.push({
      text: `The home cancelled ${homeCancellationRate}% of appointments. Home-initiated cancellations are particularly concerning because they suggest the home is deprioritising children's appointments due to operational pressures rather than child-centred reasons.`,
      severity: "critical",
    });
  }

  if (overdueComplianceRate >= 40 && totalMedicalCompliance > 0) {
    insights.push({
      text: `${overdueComplianceRate}% of medical compliance requirements are overdue with an average overdue period of ${avgDaysOverdue} days. This level of non-compliance creates cumulative health risks for children and will be a key focus area for Ofsted under Reg 14.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (appointmentAttendanceRate >= 50 && appointmentAttendanceRate < 75 && totalAppointments > 0) {
    insights.push({
      text: `Appointment attendance at ${appointmentAttendanceRate}% -- improving but too many appointments are still being missed. Each missed appointment represents a lost opportunity to support a child's health, education, or welfare.`,
      severity: "warning",
    });
  }

  if (medicalComplianceRate >= 50 && medicalComplianceRate < 80 && totalMedicalCompliance > 0) {
    insights.push({
      text: `Medical compliance at ${medicalComplianceRate}% -- while some statutory requirements are being met, the gap exposes children to unaddressed health needs that could have been identified through timely assessments and checks.`,
      severity: "warning",
    });
  }

  if (calendarAccuracyRate >= 50 && calendarAccuracyRate < 70 && totalCalendarRecords > 0) {
    insights.push({
      text: `Calendar accuracy at ${calendarAccuracyRate}% -- inaccurate calendars create a cascade of problems: missed appointments, scheduling conflicts, and children being unprepared for upcoming commitments.`,
      severity: "warning",
    });
  }

  if (transportTimelinessRate >= 50 && transportTimelinessRate < 75 && totalTransportRecords > 0) {
    insights.push({
      text: `Transport timeliness at ${transportTimelinessRate}% -- late arrivals at appointments may result in shortened consultations or children being turned away, undermining the purpose of the appointment.`,
      severity: "warning",
    });
  }

  if (childPreparationRate >= 30 && childPreparationRate < 65 && totalPreparationRecords > 0) {
    insights.push({
      text: `Child preparation at ${childPreparationRate}% -- some children are attending appointments without adequate information or support. Appointment anxiety is a common experience for looked-after children and must be proactively managed.`,
      severity: "warning",
    });
  }

  if (followUpCompletionRate >= 50 && followUpCompletionRate < 70 && followUpIdentified > 0) {
    insights.push({
      text: `Follow-up action completion at ${followUpCompletionRate}% -- incomplete follow-up actions mean appointment recommendations are not being translated into improved care, reducing the value of the appointment itself.`,
      severity: "warning",
    });
  }

  if (childAutonomyRate >= 50 && childAutonomyRate < 80 && totalPreparationRecords > 0) {
    insights.push({
      text: `Child autonomy rate at ${childAutonomyRate}% -- while some choice is offered, not all children are consistently involved in decisions about their appointments. Increasing autonomy builds confidence and engagement.`,
      severity: "warning",
    });
  }

  if (cancellationRate >= 15 && cancellationRate < 25 && totalAppointments > 0) {
    insights.push({
      text: `Cancellation rate at ${cancellationRate}% -- while not yet critical, this level of cancellation disrupts continuity of care and may indicate emerging issues with appointment management.`,
      severity: "warning",
    });
  }

  if (reschedulingTimelinessRate < 50 && rescheduledAppointments > 0) {
    insights.push({
      text: `Only ${reschedulingTimelinessRate}% of cancelled appointments rescheduled within 14 days -- slow rescheduling extends gaps in care and may result in overdue statutory health requirements.`,
      severity: "warning",
    });
  }

  if (missedFromCalendarRate >= 10 && missedFromCalendarRate < 15 && totalScheduled > 0) {
    insights.push({
      text: `${missedFromCalendarRate}% of appointments missing from calendars -- this gap between what is scheduled and what is recorded creates a risk of appointments being overlooked.`,
      severity: "warning",
    });
  }

  // --- Appointment type distribution insight ---
  const appointmentTypes = new Set(
    appointment_records.map((r) => r.appointment_type),
  );
  if (appointmentTypes.size >= 5 && totalAppointments >= 10) {
    insights.push({
      text: `The home manages ${totalAppointments} appointments across ${appointmentTypes.size} different appointment types for ${uniqueChildrenWithAppointments} children -- this complexity requires robust calendar management, clear communication, and proactive planning to prevent appointments falling through the gaps.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (calendar_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding appointment management -- children's health, education, and welfare appointments are consistently attended, outcomes are recorded, follow-up actions are completed, and children are well prepared and empowered throughout the process. This is strong evidence of Reg 14 and Reg 8 compliance.",
      severity: "positive",
    });
  }

  if (appointmentAttendanceRate >= 90 && medicalComplianceRate >= 90 && totalAppointments > 0 && totalMedicalCompliance > 0) {
    insights.push({
      text: `${appointmentAttendanceRate}% appointment attendance with ${medicalComplianceRate}% medical compliance -- the home ensures children attend their appointments and statutory health requirements are met on schedule. Ofsted will recognise this as evidence of genuinely proactive health care management.`,
      severity: "positive",
    });
  }

  if (transportTimelinessRate >= 90 && childComfortRate >= 90 && totalTransportRecords > 0) {
    insights.push({
      text: `${transportTimelinessRate}% transport timeliness with ${childComfortRate}% child comfort rate -- children arrive at appointments on time and feel comfortable with travel arrangements. This demonstrates thoughtful, child-centred transport planning.`,
      severity: "positive",
    });
  }

  if (childPreparationRate >= 85 && childAutonomyRate >= 80 && totalPreparationRecords > 0) {
    insights.push({
      text: `${childPreparationRate}% child preparation with ${childAutonomyRate}% autonomy rate -- children are consistently prepared for their appointments and empowered to make choices about their care. This exemplifies child-centred practice.`,
      severity: "positive",
    });
  }

  if (childSatisfactionAvg >= 4.0 && totalPreparationRecords > 0) {
    insights.push({
      text: `Children's satisfaction with appointment preparation averages ${childSatisfactionAvg}/5 -- children feel genuinely supported through the appointment process. This positive experience makes children more likely to engage with health and education professionals.`,
      severity: "positive",
    });
  }

  if (followUpCompletionRate >= 90 && outcomeRecordingRate >= 90 && followUpIdentified > 0 && totalAppointments > 0) {
    insights.push({
      text: `${outcomeRecordingRate}% outcome recording with ${followUpCompletionRate}% follow-up completion -- the home not only attends appointments but ensures outcomes are captured and actions are completed, creating a genuine cycle of continuous care improvement.`,
      severity: "positive",
    });
  }

  if (calendarAccuracyRate >= 90 && reminderRate >= 90 && totalCalendarRecords > 0) {
    insights.push({
      text: `${calendarAccuracyRate}% calendar accuracy with ${reminderRate}% reminder coverage -- the home's calendar management system is reliable and proactive, minimising the risk of missed appointments.`,
      severity: "positive",
    });
  }

  if (consentRate >= 90 && autonomyRate >= 80 && totalAppointments > 0 && totalPreparationRecords > 0) {
    insights.push({
      text: `Consent obtained for ${consentRate}% of appointments with ${autonomyRate}% autonomy support -- children are meaningfully involved in decisions about their health and appointments, demonstrating excellent rights-based practice.`,
      severity: "positive",
    });
  }

  if (reschedulingTimelinessRate >= 80 && rescheduledAppointments > 0) {
    insights.push({
      text: `${reschedulingTimelinessRate}% of cancelled appointments rescheduled within 14 days -- the home acts quickly to minimise disruption when appointments cannot be kept, maintaining continuity of care.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (calendar_rating === "outstanding") {
    headline =
      "Outstanding appointment management -- children's health, education, and welfare appointments are consistently attended, well managed, and child-centred across all domains.";
  } else if (calendar_rating === "good") {
    headline = `Good appointment management -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (calendar_rating === "adequate") {
    headline = `Adequate appointment management -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's appointment needs are fully met.`;
  } else {
    headline = `Appointment management is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's health, education, and welfare appointments are properly managed.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    calendar_rating,
    calendar_score: score,
    headline,
    appointment_attendance_rate: appointmentAttendanceRate,
    calendar_accuracy_rate: calendarAccuracyRate,
    medical_compliance_rate: medicalComplianceRate,
    transport_timeliness_rate: transportTimelinessRate,
    child_preparation_rate: childPreparationRate,
    child_autonomy_rate: childAutonomyRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
