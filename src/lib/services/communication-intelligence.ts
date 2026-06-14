// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMUNICATION INTELLIGENCE SERVICE
// Professional writing support: handover summaries, Reg 44/45 drafts,
// social worker updates, multi-agency meeting prep, and shift briefings.
// "Cara suggests. Humans decide. Cara evidences."
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

export type CommunicationType =
  | "handover_summary" | "social_worker_update" | "reg44_section"
  | "reg45_section" | "incident_notification" | "missing_notification"
  | "placement_update" | "multi_agency_brief" | "shift_briefing"
  | "professional_update" | "management_summary" | "ofsted_notification";

export type CommunicationStatus = "draft" | "review" | "approved" | "sent" | "archived";

export interface CommunicationDraft {
  id: string;
  home_id: string;
  communication_type: CommunicationType;
  title: string;
  content: string;
  recipient_context: string | null;
  child_id: string | null;
  staff_id: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  status: CommunicationStatus;
  cara_generated: boolean;
  cara_prompt_used: string | null;
  edited_by: string | null;
  edited_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Communication templates (pure — for Cara draft generation) ─────────────

export const COMMUNICATION_TEMPLATES: Record<CommunicationType, {
  label: string;
  description: string;
  sections: string[];
  regulationRef?: string;
}> = {
  handover_summary: {
    label: "Handover Summary",
    description: "End-of-shift handover covering each young person, key events, and outstanding tasks",
    sections: ["Young People Updates", "Key Events", "Medication Notes", "Outstanding Tasks", "Risk Updates", "Next Shift Priorities"],
  },
  social_worker_update: {
    label: "Social Worker Update",
    description: "Professional update for the child's allocated social worker",
    sections: ["Placement Overview", "Child's Presentation", "Achievements & Progress", "Concerns & Challenges", "Contact Arrangements", "Actions Required"],
    regulationRef: "CHR 2015 Reg 5 — Engaging with the responsible authority",
  },
  reg44_section: {
    label: "Regulation 44 Visit Section",
    description: "Section for the independent visitor's monthly Reg 44 report",
    sections: ["Summary of Visit", "Children's Experiences", "Staff Observations", "Physical Environment", "Records & Documentation", "Recommendations", "Previous Actions Progress"],
    regulationRef: "CHR 2015 Reg 44 — Independent person: visits and reports",
  },
  reg45_section: {
    label: "Regulation 45 Review Section",
    description: "Section for the provider's six-monthly Reg 45 quality of care review",
    sections: ["Quality of Care", "Children's Views", "Health & Education", "Safeguarding", "Leadership & Management", "Staffing", "Improvement Actions", "Impact Assessment"],
    regulationRef: "CHR 2015 Reg 45 — Review of quality of care",
  },
  incident_notification: {
    label: "Incident Notification",
    description: "Formal notification of a significant incident to relevant parties",
    sections: ["Incident Summary", "Immediate Actions Taken", "Young Person's Current Presentation", "Notifications Made", "Follow-Up Plan"],
    regulationRef: "CHR 2015 Reg 40 — Notification of significant events",
  },
  missing_notification: {
    label: "Missing from Care Notification",
    description: "Notification when a young person goes missing from the home",
    sections: ["Missing Person Details", "Circumstances", "Actions Taken", "Police Reference", "Risk Assessment", "Return Interview Plan"],
    regulationRef: "Statutory guidance on children who go missing from home or care (DfE 2014)",
  },
  placement_update: {
    label: "Placement Update",
    description: "General update on a young person's placement progress",
    sections: ["General Wellbeing", "Education Update", "Health Update", "Behavioural Progress", "Social Development", "Family Contact", "Care Plan Progress"],
  },
  multi_agency_brief: {
    label: "Multi-Agency Meeting Brief",
    description: "Pre-meeting brief for CLA reviews, strategy meetings, or professional meetings",
    sections: ["Meeting Context", "Current Placement Summary", "Key Developments", "Concerns for Discussion", "Proposed Actions", "Residential Home Position"],
  },
  shift_briefing: {
    label: "Shift Briefing",
    description: "Briefing notes for staff coming on shift",
    sections: ["Shift Overview", "Per-Child Updates", "Medication Due", "Activities Planned", "Risk Alerts", "Visitors Expected", "Key Tasks"],
  },
  professional_update: {
    label: "Professional Update",
    description: "Formal update for any professional involved in a child's care",
    sections: ["Context", "Update Summary", "Key Observations", "Requested Actions", "Contact Information"],
  },
  management_summary: {
    label: "Management Summary",
    description: "Weekly or monthly summary for senior management / responsible individual",
    sections: ["Occupancy", "Significant Events", "Staffing Overview", "Compliance Status", "Outcomes Highlights", "Concerns", "Actions for Decision"],
    regulationRef: "CHR 2015 Reg 13 — Leadership and management",
  },
  ofsted_notification: {
    label: "Ofsted Notification",
    description: "Formal notification to Ofsted of a notifiable event",
    sections: ["Notification Type", "Event Details", "Actions Taken", "Impact on Young People", "Ongoing Risk Management"],
    regulationRef: "CHR 2015 Reg 40 — Notification of significant events",
  },
};

// ── Draft generation (pure functions) ──────────────────────────────────────

export interface HandoverContext {
  shiftType: string;
  date: string;
  youngPeople: {
    name: string;
    mood: string;
    keyEvents: string[];
    medicationNotes: string[];
    riskUpdates: string[];
  }[];
  outstandingTasks: string[];
  staffOnShift: string[];
}

export function generateHandoverDraft(ctx: HandoverContext): string {
  const lines: string[] = [];
  lines.push(`# Handover Summary — ${ctx.shiftType} Shift, ${ctx.date}`);
  lines.push("");

  lines.push("## Young People Updates");
  for (const yp of ctx.youngPeople) {
    lines.push(`### ${yp.name}`);
    lines.push(`**Mood/Presentation:** ${yp.mood}`);
    if (yp.keyEvents.length > 0) {
      lines.push("**Key Events:**");
      for (const e of yp.keyEvents) lines.push(`- ${e}`);
    }
    if (yp.medicationNotes.length > 0) {
      lines.push("**Medication:**");
      for (const m of yp.medicationNotes) lines.push(`- ${m}`);
    }
    if (yp.riskUpdates.length > 0) {
      lines.push("**Risk Updates:**");
      for (const r of yp.riskUpdates) lines.push(`- ${r}`);
    }
    lines.push("");
  }

  if (ctx.outstandingTasks.length > 0) {
    lines.push("## Outstanding Tasks");
    for (const t of ctx.outstandingTasks) lines.push(`- [ ] ${t}`);
    lines.push("");
  }

  lines.push("## Staff on Next Shift");
  lines.push(ctx.staffOnShift.join(", "));

  return lines.join("\n");
}

export interface SocialWorkerUpdateContext {
  childName: string;
  socialWorkerName: string;
  periodFrom: string;
  periodTo: string;
  placementSummary: string;
  presentation: string;
  achievements: string[];
  concerns: string[];
  contactSummary: string;
  actionsRequired: string[];
}

export function generateSocialWorkerDraft(ctx: SocialWorkerUpdateContext): string {
  const lines: string[] = [];
  lines.push(`# Professional Update: ${ctx.childName}`);
  lines.push(`**To:** ${ctx.socialWorkerName}`);
  lines.push(`**Period:** ${ctx.periodFrom} to ${ctx.periodTo}`);
  lines.push("");

  lines.push("## Placement Overview");
  lines.push(ctx.placementSummary);
  lines.push("");

  lines.push("## Child's Presentation");
  lines.push(ctx.presentation);
  lines.push("");

  if (ctx.achievements.length > 0) {
    lines.push("## Achievements & Progress");
    for (const a of ctx.achievements) lines.push(`- ${a}`);
    lines.push("");
  }

  if (ctx.concerns.length > 0) {
    lines.push("## Concerns & Challenges");
    for (const c of ctx.concerns) lines.push(`- ${c}`);
    lines.push("");
  }

  lines.push("## Contact Arrangements");
  lines.push(ctx.contactSummary);
  lines.push("");

  if (ctx.actionsRequired.length > 0) {
    lines.push("## Actions Required");
    for (const a of ctx.actionsRequired) lines.push(`- [ ] ${a}`);
  }

  return lines.join("\n");
}

export interface ShiftBriefingContext {
  date: string;
  shiftType: string;
  youngPeople: {
    name: string;
    currentPresentation: string;
    riskLevel: string;
    keyInfo: string[];
  }[];
  medicationDue: { childName: string; medication: string; time: string }[];
  activitiesPlanned: string[];
  riskAlerts: string[];
  visitorsExpected: string[];
  keyTasks: string[];
}

export function generateShiftBriefingDraft(ctx: ShiftBriefingContext): string {
  const lines: string[] = [];
  lines.push(`# ${ctx.shiftType} Shift Briefing — ${ctx.date}`);
  lines.push("");

  if (ctx.riskAlerts.length > 0) {
    lines.push("## ⚠ Risk Alerts");
    for (const r of ctx.riskAlerts) lines.push(`- **${r}**`);
    lines.push("");
  }

  lines.push("## Young People");
  for (const yp of ctx.youngPeople) {
    lines.push(`### ${yp.name} (Risk: ${yp.riskLevel})`);
    lines.push(yp.currentPresentation);
    if (yp.keyInfo.length > 0) {
      for (const k of yp.keyInfo) lines.push(`- ${k}`);
    }
    lines.push("");
  }

  if (ctx.medicationDue.length > 0) {
    lines.push("## Medication Due");
    for (const m of ctx.medicationDue) {
      lines.push(`- **${m.time}** — ${m.childName}: ${m.medication}`);
    }
    lines.push("");
  }

  if (ctx.activitiesPlanned.length > 0) {
    lines.push("## Activities Planned");
    for (const a of ctx.activitiesPlanned) lines.push(`- ${a}`);
    lines.push("");
  }

  if (ctx.visitorsExpected.length > 0) {
    lines.push("## Visitors Expected");
    for (const v of ctx.visitorsExpected) lines.push(`- ${v}`);
    lines.push("");
  }

  if (ctx.keyTasks.length > 0) {
    lines.push("## Key Tasks");
    for (const t of ctx.keyTasks) lines.push(`- [ ] ${t}`);
  }

  return lines.join("\n");
}

export interface ManagementSummaryContext {
  periodLabel: string;
  homeName: string;
  occupancy: { current: number; capacity: number };
  significantEvents: { date: string; summary: string; severity: string }[];
  staffingHighlights: string[];
  complianceStatus: { area: string; status: "compliant" | "attention" | "non_compliant" }[];
  outcomesHighlights: string[];
  concerns: string[];
  decisionsNeeded: string[];
}

export function generateManagementSummaryDraft(ctx: ManagementSummaryContext): string {
  const lines: string[] = [];
  lines.push(`# Management Summary — ${ctx.homeName}`);
  lines.push(`**Period:** ${ctx.periodLabel}`);
  lines.push("");

  lines.push("## Occupancy");
  lines.push(`${ctx.occupancy.current}/${ctx.occupancy.capacity} places occupied`);
  lines.push("");

  if (ctx.significantEvents.length > 0) {
    lines.push("## Significant Events");
    for (const e of ctx.significantEvents) {
      lines.push(`- **${e.date}** [${e.severity.toUpperCase()}] — ${e.summary}`);
    }
    lines.push("");
  }

  if (ctx.staffingHighlights.length > 0) {
    lines.push("## Staffing");
    for (const s of ctx.staffingHighlights) lines.push(`- ${s}`);
    lines.push("");
  }

  if (ctx.complianceStatus.length > 0) {
    lines.push("## Compliance");
    for (const c of ctx.complianceStatus) {
      const icon = c.status === "compliant" ? "✓" : c.status === "attention" ? "⚠" : "✗";
      lines.push(`- ${icon} ${c.area}: ${c.status.replace("_", "-")}`);
    }
    lines.push("");
  }

  if (ctx.outcomesHighlights.length > 0) {
    lines.push("## Outcomes");
    for (const o of ctx.outcomesHighlights) lines.push(`- ${o}`);
    lines.push("");
  }

  if (ctx.concerns.length > 0) {
    lines.push("## Concerns");
    for (const c of ctx.concerns) lines.push(`- ${c}`);
    lines.push("");
  }

  if (ctx.decisionsNeeded.length > 0) {
    lines.push("## Actions for Decision");
    for (const d of ctx.decisionsNeeded) lines.push(`- [ ] ${d}`);
  }

  return lines.join("\n");
}

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function listDrafts(
  homeId: string,
  opts?: {
    type?: CommunicationType;
    status?: CommunicationStatus;
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<CommunicationDraft[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_communication_drafts") as SB).select("*").eq("home_id", homeId);
  if (opts?.type) q = q.eq("communication_type", opts.type);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.childId) q = q.eq("child_id", opts.childId);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getDraft(id: string): Promise<ServiceResult<CommunicationDraft>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communication_drafts") as SB)
    .select("*").eq("id", id).single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createDraft(input: {
  homeId: string;
  type: CommunicationType;
  title: string;
  content: string;
  createdBy: string;
  childId?: string;
  staffId?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  recipientContext?: string;
  caraGenerated?: boolean;
  caraPromptUsed?: string;
}): Promise<ServiceResult<CommunicationDraft>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communication_drafts") as SB)
    .insert({
      home_id: input.homeId,
      communication_type: input.type,
      title: input.title,
      content: input.content,
      created_by: input.createdBy,
      child_id: input.childId ?? null,
      staff_id: input.staffId ?? null,
      linked_entity_type: input.linkedEntityType ?? null,
      linked_entity_id: input.linkedEntityId ?? null,
      recipient_context: input.recipientContext ?? null,
      cara_generated: input.caraGenerated ?? false,
      cara_prompt_used: input.caraPromptUsed ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDraft(
  id: string,
  updates: { content?: string; title?: string; editedBy: string },
): Promise<ServiceResult<CommunicationDraft>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communication_drafts") as SB)
    .update({
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.title !== undefined && { title: updates.title }),
      edited_by: updates.editedBy,
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function approveDraft(
  id: string,
  userId: string,
): Promise<ServiceResult<CommunicationDraft>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communication_drafts") as SB)
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function markSent(
  id: string,
): Promise<ServiceResult<CommunicationDraft>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communication_drafts") as SB)
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Stats ──────────────────────────────────────────────────────────────────

export async function getCommunicationStats(
  homeId: string,
): Promise<ServiceResult<{
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  cara_generated: number;
  this_week: number;
}>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_communication_drafts") as SB)
    .select("communication_type, status, cara_generated, created_at")
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };

  const all = data ?? [];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const d of all) {
    byType[d.communication_type] = (byType[d.communication_type] ?? 0) + 1;
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
  }

  return {
    ok: true,
    data: {
      total: all.length,
      by_type: byType,
      by_status: byStatus,
      cara_generated: all.filter((d: any) => d.cara_generated).length,
      this_week: all.filter((d: any) => d.created_at > weekAgo).length,
    },
  };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  generateHandoverDraft,
  generateSocialWorkerDraft,
  generateShiftBriefingDraft,
  generateManagementSummaryDraft,
  COMMUNICATION_TEMPLATES,
};
