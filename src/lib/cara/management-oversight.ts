// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — MANAGEMENT OVERSIGHT QUEUE  (Milestone 14)
//
// A unified, live-updating queue of every item across the system that
// needs an authorised human's attention right now:
//
//   - pending suggested records (weighted higher when safeguarding-sensitive)
//   - committed-record amendments flagged amendment_requires_manager_review
//     and not yet acknowledged
//   - rejected suggestions that were flagged as returns (decision_note set
//     and status === "rejected") within the last 24h — surface for follow-up
//
// Severity ladder:
//   high   — safeguarding-sensitive, OR pending > 24h, OR amendment review
//   medium — pending 6–24h, or non-sensitive amendment unacknowledged
//   low    — recent and non-sensitive
//
// Spec invariant: Cara drafts. Humans decide. This queue exists so
// nothing waiting on a human disappears into a list that no one reads.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import {
  CARA_SUGGESTED_RECORD_LABELS,
  type ManagerOversightItem,
  type ManagerOversightQueue,
  type ManagerOversightSeverity,
} from "@/types/cara-studio";
import { isSafeguardingSensitiveRecordType } from "@/lib/cara/cara-suggested-records";

const HOUR_MS = 60 * 60 * 1000;

function ageHoursSince(iso: string, nowMs: number): number {
  return Math.max(0, Math.round((nowMs - new Date(iso).getTime()) / HOUR_MS));
}

function suggestionSeverity(
  ageHours: number,
  sensitive: boolean,
): ManagerOversightSeverity {
  if (sensitive) return "high";
  if (ageHours >= 24) return "high";
  if (ageHours >= 6) return "medium";
  return "low";
}

function severityRank(s: ManagerOversightSeverity): number {
  return s === "high" ? 0 : s === "medium" ? 1 : 2;
}

export function loadOversightQueue(homeId: string): ManagerOversightQueue {
  const nowMs = Date.now();
  const items: ManagerOversightItem[] = [];

  // 1) Pending suggested records
  const pending = db.caraSuggestedRecords
    .findAll(homeId)
    .filter((r) => r.status === "pending");
  for (const r of pending) {
    const sensitive = isSafeguardingSensitiveRecordType(r.record_type);
    const ageHours = ageHoursSince(r.generated_at, nowMs);
    items.push({
      id: `pending:${r.id}`,
      kind: "pending_suggestion",
      home_id: r.home_id,
      child_id: r.child_id,
      title: r.suggested_title,
      summary: `${CARA_SUGGESTED_RECORD_LABELS[r.record_type]} awaiting commit decision`,
      severity: suggestionSeverity(ageHours, sensitive),
      is_safeguarding_sensitive: sensitive,
      created_at: r.generated_at,
      source_id: r.id,
      source_label: CARA_SUGGESTED_RECORD_LABELS[r.record_type],
      link_href: `/intelligence/cara/suggested-records?focus=${r.id}`,
      age_hours: ageHours,
    });
  }

  // 2) Amendments flagged for manager review and not yet acknowledged
  const committed = db.caraCommittedRecords.findAll(homeId);
  for (const c of committed) {
    if (!c.amendment_requires_manager_review) continue;
    if (c.amendment_acknowledged_at) continue;
    const sensitive = isSafeguardingSensitiveRecordType(c.record_type);
    const ageHours = ageHoursSince(c.amended_at ?? c.committed_at, nowMs);
    items.push({
      id: `amendment:${c.id}`,
      kind: "amendment_review",
      home_id: c.home_id,
      child_id: c.child_id,
      title: c.title,
      summary: `Amendment v${c.version} requires manager review${
        c.amendment_reason ? `: ${c.amendment_reason}` : ""
      }`,
      severity: sensitive ? "high" : "medium",
      is_safeguarding_sensitive: sensitive,
      created_at: c.amended_at ?? c.committed_at,
      source_id: c.id,
      source_label: CARA_SUGGESTED_RECORD_LABELS[c.record_type],
      link_href: `/intelligence/cara/suggested-records?focus_committed=${c.id}`,
      age_hours: ageHours,
    });
  }

  // 3) Recently rejected/returned suggestions (last 24h) for follow-up visibility
  const recentlyReturned = db.caraSuggestedRecords
    .findAll(homeId)
    .filter(
      (r) =>
        r.status === "rejected" &&
        r.decided_at !== null &&
        ageHoursSince(r.decided_at, nowMs) <= 24,
    );
  for (const r of recentlyReturned) {
    const sensitive = isSafeguardingSensitiveRecordType(r.record_type);
    items.push({
      id: `returned:${r.id}`,
      kind: "returned_record",
      home_id: r.home_id,
      child_id: r.child_id,
      title: r.suggested_title,
      summary: `Recently returned${r.decision_note ? `: ${r.decision_note}` : ""}`,
      severity: sensitive ? "medium" : "low",
      is_safeguarding_sensitive: sensitive,
      created_at: r.decided_at ?? r.generated_at,
      source_id: r.id,
      source_label: CARA_SUGGESTED_RECORD_LABELS[r.record_type],
      link_href: `/intelligence/cara/suggested-records?focus=${r.id}`,
      age_hours: ageHoursSince(r.decided_at ?? r.generated_at, nowMs),
    });
  }

  // Sort: severity then oldest first within severity
  items.sort((a, b) => {
    const sd = severityRank(a.severity) - severityRank(b.severity);
    if (sd !== 0) return sd;
    return a.created_at.localeCompare(b.created_at);
  });

  let high = 0;
  let medium = 0;
  let low = 0;
  for (const it of items) {
    if (it.severity === "high") high++;
    else if (it.severity === "medium") medium++;
    else low++;
  }

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: items.length,
    high,
    medium,
    low,
    items,
  };
}
