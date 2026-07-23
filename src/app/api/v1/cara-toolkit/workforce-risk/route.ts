// ══════════════════════════════════════════════════════════════════════════════
// CARA VISUAL TOOLKIT — WORKFORCE BURNOUT & RISK DASHBOARD
// GET /api/v1/cara-toolkit/workforce-risk
//
// Surfaces staffing stability, supervision quality, training compliance,
// burnout signals, and overall workforce risk level.
// CHR 2015 Reg 32 (staffing), Reg 33 (supervision quality), Reg 34 (appraisal).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { below, formatRate, meets, rateOf } from "@/lib/metrics/rate";
import type {
  WorkforceRiskAnalysis,
  WorkforceRiskLevel,
  StaffingIndicator,
  SignalColour,
  ActionRequired,
} from "@/lib/cara-visual-toolkit/types";

function signal(green: boolean, amber: boolean): SignalColour {
  if (green) return "green";
  if (amber) return "amber";
  return "red";
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const staff          = (store.staff as any[]) ?? [];
  const supervisions   = (store.reflectiveSupervisions as any[]) ?? [];
  const training       = (store.trainingRecords as any[]) ?? [];
  const shifts         = (store.shifts as any[]) ?? [];
  const leaveRequests  = (store.leaveRequests as any[]) ?? [];
  const absences       = (store.absenceTracking as any[]) ?? [];

  // ── Staffing indicators ───────────────────────────────────────────────────

  const activeStaff = staff.filter((s: any) => s.status !== "inactive");
  const agencyStaff = activeStaff.filter(
    (s: any) => s.employment_type === "agency" || s.employment_type === "bank"
  );
  // With no active staff on record there is no workforce mix to report — 0%
  // would read as "minimal agency reliance", which is a finding we have not earned.
  const agencyPct = rateOf(agencyStaff, activeStaff);

  const recentSickLeave = leaveRequests.filter(
    (l: any) => l.leave_type === "sick" && l.status === "approved"
  );

  const openShifts = shifts.filter((s: any) => s.is_open_shift === true);
  const overtimeShifts = shifts.filter(
    (s: any) => typeof s.overtime_minutes === "number" && s.overtime_minutes > 0
  );
  const lateArrivals = shifts.filter((s: any) => {
    if (!s.start_time || !s.actual_start) return false;
    const planned = new Date(`2000-01-01T${s.start_time}:00`).getTime();
    const actual = new Date(`2000-01-01T${s.actual_start}:00`).getTime();
    return actual - planned > 5 * 60 * 1000; // >5 min late
  });

  const staffingIndicators: StaffingIndicator[] = [
    {
      label: "Active staff",
      value: activeStaff.length,
      signal: signal(activeStaff.length >= 4, activeStaff.length >= 2),
    },
    {
      label: "Agency / bank use",
      value: formatRate(agencyPct, "No data"),
      signal:
        agencyPct === null ? "grey" : signal(agencyPct <= 10, agencyPct <= 25),
      note:
        agencyPct !== null && agencyPct > 25
          ? "High agency reliance may affect consistency and relationships with children."
          : undefined,
    },
    {
      label: "Open / uncovered shifts",
      value: openShifts.length,
      signal: signal(openShifts.length === 0, openShifts.length <= 2),
      note: openShifts.length > 0 ? "Uncovered shifts require urgent attention." : undefined,
    },
    {
      label: "Recent sick leave",
      value: recentSickLeave.length,
      signal: signal(recentSickLeave.length === 0, recentSickLeave.length <= 2),
    },
    {
      label: "Overtime shifts",
      value: overtimeShifts.length,
      signal: signal(overtimeShifts.length <= 2, overtimeShifts.length <= 5),
      note:
        overtimeShifts.length > 5
          ? "Sustained overtime can indicate understaffing and increases burnout risk."
          : undefined,
    },
  ];

  // ── Supervision indicators ────────────────────────────────────────────────

  const recentSupervisions = supervisions
    .slice()
    .sort((a: any, b: any) =>
      String(b.date ?? "").localeCompare(String(a.date ?? ""))
    );

  // A supervision with no score recorded is excluded rather than counted as a
  // neutral 3 — silence is not evidence of average wellbeing or confidence.
  const meanTo1dp = (values: number[]): number | null =>
    values.length > 0
      ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
      : null;

  const avgWellbeing = meanTo1dp(
    supervisions
      .filter((r: any) => r.wellbeing_score != null)
      .map((r: any) => Number(r.wellbeing_score))
  );

  const avgConfidence = meanTo1dp(
    supervisions
      .filter((r: any) => r.confidence_level != null)
      .map((r: any) => Number(r.confidence_level))
  );

  const overdueFollowUps = supervisions.filter((r: any) => {
    if (!r.follow_up_date) return false;
    return (
      r.wellbeing_score <= 3 &&
      daysBetween(String(r.follow_up_date).slice(0, 10), today) > 0
    );
  });

  const overdueActions = supervisions.flatMap((r: any) =>
    (r.actions ?? []).filter((a: any) => !a.done && a.due && daysBetween(String(a.due).slice(0, 10), today) > 0)
  );

  const daysSinceLastSupervision =
    recentSupervisions.length > 0
      ? daysBetween(String(recentSupervisions[0].date ?? "").slice(0, 10), today)
      : null;

  const supervisionIndicators: StaffingIndicator[] = [
    {
      label: "Average wellbeing score",
      value: avgWellbeing !== null ? `${avgWellbeing}/5` : "No data",
      signal:
        avgWellbeing === null
          ? "grey"
          : signal(avgWellbeing >= 4, avgWellbeing >= 3),
      note:
        avgWellbeing !== null && avgWellbeing < 3
          ? "Staff wellbeing is below threshold. Consider urgent pastoral support and supervision."
          : undefined,
    },
    {
      label: "Average confidence score",
      value: avgConfidence !== null ? `${avgConfidence}/5` : "No data",
      signal:
        avgConfidence === null
          ? "grey"
          : signal(avgConfidence >= 4, avgConfidence >= 3),
    },
    {
      label: "Overdue follow-up supervisions",
      value: overdueFollowUps.length,
      signal: signal(overdueFollowUps.length === 0, overdueFollowUps.length <= 1),
      note:
        overdueFollowUps.length > 0
          ? "Staff who scored 3 or below require a follow-up supervision that is now overdue."
          : undefined,
    },
    {
      label: "Overdue supervision actions",
      value: overdueActions.length,
      signal: signal(overdueActions.length === 0, overdueActions.length <= 2),
    },
    {
      label: "Days since most recent supervision",
      value: daysSinceLastSupervision !== null ? `${daysSinceLastSupervision} days` : "No data",
      signal: signal(
        daysSinceLastSupervision !== null && daysSinceLastSupervision <= 28,
        daysSinceLastSupervision !== null && daysSinceLastSupervision <= 56
      ),
    },
  ];

  // ── Training indicators ───────────────────────────────────────────────────

  const mandatoryTraining = training.filter((t: any) => t.is_mandatory);
  const expiredMandatory   = mandatoryTraining.filter((t: any) => t.status === "expired");
  const expiringSoon       = mandatoryTraining.filter((t: any) => t.status === "expiring_soon");
  const notStarted         = mandatoryTraining.filter((t: any) => t.status === "not_started");
  const compliant          = mandatoryTraining.filter((t: any) => t.status === "compliant");
  // An empty mandatory training register is nothing recorded, not full compliance.
  const compliancePct = rateOf(compliant, mandatoryTraining);

  const trainingIndicators: StaffingIndicator[] = [
    {
      label: "Mandatory training compliance",
      value: formatRate(compliancePct, "No data"),
      signal:
        compliancePct === null
          ? "grey"
          : signal(meets(compliancePct, 90), meets(compliancePct, 70)),
      note:
        compliancePct === null
          ? "No mandatory training records — compliance cannot be evidenced."
          : below(compliancePct, 70)
          ? "Training compliance is significantly below standard. Review urgently."
          : undefined,
    },
    {
      label: "Expired mandatory training",
      value: expiredMandatory.length,
      signal: signal(expiredMandatory.length === 0, expiredMandatory.length <= 2),
      note:
        expiredMandatory.length > 0
          ? `${expiredMandatory.length} expired mandatory training record${expiredMandatory.length > 1 ? "s" : ""} require immediate renewal.`
          : undefined,
    },
    {
      label: "Training expiring soon",
      value: expiringSoon.length,
      signal: signal(expiringSoon.length === 0, expiringSoon.length <= 3),
    },
    {
      label: "Not yet started (mandatory)",
      value: notStarted.length,
      signal: signal(notStarted.length === 0, notStarted.length <= 1),
    },
  ];

  // ── Burnout signals ───────────────────────────────────────────────────────

  const burnoutSignals: string[] = [];

  if (agencyPct !== null && agencyPct > 20) {
    burnoutSignals.push(
      `Agency and bank staff represent ${agencyPct}% of the workforce. High agency use can reduce consistency, relational continuity, and the emotional safety children experience.`
    );
  }
  if (avgWellbeing !== null && avgWellbeing < 3) {
    burnoutSignals.push(
      `Average staff wellbeing score is ${avgWellbeing}/5. Scores below 3 suggest staff may be experiencing significant emotional or professional pressure. Targeted pastoral support and reflective supervision are recommended.`
    );
  }
  if (overdueFollowUps.length > 0) {
    burnoutSignals.push(
      `${overdueFollowUps.length} staff member${overdueFollowUps.length > 1 ? "s" : ""} with wellbeing concerns ${overdueFollowUps.length > 1 ? "have" : "has"} not received their planned follow-up supervision. This is a staffing governance concern.`
    );
  }
  if (expiredMandatory.length >= 3) {
    burnoutSignals.push(
      "A pattern of expired mandatory training may indicate competing pressures preventing staff from completing required learning. This is both a compliance risk and an indicator of workforce pressure."
    );
  }
  if (overtimeShifts.length > 3) {
    burnoutSignals.push(
      `${overtimeShifts.length} shifts with overtime recorded. Regular overtime increases physical and emotional fatigue, and may affect the quality and consistency of care.`
    );
  }
  if (openShifts.length > 0) {
    burnoutSignals.push(
      `${openShifts.length} shift${openShifts.length > 1 ? "s are" : " is"} currently uncovered. Staffing gaps create pressure on remaining staff and may affect safe care ratios.`
    );
  }

  // ── Strengths ─────────────────────────────────────────────────────────────

  const strengths: string[] = [];
  if (supervisions.length >= 3) {
    strengths.push(`${supervisions.length} reflective supervision records are in place, indicating an active supervision culture.`);
  }
  if (avgWellbeing !== null && avgWellbeing >= 4) {
    strengths.push(`Average staff wellbeing score of ${avgWellbeing}/5 indicates a broadly supportive working environment.`);
  }
  if (meets(compliancePct, 90)) {
    strengths.push(`${compliancePct}% mandatory training compliance reflects strong workforce standards.`);
  }
  if (openShifts.length === 0 && agencyPct !== null && agencyPct <= 10) {
    strengths.push("Stable staffing with minimal agency reliance supports relational consistency for children.");
  }

  // ── Priority actions ──────────────────────────────────────────────────────

  const actions: ActionRequired[] = [];
  let actionIdx = 1;

  if (expiredMandatory.length > 0) {
    actions.push({
      id: `wf_action_${actionIdx++}`,
      description: `Renew ${expiredMandatory.length} expired mandatory training record${expiredMandatory.length > 1 ? "s" : ""}.`,
      owner: "Registered Manager",
      targetDate: today,
      priority: "urgent",
      status: "not_started",
    });
  }
  if (openShifts.length > 0) {
    actions.push({
      id: `wf_action_${actionIdx++}`,
      description: `Cover ${openShifts.length} open shift${openShifts.length > 1 ? "s" : ""} to maintain safe staffing ratios.`,
      owner: "Registered Manager / Deputy",
      targetDate: today,
      priority: "urgent",
      status: "not_started",
    });
  }
  if (overdueFollowUps.length > 0) {
    actions.push({
      id: `wf_action_${actionIdx++}`,
      description: `Complete ${overdueFollowUps.length} overdue follow-up supervision${overdueFollowUps.length > 1 ? "s" : ""} for staff with wellbeing concerns.`,
      owner: "Registered Manager",
      targetDate: today,
      priority: "high",
      status: "not_started",
    });
  }
  if (avgWellbeing !== null && avgWellbeing < 3.5) {
    actions.push({
      id: `wf_action_${actionIdx++}`,
      description:
        "Schedule a team wellbeing conversation and review whether additional pastoral support, workload adjustments, or external resources are needed.",
      owner: "Registered Manager",
      targetDate: today,
      priority: "high",
      status: "not_started",
    });
  }

  // ── Overall risk level ────────────────────────────────────────────────────

  const redCount = [
    ...staffingIndicators,
    ...supervisionIndicators,
    ...trainingIndicators,
  ].filter((i) => i.signal === "red").length;

  const amberCount = [
    ...staffingIndicators,
    ...supervisionIndicators,
    ...trainingIndicators,
  ].filter((i) => i.signal === "amber").length;

  let overallRisk: WorkforceRiskLevel = "low";
  if (redCount >= 4 || burnoutSignals.length >= 4) overallRisk = "critical";
  else if (redCount >= 2 || burnoutSignals.length >= 3) overallRisk = "elevated";
  else if (redCount >= 1 || amberCount >= 3) overallRisk = "moderate";

  const riskLabels: Record<WorkforceRiskLevel, string> = {
    low:      "Low — workforce appears stable",
    moderate: "Moderate — some indicators warrant attention",
    elevated: "Elevated — workforce pressure is building",
    critical: "Critical — urgent leadership action required",
  };

  const result: WorkforceRiskAnalysis = {
    overallRisk,
    overallRiskLabel: riskLabels[overallRisk],
    staffingIndicators,
    supervisionIndicators,
    trainingIndicators,
    burnoutSignals,
    strengths,
    priorityActions: actions,
    teamSignalSummary:
      burnoutSignals.length === 0
        ? "No significant burnout signals detected at this time. Continue to monitor through regular supervision and review."
        : `${burnoutSignals.length} burnout or workforce risk signal${burnoutSignals.length > 1 ? "s" : ""} identified. Review with senior leadership and consider whether additional support or resource is required.`,
    regulatoryNote:
      "CHR 2015 Reg 32 requires sufficient staff of the right experience and qualification. Reg 33 requires regular, quality supervision. Reg 34 requires annual appraisal. Workforce risk indicators should inform the Reg 45 quality-of-care review and the registered manager's oversight responsibilities.",
  };

  return NextResponse.json({ data: result });
}
