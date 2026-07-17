// ─────────────────────────────────────────────────────────────────────────────
// Notification Delivery Boundaries (doctrine 1.16 / 2.3.6 — protecting the
// protectors)
//
// "Cara must never become another source of out-of-hours noise, guilt, or
// unacknowledged load." Professional boundaries are performance infrastructure,
// not selfishness — so this decides, deterministically, what is allowed to
// reach a person who is NOT on shift.
//
// THE BOUNDARY IS THE PERSON'S SHIFT, NOT THE CLOCK. A children's home is
// staffed through the night; 02:00 is a working hour for the person on waking
// nights and protected time for the manager asleep at home. Quiet-hours windows
// get this exactly backwards. So delivery keys off isOnShiftNow — the same
// shift truth the access rules use.
//
// What may breach protected time: only a genuine immediate-safeguarding alert.
// Not an overdue task. Not a missing log. Not a "don't forget". If it can wait
// until the person is back at work, it waits — and it says when it will arrive.
//
// Nothing here can delay a SAFEGUARDING ACTION: this governs whether a
// NOTIFICATION pings a person's phone at midnight, never whether a concern can
// be raised, escalated or seen. The record is always there when they look; the
// on-shift team is never held back. See PHILOSOPHY.md — safeguarding always
// short-circuits.
//
// Pure and deterministic: the caller supplies `now` and whether the recipient is
// on shift; no store, no AI.
// ─────────────────────────────────────────────────────────────────────────────

import { reviewTone } from "@/lib/philosophy/covenant";

export type NotificationPriority = "urgent" | "high" | "normal" | "low";

export interface DeliverableNotification {
  id: string;
  type: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  created_at: string;
}

/** The only notification types that may wake someone off shift. Deliberately a
 *  short, explicit allow-list rather than a priority threshold: "urgent" gets
 *  applied generously by well-meaning code, and an allow-list cannot drift the
 *  way a threshold does. Adding to this list should feel like a decision. */
export const BREAKTHROUGH_TYPES: readonly string[] = [
  "immediate_safeguarding",
  "child_missing",
  "allegation_against_staff",
  "serious_injury",
] as const;

export type DeliveryMode = "deliver_now" | "hold_until_on_shift" | "in_app_only";

export interface DeliveryDecision {
  notificationId: string;
  mode: DeliveryMode;
  /** Why — plain enough to show an operator or an auditor. */
  reason: string;
  /** True only for a genuine immediate-safeguarding breach of protected time. */
  breachesProtectedTime: boolean;
}

/**
 * Decide how one notification reaches one person.
 *
 * On shift → deliver; they are at work and this is their job.
 * Off shift + a breakthrough type → deliver, and mark that protected time was
 *   breached so it is visible rather than silent.
 * Off shift + anything else → hold. It will be there when they are back.
 */
export function decideDelivery(
  n: DeliverableNotification,
  recipientOnShift: boolean,
): DeliveryDecision {
  if (recipientOnShift) {
    return {
      notificationId: n.id,
      mode: "deliver_now",
      reason: "The recipient is on shift — this is working time.",
      breachesProtectedTime: false,
    };
  }

  if (BREAKTHROUGH_TYPES.includes(n.type)) {
    return {
      notificationId: n.id,
      mode: "deliver_now",
      reason:
        "Immediate safeguarding — this is one of the few things that may reach someone off shift. " +
        "Breaching protected time is recorded, not hidden.",
      breachesProtectedTime: true,
    };
  }

  return {
    notificationId: n.id,
    mode: "hold_until_on_shift",
    reason:
      `Not immediate safeguarding (${n.type.replace(/_/g, " ")}), and the recipient is off shift. ` +
      "It will be waiting when they are back — protected time is performance infrastructure, not a nicety.",
    breachesProtectedTime: false,
  };
}

