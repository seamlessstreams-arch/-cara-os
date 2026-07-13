import { describe, it, expect } from "vitest";
import {
  computeEmergencyFollowUps,
  isEmergencyAdmission,
  type EmergencyChild,
  type FollowUpSources,
} from "../emergency-followups-engine";
import {
  buildOriginStory,
  makeChildNameMatcher,
  type YoungPersonLite,
  type PlacementReferralLite,
} from "../admission-retro-link-engine";

const NOW = "2026-07-13T09:00:00.000Z";
const child: EmergencyChild = {
  id: "yp_alex",
  name: "Alex Thompson",
  placement_start: "2026-07-01",
  emergency_basis: "Emergency admission (admission referral, placed)",
};
const EMPTY: FollowUpSources = { riskAssessments: [], welfareChecks: [], healthAssessments: [], lacReviews: [] };

describe("computeEmergencyFollowUps — deadlines from placement start", () => {
  it("no records: risk+welfare overdue (day 1/7 passed), health+LAC still due (day 28 not)", () => {
    const b = computeEmergencyFollowUps(child, EMPTY, NOW);
    const byKey = Object.fromEntries(b.followups.map((f) => [f.key, f]));
    expect(byKey.risk_assessment.status).toBe("overdue");        // deadline 2026-07-02
    expect(byKey.first_welfare_check.status).toBe("overdue");    // deadline 2026-07-08
    expect(byKey.initial_health_assessment.status).toBe("due");  // deadline 2026-07-29
    expect(byKey.first_lac_review.status).toBe("due");
    expect(b.overdue_count).toBe(2);
    expect(byKey.first_welfare_check.deadline_date).toBe("2026-07-08");
  });

  it("a record on/after placement start satisfies its follow-up", () => {
    const b = computeEmergencyFollowUps(
      child,
      { ...EMPTY, welfareChecks: [{ child_id: "yp_alex", date: "2026-07-03" }], lacReviews: [{ child_id: "yp_alex", date: "2026-07-10" }] },
      NOW,
    );
    const byKey = Object.fromEntries(b.followups.map((f) => [f.key, f]));
    expect(byKey.first_welfare_check.status).toBe("done");
    expect(byKey.first_welfare_check.completed_on).toBe("2026-07-03");
    expect(byKey.first_lac_review.status).toBe("done");
  });

  it("a pre-placement record does NOT satisfy time-anchored follow-ups (but DOES satisfy risk assessment)", () => {
    const b = computeEmergencyFollowUps(
      child,
      {
        ...EMPTY,
        welfareChecks: [{ child_id: "yp_alex", date: "2026-06-20" }],   // before placement — doesn't count
        riskAssessments: [{ child_id: "yp_alex", review_date: "2026-06-20" }], // living doc — counts
      },
      NOW,
    );
    const byKey = Object.fromEntries(b.followups.map((f) => [f.key, f]));
    expect(byKey.first_welfare_check.status).toBe("overdue");
    expect(byKey.risk_assessment.status).toBe("done");
  });

  it("another child's records never satisfy this child's follow-ups", () => {
    const b = computeEmergencyFollowUps(
      child,
      { ...EMPTY, healthAssessments: [{ child_id: "yp_other", date: "2026-07-05" }] },
      NOW,
    );
    expect(b.followups.find((f) => f.key === "initial_health_assessment")?.status).toBe("due");
  });
});

describe("isEmergencyAdmission — source-attributed, never guessed", () => {
  const alex: YoungPersonLite = { id: "yp_alex", first_name: "Alex", last_name: "Thompson" };
  const match = makeChildNameMatcher(alex);

  it("placed emergency admission referral counts", () => {
    const basis = isEmergencyAdmission("Alex Thompson", match, {
      admissionReferrals: [{ child_name: "Alex Thompson", referral_source: "emergency", status: "placed" }],
      placementReferrals: [],
    });
    expect(basis).toContain("Emergency admission");
  });

  it("a placed NON-emergency referral does not count", () => {
    const basis = isEmergencyAdmission("Alex Thompson", match, {
      admissionReferrals: [{ child_name: "Alex Thompson", referral_source: "local_authority", status: "placed" }],
      placementReferrals: [],
    });
    expect(basis).toBeNull();
  });

  it("commissioning emergency placement counts", () => {
    const basis = isEmergencyAdmission("Alex Thompson", match, {
      admissionReferrals: [],
      placementReferrals: [{ child_name: "Alex Thompson", urgency: "emergency", placement_start_date: "2026-07-01" }],
    });
    expect(basis).toContain("commissioning");
  });
});

describe("buildOriginStory — commissioning model folded in (3rd model)", () => {
  const alex: YoungPersonLite = { id: "yp_alex", first_name: "Alex", last_name: "Thompson", date_of_birth: "2010-03-04" };

  it("commissioning-only match yields a strong origin with its facts", () => {
    const pr: PlacementReferralLite = {
      id: "pr1", child_name: "Alex Thompson", referring_authority: "Bury",
      referral_date: "2025-02-01", presenting_needs: ["emotional regulation"], risk_factors: ["self-harm history"],
    };
    const story = buildOriginStory(alex, [], [], [pr])!;
    expect(story.match_confidence).toBe("strong");
    expect(story.match_basis).toContain("commissioning");
    expect(story.placement_referral?.id).toBe("pr1");
    expect(story.local_authority).toBe("Bury");
    expect(story.risk_factors).toEqual(["self-harm history"]);
  });

  it("needs + risks consolidate across all three models, deduped", () => {
    const story = buildOriginStory(
      alex,
      [{ id: "a", child_name: "Alex Thompson", date_of_birth: "2010-03-04", presenting_needs: ["CSE risk"], risk_factors: ["missing episodes"] }],
      [{ id: "m", child_name: "Alex Thompson", presenting_needs: ["therapeutic support"] }],
      [{ id: "p", child_name: "Alex Thompson", presenting_needs: ["CSE risk"], risk_factors: ["self-harm history"] }],
    )!;
    expect(story.presenting_needs.sort()).toEqual(["CSE risk", "therapeutic support"].sort());
    expect(story.risk_factors.sort()).toEqual(["missing episodes", "self-harm history"].sort());
    expect(story.match_confidence).toBe("exact");
  });
});
