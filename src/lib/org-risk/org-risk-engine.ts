// ─────────────────────────────────────────────────────────────────────────────
// Burnout & Organisational Risk Engine
//
// Staff pressure, inconsistent staffing and weak oversight can become safeguarding
// risks for children. This engine is a PURE PROJECTION over existing workforce and
// safeguarding data (staffing mix, sickness, supervision, training, incidents,
// missing episodes, complaints). It scores organisational risk, surfaces
// correlations a manager should notice, and trends them over six months.
//
// It does NOT blame staff — it identifies pressure points early so managers can
// support teams and protect children. Deterministic (injected `now`, no LLM).
// ─────────────────────────────────────────────────────────────────────────────

import type { Incident, StaffMember, Supervision, TrainingRecord, LeaveRequest } from "@/types";
import type { MissingEpisode } from "@/types/extended";

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskIndicator {
  key: string;
  label: string;
  value: string; // display value
  level: RiskLevel;
  detail: string;
}

export interface Correlation {
  key: string;
  text: string;
  severity: "watch" | "concern";
}

export interface TrendPoint {
  month: string; // YYYY-MM
  incidents: number;
  supervisionsCompleted: number;
  sickDays: number;
}

export interface OrgRiskDashboard {
  generatedAt: string;
  overallLevel: RiskLevel;
  headline: string;
  indicators: RiskIndicator[];
  correlations: Correlation[];
  trend: TrendPoint[];
}

export interface OrgRiskInput {
  now: string;
  windowDays?: number; // recent window for counts. default 90
  staff: StaffMember[];
  supervisions: Supervision[];
  trainingRecords: TrainingRecord[];
  incidents: Incident[];
  missing: MissingEpisode[];
  complaints: { date?: string; created_at?: string }[];
  leave: LeaveRequest[];
}

function daysSince(dateIso: string | undefined | null, now: string): number {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return (n - t) / 86_400_000;
}
function isPast(dateIso: string | null | undefined, now: string): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  return !Number.isNaN(t) && !Number.isNaN(n) && t < n;
}
function monthKey(dateIso: string): string {
  return (dateIso || "").slice(0, 7);
}

const LEVEL_SCORE: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2, critical: 3 };
const band = (n: number, mod: number, high: number, crit: number): RiskLevel =>
  n >= crit ? "critical" : n >= high ? "high" : n >= mod ? "moderate" : "low";
const HIGH_SEVERITY = new Set(["serious", "high", "major", "critical"]);

