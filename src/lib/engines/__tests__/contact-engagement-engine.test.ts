// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT & FAMILY ENGAGEMENT ENGINE TESTS
// Comprehensive unit + integration tests for Contact Engagement Intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeContactEngagement,
  daysBetween,
  isSiblingContact,
  presentationLabel,
  mostFrequent,
  type ContactEngagementInput,
  type ChildInput,
  type ContactPlanInput,
  type FamilyTimeSessionInput,
  type MoodEntryInput,
} from "../contact-engagement-engine";

// ── Factories ──────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeChild(overrides: Partial<ChildInput> = {}): ChildInput {
  return { id: "child_1", name: "Alex", ...overrides };
}

function makeContactPlan(overrides: Partial<ContactPlanInput> = {}): ContactPlanInput {
  return {
    id: "plan_1",
    child_id: "child_1",
    status: "active",
    review_date: "2025-06-01",
    arrangements_count: 2,
    last_reviewed_date: "2025-01-15",
    ...overrides,
  };
}

function makeSession(overrides: Partial<FamilyTimeSessionInput> = {}): FamilyTimeSessionInput {
  return {
    id: "fts_1",
    child_id: "child_1",
    date: "2025-03-10",
    duration_minutes: 60,
    family_member: "birth_parent",
    family_member_name: "Sarah W",
    supervision_level: "supervised",
    presentation_before: "settled",
    was_safe: true,
    concerns_count: 0,
    positive_observations_count: 3,
    ...overrides,
  };
}

