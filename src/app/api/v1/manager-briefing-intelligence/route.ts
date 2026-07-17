// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER'S INTELLIGENCE BRIEFING API ROUTE
// GET /api/v1/manager-briefing-intelligence
//
// Meta-route that aggregates outputs from all major domain intelligence
// engines into a single comprehensive daily briefing.
//
// Regulatory: CHR 2015 Reg 5 (RM duties), Reg 45 (quality of care review).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

import {
  computeSafeguardingIntelligence,
  type IncidentInput as SgIncident,
  type MissingEpisodeInput,
  type RestraintInput as SgRestraint,
  type RiskAssessmentInput as SgRiskAssessment,
  type NotifiableEventInput,
  type ChildRef,
} from "@/lib/engines/safeguarding-intelligence-engine";

import {
  computeBehaviourIntelligence,
  type BehaviourEntryInput,
  type IncidentInput as BhIncident,
  type RestraintInput as BhRestraint,
  type SanctionRewardInput,
} from "@/lib/engines/behaviour-intelligence-engine";

import {
  computeWorkforceIntelligence,
  type StaffInput,
  type TrainingInput,
  type SupervisionInput as WfSupervision,
  type ShiftInput,
  type LeaveInput,
} from "@/lib/engines/workforce-intelligence-engine";

import {
  computeHealthWellbeing,
  type ChildInput as HwChild,
  type AppointmentInput,
  type HealthAssessmentInput,
  type DentalRecordInput,
  type OpticiansRecordInput,
  type ImmunisationRecordInput,
  type CamhsReferralInput,
  type MoodEntryInput,
} from "@/lib/engines/health-wellbeing-engine";

import {
  computeEducationIntelligence,
  type ChildInput as EdChild,
  type EducationRecordInput,
  type ActivityInput,
  type EduAttendanceInput,
} from "@/lib/engines/education-intelligence-engine";

import {
  computePlacementStability,
  type ChildInput as PsChild,
  type DailyLogInput,
  type IncidentInput as PsIncident,
  type MissingEpisodeInput as PsMissing,
  type KeyworkSessionInput,
  type OutcomeTargetInput,
} from "@/lib/engines/placement-stability-engine";

import {
  computeComplaintsIntelligence,
  type ComplaintInput,
  type ChildRef as CmChildRef,
  type StaffRef as CmStaffRef,
} from "@/lib/engines/complaints-intelligence-engine";

import {
  computeQualityAssuranceIntelligence,
  type QAAuditInput,
  type QAAuditActionInput,
  type StaffRef as QaStaffRef,
} from "@/lib/engines/quality-assurance-intelligence-engine";

