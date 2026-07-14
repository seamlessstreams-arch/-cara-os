// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS ↔ INCIDENT CORRELATION INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// A CROSS-DATASET early-warning engine. Existing engines analyse complaint
// HANDLING quality and incident PATTERNS separately. This one correlates the
// two per child to answer a question neither can on its own:
//
//   "Were a child's complaints an early warning that we failed to act on
//    before things escalated into incidents?"
//
// For each child it compares complaints and incidents across a recent window
// (0–30d) and the preceding window (30–60d) and classifies the relationship:
//   • leading_indicator — complaints came first, incidents escalated after
//   • convergent        — complaints and incidents elevated together
//   • emerging_watch    — complaints rising now, no incidents yet (act early)
//   • incidents_only    — incidents but no complaints (is the child being heard?)
//   • complaints_only   — complaints handled, no incident escalation (healthy)
//
// This is a children's-voice + protection lens: listening to children early is
// both safer and the mark of a good home.
//
// Regulatory: CHR 2015 Reg 22 (complaints), Reg 12 (protection), Reg 7
// (children's wishes & feelings), Reg 34 (notifications). SCCIF: "How well
// children are helped and protected" and "the voice of the child".
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface ChildRef {
  id: string;
  name: string;
}

export interface ComplaintCorrInput {
  child_id: string;
  date: string;                 // ISO date received
  category: string;
  includes_safeguarding_element: boolean;
  status: string;               // open/escalated detection
}

export interface IncidentCorrInput {
  child_id: string;
  date: string;                 // ISO date of occurrence
  type: string;
  severity: IncidentSeverity;
}

export interface ComplaintsIncidentInput {
  children: ChildRef[];
  complaints: ComplaintCorrInput[];
  incidents: IncidentCorrInput[];
  today?: string;               // ISO date — injectable for deterministic tests
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type CorrelationType =
  | "leading_indicator"
  | "convergent"
  | "emerging_watch"
  | "incidents_only"
  | "complaints_only"
  | "none";

export interface RecommendedAction {
  priority: "urgent" | "high" | "routine";
  action: string;
  regulatory_link: string;
}

export interface ChildCorrelation {
  child_id: string;
  child_name: string;
  complaints_recent: number;
  complaints_prior: number;
  complaints_90: number;
  incidents_recent: number;
  incidents_prior: number;
  incidents_90: number;
  correlation_type: CorrelationType;
  correlation_score: number;     // 0-100
  safeguarding_overlap: boolean;
  signals: string[];
  recommended_actions: RecommendedAction[];
}

export interface CorrelationOverview {
  children_analysed: number;
  leading_indicator_count: number;
  convergent_count: number;
  emerging_watch_count: number;
  incidents_only_count: number;
  complaints_only_count: number;
  total_complaints_90: number;
  total_incidents_90: number;
  strongest_signal_child: string | null;
}

export interface CorrelationAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
}

