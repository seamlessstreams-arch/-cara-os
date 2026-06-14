// ══════════════════════════════════════════════════════════════════════════════
// Cara — TRAINING COMPLIANCE TRACKER
//
// Monitors staff training completion, expiry, and gaps:
//   - Mandatory training compliance (safeguarding, first aid, fire)
//   - Qualification progress (L3, L5)
//   - Expiry warnings (e.g., first aid renewal)
//   - Role-specific requirements
//   - Team-wide coverage gaps
//   - Individual development needs
//
// CHR 2015 Reg 33 (Employment of Staff — Fitness)
// CHR 2015 Reg 22 (Employment of Staff)
// SCCIF: Leadership and Management
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface StaffTrainingRecord {
  staffId: string;
  staffName: string;
  role: "registered_manager" | "senior" | "residential" | "bank" | "agency";
  startDate: string;            // Employment start date
  trainings: TrainingEntry[];
  qualifications: QualificationEntry[];
}

export interface TrainingEntry {
  id: string;
  courseId: string;
  courseName: string;
  category: TrainingCategory;
  completedDate?: string;       // null if not completed
  expiryDate?: string;          // null if no expiry
  status: "completed" | "expired" | "booked" | "not_started" | "overdue";
  mandatory: boolean;
  renewalMonths?: number;       // e.g., 12 for annual
}

export type TrainingCategory =
  | "safeguarding"
  | "first_aid"
  | "fire_safety"
  | "medication"
  | "health_safety"
  | "restraint"
  | "mental_health"
  | "equality_diversity"
  | "data_protection"
  | "food_hygiene"
  | "infection_control"
  | "specialist";

export interface QualificationEntry {
  id: string;
  name: string;               // "Level 3 Diploma in Residential Childcare"
  level: "L3" | "L5" | "L7" | "other";
  status: "completed" | "in_progress" | "not_started";
  startDate?: string;
  expectedCompletion?: string;
  progress?: number;          // 0-100
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface TrainingCompliance {
  homeId: string;
  analysisDate: string;

  // Overview
  overallCompliancePercent: number;
  totalStaff: number;
  fullyCompliant: number;
  withGaps: number;
  withExpiredTraining: number;

  // Per-staff
  staffProfiles: StaffTrainingProfile[];

  // Team coverage
  teamCoverage: TeamCoverageItem[];

  // Expiry warnings
  expiryWarnings: ExpiryWarning[];

  // Alerts
  alerts: TrainingAlert[];

  // Qualification overview
  qualificationOverview: QualOverview;

  // Regulatory status
  regulatoryStatus: {
    compliant: boolean;
    issues: string[];
    strengths: string[];
  };
}

export interface StaffTrainingProfile {
  staffId: string;
  staffName: string;
  role: string;
  compliancePercent: number;
  mandatoryComplete: number;
  mandatoryTotal: number;
  expiredCount: number;
  overdueCount: number;
  bookedCount: number;
  gaps: string[];              // Course names they're missing
}

export interface TeamCoverageItem {
  category: TrainingCategory;
  label: string;
  staffWithTraining: number;
  totalStaff: number;
  coveragePercent: number;
  mandatory: boolean;
}

export interface ExpiryWarning {
  staffId: string;
  staffName: string;
  courseName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  severity: "expired" | "imminent" | "upcoming";
}

export interface TrainingAlert {
  severity: "critical" | "high" | "medium" | "advisory";
  category: "expired" | "mandatory" | "coverage" | "qualification" | "induction";
  title: string;
  description: string;
  action: string;
  regulation?: string;
}

export interface QualOverview {
  l3Required: number;
  l3Completed: number;
  l3InProgress: number;
  l5Required: number;
  l5Completed: number;
  l5InProgress: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  safeguarding: "Safeguarding",
  first_aid: "First Aid",
  fire_safety: "Fire Safety",
  medication: "Medication Administration",
  health_safety: "Health & Safety",
  restraint: "Physical Intervention / Restraint",
  mental_health: "Mental Health Awareness",
  equality_diversity: "Equality & Diversity",
  data_protection: "Data Protection / GDPR",
  food_hygiene: "Food Hygiene",
  infection_control: "Infection Control",
  specialist: "Specialist Training",
};

const EXPIRY_IMMINENT_DAYS = 30;
const EXPIRY_UPCOMING_DAYS = 60;
const INDUCTION_WINDOW_DAYS = 90; // Training must be done within 90 days of start

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseTrainingCompliance(
  records: StaffTrainingRecord[],
  homeId: string = "home_oak",
): TrainingCompliance {
  const today = new Date().toISOString().slice(0, 10);
  const alerts: TrainingAlert[] = [];
  const expiryWarnings: ExpiryWarning[] = [];

  // Per-staff analysis
  const staffProfiles: StaffTrainingProfile[] = records.map((staff) => {
    const mandatory = staff.trainings.filter((t) => t.mandatory);
    const mandatoryComplete = mandatory.filter((t) => t.status === "completed").length;
    const expired = staff.trainings.filter((t) => t.status === "expired");
    const overdue = staff.trainings.filter((t) => t.status === "overdue");
    const booked = staff.trainings.filter((t) => t.status === "booked");
    const gaps = mandatory
      .filter((t) => t.status !== "completed")
      .map((t) => t.courseName);

    const compliancePercent = mandatory.length > 0
      ? Math.round((mandatoryComplete / mandatory.length) * 100)
      : 100;

    return {
      staffId: staff.staffId,
      staffName: staff.staffName,
      role: staff.role,
      compliancePercent,
      mandatoryComplete,
      mandatoryTotal: mandatory.length,
      expiredCount: expired.length,
      overdueCount: overdue.length,
      bookedCount: booked.length,
      gaps,
    };
  });

  // Expiry warnings
  for (const staff of records) {
    for (const training of staff.trainings) {
      if (training.expiryDate) {
        const daysUntil = dateDiff(today, training.expiryDate);
        if (daysUntil <= EXPIRY_UPCOMING_DAYS) {
          let severity: ExpiryWarning["severity"];
          if (daysUntil < 0) severity = "expired";
          else if (daysUntil <= EXPIRY_IMMINENT_DAYS) severity = "imminent";
          else severity = "upcoming";

          expiryWarnings.push({
            staffId: staff.staffId,
            staffName: staff.staffName,
            courseName: training.courseName,
            expiryDate: training.expiryDate,
            daysUntilExpiry: daysUntil,
            severity,
          });
        }
      }
    }
  }

  // Team coverage
  const allCategories: TrainingCategory[] = [
    "safeguarding", "first_aid", "fire_safety", "medication",
    "health_safety", "restraint", "mental_health", "equality_diversity",
    "data_protection", "food_hygiene", "infection_control",
  ];
  const teamCoverage: TeamCoverageItem[] = allCategories.map((cat) => {
    const staffWithTraining = records.filter((staff) =>
      staff.trainings.some((t) => t.category === cat && t.status === "completed")
    ).length;
    const isMandatory = records.some((staff) =>
      staff.trainings.some((t) => t.category === cat && t.mandatory)
    );
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      staffWithTraining,
      totalStaff: records.length,
      coveragePercent: records.length > 0 ? Math.round((staffWithTraining / records.length) * 100) : 100,
      mandatory: isMandatory,
    };
  });

