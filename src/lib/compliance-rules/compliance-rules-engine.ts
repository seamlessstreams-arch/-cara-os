// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLIANCE RULES ENGINE (FIXED RULES)
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls, no
// argless current-time reads (an injectable `today` is always used).
//
// This engine is DELIBERATELY SEPARATE from Cara. Cara suggests, prioritises and
// reasons; this engine enforces. These are HARD, FIXED regulatory rules — pass or
// fail — derived from the Children's Homes (England) Regulations 2015 and the
// associated statutory guidance. Cara's analysis is read as *evidence* a rule may
// be breached (e.g. a populated complianceFlag), but Cara is NOT the authority: a
// rule fails on the facts of the record, not on a model's confidence.
//
// Rules evaluated:
//   (a) mandatory-info            — any event Cara flagged for compliance → fail
//   (b) approval-threshold        — high/critical event still requiring approval
//                                    is an outstanding authorisation → fail
//   (c) safeguarding-notification — safeguarding / missing events require a
//                                    notification → fail until evidenced
//   (d) physical-intervention-review — every restraint requires a post-incident
//                                    review/debrief → fail until evidenced
//   (e) medication-error-followup — a medication event carrying harm requires a
//                                    documented follow-up → fail
//   (f) training-expiry           — expired / expiring mandatory training → fail
//   (g) supervision-due           — overdue staff supervision → fail
//
// Output shape (house standard): { overview, rule_results, alerts, insights }.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent } from "@/types/cornerstone-event";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ComplianceSupervisionInput {
  id: string;
  staff_id: string;
  type?: string;
  scheduled_date: string;          // yyyy-mm-dd
  actual_date?: string | null;     // yyyy-mm-dd | null
  status?: string;                 // "scheduled" | "completed" | "overdue" | ...
}

export interface ComplianceTrainingInput {
  id: string;
  staff_id: string;
  course_name?: string;
  category?: string;
  status?: string;                 // "compliant" | "expiring_soon" | "expired" | "not_started" | ...
  is_mandatory?: boolean;
  expiry_date?: string | null;     // yyyy-mm-dd | null
}