import {
  computeManagerBriefing,
  type DomainDigest,
  type ChildAttentionInput,
} from "@/lib/engines/manager-briefing-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const ypNames = new Map(
    store.youngPeople.map((yp) => [yp.id, yp.preferred_name || yp.first_name]),
  );
  const childNameLookup = (id: string) =>
    ypNames.get(id) ?? id.replace("yp_", "YP ");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SAFEGUARDING
  // ═══════════════════════════════════════════════════════════════════════════

  const sgIncidents: SgIncident[] = store.incidents.map((i) => ({
    id: i.id, child_id: i.child_id, date: i.date, type: i.type,
    severity: i.severity, status: i.status,
    requires_oversight: i.requires_oversight, oversight_by: i.oversight_by ?? null,
  }));

  const sgMissing: MissingEpisodeInput[] = store.missingEpisodes.map((m) => ({
    id: m.id, child_id: m.child_id, date_missing: m.date_missing,
    status: m.status, risk_level: m.risk_level,
    return_interview_completed: m.return_interview_completed,
    contextual_safeguarding_risk: m.contextual_safeguarding_risk,
  }));

  const sgRestraints: SgRestraint[] = store.restraints.map((r) => ({
    id: r.id, child_id: r.child_id, date: r.date, duration: r.duration,
    reason: r.reason, restraint_type: r.restraint_type,
    injuries: (r.injuries ?? []).map((inj) => ({
      person: inj.person, description: inj.injury ?? "",
    })),
    child_debriefed: r.child_debriefed,
    staff_debriefed: r.staff_debriefed, review_status: r.review_status,
    de_escalation_attempts: r.de_escalation_attempts ?? [],
  }));

  const sgRiskAssessments: SgRiskAssessment[] = store.riskAssessments.map((ra) => ({
    id: ra.id, child_id: ra.child_id, domain: ra.domain,
    current_level: ra.current_level, previous_level: ra.previous_level,
    trend: ra.trend, status: ra.status, review_date: ra.review_date,
    assessed_date: ra.assessed_date,
  }));

  const sgNotifiable: NotifiableEventInput[] = store.notifiableEvents.map((ne) => ({
    id: ne.id, date: ne.date, event_type: ne.event_type,
    child_id: ne.child_id, ofsted_status: ne.ofsted_status,
  }));

  const sgChildren: ChildRef[] = store.youngPeople.map((yp) => ({
    id: yp.id, name: yp.preferred_name ?? yp.first_name,
  }));

  const safeguarding = computeSafeguardingIntelligence({
    incidents: sgIncidents, missingEpisodes: sgMissing, restraints: sgRestraints,
    riskAssessments: sgRiskAssessments, notifiableEvents: sgNotifiable,
    children: sgChildren, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. BEHAVIOUR
  // ═══════════════════════════════════════════════════════════════════════════

  const bhEntries: BehaviourEntryInput[] = store.behaviourLog.map((e: any) => ({
    id: e.id, child_id: e.child_id, date: e.date, time: e.time,
    direction: e.direction, intensity: e.intensity, title: e.title,
    antecedent: e.antecedent, behaviour: e.behaviour, consequence: e.consequence,
    trigger: e.trigger, strategy_used: e.strategy_used, outcome: e.outcome,
    recorded_by: e.recorded_by,
  }));

  const bhIncidents: BhIncident[] = store.incidents.map((i) => ({
    id: i.id, child_id: i.child_id, date: i.date, time: i.time,
    type: i.type, severity: i.severity, description: i.description,
    immediate_action: i.immediate_action, status: i.status,
    body_map_completed: i.body_map_completed, reported_by: i.reported_by,
  }));

  const bhRestraints: BhRestraint[] = store.restraints.map((r: any) => ({
    id: r.id, child_id: r.child_id, date: r.date, start_time: r.start_time,
    end_time: r.end_time, duration: r.duration, reason: r.reason,
    restraint_type: r.restraint_type, antecedent: r.antecedent,
    de_escalation_attempts: r.de_escalation_attempts,
    child_debriefed: r.child_debriefed, staff_debriefed: r.staff_debriefed,
    injuries: (r.injuries ?? []).map((inj: any) => ({
      person: inj.person ?? "unknown",
      description: inj.injury ?? inj.description ?? "",
    })),
    review_status: r.review_status, recorded_by: r.recorded_by,
  }));

  const bhSanctions: SanctionRewardInput[] = store.sanctionRewards.map((sr) => ({
    id: sr.id, child_id: sr.child_id, date: sr.date, direction: sr.direction,
    title: sr.title, description: sr.description, context: sr.context,
    child_response: sr.child_response, outcome: sr.outcome,
    proportionate: sr.proportionate, recorded_by: sr.recorded_by,
  }));

  const behaviour = computeBehaviourIntelligence({
    behaviourEntries: bhEntries, incidents: bhIncidents,
    restraints: bhRestraints, sanctionRewards: bhSanctions,
    childNameLookup, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. WORKFORCE
  // ═══════════════════════════════════════════════════════════════════════════

  const wfStaff: StaffInput[] = store.staff.map((s) => ({
    id: s.id, full_name: s.full_name, role: s.role,
    employment_type: s.employment_type, employment_status: s.employment_status,
    start_date: s.start_date, probation_end_date: s.probation_end_date,
    contracted_hours: s.contracted_hours, dbs_number: s.dbs_number,
    dbs_issue_date: s.dbs_issue_date, dbs_update_service: s.dbs_update_service,
    next_supervision_due: s.next_supervision_due, next_appraisal_due: s.next_appraisal_due,
    is_active: s.is_active,
  }));

  const wfTraining: TrainingInput[] = store.trainingRecords.map((t) => ({
    id: t.id, staff_id: t.staff_id, course_name: t.course_name,
    category: t.category, completed_date: t.completed_date,
    expiry_date: t.expiry_date, status: t.status, is_mandatory: t.is_mandatory,
  }));

  const wfSupervisions: WfSupervision[] = store.supervisions.map((s) => ({
    id: s.id, staff_id: s.staff_id, scheduled_date: s.scheduled_date,
    actual_date: s.actual_date, status: s.status, type: s.type,
    wellbeing_score: s.wellbeing_score,
  }));

  const wfShifts: ShiftInput[] = store.shifts.map((s) => ({
    id: s.id, staff_id: s.staff_id, date: s.date, shift_type: s.shift_type,
    start_time: s.start_time, end_time: s.end_time, status: s.status,
    overtime_minutes: s.overtime_minutes,
  }));

  const wfLeave: LeaveInput[] = store.leaveRequests.map((l) => ({
    id: l.id, staff_id: l.staff_id, leave_type: l.leave_type,
    start_date: l.start_date, end_date: l.end_date,
    total_days: l.total_days, status: l.status,
  }));

  const workforce = computeWorkforceIntelligence({
    staff: wfStaff, training: wfTraining, supervisions: wfSupervisions,
    shifts: wfShifts, leave: wfLeave, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. HEALTH & WELLBEING
  // ═══════════════════════════════════════════════════════════════════════════

  const hwChildren: HwChild[] = store.youngPeople.map((yp) => ({
    id: yp.id, name: yp.preferred_name ?? yp.first_name,
    date_of_birth: yp.date_of_birth,
  }));

  const hwAppts: AppointmentInput[] = store.appointments.map((a) => ({
    id: a.id, child_id: a.child_id, date: a.date, type: a.type, status: a.status,
  }));

  const hwAssessments: HealthAssessmentInput[] = store.healthAssessments.map((ha) => ({
    id: ha.id, child_id: ha.child_id, type: ha.type, status: ha.status,
    date: ha.date, next_due: ha.next_due,
    sdq_total: ha.sdq_scores?.total ?? null, sdq_band: ha.sdq_scores?.band ?? null,
  }));

  const hwDental: DentalRecordInput[] = store.dentalRecords.map((dr) => ({
    id: dr.id, child_id: dr.child_id, last_check_up_date: dr.last_check_up_date,
    next_check_up_due: dr.next_check_up_due, registration_status: dr.registration_status,
  }));

  const hwOpticians: OpticiansRecordInput[] = store.opticiansRecords.map((or) => ({
    id: or.id, child_id: or.child_id, last_exam_date: or.last_exam_date,
    next_exam_due: or.next_exam_due,
  }));

  const hwImmunisations: ImmunisationRecordInput[] = store.immunisationRecords.map((ir) => ({
    id: ir.id, child_id: ir.child_id,
    missed_count: ir.missed_at_age.length,
    caught_up_count: ir.caught_up_during_placement.length,
    upcoming_due_count: ir.upcoming_due_within_90_days.length,
    gp_reviewed_schedule: ir.gp_reviewed_schedule,
  }));

  const hwCamhs: CamhsReferralInput[] = store.camhsReferrals.map((cr) => ({
    id: cr.id, child_id: cr.child_id, referral_date: cr.referral_date,
    referral_status: cr.referral_status, urgency: cr.urgency,
    sessions_held: cr.sessions_held, sessions_scheduled: cr.sessions_scheduled,
    engagement_level: cr.current_engagement_level,
    waiting_time_weeks: cr.waiting_time_weeks,
  }));

  const hwMoods: MoodEntryInput[] = store.dailyLog
    .filter((e) => e.mood_score != null && e.mood_score > 0)
    .map((e) => ({ child_id: e.child_id, date: e.date, mood_score: e.mood_score! }));

  const hwMentalHealth: MoodEntryInput[] = store.mentalHealthCheckIns.map((mh) => ({
    child_id: mh.child_id, date: mh.date, mood_score: mh.mood_rating * 2,
  }));

  const health = computeHealthWellbeing({
    children: hwChildren, appointments: hwAppts, healthAssessments: hwAssessments,
    dentalRecords: hwDental, opticiansRecords: hwOpticians,
    immunisationRecords: hwImmunisations, camhsReferrals: hwCamhs,
    moodEntries: [...hwMoods, ...hwMentalHealth], today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EDUCATION
  // ═══════════════════════════════════════════════════════════════════════════

  const edChildren: EdChild[] = store.youngPeople.map((yp) => ({
    id: yp.id, name: yp.preferred_name ?? yp.first_name,
  }));

  const edRecords: EducationRecordInput[] = store.educationRecords.map((r) => ({
    id: r.id, child_id: r.child_id, record_type: r.record_type,
    date: r.date, school: r.school ?? null,
    attendance_status: r.attendance_status ?? null,
    linked_pep: r.linked_pep ?? false, status: r.status,
  }));

  const edActivities: ActivityInput[] = store.activities.map((a) => ({
    id: a.id, child_id: a.child_id, date: a.date, category: a.category,
    engagement: a.engagement, duration_minutes: a.duration_minutes,
    is_new_experience: a.is_new_experience,
  }));

  const edAttendance: EduAttendanceInput[] = store.eduAttendanceRecords.map((ea) => ({
    id: ea.id, child_id: ea.child_id, date: ea.date,
    attendance_code: ea.attendance_code, session: ea.session,
  }));

  const education = computeEducationIntelligence({
    children: edChildren, educationRecords: edRecords,
    activities: edActivities, eduAttendance: edAttendance, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PLACEMENT STABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  const psChildren: PsChild[] = store.youngPeople.map((yp) => ({
    id: yp.id, first_name: yp.first_name,
    preferred_name: yp.preferred_name ?? null,
    date_of_birth: yp.date_of_birth, placement_start: yp.placement_start,
    placement_end: yp.placement_end ?? null,
    key_worker_id: yp.key_worker_id ?? null,
    risk_flags: yp.risk_flags ?? [], status: yp.status,
  }));

  const psDailyLog: DailyLogInput[] = store.dailyLog.map((dl) => ({
    id: dl.id, child_id: dl.child_id, date: dl.date,
    mood_score: dl.mood_score ?? null,
    entry_type: dl.entry_type ?? "general",
    is_significant: dl.is_significant ?? false,
  }));

  const psIncidents: PsIncident[] = store.incidents.map((i) => ({
    id: i.id, child_id: i.child_id, date: i.date,
    type: i.type ?? "general", severity: i.severity ?? "medium",
  }));

  const psMissing: PsMissing[] = store.missingEpisodes.map((m) => ({
    id: m.id, child_id: m.child_id, date_missing: m.date_missing,
    status: m.status, risk_level: m.risk_level,
  }));

  const psKeywork: KeyworkSessionInput[] = store.keyWorkingSessions.map((kw) => ({
    id: kw.id, child_id: kw.child_id, date: kw.date,
    mood_before: kw.mood_before ?? 3, mood_after: kw.mood_after ?? 3,
    type: kw.type ?? "one_to_one",
  }));

  const psOutcomes: OutcomeTargetInput[] = store.outcomeTargets.map((ot) => ({
    id: ot.id, child_id: ot.child_id, domain: ot.domain,
    direction: ot.direction, current_rating: ot.current_rating,
    target_rating: ot.target_rating, baseline_rating: ot.baseline_rating,
    status: ot.status,
  }));

  const placement = computePlacementStability({
    children: psChildren, dailyLogs: psDailyLog, incidents: psIncidents,
    missingEpisodes: psMissing, keyworkSessions: psKeywork,
    outcomeTargets: psOutcomes, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. COMPLAINTS
  // ═══════════════════════════════════════════════════════════════════════════

  const cmComplaints: ComplaintInput[] = (store.complaintOutcomeRecords ?? []).map((c: any) => ({
    id: c.id,
    complaint_date: typeof c.complaint_date === "string" ? c.complaint_date.slice(0, 10) : c.complaint_date,
    complainant: c.complainant, source: c.source, theme: c.theme,
    outcome: c.outcome, investigated_by: c.investigated_by ?? "",
    date_resolved: c.date_resolved ? (typeof c.date_resolved === "string" ? c.date_resolved.slice(0, 10) : c.date_resolved) : null,
    response_time_days: c.response_time_days ?? 0,
    child_id: c.child_id ?? null, summary: c.summary ?? "",
    lessons_learned: c.lessons_learned ?? "",
    practice_changes: c.practice_changes ?? [],
    complainant_satisfied: c.complainant_satisfied ?? null,
    escalated: c.escalated ?? false, ofsted_notified: c.ofsted_notified ?? false,
  }));

  const cmChildren: CmChildRef[] = store.youngPeople.map((yp) => ({
    id: yp.id, name: yp.preferred_name ?? yp.first_name,
  }));

  const cmStaff: CmStaffRef[] = store.staff.filter((s) => s.is_active).map((s) => ({
    id: s.id, name: s.full_name,
  }));

  const complaints = computeComplaintsIntelligence({
    complaints: cmComplaints, children: cmChildren, staff: cmStaff, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. QUALITY ASSURANCE
  // ═══════════════════════════════════════════════════════════════════════════

  const qaAudits: QAAuditInput[] = (store.qaAuditRecords ?? []).map((r: any) => ({
    id: r.id, title: r.title ?? "Untitled Audit", date: r.date ?? "",
    auditor: r.auditor ?? "", scope: r.scope ?? "general",
    overall_rating: r.overall_rating ?? "good", score: r.score ?? 0,
    findings: Array.isArray(r.findings) ? r.findings : [],
    strengths: Array.isArray(r.strengths) ? r.strengths : [],
    areas_for_improvement: Array.isArray(r.areas_for_improvement) ? r.areas_for_improvement : [],
    actions: Array.isArray(r.actions) ? r.actions.map((a: any): QAAuditActionInput => ({
      action: a.action ?? "", owner: a.owner ?? "",
      deadline: a.deadline ?? "", status: a.status ?? "pending",
    })) : [],
  }));

  const qaStaff: QaStaffRef[] = store.staff.filter((s) => s.is_active).map((s) => ({
    id: s.id, name: s.full_name,
  }));

  const qa = computeQualityAssuranceIntelligence({
    audits: qaAudits, staff: qaStaff, today,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MAP TO DOMAIN DIGESTS
  // ═══════════════════════════════════════════════════════════════════════════

  const sgAlerts = [
    ...(safeguarding.profile.open_incidents > 0
      ? [{ severity: "high", message: `${safeguarding.profile.open_incidents} open incidents requiring review` }]
      : []),
    ...(safeguarding.risk_assessments.high_or_very_high > 0
      ? [{ severity: "high", message: `${safeguarding.risk_assessments.high_or_very_high} children at high/very high risk` }]
      : []),
    ...(safeguarding.risk_assessments.overdue_reviews > 0
      ? [{ severity: "medium", message: `${safeguarding.risk_assessments.overdue_reviews} risk assessments overdue for review` }]
      : []),
    ...(safeguarding.missing.return_interview_rate < 100
      ? [{ severity: "high", message: `Return interview completion at ${safeguarding.missing.return_interview_rate}% — target 100%` }]
      : []),
  ];

  const domains: DomainDigest[] = [
    {
      domain: "safeguarding",
      domain_label: "Safeguarding",
      critical_alerts: sgAlerts.filter((a) => a.severity === "critical").length,
      high_alerts: sgAlerts.filter((a) => a.severity === "high").length,
      medium_alerts: sgAlerts.filter((a) => a.severity === "medium").length,
      total_alerts: sgAlerts.length,
      compliance_rate: null,
      overdue_count: safeguarding.risk_assessments.overdue_reviews,
      improving_count: safeguarding.risk_assessments.improving_trend,
      worsening_count: safeguarding.risk_assessments.worsening_trend,
      key_metric_label: "Open Incidents",
      key_metric_value: safeguarding.profile.open_incidents,
      key_metric_target: 0,
      alerts: sgAlerts,
      insights: safeguarding.insights,
    },
    {
      domain: "behaviour",
      domain_label: "Behaviour",
      critical_alerts: behaviour.alerts.filter((a) => a.severity === "critical").length,
      high_alerts: behaviour.alerts.filter((a) => a.severity === "high").length,
      medium_alerts: behaviour.alerts.filter((a) => a.severity === "medium").length,
      total_alerts: behaviour.alerts.length,
      compliance_rate: behaviour.profile.de_escalation_success_rate,
      overdue_count: 0,
      improving_count: behaviour.child_trajectories.filter((t) => t.trend === "improving").length,
      worsening_count: behaviour.child_trajectories.filter((t) => t.trend === "declining").length,
      key_metric_label: "Positive %",
      key_metric_value: behaviour.profile.positive_percentage,
      key_metric_target: 70,
      alerts: behaviour.alerts.map((a) => ({ severity: a.severity, message: a.message })),
      insights: behaviour.insights,
    },
    {
      domain: "workforce",
      domain_label: "Workforce",
      critical_alerts: workforce.dbs.expired_or_missing > 0 ? 1 : 0,
      high_alerts: workforce.supervision.overdue > 2 ? 1 : 0,
      medium_alerts: (workforce.training.filter((t) => t.expired > 0).length > 0 ? 1 : 0),
      total_alerts: (workforce.dbs.expired_or_missing > 0 ? 1 : 0) +
        (workforce.supervision.overdue > 2 ? 1 : 0) +
        (workforce.training.filter((t) => t.expired > 0).length > 0 ? 1 : 0),
      compliance_rate: workforce.profile.training_compliance_rate,
      overdue_count: workforce.supervision.overdue,
      improving_count: 0,
      worsening_count: 0,
      key_metric_label: "Training Compliance",
      key_metric_value: workforce.profile.training_compliance_rate,
      key_metric_target: 95,
      alerts: [
        ...(workforce.dbs.expired_or_missing > 0
          ? [{ severity: "critical", message: `${workforce.dbs.expired_or_missing} staff with expired/missing DBS checks` }]
          : []),
        ...(workforce.supervision.overdue > 0
          ? [{ severity: "high", message: `${workforce.supervision.overdue} supervisions overdue` }]
          : []),
        ...(workforce.training.filter((t) => t.expired > 0).length > 0
          ? [{ severity: "medium", message: `Training gaps detected in ${workforce.training.filter((t) => t.expired > 0).length} categories` }]
          : []),
      ],
      insights: workforce.insights,
    },
    {
      domain: "health",
      domain_label: "Health & Wellbeing",
      critical_alerts: health.alerts.filter((a) => a.severity === "critical").length,
      high_alerts: health.alerts.filter((a) => a.severity === "high").length,
      medium_alerts: health.alerts.filter((a) => a.severity === "medium").length,
      total_alerts: health.alerts.length,
      compliance_rate: health.compliance.overall_compliance_rate,
      overdue_count: health.alerts.filter((a) => a.message.toLowerCase().includes("overdue")).length,
      improving_count: health.wellbeing_trends.filter((t) => t.trend === "improving").length,
      worsening_count: health.wellbeing_trends.filter((t) => t.trend === "declining").length,
      key_metric_label: "Health Compliance",
      key_metric_value: health.compliance.overall_compliance_rate,
      key_metric_target: 100,
      alerts: health.alerts.map((a) => ({ severity: a.severity, message: a.message })),
      insights: health.insights,
    },
    {
      domain: "education",
      domain_label: "Education",
      critical_alerts: education.alerts.filter((a) => a.severity === "critical").length,
      high_alerts: education.alerts.filter((a) => a.severity === "high").length,
      medium_alerts: education.alerts.filter((a) => a.severity === "medium").length,
      total_alerts: education.alerts.length,
      compliance_rate: education.overview.total_children > 0
        ? Math.round((education.overview.in_education / education.overview.total_children) * 100)
        : 100,
      overdue_count: education.overview.pep_overdue_count,
      improving_count: 0,
      worsening_count: education.overview.neet_count,
      key_metric_label: "Avg Attendance",
      key_metric_value: education.overview.avg_attendance_pct,
      key_metric_target: 95,
      alerts: education.alerts.map((a) => ({ severity: a.severity, message: a.message })),
      insights: education.insights,
    },
    {
      domain: "placement",
      domain_label: "Placement Stability",
      critical_alerts: placement.home_metrics.children_critical,
      high_alerts: placement.disruption_indicators.filter((d) => d.severity === "high").length,
      medium_alerts: placement.disruption_indicators.filter((d) => d.severity === "medium").length,
      total_alerts: placement.disruption_indicators.length,
      compliance_rate: Math.round(placement.home_metrics.average_stability_score),
      overdue_count: 0,
      improving_count: placement.children.filter((c) => c.mood_trend === "improving").length,
      worsening_count: placement.children.filter((c) => c.mood_trend === "declining").length,
      key_metric_label: "Avg Stability Score",
      key_metric_value: Math.round(placement.home_metrics.average_stability_score),
      key_metric_target: 80,
      alerts: placement.disruption_indicators.map((d) => ({
        severity: d.severity,
        message: `${d.child_name}: ${d.indicator} — ${d.detail}`,
      })),
      insights: placement.insights,
    },
    {
      domain: "complaints",
      domain_label: "Complaints",
      critical_alerts: complaints.alerts.filter((a) => a.severity === "critical").length,
      high_alerts: complaints.alerts.filter((a) => a.severity === "high").length,
      medium_alerts: complaints.alerts.filter((a) => a.severity === "medium").length,
      total_alerts: complaints.alerts.length,
      compliance_rate: complaints.overview.satisfaction_rate,
      overdue_count: complaints.overview.open_count,
      improving_count: 0,
      worsening_count: complaints.overview.escalated_count,
      key_metric_label: "Open Complaints",
      key_metric_value: complaints.overview.open_count,
      key_metric_target: 0,
      alerts: complaints.alerts.map((a) => ({ severity: a.severity, message: a.message })),
      insights: complaints.insights,
    },
    {
      domain: "quality_assurance",
      domain_label: "Quality Assurance",
      critical_alerts: qa.alerts.filter((a) => a.severity === "critical").length,
      high_alerts: qa.alerts.filter((a) => a.severity === "high").length,
      medium_alerts: qa.alerts.filter((a) => a.severity === "medium").length,
      total_alerts: qa.alerts.length,
      compliance_rate: qa.overview.recommendation_completion_rate,
      overdue_count: qa.overview.actions_overdue,
      improving_count: 0,
      worsening_count: qa.overview.actions_overdue > 0 ? 1 : 0,
      key_metric_label: "Action Completion",
      key_metric_value: qa.overview.recommendation_completion_rate,
      key_metric_target: 90,
      alerts: qa.alerts.map((a) => ({ severity: a.severity, message: a.message })),
      insights: qa.insights,
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD CHILDREN REQUIRING ATTENTION
  // ═══════════════════════════════════════════════════════════════════════════

  const childFlags = new Map<string, { domains: Set<string>; flags: string[]; maxSeverity: number }>();

  const severityRank = (s: string) =>
    s === "critical" ? 0 : s === "high" ? 1 : s === "medium" ? 2 : 3;
  const severityFromRank = (r: number) =>
    r === 0 ? "critical" as const : r === 1 ? "high" as const : r === 2 ? "medium" as const : "low" as const;

  for (const child of placement.children) {
    if (child.stability_score < 50 || child.mood_trend === "declining") {
      const entry = childFlags.get(child.child_id) ?? { domains: new Set(), flags: [], maxSeverity: 3 };
      entry.domains.add("Placement");
      entry.flags.push(child.stability_score < 50 ? "Stability score critical" : "Declining placement trajectory");
      entry.maxSeverity = Math.min(entry.maxSeverity, child.stability_score < 30 ? 0 : 1);
      childFlags.set(child.child_id, entry);
    }
  }

  for (const alert of behaviour.alerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      const childId = behaviour.child_trajectories.find(
        (t) => alert.message.includes(t.child_name),
      )?.child_id;
      if (childId) {
        const entry = childFlags.get(childId) ?? { domains: new Set(), flags: [], maxSeverity: 3 };
        entry.domains.add("Behaviour");
        entry.flags.push(alert.message);
        entry.maxSeverity = Math.min(entry.maxSeverity, severityRank(alert.severity));
        childFlags.set(childId, entry);
      }
    }
  }

  for (const alert of health.alerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      const childId = store.youngPeople.find(
        (yp) => (yp.preferred_name ?? yp.first_name) === alert.child_name,
      )?.id;
      if (childId) {
        const entry = childFlags.get(childId) ?? { domains: new Set(), flags: [], maxSeverity: 3 };
        entry.domains.add("Health");
        entry.flags.push(alert.message);
        entry.maxSeverity = Math.min(entry.maxSeverity, severityRank(alert.severity));
        childFlags.set(childId, entry);
      }
    }
  }

  for (const alert of education.alerts) {
    if (alert.severity === "critical" || alert.severity === "high") {
      const childId = store.youngPeople.find(
        (yp) => (yp.preferred_name ?? yp.first_name) === alert.child_name,
      )?.id;
      if (childId) {
        const entry = childFlags.get(childId) ?? { domains: new Set(), flags: [], maxSeverity: 3 };
        entry.domains.add("Education");
        entry.flags.push(alert.message);
        entry.maxSeverity = Math.min(entry.maxSeverity, severityRank(alert.severity));
        childFlags.set(childId, entry);
      }
    }
  }

  if (safeguarding.risk_assessments.high_or_very_high > 0) {
    for (const ra of store.riskAssessments) {
      if (ra.current_level === "high" || ra.current_level === "very_high") {
        const entry = childFlags.get(ra.child_id) ?? { domains: new Set(), flags: [], maxSeverity: 3 };
        entry.domains.add("Safeguarding");
        entry.flags.push(`High/very-high risk: ${ra.domain}`);
        entry.maxSeverity = Math.min(entry.maxSeverity, 1);
        childFlags.set(ra.child_id, entry);
      }
    }
  }

  const childrenAttention: ChildAttentionInput[] = Array.from(childFlags.entries()).map(
    ([childId, data]) => ({
      child_id: childId,
      child_name: childNameLookup(childId),
      domains_flagged: Array.from(data.domains),
      highest_severity: severityFromRank(data.maxSeverity),
      flags: data.flags.slice(0, 5),
    }),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RUN META-ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  const result = computeManagerBriefing({
    domains,
    children_attention: childrenAttention,
    total_children: store.youngPeople.length,
    total_staff: store.staff.filter((s) => s.is_active).length,
    home_name: store.home?.name?.trim() || "This home",
    today,
  });

  return NextResponse.json({ data: result });
}
