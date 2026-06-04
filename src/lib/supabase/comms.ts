// ══════════════════════════════════════════════════════════════════════════════
// COMMS CENTRE — Supabase write-through (Phase 1)
//
// Durable persistence for comms channels/messages/receipts/trust-notice acks.
// Fully gated by isSupabaseEnabled():
//   • Supabase off (demo) → every function is a safe no-op; the in-memory store
//     already holds the data. Zero behaviour change.
//   • Supabase on → rows are upserted to the comms_* tables (migration 403) and
//     survive restarts. Best-effort: a failure never breaks the in-memory write.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "./server";
import type { CommsChannel, CommsMessage, CommsMessageReceipt, StaffTrustNoticeAck } from "@/types/comms";

// Loose-typed — these tables aren't in the generated Database types yet.
type SB = any; // eslint-disable-line @typescript-eslint/no-explicit-any
function sb(): SB | null {
  return createServerClient() as unknown as SB;
}

async function upsert(table: string, row: Record<string, unknown>): Promise<{ persisted: boolean; error?: string }> {
  if (!isSupabaseEnabled()) return { persisted: false };
  const s = sb();
  if (!s) return { persisted: false };
  try {
    const { error } = await s.from(table).upsert(row);
    return error ? { persisted: false, error: error.message } : { persisted: true };
  } catch (err) {
    return { persisted: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function persistCommsChannel(c: CommsChannel) {
  return upsert("comms_channels", {
    id: c.id, home_id: c.home_id, type: c.type, name: c.name, description: c.description,
    access: c.access, allowed_roles: c.allowed_roles, linked_child_id: c.linked_child_id,
    linked_incident_id: c.linked_incident_id, sensitivity: c.sensitivity, is_archived: c.is_archived,
    created_by: c.created_by, created_at: c.created_at, updated_at: c.updated_at,
  });
}

export function persistCommsMessage(m: CommsMessage) {
  return upsert("comms_messages", {
    id: m.id, channel_id: m.channel_id, home_id: m.home_id, author_id: m.author_id, body: m.body,
    priority: m.priority, requires_acknowledgement: m.requires_acknowledgement, linked_child_id: m.linked_child_id,
    linked_incident_id: m.linked_incident_id, linked_record_type: m.linked_record_type, linked_record_id: m.linked_record_id,
    edited: m.edited, edit_history: m.edit_history, is_deleted: m.is_deleted, deleted_at: m.deleted_at,
    deleted_by: m.deleted_by, retention_category: m.retention_category, investigation_hold: m.investigation_hold,
    created_at: m.created_at, updated_at: m.updated_at,
  });
}

export function persistCommsReceipt(r: CommsMessageReceipt) {
  return upsert("comms_message_receipts", {
    id: r.id, message_id: r.message_id, channel_id: r.channel_id, user_id: r.user_id,
    read_at: r.read_at, acknowledged_at: r.acknowledged_at,
  });
}

export function persistTrustNoticeAck(a: StaffTrustNoticeAck) {
  return upsert("staff_trust_notice_acknowledgements", {
    id: a.id, organisation_id: a.organisation_id, user_id: a.user_id, notice_version: a.notice_version,
    acknowledged_at: a.acknowledged_at, device_id: a.device_id, created_at: a.created_at,
  });
}
