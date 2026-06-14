import { describe, it, expect } from "vitest";
import {
  computeDuplicateDetection,
  tokenize,
  jaccard,
  type ChildRef,
} from "../duplicate-detection-engine";
import type { CornerstoneEvent, CornerstoneEventType } from "@/types/cornerstone-event";

// ── Test event factory ─────────────────────────────────────────────────────────
function ev(o: {
  id: string;
  type?: CornerstoneEventType;
  childId?: string;
  occurredAt?: string;
  summary?: string;
}): CornerstoneEvent {
  return {
    id: o.id,
    eventType: o.type ?? "incident",
    homeId: "home_oak",
    childId: o.childId ?? "child_1",
    occurredAt: o.occurredAt ?? "2026-06-01T10:00:00.000Z",
    createdBy: "system",
    summary: o.summary ?? "Incident: child became distressed in the kitchen",
    structuredTags: [],
    riskLevel: "low",
    requiresApproval: false,
    linkedDocuments: [],
    linkedTasks: [],
    linkedRisks: [],
    linkedNotifications: [],
    caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: [], missingInformation: [], confidenceScore: 1 },
    audit: { createdAt: o.occurredAt ?? "2026-06-01T10:00:00.000Z", updatedAt: o.occurredAt ?? "2026-06-01T10:00:00.000Z", version: 1, changeHistory: [] },
  };
}

const CHILDREN: ChildRef[] = [
  { id: "child_1", first_name: "Amara", last_name: "Osei", preferred_name: null },
  { id: "child_2", first_name: "Daniel", last_name: "Wright", preferred_name: "Dan" },
];

const TODAY = "2026-06-03";

// ══════════════════════════════════════════════════════════════════════════════
describe("tokenize", () => {
  it("lowercases, strips punctuation and stop words", () => {
    const t = tokenize("Incident: the child Became Distressed!!");
    expect(t.has("incident")).toBe(true);
    expect(t.has("child")).toBe(true);
    expect(t.has("became")).toBe(true);
    expect(t.has("distressed")).toBe(true);
    expect(t.has("the")).toBe(false); // stop word
  });

  it("drops single-character tokens", () => {
    const t = tokenize("a b cd");
    expect(t.has("cd")).toBe(true);
    expect(t.has("a")).toBe(false);
    expect(t.has("b")).toBe(false);
  });

  it("handles empty / nullish input", () => {
    expect(tokenize("").size).toBe(0);
    // @ts-expect-error testing nullish robustness
    expect(tokenize(undefined).size).toBe(0);
  });
});

