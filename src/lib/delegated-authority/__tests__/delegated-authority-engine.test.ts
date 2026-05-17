// ══════════════════════════════════════════════════════════════════════════════
// Delegated Authority & Consent Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDelegatedAuthorityCompliance,
  calculateHomeDelegatedAuthorityMetrics,
  getDecisionCategoryLabel,
  getAuthorityLevelLabel,
} from "../delegated-authority-engine";
import type {
  ChildDelegatedAuthorityProfile,
  DelegatedAuthorityEntry,
  ConsentRecord,
  EmergencyDecision,
} from "../delegated-authority-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeDelegation(overrides: Partial<DelegatedAuthorityEntry> = {}): DelegatedAuthorityEntry {
  return {
    category: "routine_medical",
    authorityLevel: "home_decides",
    agreedDate: "2026-01-15T10:00:00Z",
    agreedBy: "SW Jane Smith",
    reviewDate: "2026-07-15T10:00:00Z",
    ...overrides,
  };
}

function makeConsent(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: "con-001",
    childId: "child-alex",
    category: "school_trips",
    description: "Year 9 residential trip to Wales",
    requestedDate: "2026-05-01T10:00:00Z",
    requestedBy: "staff-rm-01",
    consentFrom: "Anyshire County Council (SW)",
    consentStatus: "granted",
    responseDate: "2026-05-03T10:00:00Z",
    expiryDate: "2026-06-30T00:00:00Z",
    evidenceHeld: true,
    childInformed: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildDelegatedAuthorityProfile> = {}): ChildDelegatedAuthorityProfile {
  return {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    placingAuthority: "Anyshire County Council",
    socialWorkerName: "Jane Smith",
    delegatedAuthority: [
      makeDelegation({ category: "routine_medical", authorityLevel: "home_decides" }),
      makeDelegation({ category: "dental", authorityLevel: "home_decides" }),
      makeDelegation({ category: "haircut", authorityLevel: "home_decides" }),
      makeDelegation({ category: "leisure_activities", authorityLevel: "home_decides" }),
      makeDelegation({ category: "clothing_choices", authorityLevel: "home_decides" }),
      makeDelegation({ category: "pocket_money_amounts", authorityLevel: "home_decides" }),
      makeDelegation({ category: "emergency_medical", authorityLevel: "home_decides" }),
      makeDelegation({ category: "overnight_stays", authorityLevel: "home_with_notification" }),
      makeDelegation({ category: "school_trips", authorityLevel: "home_with_notification" }),
      makeDelegation({ category: "social_media", authorityLevel: "home_with_notification" }),
      makeDelegation({ category: "mobile_phone", authorityLevel: "home_with_notification" }),
      makeDelegation({ category: "specialist_medical", authorityLevel: "la_consent_required" }),
      makeDelegation({ category: "vaccinations", authorityLevel: "parent_consent_required" }),
      makeDelegation({ category: "travel_international", authorityLevel: "la_consent_required" }),
      makeDelegation({ category: "education_decisions", authorityLevel: "la_consent_required" }),
      makeDelegation({ category: "contact_arrangements", authorityLevel: "la_consent_required" }),
      makeDelegation({ category: "photographs_media", authorityLevel: "parent_consent_required" }),
    ],
    scheduleAgreedDate: "2026-01-15T10:00:00Z",
    scheduleLastReviewDate: "2026-01-15T10:00:00Z",
    scheduleNextReviewDate: "2026-07-15T10:00:00Z",
    consentRecords: [
      makeConsent({ id: "con-001" }),
      makeConsent({ id: "con-002", category: "photographs_media", description: "School newsletter photo", consentStatus: "granted", evidenceHeld: true }),
    ],
    placementPlanSpecifiesDelegation: true,
    childInformedOfRights: true,
    emergencyDecisionsMade: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Delegated Authority Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDelegatedAuthorityCompliance", () => {
  it("marks compliant child with good delegation", () => {
    const result = evaluateDelegatedAuthorityCompliance(makeProfile(), NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.scheduleInPlace).toBe(true);
    expect(result.scheduleCurrentReview).toBe(true);
    expect(result.normalcyScore).toBeGreaterThan(50);
    expect(result.fullyDelegatedCount).toBeGreaterThan(0);
  });

  it("flags missing delegation schedule", () => {
    const profile = makeProfile({ delegatedAuthority: [] });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.scheduleInPlace).toBe(false);
    expect(result.issues.some(i => i.includes("No delegated authority schedule"))).toBe(true);
  });

  it("flags overdue review", () => {
    const profile = makeProfile({ scheduleNextReviewDate: "2026-04-01T10:00:00Z" }); // past NOW
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.reviewOverdue).toBe(true);
    expect(result.issues.some(i => i.includes("review overdue"))).toBe(true);
  });

  it("warns about upcoming review", () => {
    const profile = makeProfile({ scheduleNextReviewDate: "2026-05-25T10:00:00Z" }); // 8 days from NOW
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.reviewOverdue).toBe(false);
    expect(result.warnings.some(w => w.includes("review due in"))).toBe(true);
  });

  it("calculates normalcy score correctly", () => {
    // All home_decides should give 100% normalcy
    const profile = makeProfile({
      delegatedAuthority: [
        makeDelegation({ category: "routine_medical", authorityLevel: "home_decides" }),
        makeDelegation({ category: "haircut", authorityLevel: "home_decides" }),
        makeDelegation({ category: "leisure_activities", authorityLevel: "home_decides" }),
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.normalcyScore).toBe(100);
  });

  it("warns about low normalcy score", () => {
    const profile = makeProfile({
      delegatedAuthority: [
        makeDelegation({ category: "routine_medical", authorityLevel: "la_consent_required" }),
        makeDelegation({ category: "haircut", authorityLevel: "la_consent_required" }),
        makeDelegation({ category: "leisure_activities", authorityLevel: "not_delegated" }),
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.normalcyScore).toBeLessThan(50);
    expect(result.warnings.some(w => w.includes("Low normalcy score"))).toBe(true);
  });

  it("warns about pending consents", () => {
    const profile = makeProfile({
      consentRecords: [
        makeConsent({ id: "c1", consentStatus: "pending" }),
        makeConsent({ id: "c2", consentStatus: "pending" }),
        makeConsent({ id: "c3", consentStatus: "pending" }),
        makeConsent({ id: "c4", consentStatus: "pending" }),
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.pendingConsents).toBe(4);
    expect(result.warnings.some(w => w.includes("consent requests pending"))).toBe(true);
  });

  it("warns about expired consents", () => {
    const profile = makeProfile({
      consentRecords: [
        makeConsent({ id: "c1", consentStatus: "expired" }),
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.expiredConsents).toBe(1);
    expect(result.warnings.some(w => w.includes("expired consent"))).toBe(true);
  });

  it("flags missing consent evidence", () => {
    const profile = makeProfile({
      consentRecords: [
        makeConsent({ id: "c1", evidenceHeld: false }),
        makeConsent({ id: "c2", evidenceHeld: false }),
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.consentEvidenceRate).toBe(0);
    expect(result.issues.some(i => i.includes("consent evidence missing"))).toBe(true);
  });

  it("flags emergency decisions not notified to LA", () => {
    const profile = makeProfile({
      emergencyDecisionsMade: [
        { id: "em-1", date: "2026-05-10T14:00:00Z", category: "emergency_medical", description: "A&E visit for broken arm", madeBy: "staff-rm-01", rationale: "Immediate medical need", laNotified: false, parentNotified: true, parentNotifiedDate: "2026-05-10T15:00:00Z", outcome: "Fracture treated" },
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.emergencyNotificationRate).toBe(0);
    expect(result.issues.some(i => i.includes("emergency decision(s) not notified"))).toBe(true);
  });

  it("flags child not informed of rights", () => {
    const profile = makeProfile({ childInformedOfRights: false });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("Child not informed"))).toBe(true);
  });

  it("flags placement plan not specifying delegation", () => {
    const profile = makeProfile({ placementPlanSpecifiesDelegation: false });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    expect(result.issues.some(i => i.includes("Placement plan"))).toBe(true);
  });

  it("counts delegated vs restricted correctly", () => {
    const result = evaluateDelegatedAuthorityCompliance(makeProfile(), NOW);
    // 7 home_decides + 4 home_with_notification = 11 fully delegated
    expect(result.fullyDelegatedCount).toBe(11);
    // 5 la_consent + 2 parent_consent = 6 restricted (+ 1 vaccinations)
    expect(result.restrictedCount).toBe(6);
  });

  it("warns about low coverage rate", () => {
    const profile = makeProfile({
      delegatedAuthority: [
        makeDelegation({ category: "routine_medical", authorityLevel: "home_decides" }),
      ],
    });
    const result = evaluateDelegatedAuthorityCompliance(profile, NOW);
    // 1 of 22 categories
    expect(result.coverageRate).toBeLessThan(10);
    expect(result.warnings.some(w => w.includes("decision categories covered"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeDelegatedAuthorityMetrics", () => {
  it("calculates metrics for home", () => {
    const profiles = [
      makeProfile({ childId: "child-alex", childName: "Alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = calculateHomeDelegatedAuthorityMetrics(profiles, "home-oak", NOW);
    expect(result.totalChildren).toBe(2);
    expect(result.childrenWithSchedule).toBe(2);
    expect(result.scheduleCompletionRate).toBe(100);
    expect(result.averageNormalcyScore).toBeGreaterThan(50);
  });

  it("identifies most restricted categories", () => {
    const profiles = [
      makeProfile({ childId: "child-alex" }),
      makeProfile({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = calculateHomeDelegatedAuthorityMetrics(profiles, "home-oak", NOW);
    expect(result.mostRestrictedCategories.length).toBeGreaterThan(0);
    // specialist_medical and travel_international appear for both children
    expect(result.mostRestrictedCategories[0].count).toBe(2);
  });

  it("counts overdue reviews", () => {
    const profiles = [
      makeProfile({ childId: "child-alex", scheduleNextReviewDate: "2026-04-01T10:00:00Z" }), // overdue
      makeProfile({ childId: "child-jordan", childName: "Jordan", scheduleNextReviewDate: "2026-08-01T10:00:00Z" }),
    ];
    const result = calculateHomeDelegatedAuthorityMetrics(profiles, "home-oak", NOW);
    expect(result.reviewsOverdue).toBe(1);
  });

  it("handles empty profiles", () => {
    const result = calculateHomeDelegatedAuthorityMetrics([], "home-oak", NOW);
    expect(result.totalChildren).toBe(0);
    expect(result.scheduleCompletionRate).toBe(100);
    expect(result.averageNormalcyScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Label helpers", () => {
  it("getDecisionCategoryLabel returns readable labels", () => {
    expect(getDecisionCategoryLabel("overnight_stays")).toBe("Overnight Stays/Sleepovers");
    expect(getDecisionCategoryLabel("haircut")).toBe("Haircuts/Style Changes");
  });

  it("getAuthorityLevelLabel returns readable labels", () => {
    expect(getAuthorityLevelLabel("home_decides")).toBe("Home Decides");
    expect(getAuthorityLevelLabel("la_consent_required")).toBe("LA Consent Required");
  });
});
