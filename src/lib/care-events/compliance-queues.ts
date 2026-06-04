// ══════════════════════════════════════════════════════════════════════════════
// Compliance queue builders (pure)
//
// Backs four manager-facing compliance queues whose hooks expect enriched,
// metricated shapes the generic /api/v1/[...slug] catch-all can't produce:
//   - Reg 45 evidence queue        (use-compliance-evidence: useReg45Evidence)
//   - Annex A readiness queue      (use-compliance-evidence: useAnnexAReadiness)
//   - Management oversight queue   (use-oversight-queues:   useManagementOversight)
//   - Regulation 40 triage queue   (use-oversight-queues:   useReg40Triage)
//
// All functions are pure (date logic takes an injected `today`) so they unit-test
// deterministically. PATCH/decision side-effects live in the route handlers and
// only mutate the in-memory store — they NEVER auto-send any external
// notification (Ofsted etc.); they record the manager's decision for a human to
// action, consistent with the platform's gated-routing rule.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CareEvent,
  Reg45EvidenceItem,
  AnnexAEvidenceItem,
  ManagerDecision,
} from "@/types/care-events";
import type { NotifiableEvent, NotifiableEventType } from "@/types/extended";

const APPROVED_DECISIONS: ManagerDecision[] = ["approved", "accepted"];

function excerpt(text: string | null | undefined, n = 160): string {
  return (text ?? "").slice(0, n);
}

// ── Care-event reference (the `care_event` join the hooks render) ──────────────

export interface CareEventRef {
  id: string;
  title: string;
  category: string;
  event_date: string;
  status: string;
  staff_id: string;
  child_id: string | null;
  content_excerpt?: string;
}

export function careEventRef(
  ce: CareEvent | undefined | null,
  opts: { excerpt?: boolean } = {},
): CareEventRef | null {
  if (!ce) return null;
  const ref: CareEventRef = {
    id: ce.id,
    title: ce.title,
    category: ce.category,
    event_date: ce.event_date,
    status: ce.status,
    staff_id: ce.staff_id,
    child_id: ce.child_id,
  };
  if (opts.excerpt) ref.content_excerpt = excerpt(ce.content);
  return ref;
}

// ── Reg 45 evidence queue ──────────────────────────────────────────────────────

export interface Reg45Filters {
  decision?: string | null;
  theme?: string | null;
}

export function buildReg45Queue(
  items: Reg45EvidenceItem[],
  findCareEvent: (id: string) => CareEvent | undefined,
  filters: Reg45Filters = {},
) {
  let filtered = items;
  if (filters.decision) filtered = filtered.filter((i) => i.manager_decision === filters.decision);
  if (filters.theme) filtered = filtered.filter((i) => i.suggested_theme === filters.theme);

  const data = filtered.map((i) => ({
    ...i,
    care_event: careEventRef(findCareEvent(i.care_event_id)),
  }));

  // Counts are over the WHOLE queue (not the current filter) — they drive the tabs.
  const counts = {
    pending: items.filter((i) => i.manager_decision === "pending").length,
    approved: items.filter((i) => APPROVED_DECISIONS.includes(i.manager_decision)).length,
    rejected: items.filter((i) => i.manager_decision === "rejected").length,
    deferred: items.filter((i) => i.manager_decision === "deferred").length,
    total: items.length,
  };

  return { data, meta: { counts } };
}

// ── Annex A readiness queue ────────────────────────────────────────────────────

export interface AnnexAFilters {
  section?: string | null;
  decision?: string | null;
}

export function buildAnnexAQueue(
  items: AnnexAEvidenceItem[],
  findCareEvent: (id: string) => CareEvent | undefined,
  filters: AnnexAFilters = {},
) {
  let filtered = items;
  if (filters.section) filtered = filtered.filter((i) => i.annex_section === filters.section);
  if (filters.decision) filtered = filtered.filter((i) => i.manager_decision === filters.decision);

  const data = filtered.map((i) => ({
    ...i,
    care_event: careEventRef(findCareEvent(i.care_event_id)),
  }));

  const sectionKeys = [...new Set(items.map((i) => i.annex_section))].sort();
  const sections = sectionKeys.map((key) => {
    const secItems = items.filter((i) => i.annex_section === key);
    const approved_count = secItems.filter((i) => APPROVED_DECISIONS.includes(i.manager_decision)).length;
    const pending_count = secItems.filter((i) => i.manager_decision === "pending").length;
    return {
      key,
      label: key,
      evidence_count: secItems.length,
      approved_count,
      pending_count,
      stale_count: 0,
      has_gap: approved_count === 0,
    };
  });

  const approved_count = items.filter((i) => APPROVED_DECISIONS.includes(i.manager_decision)).length;
  const rejected_count = items.filter((i) => i.manager_decision === "rejected").length;
  const pending_decisions = items.filter((i) => i.manager_decision === "pending").length;
  const gaps = sections.filter((s) => s.has_gap).map((s) => s.key);
  const readiness_score = sections.length
    ? Math.round((sections.filter((s) => !s.has_gap).length / sections.length) * 100)
    : 100;

  return {
    data,
    meta: {
      readiness_score,
      total_evidence: items.length,
      pending_decisions,
      approved_count,
      rejected_count,
      sections,
      gaps,
      stale_count: 0,
    },
  };
}

