// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Reg 40 Triage Queue  (Milestone 15)
//
// Regulation 40 of the Children's Homes (England) Regulations 2015 sets
// out the events the registered person MUST notify Ofsted about.
//
// This engine surfaces care events flagged requires_reg40_triage and
// drafts a suggested category + reasoning so an authorised human can
// decide: notify, dismiss (with reason) or escalate.
//
// Spec invariant: Cara drafts the triage suggestion. Humans decide.
// Notification to Ofsted itself is NEVER auto-sent.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { detectReg40Category } from "@/lib/care-events/reg40-keywords";
import type { CareEvent, CareEventCategory } from "@/types/care-events";
import type {
  CaraReg40Triage,
  Reg40SuggestedCategory,
  Reg40TriageStatus,
} from "@/types/cara-studio";

const CATEGORY_TO_REG40: Partial<Record<CareEventCategory, Reg40SuggestedCategory>> = {
  safeguarding: "child_protection_concern",
  missing_episode: "child_missing",
  physical_intervention: "serious_incident",
  restraint: "serious_incident",
  health: "serious_illness_or_accident",
};

const REG40_LABEL: Record<Reg40SuggestedCategory, string> = {
  child_protection_concern: "Child protection concern",
  serious_illness_or_accident: "Serious illness or accident",
  death_of_child: "Death of a child",
  child_missing: "Child missing from care",
  police_involvement: "Police involvement",
  serious_incident: "Serious incident",
  allegation_against_staff: "Allegation against staff",
  other: "Other notifiable event",
};

export function reg40Label(cat: Reg40SuggestedCategory): string {
  return REG40_LABEL[cat];
}

function suggestCategory(event: CareEvent): Reg40SuggestedCategory {
  // Prefer a high-precision text signal (death / serious illness-or-accident /
  // allegation against staff / police) over the generic category mapping.
  return detectReg40Category(event.title, event.content) ?? CATEGORY_TO_REG40[event.category] ?? "other";
}

function suggestReasoning(event: CareEvent, suggested: Reg40SuggestedCategory): string {
  return (
    `Care event "${event.title}" categorised as ${event.category} on ${event.event_date}` +
    ` may meet the Reg 40 threshold for "${REG40_LABEL[suggested]}".` +
    ` Manager to confirm, notify Ofsted via the proper channel, and record the notification reference.`
  );
}

/**
 * Scan current care events flagged requires_reg40_triage and create a
 * pending triage row for any that do not yet have one. Idempotent.
 */
export function scanReg40Candidates(homeId: string): CaraReg40Triage[] {
  // Fail-safe scan: surface events flagged for Reg 40 OR whose text matches a
  // high-precision notifiable indicator (death / serious illness-or-accident /
  // allegation against staff / police), even if they weren't flagged for triage
  // at classification time.
  const events = db.careEvents
    .findCurrent()
    .filter(
      (e) =>
        e.home_id === homeId &&
        (e.requires_reg40_triage || detectReg40Category(e.title, e.content) !== null),
    );

  const created: CaraReg40Triage[] = [];
  for (const e of events) {
    const existing = db.caraReg40Triages.findBySourceEvent(e.id);
    if (existing) continue;
    const cat = suggestCategory(e);
    const triage = db.caraReg40Triages.create({
      home_id: e.home_id,
      child_id: e.child_id,
      source_event_id: e.id,
      source_category: e.category,
      source_title: e.title,
      source_event_date: e.event_date,
      suggested_category: cat,
      reasoning: suggestReasoning(e, cat),
      status: "pending",
      created_at: new Date().toISOString(),
      decided_by: null,
      decided_at: null,
      decision_note: null,
      notification_ref: null,
    });
    created.push(triage);
  }
  return created;
}

export function loadReg40Queue(
  homeId: string,
  status?: Reg40TriageStatus,
): CaraReg40Triage[] {
  const rows = db.caraReg40Triages.findAll(homeId);
  const filtered = status ? rows.filter((r) => r.status === status) : rows;
  return [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type Reg40DecisionAction = "notify" | "dismiss" | "escalate";

export type Reg40DecisionError =
  | { code: "not_found" }
  | { code: "not_pending"; record: CaraReg40Triage }
  | { code: "notification_ref_required" }
  | { code: "reason_required" };

export interface Reg40DecisionInput {
  triageId: string;
  action: Reg40DecisionAction;
  actorId: string;
  note?: string | null;
  notificationRef?: string | null;
}

export function decideReg40Triage(
  input: Reg40DecisionInput,
): CaraReg40Triage | Reg40DecisionError {
  const existing = db.caraReg40Triages.findById(input.triageId);
  if (!existing) return { code: "not_found" };
  if (existing.status !== "pending") return { code: "not_pending", record: existing };

  if (input.action === "notify" && !input.notificationRef?.trim()) {
    return { code: "notification_ref_required" };
  }
  if (input.action === "dismiss" && !input.note?.trim()) {
    return { code: "reason_required" };
  }

  const status: Reg40TriageStatus =
    input.action === "notify" ? "notified" : input.action === "dismiss" ? "dismissed" : "escalated";

  const patched = db.caraReg40Triages.patch(input.triageId, {
    status,
    decided_by: input.actorId,
    decided_at: new Date().toISOString(),
    decision_note: input.note?.trim() ?? null,
    notification_ref:
      input.action === "notify" ? input.notificationRef!.trim() : existing.notification_ref,
  });
  return patched ?? existing;
}