function makeMoodEntry(overrides: Partial<MoodEntryInput> = {}): MoodEntryInput {
  return {
    child_id: "child_1",
    date: "2025-03-10",
    mood_score: 7,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ContactEngagementInput> = {}): ContactEngagementInput {
  return {
    children: [],
    contactPlans: [],
    familyTimeSessions: [],
    moodEntries: [],
    today: TODAY,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// UNIT TESTS — HELPERS
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Helper Functions", () => {
  describe("daysBetween", () => {
    it("returns 0 for same date", () => {
      expect(daysBetween("2025-03-15", "2025-03-15")).toBe(0);
    });

    it("returns positive for later date", () => {
      expect(daysBetween("2025-03-01", "2025-03-15")).toBe(14);
    });
  });

  describe("isSiblingContact", () => {
    it("returns true for sibling roles", () => {
      expect(isSiblingContact("sibling")).toBe(true);
      expect(isSiblingContact("half_sibling")).toBe(true);
      expect(isSiblingContact("step_sibling")).toBe(true);
    });

    it("returns false for other roles", () => {
      expect(isSiblingContact("birth_parent")).toBe(false);
      expect(isSiblingContact("grandparent")).toBe(false);
    });
  });

  describe("presentationLabel", () => {
    it("maps known presentations", () => {
      expect(presentationLabel("settled")).toBe("Settled");
      expect(presentationLabel("anxious")).toBe("Anxious");
      expect(presentationLabel("withdrawn")).toBe("Withdrawn");
    });

    it("formats unknown values", () => {
      expect(presentationLabel("very_happy")).toBe("Very Happy");
    });
  });

  describe("mostFrequent", () => {
    it("returns null for empty array", () => {
      expect(mostFrequent([])).toBeNull();
    });

    it("finds most frequent value", () => {
      expect(mostFrequent(["a", "b", "a", "c", "a"])).toBe("a");
    });

    it("returns first max if tied", () => {
      const result = mostFrequent(["a", "b"]);
      expect(["a", "b"]).toContain(result);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Empty Input", () => {
  it("returns safe defaults", () => {
    const result = computeContactEngagement(makeInput());

    expect(result.compliance.total_children).toBe(0);
    expect(result.compliance.active_plans).toBe(0);
    expect(result.family_time.total_sessions_90d).toBe(0);
    expect(result.child_profiles).toHaveLength(0);
    expect(result.mood_impact.children_with_data).toBe(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
  });

  it("raises a critical unsafe_session alert when a contact is flagged unsafe", () => {
    const result = computeContactEngagement(makeInput({
      children: [makeChild({ id: "child_1", name: "Alex" })],
      familyTimeSessions: [makeSession({ child_id: "child_1", was_safe: false })],
    }));
    const unsafe = result.alerts.find((a) => a.type === "unsafe_session");
    expect(unsafe).toBeTruthy();
    expect(unsafe?.severity).toBe("critical");
    expect(unsafe?.child_name).toBe("Alex");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Compliance", () => {
  it("counts active plans", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeContactEngagement(makeInput({
      children,
      contactPlans: [
        makeContactPlan({ child_id: "c1", status: "active" }),
        makeContactPlan({ id: "p2", child_id: "c2", status: "suspended" }),
      ],
    }));

    expect(result.compliance.active_plans).toBe(1);
  });

  it("detects overdue plan reviews", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan({ review_date: "2025-02-01" })], // past today
    }));

    expect(result.compliance.plans_overdue_review).toBe(1);
  });

  it("counts sessions in time periods", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10" }), // 30d
        makeSession({ id: "s2", date: "2025-03-05" }), // 30d
        makeSession({ id: "s3", date: "2025-01-15" }), // 90d only
      ],
    }));

    expect(result.compliance.completed_sessions_30d).toBe(2);
    expect(result.compliance.total_sessions_90d).toBe(3);
  });

  it("computes average sessions per child", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeContactEngagement(makeInput({
      children,
      familyTimeSessions: [
        makeSession({ id: "s1", child_id: "c1", date: "2025-03-10" }),
        makeSession({ id: "s2", child_id: "c1", date: "2025-03-05" }),
        makeSession({ id: "s3", child_id: "c2", date: "2025-03-08" }),
      ],
    }));

    expect(result.compliance.avg_sessions_per_child_30d).toBe(1.5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — FAMILY TIME ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Family Time", () => {
  it("separates family and sibling contacts", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", family_member: "birth_parent" }),
        makeSession({ id: "s2", date: "2025-03-08", family_member: "sibling" }),
        makeSession({ id: "s3", date: "2025-03-05", family_member: "grandparent" }),
      ],
    }));

    expect(result.family_time.family_contact_sessions).toBe(2);
    expect(result.family_time.sibling_contact_sessions).toBe(1);
  });

  it("computes average duration", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", duration_minutes: 60 }),
        makeSession({ id: "s2", date: "2025-03-08", duration_minutes: 90 }),
      ],
    }));

    expect(result.family_time.avg_duration_minutes).toBe(75);
  });

  it("breaks down supervision levels", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", supervision_level: "supervised" }),
        makeSession({ id: "s2", date: "2025-03-08", supervision_level: "supervised" }),
        makeSession({ id: "s3", date: "2025-03-05", supervision_level: "unsupervised" }),
      ],
    }));

    expect(result.family_time.supervision_breakdown[0].level).toBe("supervised");
    expect(result.family_time.supervision_breakdown[0].count).toBe(2);
  });

  it("counts concern sessions", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", concerns_count: 2 }),
        makeSession({ id: "s2", date: "2025-03-08", concerns_count: 0 }),
      ],
    }));

    expect(result.family_time.concern_sessions).toBe(1);
  });

  it("computes safe session percentage", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", was_safe: true }),
        makeSession({ id: "s2", date: "2025-03-08", was_safe: true }),
        makeSession({ id: "s3", date: "2025-03-05", was_safe: false }),
      ],
    }));

    // 2/3 = 67%
    expect(result.family_time.safe_sessions_pct).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — CHILD PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Child Profiles", () => {
  it("builds profile with plan status and sessions", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan()],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10" }),
        makeSession({ id: "s2", date: "2025-03-05", family_member_name: "Jamie W" }),
        makeSession({ id: "s3", date: "2025-01-15" }),
      ],
    }));

    const profile = result.child_profiles[0];
    expect(profile.has_active_plan).toBe(true);
    expect(profile.plan_review_current).toBe(true);
    expect(profile.sessions_30d).toBe(2);
    expect(profile.sessions_90d).toBe(3);
    expect(profile.unique_contacts).toBe(2); // Sarah W and Jamie W
  });

  it("identifies most frequent contact", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", family_member_name: "Sarah W" }),
        makeSession({ id: "s2", date: "2025-03-08", family_member_name: "Sarah W" }),
        makeSession({ id: "s3", date: "2025-03-05", family_member_name: "Jamie W" }),
      ],
    }));

    expect(result.child_profiles[0].most_frequent_contact).toBe("Sarah W");
  });

  it("identifies predominant presentation", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", presentation_before: "anxious" }),
        makeSession({ id: "s2", date: "2025-03-08", presentation_before: "anxious" }),
        makeSession({ id: "s3", date: "2025-03-05", presentation_before: "settled" }),
      ],
    }));

    expect(result.child_profiles[0].predominant_presentation).toBe("anxious");
  });

  it("reports no plan for child without one", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      // No contact plans
    }));

    expect(result.child_profiles[0].has_active_plan).toBe(false);
    expect(result.child_profiles[0].plan_review_current).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — MOOD IMPACT
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Mood Impact", () => {
  it("detects positive mood impact on contact days", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10" }),
        makeSession({ id: "s2", date: "2025-03-12" }),
      ],
      moodEntries: [
        // Contact days — higher mood
        makeMoodEntry({ date: "2025-03-10", mood_score: 8 }),
        makeMoodEntry({ date: "2025-03-12", mood_score: 9 }),
        // Non-contact days — lower mood
        makeMoodEntry({ date: "2025-03-11", mood_score: 5 }),
        makeMoodEntry({ date: "2025-03-13", mood_score: 5 }),
        makeMoodEntry({ date: "2025-03-14", mood_score: 5 }),
      ],
    }));

    expect(result.mood_impact.children_with_data).toBe(1);
    expect(result.mood_impact.positive_impact_children).toBe(1);
    expect(result.mood_impact.avg_mood_contact_days!).toBeGreaterThan(result.mood_impact.avg_mood_non_contact_days!);
  });

  it("detects negative mood impact on contact days", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10" }),
      ],
      moodEntries: [
        // Contact day — lower mood
        makeMoodEntry({ date: "2025-03-10", mood_score: 3 }),
        // Non-contact days — higher mood
        makeMoodEntry({ date: "2025-03-11", mood_score: 7 }),
        makeMoodEntry({ date: "2025-03-12", mood_score: 8 }),
      ],
    }));

    expect(result.mood_impact.negative_impact_children).toBe(1);
  });

  it("ignores children without both mood and contact data", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeContactEngagement(makeInput({
      children,
      familyTimeSessions: [makeSession({ child_id: "c1", date: "2025-03-10" })],
      moodEntries: [makeMoodEntry({ child_id: "c1", date: "2025-03-10" })],
      // c2 has no mood or contact data
    }));

    expect(result.mood_impact.children_with_data).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Alerts", () => {
  it("generates plan overdue review alert", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan({ review_date: "2025-02-01" })],
    }));

    const alert = result.alerts.find((a) => a.type === "plan_overdue_review");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("generates no-contact alert for children with active plan", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan()],
      // No sessions in last 30 days
      familyTimeSessions: [makeSession({ date: "2024-12-01" })],
    }));

    const alert = result.alerts.find((a) => a.type === "no_contact_30d");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("generates repeat concerns alert", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", concerns_count: 2 }),
        makeSession({ id: "s2", date: "2025-03-05", concerns_count: 1 }),
        makeSession({ id: "s3", date: "2025-02-15", concerns_count: 0 }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "repeat_concerns");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("generates negative presentation alert", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", presentation_before: "anxious" }),
        makeSession({ id: "s2", date: "2025-03-05", presentation_before: "anxious" }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "negative_presentation");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("generates negative mood impact alert", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      familyTimeSessions: [makeSession({ date: "2025-03-10" })],
      moodEntries: [
        makeMoodEntry({ date: "2025-03-10", mood_score: 3 }),
        makeMoodEntry({ date: "2025-03-11", mood_score: 8 }),
        makeMoodEntry({ date: "2025-03-12", mood_score: 8 }),
      ],
    }));

    const alert = result.alerts.find((a) => a.type === "negative_mood_impact");
    expect(alert).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS — INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Cara Insights", () => {
  it("generates warning for children without active plans", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      // No plans
    }));

    const insight = result.insights.find((i) => i.text.includes("active contact plan"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates overdue review warning", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan({ review_date: "2025-02-01" })],
    }));

    const insight = result.insights.find((i) => i.text.includes("overdue for review"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("generates positive insight for good engagement", () => {
    const children = [makeChild({ id: "c1" }), makeChild({ id: "c2" })];
    const result = computeContactEngagement(makeInput({
      children,
      contactPlans: [
        makeContactPlan({ child_id: "c1" }),
        makeContactPlan({ id: "p2", child_id: "c2" }),
      ],
      familyTimeSessions: [
        makeSession({ id: "s1", child_id: "c1", date: "2025-03-10" }),
        makeSession({ id: "s2", child_id: "c1", date: "2025-03-05" }),
        makeSession({ id: "s3", child_id: "c2", date: "2025-03-08" }),
        makeSession({ id: "s4", child_id: "c2", date: "2025-03-03" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("Strong family engagement"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates positive insight for all safe sessions", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan()],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", was_safe: true }),
        makeSession({ id: "s2", date: "2025-03-05", was_safe: true }),
        makeSession({ id: "s3", date: "2025-02-20", was_safe: true }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("All contact sessions"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("positive");
  });

  it("generates no-sibling-contact warning", () => {
    const child = makeChild();
    const result = computeContactEngagement(makeInput({
      children: [child],
      contactPlans: [makeContactPlan()],
      familyTimeSessions: [
        makeSession({ id: "s1", date: "2025-03-10", family_member: "birth_parent" }),
        makeSession({ id: "s2", date: "2025-03-05", family_member: "grandparent" }),
        makeSession({ id: "s3", date: "2025-02-15", family_member: "birth_parent" }),
      ],
    }));

    const insight = result.insights.find((i) => i.text.includes("sibling contact"));
    expect(insight).toBeDefined();
    expect(insight!.severity).toBe("warning");
  });

  it("always generates at least one insight", () => {
    const result = computeContactEngagement(makeInput());
    expect(result.insights.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FULL INTEGRATION TEST — OAK HOUSE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Contact Engagement Engine — Chamberlain House Integration", () => {
  it("produces comprehensive analysis for multi-child home", () => {
    const children: ChildInput[] = [
      { id: "yp_alex", name: "Alex" },
      { id: "yp_jordan", name: "Jordan" },
      { id: "yp_casey", name: "Casey" },
    ];

    const contactPlans: ContactPlanInput[] = [
      { id: "p1", child_id: "yp_alex", status: "active", review_date: "2025-06-01", arrangements_count: 3, last_reviewed_date: "2025-01-15" },
      { id: "p2", child_id: "yp_jordan", status: "active", review_date: "2025-02-01", arrangements_count: 2, last_reviewed_date: "2024-08-01" }, // overdue
      { id: "p3", child_id: "yp_casey", status: "active", review_date: "2025-05-01", arrangements_count: 2, last_reviewed_date: "2025-02-01" },
    ];

    const familyTimeSessions: FamilyTimeSessionInput[] = [
      // Alex — regular contact with mum and brother
      { id: "s1", child_id: "yp_alex", date: "2025-03-10", duration_minutes: 90, family_member: "birth_parent", family_member_name: "Sarah W", supervision_level: "supervised", presentation_before: "settled", was_safe: true, concerns_count: 0, positive_observations_count: 4 },
      { id: "s2", child_id: "yp_alex", date: "2025-03-03", duration_minutes: 60, family_member: "sibling", family_member_name: "Jamie W", supervision_level: "unsupervised", presentation_before: "excited", was_safe: true, concerns_count: 0, positive_observations_count: 3 },
      { id: "s3", child_id: "yp_alex", date: "2025-02-17", duration_minutes: 90, family_member: "birth_parent", family_member_name: "Sarah W", supervision_level: "supervised", presentation_before: "settled", was_safe: true, concerns_count: 0, positive_observations_count: 3 },
      // Jordan — contact with dad, some concerns
      { id: "s4", child_id: "yp_jordan", date: "2025-03-08", duration_minutes: 60, family_member: "birth_parent", family_member_name: "Mark K", supervision_level: "supervised", presentation_before: "anxious", was_safe: true, concerns_count: 1, positive_observations_count: 1 },
      { id: "s5", child_id: "yp_jordan", date: "2025-02-22", duration_minutes: 60, family_member: "birth_parent", family_member_name: "Mark K", supervision_level: "supervised", presentation_before: "anxious", was_safe: true, concerns_count: 2, positive_observations_count: 0 },
      { id: "s6", child_id: "yp_jordan", date: "2025-02-08", duration_minutes: 45, family_member: "birth_parent", family_member_name: "Mark K", supervision_level: "supervised", presentation_before: "withdrawn", was_safe: false, concerns_count: 3, positive_observations_count: 0 },
      // Casey — good contact with mum and grandma
      { id: "s7", child_id: "yp_casey", date: "2025-03-12", duration_minutes: 120, family_member: "birth_parent", family_member_name: "Lisa P", supervision_level: "supported", presentation_before: "excited", was_safe: true, concerns_count: 0, positive_observations_count: 5 },
      { id: "s8", child_id: "yp_casey", date: "2025-03-01", duration_minutes: 90, family_member: "grandparent", family_member_name: "Nan P", supervision_level: "unsupervised", presentation_before: "settled", was_safe: true, concerns_count: 0, positive_observations_count: 4 },
    ];

    const moodEntries: MoodEntryInput[] = [
      // Alex — better on contact days
      { child_id: "yp_alex", date: "2025-03-10", mood_score: 8 },
      { child_id: "yp_alex", date: "2025-03-03", mood_score: 9 },
      { child_id: "yp_alex", date: "2025-03-11", mood_score: 6 },
      { child_id: "yp_alex", date: "2025-03-12", mood_score: 6 },
      // Jordan — worse on contact days
      { child_id: "yp_jordan", date: "2025-03-08", mood_score: 3 },
      { child_id: "yp_jordan", date: "2025-03-09", mood_score: 7 },
      { child_id: "yp_jordan", date: "2025-03-10", mood_score: 7 },
      // Casey — better on contact days
      { child_id: "yp_casey", date: "2025-03-12", mood_score: 9 },
      { child_id: "yp_casey", date: "2025-03-01", mood_score: 8 },
      { child_id: "yp_casey", date: "2025-03-11", mood_score: 7 },
    ];

    const result = computeContactEngagement({
      children,
      contactPlans,
      familyTimeSessions,
      moodEntries,
      today: TODAY,
    });

    // ── Compliance ─────────────────────────────────────────────────────────
    expect(result.compliance.total_children).toBe(3);
    expect(result.compliance.active_plans).toBe(3);
    expect(result.compliance.plans_overdue_review).toBe(1); // Jordan's
    expect(result.compliance.total_sessions_90d).toBe(8);

    // ── Family time ────────────────────────────────────────────────────────
    expect(result.family_time.sibling_contact_sessions).toBe(1); // Alex's brother
    expect(result.family_time.concern_sessions).toBe(3); // Jordan's 3 concern sessions
    expect(result.family_time.safe_sessions_pct).toBe(88); // 7/8 safe

    // ── Profiles ───────────────────────────────────────────────────────────
    const alexProfile = result.child_profiles.find((p) => p.child_id === "yp_alex")!;
    expect(alexProfile.unique_contacts).toBe(2);
    expect(alexProfile.most_frequent_contact).toBe("Sarah W");
    expect(alexProfile.predominant_presentation).toBe("settled");

    const jordanProfile = result.child_profiles.find((p) => p.child_id === "yp_jordan")!;
    expect(jordanProfile.concern_sessions_90d).toBe(3);
    expect(jordanProfile.predominant_presentation).toBe("anxious");

    // ── Mood impact ────────────────────────────────────────────────────────
    expect(result.mood_impact.children_with_data).toBe(3);
    expect(result.mood_impact.positive_impact_children).toBe(2); // Alex and Casey
    expect(result.mood_impact.negative_impact_children).toBe(1); // Jordan

    // ── Alerts ─────────────────────────────────────────────────────────────
    expect(result.alerts.some((a) => a.type === "plan_overdue_review" && a.child_name === "Jordan")).toBe(true);
    expect(result.alerts.some((a) => a.type === "repeat_concerns" && a.child_name === "Jordan")).toBe(true);
    expect(result.alerts.some((a) => a.type === "negative_presentation" && a.child_name === "Jordan")).toBe(true);
    expect(result.alerts.some((a) => a.type === "negative_mood_impact" && a.child_name === "Jordan")).toBe(true);

    // ── Insights ───────────────────────────────────────────────────────────
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("overdue"))).toBe(true);
    expect(result.insights.some((i) => i.severity === "warning" && i.text.includes("lower mood"))).toBe(true);
    expect(result.insights.some((i) => i.severity === "positive" && (i.text.includes("settled") || i.text.includes("engagement")))).toBe(true);
  });
});
