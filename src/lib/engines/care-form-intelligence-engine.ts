// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE FORM INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses care form completion pipelines, review turnaround, overdue forms,
// priority distribution, and form type coverage.
//
// Regulatory: Care forms underpin Reg 35 (policies/procedures documentation),
// Reg 37 (notifications), Schedule 1. SCCIF: "Are records accurate, up to
// date, and support effective planning?"
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export type CareFormStatus =
  | "draft"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export type CareFormPriority = "low" | "medium" | "high" | "urgent";

export interface CareFormInput {
  id: string;
  title: string;
  form_type: string;
  status: CareFormStatus;
  priority: CareFormPriority;
  linked_child_id: string | null;
  linked_staff_id: string | null;
  linked_incident_id: string | null;
  description: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  due_date: string | null;
  tags: string[];
  created_at: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface CareFormIntelligenceInput {
  forms: CareFormInput[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface CareFormOverview {
  total_forms: number;
  draft_count: number;
  submitted_count: number;
  pending_review_count: number;
  approved_count: number;
  rejected_count: number;
  archived_count: number;
  overdue_count: number;
  urgent_count: number;
  high_priority_count: number;
  child_linked_count: number;
  incident_linked_count: number;
  completion_rate: number | null; // approved / (total - draft - archived) %, null when nothing is awaiting or through review
  avg_review_days: number;        // avg days from submitted_at to reviewed_at
  form_types_used: number;
}

export interface FormTypeAnalysis {
  form_type: string;
  count: number;
  approved_count: number;
  pending_count: number;         // submitted + pending_review
  overdue_count: number;
  urgent_count: number;
}

export interface FormProfile {
  form_id: string;
  title: string;
  form_type: string;
  status: CareFormStatus;
  priority: CareFormPriority;
  submitted_by_name: string | null;
  reviewed_by_name: string | null;
  is_overdue: boolean;
  days_overdue: number;           // 0 if not overdue
  days_since_submitted: number | null;
  risk_flags: string[];
}

export interface CareFormAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraCareFormInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface CareFormIntelligenceResult {
  overview: CareFormOverview;
  form_type_analysis: FormTypeAnalysis[];
  form_profiles: FormProfile[];
  alerts: CareFormAlert[];
  insights: CaraCareFormInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function isOverdue(form: CareFormInput, today: string): boolean {
  if (!form.due_date) return false;
  if (form.status === "approved" || form.status === "archived") return false;
  return daysBetween(form.due_date, today) > 0;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeCareFormIntelligence(
  input: CareFormIntelligenceInput,
): CareFormIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { forms, staff } = input;

  const staffMap = new Map(staff.map((s) => [s.id, s.name]));

  // ── Status breakdowns ──────────────────────────────────────────────────
  const drafts = forms.filter((f) => f.status === "draft");
  const submitted = forms.filter((f) => f.status === "submitted");
  const pendingReview = forms.filter((f) => f.status === "pending_review");
  const approved = forms.filter((f) => f.status === "approved");
  const rejected = forms.filter((f) => f.status === "rejected");
  const archived = forms.filter((f) => f.status === "archived");

  // ── Overdue ──────────────────────────────────────────────────────────
  const overdueForms = forms.filter((f) => isOverdue(f, today));

  // ── Priority ─────────────────────────────────────────────────────────
  const urgentForms = forms.filter((f) => f.priority === "urgent" && f.status !== "approved" && f.status !== "archived");
  const highPriorityForms = forms.filter((f) => f.priority === "high" && f.status !== "approved" && f.status !== "archived");

  // ── Linkage ──────────────────────────────────────────────────────────
  const childLinked = forms.filter((f) => f.linked_child_id !== null);
  const incidentLinked = forms.filter((f) => f.linked_incident_id !== null);

  // ── Completion rate ──────────────────────────────────────────────────
  const actionable = forms.filter((f) => f.status !== "draft" && f.status !== "archived");
  const completionRate = rateOf(approved, actionable);

  // ── Avg review turnaround ────────────────────────────────────────────
  const reviewedForms = forms.filter((f) => f.reviewed_at && f.submitted_at);
  const reviewDays = reviewedForms.map((f) =>
    Math.max(0, daysBetween(f.submitted_at!, f.reviewed_at!)),
  );
  const avgReviewDays = reviewDays.length > 0
    ? Math.round(reviewDays.reduce((s, v) => s + v, 0) / reviewDays.length)
    : 0;

  // ── Form types ───────────────────────────────────────────────────────
  const typeSet = new Set(forms.map((f) => f.form_type));

  const overview: CareFormOverview = {
    total_forms: forms.length,
    draft_count: drafts.length,
    submitted_count: submitted.length,
    pending_review_count: pendingReview.length,
    approved_count: approved.length,
    rejected_count: rejected.length,
    archived_count: archived.length,
    overdue_count: overdueForms.length,
    urgent_count: urgentForms.length,
    high_priority_count: highPriorityForms.length,
    child_linked_count: childLinked.length,
    incident_linked_count: incidentLinked.length,
    completion_rate: completionRate,
    avg_review_days: avgReviewDays,
    form_types_used: typeSet.size,
  };

  // ── Form Type Analysis ─────────────────────────────────────────────────
  const typeMap = new Map<string, CareFormInput[]>();
  for (const f of forms) {
    const arr = typeMap.get(f.form_type) ?? [];
    arr.push(f);
    typeMap.set(f.form_type, arr);
  }

  const form_type_analysis: FormTypeAnalysis[] = [...typeMap.entries()]
    .map(([form_type, items]) => ({
      form_type,
      count: items.length,
      approved_count: items.filter((f) => f.status === "approved").length,
      pending_count: items.filter((f) => f.status === "submitted" || f.status === "pending_review").length,
      overdue_count: items.filter((f) => isOverdue(f, today)).length,
      urgent_count: items.filter((f) => f.priority === "urgent" && f.status !== "approved" && f.status !== "archived").length,
    }))
    .sort((a, b) => b.count - a.count); // most used first

  // ── Form Profiles ──────────────────────────────────────────────────────
  const form_profiles: FormProfile[] = forms.map((f) => {
    const formIsOverdue = isOverdue(f, today);
    const daysOverdue = formIsOverdue && f.due_date ? daysBetween(f.due_date, today) : 0;
    const daysSinceSubmitted = f.submitted_at ? daysBetween(f.submitted_at.slice(0, 10), today) : null;

    const riskFlags: string[] = [];
    if (formIsOverdue) riskFlags.push("overdue");
    if (f.priority === "urgent" && f.status !== "approved" && f.status !== "archived") riskFlags.push("urgent_incomplete");
    if (f.status === "submitted" && daysSinceSubmitted !== null && daysSinceSubmitted > 7) riskFlags.push("stale_submission");
    if (f.status === "pending_review" && daysSinceSubmitted !== null && daysSinceSubmitted > 7) riskFlags.push("review_delayed");
    if (f.status === "rejected") riskFlags.push("rejected");
    if (f.linked_incident_id && f.status !== "approved" && f.status !== "archived") riskFlags.push("incident_linked_incomplete");

    return {
      form_id: f.id,
      title: f.title,
      form_type: f.form_type,
      status: f.status,
      priority: f.priority,
      submitted_by_name: f.submitted_by ? (staffMap.get(f.submitted_by) ?? f.submitted_by) : null,
      reviewed_by_name: f.reviewed_by ? (staffMap.get(f.reviewed_by) ?? f.reviewed_by) : null,
      is_overdue: formIsOverdue,
      days_overdue: daysOverdue,
      days_since_submitted: daysSinceSubmitted,
      risk_flags: riskFlags,
    };
  });

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: CareFormAlert[] = [];

  // Critical: urgent forms not approved
  if (urgentForms.length > 0) {
    const titles = urgentForms.map((f) => f.title).join(", ");
    alerts.push({
      severity: "critical",
      message: `${urgentForms.length} urgent form(s) not yet completed: ${titles}. Urgent safeguarding and welfare documentation must be processed immediately.`,
    });
  }

  // Critical: overdue forms
  if (overdueForms.length > 0) {
    const titles = overdueForms.map((f) => f.title).join(", ");
    alerts.push({
      severity: "critical",
      message: `${overdueForms.length} form(s) past due date: ${titles}. Overdue documentation risks regulatory non-compliance and may leave gaps in the child's record.`,
    });
  }

  // High: pending review forms
  if (pendingReview.length > 0) {
    alerts.push({
      severity: "high",
      message: `${pendingReview.length} form(s) awaiting manager review. Prompt review ensures documentation quality and supports timely decision-making.`,
    });
  }

  // High: submitted but not reviewed for >7 days
  const staleSubmitted = submitted.filter(
    (f) => f.submitted_at && daysBetween(f.submitted_at.slice(0, 10), today) > 7,
  );
  if (staleSubmitted.length > 0) {
    alerts.push({
      severity: "high",
      message: `${staleSubmitted.length} submitted form(s) awaiting review for more than 7 days. Timely review is essential for regulatory compliance.`,
    });
  }

  // Medium: draft forms not submitted
  if (drafts.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${drafts.length} draft form(s) not yet submitted. Remind staff to complete and submit documentation promptly.`,
    });
  }

  // Low: no safeguarding-tagged forms
  const hasSafeguarding = forms.some((f) => f.tags.includes("safeguarding") || f.form_type === "safeguarding_referral");
  if (!hasSafeguarding && forms.length > 0) {
    alerts.push({
      severity: "low",
      message: `No safeguarding-related forms recorded. Ensure all safeguarding concerns, referrals, and strategy discussions are documented formally.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraCareFormInsight[] = [];

  // Critical: overdue forms
  if (overdueForms.length > 0) {
    insights.push({
      severity: "critical",
      text: `${overdueForms.length} care form(s) are past their due date. Incomplete documentation at the time of inspection creates significant regulatory risk. Prioritise these for immediate action.`,
    });
  }

  // Critical: urgent incomplete
  if (urgentForms.length > 0) {
    insights.push({
      severity: "critical",
      text: `${urgentForms.length} urgent-priority form(s) remain incomplete. These typically relate to safeguarding, missing persons, or critical welfare events and require same-day processing.`,
    });
  }

  // Warning: low completion rate
  if (below(completionRate, 50)) {
    insights.push({
      severity: "warning",
      text: `Form completion rate is ${completionRate}%. Fewer than half of submitted forms have been approved. Review the documentation workflow and ensure managers are reviewing forms in a timely manner.`,
    });
  }

  // Warning: stale submissions
  if (staleSubmitted.length > 0) {
    insights.push({
      severity: "warning",
      text: `${staleSubmitted.length} form(s) submitted more than 7 days ago remain unreviewed. Stale documentation undermines evidence quality. Inspectors expect to see a responsive review workflow.`,
    });
  }

  // Positive: high completion rate
  if (meets(completionRate, 80)) {
    insights.push({
      severity: "positive",
      text: `Form completion rate is ${completionRate}%. A strong approval pipeline demonstrates effective documentation governance and supports Ofsted evidence requirements.`,
    });
  }

  // Positive: no overdue forms
  if (overdueForms.length === 0 && forms.length > 0) {
    insights.push({
      severity: "positive",
      text: `No forms are past their due date. Documentation is being managed within expected timescales — a positive indicator of organised record-keeping.`,
    });
  }

  // Positive: fast review turnaround
  if (avgReviewDays <= 2 && reviewedForms.length > 0) {
    insights.push({
      severity: "positive",
      text: `Average form review turnaround is ${avgReviewDays} day(s). Prompt managerial review ensures documentation accuracy and supports responsive care planning.`,
    });
  }

  // Positive: child-linked forms
  if (childLinked.length > 0 && forms.length > 0) {
    const pct = Math.round((childLinked.length / forms.length) * 100);
    insights.push({
      severity: "positive",
      text: `${pct}% of forms (${childLinked.length} of ${forms.length}) are linked to specific children. Child-linked records support person-centred care and evidence individual planning.`,
    });
  }

  // Positive: diverse form types
  if (typeSet.size >= 3) {
    insights.push({
      severity: "positive",
      text: `Documentation covers ${typeSet.size} form types. Comprehensive documentation across multiple domains demonstrates thorough record-keeping under Schedule 1.`,
    });
  }

  return {
    overview,
    form_type_analysis,
    form_profiles,
    alerts,
    insights,
  };
}