export interface CaraCorrelationInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ComplaintsIncidentCorrelationResult {
  overview: CorrelationOverview;
  child_correlations: ChildCorrelation[];
  alerts: CorrelationAlert[];
  insights: CaraCorrelationInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const RECENT_WINDOW_DAYS = 30;
export const PRIOR_WINDOW_DAYS = 60;
export const ANALYSIS_WINDOW_DAYS = 90;

export const SEVERITY_WEIGHT: Record<IncidentSeverity, number> = {
  low: 2, medium: 4, high: 7, critical: 10,
};

const SAFEGUARDING_INCIDENT = /safeguard|abuse|exploit|cse|missing|self.?harm/i;

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysAgo(date: string, today: string): number {
  const ms = new Date(today).getTime() - new Date(date).getTime();
  return Math.floor(ms / 86_400_000);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function countIn<T>(rows: T[], dateOf: (r: T) => string, today: string, min: number, max: number): number {
  return rows.filter((r) => {
    const d = daysAgo(dateOf(r), today);
    return d >= min && d < max;
  }).length;
}

export function classify(
  cRecent: number, cPrior: number, c90: number,
  iRecent: number, iPrior: number, i90: number,
): CorrelationType {
  if (cPrior >= 1 && iRecent >= 1 && iRecent > iPrior) return "leading_indicator";
  if (c90 >= 1 && i90 >= 1) return "convergent";
  if (cRecent >= 1 && i90 === 0) return "emerging_watch";
  if (c90 >= 1 && i90 === 0) return "complaints_only";
  if (i90 >= 1 && c90 === 0) return "incidents_only";
  return "none";
}

const TYPE_BONUS: Record<CorrelationType, number> = {
  leading_indicator: 25,
  convergent: 15,
  emerging_watch: 10,
  incidents_only: 8,
  complaints_only: 3,
  none: 0,
};

// ── Main Computation ────────────────────────────────────────────────────────

export function computeComplaintsIncidentCorrelation(
  input: ComplaintsIncidentInput,
): ComplaintsIncidentCorrelationResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const nameById = new Map(input.children.map((c) => [c.id, c.name]));

  // Every child appearing in complaints or incidents within the analysis window.
  const subjectIds = new Set<string>();
  for (const c of input.complaints) {
    if (daysAgo(c.date, today) < ANALYSIS_WINDOW_DAYS && daysAgo(c.date, today) >= 0) subjectIds.add(c.child_id);
  }
  for (const i of input.incidents) {
    if (daysAgo(i.date, today) < ANALYSIS_WINDOW_DAYS && daysAgo(i.date, today) >= 0) subjectIds.add(i.child_id);
  }

  const child_correlations: ChildCorrelation[] = [];

  for (const childId of subjectIds) {
    if (!childId) continue;
    const cs = input.complaints.filter((c) => c.child_id === childId);
    const is = input.incidents.filter((i) => i.child_id === childId);

    const cRecent = countIn(cs, (c) => c.date, today, 0, RECENT_WINDOW_DAYS);
    const cPrior = countIn(cs, (c) => c.date, today, RECENT_WINDOW_DAYS, PRIOR_WINDOW_DAYS);
    const c90 = countIn(cs, (c) => c.date, today, 0, ANALYSIS_WINDOW_DAYS);
    const iRecent = countIn(is, (i) => i.date, today, 0, RECENT_WINDOW_DAYS);
    const iPrior = countIn(is, (i) => i.date, today, RECENT_WINDOW_DAYS, PRIOR_WINDOW_DAYS);
    const i90 = countIn(is, (i) => i.date, today, 0, ANALYSIS_WINDOW_DAYS);

    const correlation_type = classify(cRecent, cPrior, c90, iRecent, iPrior, i90);
    if (correlation_type === "none") continue;

    // Safeguarding overlap: a safeguarding complaint AND a safeguarding/critical incident.
    const sgComplaint = cs.some(
      (c) => c.includes_safeguarding_element && daysAgo(c.date, today) >= 0 && daysAgo(c.date, today) < ANALYSIS_WINDOW_DAYS,
    );
    const sgIncident = is.some(
      (i) =>
        daysAgo(i.date, today) >= 0 && daysAgo(i.date, today) < ANALYSIS_WINDOW_DAYS &&
        (SAFEGUARDING_INCIDENT.test(i.type) || i.severity === "critical"),
    );
    const safeguarding_overlap = sgComplaint && sgIncident;

    // Score.
    const incidentPoints = Math.min(
      is
        .filter((i) => daysAgo(i.date, today) >= 0 && daysAgo(i.date, today) < ANALYSIS_WINDOW_DAYS)
        .reduce((s, i) => s + (SEVERITY_WEIGHT[i.severity] ?? 0), 0),
      40,
    );
    const sgComplaints90 = cs.filter(
      (c) => c.includes_safeguarding_element && daysAgo(c.date, today) >= 0 && daysAgo(c.date, today) < ANALYSIS_WINDOW_DAYS,
    ).length;
    const complaintPoints = Math.min(c90 * 5, 20) + (sgComplaints90 > 0 ? 5 : 0);
    const correlation_score = Math.round(
      clamp(incidentPoints + complaintPoints + TYPE_BONUS[correlation_type] + (safeguarding_overlap ? 10 : 0), 0, 100),
    );

    // Signals (explainable).
    const signals: string[] = [];
    if (correlation_type === "leading_indicator") {
      signals.push(
        `${cPrior} complaint${cPrior === 1 ? "" : "s"} in the prior 30–60 days preceded ${iRecent} incident${iRecent === 1 ? "" : "s"} in the last 30 days (vs ${iPrior} before)`,
      );
    }
    if (correlation_type === "convergent") {
      signals.push(`${c90} complaint${c90 === 1 ? "" : "s"} and ${i90} incident${i90 === 1 ? "" : "s"} recorded together over 90 days`);
    }
    if (correlation_type === "emerging_watch") {
      signals.push(`${cRecent} complaint${cRecent === 1 ? "" : "s"} in the last 30 days with no incidents yet — a possible early warning`);
    }
    if (correlation_type === "incidents_only") {
      signals.push(`${i90} incident${i90 === 1 ? "" : "s"} over 90 days but no complaints logged — check the child feels able to raise concerns`);
    }
    if (correlation_type === "complaints_only") {
      signals.push(`${c90} complaint${c90 === 1 ? "" : "s"} handled with no incident escalation`);
    }
    if (safeguarding_overlap) {
      signals.push("A safeguarding complaint coincides with a safeguarding or critical incident");
    }

    child_correlations.push({
      child_id: childId,
      child_name: nameById.get(childId) ?? childId,
      complaints_recent: cRecent,
      complaints_prior: cPrior,
      complaints_90: c90,
      incidents_recent: iRecent,
      incidents_prior: iPrior,
      incidents_90: i90,
      correlation_type,
      correlation_score,
      safeguarding_overlap,
      signals,
      recommended_actions: buildActions(correlation_type, safeguarding_overlap),
    });
  }

  child_correlations.sort((a, b) => b.correlation_score - a.correlation_score);

  const overview = buildOverview(child_correlations, input, today);
  const alerts = buildAlerts(child_correlations);
  const insights = buildInsights(child_correlations);

  return { overview, child_correlations, alerts, insights };
}

// ── Action builder ────────────────────────────────────────────────────────

function buildActions(type: CorrelationType, sgOverlap: boolean): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  switch (type) {
    case "leading_indicator":
      actions.push({
        priority: sgOverlap ? "urgent" : "high",
        action: "Treat the earlier complaints as a missed early warning — review what could have de-escalated, and feed the learning into the child's risk assessment and care plan",
        regulatory_link: "Reg 22 (complaints) + Reg 12 (protection); SCCIF — the voice of the child",
      });
      if (sgOverlap) {
        actions.push({
          priority: "urgent",
          action: "Convene a multi-agency review — a safeguarding complaint preceded a safeguarding incident; ensure notifications (Reg 34) are complete",
          regulatory_link: "Reg 34 — notification of significant events",
        });
      }
      break;
    case "convergent":
      actions.push({
        priority: "high",
        action: "Review the complaint(s) and incident(s) together for a common root cause rather than in separate processes",
        regulatory_link: "Reg 22 (complaints) + Reg 13 (leadership — learning)",
      });
      break;
    case "emerging_watch":
      actions.push({
        priority: "high",
        action: "Act on the current complaints now as a potential early warning — agree preventive support before any escalation",
        regulatory_link: "Reg 22 (complaints) + Reg 7 (wishes & feelings)",
      });
      break;
    case "incidents_only":
      actions.push({
        priority: "routine",
        action: "No complaints are logged despite incidents — check the child knows how to complain, has advocacy access, and feels safe to raise concerns",
        regulatory_link: "Reg 7 (wishes & feelings) + Reg 22 (access to complaints/advocacy)",
      });
      break;
    case "complaints_only":
      actions.push({
        priority: "routine",
        action: "Continue current handling; record the resolution as evidence the complaints process is working",
        regulatory_link: "Reg 22 — complaints",
      });
      break;
    default:
      break;
  }
  return actions;
}

