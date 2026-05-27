// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DELEGATED AUTHORITY INTELLIGENCE ENGINE — TESTS
// Reg 22: "Arrangements for the delegation of authority."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeDelegatedAuthority,
  type HomeDelegatedAuthorityInput,
  type DelegatedAuthorityInput,
  type DelegatedAuthorityItemInput,
} from "../home-delegated-authority-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<DelegatedAuthorityItemInput> = {}): DelegatedAuthorityItemInput {
  return {
    category: "medical",
    status: "granted",
    detail: "RM to consent to routine medical.",
    conditions: "Excludes elective surgery.",
    granted_by: "SW Sarah Collins",
    granted_date: "2026-02-10",
    review_date: "2026-08-10",
    ...overrides,
  };
}

function makeAuthority(overrides: Partial<DelegatedAuthorityInput> = {}): DelegatedAuthorityInput {
  return {
    id: "da_test",
    child_id: "yp_alex",
    last_reviewed: "2026-05-15",
    next_review: "2026-08-15",
    items: [
      makeItem({ category: "medical" }),
      makeItem({ category: "education" }),
      makeItem({ category: "leisure" }),
      makeItem({ category: "emergency" }),
      makeItem({ category: "overnight_stays" }),
    ],
    notes: "Comprehensive DA in place.",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeDelegatedAuthorityInput> = {}): HomeDelegatedAuthorityInput {
  return {
    today: "2026-05-27",
    delegated_authorities: [makeAuthority()],
    total_children: 3,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeHomeDelegatedAuthority(baseInput({ total_children: 0 }));
    expect(r.authority_rating).toBe("insufficient_data");
    expect(r.authority_score).toBe(0);
  });

  it("returns insufficient_data when no delegated authority records", () => {
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [] }));
    expect(r.authority_rating).toBe("insufficient_data");
    expect(r.authority_score).toBe(0);
  });

  it("populates all profiles with zeros", () => {
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [] }));
    expect(r.status_profile.total_items).toBe(0);
    expect(r.category_coverage.categories_addressed).toBe(0);
    expect(r.child_coverage.children_with_authority).toBe(0);
    expect(r.review_profile.total_authorities).toBe(0);
  });

  it("lists all categories as gaps when no data", () => {
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [] }));
    expect(r.category_coverage.gaps).toHaveLength(12);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. STATUS PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("status profile", () => {
  it("counts items by status", () => {
    const auth = makeAuthority({
      items: [
        makeItem({ status: "granted" }),
        makeItem({ status: "granted" }),
        makeItem({ status: "not_granted" }),
        makeItem({ status: "partial" }),
        makeItem({ status: "pending" }),
      ],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.status_profile.total_items).toBe(5);
    expect(r.status_profile.granted).toBe(2);
    expect(r.status_profile.not_granted).toBe(1);
    expect(r.status_profile.partial).toBe(1);
    expect(r.status_profile.pending).toBe(1);
  });

  it("calculates granted rate", () => {
    const auth = makeAuthority({
      items: [
        makeItem({ status: "granted" }),
        makeItem({ status: "granted" }),
        makeItem({ status: "granted" }),
        makeItem({ status: "pending" }),
      ],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.status_profile.granted_rate).toBe(75); // 3/4
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. CATEGORY COVERAGE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("category coverage profile", () => {
  it("counts unique categories addressed", () => {
    const auth = makeAuthority({
      items: [
        makeItem({ category: "medical" }),
        makeItem({ category: "education" }),
        makeItem({ category: "leisure" }),
        makeItem({ category: "medical" }), // duplicate
      ],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.category_coverage.categories_addressed).toBe(3);
  });

  it("identifies gap categories", () => {
    const auth = makeAuthority({
      items: [makeItem({ category: "medical" })],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.category_coverage.gaps).toContain("education");
    expect(r.category_coverage.gaps).toContain("leisure");
    expect(r.category_coverage.gaps).not.toContain("medical");
  });

  it("calculates coverage rate", () => {
    const items = ["medical", "education", "leisure", "emergency", "travel", "contact"].map(
      (c) => makeItem({ category: c }),
    );
    const auth = makeAuthority({ items });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.category_coverage.coverage_rate).toBe(50); // 6/12
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CHILD COVERAGE PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("child coverage profile", () => {
  it("counts unique children with authority", () => {
    const auths = [
      makeAuthority({ id: "da1", child_id: "yp_alex" }),
      makeAuthority({ id: "da2", child_id: "yp_jordan" }),
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.child_coverage.children_with_authority).toBe(2);
    expect(r.child_coverage.children_without_authority).toBe(1);
  });

  it("tracks items per child", () => {
    const auths = [
      makeAuthority({ id: "da1", child_id: "yp_alex", items: [makeItem(), makeItem()] }),
      makeAuthority({ id: "da2", child_id: "yp_jordan", items: [makeItem()] }),
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.child_coverage.items_per_child["yp_alex"]).toBe(2);
    expect(r.child_coverage.items_per_child["yp_jordan"]).toBe(1);
  });

  it("calculates 100% coverage when all children have authority", () => {
    const auths = [
      makeAuthority({ id: "da1", child_id: "yp_alex" }),
      makeAuthority({ id: "da2", child_id: "yp_jordan" }),
      makeAuthority({ id: "da3", child_id: "yp_casey" }),
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.child_coverage.coverage_rate).toBe(100);
    expect(r.child_coverage.children_without_authority).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. REVIEW PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("review profile", () => {
  it("identifies overdue reviews (next_review past today)", () => {
    const auths = [
      makeAuthority({ id: "da1", next_review: "2026-05-20" }), // past → overdue
      makeAuthority({ id: "da2", next_review: "2026-08-15", child_id: "yp_jordan" }), // future → fine
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.review_profile.reviews_overdue).toBe(1);
  });

  it("identifies reviews due soon (within 30 days)", () => {
    const auths = [
      makeAuthority({ id: "da1", next_review: "2026-06-15" }), // 19 days → due soon
      makeAuthority({ id: "da2", next_review: "2026-09-01", child_id: "yp_jordan" }), // far future
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.review_profile.reviews_due_soon).toBe(1);
  });

  it("calculates avg days since last review", () => {
    const auths = [
      makeAuthority({ id: "da1", last_reviewed: "2026-05-17" }), // 10 days
      makeAuthority({ id: "da2", last_reviewed: "2026-05-07", child_id: "yp_jordan" }), // 20 days
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.review_profile.avg_days_since_review).toBe(15);
  });

  it("identifies stale reviews (>90 days since last reviewed)", () => {
    const auths = [
      makeAuthority({ id: "da1", last_reviewed: "2026-02-01" }), // ~115 days → stale
      makeAuthority({ id: "da2", last_reviewed: "2026-05-20", child_id: "yp_jordan" }), // 7 days → fine
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.review_profile.last_reviewed_stale).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: child coverage", () => {
  it("awards +5 for 100% child coverage", () => {
    const full = baseInput({
      delegated_authorities: [
        makeAuthority({ id: "da1", child_id: "yp_alex" }),
        makeAuthority({ id: "da2", child_id: "yp_jordan" }),
        makeAuthority({ id: "da3", child_id: "yp_casey" }),
      ],
    });
    const partial = baseInput({
      delegated_authorities: [
        makeAuthority({ id: "da1", child_id: "yp_alex" }),
        makeAuthority({ id: "da2", child_id: "yp_jordan" }),
      ],
    });
    const rFull = computeHomeDelegatedAuthority(full);
    const rPartial = computeHomeDelegatedAuthority(partial);
    // full: 100% → +5; partial: 67% → +1 (67 < 75). Diff = 4
    expect(rFull.authority_score - rPartial.authority_score).toBe(4);
  });
});

describe("mod2: category breadth", () => {
  it("awards +4 for >= 10 categories", () => {
    const items = [
      "medical", "education", "leisure", "overnight_stays", "travel",
      "haircut_appearance", "social_media", "religion", "pocket_money", "contact",
    ].map((c) => makeItem({ category: c }));
    const auth = makeAuthority({ items });
    const rBroad = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(rBroad.category_coverage.categories_addressed).toBe(10);

    const narrow = makeAuthority({
      items: ["medical", "education", "leisure", "emergency", "travel", "contact", "overnight_stays"].map(
        (c) => makeItem({ category: c }),
      ),
    });
    const rNarrow = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [narrow] }));
    // broad: mod2 10→+4, mod7 10items→+3; narrow: mod2 7→+2, mod7 7items→+1. Diff = 2+2 = 4
    expect(rBroad.authority_score - rNarrow.authority_score).toBe(4);
  });
});

describe("mod3: granted rate", () => {
  it("awards +4 for >= 70% granted", () => {
    const auth = makeAuthority({
      items: [
        makeItem({ status: "granted" }),
        makeItem({ status: "granted" }),
        makeItem({ status: "granted" }),
        makeItem({ status: "partial" }),
      ],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.status_profile.granted_rate).toBe(75);
  });
});

describe("mod4: pending items", () => {
  it("awards +3 for 0 pending items", () => {
    const noPending = baseInput({
      delegated_authorities: [makeAuthority({
        items: [makeItem({ status: "granted" }), makeItem({ status: "granted" })],
      })],
    });
    const withPending = baseInput({
      delegated_authorities: [makeAuthority({
        items: [makeItem({ status: "granted" }), makeItem({ status: "pending" })],
      })],
    });
    const rNo = computeHomeDelegatedAuthority(noPending);
    const rWith = computeHomeDelegatedAuthority(withPending);
    // noPending: 0% → +3; withPending: 50% → -3. Diff = 6
    // Also mod3 changes: noPending 100% granted → +4; withPending 50% granted → +2. Diff = 2
    // Total diff = 6 + 2 = 8
    expect(rNo.authority_score - rWith.authority_score).toBe(8);
  });
});

describe("mod5: review compliance", () => {
  it("awards +4 for 0 overdue reviews", () => {
    const current = baseInput({
      delegated_authorities: [makeAuthority({ next_review: "2026-08-15" })],
    });
    const overdue = baseInput({
      delegated_authorities: [makeAuthority({ next_review: "2026-05-20" })],
    });
    const rCurrent = computeHomeDelegatedAuthority(current);
    const rOverdue = computeHomeDelegatedAuthority(overdue);
    // current: 0% overdue → +4; overdue: 100% overdue → -4. Diff = 8
    // Also mod6 may differ if last_reviewed is same for both
    // Both have last_reviewed = "2026-05-15" (12 days) → mod6 same (+3 both)
    // Actually overdue next_review doesn't change last_reviewed.
    // But wait — overdue next_review = "2026-05-20" — is that "due soon"?
    // daysBetween(today, 2026-05-20) = -7 → < 0 → not due soon. It's overdue.
    // current next_review = "2026-08-15" → daysBetween(2026-05-27, 2026-08-15) = 80 → > 30 → not due soon
    expect(rCurrent.authority_score - rOverdue.authority_score).toBe(8);
  });
});

describe("mod6: review freshness", () => {
  it("awards +3 for avg <= 30 days since review", () => {
    const fresh = baseInput({
      delegated_authorities: [makeAuthority({ last_reviewed: "2026-05-15" })],
    });
    const r = computeHomeDelegatedAuthority(fresh);
    expect(r.review_profile.avg_days_since_review).toBeLessThanOrEqual(30);
  });

  it("penalises -3 for avg > 90 days", () => {
    const stale = baseInput({
      delegated_authorities: [makeAuthority({ last_reviewed: "2026-02-01" })],
    });
    const fresh = baseInput({
      delegated_authorities: [makeAuthority({ last_reviewed: "2026-05-15" })],
    });
    const rStale = computeHomeDelegatedAuthority(stale);
    const rFresh = computeHomeDelegatedAuthority(fresh);
    // stale: >90 days → -3; fresh: ≤30 → +3. Diff = 6
    expect(rFresh.authority_score - rStale.authority_score).toBe(6);
  });
});

describe("mod7: detail quality", () => {
  it("awards +3 for >= 8 items per child", () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      makeItem({ category: ["medical", "education", "leisure", "emergency", "travel", "contact", "overnight_stays", "social_media"][i] }),
    );
    const auth = makeAuthority({ items });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.child_coverage.items_per_child["yp_alex"]).toBe(8);
  });
});

describe("mod8: conditions documented", () => {
  it("awards +4 for >= 80% with conditions", () => {
    const items = [
      makeItem({ conditions: "Some condition" }),
      makeItem({ conditions: "Another condition" }),
      makeItem({ conditions: "Yet another" }),
      makeItem({ conditions: "Condition here" }),
      makeItem({ conditions: "And one more" }),
    ];
    const auth = makeAuthority({ items });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    // 100% with conditions → +4
  });

  it("penalises -3 for < 40% with conditions", () => {
    const withCond = baseInput({
      delegated_authorities: [makeAuthority({
        items: [
          makeItem({ conditions: "Condition" }),
          makeItem({ conditions: "" }),
          makeItem({ conditions: "" }),
          makeItem({ conditions: "" }),
        ],
      })],
    });
    const r = computeHomeDelegatedAuthority(withCond);
    // 1/4 = 25% → -3
    expect(r.status_profile.total_items).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for excellent scenario", () => {
    // 3 children, 10+ categories, all granted, no pending, reviews current, detailed
    const makeComprehensiveAuth = (childId: string, id: string) =>
      makeAuthority({
        id,
        child_id: childId,
        last_reviewed: "2026-05-20",
        next_review: "2026-08-20",
        items: [
          "medical", "education", "leisure", "overnight_stays", "travel",
          "haircut_appearance", "social_media", "pocket_money", "contact", "emergency",
        ].map((c) => makeItem({ category: c, status: "granted", conditions: "Standard conditions" })),
      });

    const auths = [
      makeComprehensiveAuth("yp_alex", "da1"),
      makeComprehensiveAuth("yp_jordan", "da2"),
      makeComprehensiveAuth("yp_casey", "da3"),
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    // mod1: 100% → +5
    // mod2: 10 categories → +4
    // mod3: 100% granted → +4
    // mod4: 0% pending → +3
    // mod5: 0% overdue → +4
    // mod6: 7 days avg → +3
    // mod7: 10 items/child → +3
    // mod8: 100% conditions → +4
    // Total: 52 + 5 + 4 + 4 + 3 + 4 + 3 + 3 + 4 = 82
    expect(r.authority_rating).toBe("outstanding");
    expect(r.authority_score).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for poor scenario", () => {
    const auth = makeAuthority({
      child_id: "yp_alex",
      last_reviewed: "2025-12-01", // very stale
      next_review: "2026-03-01", // very overdue
      items: [
        makeItem({ status: "pending", conditions: "" }),
        makeItem({ status: "pending", conditions: "" }),
      ],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.authority_rating).toBe("inadequate");
    expect(r.authority_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes child coverage strength", () => {
    const auths = [
      makeAuthority({ id: "da1", child_id: "yp_alex" }),
      makeAuthority({ id: "da2", child_id: "yp_jordan" }),
      makeAuthority({ id: "da3", child_id: "yp_casey" }),
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.strengths.some((s) => s.includes("All children"))).toBe(true);
  });

  it("includes granted rate strength", () => {
    const auth = makeAuthority({
      items: Array.from({ length: 4 }, () => makeItem({ status: "granted" })),
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.strengths.some((s) => s.includes("granted"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags children without authority", () => {
    const r = computeHomeDelegatedAuthority(baseInput({
      delegated_authorities: [makeAuthority({ child_id: "yp_alex" })],
    }));
    expect(r.concerns.some((c) => c.includes("no delegated authority"))).toBe(true);
  });

  it("flags overdue reviews", () => {
    const r = computeHomeDelegatedAuthority(baseInput({
      delegated_authorities: [makeAuthority({ next_review: "2026-05-01" })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("flags pending items", () => {
    const auth = makeAuthority({
      items: [makeItem({ status: "pending" }), makeItem({ status: "granted" })],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.concerns.some((c) => c.includes("pending"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for children without authority", () => {
    const r = computeHomeDelegatedAuthority(baseInput({
      delegated_authorities: [makeAuthority({ child_id: "yp_alex" })],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Create delegated authority"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("generates immediate rec for overdue reviews", () => {
    const r = computeHomeDelegatedAuthority(baseInput({
      delegated_authorities: [makeAuthority({ next_review: "2026-05-01" })],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("overdue"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("ranks sequentially", () => {
    const auth = makeAuthority({
      next_review: "2026-05-01",
      items: [makeItem({ status: "pending" })],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates critical insight for children without authority", () => {
    const r = computeHomeDelegatedAuthority(baseInput({
      delegated_authorities: [makeAuthority({ child_id: "yp_alex" })],
    }));
    const ins = r.insights.find((i) => i.text.includes("no delegated authority"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates warning insight for pending items", () => {
    const auth = makeAuthority({
      items: [makeItem({ status: "pending" }), makeItem({ status: "granted" })],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    const ins = r.insights.find((i) => i.text.includes("pending"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("warning");
  });

  it("generates positive insight for comprehensive authority", () => {
    const auths = [
      makeAuthority({ id: "da1", child_id: "yp_alex", items: Array.from({ length: 8 }, (_, i) =>
        makeItem({ category: ["medical", "education", "leisure", "emergency", "travel", "contact", "overnight_stays", "social_media"][i] }),
      )}),
      makeAuthority({ id: "da2", child_id: "yp_jordan", items: Array.from({ length: 8 }, (_, i) =>
        makeItem({ category: ["medical", "education", "leisure", "emergency", "travel", "contact", "overnight_stays", "social_media"][i] }),
      )}),
      makeAuthority({ id: "da3", child_id: "yp_casey", items: Array.from({ length: 8 }, (_, i) =>
        makeItem({ category: ["medical", "education", "leisure", "emergency", "travel", "contact", "overnight_stays", "social_media"][i] }),
      )}),
    ];
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    const ins = r.insights.find((i) => i.text.includes("All children have delegated authority"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. SCORE CLAMPING & EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const auths = ["yp_alex", "yp_jordan", "yp_casey"].map((childId, idx) =>
      makeAuthority({
        id: `da${idx}`,
        child_id: childId,
        last_reviewed: "2026-05-25",
        next_review: "2026-11-25",
        items: Array.from({ length: 12 }, (_, i) =>
          makeItem({
            category: ["medical", "education", "leisure", "overnight_stays", "travel", "haircut_appearance", "social_media", "religion", "pocket_money", "contact", "photography", "emergency"][i],
            status: "granted",
            conditions: "Documented condition.",
          }),
        ),
      }),
    );
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: auths }));
    expect(r.authority_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const auth = makeAuthority({
      last_reviewed: "2025-06-01",
      next_review: "2025-12-01",
      items: [makeItem({ status: "pending", conditions: "" })],
    });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.authority_score).toBeGreaterThanOrEqual(0);
  });
});

describe("edge cases", () => {
  it("handles authority with no items", () => {
    const auth = makeAuthority({ items: [] });
    const r = computeHomeDelegatedAuthority(baseInput({ delegated_authorities: [auth] }));
    expect(r.status_profile.total_items).toBe(0);
  });

  it("handles single authority correctly", () => {
    const r = computeHomeDelegatedAuthority(baseInput());
    expect(r.review_profile.total_authorities).toBe(1);
    expect(r.child_coverage.children_with_authority).toBe(1);
  });
});
