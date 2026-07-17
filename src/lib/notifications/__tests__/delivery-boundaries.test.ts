import { describe, it, expect } from "vitest";
import {
  decideDelivery,
  planDelivery,
  auditNotificationTone,
  mayShowRedBadge,
  BREAKTHROUGH_TYPES,
  type DeliverableNotification,
} from "../delivery-boundaries";

// Doctrine 1.16 / 2.3.6 — the properties that matter:
//   - the boundary is the PERSON'S SHIFT, not the clock (02:00 is working time
//     for waking nights and protected time for the sleeping manager);
//   - only genuine immediate-safeguarding may breach protected time — an
//     "urgent"-priority overdue task may NOT;
//   - a breach is recorded, never silent;
//   - no guilt mechanics, and Cara's copy obeys the same covenant everywhere.

let n = 0;
function notif(over: Partial<DeliverableNotification> = {}): DeliverableNotification {
  n += 1;
  return {
    id: `notif_${n}`,
    type: "task_overdue",
    priority: "high",
    title: "Task overdue",
    body: "Risk assessment review is past its date.",
    created_at: "2026-07-17T09:00:00Z",
    ...over,
  };
}

describe("the boundary is the shift, not the clock", () => {
  it("delivers anything to someone ON shift — they are at work", () => {
    const d = decideDelivery(notif(), true);
    expect(d.mode).toBe("deliver_now");
    expect(d.reason).toMatch(/on shift — this is working time/i);
    expect(d.breachesProtectedTime).toBe(false);
  });

  it("holds a non-safeguarding notification for someone OFF shift", () => {
    const d = decideDelivery(notif(), false);
    expect(d.mode).toBe("hold_until_on_shift");
    expect(d.reason).toMatch(/waiting when they are back/i);
  });
});

describe("only immediate safeguarding may breach protected time", () => {
  it("lets an immediate-safeguarding alert through, and RECORDS the breach", () => {
    const d = decideDelivery(notif({ type: "immediate_safeguarding", title: "Immediate safeguarding" }), false);
    expect(d.mode).toBe("deliver_now");
    expect(d.breachesProtectedTime).toBe(true);
    expect(d.reason).toMatch(/recorded, not hidden/i);
  });

  it("a child missing at night reaches an off-shift manager", () => {
    expect(decideDelivery(notif({ type: "child_missing" }), false).mode).toBe("deliver_now");
  });

  it("an URGENT-priority task does NOT breach protected time — priority is not the gate", () => {
    // The exact failure mode the allow-list exists to prevent: "urgent" gets
    // applied generously; an overdue task must never wake anyone.
    const d = decideDelivery(notif({ type: "task_overdue", priority: "urgent" }), false);
    expect(d.mode).toBe("hold_until_on_shift");
    expect(d.breachesProtectedTime).toBe(false);
  });

  it("oversight needed — real work, but it waits until morning", () => {
    expect(decideDelivery(notif({ type: "oversight_needed", priority: "urgent" }), false).mode).toBe("hold_until_on_shift");
  });

  it("the breakthrough list is short and explicit", () => {
    expect(BREAKTHROUGH_TYPES).toHaveLength(4);
    expect(BREAKTHROUGH_TYPES).not.toContain("task_overdue");
  });
});

describe("red badges are reserved for what cannot wait", () => {
  it("only breakthrough types may render red", () => {
    expect(mayShowRedBadge(notif({ type: "immediate_safeguarding" }))).toBe(true);
    expect(mayShowRedBadge(notif({ type: "task_overdue", priority: "urgent" }))).toBe(false);
    expect(mayShowRedBadge(notif({ type: "missing_log" }))).toBe(false);
  });
});

describe("the no-guilt audit", () => {
  it("catches guilt mechanics with what to say instead", () => {
    const f = auditNotificationTone([
      notif({ title: "You haven't logged in", body: "Don't forget your 5-day streak!" }),
    ]);
    const phrases = f.map((x) => x.phrase);
    expect(phrases).toContain("you haven't");
    expect(phrases).toContain("don't forget");
    expect(phrases).toContain("streak");
    expect(f.find((x) => x.phrase === "streak")?.instead).toMatch(/remove it/i);
  });

  it("reuses the language covenant rather than a second drifting list", () => {
    // "failed to" is covenant-blaming, not in the guilt list — it must still be
    // caught, via reviewTone.
    const f = auditNotificationTone([notif({ title: "Update", body: "You failed to complete the handover." })]);
    expect(f.some((x) => x.phrase === "failed to")).toBe(true);
  });

  it("passes clean, factual copy", () => {
    expect(auditNotificationTone([
      notif({ title: "Risk assessment review open", body: "Due 12 July. Worth a look when you're back." }),
    ])).toEqual([]);
  });
});

describe("planDelivery — the operator's read", () => {
  it("says plainly that nothing will disturb an off-shift person", () => {
    const p = planDelivery([notif(), notif({ type: "missing_log" })], false);
    expect(p.counts.held).toBe(2);
    expect(p.counts.breaches).toBe(0);
    expect(p.summary).toMatch(/nothing will disturb this person tonight/i);
  });

  it("names a breach when one is genuinely warranted", () => {
    const p = planDelivery([notif({ type: "child_missing" }), notif()], false);
    expect(p.counts.breaches).toBe(1);
    expect(p.counts.held).toBe(1);
    expect(p.summary).toMatch(/breach protected time/i);
  });

  it("on shift, everything simply delivers", () => {
    const p = planDelivery([notif(), notif({ type: "oversight_needed" })], true);
    expect(p.counts.held).toBe(0);
    expect(p.summary).toMatch(/deliver normally/i);
  });
});
