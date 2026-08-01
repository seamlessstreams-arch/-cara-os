// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF HANDOVER NOTES SERVICE
// Tracks detailed handover notes staff leave during shift changes,
// capturing child-specific updates, medication reminders, task
// handovers, and follow-up actions for continuity of care.
// CHR 2015 Reg 22 (arrangements for supervision — effective handovers),
// Reg 13 (leadership and management — recording quality),
// Reg 6 (quality of care — continuity for children).
//
// Covers: child-specific updates, medication reminders, task
// completion, follow-up actions, emotional check-ins, safeguarding
// updates, and staff communications.
//
// SCCIF: Leadership — "Handover records support continuity."
// "Staff have all information needed to care for children."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type NoteCategory =
  | "child_update"
  | "medication_reminder"
  | "task_handover"
  | "safeguarding_update"
  | "emotional_update"
  | "appointment_reminder"
  | "behaviour_update"
  | "contact_update"
  | "maintenance_request"
  | "other";

export type NotePriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "information_only";

export type NoteStatus =
  | "pending"
  | "acknowledged"
  | "actioned"
  | "escalated"
  | "closed";

export type ShiftType =
  | "day_to_night"
  | "night_to_day"
  | "day_to_day"
  | "weekend_handover"
  | "emergency_handover"
  | "management_handover"
  | "agency_staff"
  | "annual_leave_return"
  | "training_return"
  | "other";

