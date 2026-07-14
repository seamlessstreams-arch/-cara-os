// ══════════════════════════════════════════════════════════════════════════════
// DAILY LOG ORCHESTRATOR
//
// Same pattern as incident-orchestrator: one entry creates all linked records.
// Form → Store → Audit → Timeline → Dashboard → Reports → Cara
//
// "Enter once. Use everywhere."
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { recordEvent } from "@/lib/timeline/timeline-service";
import { logInteraction } from "@/lib/cara/cara-config";
import { captureDomainEvent } from "@/lib/event-capture/capture-event-service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateDailyLogInput {
  child_id: string;
  date: string;
  staff_id: string;
  mood: "great" | "good" | "okay" | "low" | "distressed";
  engagement: number; // 1-5
  key_events: string;
  concerns: string;
  follow_up_needed: boolean;
  home_id?: string;
  shift?: "morning" | "afternoon" | "evening" | "night" | "waking_night";
}

export interface DailyLogOrchestrationResult {
  log: Record<string, unknown>;
  audit_entry: Record<string, unknown>;
  timeline_event: Record<string, unknown>;
  linked_updates: string[];
  alerts: string[];
  /** Canonical spine event id written through at creation (forms-as-views), or null. */
  canonical_event_id?: string | null;
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export function createDailyLog(input: CreateDailyLogInput): DailyLogOrchestrationResult {
  const store = getStore();
  const now = new Date().toISOString();
  const linkedUpdates: string[] = [];
  const alerts: string[] = [];

  // ── 1. Save to store ───────────────────────────────────────────────────
  const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const log = {
    id,
    child_id: input.child_id,
    date: input.date,
    time: now.slice(11, 16),
    mood: input.mood,
    engagement_level: input.engagement,
    key_events: input.key_events,
    concerns: input.concerns,
    follow_up_needed: input.follow_up_needed,
    staff_id: input.staff_id,
    home_id: input.home_id ?? "home_oak",
    shift: input.shift ?? "afternoon",
    status: "submitted",
    created_at: now,
    updated_at: now,
    created_by: input.staff_id,
  };

  (store.dailyLog as unknown[]).push(log);
  linkedUpdates.push(`Daily log ${id} saved for ${input.child_id}`);

  // ── 1b. Write through the canonical event spine (forms-as-views) ───────────
  // The form's create path now ALSO emits a validated canonical event, persisted
  // under the same stable id the projection uses (evt_log_<id>) so it de-dupes by
  // id and surfaces across the timeline + intelligence with a richer summary than
  // the lossy projection. Best-effort: never blocks the daily-log creation.
  let canonicalEventId: string | null = null;
  try {
    const outcome = captureDomainEvent(
      {
        eventType: "daily_log",
        childId: log.child_id,
        staffId: log.staff_id,
        homeId: log.home_id,
        occurredAt: `${log.date}T${log.time}:00.000Z`,
        createdBy: log.created_by,
        summary: `${log.shift} log: ${input.key_events}`.slice(0, 200) || "Daily log entry",
        riskLevel: input.mood === "distressed" ? "medium" : "low",
        structuredTags: ["daily_log", input.mood, log.shift].filter(Boolean) as string[],
      },
      { id: `evt_log_${id}`, now },
    );
    if (outcome.persisted) {
      canonicalEventId = outcome.event!.id;
      linkedUpdates.push("Captured to the canonical event spine — surfaces across the timeline and intelligence");
    }
  } catch {
    // Write-through is best-effort; never block the daily-log creation.
  }

  // ── 2. Audit entry ─────────────────────────────────────────────────────
  const auditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    event_type: "daily_log_created",
    entity_type: "daily_log",
    entity_id: id,
    actor_id: input.staff_id,
    summary: `Daily log recorded for ${input.child_id} — mood: ${input.mood}, engagement: ${input.engagement}/5`,
    detail: { mood: input.mood, engagement: input.engagement, follow_up: input.follow_up_needed, concerns_recorded: input.concerns.length > 0 },
    created_at: now,
  };
  linkedUpdates.push("Audit trail entry created");

  // ── 3. Timeline event ──────────────────────────────────────────────────
  const moodEmoji = { great: "😊", good: "🙂", okay: "😐", low: "😔", distressed: "😢" }[input.mood] ?? "📝";
  const riskLevel = input.mood === "distressed" ? "medium" : input.concerns.length > 20 ? "low" : "none";

  const timelineEvent = recordEvent({
    event_type: "daily_log_created",
    child_id: input.child_id,
    staff_id: input.staff_id,
    home_id: input.home_id ?? "home_oak",
    title: `Daily log: ${moodEmoji} ${input.mood} mood, ${input.engagement}/5 engagement`,
    summary: input.key_events.slice(0, 150) + (input.key_events.length > 150 ? "..." : ""),
    linked_record_type: "daily_log",
    linked_record_id: id,
    tags: ["daily_log", input.mood, input.shift ?? "afternoon"],
    risk_level: riskLevel as "none" | "low" | "medium" | "high" | "critical",
    visibility_level: "standard",
    created_by: input.staff_id,
  });
  linkedUpdates.push("Timeline event recorded");

  // ── 4. Dashboard updates (implicit via store) ──────────────────────────
  linkedUpdates.push("Dashboard daily log tracker updated");

  // ── 5. Reports availability ────────────────────────────────────────────
  linkedUpdates.push("Available in Reg 45 report and inspection evidence pack");

  // ── 6. Cara context ────────────────────────────────────────────────────
  logInteraction({
    user_id: input.staff_id,
    child_id: input.child_id,
    conversation_id: `daily_log_${id}`,
    request_type: "daily_log_creation",
    prompt_summary: `Daily log: ${input.mood} mood, ${input.engagement}/5 engagement`,
    response_summary: `Log saved. ${alerts.length} alerts generated.`,
    tools_used: ["create_daily_log", "create_timeline_event", "create_audit_entry"],
    risk_level: riskLevel === "medium" ? "medium" : "low",
    requires_review: false,
  });
  linkedUpdates.push("Cara intelligence context updated");

  // ── 7. Alerts based on content ─────────────────────────────────────────
  if (input.mood === "distressed") {
    alerts.push("Child mood recorded as distressed — consider follow-up key work session");
    linkedUpdates.push("Alert: distressed mood flagged for follow-up");
  }
  if (input.engagement <= 2) {
    alerts.push("Low engagement (1-2/5) — review if child is unwell, anxious, or needs support");
    linkedUpdates.push("Alert: low engagement flagged");
  }
  if (input.follow_up_needed) {
    alerts.push("Follow-up flagged by recording staff — ensure this is actioned on the next shift");
    linkedUpdates.push("Follow-up flagged for next shift");
  }
  if (input.concerns.length > 0 && /safeguard|\bharm(s|ed|ful)?\b|abuse|disclosure|exploit/i.test(input.concerns)) {
    alerts.push("SAFEGUARDING LANGUAGE DETECTED in concerns — review immediately and consider raising a safeguarding concern if not already done");
    linkedUpdates.push("Alert: safeguarding language detected in concerns");
  }

  return {
    log,
    audit_entry: auditEntry,
    timeline_event: timelineEvent as unknown as Record<string, unknown>,
    linked_updates: linkedUpdates,
    alerts,
    canonical_event_id: canonicalEventId,
  };
}