  // Qualification overview
  const seniorAndRm = records.filter((s) => s.role === "senior" || s.role === "registered_manager");
  const residential = records.filter((s) => s.role === "residential");
  const qualOverview: QualOverview = {
    l3Required: residential.length + seniorAndRm.length,
    l3Completed: records.filter((s) => s.qualifications.some((q) => q.level === "L3" && q.status === "completed")).length,
    l3InProgress: records.filter((s) => s.qualifications.some((q) => q.level === "L3" && q.status === "in_progress")).length,
    l5Required: seniorAndRm.length,
    l5Completed: records.filter((s) => s.qualifications.some((q) => q.level === "L5" && q.status === "completed")).length,
    l5InProgress: records.filter((s) => s.qualifications.some((q) => q.level === "L5" && q.status === "in_progress")).length,
  };

  // Generate alerts
  // Expired training
  const expiredStaff = staffProfiles.filter((s) => s.expiredCount > 0);
  if (expiredStaff.length > 0) {
    const totalExpired = expiredStaff.reduce((sum, s) => sum + s.expiredCount, 0);
    alerts.push({
      severity: "critical",
      category: "expired",
      title: `${totalExpired} expired training certificate${totalExpired > 1 ? "s" : ""} across ${expiredStaff.length} staff`,
      description: `Staff members are working with expired mandatory training. This affects regulatory compliance.`,
      action: "Book renewal training immediately. Consider whether staff can continue in role until renewed.",
      regulation: "CHR 2015 Reg 33 (Fitness of staff)",
    });
  }

