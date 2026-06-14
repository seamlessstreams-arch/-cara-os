// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS & NOTIFICATIONS INTELLIGENCE ENGINE
// Pure deterministic engine for complaints handling analysis.
// Analyses response times, satisfaction, theme patterns, Reg 40 notification
// compliance, and generates Cara intelligence insights.
// Reg 39: complaints procedure — Reg 40: notification of significant events
// ══════════════════════════════════════════════════════════════════════════════

export interface ComplaintInput {
  id: string;
  complaint_date: string;
  complainant: string;
  source: string;
  theme: string;
  outcome: string;
  investigated_by: string;
  date_resolved: string | null;
  response_time_days: number;
  child_id: string | null;
  summary: string;
  lessons_learned: string;
  practice_changes: string[];
  complainant_satisfied: boolean | null;
  escalated: boolean;
  ofsted_notified: boolean;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface ComplaintsOverview {
  total_complaints: number;
  open_count: number;
  resolved_count: number;
  upheld_rate: number;
  avg_response_days: number;
  satisfaction_rate: number;
  escalated_count: number;
  ofsted_notified_count: number;
  child_complaints: number;
  lessons_recorded_rate: number;
}

export interface OpenComplaint {
  complaint_id: string;
  complainant: string;
  source: string;
  theme: string;
  days_open: number;
  summary: string;
}

export interface ThemeBreakdown {
  theme: string;
  theme_label: string;
  count: number;
  percentage: number;
}

export interface SourceBreakdown {
  source: string;
  source_label: string;
  count: number;
  percentage: number;
}

export interface ComplaintsAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraComplaintsInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ComplaintsIntelligenceResult {
  overview: ComplaintsOverview;
  open_complaints: OpenComplaint[];
  theme_breakdown: ThemeBreakdown[];
  source_breakdown: SourceBreakdown[];
  alerts: ComplaintsAlert[];
  insights: CaraComplaintsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const THEME_LABELS: Record<string, string> = {
  care_quality: "Care Quality",
  staff_conduct: "Staff Conduct",
  environment: "Environment",
  food: "Food",
  activities: "Activities",
  communication: "Communication",
  privacy: "Privacy",
  medication: "Medication",
  other: "Other",
};

const SOURCE_LABELS: Record<string, string> = {
  child: "Young Person",
  parent_carer: "Parent / Carer",
  social_worker: "Social Worker",
  professional: "Professional",
  staff: "Staff",
  anonymous: "Anonymous",
};

function themeLabel(theme: string): string {
  return THEME_LABELS[theme] ?? theme.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeComplaintsIntelligence(input: {
  complaints: ComplaintInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}): ComplaintsIntelligenceResult {
  const { complaints, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (complaints.length === 0) {
    return {
      overview: {
        total_complaints: 0,
        open_count: 0,
        resolved_count: 0,
        upheld_rate: 0,
        avg_response_days: 0,
        satisfaction_rate: 0,
        escalated_count: 0,
        ofsted_notified_count: 0,
        child_complaints: 0,
        lessons_recorded_rate: 0,
      },
      open_complaints: [],
      theme_breakdown: [],
      source_breakdown: [],
      alerts: [],
      insights: [],
    };
  }

  const ongoing = complaints.filter((c) => c.outcome === "ongoing");
  const resolved = complaints.filter((c) => c.outcome !== "ongoing" && c.outcome !== "withdrawn");

  // ── Overview ────────────────────────────────────────────────────────────
  const upheldCount = resolved.filter((c) => c.outcome === "upheld" || c.outcome === "partially_upheld").length;
  const upheldRate = resolved.length > 0 ? Math.round((upheldCount / resolved.length) * 100) : 0;

  const resolvedWithTime = resolved.filter((c) => c.response_time_days > 0);
  const avgResponseDays = resolvedWithTime.length > 0
    ? Math.round(resolvedWithTime.reduce((sum, c) => sum + c.response_time_days, 0) / resolvedWithTime.length)
    : 0;

  const satisfiedCount = complaints.filter((c) => c.complainant_satisfied === true).length;
  const dissatisfiedCount = complaints.filter((c) => c.complainant_satisfied === false).length;
  const totalWithSatisfaction = satisfiedCount + dissatisfiedCount;
  const satisfactionRate = totalWithSatisfaction > 0
    ? Math.round((satisfiedCount / totalWithSatisfaction) * 100)
    : 0;

  const escalatedCount = complaints.filter((c) => c.escalated).length;
  const ofstedNotifiedCount = complaints.filter((c) => c.ofsted_notified).length;
  const childComplaints = complaints.filter((c) => c.source === "child").length;

  const lessonsRecorded = complaints.filter((c) => c.lessons_learned.trim().length > 0).length;
  const lessonsRecordedRate = Math.round((lessonsRecorded / complaints.length) * 100);

  const overview: ComplaintsOverview = {
    total_complaints: complaints.length,
    open_count: ongoing.length,
    resolved_count: resolved.length,
    upheld_rate: upheldRate,
    avg_response_days: avgResponseDays,
    satisfaction_rate: satisfactionRate,
    escalated_count: escalatedCount,
    ofsted_notified_count: ofstedNotifiedCount,
    child_complaints: childComplaints,
    lessons_recorded_rate: lessonsRecordedRate,
  };

  // ── Open complaints ────────────────────────────────────────────────────
  const open_complaints: OpenComplaint[] = ongoing
    .map((c) => ({
      complaint_id: c.id,
      complainant: c.complainant,
      source: c.source,
      theme: c.theme,
      days_open: daysBetween(c.complaint_date, today),
      summary: c.summary,
    }))
    .sort((a, b) => b.days_open - a.days_open);

  // ── Theme breakdown ────────────────────────────────────────────────────
  const themeCounts = new Map<string, number>();
  for (const c of complaints) {
    themeCounts.set(c.theme, (themeCounts.get(c.theme) ?? 0) + 1);
  }
  const theme_breakdown: ThemeBreakdown[] = [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => ({
      theme,
      theme_label: themeLabel(theme),
      count,
      percentage: Math.round((count / complaints.length) * 100),
    }));

  // ── Source breakdown ───────────────────────────────────────────────────
  const sourceCounts = new Map<string, number>();
  for (const c of complaints) {
    sourceCounts.set(c.source, (sourceCounts.get(c.source) ?? 0) + 1);
  }
  const source_breakdown: SourceBreakdown[] = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source,
      source_label: sourceLabel(source),
      count,
      percentage: Math.round((count / complaints.length) * 100),
    }));

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: ComplaintsAlert[] = [];