// ── The no-guilt audit ───────────────────────────────────────────────────────
//
// "No guilt mechanics anywhere — no streaks, no 'you haven't logged in', no red
// badges for non-urgent items." Cara's own notification copy is checked against
// that, and against the language covenant, so the rule is enforced rather than
// merely intended.

const GUILT_PATTERNS: { pattern: string; why: string; instead: string }[] = [
  { pattern: "you haven't", why: "Scolds the reader for an absence.", instead: "State what is outstanding, not who failed to do it." },
  { pattern: "you have not", why: "Scolds the reader for an absence.", instead: "State what is outstanding." },
  { pattern: "don't forget", why: "Implies the reader is forgetful.", instead: "Name the thing and its date." },
  { pattern: "still waiting", why: "Positions Cara as impatient with the reader.", instead: "Say what is open and since when." },
  { pattern: "streak", why: "Gamifies care recording; manufactures anxiety about a number.", instead: "Nothing — remove it." },
  { pattern: "you missed", why: "Blames the reader.", instead: "Describe the gap, not the person." },
  { pattern: "why haven't", why: "Interrogates the reader.", instead: "Ask what would help." },
  { pattern: "last chance", why: "Manufactures urgency.", instead: "State the real deadline." },
];

export interface GuiltFinding {
  notificationId: string;
  phrase: string;
  why: string;
  instead: string;
}

/**
 * Audit notification copy for guilt mechanics AND covenant breaches. Cara's own
 * voice is held to the same standard everywhere — this reuses the language
 * covenant rather than inventing a second, drifting list.
 */
export function auditNotificationTone(notifications: DeliverableNotification[]): GuiltFinding[] {
  const out: GuiltFinding[] = [];
  for (const n of notifications) {
    const text = `${n.title} ${n.body}`.toLowerCase();

    for (const g of GUILT_PATTERNS) {
      if (text.includes(g.pattern)) {
        out.push({ notificationId: n.id, phrase: g.pattern, why: g.why, instead: g.instead });
      }
    }

    // The covenant governs Cara's copy to staff — accusatory and deficit
    // language is already forbidden there; no need for a parallel list.
    for (const v of reviewTone(`${n.title} ${n.body}`, "to_staff")) {
      out.push({
        notificationId: n.id,
        phrase: v.phrase,
        why: v.why,
        instead: v.preferred,
      });
    }
  }
  return out;
}

// ── Red-badge rule ───────────────────────────────────────────────────────────

/** Whether a notification may render as a red badge. The doctrine: "no red
 *  badges for non-urgent items". Red is reserved for what genuinely cannot
 *  wait, so that red keeps meaning something. */
export function mayShowRedBadge(n: DeliverableNotification): boolean {
  return BREAKTHROUGH_TYPES.includes(n.type);
}

// ── Rollup ───────────────────────────────────────────────────────────────────

export interface DeliveryPlan {
  decisions: DeliveryDecision[];
  counts: { deliverNow: number; held: number; breaches: number };
  guilt: GuiltFinding[];
  /** Plain-English read for the operator. */
  summary: string;
}

export function planDelivery(
  notifications: DeliverableNotification[],
  recipientOnShift: boolean,
): DeliveryPlan {
  const decisions = notifications.map((n) => decideDelivery(n, recipientOnShift));
  const held = decisions.filter((d) => d.mode === "hold_until_on_shift").length;
  const breaches = decisions.filter((d) => d.breachesProtectedTime).length;
  const guilt = auditNotificationTone(notifications);

  const summary = recipientOnShift
    ? `On shift — all ${decisions.length} notification(s) deliver normally.`
    : held === 0 && breaches === 0
      ? "Off shift — nothing to send."
      : breaches > 0
        ? `Off shift — ${breaches} immediate-safeguarding alert(s) will breach protected time; ${held} held until back on shift.`
        : `Off shift — all ${held} notification(s) held until back on shift. Nothing will disturb this person tonight.`;

  return { decisions, counts: { deliverNow: decisions.length - held, held, breaches }, guilt, summary };
}
