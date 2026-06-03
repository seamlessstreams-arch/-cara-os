// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT TYPE DISPLAY METADATA
// Single source of truth for how CornerstoneEvent types render in the UI. Both
// maps are exhaustive Record<CornerstoneEventType, string>, so adding a new event
// type forces a label here — no more snake_case leaking into the timeline.
//   • EVENT_TYPE_LABEL       — full labels (timeline, intelligence)
//   • EVENT_TYPE_LABEL_SHORT — compact labels (dashboard widgets)
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEventType } from "@/types/cornerstone-event";

export const EVENT_TYPE_LABEL: Record<CornerstoneEventType, string> = {
  daily_log: "Daily log",
  incident: "Incident",
  safeguarding: "Safeguarding",
  medication: "Medication",
  missing: "Missing",
  physical_intervention: "Physical intervention",
  keywork: "Key-working",
  education: "Education",
  health: "Health",
  complaint: "Complaint",
  family_contact: "Family contact",
  risk_assessment: "Risk assessment",
  lac_review: "LAC review",
  notifiable_event: "Notifiable event",
  behaviour_support_plan: "Behaviour support plan",
  staff_absence: "Staff absence",
  overtime: "Overtime",
  supervision: "Supervision",
  maintenance: "Maintenance",
  qa_check: "QA check",
  reg44: "Reg 44",
  reg45: "Reg 45",
};

export const EVENT_TYPE_LABEL_SHORT: Record<CornerstoneEventType, string> = {
  daily_log: "Log",
  incident: "Incident",
  safeguarding: "Safeguarding",
  medication: "Medication",
  missing: "Missing",
  physical_intervention: "Restraint",
  keywork: "Key-work",
  education: "Education",
  health: "Health",
  complaint: "Complaint",
  family_contact: "Family",
  risk_assessment: "Risk",
  lac_review: "LAC review",
  notifiable_event: "Notifiable",
  behaviour_support_plan: "BSP",
  staff_absence: "Absence",
  overtime: "Overtime",
  supervision: "Supervision",
  maintenance: "Maintenance",
  qa_check: "QA",
  reg44: "Reg 44",
  reg45: "Reg 45",
};

/** Display label for an event type. Falls back to a humanised form for unknown types. */
export function eventTypeLabel(type: string, short = false): string {
  const map = short ? EVENT_TYPE_LABEL_SHORT : EVENT_TYPE_LABEL;
  const known = map[type as CornerstoneEventType];
  if (known) return known;
  return type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