// ── Overview builder ────────────────────────────────────────────────────────

function buildOverview(
  rows: ChildCorrelation[],
  input: ComplaintsIncidentInput,
  today: string,
): CorrelationOverview {
  const total_complaints_90 = input.complaints.filter(
    (c) => daysAgo(c.date, today) >= 0 && daysAgo(c.date, today) < ANALYSIS_WINDOW_DAYS,
  ).length;
  const total_incidents_90 = input.incidents.filter(
    (i) => daysAgo(i.date, today) >= 0 && daysAgo(i.date, today) < ANALYSIS_WINDOW_DAYS,
  ).length;
  const strongest = rows.find((r) => r.correlation_score > 0) ?? null;

  return {
    children_analysed: rows.length,
    leading_indicator_count: rows.filter((r) => r.correlation_type === "leading_indicator").length,
    convergent_count: rows.filter((r) => r.correlation_type === "convergent").length,
    emerging_watch_count: rows.filter((r) => r.correlation_type === "emerging_watch").length,
    incidents_only_count: rows.filter((r) => r.correlation_type === "incidents_only").length,
    complaints_only_count: rows.filter((r) => r.correlation_type === "complaints_only").length,
    total_complaints_90,
    total_incidents_90,
    strongest_signal_child: strongest ? strongest.child_name : null,
  };
}