export interface ComplianceRulesInput {
  events: CornerstoneEvent[];
  supervisions: ComplianceSupervisionInput[];
  trainingRecords: ComplianceTrainingInput[];
  /** Injected for determinism — defaults to the current ISO date (yyyy-mm-dd). */
  today?: string;
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type RuleSeverity = "critical" | "high" | "medium" | "low";
export type RuleStatus = "pass" | "fail";

export type RuleCategory =
  | "mandatory-info"
  | "approval-threshold"
  | "safeguarding-notification"
  | "physical-intervention-review"
  | "medication-error-followup"
  | "training-expiry"
  | "supervision-due";

export interface RuleResult {
  rule_id: string;
  category: RuleCategory;
  title: string;
  severity: RuleSeverity;
  status: RuleStatus;
  message: string;
  linked_event_id?: string;
  linked_staff_id?: string;
}

export interface ComplianceOverview {
  rules_evaluated: number;
  passing: number;
  failing: number;
  by_severity: { critical: number; high: number; medium: number; low: number };
}

export interface ComplianceAlert {
  severity: "critical" | "high" | "medium" | "low";
  category: RuleCategory;
  title: string;
  message: string;
  linked_event_id?: string;
  linked_staff_id?: string;
}

export interface ComplianceInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ComplianceRulesResult {
  overview: ComplianceOverview;
  rule_results: RuleResult[];
  alerts: ComplianceAlert[];
  insights: ComplianceInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Tags the projector attaches that mean "the required follow-up step is still
// outstanding". A rule only stays FAILED while the outstanding signal is present.
const SAFEGUARDING_OUTSTANDING_TAGS = new Set(["rhi_outstanding", "la_notification_outstanding"]);
const RESTRAINT_REVIEW_OUTSTANDING_TAGS = new Set(["debrief_outstanding"]);

// Risk → severity mapping for the approval-threshold rule.
const RISK_SEVERITY: Record<string, RuleSeverity> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

// Statuses that count as an active expiry breach for mandatory training.
const TRAINING_BREACH_STATUS = new Set(["expired", "expiring", "expiring_soon"]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.floor((b - a) / 86_400_000);
}

function hasTag(event: CornerstoneEvent, tag: string): boolean {
  return (event.structuredTags ?? []).includes(tag);
}

function hasAnyTag(event: CornerstoneEvent, tags: Set<string>): boolean {
  return (event.structuredTags ?? []).some((t) => tags.has(t));
}

function eventLabel(event: CornerstoneEvent): string {
  const ref = event.summary?.split(":")[0]?.trim();
  return ref && ref.length <= 48 ? ref : event.eventType.replace(/_/g, " ");
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeComplianceRules(input: ComplianceRulesInput): ComplianceRulesResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const events = input.events ?? [];
  const supervisions = input.supervisions ?? [];
  const trainingRecords = input.trainingRecords ?? [];

  const results: RuleResult[] = [];

  // ── (a) mandatory-info ────────────────────────────────────────────────────
  // Any event Cara flagged for compliance (non-empty complianceFlags) is a hard
  // fail: the record is incomplete against a mandatory requirement. Cara surfaces
  // the flag, but the FAIL is fixed — the manager must resolve it, not the model.
  for (const e of events) {
    const flags = e.caraAnalysis?.complianceFlags ?? [];
    if (flags.length === 0) continue;
    const severity: RuleSeverity =
      e.riskLevel === "critical" ? "critical" : e.riskLevel === "high" ? "high" : "medium";
    results.push({
      rule_id: `mandatory-info:${e.id}`,
      category: "mandatory-info",
      title: "Mandatory information outstanding",
      severity,
      status: "fail",
      message: `${eventLabel(e)} has an unresolved compliance requirement: ${flags.join("; ")}.`,
      linked_event_id: e.id,
      linked_staff_id: e.staffId,
    });
  }

  // ── (b) approval-threshold ────────────────────────────────────────────────
  // A high or critical event that still carries requiresApproval has an
  // outstanding authorisation — treat the approval as not yet given → fail.
  for (const e of events) {
    if (!e.requiresApproval) continue;
    if (e.riskLevel !== "high" && e.riskLevel !== "critical") continue;
    const severity = RISK_SEVERITY[e.riskLevel] ?? "high";
    const level = e.approvalLevel ? e.approvalLevel.replace(/_/g, " ") : "manager";
    results.push({
      rule_id: `approval-threshold:${e.id}`,
      category: "approval-threshold",
      title: "Approval outstanding for high-risk event",
      severity,
      status: "fail",
      message: `${eventLabel(e)} (${e.riskLevel} risk) requires ${level} sign-off that is not yet recorded as given.`,
      linked_event_id: e.id,
      linked_staff_id: e.staffId,
    });
  }

  // ── (c) safeguarding-notification ─────────────────────────────────────────
  // Safeguarding and missing events require an external notification (Reg 40).
  // The rule FAILS until the notification step is evidenced; it PASSES once the
  // outstanding markers (return-home-interview / LA notification) are cleared.
  for (const e of events) {
    if (e.eventType !== "safeguarding" && e.eventType !== "missing") continue;
    const outstanding = hasAnyTag(e, SAFEGUARDING_OUTSTANDING_TAGS);
    // A populated complianceFlag mentioning notification is also treated as
    // outstanding evidence the duty has not been discharged.
    const flagOutstanding = (e.caraAnalysis?.complianceFlags ?? []).some((f) =>
      /notif|return home interview|local authority/i.test(f),
    );
    const isOutstanding = outstanding || flagOutstanding;
    const severity: RuleSeverity = e.riskLevel === "critical" ? "critical" : "high";
    results.push({
      rule_id: `safeguarding-notification:${e.id}`,
      category: "safeguarding-notification",
      title: e.eventType === "missing" ? "Missing episode notification" : "Safeguarding notification",
      severity,
      status: isOutstanding ? "fail" : "pass",
      message: isOutstanding
        ? `${eventLabel(e)} requires a notification/return-home interview that is still outstanding.`
        : `${eventLabel(e)} — required notifications are evidenced as complete.`,
      linked_event_id: e.id,
      linked_staff_id: e.staffId,
    });
  }

  // ── (d) physical-intervention-review ──────────────────────────────────────
  // Every physical intervention requires a post-incident review/debrief. Fails
  // until the debrief is evidenced (the projector clears `debrief_outstanding`).
  for (const e of events) {
    if (e.eventType !== "physical_intervention") continue;
    const reviewOutstanding = hasAnyTag(e, RESTRAINT_REVIEW_OUTSTANDING_TAGS);
    const severity: RuleSeverity = e.riskLevel === "critical" ? "critical" : "high";
    results.push({
      rule_id: `physical-intervention-review:${e.id}`,
      category: "physical-intervention-review",
      title: "Physical intervention review",
      severity,
      status: reviewOutstanding ? "fail" : "pass",
      message: reviewOutstanding
        ? `${eventLabel(e)} requires a post-incident review/debrief with the child that is outstanding.`
        : `${eventLabel(e)} — post-incident review is evidenced.`,
      linked_event_id: e.id,
      linked_staff_id: e.staffId,
    });
  }

  // ── (e) medication-error-followup ─────────────────────────────────────────
  // A medication event carrying a harm marker requires a documented follow-up
  // (review + duty of candour). Treated as outstanding → fail.
  for (const e of events) {
    if (e.eventType !== "medication") continue;
    if (!hasTag(e, "harm")) continue;
    const severity: RuleSeverity = e.riskLevel === "critical" ? "critical" : e.riskLevel === "high" ? "high" : "medium";
    const candourGap = hasTag(e, "candour_outstanding");
    results.push({
      rule_id: `medication-error-followup:${e.id}`,
      category: "medication-error-followup",
      title: "Medication error follow-up",
      severity,
      status: "fail",
      message: `${eventLabel(e)} caused harm and requires a documented follow-up${candourGap ? " — duty of candour is outstanding" : " (review and learning)"}.`,
      linked_event_id: e.id,
      linked_staff_id: e.staffId,
    });
  }

  // ── (f) training-expiry ───────────────────────────────────────────────────
  // Mandatory training that is expired or expiring is a fixed fail. Expired is
  // higher severity than expiring; non-mandatory training is informational only
  // and does not fail the home.
  for (const t of trainingRecords) {
    const status = (t.status ?? "").toLowerCase();
    const isBreach = TRAINING_BREACH_STATUS.has(status);
    if (!isBreach) continue;
    if (t.is_mandatory === false) continue; // only mandatory training fails the home
    const expired = status === "expired";
    const severity: RuleSeverity = expired ? "high" : "medium";
    const course = t.course_name ?? t.category ?? "Mandatory training";
    results.push({
      rule_id: `training-expiry:${t.id}`,
      category: "training-expiry",
      title: expired ? "Mandatory training expired" : "Mandatory training expiring",
      severity,
      status: "fail",
      message: expired
        ? `${course} has expired${t.expiry_date ? ` (expired ${t.expiry_date})` : ""} and must be renewed.`
        : `${course} is expiring soon${t.expiry_date ? ` (due ${t.expiry_date})` : ""} and must be renewed.`,
      linked_staff_id: t.staff_id,
    });
  }

  // ── (g) supervision-due ───────────────────────────────────────────────────
  // A supervision is overdue when it is marked overdue, or when it is not yet
  // completed and its scheduled date is in the past. Overdue supervision is a
  // fixed fail (Reg 33 — at least monthly supervision).
  for (const s of supervisions) {
    const status = (s.status ?? "").toLowerCase();
    if (status === "completed" || s.actual_date) continue;
    const overdueDays = s.scheduled_date ? daysBetween(s.scheduled_date, today) : 0;
    const isOverdue = status === "overdue" || overdueDays > 0;
    if (!isOverdue) continue;
    const severity: RuleSeverity = overdueDays >= 14 ? "high" : "medium";
    const type = s.type ? s.type.replace(/_/g, " ") : "supervision";
    results.push({
      rule_id: `supervision-due:${s.id}`,
      category: "supervision-due",
      title: "Supervision overdue",
      severity,
      status: "fail",
      message: `Staff ${type} scheduled for ${s.scheduled_date} is overdue${overdueDays > 0 ? ` by ${overdueDays} day${overdueDays === 1 ? "" : "s"}` : ""}.`,
      linked_staff_id: s.staff_id,
    });
  }

  // ── Stable ordering ───────────────────────────────────────────────────────
  // Deterministic: failing first, then by severity, then by rule_id. This makes
  // the JSON output byte-identical for identical input regardless of evaluation
  // order above.
  const SEVERITY_RANK: Record<RuleSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  results.sort((a, b) => {
    if (a.status !== b.status) return a.status === "fail" ? -1 : 1;
    if (a.severity !== b.severity) return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    return a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0;
  });

  const overview = buildOverview(results);
  const alerts = buildAlerts(results);
  const insights = buildInsights(results, overview);

  return { overview, rule_results: results, alerts, insights };
}

// ── Overview ──────────────────────────────────────────────────────────────────

function buildOverview(results: RuleResult[]): ComplianceOverview {
  const failing = results.filter((r) => r.status === "fail");
  const by_severity = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of failing) by_severity[r.severity] += 1;
  return {
    rules_evaluated: results.length,
    passing: results.length - failing.length,
    failing: failing.length,
    by_severity,
  };
}

// ── Alerts (failing critical / high only) ──────────────────────────────────────

function buildAlerts(results: RuleResult[]): ComplianceAlert[] {
  return results
    .filter((r) => r.status === "fail" && (r.severity === "critical" || r.severity === "high"))
    .map((r) => ({
      severity: r.severity,
      category: r.category,
      title: r.title,
      message: r.message,
      linked_event_id: r.linked_event_id,
      linked_staff_id: r.linked_staff_id,
    }));
}

// ── Insights (compliance posture) ──────────────────────────────────────────────

const CATEGORY_LABEL: Record<RuleCategory, string> = {
  "mandatory-info": "mandatory record completeness",
  "approval-threshold": "high-risk approvals",
  "safeguarding-notification": "safeguarding notifications",
  "physical-intervention-review": "physical-intervention reviews",
  "medication-error-followup": "medication-error follow-ups",
  "training-expiry": "mandatory training",
  "supervision-due": "staff supervision",
};

function buildInsights(results: RuleResult[], overview: ComplianceOverview): ComplianceInsight[] {
  const insights: ComplianceInsight[] = [];
  const failing = results.filter((r) => r.status === "fail");

  if (overview.failing === 0) {
    insights.push({
      severity: "positive",
      text:
        overview.rules_evaluated === 0
          ? "No compliance rules were triggered by the current records. As records accumulate this fixed-rule check will keep watching."
          : `All ${overview.rules_evaluated} fixed compliance rule${overview.rules_evaluated === 1 ? "" : "s"} evaluated are passing. These are hard regulatory checks, separate from Cara's suggestions — the home is currently clear on every monitored duty.`,
    });
    return insights;
  }

  // Critical breaches first.
  if (overview.by_severity.critical > 0) {
    const crit = failing.filter((r) => r.severity === "critical");
    const cats = [...new Set(crit.map((r) => CATEGORY_LABEL[r.category]))].join(", ");
    insights.push({
      severity: "critical",
      text: `${overview.by_severity.critical} critical compliance breach${overview.by_severity.critical === 1 ? "" : "es"} require immediate action (${cats}). These are fixed regulatory rules — they must be resolved now, not deferred.`,
    });
  }

  // Where are the failures concentrated?
  const byCategory = new Map<RuleCategory, number>();
  for (const r of failing) byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] >= 2) {
    insights.push({
      severity: "warning",
      text: `${topCategory[1]} of the ${overview.failing} open breaches concern ${CATEGORY_LABEL[topCategory[0]]} — the clearest single theme to address to lift compliance posture.`,
    });
  } else if (overview.by_severity.high > 0 && overview.by_severity.critical === 0) {
    insights.push({
      severity: "warning",
      text: `${overview.by_severity.high} high-severity compliance rule${overview.by_severity.high === 1 ? " is" : "s are"} failing. No critical breaches, but these fixed duties should be cleared promptly.`,
    });
  }

  // Reassurance on what IS holding, when there is a mix.
  if (overview.passing > 0 && overview.by_severity.critical === 0 && overview.failing <= 3) {
    insights.push({
      severity: "positive",
      text: `${overview.passing} monitored compliance rule${overview.passing === 1 ? " is" : "s are"} passing; the open items are contained and individually actionable.`,
    });
  }

  return insights;
}
