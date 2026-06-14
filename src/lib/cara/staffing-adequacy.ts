// ══════════════════════════════════════════════════════════════════════════════
// Cara — STAFFING ADEQUACY ANALYSER
//
// Assesses whether current and upcoming staffing levels meet:
//   - Regulatory minimums (CHR 2015 Reg 22: Employment of staff)
//   - Statement of Purpose ratios
//   - Individual child needs (1:1, 2:1, waking night)
//   - Planned activity requirements
//   - Training/qualification coverage
//   - Lone working risk
//
// CHR 2015 Reg 22 (Employment of Staff)
// CHR 2015 Reg 13 (Leadership and Management)
// SCCIF: Leadership and Management / Safety
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShiftSlot {
  id: string;
  date: string;              // YYYY-MM-DD
  shiftType: "day" | "evening" | "night" | "sleep_in";
  startTime: string;         // HH:MM
  endTime: string;           // HH:MM
  staffId?: string;
  staffName?: string;
  role: "senior" | "residential" | "agency" | "bank";
  qualifications: string[];  // ["L3", "first_aid", "med_trained", "safeguarding_lead"]
  confirmed: boolean;
}

export interface ChildNeed {
  childId: string;
  childName: string;
  staffingRatio: "standard" | "1:1" | "2:1";
  requiresWakingNight: boolean;
  requiresMedTrained: boolean;
  riskLevel: "low" | "medium" | "high" | "very_high";
  currentlyPlaced: boolean;
}

export interface PlannedActivity {
  id: string;
  date: string;
  time: string;
  description: string;
  staffRequired: number;
  requiresDriver: boolean;
  requiresQualification?: string;
}