  for (const oc of open_complaints) {
    if (oc.days_open > 28) {
      alerts.push({
        severity: "critical",
        message: `Complaint from ${oc.complainant} has been open ${oc.days_open} days — exceeds 20 working day response deadline`,
      });
    }
  }

  for (const c of resolved) {
    if ((c.outcome === "upheld" || c.outcome === "partially_upheld") && c.lessons_learned.trim().length === 0) {
      alerts.push({
        severity: "high",
        message: `Upheld complaint (${themeLabel(c.theme)}) has no lessons learned recorded`,
      });
    }
  }

  for (const c of ongoing) {
    if (c.escalated) {
      const daysOpen = daysBetween(c.complaint_date, today);
      alerts.push({
        severity: "high",
        message: `Escalated complaint from ${c.complainant} is still ongoing after ${daysOpen} days`,
      });
    }
  }

  for (const c of complaints) {
    if (c.source === "child" && c.outcome !== "ongoing" && c.outcome !== "withdrawn" && c.practice_changes.length === 0) {
      alerts.push({
        severity: "medium",
        message: `Child complaint (${themeLabel(c.theme)}) resolved without practice changes recorded`,
      });
    }
  }

  if (totalWithSatisfaction > 0 && satisfactionRate < 60) {
    alerts.push({
      severity: "medium",
      message: `Complainant satisfaction rate at ${satisfactionRate}% — below 60% threshold`,
    });
  }

  for (const c of complaints) {
    if (c.escalated && !c.ofsted_notified) {
      alerts.push({
        severity: "low",
        message: `Escalated complaint from ${c.complainant} not notified to Ofsted`,
      });
    }
  }

  alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: CaraComplaintsInsight[] = [];

  for (const oc of open_complaints) {
    if (oc.days_open > 28) {
      insights.push({
        severity: "critical",
        text: `Complaint from ${oc.complainant} has exceeded the 20 working day statutory response deadline (${oc.days_open} days open)`,
      });
    }
  }

  if (resolved.length > 0 && upheldRate > 50) {
    insights.push({
      severity: "warning",
      text: `High upheld rate at ${upheldRate}% — review whether systemic issues are being addressed`,
    });
  }

  if (totalWithSatisfaction > 0 && satisfactionRate < 60) {
    insights.push({
      severity: "warning",
      text: `Low complainant satisfaction at ${satisfactionRate}% — consider reviewing complaint response quality`,
    });
  }

  const themeRepeat = theme_breakdown.filter((t) => t.count >= 3);
  for (const t of themeRepeat) {
    insights.push({
      severity: "warning",
      text: `Repeat theme: ${t.theme_label} has ${t.count} complaints — possible systemic concern`,
    });
  }

  const allResolvedWithinDeadline = resolved.length > 0 && resolved.every((c) => c.response_time_days <= 28);
  if (allResolvedWithinDeadline) {
    insights.push({
      severity: "positive",
      text: "All resolved complaints were addressed within the 20 working day deadline",
    });
  }

  if (totalWithSatisfaction > 0 && satisfactionRate >= 75) {
    insights.push({
      severity: "positive",
      text: `Strong complainant satisfaction at ${satisfactionRate}% — above 75% threshold`,
    });
  }

  const allHaveLessons = complaints.length > 0 && complaints.every((c) => c.lessons_learned.trim().length > 0);
  if (allHaveLessons) {
    insights.push({
      severity: "positive",
      text: "All complaints have lessons learned recorded — strong reflective practice",
    });
  }

  const childResolved = complaints.filter((c) => c.source === "child" && c.outcome !== "ongoing" && c.outcome !== "withdrawn");
  if (childResolved.length > 0 && childResolved.every((c) => c.practice_changes.length > 0)) {
    insights.push({
      severity: "positive",
      text: "All resolved child complaints have practice changes recorded — children's voices are driving improvement",
    });
  }

  return {
    overview,
    open_complaints,
    theme_breakdown,
    source_breakdown,
    alerts,
    insights,
  };
}
