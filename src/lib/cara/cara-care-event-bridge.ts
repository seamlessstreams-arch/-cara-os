// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CARE EVENT → SUGGESTED RECORD BRIDGE  (Milestone 12)
//
// When a Care Event is verified, Cara drafts the matching written record
// (behaviour note, incident summary, risk update, reflection, etc.) and
// pushes it into the Suggested Records commit queue (M10). The manager
// then edits or commits, exactly like any other Cara suggestion.
//
// Idempotent: re-running for the same Care Event will not create a
// second suggestion of the same record_type — the existing one is
// returned instead. This keeps the M10 queue clean if a verifier
// triggers more than once or the bridge is replayed.
//
// Spec invariant: Cara drafts. Humans decide. Only authorised humans
// approve and commit to the official record.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  CareEvent,
  CareEventCategory,
  EvidencePrompt,
} from "@/types/care-events";
import type {
  CaraSuggestedRecord,
  CaraSuggestedRecordType,
  CaraSuggestedSourceRef,
} from "@/types/cara-studio";
import { proposeSuggestedRecord } from "@/lib/cara/cara-suggested-records";

/**
 * Care Event category → which written records Cara should draft on verify.
 * A category may map to more than one record type. Daily/general categories
 * are intentionally excluded — the daily log routing already covers them.
 */
const RECORDS_BY_CATEGORY: Partial<Record<CareEventCategory, CaraSuggestedRecordType[]>> = {
  behaviour:             ["behaviour_note", "reflection"],
  safeguarding:          ["incident_summary", "risk_update"],
  missing_episode:       ["incident_summary", "risk_update"],
  physical_intervention: ["incident_summary", "risk_update"],
  restraint:             ["incident_summary", "risk_update"],
  complaint:             ["reflection"],
  health:                ["care_plan_update"],
  medication:            ["reflection"],
  wellbeing:             ["keywork_summary"],
};

/**
 * Build a short Cara-flavoured body draft from the source Care Event.
 */
function draftBody(event: CareEvent, recordType: CaraSuggestedRecordType): string {
  const lines: string[] = [];
  lines.push(`Drafted by Cara from verified care event "${event.title}" on ${event.event_date}.`);
  lines.push("");
  lines.push(event.content);

  const completedPrompts = (event.evidence_prompts ?? []).filter(
    (p: EvidencePrompt) => p.completed && p.answer,
  );
  if (completedPrompts.length > 0) {
    lines.push("");
    lines.push("Evidence captured at time of recording:");
    for (const p of completedPrompts) {
      lines.push(`- ${p.question} ${p.answer}`);
    }
  }

  if (recordType === "incident_summary" || recordType === "risk_update") {
    lines.push("");
    lines.push(
      "Cara draft only — manager to confirm wording, statutory categorisation and any onward referrals before committing to the official record.",
    );
  } else {
    lines.push("");
    lines.push(
      "Cara draft only — manager to confirm wording before committing to the record.",
    );
  }

  return lines.join("\n");
}

function draftTitle(event: CareEvent, recordType: CaraSuggestedRecordType): string {
  switch (recordType) {
    case "incident_summary":
      return `Incident summary — ${event.title}`;
    case "risk_update":
      return `Risk update — ${event.title}`;
    case "behaviour_note":
      return `Behaviour note — ${event.title}`;
    case "reflection":
      return `Reflection — ${event.title}`;
    case "keywork_summary":
      return `Keywork summary — ${event.title}`;
    case "care_plan_update":
      return `Care plan update — ${event.title}`;
    case "daily_log_summary":
      return `Daily log summary — ${event.title}`;
  }
}

/**
 * Find a suggestion already proposed from a given care event for a given
 * record_type. Used for idempotency.
 */
function findExistingForCareEvent(
  homeId: string,
  careEventId: string,
  recordType: CaraSuggestedRecordType,
): CaraSuggestedRecord | undefined {
  return db.caraSuggestedRecords.findAll(homeId).find(
    (r) =>
      r.record_type === recordType &&
      r.source_evidence.some(
        (s) => s.type === "care_event" && s.id === careEventId,
      ),
  );
}

export interface BridgeResult {
  careEventId: string;
  proposed: CaraSuggestedRecord[];
  reused: CaraSuggestedRecord[];
  skipped: boolean;
  reason?: string;
}

/**
 * Propose Cara-drafted suggested records for one Care Event. Idempotent.
 *
 * @param event       The verified Care Event (or one being verified).
 * @param generatedBy Acting user id (audit trail).
 */
export function proposeRecordsFromCareEvent(
  event: CareEvent,
  generatedBy: string,
): BridgeResult {
  const recordTypes = RECORDS_BY_CATEGORY[event.category];
  if (!recordTypes || recordTypes.length === 0) {
    return {
      careEventId: event.id,
      proposed: [],
      reused: [],
      skipped: true,
      reason: `No Cara suggested records mapped for category '${event.category}'`,
    };
  }

  const sourceRef: CaraSuggestedSourceRef = {
    type: "care_event",
    id: event.id,
    label: `Care event – ${event.title}`,
  };

  const proposed: CaraSuggestedRecord[] = [];
  const reused: CaraSuggestedRecord[] = [];

  for (const recordType of recordTypes) {
    const existing = findExistingForCareEvent(event.home_id, event.id, recordType);
    if (existing) {
      reused.push(existing);
      continue;
    }
    const rec = proposeSuggestedRecord({
      homeId: event.home_id,
      childId: event.child_id,
      recordType,
      suggestedTitle: draftTitle(event, recordType),
      suggestedBody: draftBody(event, recordType),
      sourceEvidence: [sourceRef],
      generatedBy,
    });
    proposed.push(rec);
  }

  return {
    careEventId: event.id,
    proposed,
    reused,
    skipped: false,
  };
}

/**
 * Bulk-bridge every verified care event in a home that has not yet been
 * bridged for any of its mapped record types. Used by the manual
 * "Draft from latest verified care events" trigger.
 */
export function backfillSuggestedRecordsFromCareEvents(
  homeId: string,
  generatedBy: string,
  limit = 25,
): BridgeResult[] {
  const events = db.careEvents
    .findAll()
    .filter((e) => e.home_id === homeId)
    .filter((e) => e.status === "verified" || e.status === "locked")
    .filter((e) => RECORDS_BY_CATEGORY[e.category])
    .sort((a, b) => (a.verified_at ?? a.updated_at) < (b.verified_at ?? b.updated_at) ? 1 : -1)
    .slice(0, limit);

  return events.map((e) => proposeRecordsFromCareEvent(e, generatedBy));
}

export const CARE_EVENT_BRIDGE_RECORDS_BY_CATEGORY = RECORDS_BY_CATEGORY;