export function buildOrgRiskDashboard(input: OrgRiskInput): OrgRiskDashboard {
  const windowDays = input.windowDays ?? 90;
  const recent = (d: string | undefined | null) => daysSince(d, input.now) <= windowDays;

  const activeStaff = input.staff.filter((s) => s.employment_status === "active");
  const agencyBank = activeStaff.filter((s) => ["agency", "bank"].includes(String(s.employment_type)));
  const agencyPct = activeStaff.length ? Math.round((agencyBank.length / activeStaff.length) * 100) : 0;

  const leavers = input.staff.filter((s) => s.employment_status !== "active" || (s.end_date && recent(s.end_date)));

  const sickLeave = input.leave.filter((l) => String(l.leave_type) === "sick" && l.status === "approved" && recent(l.start_date));
  const sickDays = sickLeave.reduce((sum, l) => sum + (l.total_days ?? 0), 0);

  const overdueSup = input.supervisions.filter((s) => s.status === "scheduled" && isPast(s.scheduled_date, input.now)).length;
  const completedSup = input.supervisions.filter((s) => s.status === "completed").length;
  const supTotal = input.supervisions.length;
  const supCompletionPct = supTotal ? Math.round((completedSup / supTotal) * 100) : 100;

  const mandatory = input.trainingRecords.filter((t) => t.is_mandatory);
  const nonCompliant = mandatory.filter((t) => t.status !== "compliant").length;

  const recentIncidents = input.incidents.filter((i) => recent(i.date));
  const highSevIncidents = recentIncidents.filter((i) => HIGH_SEVERITY.has(String(i.severity))).length;
  const recentMissing = input.missing.filter((m) => recent(m.date_missing)).length;
  const recentComplaints = input.complaints.filter((c) => recent(c.date ?? c.created_at)).length;

  const staffingLevel = band(agencyPct, 25, 40, 60);
  const sicknessLevel = band(sickDays, 5, 12, 25);
  const supervisionLevel: RiskLevel =
    supCompletionPct < 50 || overdueSup >= 5 ? "high" : overdueSup >= 2 || supCompletionPct < 70 ? "moderate" : "low";
  const trainingLevel = band(nonCompliant, 1, 3, 6);
  const turnoverLevel = band(leavers.length, 1, 3, 5);
  const incidentLevel: RiskLevel = highSevIncidents >= 3 ? "high" : recentIncidents.length >= 8 ? "high" : recentIncidents.length >= 4 ? "moderate" : "low";
  const missingLevel = band(recentMissing, 2, 4, 7);
  const complaintsLevel = band(recentComplaints, 1, 3, 5);

  const indicators: RiskIndicator[] = [
    { key: "staffing", label: "Staffing consistency", value: `${agencyPct}% bank/agency`, level: staffingLevel, detail: `${agencyBank.length} of ${activeStaff.length} active staff are bank or agency — more cover can reduce consistency for children.` },
    { key: "sickness", label: "Sickness absence", value: `${sickDays} day${sickDays === 1 ? "" : "s"}`, level: sicknessLevel, detail: `${sickLeave.length} sickness absence${sickLeave.length === 1 ? "" : "s"} in the last ${windowDays} days.` },
    { key: "supervision", label: "Supervision", value: `${overdueSup} overdue · ${supCompletionPct}% complete`, level: supervisionLevel, detail: "Regular supervision protects practice quality and staff wellbeing." },
    { key: "training", label: "Mandatory training", value: `${nonCompliant} not compliant`, level: trainingLevel, detail: `${nonCompliant} of ${mandatory.length} mandatory training records need attention.` },
    { key: "turnover", label: "Staff turnover", value: `${leavers.length} recent`, level: turnoverLevel, detail: "Turnover affects relationships and consistency for children." },
    { key: "incidents", label: "Incidents", value: `${recentIncidents.length} (${highSevIncidents} high-severity)`, level: incidentLevel, detail: `Incidents in the last ${windowDays} days — a demand and pressure signal.` },
    { key: "missing", label: "Missing episodes", value: `${recentMissing}`, level: missingLevel, detail: `Missing-from-care episodes in the last ${windowDays} days.` },
    { key: "complaints", label: "Complaints", value: `${recentComplaints}`, level: complaintsLevel, detail: `Complaints in the last ${windowDays} days.` },
  ];

  // Overall: critical if any critical or ≥3 high; high if ≥2 high or 1 critical; moderate if any high / several moderate.
  const highCount = indicators.filter((i) => i.level === "high").length;
  const critCount = indicators.filter((i) => i.level === "critical").length;
  const modCount = indicators.filter((i) => i.level === "moderate").length;
  const overallLevel: RiskLevel =
    critCount >= 1 || highCount >= 3 ? "critical" : highCount >= 2 ? "high" : highCount >= 1 || modCount >= 3 ? "moderate" : "low";

  // Correlations — deterministic, from the indicator levels.
  const lvl = (k: string) => indicators.find((i) => i.key === k)!.level;
  const elevated = (l: RiskLevel) => LEVEL_SCORE[l] >= 1;
  const correlations: Correlation[] = [];
  if (elevated(lvl("staffing")) && elevated(lvl("incidents"))) {
    correlations.push({ key: "agency_incidents", severity: "concern", text: "Bank/agency cover and incidents are both elevated — extra induction and consistent handovers may help." });
  }
  if (elevated(lvl("supervision")) && elevated(lvl("incidents"))) {
    correlations.push({ key: "supervision_incidents", severity: "concern", text: "Supervision is slipping while incidents are up — protecting supervision time supports the team and practice." });
  }
  if (elevated(lvl("sickness")) && elevated(lvl("supervision"))) {
    correlations.push({ key: "sickness_supervision", severity: "watch", text: "Sickness and overdue supervision together can signal team pressure — a wellbeing check-in may help." });
  }
  if (elevated(lvl("training")) && elevated(lvl("incidents"))) {
    correlations.push({ key: "training_incidents", severity: "watch", text: "Training gaps alongside incidents — refreshing key training could strengthen responses." });
  }

  // Six-month trend.
  const months: string[] = [];
  {
    const n = new Date(input.now);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - i, 1));
      months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
  }
  const trend: TrendPoint[] = months.map((m) => ({
    month: m,
    incidents: input.incidents.filter((i) => monthKey(i.date) === m).length,
    supervisionsCompleted: input.supervisions.filter((s) => s.status === "completed" && monthKey(s.actual_date ?? "") === m).length,
    sickDays: input.leave.filter((l) => String(l.leave_type) === "sick" && monthKey(l.start_date) === m).reduce((sum, l) => sum + (l.total_days ?? 0), 0),
  }));

  const LABEL: Record<RiskLevel, string> = { low: "low / healthy", moderate: "moderate / monitor", high: "high / action needed", critical: "critical / immediate action" };
  const headline =
    overallLevel === "low"
      ? "Organisational risk is low — the team looks settled. Keep protecting supervision and consistency."
      : `Organisational risk is ${LABEL[overallLevel]} — ${highCount + critCount} pressure point${highCount + critCount === 1 ? "" : "s"} to support. This is about supporting the team, not blaming it.`;

  return { generatedAt: input.now, overallLevel, headline, indicators, correlations, trend };
}
