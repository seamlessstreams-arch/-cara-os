// ══════════════════════════════════════════════════════════════════════════════
// Care Event → Annex A Evidence Bridge  (Milestone 21)
//
// Promotes verified, contributes_to_annex_a care events into the Annex A
// evidence queue as pending suggestions. Mirrors M18 for Reg 45.
//
// Idempotency:
//   db.annexAEvidenceQueue.upsert is keyed on (care_event_id + annex_section).
//
// Locked-chip safety:
//   If an existing item has manager_decision in {approved, accepted, rejected}
//   the suggestion is preserved unchanged (skipped_locked++). A "deferred"
//   row is refreshed (so the next reviewer sees current wording).
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  AnnexAEvidenceItem,
  CareEvent,
  CareEventCategory,
} from "@/types/care-events";

export type AnnexASectionKey =
  | "section_1"   // statement of purpose / governance
  | "section_2"   // children & their care
  | "section_3"   // safeguarding
  | "section_4"   // health & wellbeing
  | "section_5"   // education
  | "section_6"   // contact with family
  | "section_7"   // complaints, voice, advocacy
  | "section_8";  // workforce & leadership

const CATEGORY_TO_SECTION: Record<CareEventCategory, AnnexASectionKey> = {
  general:                "section_2",
  behaviour:              "section_2",
  health:                 "section_4",
  medication:             "section_4",
  education:              "section_5",
  family_contact:         "section_6",
  professional_contact:   "section_2",
  safeguarding:           "section_3",
  missing_episode:        "section_3",
  physical_intervention:  "section_3",
  restraint:              "section_3",
  complaint:              "section_7",
  activity:               "section_2",
  wellbeing:              "section_4",
  sleep:                  "section_4",
  food:                   "section_4",
  finance:                "section_2",
  other:                  "section_2",
};

const LOCKED_DECISIONS: AnnexAEvidenceItem["manager_decision"][] = [
  "approved",
  "accepted",
  "rejected",
];

const ELIGIBLE_STATUSES: ReadonlySet<CareEvent["status"]> = new Set([
  "verified",
  "locked",
]);

export interface PromoteResult {
  scanned: number;
  created: number;
  refreshed: number;
  skipped_locked: number;
  items: AnnexAEvidenceItem[];
}

function suggestedTextFor(event: CareEvent): string {
  const date = event.event_date;
  const cat = event.category.replace(/_/g, " ");
  const head = `[${date}] ${event.title} (${cat})`;
  const body = event.content?.trim().slice(0, 480) ?? "";
  const flags: string[] = [];
  if (event.is_safeguarding) flags.push("safeguarding");
  if (event.requires_reg40_triage) flags.push("Reg 40");
  if (event.is_significant) flags.push("significant");
  const tail = flags.length ? ` Flags: ${flags.join(", ")}.` : "";
  return body ? `${head} — ${body}${tail}` : `${head}.${tail}`;
}

export function promoteCareEventsToAnnexA(homeId: string): PromoteResult {
  const events = db.careEvents.findCurrent().filter(
    (e) =>
      e.home_id === homeId &&
      ELIGIBLE_STATUSES.has(e.status) &&
      e.contributes_to_annex_a === true,
  );

  let created = 0;
  let refreshed = 0;
  let skipped_locked = 0;
  const items: AnnexAEvidenceItem[] = [];

  const queue = db.annexAEvidenceQueue.findAll();

  for (const event of events) {
    const annex_section = CATEGORY_TO_SECTION[event.category];
    const existing = queue.find(
      (q) => q.care_event_id === event.id && q.annex_section === annex_section,
    );

    if (existing && LOCKED_DECISIONS.includes(existing.manager_decision)) {
      skipped_locked += 1;
      continue;
    }

    const suggested_text = suggestedTextFor(event);
    const item = db.annexAEvidenceQueue.upsert({
      care_event_id: event.id,
      home_id: homeId,
      annex_section,
      suggested_text,
      manager_decision: existing?.manager_decision ?? "pending",
      manager_approved_text: existing?.manager_approved_text ?? null,
      reviewed_by: existing?.reviewed_by ?? null,
      reviewed_at: existing?.reviewed_at ?? null,
    });

    if (existing) refreshed += 1;
    else created += 1;
    items.push(item);
  }

  return { scanned: events.length, created, refreshed, skipped_locked, items };
}