  // Mandatory gaps
  const staffWithGaps = staffProfiles.filter((s) => s.gaps.length > 0);
  if (staffWithGaps.length > 0) {
    alerts.push({
      severity: "high",
      category: "mandatory",
      title: `${staffWithGaps.length} staff with mandatory training gaps`,
      description: `${staffWithGaps.length} staff member(s) have not completed all mandatory training courses.`,
      action: "Prioritise booking mandatory training. New starters have 90 days to complete induction training.",
      regulation: "CHR 2015 Reg 33",
    });
  }

  // Coverage gaps (less than 80% team coverage on mandatory)
  const poorCoverage = teamCoverage.filter((c) => c.mandatory && c.coveragePercent < 80);
  if (poorCoverage.length > 0) {
    alerts.push({
      severity: "medium",
      category: "coverage",
      title: `Low team coverage in ${poorCoverage.length} area${poorCoverage.length > 1 ? "s" : ""}`,
      description: `Fewer than 80% of staff trained in: ${poorCoverage.map((c) => c.label).join(", ")}.`,
      action: "Schedule team training sessions to improve coverage.",
    });
  }

  // Imminent expiries
  const imminentExpiries = expiryWarnings.filter((w) => w.severity === "imminent");
  if (imminentExpiries.length > 0) {
    alerts.push({
      severity: "medium",
      category: "expired",
      title: `${imminentExpiries.length} training certificate${imminentExpiries.length > 1 ? "s" : ""} expiring within 30 days`,
      description: `Upcoming expiries: ${imminentExpiries.map((w) => `${w.staffName} (${w.courseName})`).slice(0, 3).join(", ")}${imminentExpiries.length > 3 ? "..." : ""}.`,
      action: "Book renewal training before expiry to maintain compliance.",
    });
  }

  // Induction check (new starters without completed mandatory)
  const newStarters = records.filter((s) => {
    const daysSinceStart = dateDiff(s.startDate, today);
    return daysSinceStart <= INDUCTION_WINDOW_DAYS && daysSinceStart >= 0;
  });
  const newStartersWithGaps = newStarters.filter((s) => {
    const mandatoryNotDone = s.trainings.filter((t) => t.mandatory && t.status !== "completed");
    return mandatoryNotDone.length > 0;
  });
  if (newStartersWithGaps.length > 0) {
    alerts.push({
      severity: "advisory" as "medium",
      category: "induction",
      title: `${newStartersWithGaps.length} new starter(s) with outstanding induction training`,
      description: `New staff within their 90-day induction window still have mandatory training to complete.`,
      action: "Ensure induction training plan is on track. Monitor weekly.",
    });
  }

  // Overall compliance
  const overallCompliancePercent = staffProfiles.length > 0
    ? Math.round(staffProfiles.reduce((sum, s) => sum + s.compliancePercent, 0) / staffProfiles.length)
    : 100;
  const fullyCompliant = staffProfiles.filter((s) => s.compliancePercent === 100 && s.expiredCount === 0).length;
  const withGaps = staffProfiles.filter((s) => s.gaps.length > 0).length;
  const withExpired = staffProfiles.filter((s) => s.expiredCount > 0).length;

  // Regulatory status
  const issues: string[] = [];
  const strengths: string[] = [];

  if (withExpired > 0) issues.push(`${withExpired} staff with expired training`);
  if (overallCompliancePercent < 90) issues.push(`Team compliance at ${overallCompliancePercent}% (below 90%)`);
  if (poorCoverage.length > 0) issues.push(`Low coverage in ${poorCoverage.length} mandatory area(s)`);

  if (overallCompliancePercent === 100) strengths.push("100% mandatory training compliance across team");
  else if (overallCompliancePercent >= 95) strengths.push("Excellent training compliance (95%+)");
  if (withExpired === 0) strengths.push("No expired training certificates");
  if (qualOverview.l3Completed === qualOverview.l3Required) strengths.push("All staff hold required Level 3 qualification");

  return {
    homeId,
    analysisDate: today,
    overallCompliancePercent,
    totalStaff: records.length,
    fullyCompliant,
    withGaps,
    withExpiredTraining: withExpired,
    staffProfiles: staffProfiles.sort((a, b) => a.compliancePercent - b.compliancePercent),
    teamCoverage: teamCoverage.sort((a, b) => a.coveragePercent - b.coveragePercent),
    expiryWarnings: expiryWarnings.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    alerts: alerts.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    qualificationOverview: qualOverview,
    regulatoryStatus: {
      compliant: issues.length === 0,
      issues,
      strengths,
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function dateDiff(dateA: string, dateB: string): number {
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / 86400000);
}

function severityOrder(s: "critical" | "high" | "medium" | "advisory"): number {
  switch (s) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "advisory": return 3;
  }
}