export interface StaffHandoverNotesRecord {
  id: string;
  home_id: string;
  note_category: NoteCategory;
  note_priority: NotePriority;
  note_status: NoteStatus;
  shift_type: ShiftType;
  handover_date: string;
  outgoing_staff: string;
  incoming_staff: string;
  child_specific: boolean;
  medication_related: boolean;
  safeguarding_related: boolean;
  task_completed: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  acknowledged_by_incoming: boolean;
  manager_informed: boolean;
  time_sensitive: boolean;
  verbal_handover_given: boolean;
  written_record_complete: boolean;
  risk_related: boolean;
  social_worker_update: boolean;
  issues_found: string[];
  actions_taken: string[];
  child_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const NOTE_CATEGORIES: { category: NoteCategory; label: string }[] = [
  { category: "child_update", label: "Child Update" },
  { category: "medication_reminder", label: "Medication Reminder" },
  { category: "task_handover", label: "Task Handover" },
  { category: "safeguarding_update", label: "Safeguarding Update" },
  { category: "emotional_update", label: "Emotional Update" },
  { category: "appointment_reminder", label: "Appointment Reminder" },
  { category: "behaviour_update", label: "Behaviour Update" },
  { category: "contact_update", label: "Contact Update" },
  { category: "maintenance_request", label: "Maintenance Request" },
  { category: "other", label: "Other" },
];

export const NOTE_PRIORITIES: { priority: NotePriority; label: string }[] = [
  { priority: "critical", label: "Critical" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
  { priority: "information_only", label: "Information Only" },
];

export const NOTE_STATUSES: { status: NoteStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "acknowledged", label: "Acknowledged" },
  { status: "actioned", label: "Actioned" },
  { status: "escalated", label: "Escalated" },
  { status: "closed", label: "Closed" },
];

export const SHIFT_TYPES: { type: ShiftType; label: string }[] = [
  { type: "day_to_night", label: "Day to Night" },
  { type: "night_to_day", label: "Night to Day" },
  { type: "day_to_day", label: "Day to Day" },
  { type: "weekend_handover", label: "Weekend Handover" },
  { type: "emergency_handover", label: "Emergency Handover" },
  { type: "management_handover", label: "Management Handover" },
  { type: "agency_staff", label: "Agency Staff" },
  { type: "annual_leave_return", label: "Annual Leave Return" },
  { type: "training_return", label: "Training Return" },
  { type: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffHandoverNotesMetrics(
  records: StaffHandoverNotesRecord[],
): {
  total_notes: number;
  critical_count: number;
  high_count: number;
  escalated_count: number;
  pending_count: number;
  child_specific_rate: number | null;
  medication_related_rate: number | null;
  safeguarding_related_rate: number | null;
  task_completed_rate: number | null;
  follow_up_required_count: number;
  follow_up_completed_rate: number | null;
  acknowledged_rate: number | null;
  manager_informed_rate: number | null;
  time_sensitive_rate: number | null;
  verbal_handover_rate: number | null;
  written_record_rate: number | null;
  risk_related_rate: number | null;
  social_worker_update_rate: number | null;
  by_note_category: Record<string, number>;
  by_note_priority: Record<string, number>;
  by_note_status: Record<string, number>;
  by_shift_type: Record<string, number>;
} {
  const critical = records.filter((r) => r.note_priority === "critical").length;
  const high = records.filter((r) => r.note_priority === "high").length;
  const escalated = records.filter((r) => r.note_status === "escalated").length;
  const pending = records.filter((r) => r.note_status === "pending").length;

  const boolRate = (field: keyof StaffHandoverNotesRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const followUpRequired = records.filter((r) => r.follow_up_required).length;
  const followUpRecords = records.filter((r) => r.follow_up_required);
  const followUpCompletedRate = followUpRecords.length > 0
    ? Math.round((followUpRecords.filter((r) => r.follow_up_completed).length / followUpRecords.length) * 1000) / 10
    : null;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.note_category] = (byCategory[r.note_category] ?? 0) + 1;

  const byPriority: Record<string, number> = {};
  for (const r of records) byPriority[r.note_priority] = (byPriority[r.note_priority] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.note_status] = (byStatus[r.note_status] ?? 0) + 1;

  const byShift: Record<string, number> = {};
  for (const r of records) byShift[r.shift_type] = (byShift[r.shift_type] ?? 0) + 1;

  return {
    total_notes: records.length,
    critical_count: critical,
    high_count: high,
    escalated_count: escalated,
    pending_count: pending,
    child_specific_rate: boolRate("child_specific"),
    medication_related_rate: boolRate("medication_related"),
    safeguarding_related_rate: boolRate("safeguarding_related"),
    task_completed_rate: boolRate("task_completed"),
    follow_up_required_count: followUpRequired,
    follow_up_completed_rate: followUpCompletedRate,
    acknowledged_rate: boolRate("acknowledged_by_incoming"),
    manager_informed_rate: boolRate("manager_informed"),
    time_sensitive_rate: boolRate("time_sensitive"),
    verbal_handover_rate: boolRate("verbal_handover_given"),
    written_record_rate: boolRate("written_record_complete"),
    risk_related_rate: boolRate("risk_related"),
    social_worker_update_rate: boolRate("social_worker_update"),
    by_note_category: byCategory,
    by_note_priority: byPriority,
    by_note_status: byStatus,
    by_shift_type: byShift,
  };
}

export function identifyStaffHandoverNotesAlerts(
  records: StaffHandoverNotesRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Critical safeguarding not escalated
  for (const r of records) {
    if (r.note_priority === "critical" && r.safeguarding_related && r.note_status === "pending") {
      alerts.push({
        type: "critical_safeguarding_pending",
        severity: "critical",
        message: `Critical safeguarding note from ${r.outgoing_staff} on ${r.handover_date} still pending — escalate immediately`,
        id: r.id,
      });
    }
  }

  // Not acknowledged
  const notAcknowledged = records.filter((r) => !r.acknowledged_by_incoming).length;
  if (notAcknowledged >= 1) {
    alerts.push({
      type: "not_acknowledged",
      severity: "high",
      message: `${notAcknowledged} ${notAcknowledged === 1 ? "note has" : "notes have"} not been acknowledged by incoming staff`,
      id: "not_acknowledged",
    });
  }

  // Follow-up overdue
  const followUpOverdue = records.filter((r) => r.follow_up_required && !r.follow_up_completed).length;
  if (followUpOverdue >= 1) {
    alerts.push({
      type: "follow_up_overdue",
      severity: "high",
      message: `${followUpOverdue} ${followUpOverdue === 1 ? "note has" : "notes have"} follow-up required but not completed`,
      id: "follow_up_overdue",
    });
  }

  // Written record not complete
  const noWritten = records.filter((r) => !r.written_record_complete).length;
  if (noWritten >= 2) {
    alerts.push({
      type: "no_written_record",
      severity: "medium",
      message: `${noWritten} notes without written record — maintain documentation standards`,
      id: "no_written_record",
    });
  }

  // No verbal handover
  const noVerbal = records.filter((r) => !r.verbal_handover_given).length;
  if (noVerbal >= 3) {
    alerts.push({
      type: "no_verbal_handover",
      severity: "medium",
      message: `${noVerbal} notes without verbal handover — ensure face-to-face communication`,
      id: "no_verbal_handover",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    noteCategory?: NoteCategory;
    notePriority?: NotePriority;
    noteStatus?: NoteStatus;
    shiftType?: ShiftType;
    limit?: number;
  },
): Promise<ServiceResult<StaffHandoverNotesRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_handover_notes") as SB).select("*").eq("home_id", homeId);
  if (filters?.noteCategory) q = q.eq("note_category", filters.noteCategory);
  if (filters?.notePriority) q = q.eq("note_priority", filters.notePriority);
  if (filters?.noteStatus) q = q.eq("note_status", filters.noteStatus);
  if (filters?.shiftType) q = q.eq("shift_type", filters.shiftType);
  q = q.order("handover_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    noteCategory: NoteCategory;
    notePriority: NotePriority;
    noteStatus: NoteStatus;
    shiftType: ShiftType;
    handoverDate: string;
    outgoingStaff: string;
    incomingStaff: string;
    childSpecific?: boolean;
    medicationRelated?: boolean;
    safeguardingRelated?: boolean;
    taskCompleted?: boolean;
    followUpRequired?: boolean;
    followUpCompleted?: boolean;
    acknowledgedByIncoming?: boolean;
    managerInformed?: boolean;
    timeSensitive?: boolean;
    verbalHandoverGiven?: boolean;
    writtenRecordComplete?: boolean;
    riskRelated?: boolean;
    socialWorkerUpdate?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    childName?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffHandoverNotesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_handover_notes") as SB)
    .insert({
      home_id: payload.homeId,
      note_category: payload.noteCategory,
      note_priority: payload.notePriority,
      note_status: payload.noteStatus,
      shift_type: payload.shiftType,
      handover_date: payload.handoverDate,
      outgoing_staff: payload.outgoingStaff,
      incoming_staff: payload.incomingStaff,
      child_specific: payload.childSpecific ?? false,
      medication_related: payload.medicationRelated ?? false,
      safeguarding_related: payload.safeguardingRelated ?? false,
      task_completed: payload.taskCompleted ?? false,
      follow_up_required: payload.followUpRequired ?? false,
      follow_up_completed: payload.followUpCompleted ?? false,
      acknowledged_by_incoming: payload.acknowledgedByIncoming ?? false,
      manager_informed: payload.managerInformed ?? false,
      time_sensitive: payload.timeSensitive ?? false,
      verbal_handover_given: payload.verbalHandoverGiven ?? true,
      written_record_complete: payload.writtenRecordComplete ?? true,
      risk_related: payload.riskRelated ?? false,
      social_worker_update: payload.socialWorkerUpdate ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      child_name: payload.childName ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    noteCategory: NoteCategory;
    notePriority: NotePriority;
    noteStatus: NoteStatus;
    shiftType: ShiftType;
    handoverDate: string;
    outgoingStaff: string;
    incomingStaff: string;
    childSpecific: boolean;
    medicationRelated: boolean;
    safeguardingRelated: boolean;
    taskCompleted: boolean;
    followUpRequired: boolean;
    followUpCompleted: boolean;
    acknowledgedByIncoming: boolean;
    managerInformed: boolean;
    timeSensitive: boolean;
    verbalHandoverGiven: boolean;
    writtenRecordComplete: boolean;
    riskRelated: boolean;
    socialWorkerUpdate: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    childName: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffHandoverNotesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.noteCategory !== undefined) mapped.note_category = updates.noteCategory;
  if (updates.notePriority !== undefined) mapped.note_priority = updates.notePriority;
  if (updates.noteStatus !== undefined) mapped.note_status = updates.noteStatus;
  if (updates.shiftType !== undefined) mapped.shift_type = updates.shiftType;
  if (updates.handoverDate !== undefined) mapped.handover_date = updates.handoverDate;
  if (updates.outgoingStaff !== undefined) mapped.outgoing_staff = updates.outgoingStaff;
  if (updates.incomingStaff !== undefined) mapped.incoming_staff = updates.incomingStaff;
  if (updates.childSpecific !== undefined) mapped.child_specific = updates.childSpecific;
  if (updates.medicationRelated !== undefined) mapped.medication_related = updates.medicationRelated;
  if (updates.safeguardingRelated !== undefined) mapped.safeguarding_related = updates.safeguardingRelated;
  if (updates.taskCompleted !== undefined) mapped.task_completed = updates.taskCompleted;
  if (updates.followUpRequired !== undefined) mapped.follow_up_required = updates.followUpRequired;
  if (updates.followUpCompleted !== undefined) mapped.follow_up_completed = updates.followUpCompleted;
  if (updates.acknowledgedByIncoming !== undefined) mapped.acknowledged_by_incoming = updates.acknowledgedByIncoming;
  if (updates.managerInformed !== undefined) mapped.manager_informed = updates.managerInformed;
  if (updates.timeSensitive !== undefined) mapped.time_sensitive = updates.timeSensitive;
  if (updates.verbalHandoverGiven !== undefined) mapped.verbal_handover_given = updates.verbalHandoverGiven;
  if (updates.writtenRecordComplete !== undefined) mapped.written_record_complete = updates.writtenRecordComplete;
  if (updates.riskRelated !== undefined) mapped.risk_related = updates.riskRelated;
  if (updates.socialWorkerUpdate !== undefined) mapped.social_worker_update = updates.socialWorkerUpdate;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_handover_notes") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffHandoverNotesMetrics,
  identifyStaffHandoverNotesAlerts,
};
