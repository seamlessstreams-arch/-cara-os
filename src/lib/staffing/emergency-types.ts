// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Emergency alert types (Phase 7)
//
// Operational emergency categories only — deliberately NOT child/safeguarding/
// medical detail. The broadcast notification stays generic ("assistance needed");
// any further detail lives in the (permission-gated) alert record, never the
// notification.
// ══════════════════════════════════════════════════════════════════════════════

export type EmergencyType = "medical" | "fire" | "security" | "evacuation" | "missing" | "other";
export type EmergencyStatus = "active" | "resolved";

export const EMERGENCY_TYPE_LABEL: Record<EmergencyType, string> = {
  medical: "Medical",
  fire: "Fire",
  security: "Security",
  evacuation: "Evacuation",
  missing: "Missing from home",
  other: "General emergency",
};

export interface EmergencyResponder {
  staff_id: string;
  name: string;
  at: string;
}

export interface EmergencyAlert {
  id: string;
  home_id: string;
  type: EmergencyType;
  raised_by: string;
  raised_by_name: string;
  /** Free-text location within the home (e.g. "kitchen") — optional. */
  location: string | null;
  /** Short operational note — optional, kept generic. */
  note: string | null;
  status: EmergencyStatus;
  responders: EmergencyResponder[];
  /** The emergency_broadcast Comms message this raised, if any. */
  broadcast_message_id: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}