// ── Alerts builder ────────────────────────────────────────────────────────

function buildAlerts(rows: ChildCorrelation[]): CorrelationAlert[] {
  const alerts: CorrelationAlert[] = [];

  for (const r of rows) {
    if (r.correlation_type === "leading_indicator" && r.safeguarding_overlap) {
      alerts.push({
        severity: "critical",
        child_id: r.child_id,
        message: `${r.child_name}: a safeguarding complaint preceded a safeguarding/critical incident — complaints were an early warning that needed acting on sooner`,
      });
    } else if (r.correlation_type === "leading_indicator") {
      alerts.push({
        severity: "critical",
        child_id: r.child_id,
        message: `${r.child_name}: ${r.complaints_prior} earlier complaint${r.complaints_prior === 1 ? "" : "s"} preceded an escalation to ${r.incidents_recent} incident${r.incidents_recent === 1 ? "" : "s"} — review as a missed early warning`,
      });
    }
  }

  for (const r of rows) {
    if (r.correlation_type === "convergent" && r.correlation_score >= 50) {
      alerts.push({
        severity: "high",
        child_id: r.child_id,
        message: `${r.child_name}: complaints and incidents are elevated together (score ${r.correlation_score}) — investigate for a common cause`,
      });
    }
  }

  for (const r of rows) {
    if (r.correlation_type === "incidents_only" && r.incidents_90 >= 2) {
      alerts.push({
        severity: "medium",
        child_id: r.child_id,
        message: `${r.child_name}: ${r.incidents_90} incidents but no complaints logged — confirm the child feels able to raise concerns`,
      });
    } else if (r.correlation_type === "emerging_watch") {
      alerts.push({
        severity: "medium",
        child_id: r.child_id,
        message: `${r.child_name}: complaints rising with no incidents yet — act early to prevent escalation`,
      });
    }
  }

  return alerts;
}

// ── Cara insights builder ───────────────────────────────────────────────────

function buildInsights(rows: ChildCorrelation[]): CaraCorrelationInsight[] {
  const insights: CaraCorrelationInsight[] = [];

  const leading = rows.filter((r) => r.correlation_type === "leading_indicator");
  if (leading.length > 0) {
    const names = leading.slice(0, 3).map((r) => r.child_name).join(", ");
    insights.push({
      severity: "critical",
      text: `For ${leading.length} child${leading.length === 1 ? "" : "ren"} (${names}), complaints preceded an escalation into incidents. When a child complains and things then get worse, the complaint was an early warning. Ofsted weigh heavily whether a home listens to children and acts before harm — review these as missed opportunities and evidence the changes made.`,
    });
  }

  const convergent = rows.filter((r) => r.correlation_type === "convergent");
  const emerging = rows.filter((r) => r.correlation_type === "emerging_watch");
  if (convergent.length > 0 || emerging.length > 0) {
    insights.push({
      severity: "warning",
      text: `For ${convergent.length} child${convergent.length === 1 ? "" : "ren"}, complaints and incidents are rising together; ${emerging.length} show early-warning complaints with no incidents yet. Investigate complaints and incidents for the same child as one picture, not two separate processes.`,
    });
  }

  const incidentsOnly = rows.filter((r) => r.correlation_type === "incidents_only");
  if (incidentsOnly.length > 0) {
    const names = incidentsOnly.slice(0, 3).map((r) => r.child_name).join(", ");
    insights.push({
      severity: "warning",
      text: `${incidentsOnly.length} child${incidentsOnly.length === 1 ? "" : "ren"} (${names}) had incidents but logged no complaints. Absence of complaints is not always good news — check they know how to complain, have advocacy access, and feel safe to speak up.`,
    });
  }

  if (rows.length > 0 && leading.length === 0 && convergent.length === 0 && incidentsOnly.length === 0) {
    insights.push({
      severity: "positive",
      text: `Children are using the complaints process and issues are being resolved before they escalate into incidents — a strong sign that the home listens and acts on the voice of the child.`,
    });
  }

  return insights;
}