export interface HomeConfig {
  homeId: string;
  homeName: string;
  registeredBeds: number;
  currentOccupancy: number;
  minimumDayStaff: number;      // Minimum on a day shift
  minimumEveningStaff: number;
  minimumNightStaff: number;    // Waking night or sleep-in
  requiresSeniorEveryShift: boolean;
  requiresFirstAidEveryShift: boolean;
  requiresMedTrainedEveryShift: boolean;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface StaffingAdequacy {
  homeId: string;
  analysisDate: string;
  windowDays: number;

  // Overview
  overallStatus: "adequate" | "concerns" | "inadequate";
  overallScore: number;        // 0-100

  // Shift-by-shift
  shiftAssessments: ShiftAssessment[];

  // Gaps
  gaps: StaffingGap[];

  // Qualification coverage
  qualificationCoverage: QualificationCoverage[];

  // Alerts
  alerts: StaffingAlert[];

  // Weekly pattern
  weeklyPattern: DayPattern[];

  // Regulatory status
  regulatoryStatus: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
}

export interface ShiftAssessment {
  date: string;
  shiftType: "day" | "evening" | "night" | "sleep_in";
  required: number;
  assigned: number;
  confirmed: number;
  status: "adequate" | "marginal" | "under_staffed" | "unfilled";
  hasSenior: boolean;
  hasFirstAid: boolean;
  hasMedTrained: boolean;
  issues: string[];
}

export interface StaffingGap {
  date: string;
  shiftType: "day" | "evening" | "night" | "sleep_in";
  gapType: "headcount" | "senior" | "first_aid" | "med_trained" | "driver" | "qualification";
  description: string;
  severity: "critical" | "high" | "medium";
}

export interface QualificationCoverage {
  qualification: string;
  label: string;
  totalStaffWithQual: number;
  shiftsWithoutCoverage: number;
  coveragePercent: number;
}

export interface StaffingAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: "headcount" | "qualification" | "confirmation" | "pattern" | "lone_working";
  date?: string;
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

export interface DayPattern {
  dayOfWeek: string;
  averageStaff: number;
  shortfallCount: number;
  status: "adequate" | "concerns" | "inadequate";
}

// ── Constants ────────────────────────────────────────────────────────────────

const QUAL_LABELS: Record<string, string> = {
  L3: "Level 3 Diploma",
  L5: "Level 5 Diploma",
  first_aid: "First Aid",
  med_trained: "Medication Trained",
  safeguarding_lead: "Safeguarding Lead",
  driver: "Driver",
  fire_marshal: "Fire Marshal",
  restraint: "Physical Intervention",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseStaffingAdequacy(
  shifts: ShiftSlot[],
  childNeeds: ChildNeed[],
  activities: PlannedActivity[],
  config: HomeConfig,
  windowDays: number = 7,
): StaffingAdequacy {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: StaffingAlert[] = [];
  const gaps: StaffingGap[] = [];

  // Group shifts by date + type
  const shiftGroups = new Map<string, ShiftSlot[]>();
  for (const shift of shifts) {
    const key = `${shift.date}|${shift.shiftType}`;
    if (!shiftGroups.has(key)) shiftGroups.set(key, []);
    shiftGroups.get(key)!.push(shift);
  }

  // Assess each shift group
  const shiftAssessments: ShiftAssessment[] = [];
  for (const [key, slotGroup] of shiftGroups) {
    const [date, shiftType] = key.split("|") as [string, ShiftSlot["shiftType"]];
    const assessment = assessShift(slotGroup, date, shiftType, config, childNeeds);
    shiftAssessments.push(assessment);

    // Generate gaps
    if (assessment.status === "under_staffed" || assessment.status === "unfilled") {
      gaps.push({
        date,
        shiftType,
        gapType: "headcount",
        description: `${assessment.required - assessment.assigned} staff short on ${date} ${shiftType}`,
        severity: assessment.status === "unfilled" ? "critical" : "high",
      });
    }
    if (!assessment.hasSenior && config.requiresSeniorEveryShift) {
      gaps.push({
        date,
        shiftType,
        gapType: "senior",
        description: `No senior on ${date} ${shiftType} shift`,
        severity: "high",
      });
    }
    if (!assessment.hasFirstAid && config.requiresFirstAidEveryShift) {
      gaps.push({
        date,
        shiftType,
        gapType: "first_aid",
        description: `No first aider on ${date} ${shiftType} shift`,
        severity: "medium",
      });
    }
    if (!assessment.hasMedTrained && config.requiresMedTrainedEveryShift) {
      gaps.push({
        date,
        shiftType,
        gapType: "med_trained",
        description: `No medication-trained staff on ${date} ${shiftType} shift`,
        severity: "critical",
      });
    }
  }

  // Check activities for staff coverage
  for (const activity of activities) {
    const dayShifts = shifts.filter((s) => s.date === activity.date && (s.shiftType === "day" || s.shiftType === "evening"));
    if (dayShifts.length < activity.staffRequired) {
      gaps.push({
        date: activity.date,
        shiftType: "day",
        gapType: "headcount",
        description: `Activity "${activity.description}" needs ${activity.staffRequired} staff, ${dayShifts.length} available`,
        severity: "medium",
      });
    }
    if (activity.requiresDriver) {
      const hasDriver = dayShifts.some((s) => s.qualifications.includes("driver"));
      if (!hasDriver) {
        gaps.push({
          date: activity.date,
          shiftType: "day",
          gapType: "driver",
          description: `No driver available for "${activity.description}" on ${activity.date}`,
          severity: "medium",
        });
      }
    }
  }

  // Qualification coverage analysis
  const qualKeys = ["first_aid", "med_trained", "L3", "safeguarding_lead", "driver", "fire_marshal"];
  const qualificationCoverage: QualificationCoverage[] = qualKeys.map((qual) => {
    const staffWithQual = [...new Set(shifts.filter((s) => s.qualifications.includes(qual)).map((s) => s.staffId))].length;
    const totalShiftGroups = shiftGroups.size;
    let shiftsWithout = 0;
    for (const [, group] of shiftGroups) {
      if (!group.some((s) => s.qualifications.includes(qual))) {
        shiftsWithout++;
      }
    }
    return {
      qualification: qual,
      label: QUAL_LABELS[qual] ?? qual,
      totalStaffWithQual: staffWithQual,
      shiftsWithoutCoverage: shiftsWithout,
      coveragePercent: totalShiftGroups > 0 ? Math.round(((totalShiftGroups - shiftsWithout) / totalShiftGroups) * 100) : 100,
    };
  });

  // Generate alerts
  // Unfilled shifts
  const unfilled = shiftAssessments.filter((a) => a.status === "unfilled");
  if (unfilled.length > 0) {
    alerts.push({
      severity: "critical",
      category: "headcount",
      title: `${unfilled.length} shift${unfilled.length > 1 ? "s" : ""} with no staff assigned`,
      description: `${unfilled.length} upcoming shift(s) have zero staff — children cannot be left unsupervised.`,
      action: "Fill immediately via agency or bank staff. Escalate to RM if unable to cover.",
      regulation: "CHR 2015 Reg 22 / Statement of Purpose",
    });
  }

  // Under-staffed shifts
  const underStaffed = shiftAssessments.filter((a) => a.status === "under_staffed");
  if (underStaffed.length > 0) {
    alerts.push({
      severity: "high",
      category: "headcount",
      title: `${underStaffed.length} under-staffed shift${underStaffed.length > 1 ? "s" : ""}`,
      description: `Staffing below minimum for ${underStaffed.length} shift(s) in the next ${windowDays} days.`,
      action: "Review rota urgently. Consider adjusting activities or calling in additional staff.",
      regulation: "CHR 2015 Reg 22",
    });
  }

  // Unconfirmed shifts
  const unconfirmed = shifts.filter((s) => !s.confirmed);
  if (unconfirmed.length > 3) {
    alerts.push({
      severity: "medium",
      category: "confirmation",
      title: `${unconfirmed.length} unconfirmed shift slots`,
      description: `${unconfirmed.length} staff have not confirmed their shift attendance.`,
      action: "Chase confirmations. Have contingency for non-attendance.",
    });
  }

  // Lone working detection
  const loneShifts = shiftAssessments.filter((a) => a.assigned === 1 && a.shiftType !== "sleep_in");
  if (loneShifts.length > 0) {
    alerts.push({
      severity: "high",
      category: "lone_working",
      title: `Lone working detected — ${loneShifts.length} shift${loneShifts.length > 1 ? "s" : ""}`,
      description: `${loneShifts.length} shift(s) have only one staff member with children present.`,
      action: "Review risk assessment. Lone working with children is high risk — add staff or implement mitigations.",
      regulation: "CHR 2015 Reg 22 / Lone Working Policy",
    });
  }

  // Child-specific staffing needs
  const highNeedChildren = childNeeds.filter((c) => c.currentlyPlaced && (c.staffingRatio === "1:1" || c.staffingRatio === "2:1"));
  if (highNeedChildren.length > 0) {
    const totalNeeded = highNeedChildren.reduce((sum, c) => sum + (c.staffingRatio === "2:1" ? 2 : 1), 0);
    const avgDay = shiftAssessments
      .filter((a) => a.shiftType === "day")
      .reduce((sum, a) => sum + a.assigned, 0) / Math.max(1, shiftAssessments.filter((a) => a.shiftType === "day").length);

    if (avgDay < config.minimumDayStaff + totalNeeded) {
      alerts.push({
        severity: "high",
        category: "headcount",
        title: "Staffing may not meet individual child needs",
        description: `${highNeedChildren.length} child(ren) require enhanced ratios (${totalNeeded} additional staff). Average day staffing: ${Math.round(avgDay)}.`,
        action: "Review against each child's care plan ratio requirements.",
        regulation: "CHR 2015 Reg 22 / Individual Care Plans",
      });
    }
  }

  // Weekly pattern analysis
  const dayBuckets = new Map<number, { total: number; count: number; shortfalls: number }>();
  for (const assessment of shiftAssessments) {
    const dow = new Date(assessment.date).getDay();
    if (!dayBuckets.has(dow)) dayBuckets.set(dow, { total: 0, count: 0, shortfalls: 0 });
    const bucket = dayBuckets.get(dow)!;
    bucket.total += assessment.assigned;
    bucket.count++;
    if (assessment.status === "under_staffed" || assessment.status === "unfilled") {
      bucket.shortfalls++;
    }
  }

  const weeklyPattern: DayPattern[] = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([dow, bucket]) => ({
      dayOfWeek: DAY_NAMES[dow],
      averageStaff: bucket.count > 0 ? Math.round((bucket.total / bucket.count) * 10) / 10 : 0,
      shortfallCount: bucket.shortfalls,
      status: bucket.shortfalls === 0 ? "adequate" as const : bucket.shortfalls > 1 ? "inadequate" as const : "concerns" as const,
    }));

  // Overall score
  const totalAssessments = shiftAssessments.length;
  const adequateCount = shiftAssessments.filter((a) => a.status === "adequate").length;
  const marginalCount = shiftAssessments.filter((a) => a.status === "marginal").length;

  const overallScore = totalAssessments > 0
    ? Math.round(((adequateCount * 100 + marginalCount * 60) / (totalAssessments * 100)) * 100)
    : 100;

  let overallStatus: "adequate" | "concerns" | "inadequate";
  if (overallScore >= 80 && unfilled.length === 0) overallStatus = "adequate";
  else if (overallScore >= 50) overallStatus = "concerns";
  else overallStatus = "inadequate";

  // Regulatory status
  const issues: string[] = [];
  const strengths: string[] = [];

  if (unfilled.length > 0) issues.push(`${unfilled.length} unfilled shift(s)`);
  if (underStaffed.length > 0) issues.push(`${underStaffed.length} under-staffed shift(s)`);
  if (loneShifts.length > 0) issues.push("Lone working risk identified");
  const medCoverage = qualificationCoverage.find((q) => q.qualification === "med_trained");
  if (medCoverage && medCoverage.coveragePercent < 100) issues.push("Medication-trained staff not on every shift");

  if (overallScore >= 90) strengths.push("Strong staffing levels across the week");
  if (qualificationCoverage.every((q) => q.coveragePercent === 100)) strengths.push("Full qualification coverage on all shifts");
  if (unconfirmed.length === 0) strengths.push("All shifts confirmed");
  if (loneShifts.length === 0 && totalAssessments > 0) strengths.push("No lone working identified");

  return {
    homeId: config.homeId,
    analysisDate: today,
    windowDays,
    overallStatus,
    overallScore,
    shiftAssessments: shiftAssessments.sort((a, b) => a.date.localeCompare(b.date)),
    gaps: gaps.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    qualificationCoverage,
    alerts: alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    weeklyPattern,
    regulatoryStatus: {
      compliant: issues.length === 0,
      issues,
      strengths,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function assessShift(
  slots: ShiftSlot[],
  date: string,
  shiftType: ShiftSlot["shiftType"],
  config: HomeConfig,
  _childNeeds: ChildNeed[],
): ShiftAssessment {
  const assigned = slots.filter((s) => s.staffId).length;
  const confirmed = slots.filter((s) => s.confirmed).length;
  const allQuals = slots.flatMap((s) => s.qualifications);

  const required = getMinimumForShift(shiftType, config);

  let status: ShiftAssessment["status"];
  if (assigned === 0) status = "unfilled";
  else if (assigned < required) status = "under_staffed";
  else if (assigned === required) status = "marginal";
  else status = "adequate";

  const hasSenior = slots.some((s) => s.role === "senior");
  const hasFirstAid = allQuals.includes("first_aid");
  const hasMedTrained = allQuals.includes("med_trained");

  const issues: string[] = [];
  if (assigned < required) issues.push(`${required - assigned} staff short`);
  if (!hasSenior && config.requiresSeniorEveryShift) issues.push("No senior");
  if (!hasFirstAid && config.requiresFirstAidEveryShift) issues.push("No first aider");
  if (!hasMedTrained && config.requiresMedTrainedEveryShift) issues.push("No med-trained staff");
  if (assigned === 1 && shiftType !== "sleep_in") issues.push("Lone working");

  return {
    date,
    shiftType,
    required,
    assigned,
    confirmed,
    status,
    hasSenior,
    hasFirstAid,
    hasMedTrained,
    issues,
  };
}

function getMinimumForShift(shiftType: ShiftSlot["shiftType"], config: HomeConfig): number {
  switch (shiftType) {
    case "day": return config.minimumDayStaff;
    case "evening": return config.minimumEveningStaff;
    case "night": return config.minimumNightStaff;
    case "sleep_in": return 1;
  }
}

function severityOrder(s: "critical" | "high" | "medium" | "advisory"): number {
  switch (s) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "advisory": return 3;
    default: return 4;
  }
}
