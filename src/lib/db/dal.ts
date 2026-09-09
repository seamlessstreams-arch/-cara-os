/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CARA — Async Dual-Mode Data Access Layer (DAL)
 *
 * When Supabase is enabled and credentials are configured, all reads/writes
 * go to Supabase Cloud. Otherwise falls back to the in-memory store.
 *
 * Usage in API routes:
 *   import { dal } from "@/lib/db"
 *   const staff = await dal.staff.findAll()
 *   const task  = await dal.tasks.create({ ... })
 *
 * Every method returns a Promise, even when using the sync in-memory fallback.
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { db, getStore, type EarlyAccessRequest } from "./store";
import { facilityStore } from "./facility-store";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import * as sq from "@/lib/supabase/queries";
import { todayStr } from "@/lib/utils";
import type { BehaviourSupportPlan } from "@/types/extended";
// Row types for the child-data collections below. The in-memory store already
// holds these exact types; only the Supabase path was untyped, and its `any`
// was collapsing the union — so every consumer had to annotate `(x: any)`.
import type {
  YoungPerson, Incident, DailyLogEntry, Home, StaffMember, Task, Shift,
  LeaveRequest, TrainingRecord, Medication, MedicationAdministration,
  Supervision, Document, Expense, CareForm, DocumentReadReceipt,
} from "@/types";
import type {
  BehaviourEntry,
  KeyWorkingSession,
  MissingEpisode,
  RiskAssessment,
  LACReview,
  LACReviewAttendee,
  LACReviewAction,
  RestraintRecord,
  RestraintStaffEntry,
  RestraintInjury, Audit, ChronologyEntry, HandoverEntry, MaintenanceItem,
  Building, BuildingCheck, Vehicle, VehicleCheck, Notification as AppNotification,
} from "@/types/extended";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

/** Get a connected Supabase client, or null when in-memory mode */
function sb() {
  return createServerClient();
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE COLLECTIONS — Supabase-backed with in-memory fallback
// ─────────────────────────────────────────────────────────────────────────────

/** `generic_records` is not in the generated Database types, so its columns
 *  resolve to `never`. Declaring the row here keeps the reads below checked
 *  against a real shape instead of turning checking off with `any`. */
interface GenericRecordRow {
  id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Live Supabase rows and the in-memory app types share the same columns
// (field census 2026-09-06, fix/typed-queries-facade). Rows may carry `null`
// where app types say `undefined` — consumers handle both, and have since
// go-live. This is the ONE documented seam between the generated Row types
// and the app contract; field drift is caught by the census, not per-site.
function asApp<T>(rows: unknown): T {
  return rows as T;
}


/** Keywork consolidation: cs_key_work_sessions (what key-working-service
 *  captures) projected into the KeyWorkingSession shape the 30+ intelligence
 *  readers expect. Honest mapping only — moods come from the single recorded
 *  child_mood (before == after: no improvement is ever fabricated), and the
 *  fields capture never records (follow-up tracking, confidentiality) stay
 *  null rather than defaulting to a credit. care_plan_review projects as
 *  "review".
 */
function keyworkRowToSession(r: Database["public"]["Tables"]["cs_key_work_sessions"]["Row"]): KeyWorkingSession {
  const strings = (j: unknown): string[] => (Array.isArray(j) ? j.map(String) : []);
  const mood = (r.child_mood != null && r.child_mood >= 1 && r.child_mood <= 5
    ? (r.child_mood as 1 | 2 | 3 | 4 | 5) : null);
  const typeMap: Record<string, KeyWorkingSession["type"]> = {
    one_to_one: "one_to_one", group: "group", informal: "informal",
    therapeutic: "therapeutic", life_skills: "life_skills", care_plan_review: "review",
  };
  return {
    id: r.id,
    child_id: r.child_id ?? "",
    staff_id: r.key_worker_id ?? "",
    date: r.completed_date ?? r.planned_date ?? r.created_at.slice(0, 10),
    type: typeMap[r.session_type ?? ""] ?? "one_to_one",
    duration: r.duration_minutes ?? 0,
    location: r.location ?? "",
    topics: strings(r.topics_covered),
    child_voice: r.child_voice ?? "",
    worker_observations: strings(r.positive_observations).join("; "),
    actions_agreed: strings(r.actions),
    mood_before: mood,
    mood_after: mood,
    follow_up: strings(r.next_session_topics).join(", ") || null,
    follow_up_date: null,
    follow_up_completed: null,
    confidential: r.safeguarding_concerns != null && r.safeguarding_concerns.trim() !== "" ? true : null,
    linked_goals: [],
    home_id: r.home_id ?? "",
    created_at: r.created_at,
  };
}


/** Behaviour consolidation: cs_behaviour_entries (the ABC capture) projected
 *  into the BehaviourEntry shape the intelligence readers expect. direction
 *  is binary (only the 'positive' category is positive); intensity is a
 *  DOCUMENTED translation of the recorder's own category — safety-first, so
 *  self-harm and aggression never under-alarm: crisis→critical,
 *  self_harm/aggression/escalating→high, positive→low, the rest→moderate.
 *  trigger is the recorded antecedent (the A of ABC), strategy_used the
 *  de-escalation list — nothing here is invented.
 */
function behaviourRowToEntry(r: Database["public"]["Tables"]["cs_behaviour_entries"]["Row"]): BehaviourEntry {
  const strings = (j: unknown): string[] => (Array.isArray(j) ? j.map(String) : []);
  const cat = r.category ?? "";
  const intensity: BehaviourEntry["intensity"] =
    cat === "crisis" ? "critical"
    : cat === "self_harm" || cat === "aggression" || cat === "escalating" ? "high"
    : cat === "positive" ? "low"
    : "moderate";
  return {
    id: r.id,
    child_id: r.child_id ?? "",
    date: r.date ?? r.created_at.slice(0, 10),
    time: (r.time ?? "").slice(0, 5),
    direction: cat === "positive" ? "positive" : "concern",
    intensity,
    title: (r.description ?? r.behaviour ?? "").slice(0, 80),
    antecedent: r.antecedent ?? "",
    behaviour: r.behaviour ?? r.description ?? "",
    consequence: r.consequence ?? "",
    trigger: r.antecedent ?? "",
    strategy_used: strings(r.de_escalation_used).join(", "),
    outcome: r.outcome ?? "",
    recorded_by: r.recorded_by ?? "",
    created_at: r.created_at,
  };
}


// ── Risk consolidation (3 of 6): cs_risk_assessments → RiskAssessment ───────
// Capture records likelihood×impact per category; intelligence reads a
// domain-keyed assessment. Honest projection rules:
//  • category → domain only where exact or professionally standard
//    (radicalisation is exploitation-shaped harm under Prevent/EFH). bullying
//    (direction-ambiguous: being bullied ≠ bullying others) and the
//    operational categories (environmental, health_medical, transport,
//    activities) stay capture-only, as do home-level rows with no child — a
//    premises risk cannot wear a child-harm domain. All remain fully visible
//    in the capture surfaces.
//  • current_level = the residual level where the assessor recorded one (the
//    risk as it stands WITH mitigations), else the inherent band; very_low
//    joins low (the intelligence union has no very_low). A row with no
//    recorded level is skipped — it cannot honestly wear one.
//  • previous_level/trend are DERIVED from real history — earlier assessments
//    of the same child+category, compared on the raw five-band scale. A first
//    assessment spans its single reading (previous = current, trend stable):
//    the least-claiming members of the required unions.
//  • status: active/escalated → current (escalated is live — dropping it
//    would under-alarm), mitigated/closed → superseded. An unrecognised
//    status also maps to current: a risk record must never disappear from
//    safety counts because its status string is malformed.
//  • review_date = next_review_date (what the currency engine does overdue
//    arithmetic on; required at capture). Never invented: indicators,
//    contingency_plan, child_views, history_notes and linked_incidents are
//    empty — capture does not record them — and mitigation strings carry
//    effectiveness "not_yet_assessed".
const RISK_CATEGORY_TO_DOMAIN: Record<string, RiskAssessment["domain"]> = {
  self_harm: "self_harm",
  violence_aggression: "aggression",
  absconding: "absconding",
  exploitation: "exploitation",
  radicalisation: "exploitation",
  substance_misuse: "substance_use",
  online_safety: "online_safety",
  fire_setting: "fire_setting",
  sexual_behaviour: "sexual_behaviour",
  emotional_wellbeing: "emotional_harm",
};
const RISK_LEVEL_RANK: Record<string, number> = { very_low: 0, low: 1, medium: 2, high: 3, very_high: 4 };
const RISK_LEVEL_BAND: Record<string, RiskAssessment["current_level"]> = {
  very_low: "low", low: "low", medium: "medium", high: "high", very_high: "very_high",
};
const RISK_STATUS_MAP: Record<string, RiskAssessment["status"]> = {
  active: "current", escalated: "current", under_review: "under_review", mitigated: "superseded", closed: "superseded",
};

function riskRowsToAssessments(rows: Database["public"]["Tables"]["cs_risk_assessments"]["Row"][]): RiskAssessment[] {
  const strings = (j: unknown): string[] => (Array.isArray(j) ? j.map(String) : []);
  const usable = rows.flatMap((r) => {
    const domain = RISK_CATEGORY_TO_DOMAIN[r.category ?? ""];
    const rawLevel = r.residual_risk_level ?? r.current_risk_level;
    if (!r.child_id || !domain || !rawLevel || RISK_LEVEL_RANK[rawLevel] === undefined) return [];
    return [{ r, childId: r.child_id, domain, rawLevel }];
  });
  const threads = new Map<string, typeof usable>();
  for (const u of usable) {
    const key = `${u.childId}|${u.r.category}`;
    const t = threads.get(key);
    if (t) t.push(u); else threads.set(key, [u]);
  }
  const out: RiskAssessment[] = [];
  for (const thread of threads.values()) {
    thread.sort((a, b) => a.r.created_at.localeCompare(b.r.created_at));
    for (let i = 0; i < thread.length; i++) {
      const { r, childId, domain, rawLevel } = thread[i];
      const prevRaw = i > 0 ? thread[i - 1].rawLevel : rawLevel;
      const trend: RiskAssessment["trend"] =
        RISK_LEVEL_RANK[rawLevel] > RISK_LEVEL_RANK[prevRaw] ? "increasing"
        : RISK_LEVEL_RANK[rawLevel] < RISK_LEVEL_RANK[prevRaw] ? "decreasing"
        : "stable";
      out.push({
        id: r.id,
        child_id: childId,
        domain,
        current_level: RISK_LEVEL_BAND[rawLevel],
        previous_level: RISK_LEVEL_BAND[prevRaw],
        trend,
        status: RISK_STATUS_MAP[r.status ?? ""] ?? "current",
        assessed_by: r.assessor_id ?? "",
        assessed_date: r.created_at.slice(0, 10),
        review_date: r.next_review_date ?? r.review_date ?? "",
        triggers: strings(r.triggers),
        indicators: [],
        mitigations: strings(r.mitigations).map((strategy) => ({
          strategy, responsible: "", effectiveness: "not_yet_assessed" as const,
        })),
        contingency_plan: "",
        child_views: "",
        history_notes: "",
        linked_incidents: [],
        home_id: r.home_id ?? "",
        created_at: r.created_at,
      });
    }
  }
  out.sort((a, b) => b.assessed_date.localeCompare(a.assessed_date));
  return out;
}

// ── LAC reviews consolidation (4 of 6): cs_lac_reviews → LACReview ──────────
// TWO services write this table in different vocabularies — lac-review-service
// (IRO, six-member participation scale, domain-reviewed flags, an 8-member
// outcome) and placement-service (chair, attendee names, plan changes,
// boolean participation). Honest projection rules:
//  • only COMPLETED rows project — a scheduled/cancelled/overdue row is not a
//    held review, and projecting one would forge statutory compliance.
//  • vocabulary translation is exact or least-claiming: "second" is the
//    3-month review, which the intelligence union names first_review (its own
//    label says "(3 months)"); too_young keeps the recorded FACT
//    (did_not_participate) and loses only the reason; an unknown review_type
//    label projects as "additional" rather than claim a statutory slot.
//  • outcome: the recorded member translated (escalation_required survives —
//    losing the one alarm member would under-alarm; plan_endorsed /
//    permanence_confirmed / no_change all state the placement continues);
//    where no outcome was recorded it is DERIVED from the completion record
//    (plan changes → care_plan_amended, agreed actions → actions_agreed) or
//    stays null — never defaulted.
//  • attendees carry exactly what was recorded: role-only entries from the
//    attendance booleans, name-only entries from the chair's list.
//  • care_plan_updated: the jsonb columns have no '[]' default, so a null
//    plan_changes means the question was never asked (→ null) while a
//    recorded empty list from the completion form means no changes (→ false).
//  • never invented: venue, child views text (the capture records only THAT
//    views were recorded, not the words), placement_stability (no capture
//    field judges it — stays null), recorded_by. A-side action strings carry
//    completed: false — an action with no completion record is outstanding.
const LAC_TYPE_MAP: Record<string, LACReview["review_type"]> = {
  initial: "initial",
  second: "first_review",
  first_review: "first_review",
  subsequent: "subsequent",
  emergency: "emergency",
  disruption: "disruption",
  additional: "additional",
  pre_discharge: "pre_discharge",
};
const LAC_PART_MAP: Record<string, LACReview["child_participation"]> = {
  attended_spoke: "attended",
  attended: "attended",
  attended_advocate: "advocate_attended",
  advocate_attended: "advocate_attended",
  written_views: "views_submitted",
  views_via_worker: "views_submitted",
  views_submitted: "views_submitted",
  did_not_participate: "did_not_participate",
  too_young: "did_not_participate",
};
const LAC_OUTCOME_MAP: Record<string, NonNullable<LACReview["outcome"]>> = {
  plan_endorsed: "placement_continues",
  permanence_confirmed: "placement_continues",
  no_change: "placement_continues",
  placement_continues: "placement_continues",
  plan_amended: "care_plan_amended",
  care_plan_amended: "care_plan_amended",
  placement_change: "placement_change",
  return_home: "return_home",
  further_assessment: "actions_agreed",
  actions_agreed: "actions_agreed",
  escalation_required: "escalation_required",
};

function lacRowToReview(r: Database["public"]["Tables"]["cs_lac_reviews"]["Row"]): LACReview | null {
  if ((r.status ?? "scheduled") !== "completed" || !r.child_id) return null;
  const strings = (j: unknown): string[] => (Array.isArray(j) ? j.map(String) : []);

  const attendees: LACReviewAttendee[] = [];
  if (r.parent_attended) attendees.push({ name: "", role: "Parent" });
  if (r.social_worker_attended) attendees.push({ name: "", role: "Social Worker" });
  if (r.key_worker_attended) attendees.push({ name: "", role: "Key Worker" });
  for (const name of strings(r.attendees)) attendees.push({ name, role: "" });

  const discussions: string[] = [];
  if (r.placement_stability_discussed) discussions.push("Placement stability");
  if (r.permanence_plan_reviewed) discussions.push("Permanence plan");
  if (r.health_reviewed) discussions.push("Health");
  if (r.education_reviewed) discussions.push("Education");

  const actions: LACReviewAction[] = strings(r.actions_agreed).map((action) => ({
    action, owner: "", due_date: "", completed: false,
  }));
  for (const j of Array.isArray(r.actions) ? r.actions : []) {
    const o = (j ?? {}) as Record<string, unknown>;
    actions.push({
      action: String(o.action ?? ""),
      owner: String(o.responsible ?? ""),
      due_date: String(o.due_date ?? ""),
      completed: o.completed === true,
    });
  }

  const planChanges = Array.isArray(r.plan_changes) ? strings(r.plan_changes) : null;
  const outcome: LACReview["outcome"] =
    LAC_OUTCOME_MAP[r.outcome ?? ""]
    ?? (planChanges && planChanges.length > 0 ? "care_plan_amended"
      : actions.length > 0 ? "actions_agreed"
      : null);

  return {
    id: r.id,
    child_id: r.child_id,
    date: r.review_date ?? r.created_at.slice(0, 10),
    review_type: LAC_TYPE_MAP[r.review_type ?? ""] ?? "additional",
    iro: r.iro_name ?? r.chaired_by ?? "",
    venue: "",
    attendees,
    child_participation:
      LAC_PART_MAP[r.child_participation ?? ""]
      ?? (r.child_participated === true ? "attended" : "did_not_participate"),
    child_views: "",
    key_discussions: discussions,
    recommendations: strings(r.recommendations),
    outcome,
    actions_agreed: actions,
    next_review_date: r.next_review_due ?? r.next_review_date ?? "",
    placement_stability: null,
    care_plan_updated: planChanges ? planChanges.length > 0 : null,
    notes: r.notes ?? "",
    recorded_by: "",
    home_id: r.home_id ?? "",
    created_at: r.created_at,
  };
}

// ── Restraints consolidation (5 of 6): cs_restraint_records → RestraintRecord
// Single writer (restraint-service). cs_restraint_debriefs is promoted
// alongside as a standalone capture read through its own service — the two
// tables share no FK and are NEVER joined by child+date inference. Honest
// projection rules:
//  • reason stays null — no capture field records the statutory ground, and
//    a physical intervention must never wear a legal justification the
//    recorder did not give. staff_debriefed and medical_check_completed stay
//    null for the same shape: the form never asks, and an unasked question
//    is a form gap, not a compliance failure (readers use recorded-subset
//    denominators).
//  • end_time is DERIVED from the recorded start + recorded duration — pure
//    wall-clock arithmetic on two recorded facts; absent either, "".
//  • description composes the recorded technique and outcome text — real
//    prose only, joined with a dash, nothing authored.
//  • review_status: manager_reviewed true → reviewed; otherwise pending_rm —
//    not-yet-reviewed is the honest state of an unreviewed record.
//  • notifications_sent carries one entry per recorded-true notified flag,
//    with the date "" (the capture records WHETHER, not when).
//  • child_debriefed is the record's own debrief_completed answer; an absent
//    answer reads false — the chase-it direction, never assurance.
//  • never invented: justification, witnessed_by, linked incident, per-staff
//    technique; the child's own views text has no intelligence field and
//    stays capture-visible (noted for the recording-philosophy call).
const RESTRAINT_TYPE_SET = new Set<RestraintRecord["restraint_type"]>(["standing", "seated", "ground", "escort", "other"]);

function restraintRowToRecord(r: Database["public"]["Tables"]["cs_restraint_records"]["Row"]): RestraintRecord | null {
  if (!r.child_id) return null;
  const strings = (j: unknown): string[] => (Array.isArray(j) ? j.map(String) : []);
  const objs = (j: unknown): Record<string, unknown>[] =>
    Array.isArray(j) ? j.map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {})) : [];

  const staff: RestraintStaffEntry[] = objs(r.staff_involved).map((o) => ({
    staff_id: String(o.staff_name ?? o.staff_id ?? ""),
    role: String(o.role_in_incident ?? o.role ?? ""),
    technique: "",
    ...(typeof o.trained === "boolean" ? { team_teach_trained: o.trained } : {}),
  }));

  const injury = (person: string) => (o: Record<string, unknown>): RestraintInjury => ({
    person: String(o.person_name ?? person),
    injury: [o.description, o.body_location].filter(Boolean).map(String).join(" — "),
    treatment: String(o.treatment_given ?? ""),
  });
  const injuries = [
    ...objs(r.injuries_child).map(injury("Child")),
    ...objs(r.injuries_staff).map(injury("Staff")),
  ];

  const start = (r.incident_time ?? "").slice(0, 5);
  let end = "";
  if (start && typeof r.duration_minutes === "number") {
    const [h, m] = start.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      const t = (h * 60 + m + r.duration_minutes) % 1440;
      end = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    }
  }

  const notifications: RestraintRecord["notifications_sent"] = [];
  if (r.ofsted_notified) notifications.push({ party: "Ofsted", date: "" });
  if (r.parent_carer_notified) notifications.push({ party: "Parent/Carer", date: "" });
  if (r.social_worker_notified) notifications.push({ party: "Social Worker", date: "" });

  const rawType = r.restraint_type ?? "";
  return {
    id: r.id,
    date: r.incident_date ?? r.created_at.slice(0, 10),
    start_time: start,
    end_time: end,
    duration: r.duration_minutes ?? 0,
    child_id: r.child_id,
    staff_involved: staff,
    reason: null,
    restraint_type: (RESTRAINT_TYPE_SET.has(rawType as RestraintRecord["restraint_type"]) ? rawType : "other") as RestraintRecord["restraint_type"],
    antecedent: r.antecedent ?? "",
    behaviour: r.behaviour_description ?? "",
    de_escalation_attempts: strings(r.de_escalation_attempted),
    justification: "",
    description: [r.technique_used, r.outcome].filter(Boolean).join(" — "),
    injuries,
    child_debriefed: r.debrief_completed === true,
    child_debrief_notes: r.debrief_notes ?? "",
    staff_debriefed: null,
    witnessed_by: [],
    review_status: r.manager_reviewed === true ? "reviewed" : "pending_rm",
    review_notes: r.manager_review_notes ?? "",
    reviewed_by: "",
    linked_incident_id: "",
    notifications_sent: notifications,
    body_map_completed: r.body_map_completed === true,
    medical_check_completed: null,
    recorded_by: r.created_by ?? "",
    created_at: r.created_at,
  };
}