// ── Care-event-backed task queues (oversight + reg 40) ─────────────────────────

export interface QueueTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "returned" | "completed";
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  evidence_note: string | null;
  home_id: string;
  care_event: CareEventRef | null;
}

function isCompleted(ce: CareEvent): boolean {
  return ce.manager_review_completed || ce.status === "verified" || ce.status === "locked";
}

export function careEventToOversightTask(ce: CareEvent): QueueTask {
  const urgent = ce.is_safeguarding || ce.is_significant;
  const completed = isCompleted(ce);
  return {
    id: ce.id,
    title: ce.title || "Care event — manager review",
    description: excerpt(ce.content, 200),
    category: "manager_oversight",
    priority: urgent ? "urgent" : "medium",
    status: completed ? "completed" : ce.status === "returned" ? "returned" : "pending",
    due_date: ce.event_date,
    completed_at: completed ? ce.manager_review_at ?? null : null,
    completed_by: ce.manager_id ?? null,
    evidence_note: ce.manager_review_note ?? null,
    home_id: ce.home_id,
    care_event: careEventRef(ce),
  };
}

export function careEventToReg40Task(ce: CareEvent): QueueTask {
  const urgent = ce.is_safeguarding;
  const completed = isCompleted(ce) || !ce.requires_reg40_triage;
  return {
    id: ce.id,
    title: ce.title || "Care event — Reg 40 triage",
    description: excerpt(ce.content, 200),
    category: "reg40_triage",
    priority: urgent ? "urgent" : "high",
    status: completed ? "completed" : "pending",
    due_date: ce.event_date,
    completed_at: completed ? ce.manager_review_at ?? null : null,
    completed_by: ce.manager_id ?? null,
    evidence_note: ce.manager_review_note ?? null,
    home_id: ce.home_id,
    care_event: careEventRef(ce, { excerpt: true }),
  };
}

export interface OversightFilters {
  status?: string | null;
  priority?: string | null;
  child_id?: string | null;
}

export function buildOversightQueue(events: CareEvent[], today: string, filters: OversightFilters = {}) {
  let tasks = events.map(careEventToOversightTask);
  if (filters.status) tasks = tasks.filter((t) => t.status === filters.status);
  if (filters.priority) tasks = tasks.filter((t) => t.priority === filters.priority);
  if (filters.child_id) tasks = tasks.filter((t) => t.care_event?.child_id === filters.child_id);

  const active = tasks.filter((t) => t.status !== "completed").length;
  const urgent = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length;
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "completed").length;

  return { data: tasks, meta: { total: tasks.length, active, urgent, overdue } };
}

export interface Reg40Filters {
  status?: string | null;
  child_id?: string | null;
}

export function buildReg40Queue(
  events: CareEvent[],
  pendingTriageCount: number,
  today: string,
  filters: Reg40Filters = {},
) {
  let tasks = events.map(careEventToReg40Task);
  if (filters.status) tasks = tasks.filter((t) => t.status === filters.status);
  if (filters.child_id) tasks = tasks.filter((t) => t.care_event?.child_id === filters.child_id);

  const active = tasks.filter((t) => t.status !== "completed").length;
  const overdue = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== "completed").length;

  return {
    data: tasks,
    meta: { total: tasks.length, active, overdue, care_events_pending_triage: pendingTriageCount },
  };
}

// ── Reg 40 → notifiable event (when a manager triages "notify_ofsted") ─────────
//
// Best-effort mapping of a care event's category to a notifiable-event type; the
// manager refines it before it is actually submitted.
export function reg40NotifiableEventType(ce: CareEvent): NotifiableEventType {
  const cat = (ce.category ?? "").toLowerCase();
  if (cat.includes("restraint")) return "restraint";
  if (cat.includes("abscond") || cat.includes("missing")) return "absconding";
  if (cat.includes("allegation")) return "allegation_against_staff";
  if (cat.includes("police")) return "police_involvement";
  if (ce.is_safeguarding || cat.includes("protection") || cat.includes("safeguard")) return "child_protection";
  return "serious_incident";
}

// Builds a *pending* notifiable event from a triaged care event. It is queued in
// `ofsted_status: "pending"` with no notification recorded — a human still has to
// review and submit it. This never sends anything to Ofsted.
export function buildReg40NotifiableDraft(
  ce: CareEvent,
  opts: { reportedBy: string; note?: string | null; today: string },
): Partial<NotifiableEvent> {
  const emptyNotification = { body: "", notified_date: null, method: "", reference: null };
  return {
    date: opts.today,
    event_type: reg40NotifiableEventType(ce),
    child_id: ce.child_id,
    summary: ce.title || "Reg 40 notifiable event",
    detail: excerpt(ce.content, 1000),
    immediate_action: opts.note ?? "",
    reported_by: opts.reportedBy,
    ofsted_status: "pending", // queued for a human to notify — NOT sent
    ofsted: { ...emptyNotification },
    local_authority: { ...emptyNotification },
    placing: { ...emptyNotification },
    follow_up: "",
    lesson_learned: "",
  };
}
