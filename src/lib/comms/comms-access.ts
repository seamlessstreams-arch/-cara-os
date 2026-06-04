// ══════════════════════════════════════════════════════════════════════════════
// COMMS CENTRE — access logic (Phase 1)
//
// Pure, deterministic, server-side access rules for channels/messages. Extends
// the existing permission engine's concepts (role · active shift · home · channel
// sensitivity) rather than duplicating it. The API routes call these and log the
// decision; UI never decides access on its own.
//
// Core principles enforced here:
//   • Managers/seniors may read relevant channels even when OFF shift.
//   • General staff get operational channels only when ON shift.
//   • Off-shift general staff keep limited read access (announcements, rota,
//     training, H&S) — never operational/child/incident/safeguarding channels.
//   • Child/incident/safeguarding channels require elevated permission.
// ══════════════════════════════════════════════════════════════════════════════

import type { CommsChannel } from "@/types/comms";

export interface CommsUser {
  id: string;
  role: string; // SystemRole / Role string
  home_id: string;
  shift_active: boolean;
  /** Child IDs the user is permitted to see (key worker / assigned). Phase 2 expands this. */
  assigned_child_ids?: string[];
  /** True for designated safeguarding leads (Phase 2 wires this from staff record). */
  safeguarding_lead?: boolean;
}

export interface CommsAccessResult {
  allowed: boolean;
  reason: string;
}

const MANAGER_ROLES = new Set([
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
  "operations_manager",
  "team_leader",
  "admin",
  "super_admin",
  "provider_owner",
  "senior_rsw",
]);

export function isManagerRole(role: string): boolean {
  return MANAGER_ROLES.has(role);
}

/** Channels an off-shift general staff member may still READ (limited portal). */
const OFF_SHIFT_READABLE_TYPES = new Set([
  "home_announcements",
  "rota_cover",
  "training_policy",
  "health_safety",
  "emergency_broadcast",
]);

function homeOk(user: CommsUser, channel: CommsChannel): boolean {
  return channel.home_id === user.home_id || isManagerRole(user.role);
}

/** Can the user READ this channel + its messages? */
export function canViewChannel(user: CommsUser, channel: CommsChannel): CommsAccessResult {
  if (!homeOk(user, channel)) return { allowed: false, reason: "home_mismatch" };
  const manager = isManagerRole(user.role);

  switch (channel.access) {
    case "all_staff":
      return { allowed: true, reason: "all_staff" };
    case "on_shift":
      if (manager) return { allowed: true, reason: "manager_oversight" };
      if (user.shift_active) return { allowed: true, reason: "on_shift" };
      // off-shift general staff: only limited channel types
      if (OFF_SHIFT_READABLE_TYPES.has(channel.type)) return { allowed: true, reason: "off_shift_limited" };
      return { allowed: false, reason: "not_on_shift" };
    case "managers":
      return manager ? { allowed: true, reason: "manager" } : { allowed: false, reason: "managers_only" };
    case "role_restricted":
      if (manager) return { allowed: true, reason: "manager_oversight" };
      return channel.allowed_roles.includes(user.role)
        ? { allowed: true, reason: "role_allowed" }
        : { allowed: false, reason: "role_not_allowed" };
    case "child_linked":
      if (manager) return { allowed: true, reason: "manager_oversight" };
      if (!user.shift_active) return { allowed: false, reason: "not_on_shift" };
      if (channel.linked_child_id && (user.assigned_child_ids ?? []).includes(channel.linked_child_id))
        return { allowed: true, reason: "child_assigned" };
      return { allowed: false, reason: "child_permission_required" };
    case "incident_linked":
      // Incident-level permission (Phase 2 wires per-incident grants); managers + on-shift staff for now.
      if (manager) return { allowed: true, reason: "manager_oversight" };
      return user.shift_active ? { allowed: true, reason: "on_shift" } : { allowed: false, reason: "incident_permission_required" };
    case "safeguarding":
      if (manager || user.safeguarding_lead) return { allowed: true, reason: "safeguarding_permission" };
      return { allowed: false, reason: "safeguarding_permission_required" };
    default:
      return { allowed: false, reason: "unknown_access" };
  }
}

/** Can the user POST a message into this channel? */
export function canPostChannel(user: CommsUser, channel: CommsChannel): CommsAccessResult {
  const view = canViewChannel(user, channel);
  if (!view.allowed) return view;
  const manager = isManagerRole(user.role);

  // Emergency broadcasts and whole-home announcements are manager-authored.
  if ((channel.type === "emergency_broadcast" || channel.type === "home_announcements") && !manager) {
    return { allowed: false, reason: "manager_only_broadcast" };
  }
  // Off-shift general staff can read limited channels but not post to them.
  if (!manager && !user.shift_active && OFF_SHIFT_READABLE_TYPES.has(channel.type)) {
    return { allowed: false, reason: "off_shift_read_only" };
  }
  return { allowed: true, reason: view.reason };
}

/** Filter a list of channels to those the user may view. */
export function visibleChannels(user: CommsUser, channels: CommsChannel[]): CommsChannel[] {
  return channels.filter((c) => canViewChannel(user, c).allowed);
}
