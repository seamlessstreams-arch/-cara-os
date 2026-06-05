// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Action Centre (pure aggregation)
//
// A consolidated "what needs me right now" view tying together the live operational
// signals the workforce engine produces: emergencies (Phase 7), comms awaiting
// acknowledgement (Phases 1/2), safe-staffing criticals (Phase 7), and approvals
// (tasks awaiting sign-off). Complements the existing platform notifications feed —
// this is live, action-oriented, and deep-linked.
//
// Pure + deterministic: takes pre-gathered counts/records and returns ordered action
// items. PRIVACY: item titles/details are operational only — no child / medication /
// safeguarding content (counts and categories, never record contents).
// ══════════════════════════════════════════════════════════════════════════════

import type { EmergencyAlert } from "@/lib/staffing/emergency-types";
import { EMERGENCY_TYPE_LABEL } from "@/lib/staffing/emergency-types";
import type { SafeStaffingAssessment } from "@/lib/staffing/safe-staffing";

export type ActionSeverity = "critical" | "attention" | "info";
export type ActionCategory = "emergency" | "staffing" | "comms" | "approval";

export interface ActionItem {
  id: string;
  category: ActionCategory;
  severity: ActionSeverity;
  title: string;
  detail: string | null;
  href: string;
}

export interface ActionCenterInput {
  emergencies: EmergencyAlert[]; // active, in the user's home
  staffing: SafeStaffingAssessment;
  unacknowledgedComms: number; // messages awaiting this user's acknowledgement
  tasksAwaitingSignOff: number; // approvals
}

export interface ActionCenter {
  items: ActionItem[];
  total: number;
  critical: number;
}

const ORDER: Record<ActionSeverity, number> = { critical: 0, attention: 1, info: 2 };

/** Pure: build the ordered action-item list from gathered signals. */
export function aggregateActionItems(input: ActionCenterInput): ActionCenter {
  const items: ActionItem[] = [];

  // ── Emergencies (one item each) ──
  for (const e of input.emergencies) {
    items.push({
      id: `emergency:${e.id}`,
      category: "emergency",
      severity: "critical",
      title: `${EMERGENCY_TYPE_LABEL[e.type] ?? "Emergency"} — assistance needed`,
      detail: e.location ? `Location: ${e.location}` : null,
      href: "/safe-staffing",
    });
  }

  // ── Safe staffing (critical only) ──
  if (input.staffing?.severity === "critical") {
    const msg = input.staffing.alerts?.find((a) => a.severity === "critical")?.message ?? "Staffing is below the safe minimum.";
    items.push({
      id: "staffing:critical",
      category: "staffing",
      severity: "critical",
      title: "Safe staffing needs attention",
      detail: msg,
      href: "/safe-staffing",
    });
  }

  // ── Comms awaiting acknowledgement ──
  if (input.unacknowledgedComms > 0) {
    items.push({
      id: "comms:acks",
      category: "comms",
      severity: "attention",
      title: `${input.unacknowledgedComms} message${input.unacknowledgedComms === 1 ? "" : "s"} need your acknowledgement`,
      detail: "Open the Comms Centre to read and acknowledge.",
      href: "/comms",
    });
  }

  // ── Approvals (tasks awaiting sign-off) ──
  if (input.tasksAwaitingSignOff > 0) {
    items.push({
      id: "approval:signoff",
      category: "approval",
      severity: "attention",
      title: `${input.tasksAwaitingSignOff} item${input.tasksAwaitingSignOff === 1 ? "" : "s"} awaiting sign-off`,
      detail: "Review and sign off in your tasks.",
      href: "/tasks",
    });
  }

  items.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return {
    items,
    total: items.length,
    critical: items.filter((i) => i.severity === "critical").length,
  };
}
