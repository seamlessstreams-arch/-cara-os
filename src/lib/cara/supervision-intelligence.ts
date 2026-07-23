// ══════════════════════════════════════════════════════════════════════════════
// Cara — SUPERVISION INTELLIGENCE
//
// Analyses supervision records across staff to identify:
//   - Overdue supervisions (CHR 2015 Reg 33)
//   - Recurring themes across sessions
//   - Staff development patterns
//   - Wellbeing indicators
//   - Action completion rates
//   - Training need clusters
//
// Pure deterministic analysis — no AI calls.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SupervisionRecord {
  id: string;
  staffId: string;
  staffName: string;
  supervisorId: string;
  supervisorName: string;
  date: string;               // YYYY-MM-DD
  type: "formal" | "informal" | "group" | "observation" | "annual_review";
  durationMinutes: number;
  themes: string[];
  actionsAgreed: SupervisionAction[];
  wellbeingScore?: number;    // 1-5
  staffReflection?: string;
  supervisorNotes?: string;
  regulatoryRef?: string;
}

export interface SupervisionAction {
  id: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedDate?: string;
  category: "training" | "practice" | "wellbeing" | "professional_development" | "compliance";
}

export interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  totalSessions: number;
  lastSupervision: string;
  daysSinceLast: number;
  isOverdue: boolean;
  nextDue: string;
  averageWellbeing: number | null;
  wellbeingTrend: "improving" | "stable" | "declining" | "unknown";
  actionCompletionRate: number | null;  // 0-100; null = no actions were agreed to complete
  topThemes: string[];
  overdueActions: number;
}

