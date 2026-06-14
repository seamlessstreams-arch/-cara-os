/**
 * Supabase data layer for the Care Events pipeline.
 *
 * Mirrors the in-memory db.careEvents / db.careEventRoutes / etc. API
 * so API routes can swap backends with a single config flag.
 *
 * ONLY import this from server-side code (API routes / Server Components).
 * Never expose service-role operations to the client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "./server";
import type {
  CareEvent,
  CareEventRoute,
  CareEventAuditLog,
  Reg45EvidenceItem,
  AnnexAEvidenceItem,
  ChildDailySummary,
} from "@/types/care-events";
import type { AppNotification } from "@/types";
import { generateId, todayStr } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function supabase(): LooseSupabase {
  const client = createServerClient();
  if (!client) throw new Error("Supabase not configured — check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  return client as unknown as LooseSupabase;
}

/** Map a DB row to the CareEvent domain type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCareEvent(row: Record<string, any>): CareEvent {
  return {
    id: row.id,
    home_id: row.home_id,
    child_id: row.child_id ?? null,
    shift_id: row.shift_id ?? null,
    staff_id: row.staff_id,
    verified_by: row.verified_by ?? null,
    returned_by: row.returned_by ?? null,
    locked_by: row.locked_by ?? null,
    category: row.category,
    title: row.title,
    content: row.body ?? row.content ?? "",
    mood_score: row.mood_score ?? null,
    is_significant: row.is_significant ?? false,
    status: row.status,
    event_date: row.event_date ?? row.created_at?.slice(0, 10) ?? todayStr(),
    event_time: row.event_time ?? null,
    requires_manager_review: row.requires_manager_review ?? false,
    requires_reg40_triage: row.requires_reg40_triage ?? false,
    contributes_to_reg45: row.contributes_to_reg45 ?? false,
    contributes_to_annex_a: row.contributes_to_annex_a ?? false,
    is_safeguarding: row.is_safeguarding ?? row.category === "safeguarding",
    evidence_prompts: row.evidence_prompts ?? [],
    evidence_prompts_completed: row.evidence_prompts_completed ?? false,
    staff_signature: row.staff_signature ?? false,
    staff_signed_at: row.staff_signed_at ?? null,
    manager_id: row.manager_id ?? row.manager_review_by ?? null,
    manager_review_note: row.manager_review_note ?? row.manager_review_notes ?? null,
    manager_review_at: row.manager_review_at ?? null,
    manager_review_completed: row.manager_review_completed ?? false,
    manager_signature: row.manager_signature ?? false,
    manager_notes: row.manager_notes ?? null,
    return_reason: row.return_reason ?? null,
    returned_at: row.returned_at ?? null,
    submitted_at: row.submitted_at ?? null,
    submitted_by: row.submitted_by ?? null,
    verified_at: row.verified_at ?? null,
    locked_at: row.locked_at ?? null,
    version: row.version ?? 1,
    previous_version_id: row.previous_version_id ?? null,
    amendment_reason: row.amendment_reason ?? null,
    amended_by: row.amended_by ?? null,
    amended_at: row.amended_at ?? null,
    is_current_version: row.is_current_version ?? true,
    cara_suggested_summary: row.cara_suggested_summary ?? null,
    cara_suggested_category: row.cara_suggested_category ?? null,
    cara_suggested_routing: row.cara_suggested_routes ?? null,
    cara_suggested_reg45: null,
    cara_suggested_annex_a: null,
    cara_suggestions_reviewed: false,
    routing_summary: row.routing_summary ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Map CareEvent domain fields to the DB insert/update shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function careEventToRow(data: Partial<CareEvent>): Record<string, any> {
  const row: Record<string, unknown> = {};
  if (data.home_id !== undefined) row.home_id = data.home_id;
  if (data.child_id !== undefined) row.child_id = data.child_id;
  if (data.shift_id !== undefined) row.shift_id = data.shift_id;
  if (data.staff_id !== undefined) row.staff_id = data.staff_id;
  if (data.category !== undefined) row.category = data.category;
  if (data.status !== undefined) row.status = data.status;
  if (data.title !== undefined) row.title = data.title;
  if (data.content !== undefined) row.body = data.content;
  if (data.evidence_prompts_completed !== undefined) row.evidence_prompts_completed = data.evidence_prompts_completed;
  if (data.requires_manager_review !== undefined) row.requires_manager_review = data.requires_manager_review;
  if (data.requires_reg40_triage !== undefined) row.requires_reg40_triage = data.requires_reg40_triage;
  if (data.contributes_to_reg45 !== undefined) row.contributes_to_reg45 = data.contributes_to_reg45;
  if (data.contributes_to_annex_a !== undefined) row.contributes_to_annex_a = data.contributes_to_annex_a;
  if (data.verified_at !== undefined) row.verified_at = data.verified_at;
  if (data.verified_by !== undefined) row.verified_by = data.verified_by;
  if (data.locked_at !== undefined) row.locked_at = data.locked_at;
  if (data.locked_by !== undefined) row.locked_by = data.locked_by;
  if (data.returned_at !== undefined) row.returned_at = data.returned_at;
  if (data.returned_by !== undefined) row.returned_by = data.returned_by;
  if (data.return_reason !== undefined) row.return_reason = data.return_reason;
  if (data.submitted_at !== undefined) row.submitted_at = data.submitted_at;
  if (data.version !== undefined) row.version = data.version;
  if (data.previous_version_id !== undefined) row.previous_version_id = data.previous_version_id;
  if (data.amendment_reason !== undefined) row.amendment_reason = data.amendment_reason;
  if (data.amended_at !== undefined) row.amended_at = data.amended_at;
  if (data.amended_by !== undefined) row.amended_by = data.amended_by;
  if (data.manager_id !== undefined) row.manager_review_by = data.manager_id;
  if (data.manager_review_note !== undefined) row.manager_review_notes = data.manager_review_note;
  if (data.manager_review_at !== undefined) row.manager_review_at = data.manager_review_at;
  if (data.routing_summary !== undefined) row.routing_summary = data.routing_summary as unknown;
  if (data.cara_suggested_summary !== undefined) row.cara_suggested_summary = data.cara_suggested_summary;
  if (data.cara_suggested_category !== undefined) row.cara_suggested_category = data.cara_suggested_category;
  if (data.cara_suggested_routing !== undefined) row.cara_suggested_routes = data.cara_suggested_routing as unknown;
  return row;
}

// ── Care Events ───────────────────────────────────────────────────────────────

export const sbCareEvents = {
  async findAll(): Promise<CareEvent[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCareEvent);
  },

  async findById(id: string): Promise<CareEvent | null> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // row not found
      throw error;
    }
    return data ? rowToCareEvent(data) : null;
  },

  async findCurrent(): Promise<CareEvent[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .eq("is_current_version", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCareEvent);
  },

  async findByChild(childId: string): Promise<CareEvent[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .eq("child_id", childId)
      .eq("is_current_version", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCareEvent);
  },

  async findByStatus(status: CareEvent["status"]): Promise<CareEvent[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .eq("status", status)
      .eq("is_current_version", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCareEvent);
  },

  async findNeedingManagerReview(): Promise<CareEvent[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .eq("requires_manager_review", true)
      .eq("status", "manager_review_required")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCareEvent);
  },

  async findForReg40(): Promise<CareEvent[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_events")
      .select("*")
      .eq("requires_reg40_triage", true)
      .eq("is_current_version", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToCareEvent);
  },

  async create(data: Partial<CareEvent>): Promise<CareEvent> {
    const sb = supabase();
    const now = new Date().toISOString();
    const id = data.id ?? generateId("ce");
    const row = {
      id,
      home_id: data.home_id ?? "home_oak",
      child_id: data.child_id ?? null,
      shift_id: data.shift_id ?? null,
      staff_id: data.staff_id ?? "staff_darren",
      category: data.category ?? "general",
      status: data.status ?? "draft",
      title: data.title ?? "",
      body: data.content ?? "",
      evidence_prompts_completed: data.evidence_prompts_completed ?? false,
      requires_manager_review: data.requires_manager_review ?? false,
      requires_reg40_triage: data.requires_reg40_triage ?? false,
      contributes_to_reg45: data.contributes_to_reg45 ?? false,
      contributes_to_annex_a: data.contributes_to_annex_a ?? false,
      version: data.version ?? 1,
      previous_version_id: data.previous_version_id ?? null,
      amendment_reason: data.amendment_reason ?? null,
      amended_at: data.amended_at ?? null,
      amended_by: data.amended_by ?? null,
      is_current_version: true,
      return_reason: data.return_reason ?? null,
      returned_at: data.returned_at ?? null,
      submitted_at: data.submitted_at ?? null,
      verified_at: data.verified_at ?? null,
      verified_by: data.verified_by ?? null,
      locked_at: data.locked_at ?? null,
      locked_by: data.locked_by ?? null,
      cara_suggested_summary: data.cara_suggested_summary ?? null,
      cara_suggested_category: data.cara_suggested_category ?? null,
      cara_suggested_routes: data.cara_suggested_routing ?? null,
      routing_summary: data.routing_summary ?? null,
      created_at: now,
      updated_at: now,
    };
    const { data: inserted, error } = await sb
      .from("care_events")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToCareEvent(inserted);
  },

  async patch(id: string, data: Partial<CareEvent>): Promise<CareEvent | null> {
    const sb = supabase();
    const row = { ...careEventToRow(data), updated_at: new Date().toISOString() };
    const { data: updated, error } = await sb
      .from("care_events")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return updated ? rowToCareEvent(updated) : null;
  },
};

// ── Care Event Routes ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRoute(row: Record<string, any>): CareEventRoute {
  return {
    id: row.id,
    care_event_id: row.care_event_id,
    home_id: row.home_id,
    route_type: row.route_type,
    status: row.status,
    linked_record_id: row.linked_record_id ?? null,
    linked_record_table: row.linked_record_type ?? null,
    processing_notes: row.processing_notes ?? null,
    error_message: row.error_message ?? null,
    retry_count: row.retry_count ?? 0,
    last_retried_at: row.last_attempted_at ?? null,
    time_saved_minutes: row.time_saved_minutes ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  };
}

export const sbCareEventRoutes = {
  async findByCareEvent(careEventId: string): Promise<CareEventRoute[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_event_routes")
      .select("*")
      .eq("care_event_id", careEventId);
    if (error) throw error;
    return (data ?? []).map(rowToRoute);
  },

  async findFailed(): Promise<CareEventRoute[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_event_routes")
      .select("*")
      .in("status", ["failed", "retry_required"]);
    if (error) throw error;
    return (data ?? []).map(rowToRoute);
  },

  async upsert(data: Omit<CareEventRoute, "id" | "created_at" | "updated_at">): Promise<CareEventRoute> {
    const sb = supabase();
    const now = new Date().toISOString();
    const row = {
      care_event_id: data.care_event_id,
      home_id: data.home_id,
      route_type: data.route_type,
      status: data.status,
      linked_record_id: data.linked_record_id,
      linked_record_type: data.linked_record_table,
      error_message: data.error_message,
      retry_count: data.retry_count ?? 0,
      last_attempted_at: data.last_retried_at,
      updated_at: now,
    };
    const { data: upserted, error } = await sb
      .from("care_event_routes")
      .upsert(row, { onConflict: "care_event_id,route_type" })
      .select()
      .single();
    if (error) throw error;
    return rowToRoute(upserted);
  },

  async patch(id: string, data: Partial<CareEventRoute>): Promise<CareEventRoute | null> {
    const sb = supabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.status !== undefined) row.status = data.status;
    if (data.linked_record_id !== undefined) row.linked_record_id = data.linked_record_id;
    if (data.linked_record_table !== undefined) row.linked_record_type = data.linked_record_table;
    if (data.error_message !== undefined) row.error_message = data.error_message;
    if (data.retry_count !== undefined) row.retry_count = data.retry_count;
    if (data.last_retried_at !== undefined) row.last_attempted_at = data.last_retried_at;
    const { data: updated, error } = await sb
      .from("care_event_routes")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return updated ? rowToRoute(updated) : null;
  },
};

// ── Care Event Audit Log ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAuditLog(row: Record<string, any>): CareEventAuditLog {
  return {
    id: row.id,
    care_event_id: row.care_event_id,
    home_id: row.home_id,
    action: row.action,
    actor_staff_id: row.actor_id ?? null,
    actor_role: row.actor_role ?? null,
    detail: row.detail ?? {},
    ip_address: null,
    created_at: row.performed_at ?? row.created_at,
  };
}

export const sbCareEventAuditLog = {
  async findAll(): Promise<CareEventAuditLog[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_event_audit_log")
      .select("*")
      .order("performed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToAuditLog);
  },

  async findByCareEvent(careEventId: string): Promise<CareEventAuditLog[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("care_event_audit_log")
      .select("*")
      .eq("care_event_id", careEventId)
      .order("performed_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToAuditLog);
  },

  async append(data: Omit<CareEventAuditLog, "id" | "created_at">): Promise<CareEventAuditLog> {
    const sb = supabase();
    const { data: inserted, error } = await sb
      .from("care_event_audit_log")
      .insert({
        care_event_id: data.care_event_id,
        home_id: data.home_id,
        action: data.action,
        actor_id: data.actor_staff_id,
        detail: data.detail ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return rowToAuditLog(inserted);
  },
};

// ── Reg 45 Evidence Queue ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReg45Evidence(row: Record<string, any>): Reg45EvidenceItem {
  return {
    id: row.id,
    care_event_id: row.care_event_id,
    home_id: row.home_id,
    suggested_text: row.suggested_text,
    suggested_theme: row.suggested_section ?? null,
    suggested_section: row.suggested_section ?? null,
    manager_decision: row.status === "approved" ? "approved"
      : row.status === "rejected" ? "rejected"
      : row.status === "deferred" ? "deferred"
      : "pending",
    manager_approved_text: row.approved_text ?? null,
    reviewed_by: row.manager_id ?? null,
    reviewed_at: row.decided_at ?? null,
    review_notes: row.manager_notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const sbReg45EvidenceQueue = {
  async findAll(): Promise<Reg45EvidenceItem[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("reg45_evidence_queue")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToReg45Evidence);
  },

  async findByHome(): Promise<Reg45EvidenceItem[]> {
    return sbReg45EvidenceQueue.findAll();
  },

  async findPending(): Promise<Reg45EvidenceItem[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("reg45_evidence_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToReg45Evidence);
  },

  async upsert(data: Omit<Reg45EvidenceItem, "id" | "created_at" | "updated_at">): Promise<Reg45EvidenceItem> {
    const sb = supabase();
    const now = new Date().toISOString();
    const row = {
      care_event_id: data.care_event_id,
      home_id: data.home_id,
      suggested_section: data.suggested_section ?? data.suggested_theme,
      suggested_text: data.suggested_text,
      status: data.manager_decision === "approved" ? "approved"
        : data.manager_decision === "rejected" ? "rejected"
        : data.manager_decision === "deferred" ? "deferred"
        : "pending",
      manager_notes: data.review_notes,
      manager_id: data.reviewed_by,
      decided_at: data.reviewed_at,
      approved_text: data.manager_approved_text,
      updated_at: now,
    };
    const { data: upserted, error } = await sb
      .from("reg45_evidence_queue")
      .upsert(row, { onConflict: "care_event_id" })
      .select()
      .single();
    if (error) throw error;
    return rowToReg45Evidence(upserted);
  },

  async patch(id: string, data: Partial<Reg45EvidenceItem>): Promise<Reg45EvidenceItem | null> {
    const sb = supabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.manager_decision !== undefined) {
      row.status = data.manager_decision;
    }
    if (data.manager_approved_text !== undefined) row.approved_text = data.manager_approved_text;
    if (data.review_notes !== undefined) row.manager_notes = data.review_notes;
    if (data.reviewed_by !== undefined) row.manager_id = data.reviewed_by;
    if (data.reviewed_at !== undefined) row.decided_at = data.reviewed_at;
    const { data: updated, error } = await sb
      .from("reg45_evidence_queue")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return updated ? rowToReg45Evidence(updated) : null;
  },
};

// ── Annex A Evidence Queue ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAnnexAEvidence(row: Record<string, any>): AnnexAEvidenceItem {
  return {
    id: row.id,
    care_event_id: row.care_event_id,
    home_id: row.home_id,
    annex_section: row.annex_a_section,
    suggested_text: row.suggested_text,
    manager_decision: row.status === "approved" ? "approved"
      : row.status === "rejected" ? "rejected"
      : row.status === "deferred" ? "deferred"
      : "pending",
    manager_approved_text: row.approved_text ?? null,
    reviewed_by: row.manager_id ?? null,
    reviewed_at: row.decided_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const sbAnnexAEvidenceQueue = {
  async findAll(): Promise<AnnexAEvidenceItem[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("annex_a_evidence_queue")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToAnnexAEvidence);
  },

  async findPending(): Promise<AnnexAEvidenceItem[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("annex_a_evidence_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToAnnexAEvidence);
  },

  async upsert(data: Omit<AnnexAEvidenceItem, "id" | "created_at" | "updated_at">): Promise<AnnexAEvidenceItem> {
    const sb = supabase();
    const now = new Date().toISOString();
    const row = {
      care_event_id: data.care_event_id,
      home_id: data.home_id,
      annex_a_section: data.annex_section,
      suggested_text: data.suggested_text,
      status: data.manager_decision === "approved" ? "approved"
        : data.manager_decision === "rejected" ? "rejected"
        : data.manager_decision === "deferred" ? "deferred"
        : "pending",
      manager_id: data.reviewed_by,
      decided_at: data.reviewed_at,
      approved_text: data.manager_approved_text,
      updated_at: now,
    };
    const { data: upserted, error } = await sb
      .from("annex_a_evidence_queue")
      .upsert(row, { onConflict: "care_event_id,annex_a_section" })
      .select()
      .single();
    if (error) throw error;
    return rowToAnnexAEvidence(upserted);
  },

  async patch(id: string, data: Partial<AnnexAEvidenceItem>): Promise<AnnexAEvidenceItem | null> {
    const sb = supabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.manager_decision !== undefined) row.status = data.manager_decision;
    if (data.manager_approved_text !== undefined) row.approved_text = data.manager_approved_text;
    if (data.reviewed_by !== undefined) row.manager_id = data.reviewed_by;
    if (data.reviewed_at !== undefined) row.decided_at = data.reviewed_at;
    const { data: updated, error } = await sb
      .from("annex_a_evidence_queue")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return updated ? rowToAnnexAEvidence(updated) : null;
  },
};

// ── Child Daily Summaries ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToChildDailySummary(row: Record<string, any>): ChildDailySummary {
  return {
    id: row.id,
    home_id: row.home_id,
    child_id: row.child_id,
    summary_date: row.summary_date,
    event_count: row.care_event_ids?.length ?? 0,
    significant_count: 0,
    avg_mood_score: null,
    categories: [],
    summary_text: row.key_events ?? null,
    requires_followup: row.review_required ?? false,
    generated_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const sbChildDailySummaries = {
  async findAll(): Promise<ChildDailySummary[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("child_daily_summaries")
      .select("*")
      .order("summary_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToChildDailySummary);
  },

  async findByChild(childId: string): Promise<ChildDailySummary[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("child_daily_summaries")
      .select("*")
      .eq("child_id", childId)
      .order("summary_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToChildDailySummary);
  },

  async findByDate(date: string): Promise<ChildDailySummary[]> {
    const sb = supabase();
    const { data, error } = await sb
      .from("child_daily_summaries")
      .select("*")
      .eq("summary_date", date);
    if (error) throw error;
    return (data ?? []).map(rowToChildDailySummary);
  },

  async upsert(data: Omit<ChildDailySummary, "id" | "generated_at" | "updated_at">): Promise<ChildDailySummary> {
    const sb = supabase();
    const now = new Date().toISOString();
    const row = {
      home_id: data.home_id,
      child_id: data.child_id,
      summary_date: data.summary_date,
      key_events: data.summary_text ?? "",
      positives: "",
      concerns: "",
      staff_notes: "",
      review_required: data.requires_followup ?? false,
      updated_at: now,
    };
    const { data: upserted, error } = await sb
      .from("child_daily_summaries")
      .upsert(row, { onConflict: "home_id,child_id,summary_date" })
      .select()
      .single();
    if (error) throw error;
    return rowToChildDailySummary(upserted);
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNotification(row: Record<string, any>): AppNotification {
  return {
    id: row.id,
    home_id: row.home_id,
    recipient_id: row.recipient_id,
    title: row.title,
    body: row.body,
    type: row.type ?? "system",
    priority: row.priority ?? "normal",
    read: row.read ?? false,
    read_at: row.read_at ?? null,
    action_url: row.action_url ?? null,
    entity_type: row.entity_type ?? null,
    entity_id: row.entity_id ?? null,
    created_at: row.created_at,
  };
}

export const sbNotifications = {
  async findByRecipient(recipientId: string, unreadOnly = false): Promise<AppNotification[]> {
    const sb = supabase();
    let query = sb
      .from("notifications")
      .select("*")
      .eq("recipient_id", recipientId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (unreadOnly) {
      query = query.eq("read", false);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(rowToNotification);
  },

  async create(data: Omit<AppNotification, "id" | "created_at">): Promise<AppNotification> {
    const sb = supabase();
    const { data: inserted, error } = await sb
      .from("notifications")
      .insert({
        home_id: data.home_id,
        recipient_id: data.recipient_id,
        title: data.title,
        body: data.body,
        type: data.type,
        priority: data.priority ?? "normal",
        read: false,
        action_url: data.action_url ?? null,
        entity_type: data.entity_type ?? null,
        entity_id: data.entity_id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToNotification(inserted);
  },

  async markRead(id: string): Promise<void> {
    const sb = supabase();
    const { error } = await sb
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  async markAllRead(recipientId: string): Promise<void> {
    const sb = supabase();
    const { error } = await sb
      .from("notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("recipient_id", recipientId)
      .eq("read", false);
    if (error) throw error;
  },
};