describe("jaccard", () => {
  it("returns 1 for identical sets", () => {
    expect(jaccard(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
  });
  it("returns 0 for disjoint sets", () => {
    expect(jaccard(new Set(["a"]), new Set(["b"]))).toBe(0);
  });
  it("returns 0 for two empty sets", () => {
    expect(jaccard(new Set(), new Set())).toBe(0);
  });
  it("computes partial overlap", () => {
    // intersection {b} = 1, union {a,b,c} = 3 → 0.333…
    expect(jaccard(new Set(["a", "b"]), new Set(["b", "c"]))).toBeCloseTo(1 / 3, 5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("computeDuplicateDetection — detection rules", () => {
  it("flags two near-identical incidents for the same child within 48h", () => {
    const events = [
      ev({ id: "e1", type: "incident", childId: "child_1", occurredAt: "2026-06-01T10:00:00.000Z", summary: "Incident: child became distressed and damaged property in the lounge" }),
      ev({ id: "e2", type: "incident", childId: "child_1", occurredAt: "2026-06-01T12:30:00.000Z", summary: "Incident: child became distressed and damaged property in the lounge" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(1);
    const d = r.duplicates[0];
    expect(d.primary_event_id).toBe("e1"); // earlier event is primary
    expect(d.duplicate_event_id).toBe("e2");
    expect(d.event_type).toBe("incident");
    expect(d.child_id).toBe("child_1");
    expect(d.child_name).toBe("Amara Osei");
    expect(d.similarity).toBe(1);
    expect(d.suggested_action).toBe("Link to the existing event instead of creating a duplicate");
    expect(d.reason).toMatch(/likely the same event logged twice/i);
  });

  it("does NOT flag when more than 48h apart", () => {
    const events = [
      ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: "Incident: child became distressed in the kitchen" }),
      ev({ id: "e2", occurredAt: "2026-06-03T11:00:00.000Z", summary: "Incident: child became distressed in the kitchen" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("treats exactly 48h as within window (boundary inclusive)", () => {
    const events = [
      ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: "Incident: child became distressed in the kitchen area today" }),
      ev({ id: "e2", occurredAt: "2026-06-03T10:00:00.000Z", summary: "Incident: child became distressed in the kitchen area today" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(1);
  });

  it("does NOT flag different children even with identical summaries", () => {
    const events = [
      ev({ id: "e1", childId: "child_1", summary: "Incident: child became distressed in the kitchen" }),
      ev({ id: "e2", childId: "child_2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: child became distressed in the kitchen" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("does NOT flag different event types even when wording matches", () => {
    const events = [
      ev({ id: "e1", type: "incident", summary: "child became distressed in the kitchen this evening" }),
      ev({ id: "e2", type: "daily_log", occurredAt: "2026-06-01T11:00:00.000Z", summary: "child became distressed in the kitchen this evening" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("does NOT flag low-similarity events within the window", () => {
    const events = [
      ev({ id: "e1", summary: "Incident: child became distressed in the kitchen" }),
      ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: medication refused at breakfast time" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("ignores events with no childId", () => {
    const e1 = ev({ id: "e1", summary: "Maintenance: boiler fault reported in the utility room" });
    const e2 = ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Maintenance: boiler fault reported in the utility room" });
    e1.childId = undefined;
    e2.childId = undefined;
    const r = computeDuplicateDetection({ events: [e1, e2], children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("falls back to child id when name is unknown", () => {
    const events = [
      ev({ id: "e1", childId: "child_99", summary: "Incident: child became distressed and left the building" }),
      ev({ id: "e2", childId: "child_99", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: child became distressed and left the building" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.duplicates[0].child_name).toBe("child_99");
  });

  it("uses preferred_name when present", () => {
    const events = [
      ev({ id: "e1", childId: "child_2", summary: "Incident: ran out of the classroom and hid in the yard" }),
      ev({ id: "e2", childId: "child_2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: ran out of the classroom and hid in the yard" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.duplicates[0].child_name).toBe("Dan");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("computeDuplicateDetection — recurring-event tuning (daily_log)", () => {
  it("does NOT flag routine daily logs that share generic wording but differ in content", () => {
    // ~0.6 overlap — enough for a generic incident, but below the daily_log bar.
    const events = [
      ev({ id: "e1", type: "daily_log", summary: "morning log child ate breakfast watched television played football outside" }),
      ev({ id: "e2", type: "daily_log", occurredAt: "2026-06-02T08:00:00.000Z", summary: "morning log child ate breakfast watched television completed homework quietly" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("DOES flag genuinely near-identical daily logs", () => {
    const events = [
      ev({ id: "e1", type: "daily_log", occurredAt: "2026-06-01T20:00:00.000Z", summary: "evening log child watched television then went to bed at nine without any issues" }),
      ev({ id: "e2", type: "daily_log", occurredAt: "2026-06-01T20:30:00.000Z", summary: "evening log child watched television then went to bed at nine without any issues" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(1);
    expect(r.duplicates[0].similarity).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("computeDuplicateDetection — clusters & alerts", () => {
  function triple() {
    const s = "Incident: child became distressed and damaged property in the lounge area";
    return [
      ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: s }),
      ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: s }),
      ev({ id: "e3", occurredAt: "2026-06-01T12:00:00.000Z", summary: s }),
    ];
  }

  it("groups three mutually-duplicate events into one cluster", () => {
    const r = computeDuplicateDetection({ events: triple(), children: CHILDREN, today: TODAY });
    expect(r.overview.clusters).toBe(1);
    expect(r.clusters[0].size).toBe(3);
    expect(r.clusters[0].event_ids).toEqual(["e1", "e2", "e3"]);
    // 3 events → 3 unordered pairs (e1-e2, e1-e3, e2-e3).
    expect(r.overview.suspected_duplicates).toBe(3);
  });

  it("raises an alert for clusters of >= 3", () => {
    const r = computeDuplicateDetection({ events: triple(), children: CHILDREN, today: TODAY });
    expect(r.alerts.length).toBe(1);
    expect(r.alerts[0].child_id).toBe("child_1");
    expect(r.alerts[0].event_type).toBe("incident");
    expect(["medium", "high"]).toContain(r.alerts[0].severity);
  });

  it("does NOT raise a cluster alert for a single pair", () => {
    const events = [
      ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: "Incident: child became distressed and damaged property in the lounge" }),
      ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: child became distressed and damaged property in the lounge" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.clusters).toBe(1);
    expect(r.alerts.length).toBe(0);
  });

  it("keeps distinct child/type pairs in separate clusters", () => {
    const s = "Incident: child became distressed and damaged property in the lounge";
    const events = [
      ev({ id: "a1", childId: "child_1", occurredAt: "2026-06-01T10:00:00.000Z", summary: s }),
      ev({ id: "a2", childId: "child_1", occurredAt: "2026-06-01T11:00:00.000Z", summary: s }),
      ev({ id: "b1", childId: "child_2", occurredAt: "2026-06-01T10:00:00.000Z", summary: s }),
      ev({ id: "b2", childId: "child_2", occurredAt: "2026-06-01T11:00:00.000Z", summary: s }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.clusters).toBe(2);
    expect(r.overview.suspected_duplicates).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("computeDuplicateDetection — overview & insights", () => {
  it("reports total_events from the full input, not just candidates", () => {
    const e1 = ev({ id: "e1", summary: "Incident: child became distressed and broke a window" });
    const e2 = ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: child became distressed and broke a window" });
    const noChild = ev({ id: "e3", summary: "loose event" });
    noChild.childId = undefined;
    const r = computeDuplicateDetection({ events: [e1, e2, noChild], children: CHILDREN, today: TODAY });
    expect(r.overview.total_events).toBe(3);
    expect(r.overview.suspected_duplicates).toBe(1);
  });

  it("emits a positive insight when there are no duplicates", () => {
    const events = [ev({ id: "solo", summary: "Incident: one-off event with unique wording entirely" })];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
    expect(r.insights.length).toBe(1);
    expect(r.insights[0].severity).toBe("positive");
  });

  it("emits a warning insight when duplicates exist", () => {
    const events = [
      ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: "Incident: child became distressed and damaged the door" }),
      ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: child became distressed and damaged the door" }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.insights.some((i) => i.severity === "warning")).toBe(true);
  });

  it("emits a critical insight when a cluster of >= 3 exists", () => {
    const s = "Incident: child became distressed and damaged property repeatedly today";
    const events = [
      ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: s }),
      ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: s }),
      ev({ id: "e3", occurredAt: "2026-06-01T12:00:00.000Z", summary: s }),
    ];
    const r = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("computeDuplicateDetection — robustness", () => {
  it("ignores events with unparseable timestamps", () => {
    const e1 = ev({ id: "e1", summary: "Incident: child became distressed in the kitchen today" });
    const e2 = ev({ id: "e2", occurredAt: "not-a-date", summary: "Incident: child became distressed in the kitchen today" });
    const r = computeDuplicateDetection({ events: [e1, e2], children: CHILDREN, today: TODAY });
    expect(r.overview.suspected_duplicates).toBe(0);
  });

  it("returns empty result for empty input", () => {
    const r = computeDuplicateDetection({ events: [], today: TODAY });
    expect(r.overview.total_events).toBe(0);
    expect(r.overview.suspected_duplicates).toBe(0);
    expect(r.overview.clusters).toBe(0);
    expect(r.duplicates).toEqual([]);
    expect(r.clusters).toEqual([]);
  });

  it("works without a children directory (names fall back to ids)", () => {
    const events = [
      ev({ id: "e1", childId: "child_x", summary: "Incident: child became distressed and ran outside" }),
      ev({ id: "e2", childId: "child_x", occurredAt: "2026-06-01T11:00:00.000Z", summary: "Incident: child became distressed and ran outside" }),
    ];
    const r = computeDuplicateDetection({ events, today: TODAY });
    expect(r.duplicates[0].child_name).toBe("child_x");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("computeDuplicateDetection — determinism", () => {
  const s = "Incident: child became distressed and damaged property in the lounge area";
  const events = [
    ev({ id: "e3", occurredAt: "2026-06-01T12:00:00.000Z", summary: s }),
    ev({ id: "e1", occurredAt: "2026-06-01T10:00:00.000Z", summary: s }),
    ev({ id: "e2", occurredAt: "2026-06-01T11:00:00.000Z", summary: s }),
    ev({ id: "x1", childId: "child_2", occurredAt: "2026-06-02T09:00:00.000Z", summary: "Medication: paracetamol given twice by mistake in error" }),
  ];

  it("produces identical JSON for the same input", () => {
    const a = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    const b = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("is independent of input order (shuffled input → identical output)", () => {
    const shuffled = [events[3], events[0], events[2], events[1]];
    const a = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    const b = computeDuplicateDetection({ events: shuffled, children: CHILDREN, today: TODAY });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("does not depend on the wall clock (explicit today vs default match for fixed-date data)", () => {
    const withToday = computeDuplicateDetection({ events, children: CHILDREN, today: TODAY });
    const withDefault = computeDuplicateDetection({ events, children: CHILDREN });
    // today only affects reserved recency weighting (currently unused) — output is identical.
    expect(JSON.stringify(withToday)).toBe(JSON.stringify(withDefault));
  });
});