export interface SupervisionIntelligence {
  homeId: string;
  analysisDate: string;
  totalStaff: number;
  overdueCount: number;
  overdueStaff: StaffSupervisionProfile[];
  upcomingDue: StaffSupervisionProfile[];   // due within 7 days
  teamActionCompletionRate: number | null;
  teamWellbeingAverage: number | null;
  commonThemes: { theme: string; count: number; trend: "increasing" | "stable" | "decreasing" }[];
  trainingNeeds: { area: string; staffCount: number; staffNames: string[] }[];
  wellbeingConcerns: { staffName: string; score: number; trend: string }[];
  strengths: string[];
  concerns: string[];
  regulatoryStatus: {
    reg33Compliant: boolean;
    compliancePercent: number | null;
    detail: string;
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const SUPERVISION_INTERVAL_DAYS = 42; // 6 weeks — CHR 2015 standard
const UPCOMING_WINDOW_DAYS = 7;

const THEME_KEYWORDS: Record<string, string[]> = {
  "Safeguarding": ["safeguarding", "concern", "disclosure", "CP", "child protection"],
  "Behaviour Management": ["behaviour", "de-escalation", "restraint", "BSP", "incident"],
  "Wellbeing": ["wellbeing", "stress", "burnout", "support", "mental health", "workload"],
  "Training": ["training", "course", "CPD", "qualification", "development"],
  "Key Working": ["key work", "key working", "relationship", "attachment"],
  "Recording": ["recording", "documentation", "log", "report", "writing"],
  "Regulation": ["Ofsted", "regulation", "compliance", "standard", "SCCIF"],
  "Team Dynamics": ["team", "colleague", "communication", "handover", "conflict"],
  "Practice": ["practice", "approach", "therapeutic", "PACE", "trauma-informed"],
  "Children's Progress": ["progress", "outcome", "placement", "review", "plan"],
};

// ── Analyser ────────────────────────────────────────────────────────────────

export function analyseSupervisions(
  records: SupervisionRecord[],
  staffList: { id: string; name: string; startDate?: string }[],
  homeId: string = "home_oak"
): SupervisionIntelligence {
  const today = new Date().toISOString().slice(0, 10);
  const profiles = buildProfiles(records, staffList, today);

  const overdueStaff = profiles.filter((p) => p.isOverdue);
  const upcomingDue = profiles.filter((p) => !p.isOverdue && p.daysSinceLast >= SUPERVISION_INTERVAL_DAYS - UPCOMING_WINDOW_DAYS);

  // Team action completion
  const allActions = records.flatMap((r) => r.actionsAgreed);
  const completedActions = allActions.filter((a) => a.completed);
  const teamActionCompletionRate = rateOf(completedActions, allActions);

  // Team wellbeing
  const wellbeingScores = records
    .filter((r) => r.wellbeingScore !== undefined && r.wellbeingScore !== null)
    .map((r) => r.wellbeingScore!);
  const teamWellbeingAverage = wellbeingScores.length > 0
    ? Math.round((wellbeingScores.reduce((s, v) => s + v, 0) / wellbeingScores.length) * 10) / 10
    : null;

  // Common themes
  const commonThemes = extractThemes(records);

  // Training needs
  const trainingNeeds = extractTrainingNeeds(records);

  // Wellbeing concerns
  const wellbeingConcerns = profiles
    .filter((p) => p.averageWellbeing !== null && (p.averageWellbeing! <= 2 || p.wellbeingTrend === "declining"))
    .map((p) => ({
      staffName: p.staffName,
      score: p.averageWellbeing!,
      trend: p.wellbeingTrend,
    }));

  // Generate strengths and concerns
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (meets(teamActionCompletionRate, 80)) strengths.push("Strong action completion rate across the team");
  if (staffList.length > 0 && overdueStaff.length === 0) strengths.push("All supervisions are up to date (Reg 33 compliant)");
  if (teamWellbeingAverage && teamWellbeingAverage >= 4) strengths.push("Team wellbeing scores are positive");
  if (commonThemes.some((t) => t.theme === "Practice" && t.trend === "increasing")) strengths.push("Increasing focus on practice development in supervisions");

  if (overdueStaff.length > 0) concerns.push(`${overdueStaff.length} staff member${overdueStaff.length > 1 ? "s have" : " has"} overdue supervision`);
  if (below(teamActionCompletionRate, 60)) concerns.push("Low action completion rate — follow-through needs addressing");
  if (wellbeingConcerns.length > 0) concerns.push(`${wellbeingConcerns.length} staff member${wellbeingConcerns.length > 1 ? "s" : ""} showing wellbeing concerns`);
  if (staffList.length === 0) concerns.push("No staff on record — supervision compliance cannot be evidenced");

  // Regulatory status
  const compliancePercent = rate(staffList.length - overdueStaff.length, staffList.length);

  return {
    homeId,
    analysisDate: today,
    totalStaff: staffList.length,
    overdueCount: overdueStaff.length,
    overdueStaff,
    upcomingDue,
    teamActionCompletionRate,
    teamWellbeingAverage,
    commonThemes,
    trainingNeeds,
    wellbeingConcerns,
    strengths,
    concerns,
    regulatoryStatus: {
      reg33Compliant: staffList.length > 0 && overdueStaff.length === 0,
      compliancePercent,
      detail: staffList.length === 0
        ? "No staff on record — Reg 33 compliance cannot be evidenced."
        : overdueStaff.length === 0
          ? "All staff have received supervision within the required timeframe."
          : `${overdueStaff.length} of ${staffList.length} staff are overdue. Reg 33 requires regular supervision of all staff.`,
    },
  };
}

// ── Profile Builder ─────────────────────────────────────────────────────────

function buildProfiles(
  records: SupervisionRecord[],
  staffList: { id: string; name: string }[],
  today: string
): StaffSupervisionProfile[] {
  return staffList.map((staff) => {
    const staffRecords = records
      .filter((r) => r.staffId === staff.id)
      .sort((a, b) => b.date.localeCompare(a.date)); // newest first

    const lastSession = staffRecords[0];
    const daysSinceLast = lastSession ? dateDiff(lastSession.date, today) : 999;
    const isOverdue = daysSinceLast > SUPERVISION_INTERVAL_DAYS;
    const nextDue = lastSession
      ? addDays(lastSession.date, SUPERVISION_INTERVAL_DAYS)
      : today; // already overdue if no record

    // Wellbeing trend
    const recentWellbeing = staffRecords
      .filter((r) => r.wellbeingScore !== undefined)
      .slice(0, 3)
      .map((r) => r.wellbeingScore!);
    const averageWellbeing = recentWellbeing.length > 0
      ? Math.round((recentWellbeing.reduce((s, v) => s + v, 0) / recentWellbeing.length) * 10) / 10
      : null;

    let wellbeingTrend: StaffSupervisionProfile["wellbeingTrend"] = "unknown";
    if (recentWellbeing.length >= 2) {
      const latest = recentWellbeing[0];
      const earlier = recentWellbeing[recentWellbeing.length - 1];
      if (latest > earlier + 0.5) wellbeingTrend = "improving";
      else if (latest < earlier - 0.5) wellbeingTrend = "declining";
      else wellbeingTrend = "stable";
    }

    // Action completion
    const allActions = staffRecords.flatMap((r) => r.actionsAgreed);
    const completedActions = allActions.filter((a) => a.completed);
    const actionCompletionRate = rateOf(completedActions, allActions);

    // Top themes
    const themeCounts = new Map<string, number>();
    for (const record of staffRecords) {
      for (const theme of record.themes) {
        themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
      }
    }
    const topThemes = [...themeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    // Overdue actions
    const overdueActions = allActions.filter(
      (a) => !a.completed && a.dueDate < today
    ).length;

    return {
      staffId: staff.id,
      staffName: staff.name,
      totalSessions: staffRecords.length,
      lastSupervision: lastSession?.date ?? "",
      daysSinceLast,
      isOverdue,
      nextDue,
      averageWellbeing,
      wellbeingTrend,
      actionCompletionRate,
      topThemes,
      overdueActions,
    };
  });
}

// ── Theme Extraction ────────────────────────────────────────────────────────

function extractThemes(records: SupervisionRecord[]): SupervisionIntelligence["commonThemes"] {
  const themeCounts = new Map<string, number>();
  const recentThemeCounts = new Map<string, number>();

  const thirtyDaysAgo = addDays(new Date().toISOString().slice(0, 10), -30);

  for (const record of records) {
    for (const theme of record.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
      if (record.date >= thirtyDaysAgo) {
        recentThemeCounts.set(theme, (recentThemeCounts.get(theme) ?? 0) + 1);
      }
    }
  }

  return [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([theme, count]) => {
      const recentCount = recentThemeCounts.get(theme) ?? 0;
      const totalCount = count;
      const expectedRecent = totalCount * 0.5; // If evenly distributed, half would be in last 30 days
      let trend: "increasing" | "stable" | "decreasing";
      if (recentCount > expectedRecent * 1.3) trend = "increasing";
      else if (recentCount < expectedRecent * 0.7) trend = "decreasing";
      else trend = "stable";
      return { theme, count, trend };
    });
}

// ── Training Need Extraction ────────────────────────────────────────────────

function extractTrainingNeeds(records: SupervisionRecord[]): SupervisionIntelligence["trainingNeeds"] {
  const trainingActions = records.flatMap((r) =>
    r.actionsAgreed
      .filter((a) => a.category === "training" && !a.completed)
      .map((a) => ({ staffName: r.staffName, description: a.description }))
  );

  // Group by keyword matching
  const clusters = new Map<string, Set<string>>();
  for (const action of trainingActions) {
    const desc = action.description.toLowerCase();
    for (const [area, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.some((kw) => desc.includes(kw))) {
        if (!clusters.has(area)) clusters.set(area, new Set());
        clusters.get(area)!.add(action.staffName);
      }
    }
  }

  return [...clusters.entries()]
    .filter(([, names]) => names.size >= 1)
    .map(([area, names]) => ({
      area,
      staffCount: names.size,
      staffNames: [...names],
    }))
    .sort((a, b) => b.staffCount - a.staffCount);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function dateDiff(dateA: string, dateB: string): number {
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / 86400000);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