export const dal = {
  // ── Home ──────────────────────────────────────────────────────────────────
  // The one home this deployment serves. In demo mode this is the seeded home
  // (blanked to an empty identity under NEXT_PUBLIC_CARA_MODE=live); when
  // Supabase is connected it is the row SUPABASE_HOME_ID points at.
  home: {
    async get() {
      const c = sb();
      if (c) return asApp<Home | null>(await sq.getHome(c, homeId()));
      return db.home.get();
    },
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: {
    async findAll(filters?: { role?: string; employment_type?: string; status?: string }) {
      const c = sb();
      if (c) return asApp<StaffMember[]>(await sq.getStaff(c, homeId(), filters));
      return db.staff.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return asApp<StaffMember | null>(await sq.getStaffById(c, id));
      return db.staff.findById(id);
    },
    async findActive() {
      const c = sb();
      if (c) return asApp<StaffMember[]>(await sq.getStaff(c, homeId(), { status: "active" }));
      return db.staff.findActive();
    },
    async create(data: Parameters<typeof db.staff.create>[0]) {
      const c = sb();
      if (c) return sq.createStaffMember(c, { ...data, home_id: homeId() });
      return db.staff.create(data);
    },
    /** Pre-employment checks only — the allowlist lives in queries.ts so both
     *  modes write exactly the same set of columns. */
    async updateSaferRecruitment(id: string, data: Parameters<typeof db.staff.update>[1]) {
      const c = sb();
      if (c) return sq.updateStaffSaferRecruitment(c, id, data);
      return db.staff.update(id, sq.saferRecruitmentColumns(data));
    },
  },

  // ── Young People ──────────────────────────────────────────────────────────
  youngPeople: {
    async findAll(status?: string): Promise<YoungPerson[]> {
      const c = sb();
      if (c) return asApp<YoungPerson[]>(await sq.getYoungPeople(c, homeId(), status));
      return db.youngPeople.findAll();
    },
    async findById(id: string): Promise<YoungPerson | null> {
      const c = sb();
      if (c) return asApp<YoungPerson | null>(await sq.getYoungPersonById(c, id));
      return db.youngPeople.findById(id) ?? null;
    },
    async findCurrent(): Promise<YoungPerson[]> {
      const c = sb();
      if (c) return asApp<YoungPerson[]>(await sq.getYoungPeople(c, homeId(), "current"));
      return db.youngPeople.findCurrent();
    },
    async create(data: Parameters<typeof db.youngPeople.create>[0]) {
      const c = sb();
      if (c) return sq.createYoungPerson(c, { ...data, home_id: homeId() });
      return db.youngPeople.create(data);
    },
    async update(id: string, data: Parameters<typeof db.youngPeople.update>[1]) {
      const c = sb();
      if (c) return sq.updateYoungPerson(c, id, data);
      return db.youngPeople.update(id, data);
    },
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  tasks: {
    async findAll(filters?: { assigned_to?: string; status?: string; priority?: string; category?: string; overdue?: boolean }) {
      const c = sb();
      if (c) return asApp<Task[]>(await sq.getTasks(c, homeId(), filters));
      return db.tasks.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return asApp<Task | null>(await sq.getTaskById(c, id));
      return db.tasks.findById(id);
    },
    async findActive() {
      const c = sb();
      if (c) return asApp<Task[]>(await sq.getActiveTasks(c, homeId()));
      return db.tasks.findActive();
    },
    async findOverdue() {
      const c = sb();
      if (c) return asApp<Task[]>(await sq.getTasks(c, homeId(), { overdue: true }));
      return db.tasks.findOverdue();
    },
    async create(data: Parameters<typeof db.tasks.create>[0]) {
      const c = sb();
      if (c) return sq.createTask(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createTask>[1]);
      return db.tasks.create(data);
    },
    async update(id: string, data: Parameters<typeof db.tasks.update>[1]) {
      const c = sb();
      if (c) return sq.updateTask(c, id, data);
      // In-memory fallback: status→completed uses the richer complete(); else generic update.
      if (data.status === "completed") return db.tasks.complete(id, data.completed_by ?? "system", data.evidence_note ?? undefined);
      return db.tasks.update(id, data);
    },
  },

  // ── Incidents ─────────────────────────────────────────────────────────────
  incidents: {
    async findAll(filters?: { status?: string; child_id?: string; needs_oversight?: boolean }): Promise<Incident[]> {
      const c = sb();
      if (c) return asApp<Incident[]>(await sq.getIncidents(c, homeId(), filters));
      return db.incidents.findAll();
    },
    async findById(id: string): Promise<Incident | null> {
      const c = sb();
      if (c) return asApp<Incident | null>(await sq.getIncidentById(c, id));
      return db.incidents.findById(id) ?? null;
    },
    async create(data: Parameters<typeof db.incidents.create>[0]) {
      const c = sb();
      if (c) return sq.createIncident(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createIncident>[1]);
      return db.incidents.create(data);
    },
    async update(id: string, data: Parameters<typeof db.incidents.update>[1]) {
      const c = sb();
      if (c) return sq.updateIncident(c, id, data as Parameters<typeof sq.updateIncident>[2]);
      return db.incidents.update(id, data);
    },
    async addOversight(id: string, note: string, by: string) {
      const c = sb();
      if (c) return sq.updateIncident(c, id, { oversight_note: note, oversight_by: by, oversight_at: new Date().toISOString() });
      return db.incidents.addOversight(id, note, by);
    },
  },

  // ── Missing Episodes ──────────────────────────────────────────────────────
  missingEpisodes: {
    async findAll(filters?: { child_id?: string; status?: string; risk_level?: string }): Promise<MissingEpisode[]> {
      const c = sb();
      if (c) return asApp<MissingEpisode[]>(await sq.getMissingEpisodes(c, homeId(), filters));
      return db.missingEpisodes.findAll();
    },
    async create(data: Parameters<typeof db.missingEpisodes.create>[0]) {
      const c = sb();
      if (c) return sq.createMissingEpisode(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createMissingEpisode>[1]);
      return db.missingEpisodes.create(data);
    },
    async patch(id: string, data: Parameters<typeof db.missingEpisodes.patch>[1]) {
      const c = sb();
      if (c) {
        // Supabase doesn't have a specific patch — use generic update
        return (await c.from("missing_episodes").update(data as never).eq("id", id).select().single()).data;
      }
      return db.missingEpisodes.patch(id, data);
    },
  },

  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts: {
    /** Shifts for the week beginning `weekStart` (defaults to the current week). */
    async findAll(weekStart?: string) {
      const c = sb();
      if (c) return asApp<Shift[]>(await sq.getShiftsForWeek(c, homeId(), weekStart ?? todayStr()));
      const all = db.shifts.findAll();
      if (!weekStart) return all;
      const end = new Date(weekStart + "T00:00:00Z");
      end.setUTCDate(end.getUTCDate() + 7);
      const endStr = end.toISOString().slice(0, 10);
      return all.filter((s) => s.date >= weekStart && s.date < endStr);
    },
    async findToday() {
      const c = sb();
      if (c) return asApp<Shift[]>(await sq.getShiftsToday(c, homeId()));
      return db.shifts.findToday();
    },
    async findByStaff(staffId: string) {
      const c = sb();
      if (c) return asApp<Shift[]>(await sq.getShiftsByStaff(c, homeId(), staffId));
      return db.shifts.findByStaff(staffId);
    },
    async create(data: Parameters<typeof db.shifts.create>[0]) {
      const c = sb();
      if (c) return sq.createShift(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createShift>[1]);
      return db.shifts.create(data);
    },
    async update(id: string, data: Parameters<typeof db.shifts.update>[1]) {
      const c = sb();
      if (c) {
        return (await c.from("shifts").update(data as never).eq("id", id).select().single()).data;
      }
      return db.shifts.update(id, data);
    },
  },

  // ── Leave ─────────────────────────────────────────────────────────────────
  leave: {
    async findAll(filters?: { staff_id?: string; status?: string; leave_type?: string }) {
      const c = sb();
      if (c) return asApp<LeaveRequest[]>(await sq.getLeaveRequests(c, homeId(), filters));
      return db.leave.findAll();
    },
    async findPending() {
      const c = sb();
      if (c) return asApp<LeaveRequest[]>(await sq.getLeaveRequests(c, homeId(), { status: "pending" }));
      return db.leave.findPending();
    },
    async findOnLeaveToday() {
      const c = sb();
      if (c) return asApp<LeaveRequest[]>(await sq.getLeaveOnDate(c, homeId(), todayStr()));
      return db.leave.findOnLeaveToday();
    },
    async create(data: Parameters<typeof db.leave.create>[0]) {
      const c = sb();
      if (c) return sq.createLeaveRequest(c, { ...data, home_id: homeId() });
      return db.leave.create(data);
    },
  },

  // ── Training ──────────────────────────────────────────────────────────────
  training: {
    async findAll(filters?: { staff_id?: string; status?: string; category?: string }) {
      const c = sb();
      if (c) return asApp<TrainingRecord[]>(await sq.getTrainingRecords(c, homeId(), filters));
      return db.training.findAll();
    },
    async findByStaff(staffId: string) {
      const c = sb();
      if (c) return asApp<TrainingRecord[]>(await sq.getTrainingRecords(c, homeId(), { staff_id: staffId }));
      return db.training.findByStaff(staffId);
    },
    async create(data: Parameters<typeof db.training.create>[0]) {
      const c = sb();
      if (c) {
        return (await c.from("training_records").insert({ ...data, home_id: homeId() } as never).select().single()).data;
      }
      return db.training.create(data);
    },
    async patch(id: string, data: Parameters<typeof db.training.patch>[1]) {
      const c = sb();
      if (c) {
        return (await c.from("training_records").update(data as never).eq("id", id).select().single()).data;
      }
      return db.training.patch(id, data);
    },
  },

  // ── Medications ───────────────────────────────────────────────────────────
  medications: {
    async findAll(childId?: string) {
      const c = sb();
      if (c) return asApp<Medication[]>(await sq.getMedications(c, homeId(), childId));
      return db.medications.findAll();
    },
    async findByChild(childId: string) {
      const c = sb();
      if (c) return asApp<Medication[]>(await sq.getMedications(c, homeId(), childId));
      return db.medications.findByChild(childId);
    },
    async create(data: Parameters<typeof db.medications.create>[0]) {
      const c = sb();
      if (c) return sq.createMedication(c, { ...data, home_id: homeId() });
      return db.medications.create(data);
    },
  },

  medicationAdministrations: {
    async findAll(filters?: { child_id?: string; medication_id?: string; since?: string }) {
      const c = sb();
      if (c) return asApp<MedicationAdministration[]>(await sq.getMedicationAdministrations(c, homeId(), filters));
      return db.medicationAdministrations.findAll();
    },
    async create(data: Partial<Parameters<typeof sq.createMedicationAdministration>[1]>) {
      const c = sb();
      if (c) return sq.createMedicationAdministration(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createMedicationAdministration>[1]);
      return null; // in-memory doesn't have a generic create
    },
    async update(id: string, data: Parameters<typeof db.medicationAdministrations.administer>[1]) {
      const c = sb();
      if (c) return sq.updateMedicationAdministration(c, id, data as unknown as Parameters<typeof sq.updateMedicationAdministration>[2]);
      return db.medicationAdministrations.administer(id, data);
    },
  },

  // ── Daily Log ─────────────────────────────────────────────────────────────
  dailyLog: {
    async findAll(filters?: { child_id?: string; date?: string; entry_type?: string; days?: number }): Promise<DailyLogEntry[]> {
      const c = sb();
      if (c) return asApp<DailyLogEntry[]>(await sq.getDailyLog(c, homeId(), filters));
      return db.dailyLog.findAll();
    },
    async findByChild(childId: string): Promise<DailyLogEntry[]> {
      const c = sb();
      if (c) return asApp<DailyLogEntry[]>(await sq.getDailyLog(c, homeId(), { child_id: childId }));
      return db.dailyLog.findByChild(childId);
    },
    async create(data: Parameters<typeof db.dailyLog.create>[0]) {
      const c = sb();
      if (c) return sq.createDailyLogEntry(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createDailyLogEntry>[1]);
      return db.dailyLog.create(data);
    },
  },

  // ── Supervisions ──────────────────────────────────────────────────────────
  supervisions: {
    async findAll(filters?: { staff_id?: string; supervisor_id?: string; status?: string; overdue?: boolean }) {
      const c = sb();
      if (c) return asApp<Supervision[]>(await sq.getSupervisions(c, homeId(), filters));
      // In-memory fallback: apply the same filters client-side so demo mode
      // matches live behavior. The primitives (findByStaff, findScheduled,
      // etc.) exist on store.supervisions if a single-filter fast path is ever
      // needed; findAll+filter keeps parity for the multi-filter case.
      let list = db.supervisions.findAll();
      if (filters?.staff_id) list = list.filter((s) => s.staff_id === filters.staff_id);
      if (filters?.supervisor_id) list = list.filter((s) => s.supervisor_id === filters.supervisor_id);
      if (filters?.status) list = list.filter((s) => s.status === filters.status);
      if (filters?.overdue) {
        const today = todayStr();
        list = list.filter((s) => s.status === "scheduled" && s.scheduled_date < today);
      }
      return list;
    },
    async findById(id: string) {
      const c = sb();
      if (c) return asApp<Supervision | null>(await sq.getSupervisionById(c, id));
      return db.supervisions.findById(id);
    },
    async create(data: Parameters<typeof db.supervisions.create>[0]) {
      const c = sb();
      if (c) return sq.createSupervision(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createSupervision>[1]);
      return db.supervisions.create(data);
    },
    async update(id: string, data: Parameters<typeof db.supervisions.update>[1]) {
      const c = sb();
      if (c) return sq.updateSupervision(c, id, data as Parameters<typeof sq.updateSupervision>[2]);
      return db.supervisions.update(id, data);
    },
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  documents: {
    async findAll(filters?: { category?: string; requires_read_sign?: boolean }) {
      const c = sb();
      if (c) return asApp<Document[]>(await sq.getDocuments(c, homeId(), filters));
      return db.documents.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("documents").select("*").eq("id", id).single()).data;
      }
      return db.documents.findById(id);
    },
    async create(data: Parameters<typeof db.documents.create>[0]) {
      const c = sb();
      if (c) return sq.createDocument(c, { ...data, home_id: homeId() });
      return db.documents.create(data);
    },
  },

  documentReadReceipts: {
    async findAll() {
      // No Supabase list query yet — always in-memory. When a query lands,
      // swap in `if (sb()) return sq.getAllDocumentReadReceipts(c, homeId());`
      return db.documentReadReceipts.findAll();
    },
    async findByDocument(docId: string) {
      const c = sb();
      if (c) return asApp<DocumentReadReceipt[]>(await sq.getDocumentReadReceipts(c, [docId]));
      return db.documentReadReceipts.findByDocument(docId);
    },
    async upsertSignature(docId: string, staffId: string) {
      const c = sb();
      if (c) return sq.upsertDocumentReadReceipt(c, docId, staffId);
      return db.documentReadReceipts.upsertSignature(docId, staffId);
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    async findAll(filters?: { status?: string; submitted_by?: string }) {
      const c = sb();
      if (c) return asApp<Expense[]>(await sq.getExpenses(c, homeId(), filters));
      return db.expenses.findAll();
    },
    async create(data: Parameters<typeof db.expenses.create>[0]) {
      const c = sb();
      if (c) return sq.createExpense(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createExpense>[1]);
      return db.expenses.create(data);
    },
    async update(id: string, data: Parameters<typeof db.expenses.update>[1]) {
      const c = sb();
      if (c) return sq.updateExpense(c, id, data);
      return db.expenses.update(id, data);
    },
  },

  // ── Care Forms ────────────────────────────────────────────────────────────
  careForms: {
    async findAll(filters?: { status?: string; form_type?: string; linked_child_id?: string; priority?: string; pending_review?: boolean }) {
      const c = sb();
      if (c) return asApp<CareForm[]>(await sq.getCareForms(c, homeId(), filters));
      return db.careForms.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return asApp<CareForm | null>(await sq.getCareFormById(c, id));
      return db.careForms.findById(id);
    },
    async create(data: Parameters<typeof db.careForms.create>[0]) {
      const c = sb();
      if (c) return sq.createCareForm(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createCareForm>[1]);
      return db.careForms.create(data);
    },
    async update(id: string, data: Parameters<typeof db.careForms.update>[1]) {
      const c = sb();
      if (c) return sq.updateCareForm(c, id, data as Parameters<typeof sq.updateCareForm>[2]);
      return db.careForms.update(id, data);
    },
    async submit(id: string, by: string) {
      const c = sb();
      if (c) return sq.updateCareForm(c, id, { status: "submitted", submitted_at: new Date().toISOString(), submitted_by: by, updated_by: by });
      return db.careForms.submit(id, by);
    },
    async approve(id: string, by: string, notes?: string) {
      const c = sb();
      if (c) return sq.updateCareForm(c, id, { status: "approved", approved_at: new Date().toISOString(), approved_by: by, reviewed_by: by, reviewed_at: new Date().toISOString(), review_notes: notes ?? null, updated_by: by });
      return db.careForms.approve(id, by, notes);
    },
  },

  // ── QA Audits ─────────────────────────────────────────────────────────────
  qaAudits: {
    async findAll(filters?: { status?: string; category?: string }) {
      const c = sb();
      if (c) return asApp<Audit[]>(await sq.getQaAudits(c, homeId(), filters));
      return db.audits.findAll();
    },
    async create(data: Parameters<typeof db.audits.create>[0]) {
      const c = sb();
      if (c) return sq.createQaAudit(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createQaAudit>[1]);
      return db.audits.create(data);
    },
    async update(id: string, data: Parameters<typeof db.audits.update>[1]) {
      const c = sb();
      if (c) return sq.updateQaAudit(c, id, data as unknown as Parameters<typeof sq.updateQaAudit>[2]);
      return db.audits.update(id, data);
    },
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  maintenance: {
    async findAll(filters?: { status?: string; priority?: string }) {
      const c = sb();
      if (c) return asApp<MaintenanceItem[]>(await sq.getMaintenanceItems(c, homeId(), filters));
      return db.maintenance.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("maintenance_items").select("*").eq("id", id).single()).data;
      }
      return db.maintenance.findById(id);
    },
    async create(data: Parameters<typeof db.maintenance.create>[0]) {
      const c = sb();
      if (c) return sq.createMaintenanceItem(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createMaintenanceItem>[1]);
      return db.maintenance.create(data);
    },
    async update(id: string, data: Parameters<typeof db.maintenance.update>[1]) {
      const c = sb();
      if (c) return sq.updateMaintenanceItem(c, id, data);
      return db.maintenance.update(id, data);
    },
  },

  // ── Chronology ────────────────────────────────────────────────────────────
  chronology: {
    async findAll() {
      const c = sb();
      if (c) return asApp<ChronologyEntry[]>(await sq.getChronologyEntries(c, homeId()));
      return db.chronology.findAll();
    },
    async findByChild(childId: string) {
      const c = sb();
      if (c) return asApp<ChronologyEntry[]>(await sq.getChronologyEntries(c, homeId(), childId));
      return db.chronology.findByChild(childId);
    },
    async create(data: Parameters<typeof db.chronology.create>[0]) {
      const c = sb();
      if (c) return sq.createChronologyEntry(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createChronologyEntry>[1]);
      return db.chronology.create(data);
    },
  },

  // ── Handovers ─────────────────────────────────────────────────────────────
  handovers: {
    async findAll(limit?: number) {
      const c = sb();
      if (c) return asApp<HandoverEntry[]>(await sq.getHandovers(c, homeId(), limit));
      return db.handovers.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("handovers").select("*").eq("id", id).single()).data;
      }
      return db.handovers.findById(id);
    },
    async create(data: Parameters<typeof db.handovers.create>[0]) {
      const c = sb();
      if (c) return sq.createHandover(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createHandover>[1]);
      return db.handovers.create(data);
    },
  },

  // ── Buildings ─────────────────────────────────────────────────────────────
  buildings: {
    async findAll() {
      const c = sb();
      if (c) return asApp<Building[]>(await sq.getBuildings(c, homeId()));
      return facilityStore.buildings.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("buildings").select("*").eq("id", id).single()).data;
      }
      return facilityStore.buildings.findById(id);
    },
    async create(data: Partial<Parameters<typeof sq.createBuilding>[1]>) {
      const c = sb();
      if (c) return sq.createBuilding(c, { ...data, home_id: homeId() });
      return facilityStore.buildings.create(data);
    },
  },

  buildingChecks: {
    async findAll(buildingId?: string) {
      const c = sb();
      if (c) return asApp<BuildingCheck[]>(await sq.getBuildingChecks(c, homeId(), buildingId));
      return facilityStore.buildingChecks.findAll();
    },
    async create(data: Parameters<typeof facilityStore.buildingChecks.create>[0]) {
      const c = sb();
      if (c) return sq.createBuildingCheck(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createBuildingCheck>[1]);
      return facilityStore.buildingChecks.create(data);
    },
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  vehicles: {
    async findAll() {
      const c = sb();
      if (c) return asApp<Vehicle[]>(await sq.getVehicles(c, homeId()));
      return facilityStore.vehicles.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("vehicles").select("*").eq("id", id).single()).data;
      }
      return facilityStore.vehicles.findById(id);
    },
    async create(data: Partial<Parameters<typeof sq.createVehicle>[1]>) {
      const c = sb();
      if (c) return sq.createVehicle(c, { ...data, home_id: homeId() });
      return facilityStore.vehicles.create(data);
    },
  },

  vehicleChecks: {
    async findAll(vehicleId?: string) {
      const c = sb();
      if (c) return asApp<VehicleCheck[]>(await sq.getVehicleChecks(c, homeId(), vehicleId));
      return facilityStore.vehicleChecks.findAll();
    },
    async create(data: Parameters<typeof facilityStore.vehicleChecks.create>[0]) {
      const c = sb();
      if (c) return sq.createVehicleCheck(c, { ...data, home_id: homeId() } as unknown as Parameters<typeof sq.createVehicleCheck>[1]);
      return facilityStore.vehicleChecks.create(data);
    },
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    async findForUser(userId: string) {
      const c = sb();
      if (c) return asApp<AppNotification[]>(await sq.getNotifications(c, homeId(), userId));
      return db.notifications.findForUser(userId);
    },
    async create(data: Parameters<typeof db.notifications.create>[0]) {
      const c = sb();
      if (c) return sq.createNotification(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createNotification>[1]);
      return db.notifications.create(data);
    },
  },

  // ── Safer Recruitment ─────────────────────────────────────────────────────
  vacancies: {
    async findAll() {
      const c = sb();
      if (c) return sq.getVacancies(c, homeId());
      return db.vacancies.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) {
        return (await c.from("vacancies").select("*").eq("id", id).single()).data;
      }
      return db.vacancies.findById(id);
    },
  },

  candidateProfiles: {
    async findAll(vacancyId?: string) {
      const c = sb();
      if (c) return sq.getCandidateProfiles(c, homeId(), vacancyId);
      return db.candidateProfiles.findAll();
    },
    async findById(id: string) {
      const c = sb();
      if (c) return sq.getCandidateById(c, id);
      return db.candidateProfiles.findById(id);
    },
    async create(data: Parameters<typeof db.candidateProfiles.create>[0]) {
      const c = sb();
      if (c) return sq.createCandidateProfile(c, { ...data, home_id: homeId() } as Parameters<typeof sq.createCandidateProfile>[1]);
      return db.candidateProfiles.create(data);
    },
    async update(id: string, data: Parameters<typeof db.candidateProfiles.update>[1]) {
      const c = sb();
      if (c) return sq.updateCandidateProfile(c, id, data);
      return db.candidateProfiles.update(id, data);
    },
  },

  candidateChecks: {
    // DEMO-ONLY list read (2026-08-05): in-memory until a whole-table Supabase
    // query lands (sq.getCandidateChecks is per-candidate only).
    async findAll() {
      return getStore().candidateChecks ?? [];
    },
    async findByCandidate(candidateId: string) {
      const c = sb();
      if (c) return sq.getCandidateChecks(c, candidateId);
      return db.candidateChecks.findByCandidate(candidateId);
    },
    async update(id: string, data: Parameters<typeof db.candidateChecks.update>[1]) {
      const c = sb();
      if (c) return sq.updateCandidateCheck(c, id, data as Parameters<typeof sq.updateCandidateCheck>[2]);
      return db.candidateChecks.update(id, data);
    },
  },

  candidateReferences: {
    async findByCandidate(candidateId: string) {
      const c = sb();
      if (c) return sq.getCandidateReferences(c, candidateId);
      return db.candidateReferences.findByCandidate(candidateId);
    },
    async create(data: Parameters<typeof db.candidateReferences.create>[0]) {
      const c = sb();
      if (c) return sq.createCandidateReference(c, { ...data } as Parameters<typeof sq.createCandidateReference>[1]);
      return db.candidateReferences.create(data);
    },
    async update(id: string, data: Parameters<typeof db.candidateReferences.update>[1]) {
      const c = sb();
      if (c) return sq.updateCandidateReference(c, id, data as Parameters<typeof sq.updateCandidateReference>[2]);
      return db.candidateReferences.update(id, data);
    },
  },

  // ── Intelligence Layer ────────────────────────────────────────────────────
  childExperienceSnapshots: {
    async findByChild(childId: string) {
      const c = sb();
      if (c) return sq.getChildExperienceSnapshots(c, childId);
      return [];
    },
    async findLatest(childId: string) {
      const c = sb();
      if (c) return sq.getLatestChildExperienceSnapshot(c, childId);
      return null;
    },
  },

  patternAlerts: {
    async findAll(filters?: { childId?: string; status?: string; severity?: string }) {
      const c = sb();
      if (c) return sq.getPatternAlerts(c, homeId(), filters);
      return [];
    },
  },

  homeClimateSnapshots: {
    async findAll(limit?: number) {
      const c = sb();
      if (c) return sq.getHomeClimateSnapshots(c, homeId(), limit);
      return [];
    },
    async findLatest() {
      const c = sb();
      if (c) return sq.getLatestHomeClimateSnapshot(c, homeId());
      return null;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — collections routed through DAL for uniform access
  // but currently ALWAYS in-memory (no Supabase table yet). When a table
  // lands for one of these, wire the query in queries.ts and swap the
  // `if (sb())` branch here — routes stay unchanged.
  // ─────────────────────────────────────────────────────────────────────────

  keyWorkingSessions: {
    async findAll(filters?: { child_id?: string; staff_id?: string }): Promise<KeyWorkingSession[]> {
      const c = sb();
      if (c) {
        let q = c.from("cs_key_work_sessions").select("*").order("planned_date", { ascending: false });
        if (filters?.child_id) q = q.eq("child_id", filters.child_id);
        if (filters?.staff_id) q = q.eq("key_worker_id", filters.staff_id);
        const { data, error } = await q;
        if (!error && data) return data.map(keyworkRowToSession);
      }
      let list = db.keyWorkingSessions.findAll();
      if (filters?.child_id) list = list.filter((s) => s.child_id === filters.child_id);
      if (filters?.staff_id) list = list.filter((s) => s.staff_id === filters.staff_id);
      return list;
    },
    async findById(id: string): Promise<KeyWorkingSession | null> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_key_work_sessions").select("*").eq("id", id).single();
        if (!error && data) return keyworkRowToSession(data);
      }
      return db.keyWorkingSessions.findById(id) ?? null;
    },
    async findByChild(childId: string): Promise<KeyWorkingSession[]> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_key_work_sessions").select("*").eq("child_id", childId).order("planned_date", { ascending: false });
        if (!error && data) return data.map(keyworkRowToSession);
      }
      return db.keyWorkingSessions.findByChild(childId);
    },
    async create(data: Parameters<typeof db.keyWorkingSessions.create>[0]) { return db.keyWorkingSessions.create(data); },
    async update(id: string, data: Parameters<typeof db.keyWorkingSessions.update>[1]) { return db.keyWorkingSessions.update(id, data); },
  },

  behaviourLog: {
    async findAll(filters?: { child_id?: string }): Promise<BehaviourEntry[]> {
      const c = sb();
      if (c) {
        let q = c.from("cs_behaviour_entries").select("*").order("date", { ascending: false });
        if (filters?.child_id) q = q.eq("child_id", filters.child_id);
        const { data, error } = await q;
        if (!error && data) return data.map(behaviourRowToEntry);
      }
      let list = db.behaviourLog.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string): Promise<BehaviourEntry | null> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_behaviour_entries").select("*").eq("id", id).single();
        if (!error && data) return behaviourRowToEntry(data);
      }
      return db.behaviourLog.findById(id) ?? null;
    },
    async findByChild(childId: string) { return db.behaviourLog.findByChild(childId); },
    async create(data: Parameters<typeof db.behaviourLog.create>[0]) { return db.behaviourLog.create(data); },
    async update(id: string, data: Parameters<typeof db.behaviourLog.update>[1]) { return db.behaviourLog.update(id, data); },
  },

  riskAssessments: {
    async findAll(filters?: { child_id?: string }): Promise<RiskAssessment[]> {
      const c = sb();
      if (c) {
        let q = c.from("cs_risk_assessments").select("*");
        if (filters?.child_id) q = q.eq("child_id", filters.child_id);
        const { data, error } = await q;
        if (!error && data) return riskRowsToAssessments(data);
      }
      let list = db.riskAssessments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string): Promise<RiskAssessment | null> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_risk_assessments").select("*").eq("id", id).single();
        if (!error && data) {
          // previous_level/trend come from the row's real thread, not the row alone.
          const sib = data.child_id && data.category
            ? await c.from("cs_risk_assessments").select("*").eq("child_id", data.child_id).eq("category", data.category)
            : null;
          const rows = sib && !sib.error && sib.data ? sib.data : [data];
          return riskRowsToAssessments(rows).find((a) => a.id === id) ?? null;
        }
      }
      return db.riskAssessments.findById(id) ?? null;
    },
    async findByChild(childId: string): Promise<RiskAssessment[]> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_risk_assessments").select("*").eq("child_id", childId);
        if (!error && data) return riskRowsToAssessments(data);
      }
      return db.riskAssessments.findByChild(childId);
    },
    // Writes stay on the demo store; live capture goes through risk-assessment-service.
    async create(data: Parameters<typeof db.riskAssessments.create>[0]) { return db.riskAssessments.create(data); },
    async update(id: string, data: Parameters<typeof db.riskAssessments.update>[1]) { return db.riskAssessments.update(id, data); },
  },

  lacReviews: {
    async findAll(filters?: { child_id?: string }): Promise<LACReview[]> {
      const c = sb();
      if (c) {
        let q = c.from("cs_lac_reviews").select("*").order("review_date", { ascending: false });
        if (filters?.child_id) q = q.eq("child_id", filters.child_id);
        const { data, error } = await q;
        if (!error && data) return data.flatMap((r) => lacRowToReview(r) ?? []);
      }
      let list = db.lacReviews.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string): Promise<LACReview | null> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_lac_reviews").select("*").eq("id", id).single();
        if (!error && data) return lacRowToReview(data);
      }
      return db.lacReviews.findById(id) ?? null;
    },
    async findByChild(childId: string): Promise<LACReview[]> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_lac_reviews").select("*").eq("child_id", childId).order("review_date", { ascending: false });
        if (!error && data) return data.flatMap((r) => lacRowToReview(r) ?? []);
      }
      return db.lacReviews.findByChild(childId);
    },
    // Writes stay on the demo store; live capture goes through the two services.
    async create(data: Parameters<typeof db.lacReviews.create>[0]) { return db.lacReviews.create(data); },
  },

  // ── Education consolidation (6 of 6) — the ONE brief pick that does NOT
  // consolidate here. store.educationRecords is an education EVENT LOG
  // (suspensions, managed moves, PEP meetings — the off-rolling scrutiny
  // triggers), a different model from cs_education_records, which is a
  // per-child status PROFILE read directly by education-service. No honest
  // projection bridges a profile back into dated typed events, and the event
  // log's only live-shaped writer is the care-events processor, which is
  // sync-over-store BY DESIGN. So this arm stays demo-only until that spine
  // can persist; the education CAPTURE surface (4 tables) is promoted and
  // typed under #108, exercised by the write-contract proofs, not here.
  educationRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.educationRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.educationRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.educationRecords.findByChild(childId); },
    async create(data: Parameters<typeof db.educationRecords.create>[0]) { return db.educationRecords.create(data); },
    async update(id: string, data: Parameters<typeof db.educationRecords.update>[1]) { return db.educationRecords.update(id, data); },
  },

  trainingRecords: {
    async findAll(filters?: { staff_id?: string }) {
      let list = getStore().trainingRecords;
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      return list;
    },
    async findById(id: string) { return getStore().trainingRecords.find((r) => r.id === id) ?? null; },
    async findByStaff(staffId: string) { return getStore().trainingRecords.filter((r) => r.staff_id === staffId); },
  },

  restraints: {
    async findAll(filters?: { child_id?: string }): Promise<RestraintRecord[]> {
      const c = sb();
      if (c) {
        let q = c.from("cs_restraint_records").select("*").order("incident_date", { ascending: false });
        if (filters?.child_id) q = q.eq("child_id", filters.child_id);
        const { data, error } = await q;
        if (!error && data) return data.flatMap((r) => restraintRowToRecord(r) ?? []);
      }
      let list = db.restraints.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string): Promise<RestraintRecord | null> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_restraint_records").select("*").eq("id", id).single();
        if (!error && data) return restraintRowToRecord(data);
      }
      return db.restraints.findById(id) ?? null;
    },
    async findByChild(childId: string): Promise<RestraintRecord[]> {
      const c = sb();
      if (c) {
        const { data, error } = await c.from("cs_restraint_records").select("*").eq("child_id", childId).order("incident_date", { ascending: false });
        if (!error && data) return data.flatMap((r) => restraintRowToRecord(r) ?? []);
      }
      return db.restraints.findByChild(childId);
    },
    // Writes stay on the demo store; live capture goes through restraint-service.
    async create(data: Parameters<typeof db.restraints.create>[0]) { return db.restraints.create(data); },
  },

  reflectiveSupervisions: {
    async findAll(filters?: { staff_id?: string }) {
      let list = getStore().reflectiveSupervisions;
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      return list;
    },
    async findById(id: string) { return getStore().reflectiveSupervisions.find((r) => r.id === id) ?? null; },
    async findByStaff(staffId: string) { return getStore().reflectiveSupervisions.filter((r) => r.staff_id === staffId); },
    // DEMO-ONLY append (mirrors the in-memory copy). Real persistence is the
    // persistReflectiveSupervision side-channel the route still calls.
    async create(record: NonNullable<ReturnType<typeof getStore>["reflectiveSupervisions"]>[number]) {
      const s = (getStore());
      s.reflectiveSupervisions = s.reflectiveSupervisions ?? [];
      s.reflectiveSupervisions.push(record);
      return record;
    },
  },

  outcomeTargets: {
    async findAll(filters?: { child_id?: string; status?: string; domain?: string }) {
      let list = db.outcomeTargets.findAll();
      if (filters?.child_id) list = list.filter((t) => t.child_id === filters.child_id);
      if (filters?.status) list = list.filter((t) => t.status === filters.status);
      if (filters?.domain) list = list.filter((t) => t.domain === filters.domain);
      return list;
    },
    async findById(id: string) { return db.outcomeTargets.findById(id) ?? null; },
    async findByChild(childId: string) { return db.outcomeTargets.findByChild(childId); },
    async findActive() { return db.outcomeTargets.findActive(); },
    async create(data: Parameters<typeof db.outcomeTargets.create>[0]) { return db.outcomeTargets.create(data); },
  },

  debriefRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.debriefRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.debriefRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.debriefRecords.findByChild(childId); },
    async create(data: Parameters<typeof db.debriefRecords.create>[0]) { return db.debriefRecords.create(data); },
  },

  familyTimeSessions: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.familyTimeSessions.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.familyTimeSessions.findById(id) ?? null; },
    async findByChild(childId: string) { return db.familyTimeSessions.findByChild(childId); },
    async create(data: Parameters<typeof db.familyTimeSessions.create>[0]) { return db.familyTimeSessions.create(data); },
  },

  sanctionRewards: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.sanctionRewards.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.sanctionRewards.findById(id) ?? null; },
    async findByChild(childId: string) { return db.sanctionRewards.findByChild(childId); },
    async create(data: Parameters<typeof db.sanctionRewards.create>[0]) { return db.sanctionRewards.create(data); },
  },

  returnInterviews: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.returnInterviews.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.returnInterviews.findById(id) ?? null; },
    async findByChild(childId: string) { return db.returnInterviews.findByChild(childId); },
    async create(data: Parameters<typeof db.returnInterviews.create>[0]) { return db.returnInterviews.create(data); },
  },

  positiveAchievements: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.positiveAchievements.getAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.positiveAchievements.getAll().find((r) => r.id === id) ?? null; },
    async findByChild(childId: string) { return db.positiveAchievements.getAll().filter((r) => r.child_id === childId); },
    async create(data: Parameters<typeof db.positiveAchievements.create>[0]) { return db.positiveAchievements.create(data); },
    async update(id: string, data: Parameters<typeof db.positiveAchievements.update>[1]) { return db.positiveAchievements.update(id, data); },
  },

  caraRecordingReviews: {
    async findAll(filters?: { user_id?: string; child_id?: string }) {
      let list = getStore().caraRecordingReviews;
      if (filters?.user_id) list = list.filter((r) => r.user_id === filters.user_id);
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return getStore().caraRecordingReviews.find((r) => r.id === id) ?? null; },
    // DEMO-ONLY append (mirrors the in-memory copy the routes kept). The real
    // Supabase persistence is a side-channel (persistRecordingReview) the routes
    // still call directly. When a table lands, add `if (sb()) return sq...` here.
    async create(review: NonNullable<ReturnType<typeof getStore>["caraRecordingReviews"]>[number]) {
      const s = (getStore());
      s.caraRecordingReviews = s.caraRecordingReviews ?? [];
      s.caraRecordingReviews.push(review);
      return review;
    },
    /** DEMO-ONLY patch-in-place (2026-08-05); returns null if unknown. */
    async update(id: string, patch: Partial<NonNullable<ReturnType<typeof getStore>["caraRecordingReviews"]>[number]>) {
      const review = getStore().caraRecordingReviews.find((r) => r.id === id);
      if (!review) return null;
      Object.assign(review, patch);
      return review;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — batch 2 (2026-08-02). Unlocks ~77 more raw-store
  // routes for DAL migration. Same demo-only pattern — reads always in-memory
  // until a Supabase table lands.
  // ─────────────────────────────────────────────────────────────────────────

  leaveRequests: {
    async findAll(filters?: { staff_id?: string; status?: string }) {
      let list = getStore().leaveRequests;
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      if (filters?.status) list = list.filter((r) => r.status === filters.status);
      return list;
    },
    async findById(id: string) { return getStore().leaveRequests.find((r) => r.id === id) ?? null; },
  },

  ypFeedback: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.ypFeedback.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.ypFeedback.findById(id) ?? null; },
    async findByChild(childId: string) { return db.ypFeedback.findByChild(childId); },
    async create(data: Parameters<typeof db.ypFeedback.create>[0]) { return db.ypFeedback.create(data); },
  },

  healthAssessments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.healthAssessments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.healthAssessments.findById(id) ?? null; },
    async findByChild(childId: string) { return db.healthAssessments.findByChild(childId); },
    async create(data: Parameters<typeof db.healthAssessments.create>[0]) { return db.healthAssessments.create(data); },
  },

  notifiableEvents: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.notifiableEvents.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.notifiableEvents.findById(id) ?? null; },
    async create(data: Parameters<typeof db.notifiableEvents.create>[0]) { return db.notifiableEvents.create(data); },
  },

  employerValuesProfiles: {
    async findAll() { return getStore().employerValuesProfiles; },
    async findById(id: string) { return getStore().employerValuesProfiles.find((r) => r.id === id) ?? null; },
    // DEMO-ONLY single-profile upsert (there is one profile per home). Mirrors
    // the route's list[0]-replace mutation exactly.
    async upsert(updated: NonNullable<ReturnType<typeof getStore>["employerValuesProfiles"]>[number]) {
      const s = (getStore());
      const list = s.employerValuesProfiles ?? [];
      if (list[0]) list[0] = updated; else list.push(updated);
      s.employerValuesProfiles = list;
      return updated;
    },
  },

  reg44VisitReports: {
    async findAll(filters?: { home_id?: string }) {
      let list = db.reg44VisitReports.findAll();
      if (filters?.home_id) list = list.filter((r) => r.home_id === filters.home_id);
      return list;
    },
    async findById(id: string) { return db.reg44VisitReports.findById(id) ?? null; },
    async create(data: Parameters<typeof db.reg44VisitReports.create>[0]) { return db.reg44VisitReports.create(data); },
  },

  mentalHealthCheckIns: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.mentalHealthCheckIns.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.mentalHealthCheckIns.findById(id) ?? null; },
    async create(data: Parameters<typeof db.mentalHealthCheckIns.create>[0]) { return db.mentalHealthCheckIns.create(data); },
  },

  childPaceProfiles: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.childPaceProfiles.findAll();
      if (filters?.child_id) list = list.filter((r) => r.childId === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.childPaceProfiles.findByChild(childId) ?? null; },
  },

  complaints: {
    async findAll(filters?: { status?: string }) {
      let list = getStore().complaints;
      if (filters?.status) list = list.filter((r) => r.status === filters.status);
      return list;
    },
    async findById(id: string) { return getStore().complaints.find((r) => r.id === id) ?? null; },
  },

  welfareChecks: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.welfareChecks.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.welfareChecks.findByChild(childId); },
    async create(data: Parameters<typeof db.welfareChecks.create>[0]) { return db.welfareChecks.create(data); },
  },

  medicationErrors: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.medicationErrors.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.medicationErrors.findById(id) ?? null; },
    async create(data: Parameters<typeof db.medicationErrors.create>[0]) { return db.medicationErrors.create(data); },
  },

  outcomeReviews: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.outcomeReviews.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.outcomeReviews.findByChild(childId); },
    async create(data: Parameters<typeof db.outcomeReviews.create>[0]) { return db.outcomeReviews.create(data); },
  },

  advocacyRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.advocacyRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.advocacyRecords.findById(id) ?? null; },
  },

  qaAuditRecords: {
    async findAll() { return db.qaAuditRecords.getAll(); },
    async create(data: Parameters<typeof db.qaAuditRecords.create>[0]) { return db.qaAuditRecords.create(data); },
    async update(id: string, data: Parameters<typeof db.qaAuditRecords.update>[1]) { return db.qaAuditRecords.update(id, data); },
  },

  candidateValuesProfiles: {
    async findAll(filters?: { candidate_id?: string }) {
      let list = getStore().candidateValuesProfiles;
      if (filters?.candidate_id) list = list.filter((r) => r.candidate_id === filters.candidate_id);
      return list;
    },
    async findById(id: string) { return getStore().candidateValuesProfiles.find((r) => r.id === id) ?? null; },
  },

  appointments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.appointments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.appointments.findById(id) ?? null; },
    async create(data: Parameters<typeof db.appointments.create>[0]) { return db.appointments.create(data); },
  },

  staffSicknessRecords: {
    async findAll(filters?: { staff_id?: string }) {
      let list = db.staffSicknessRecords.getAll();
      if (filters?.staff_id) list = list.filter((r) => r.staff_id === filters.staff_id);
      return list;
    },
    async create(data: Parameters<typeof db.staffSicknessRecords.create>[0]) { return db.staffSicknessRecords.create(data); },
    async update(id: string, data: Parameters<typeof db.staffSicknessRecords.update>[1]) { return db.staffSicknessRecords.update(id, data); },
  },

  complaintOutcomeRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.complaintOutcomeRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.complaintOutcomeRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.complaintOutcomeRecords.findByChild(childId); },
  },

  exploitationScreenings: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.exploitationScreenings.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.exploitationScreenings.findById(id) ?? null; },
    async create(data: Parameters<typeof db.exploitationScreenings.create>[0]) { return db.exploitationScreenings.create(data); },
  },

  independenceSkillsRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.independenceSkillsRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.independenceSkillsRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.independenceSkillsRecords.findByChild(childId); },
    async create(data: Parameters<typeof db.independenceSkillsRecords.create>[0]) { return db.independenceSkillsRecords.create(data); },
  },

  postIncidentReflections: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.postIncidentReflections.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.postIncidentReflections.findById(id) ?? null; },
    async findByChild(childId: string) { return db.postIncidentReflections.findByChild(childId); },
    async findByIncident(incidentId: string) { return db.postIncidentReflections.findByIncident(incidentId) ?? null; },
    async append(r: Parameters<typeof db.postIncidentReflections.append>[0]) { return db.postIncidentReflections.append(r); },
  },

  dentalRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.dentalRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.dentalRecords.findById(id) ?? null; },
    async findByChild(childId: string) { return db.dentalRecords.findByChild(childId); },
    async create(data: Parameters<typeof db.dentalRecords.create>[0]) { return db.dentalRecords.create(data); },
  },

  // Dual-mode as of the behaviour_support_plans migration: the real table when
  // Supabase is configured, the in-memory store otherwise. Before the table
  // existed, a plan and the clinical detail added to it lived only as long as
  // the serverless instance — for the record staff read while a child is
  // escalating, that was the wrong place to keep it.
  behaviourSupportPlans: {
    async findAll(filters?: { child_id?: string }) {
      const c = sb();
      if (c) return (await sq.getBehaviourSupportPlans(c, { childId: filters?.child_id })) as unknown as BehaviourSupportPlan[];
      let list = db.behaviourSupportPlans.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) {
      const c = sb();
      if (c) return (await sq.getBehaviourSupportPlan(c, id)) as unknown as BehaviourSupportPlan | null;
      return db.behaviourSupportPlans.findById(id) ?? null;
    },
    async findByChild(childId: string) {
      const c = sb();
      if (c) return (await sq.getBehaviourSupportPlans(c, { childId })) as unknown as BehaviourSupportPlan[];
      return db.behaviourSupportPlans.findByChild(childId);
    },
    async create(data: Parameters<typeof db.behaviourSupportPlans.create>[0]) {
      const c = sb();
      if (c) return (await sq.createBehaviourSupportPlan(c, data as unknown as Parameters<typeof sq.createBehaviourSupportPlan>[1])) as unknown as BehaviourSupportPlan;
      return db.behaviourSupportPlans.create(data);
    },
    // Amending a plan has to be possible: the clinical sections (behaviours,
    // triggers, de-escalation, strategies, safety plan) are recorded after
    // creation, because each item needs judgement the create step cannot ask
    // for.
    async update(id: string, data: Parameters<typeof db.behaviourSupportPlans.update>[1]) {
      const c = sb();
      if (c) return (await sq.updateBehaviourSupportPlan(c, id, data as Parameters<typeof sq.updateBehaviourSupportPlan>[2])) as unknown as BehaviourSupportPlan;
      return db.behaviourSupportPlans.update(id, data);
    },
  },

  carePlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = getStore().carePlans;
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return getStore().carePlans.find((r) => r.id === id) ?? null; },
  },

  camhsReferrals: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.camhsReferrals.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findById(id: string) { return db.camhsReferrals.findById(id) ?? null; },
    async create(data: Parameters<typeof db.camhsReferrals.create>[0]) { return db.camhsReferrals.create(data); },
  },

  inductionRecords: {
    async findAll(filters?: { overall_status?: string }) {
      let list = db.inductionRecords.findAll();
      if (filters?.overall_status) list = list.filter((r) => r.overall_status === filters.overall_status);
      return list;
    },
    async findByStaff(staffId: string) { return db.inductionRecords.findByStaff(staffId) ?? null; },
    async findByStatus(status: string) { return db.inductionRecords.findByStatus(status); },
    async create(data: Parameters<typeof db.inductionRecords.create>[0]) { return db.inductionRecords.create(data); },
    async update(id: string, data: Parameters<typeof db.inductionRecords.update>[1]) { return db.inductionRecords.update(id, data); },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — batch 3 (2026-08-02). Unblocks the single-gap
  // pure-read routes. Reads always in-memory until a Supabase table lands;
  // then swap the `if (sb())` branch in the block, routes stay unchanged.
  // ─────────────────────────────────────────────────────────────────────────

  admissionReferrals: {
    async findAll() { return db.admissionReferrals.getAll(); },
  },

  independencePathways: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.independencePathways.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.independencePathways.findByChild(childId); },
  },

  cornerstoneEvents: {
    async findAll() { return db.cornerstoneEvents.findAll(); },
  },

  welfareCheckRounds: {
    async findAll() { return db.welfareCheckRounds.findAll(); },
  },

  uploadedDocuments: {
    async findAll() { return db.uploadedDocuments.findAll(); },
  },

  pathwayPlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.pathwayPlans.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.pathwayPlans.findByChild(childId); },
  },

  aspirationRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.aspirationRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.aspirationRecords.findByChild(childId); },
  },

  escalationDecisions: {
    async findAll() { return db.escalationDecisions.findAll(); },
  },

  contactPlans: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.contactPlans.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.contactPlans.findByChild(childId); },
  },

  healthRecordEntries: {
    async findAll() { return db.healthRecordEntries.getAll(); },
  },

  homePolicies: {
    async findAll() { return db.homePolicies.getAll(); },
  },

  ladoReferrals: {
    async findAll() { return db.ladoReferrals.findAll(); },
  },

  dolRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.dolRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.dolRecords.findByChild(childId); },
  },

  pepRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.pepRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.pepRecords.findByChild(childId); },
  },

  selfEvaluationAreas: {
    async findAll() { return db.selfEvaluationAreas.findAll(); },
  },

  visitors: {
    async findAll() { return db.visitors.findAll(); },
  },

  conditionalOffers: {
    async findAll() { return db.conditionalOffers.findAll(); },
  },

  developmentPlans: {
    async findAll() { return db.developmentPlans.findAll(); },
  },

  activities: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.activities.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.activities.findByChild(childId); },
  },

  audits: {
    async findAll() { return db.audits.findAll(); },
  },

  appraisals: {
    async findAll() { return db.appraisals.findAll(); },
  },

  whistleblowingRecords: {
    async findAll() { return db.whistleblowingRecords.getAll(); },
  },

  contextualSafeguardingRisks: {
    async findAll() { return db.contextualSafeguardingRisks.findAll(); },
  },

  absenceTracking: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.absenceTracking.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.absenceTracking.findByChild(childId); },
  },

  localityRisks: {
    async findAll() { return db.localityRisks.findAll(); },
  },

  fireDrills: {
    async findAll() { return db.fireDrills.findAll(); },
  },

  houseMeetings: {
    async findAll() { return db.houseMeetings.findAll(); },
  },

  traumaTherapyLogs: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.traumaTherapyLogs.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.traumaTherapyLogs.findByChild(childId); },
  },

  sleepLog: {
    async findAll() { return db.sleepLog.findAll(); },
  },

  belongingsRecords: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.belongingsRecords.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.belongingsRecords.findByChild(childId); },
  },

  lessonsLearned: {
    async findAll() { return db.lessonsLearned.findAll(); },
  },

  therapeuticInputRecords: {
    async findAll() { return db.therapeuticInputRecords.getAll(); },
  },

  significantEvents: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.significantEvents.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.significantEvents.findByChild(childId); },
  },

  staffDisciplinaryRecords: {
    async findAll() { return db.staffDisciplinaryRecords.getAll(); },
  },

  qualityOfCareReviews: {
    async findAll() { return db.qualityOfCareReviews.getAll(); },
  },

  disclosures: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.disclosures.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.disclosures.findByChild(childId); },
  },

  caraPracticeAssessments: {
    async findAll(filters?: { child_id?: string }) {
      let list = db.caraPracticeAssessments.findAll();
      if (filters?.child_id) list = list.filter((r) => r.child_id === filters.child_id);
      return list;
    },
    async findByChild(childId: string) { return db.caraPracticeAssessments.findByChild(childId); },
  },

  timeSaved: {
    async findAll() { return getStore().timeSaved; },
  },

  integrityHealEvents: {
    async findAll() { return getStore().integrityHealEvents; },
  },

  caraIncidentSessions: {
    async findAll() { return getStore().caraIncidentSessions; },
  },

  askCaraAuditEvents: {
    async findAll() { return getStore().askCaraAuditEvents; },
    // DEMO-ONLY append (2026-08-05): stamps id/createdAt only when absent, and
    // caps the log at the most recent 1000 events (the cap previously lived in
    // the cara/chat route).
    async create(data: NonNullable<ReturnType<typeof getStore>["askCaraAuditEvents"]>[number]) {
      const events = getStore().askCaraAuditEvents;
      const evt = {
        ...data,
        id: data.id ?? `ac_evt_${Date.now()}_${events.length}`,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };
      events.push(evt);
      if (events.length > 1000) events.splice(0, events.length - 1000);
      return evt;
    },
  },

  shiftPatterns: {
    async findAll() { return getStore().shiftPatterns; },
    // DEMO-ONLY CRUD via whole-array replace (mirrors rota/patterns exactly).
    async create(pattern: NonNullable<ReturnType<typeof getStore>["shiftPatterns"]>[number]) {
      const s = (getStore());
      s.shiftPatterns = [...(s.shiftPatterns ?? []), pattern];
      return pattern;
    },
    async update(id: string, pattern: NonNullable<ReturnType<typeof getStore>["shiftPatterns"]>[number]) {
      const s = (getStore());
      const list = ((s.shiftPatterns ?? []));
      s.shiftPatterns = list.map((p) => (p.id === id ? pattern : p));
      return pattern;
    },
    async remove(id: string) {
      const s = (getStore());
      const list = ((s.shiftPatterns ?? []));
      s.shiftPatterns = list.filter((p) => p.id !== id);
    },
  },

  waterHygieneRecords: {
    async findAll() { return db.waterHygieneRecords.getAll(); },
  },

  fireEquipmentChecks: {
    async findAll() { return db.fireEquipmentChecks.findAll(); },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — write-slice 2 (2026-08-03). The remaining clean
  // WRITER routes: external-AI declarations, prompt-bank, knowledge-governance,
  // professional-challenge, regulation-profile, post-incident reflections,
  // voice-follow-through, early-access. Same demo-only pattern as write-slice 1:
  // findAll returns the LIVE store array (so routes may mutate a found record in
  // place — Object.assign / nested .push — through the same reference), and
  // create/update/remove mirror each route's exact mutation. When a Supabase
  // table lands, only the `if (sb())` branch in each block changes; the routes
  // stay put. No new live persistence is gained here (routes that already had a
  // Supabase side-channel — early-access — keep calling it directly).
  // ─────────────────────────────────────────────────────────────────────────

  externalAiDeclarations: {
    async findAll() { return getStore().externalAiDeclarations; },
    async findById(id: string) { return getStore().externalAiDeclarations.find((r) => r.id === id) ?? null; },
    async create(decl: NonNullable<ReturnType<typeof getStore>["externalAiDeclarations"]>[number]) {
      const s = (getStore());
      s.externalAiDeclarations = s.externalAiDeclarations ?? [];
      s.externalAiDeclarations.push(decl);
      return decl;
    },
    // Replace-by-id (mirrors the PATCH review mutation exactly).
    async update(id: string, record: NonNullable<ReturnType<typeof getStore>["externalAiDeclarations"]>[number]) {
      const s = (getStore());
      const list = ((s.externalAiDeclarations ?? []));
      const idx = list.findIndex((d) => d.id === id);
      if (idx !== -1) list[idx] = record;
      return record;
    },
  },

  caraPostIncidentReflections: {
    async findAll() { return getStore().caraPostIncidentReflections ?? []; },
    async create(rec: NonNullable<ReturnType<typeof getStore>["caraPostIncidentReflections"]>[number]) {
      const s = (getStore());
      s.caraPostIncidentReflections = s.caraPostIncidentReflections ?? [];
      s.caraPostIncidentReflections.push(rec);
      return rec;
    },
  },

  caraRestorativeConversations: {
    async findAll() { return getStore().caraRestorativeConversations ?? []; },
    async create(rec: NonNullable<ReturnType<typeof getStore>["caraRestorativeConversations"]>[number]) {
      const s = (getStore());
      s.caraRestorativeConversations = s.caraRestorativeConversations ?? [];
      s.caraRestorativeConversations.push(rec);
      return rec;
    },
  },

  caraPromptBank: {
    async findAll() { return getStore().caraPromptBank ?? []; },
    async create(entry: NonNullable<ReturnType<typeof getStore>["caraPromptBank"]>[number]) {
      const s = (getStore());
      s.caraPromptBank = s.caraPromptBank ?? [];
      s.caraPromptBank.push(entry);
      return entry;
    },
    async remove(id: string) {
      const s = (getStore());
      s.caraPromptBank = (s.caraPromptBank ?? []).filter((p) => p.id !== id);
    },
  },

  knowledgeGovernance: {
    async findAll() { return getStore().knowledgeGovernance ?? []; },
    async create(record: NonNullable<ReturnType<typeof getStore>["knowledgeGovernance"]>[number]) {
      const s = (getStore());
      s.knowledgeGovernance = s.knowledgeGovernance ?? [];
      s.knowledgeGovernance.push(record);
      return record;
    },
  },

  professionalChallenges: {
    async findAll() { return getStore().professionalChallenges ?? []; },
    async create(challenge: NonNullable<ReturnType<typeof getStore>["professionalChallenges"]>[number]) {
      const s = (getStore());
      s.professionalChallenges = s.professionalChallenges ?? [];
      s.professionalChallenges.push(challenge);
      return challenge;
    },
  },

  regulationProfiles: {
    async findAll() { return getStore().regulationProfiles ?? []; },
    async create(profile: NonNullable<ReturnType<typeof getStore>["regulationProfiles"]>[number]) {
      const s = (getStore());
      s.regulationProfiles = s.regulationProfiles ?? [];
      s.regulationProfiles.push(profile);
      return profile;
    },
  },

  adultRegulationReflections: {
    async findAll() { return getStore().adultRegulationReflections ?? []; },
    async create(reflection: NonNullable<ReturnType<typeof getStore>["adultRegulationReflections"]>[number]) {
      const s = (getStore());
      s.adultRegulationReflections = s.adultRegulationReflections ?? [];
      s.adultRegulationReflections.push(reflection);
      return reflection;
    },
  },

  voiceConcernLoops: {
    async findAll() { return getStore().voiceConcernLoops ?? []; },
    async create(loop: NonNullable<ReturnType<typeof getStore>["voiceConcernLoops"]>[number]) {
      const s = (getStore());
      s.voiceConcernLoops = s.voiceConcernLoops ?? [];
      s.voiceConcernLoops.push(loop);
      return loop;
    },
  },

  earlyAccessRequests: {
    async findAll() { return getStore().earlyAccessRequests; },
    async create(record: EarlyAccessRequest) {
      getStore().earlyAccessRequests.push(record);
      return record;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEMO-ONLY extensions — direct-read routes (2026-08-05). findAll returns the
  // live store array so migrating those routes is behaviour-preserving; when a
  // Supabase table lands, only the `if (sb())` branch changes.
  // ─────────────────────────────────────────────────────────────────────────

  annualHealthAssessments: {
    async findAll() { return getStore().annualHealthAssessments ?? []; },
  },
  caraPracticeFlags: {
    async findAll() { return getStore().caraPracticeFlags ?? []; },
  },
  caraStaffWellbeingSignals: {
    async findAll() { return getStore().caraStaffWellbeingSignals ?? []; },
  },
  caraThresholdConsultations: {
    async findAll() { return getStore().caraThresholdConsultations ?? []; },
  },
  caseFileAudits: {
    async findAll() { return getStore().caseFileAudits ?? []; },
  },
  clothingAllowanceRecords: {
    async findAll() { return getStore().clothingAllowanceRecords ?? []; },
  },
  competencyProfiles: {
    async findAll() { return getStore().competencyProfiles ?? []; },
  },
  contactDirectoryEntries: {
    async findAll() { return getStore().contactDirectoryEntries ?? []; },
  },
  eduAttendanceRecords: {
    async findAll() { return getStore().eduAttendanceRecords ?? []; },
  },
  ehcpRecords: {
    async findAll() { return getStore().ehcpRecords ?? []; },
  },
  emergencyPlans: {
    async findAll() { return getStore().emergencyPlans ?? []; },
  },
  genogramEntries: {
    async findAll() { return getStore().genogramEntries ?? []; },
  },
  homeworkSessions: {
    async findAll() { return getStore().homeworkSessions ?? []; },
  },
  immunisationRecords: {
    async findAll() { return getStore().immunisationRecords ?? []; },
  },
  improvementObjectives: {
    async findAll() { return getStore().improvementObjectives ?? []; },
  },
  keyworkerSessions: {
    async findAll() { return getStore().keyworkerSessions ?? []; },
  },
  matchingReferrals: {
    async findAll() { return getStore().matchingReferrals ?? []; },
  },
  multiAgencyMeetings: {
    async findAll() { return getStore().multiAgencyMeetings ?? []; },
  },
  opticiansRecords: {
    async findAll() { return getStore().opticiansRecords ?? []; },
  },
  participationEntries: {
    async findAll() { return getStore().participationEntries ?? []; },
  },
  peerDynamics: {
    async findAll() { return getStore().peerDynamics ?? []; },
  },
  peerGroupDynamics: {
    async findAll() { return getStore().peerGroupDynamics ?? []; },
  },
  placementStabilityRecords: {
    async findAll() { return getStore().placementStabilityRecords ?? []; },
  },
  pocketMoneyAccounts: {
    async findAll() { return getStore().pocketMoneyAccounts ?? []; },
  },
  pocketMoneyTransactions: {
    async findAll() { return getStore().pocketMoneyTransactions ?? []; },
  },
  policyReviewRecords: {
    async findAll() { return getStore().policyReviewRecords ?? []; },
  },
  professionalNetworkContacts: {
    async findAll() { return getStore().professionalNetworkContacts ?? []; },
  },
  protocolDrills: {
    async findAll() { return getStore().protocolDrills ?? []; },
  },
  qualifications: {
    async findAll() { return getStore().qualifications ?? []; },
  },
  relationshipEntries: {
    async findAll() { return getStore().relationshipEntries ?? []; },
  },
  restrictionReviews: {
    async findAll() { return getStore().restrictionReviews ?? []; },
  },
  schoolEngagementEvents: {
    async findAll() { return getStore().schoolEngagementEvents ?? []; },
  },
  staffDebriefRecords: {
    async findAll() { return getStore().staffDebriefRecords ?? []; },
  },
  staffGrievanceRecords: {
    async findAll() { return getStore().staffGrievanceRecords ?? []; },
  },
  staffRecognitionRecords: {
    async findAll() { return getStore().staffRecognitionRecords ?? []; },
  },
  staffWellbeingRecords: {
    async findAll() { return getStore().staffWellbeingRecords ?? []; },
  },
  stayingSafePlans: {
    async findAll() { return getStore().stayingSafePlans ?? []; },
  },
  therapeuticChildImpact: {
    async findAll() { return getStore().therapeuticChildImpact ?? []; },
  },
  trackedDocuments: {
    async findAll() { return getStore().trackedDocuments ?? []; },
  },
  tutoringRecords: {
    async findAll() { return getStore().tutoringRecords ?? []; },
  },

  // ── DEMO-ONLY extensions — typed-compose builder routes (2026-08-05) ──────
  // Same placeholder pattern as above: reads fall back to the in-memory store
  // until a Supabase table lands (then only the `if (sb())` branch changes).
  practiceObservations: {
    async findAll() { return getStore().practiceObservations ?? []; },
  },
  writingAssistantAuditEvents: {
    async findAll() { return getStore().writingAssistantAuditEvents ?? []; },
  },

  // ── DEMO-ONLY extensions — uncovered-tier routes (2026-08-05) ─────────────
  // Same placeholder pattern: in-memory reads until a Supabase table lands.
  adhdPlans: {
    async findAll() { return getStore().adhdPlans ?? []; },
  },
  autismPlans: {
    async findAll() { return getStore().autismPlans ?? []; },
  },
  caraPaceAnalyses: {
    async findAll() { return getStore().caraPaceAnalyses ?? []; },
  },
  caraWritingReviews: {
    async findAll() { return getStore().caraWritingReviews ?? []; },
  },
  childFeedbackLoops: {
    async findAll() { return getStore().childFeedbackLoops ?? []; },
  },
  competencyScores: {
    async findAll() { return getStore().competencyScores ?? []; },
  },
  multiDisciplinaryFormulations: {
    async findAll() { return getStore().multiDisciplinaryFormulations ?? []; },
  },
  reg44ActionRecords: {
    async findAll() { return getStore().reg44ActionRecords ?? []; },
  },
  reg45EvidenceQueue: {
    async findAll() { return getStore().reg45EvidenceQueue ?? []; },
  },
  sensoryProfileRecords: {
    async findAll() { return getStore().sensoryProfileRecords ?? []; },
  },

  // ── DEMO-ONLY extensions — HQ metering routes (2026-08-05) ────────────────
  // Platform-owner cockpit collections (real seeded arrays). Same placeholder
  // pattern: in-memory reads until Supabase tables land.
  hqAiUsage: {
    async findAll() { return getStore().hqAiUsage ?? []; },
  },
  hqApiCalls: {
    async findAll() { return getStore().hqApiCalls ?? []; },
  },
  hqBreakGlassGrants: {
    async findAll() { return getStore().hqBreakGlassGrants ?? []; },
  },
  hqDecisions: {
    async findAll() { return getStore().hqDecisions ?? []; },
  },
  hqOrganisations: {
    async findAll() { return getStore().hqOrganisations ?? []; },
  },
  hqUsageEvents: {
    async findAll() { return getStore().hqUsageEvents ?? []; },
  },

  // ── DEMO-ONLY extensions — write-slice 3 (2026-08-05) ─────────────────────
  // Read+write accessors for the write-tier routes. Same placeholder pattern:
  // in-memory until Supabase tables land (then only the `if (sb())` branch
  // changes — routes stay as they are).
  shiftCoverNotes: {
    async findAll() { return getStore().shiftCoverNotes ?? []; },
    async create(data: NonNullable<ReturnType<typeof getStore>["shiftCoverNotes"]>[number]) {
      const s = getStore();
      (s.shiftCoverNotes ??= []).push(data);
      return data;
    },
    /** Drop any note for the given day+period (the route replaces on save). */
    async removeByDatePeriod(date: string, period: string) {
      const s = getStore();
      s.shiftCoverNotes = (s.shiftCoverNotes ?? []).filter(
        (n) => !(String(n.date).slice(0, 10) === date && n.period === period),
      );
    },
  },
  staffingPolicy: {
    /** Single policy object (not a collection). */
    async get() { return getStore().staffingPolicy; },
    async set(next: NonNullable<ReturnType<typeof getStore>["staffingPolicy"]>) {
      getStore().staffingPolicy = next;
      return next;
    },
  },
  caraManagerAlertStates: {
    async findAll() { return getStore().caraManagerAlertStates ?? []; },
    /** Upsert by id. */
    async save(record: NonNullable<ReturnType<typeof getStore>["caraManagerAlertStates"]>[number]) {
      const s = getStore();
      s.caraManagerAlertStates = s.caraManagerAlertStates ?? [];
      const i = s.caraManagerAlertStates.findIndex((r) => r.id === record.id);
      if (i >= 0) s.caraManagerAlertStates[i] = record;
      else s.caraManagerAlertStates.push(record);
      return record;
    },
    /** Reopen = remove the override record. */
    async removeById(id: string) {
      const s = getStore();
      s.caraManagerAlertStates = (s.caraManagerAlertStates ?? []).filter((r) => r.id !== id);
    },
  },
  caraIncidentTimeline: {
    async findAll() { return getStore().caraIncidentTimeline ?? []; },
  },
  circleNotes: {
    async findAll() { return getStore().circleNotes ?? []; },
    async create(data: NonNullable<ReturnType<typeof getStore>["circleNotes"]>[number]) {
      getStore().circleNotes.push(data);
      return data;
    },
  },
  circleRhythms: {
    async findAll() { return getStore().circleRhythms ?? []; },
    /** Patch a circle's config (enabled / starts_at); returns null if unknown. */
    async update(id: string, patch: { enabled?: boolean; starts_at?: string }) {
      const rhythm = (getStore().circleRhythms ?? []).find((r) => r.id === id);
      if (!rhythm) return null;
      if (typeof patch.enabled === "boolean") rhythm.enabled = patch.enabled;
      if (patch.starts_at) rhythm.starts_at = patch.starts_at;
      rhythm.updated_at = new Date().toISOString();
      return rhythm;
    },
  },
  shiftLifecycleRecords: {
    async findAll() { return getStore().shiftLifecycleRecords ?? []; },
    async create(data: NonNullable<ReturnType<typeof getStore>["shiftLifecycleRecords"]>[number]) {
      getStore().shiftLifecycleRecords.push(data);
      return data;
    },
    /** Patch-in-place by record id; returns null if unknown. */
    async update(id: string, patch: Partial<NonNullable<ReturnType<typeof getStore>["shiftLifecycleRecords"]>[number]>) {
      const record = (getStore().shiftLifecycleRecords ?? []).find((r) => r.id === id);
      if (!record) return null;
      Object.assign(record, patch);
      return record;
    },
  },
  helpReflections: {
    async findAll() { return getStore().helpReflections ?? []; },
    async create(data: NonNullable<ReturnType<typeof getStore>["helpReflections"]>[number]) {
      getStore().helpReflections.push(data);
      return data;
    },
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// GENERIC TABLE FACTORY — for extended types without dedicated Supabase tables
//
// Creates async CRUD wrappers. When Supabase is enabled, uses the
// `generic_records` catch-all table. Otherwise wraps the in-memory store.
// ─────────────────────────────────────────────────────────────────────────────

export function genericTable<T extends { id: string }>(
  /** In-memory store collection accessor */
  memoryGetAll: () => T[],
  memoryCreate: (data: Partial<T>) => T,
  memoryUpdate?: (id: string, data: Partial<T>) => T | null,
  /** The record_type string for the generic_records table */
  recordType?: string,
) {
  return {
    async findAll(filters?: { child_id?: string; staff_id?: string }): Promise<T[]> {
      const c = sb();
      if (c && recordType) {
        const rows = await sq.getGenericRecords(c, homeId(), recordType, filters);
        // data holds the record object by construction (generic-records store objects)
        return rows.map((r) => ({ id: r.id, ...(r.data as Record<string, unknown>), created_at: r.created_at, updated_at: r.updated_at }) as unknown as T);
      }
      return memoryGetAll();
    },

    async findById(id: string): Promise<T | null> {
      const c = sb();
      if (c && recordType) {
        try {
          const r = (await sq.getGenericRecordById(c, id)) as GenericRecordRow | null;
          if (!r) return null;
          return { id: r.id, ...r.data, created_at: r.created_at } as unknown as T;
        } catch { return null; }
      }
      return memoryGetAll().find((item) => item.id === id) ?? null;
    },

    async create(data: Partial<T> & { child_id?: string | null; staff_id?: string | null; created_by?: string | null }): Promise<T> {
      const c = sb();
      if (c && recordType) {
        const { id: _id, child_id, staff_id, created_by, ...rest } = data;
        const row = await sq.createGenericRecord(c, {
          home_id: homeId(),
          record_type: recordType,
          data: rest,
          child_id: child_id ?? undefined,
          staff_id: staff_id ?? undefined,
          created_by: created_by ?? undefined,
        });
        const created = row as GenericRecordRow | null;
        // The insert returned nothing, so nothing was stored — say so rather
        // than handing back a record shape the caller will treat as saved.
        if (!created) throw new Error(`generic_records insert returned no row for ${recordType}`);
        return { id: created.id, ...rest, created_at: created.created_at } as unknown as T;
      }
      return memoryCreate(data);
    },

    async update(id: string, data: Partial<T> & { updated_by?: string | null }): Promise<T | null> {
      const c = sb();
      if (c && recordType) {
        const existing = (await sq.getGenericRecordById(c, id)) as GenericRecordRow | null;
        // Updating a record that is not there is a miss, not a crash — this
        // used to read `.data` straight off a null and throw a 500.
        if (!existing) return null;
        const merged = { ...(existing.data as Record<string, unknown>), ...data };
        const updated = (await sq.updateGenericRecord(c, id, {
          data: merged as import("@/lib/supabase/types").Json, // plain record by construction
          updated_by: data.updated_by ?? null,
        })) as GenericRecordRow | null;
        if (!updated) return null;
        return { id: updated.id, ...merged, updated_at: updated.updated_at } as unknown as T;
      }
      return memoryUpdate ? memoryUpdate(id, data) : null;
    },
  };
}
