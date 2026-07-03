// ══════════════════════════════════════════════════════════════════════════════
// CARA COMMS CENTRE — types (Phase 1)
//
// Secure internal messaging to replace WhatsApp / personal email. Role-based,
// home-based, shift-aware, auditable. Messages can later be converted into
// formal records (Phase 2) and never become hidden second records.
// ══════════════════════════════════════════════════════════════════════════════

/** Sensitivity drives screen protection + notification privacy (shared scale). */
export type CommsSensitivity =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "highly_restricted";

/** The fixed set of channel types a home operates. */
export type CommsChannelType =
  | "home_announcements"
  | "shift_handover"
  | "managers_seniors"
  | "waking_night"
  | "medication_updates"
  | "safeguarding_alerts"
  | "rota_cover"
  | "health_safety"
  | "maintenance"
  | "training_policy"
  | "keywork_sessions"
  | "emergency_broadcast";

/** Who may read/post in a channel — enforced server-side via the access engine. */
export type CommsChannelAccess =
  | "all_staff" // any staff member of the home (off-shift readable for limited types)
  | "on_shift" // operational channels — only staff signed in + assigned
  | "managers" // managers/seniors only (off-shift readable for managers)
  | "role_restricted" // restricted to allowed_roles
  | "child_linked" // requires child-level permission
  | "incident_linked" // requires incident-level permission
  | "safeguarding"; // requires safeguarding-level permission

export const COMMS_CHANNEL_LABEL: Record<CommsChannelType, string> = {
  home_announcements: "Whole Home Announcements",
  shift_handover: "Shift Handover",
  managers_seniors: "Managers & Seniors",
  waking_night: "Waking Night Team",
  medication_updates: "Medication Updates",
  safeguarding_alerts: "Safeguarding Alerts",
  rota_cover: "Rota Cover Requests",
  health_safety: "Health & Safety",
  maintenance: "Maintenance",
  training_policy: "Training & Policy Updates",
  keywork_sessions: "Key Work & Sessions",
  emergency_broadcast: "Emergency Broadcasts",
};

export interface CommsChannel {
  id: string;
  home_id: string;
  type: CommsChannelType;
  name: string;
  description: string | null;
  access: CommsChannelAccess;
  allowed_roles: string[]; // used when access === "role_restricted"
  linked_child_id: string | null;
  linked_incident_id: string | null;
  sensitivity: CommsSensitivity;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CommsChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role_in_channel: "member" | "admin";
  muted: boolean;
  joined_at: string;
}

export type CommsMessagePriority = "normal" | "urgent" | "emergency";

/** Records a message can be linked to (Phase 1 link, Phase 2 conversion). */
export type CommsLinkedRecordType =
  | "child_profile"
  | "daily_log"
  | "incident"
  | "medication_record"
  | "risk_assessment"
  | "missing_episode"
  | "keywork_session"
  | "health_appointment"
  | "school_update"
  | "family_contact"
  | "professional_visit"
  | "task"
  | "management_oversight";

export interface CommsMessageEdit {
  body: string;
  edited_at: string;
  edited_by: string;
}

export interface CommsMessage {
  id: string;
  channel_id: string;
  home_id: string;
  author_id: string;
  body: string;
  priority: CommsMessagePriority;
  requires_acknowledgement: boolean;
  linked_child_id: string | null;
  linked_incident_id: string | null;
  linked_record_type: CommsLinkedRecordType | null;
  linked_record_id: string | null;
  edited: boolean;
  edit_history: CommsMessageEdit[];
  is_deleted: boolean; // soft delete — messages are never hard-deleted
  deleted_at: string | null;
  deleted_by: string | null;
  retention_category: string; // Phase 2/14 retention
  investigation_hold: boolean; // Phase 2/13 hold
  created_at: string;
  updated_at: string;
}

export interface CommsMessageReceipt {
  id: string;
  message_id: string;
  channel_id: string;
  user_id: string;
  read_at: string | null;
  acknowledged_at: string | null;
}

/** Conversion of a message into a formal record / task (Phase 1 records intent). */
export type CommsMessageActionType =
  | "task"
  | "daily_log"
  | "incident_follow_up"
  | "safeguarding_concern"
  | "medication_note"
  | "risk_assessment_review"
  | "management_oversight"
  | "keywork_action"
  | "reg44_evidence"
  | "reg45_evidence";

export interface CommsMessageAction {
  id: string;
  message_id: string;
  action_type: CommsMessageActionType;
  target_record_id: string | null;
  created_by: string;
  created_at: string;
}

export interface StaffTrustNoticeAck {
  id: string;
  organisation_id: string;
  user_id: string;
  notice_version: string;
  acknowledged_at: string;
  device_id: string | null;
  created_at: string;
}

/** The current Staff Trust Notice version — bump to require re-acknowledgement. */
export const STAFF_TRUST_NOTICE_VERSION = "2026-07-v2";

// ── Enriched read shapes (returned by the API) ────────────────────────────────

export interface CommsMessageEnriched extends CommsMessage {
  author_name: string;
  read_count: number;
  acknowledged_count: number;
  /** Whether the requesting user has read / acknowledged this message. */
  read_by_me: boolean;
  acknowledged_by_me: boolean;
}

export interface CommsChannelSummary extends CommsChannel {
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
}
