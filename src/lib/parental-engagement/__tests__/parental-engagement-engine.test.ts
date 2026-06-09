// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Parental Engagement Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateContactQuality,
  evaluateParentalSupport,
  evaluateFamilyPlanning,
  evaluateParentalFeedback,
  buildFamilyProfiles,
  generateParentalEngagementIntelligence,
  getRating,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getEngagementLevelLabel,
  getSupportTypeLabel,
  getRelationshipLabel,
  getEffectivenessLabel,
} from "../parental-engagement-engine";
import type {
  ContactRecord,
  ParentalSupportRecord,
  FamilyPlanRecord,
  ParentalFeedbackRecord,
} from "../parental-engagement-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-05-01";
const PERIOD_END = "2026-05-31";
const REFERENCE_DATE = "2026-05-18";

// Children
const ALEX_ID = "child-alex";
const JORDAN_ID = "child-jordan";
const MORGAN_ID = "child-morgan";

// Parents
const MICHELLE_ID = "parent-michelle";
const STEVE_ID = "parent-steve";
const KAREN_ID = "parent-karen";
const DAVE_ID = "parent-dave";

const makeContact = (overrides: Partial<ContactRecord> = {}): ContactRecord => ({
  id: "contact-1",
  homeId: HOME_ID,
  childId: ALEX_ID,
  childName: "Alex",
  parentId: MICHELLE_ID,
  parentName: "Michelle",
  relationship: "mother",
  contactDate: "2026-05-05",
  contactType: "face_to_face",
  duration: 60,
  location: "Chamberlain House lounge",
  outcome: "positive",
  childMoodBefore: 5,
  childMoodAfter: 8,
  parentEngagement: 8,
  staffObservations: "Warm interaction throughout",
  issuesRaised: [],
  positiveInteractions: ["Played board game together"],
  followUpNeeded: false,
  ...overrides,
});

const makeSupport = (overrides: Partial<ParentalSupportRecord> = {}): ParentalSupportRecord => ({
  id: "support-1",
  homeId: HOME_ID,
  parentId: MICHELLE_ID,
  parentName: "Michelle",
  childId: ALEX_ID,
  childName: "Alex",
  supportType: "transport",
  description: "Transport provided for weekly visits",
  startDate: "2026-01-01",
  ongoing: true,
  effectiveness: "effective",
  referralMade: false,
  ...overrides,
});

const makePlan = (overrides: Partial<FamilyPlanRecord> = {}): FamilyPlanRecord => ({
  id: "plan-1",
  homeId: HOME_ID,
  childId: ALEX_ID,
  childName: "Alex",
  planDate: "2026-03-01",
  reviewDate: "2026-05-01",
  nextReviewDate: "2026-08-01",
  goalsSet: 4,
  goalsAchieved: 2,
  goalsPartiallyAchieved: 1,
  familyInvolved: true,
  childInvolved: true,
  professionalInvolved: true,
  barriers: ["Transport difficulties"],
  strengthsIdentified: ["Strong parent-child bond"],
  ...overrides,
});

const makeFeedback = (overrides: Partial<ParentalFeedbackRecord> = {}): ParentalFeedbackRecord => ({
  id: "feedback-1",
  homeId: HOME_ID,
  parentId: MICHELLE_ID,
  parentName: "Michelle",
  childId: ALEX_ID,
  date: "2026-05-10",
  satisfactionScore: 8,
  communicationScore: 7,
  involvementScore: 8,
  comments: "Very happy with the care Alex is receiving",
  areasForImprovement: [],
  positiveAspects: ["Good communication from key worker"],
  ...overrides,
});

// ── Chamberlain House Demo Data ───────────────────────────────────────────────────

const OAK_HOUSE_CONTACTS: ContactRecord[] = [
  // Alex + Michelle (mother, engaged) — 4 contacts
  makeContact({
    id: "c-001", childId: ALEX_ID, childName: "Alex", parentId: MICHELLE_ID, parentName: "Michelle",
    relationship: "mother", contactDate: "2026-05-03", contactType: "face_to_face", duration: 60,
    location: "Chamberlain House lounge", outcome: "positive", childMoodBefore: 5, childMoodAfter: 8,
    parentEngagement: 9, staffObservations: "Michelle and Alex played cards, laughed together",
    positiveInteractions: ["Card game", "Shared snacks"], followUpNeeded: false,
  }),
  makeContact({
    id: "c-002", childId: ALEX_ID, childName: "Alex", parentId: MICHELLE_ID, parentName: "Michelle",
    relationship: "mother", contactDate: "2026-05-10", contactType: "phone", duration: 25,
    location: "Phone (Chamberlain House office)", outcome: "positive", childMoodBefore: 6, childMoodAfter: 7,
    parentEngagement: 8, staffObservations: "Good-natured call discussing school",
    positiveInteractions: ["Discussed school project"], followUpNeeded: false,
  }),
  makeContact({
    id: "c-003", childId: ALEX_ID, childName: "Alex", parentId: MICHELLE_ID, parentName: "Michelle",
    relationship: "mother", contactDate: "2026-05-17", contactType: "supervised", duration: 90,
    supervisedBy: "Lisa Williams (Senior RSW)", location: "Community centre",
    outcome: "positive", childMoodBefore: 6, childMoodAfter: 9, parentEngagement: 9,
    staffObservations: "Excellent supervised session. Michelle brought art supplies.",
    positiveInteractions: ["Art activity", "Walk in park"], followUpNeeded: false,
  }),
  makeContact({
    id: "c-004", childId: ALEX_ID, childName: "Alex", parentId: MICHELLE_ID, parentName: "Michelle",
    relationship: "mother", contactDate: "2026-05-24", contactType: "video_call", duration: 30,
    location: "Video call (Chamberlain House)", outcome: "positive", childMoodBefore: 7, childMoodAfter: 8,
    parentEngagement: 8, staffObservations: "Alex showed Michelle his room tidy-up",
    positiveInteractions: ["Room tour", "Planned next visit"], followUpNeeded: true, followUpCompleted: true,
  }),

  // Jordan + Steve (father, inconsistent) — 3 contacts
  makeContact({
    id: "c-005", childId: JORDAN_ID, childName: "Jordan", parentId: STEVE_ID, parentName: "Steve",
    relationship: "father", contactDate: "2026-05-04", contactType: "face_to_face", duration: 45,
    location: "Chamberlain House garden", outcome: "neutral", childMoodBefore: 5, childMoodAfter: 5,
    parentEngagement: 4, staffObservations: "Steve seemed distracted, checked phone frequently",
    issuesRaised: ["Steve late by 20 mins"], positiveInteractions: ["Kicked football briefly"],
    followUpNeeded: true, followUpCompleted: false,
  }),
  makeContact({
    id: "c-006", childId: JORDAN_ID, childName: "Jordan", parentId: STEVE_ID, parentName: "Steve",
    relationship: "father", contactDate: "2026-05-11", contactType: "phone", duration: 10,
    location: "Phone (Chamberlain House)", outcome: "parent_no_show", childMoodBefore: 6, childMoodAfter: 4,
    parentEngagement: 0, staffObservations: "Steve did not answer. Jordan visibly upset.",
    issuesRaised: ["Parent no-show", "Jordan became withdrawn"], followUpNeeded: true, followUpCompleted: true,
  }),
  makeContact({
    id: "c-007", childId: JORDAN_ID, childName: "Jordan", parentId: STEVE_ID, parentName: "Steve",
    relationship: "father", contactDate: "2026-05-18", contactType: "face_to_face", duration: 60,
    location: "Chamberlain House lounge", outcome: "positive", childMoodBefore: 4, childMoodAfter: 7,
    parentEngagement: 7, staffObservations: "Better session. Steve more present, played PS5 with Jordan.",
    positiveInteractions: ["Gaming together", "Steve apologised for missing call"],
    followUpNeeded: false,
  }),

  // Morgan + Karen (mother, highly engaged) — 4 contacts
  makeContact({
    id: "c-008", childId: MORGAN_ID, childName: "Morgan", parentId: KAREN_ID, parentName: "Karen",
    relationship: "mother", contactDate: "2026-05-02", contactType: "face_to_face", duration: 90,
    location: "Chamberlain House lounge", outcome: "positive", childMoodBefore: 7, childMoodAfter: 9,
    parentEngagement: 10, staffObservations: "Karen brought home-cooked meal. Morgan thrilled.",
    positiveInteractions: ["Shared meal", "Discussed college plans"], followUpNeeded: false,
  }),
  makeContact({
    id: "c-009", childId: MORGAN_ID, childName: "Morgan", parentId: KAREN_ID, parentName: "Karen",
    relationship: "mother", contactDate: "2026-05-09", contactType: "community_outing", duration: 180,
    location: "Local shopping centre", outcome: "positive", childMoodBefore: 8, childMoodAfter: 9,
    parentEngagement: 10, staffObservations: "Positive outing. Karen bought Morgan new clothes for college.",
    positiveInteractions: ["Shopping trip", "Coffee and cake"], followUpNeeded: false,
  }),
  makeContact({
    id: "c-010", childId: MORGAN_ID, childName: "Morgan", parentId: KAREN_ID, parentName: "Karen",
    relationship: "mother", contactDate: "2026-05-16", contactType: "phone", duration: 40,
    location: "Phone (Morgan's room)", outcome: "positive", childMoodBefore: 7, childMoodAfter: 8,
    parentEngagement: 9, staffObservations: "Long phone call. Morgan discussed friendship worries.",
    positiveInteractions: ["Emotional support from Karen"], followUpNeeded: true, followUpCompleted: true,
  }),
  makeContact({
    id: "c-011", childId: MORGAN_ID, childName: "Morgan", parentId: KAREN_ID, parentName: "Karen",
    relationship: "mother", contactDate: "2026-05-23", contactType: "face_to_face", duration: 120,
    location: "Chamberlain House and garden", outcome: "positive", childMoodBefore: 6, childMoodAfter: 9,
    parentEngagement: 10, staffObservations: "Karen helped Morgan with revision. Very engaged.",
    positiveInteractions: ["Revision help", "Garden walk", "Plan for half-term"],
    followUpNeeded: false,
  }),

  // Morgan + Dave (father, disengaged) — 1 contact
  makeContact({
    id: "c-012", childId: MORGAN_ID, childName: "Morgan", parentId: DAVE_ID, parentName: "Dave",
    relationship: "father", contactDate: "2026-05-08", contactType: "phone", duration: 5,
    location: "Phone (Chamberlain House)", outcome: "parent_no_show", childMoodBefore: 5, childMoodAfter: 3,
    parentEngagement: 0, staffObservations: "Dave did not answer scheduled call. Morgan said 'typical'.",
    issuesRaised: ["Father consistently unavailable"], followUpNeeded: true, followUpCompleted: false,
  }),
];

const OAK_HOUSE_SUPPORTS: ParentalSupportRecord[] = [
  makeSupport({
    id: "s-001", parentId: MICHELLE_ID, parentName: "Michelle", childId: ALEX_ID, childName: "Alex",
    supportType: "transport", description: "Weekly taxi provided for face-to-face visits",
    startDate: "2026-01-15", ongoing: true, effectiveness: "effective", referralMade: false,
  }),
  makeSupport({
    id: "s-002", parentId: MICHELLE_ID, parentName: "Michelle", childId: ALEX_ID, childName: "Alex",
    supportType: "parenting_support", description: "Parenting skills course referral",
    startDate: "2026-02-01", endDate: "2026-04-30", ongoing: false, effectiveness: "effective",
    referralMade: true, referralTo: "Local Authority Parenting Team",
  }),
  makeSupport({
    id: "s-003", parentId: STEVE_ID, parentName: "Steve", childId: JORDAN_ID, childName: "Jordan",
    supportType: "mediation", description: "Family mediation sessions offered",
    startDate: "2026-03-01", ongoing: true, effectiveness: "partially_effective",
    referralMade: true, referralTo: "Family Mediation Service",
  }),
  makeSupport({
    id: "s-004", parentId: STEVE_ID, parentName: "Steve", childId: JORDAN_ID, childName: "Jordan",
    supportType: "practical", description: "Flexible contact scheduling to accommodate work",
    startDate: "2026-04-01", ongoing: true, effectiveness: "too_early_to_tell", referralMade: false,
  }),
  makeSupport({
    id: "s-005", parentId: KAREN_ID, parentName: "Karen", childId: MORGAN_ID, childName: "Morgan",
    supportType: "venue", description: "Use of community room for extended visits",
    startDate: "2026-01-10", ongoing: true, effectiveness: "effective", referralMade: false,
  }),
  makeSupport({
    id: "s-006", parentId: DAVE_ID, parentName: "Dave", childId: MORGAN_ID, childName: "Morgan",
    supportType: "therapeutic", description: "Therapeutic re-engagement programme offered",
    startDate: "2026-04-15", ongoing: true, effectiveness: "ineffective",
    referralMade: true, referralTo: "Family Reconnect Service",
  }),
];

const OAK_HOUSE_PLANS: FamilyPlanRecord[] = [
  makePlan({
    id: "fp-001", childId: ALEX_ID, childName: "Alex",
    planDate: "2026-03-01", reviewDate: "2026-05-01", nextReviewDate: "2026-08-01",
    goalsSet: 4, goalsAchieved: 3, goalsPartiallyAchieved: 1,
    familyInvolved: true, childInvolved: true, professionalInvolved: true,
    barriers: ["Transport from Michelle's area"],
    strengthsIdentified: ["Strong mother-child bond", "Michelle attends all sessions"],
  }),
  makePlan({
    id: "fp-002", childId: JORDAN_ID, childName: "Jordan",
    planDate: "2026-02-15", reviewDate: "2026-04-15", nextReviewDate: "2026-07-15",
    goalsSet: 5, goalsAchieved: 1, goalsPartiallyAchieved: 2,
    familyInvolved: true, childInvolved: true, professionalInvolved: true,
    barriers: ["Steve's inconsistent availability", "Jordan's ambivalence about contact"],
    strengthsIdentified: ["Jordan does want a relationship with dad"],
  }),
  makePlan({
    id: "fp-003", childId: MORGAN_ID, childName: "Morgan",
    planDate: "2026-03-15", reviewDate: "2026-05-15", nextReviewDate: "2026-08-15",
    goalsSet: 6, goalsAchieved: 5, goalsPartiallyAchieved: 1,
    familyInvolved: true, childInvolved: true, professionalInvolved: true,
    barriers: ["Dave's non-engagement"],
    strengthsIdentified: ["Karen extremely engaged", "Morgan articulate about needs", "Strong sibling bond with older brother"],
  }),
];

const OAK_HOUSE_FEEDBACK: ParentalFeedbackRecord[] = [
  makeFeedback({
    id: "fb-001", parentId: MICHELLE_ID, parentName: "Michelle", childId: ALEX_ID,
    date: "2026-05-05", satisfactionScore: 9, communicationScore: 8, involvementScore: 9,
    comments: "Staff are brilliant. I always feel welcome.",
    areasForImprovement: [],
    positiveAspects: ["Welcoming environment", "Regular updates from key worker"],
  }),
  makeFeedback({
    id: "fb-002", parentId: STEVE_ID, parentName: "Steve", childId: JORDAN_ID,
    date: "2026-05-06", satisfactionScore: 5, communicationScore: 4, involvementScore: 3,
    comments: "I feel like I'm always being judged. Hard to engage when you feel watched.",
    areasForImprovement: ["Less formal contact environment", "More flexible scheduling"],
    positiveAspects: ["Jordan seems happy and safe"],
  }),
  makeFeedback({
    id: "fb-003", parentId: KAREN_ID, parentName: "Karen", childId: MORGAN_ID,
    date: "2026-05-08", satisfactionScore: 10, communicationScore: 9, involvementScore: 10,
    comments: "Could not be happier. The team treat Morgan like family.",
    areasForImprovement: [],
    positiveAspects: ["Exceptional communication", "Genuinely care about Morgan", "Always included in decisions"],
  }),
  makeFeedback({
    id: "fb-004", parentId: DAVE_ID, parentName: "Dave", childId: MORGAN_ID,
    date: "2026-05-12", satisfactionScore: 3, communicationScore: 3, involvementScore: 2,
    comments: "Don't really know what's going on. Nobody tells me anything.",
    areasForImprovement: ["More communication", "Include me in meetings", "Give me more notice of events"],
    positiveAspects: [],
  }),
];

const CHILD_IDS = [ALEX_ID, JORDAN_ID, MORGAN_ID];

// ── evaluateContactQuality ────────────────────────────────────────────────

describe("evaluateContactQuality", () => {
  it("returns zeroed result for empty contacts", () => {
    const result = evaluateContactQuality([]);
    expect(result.totalContacts).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.averageMoodBefore).toBe(0);
    expect(result.averageMoodAfter).toBe(0);
    expect(result.score).toBe(0);
  });

  it("counts total contacts", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.totalContacts).toBe(12);
  });

  it("breaks down contacts by type", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.contactsByType.face_to_face).toBe(5);
    expect(result.contactsByType.phone).toBe(4);
    expect(result.contactsByType.supervised).toBe(1);
    expect(result.contactsByType.video_call).toBe(1);
    expect(result.contactsByType.community_outing).toBe(1);
  });

  it("calculates outcome distribution", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.outcomeDistribution.positive).toBe(9);
    expect(result.outcomeDistribution.neutral).toBe(1);
    expect(result.outcomeDistribution.parent_no_show).toBe(2);
  });

  it("calculates positive outcome rate", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.positiveOutcomeRate).toBe(75);
  });

  it("calculates average mood before and after", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.averageMoodBefore).toBeGreaterThan(0);
    expect(result.averageMoodAfter).toBeGreaterThan(result.averageMoodBefore);
  });

  it("calculates mood uplift rate", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.moodUpliftRate).toBeGreaterThan(0);
    expect(result.moodUpliftRate).toBeLessThanOrEqual(100);
  });

  it("calculates average parent engagement", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.averageParentEngagement).toBeGreaterThan(0);
    expect(result.averageParentEngagement).toBeLessThanOrEqual(10);
  });

  it("counts follow-ups needed and completed", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.followUpNeededCount).toBe(5);
    expect(result.followUpCompletedCount).toBe(3);
    expect(result.followUpCompletionRate).toBe(60);
  });

  it("counts child refusals", () => {
    const contacts = [
      makeContact({ id: "cr-1", outcome: "child_refused" }),
      makeContact({ id: "cr-2", outcome: "child_refused" }),
      makeContact({ id: "cr-3", outcome: "positive" }),
    ];
    const result = evaluateContactQuality(contacts);
    expect(result.childRefusalCount).toBe(2);
    expect(result.childRefusalRate).toBe(67);
  });

  it("counts parent no-shows", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.parentNoShowCount).toBe(2);
    expect(result.parentNoShowRate).toBe(17);
  });

  it("calculates average duration", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.averageDurationMinutes).toBeGreaterThan(0);
  });

  it("tracks contact frequency per child", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.contactFrequencyPerChild[ALEX_ID]).toBe(4);
    expect(result.contactFrequencyPerChild[JORDAN_ID]).toBe(3);
    expect(result.contactFrequencyPerChild[MORGAN_ID]).toBe(5);
  });

  it("generates a positive score for good contacts", () => {
    const result = evaluateContactQuality(OAK_HOUSE_CONTACTS);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it("gives high score for all-positive contacts", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        id: `perfect-${i}`,
        childId: ALEX_ID,
        outcome: "positive",
        childMoodBefore: 5,
        childMoodAfter: 9,
        parentEngagement: 9,
        followUpNeeded: false,
      }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });

  it("gives low score for all parent no-shows", () => {
    const contacts = Array.from({ length: 4 }, (_, i) =>
      makeContact({
        id: `noshow-${i}`,
        outcome: "parent_no_show",
        childMoodBefore: 5,
        childMoodAfter: 2,
        parentEngagement: 0,
      }),
    );
    const result = evaluateContactQuality(contacts);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it("gives follow-up completion 100% when none needed", () => {
    const contacts = [makeContact({ followUpNeeded: false })];
    const result = evaluateContactQuality(contacts);
    expect(result.followUpCompletionRate).toBe(100);
  });

  it("handles single contact correctly", () => {
    const contacts = [makeContact({ outcome: "positive", childMoodBefore: 3, childMoodAfter: 7 })];
    const result = evaluateContactQuality(contacts);
    expect(result.totalContacts).toBe(1);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.averageMoodBefore).toBe(3);
    expect(result.averageMoodAfter).toBe(7);
  });

  it("counts mood-stable high contacts as uplift", () => {
    const contacts = [
      makeContact({ id: "mh-1", childMoodBefore: 8, childMoodAfter: 8 }),
      makeContact({ id: "mh-2", childMoodBefore: 7, childMoodAfter: 9 }),
    ];
    const result = evaluateContactQuality(contacts);
    expect(result.moodUpliftRate).toBe(100);
  });

  it("handles mixed outcome types", () => {
    const contacts = [
      makeContact({ id: "mx-1", outcome: "positive" }),
      makeContact({ id: "mx-2", outcome: "neutral" }),
      makeContact({ id: "mx-3", outcome: "negative" }),
      makeContact({ id: "mx-4", outcome: "cancelled_by_professional" }),
    ];
    const result = evaluateContactQuality(contacts);
    expect(result.positiveOutcomeRate).toBe(25);
    expect(result.outcomeDistribution.positive).toBe(1);
    expect(result.outcomeDistribution.neutral).toBe(1);
    expect(result.outcomeDistribution.negative).toBe(1);
    expect(result.outcomeDistribution.cancelled_by_professional).toBe(1);
  });
});

// ── evaluateParentalSupport ───────────────────────────────────────────────

describe("evaluateParentalSupport", () => {
  it("returns zeroed result for empty support", () => {
    const result = evaluateParentalSupport([]);
    expect(result.totalSupports).toBe(0);
    expect(result.effectiveRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("counts total supports", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.totalSupports).toBe(6);
  });

  it("breaks down supports by type", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.supportsByType.transport).toBe(1);
    expect(result.supportsByType.parenting_support).toBe(1);
    expect(result.supportsByType.mediation).toBe(1);
    expect(result.supportsByType.practical).toBe(1);
    expect(result.supportsByType.venue).toBe(1);
    expect(result.supportsByType.therapeutic).toBe(1);
  });

  it("counts active and completed supports", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.activeSupports).toBe(5);
    expect(result.completedSupports).toBe(1);
  });

  it("calculates effectiveness breakdown", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.effectivenessBreakdown.effective).toBe(3);
    expect(result.effectivenessBreakdown.partially_effective).toBe(1);
    expect(result.effectivenessBreakdown.ineffective).toBe(1);
    expect(result.effectivenessBreakdown.too_early_to_tell).toBe(1);
  });

  it("calculates effective rate (effective + partially)", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.effectiveRate).toBe(67);
  });

  it("counts referrals", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.referralsMade).toBe(3);
    expect(result.referralRate).toBe(50);
  });

  it("counts unique parents receiving support", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.parentsReceivingSupport).toBe(4);
  });

  it("counts children covered", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.childrenCovered).toBe(3);
  });

  it("generates positive score for good support", () => {
    const result = evaluateParentalSupport(OAK_HOUSE_SUPPORTS);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it("gives max effectiveness score for all effective", () => {
    const supports = [
      makeSupport({ id: "all-eff-1", effectiveness: "effective", ongoing: true }),
      makeSupport({ id: "all-eff-2", effectiveness: "effective", ongoing: false, endDate: "2026-04-01" }),
    ];
    const result = evaluateParentalSupport(supports);
    expect(result.effectiveRate).toBe(100);
  });

  it("gives zero effective rate for all ineffective", () => {
    const supports = [
      makeSupport({ id: "ineff-1", effectiveness: "ineffective" }),
      makeSupport({ id: "ineff-2", effectiveness: "too_early_to_tell" }),
    ];
    const result = evaluateParentalSupport(supports);
    expect(result.effectiveRate).toBe(0);
  });

  it("handles single support record", () => {
    const result = evaluateParentalSupport([makeSupport()]);
    expect(result.totalSupports).toBe(1);
    expect(result.parentsReceivingSupport).toBe(1);
  });

  it("gives higher score when active and completed balance exists", () => {
    const balanced = [
      makeSupport({ id: "bal-1", ongoing: true }),
      makeSupport({ id: "bal-2", ongoing: false, endDate: "2026-04-01" }),
    ];
    const onlyActive = [
      makeSupport({ id: "act-1", ongoing: true }),
      makeSupport({ id: "act-2", ongoing: true }),
    ];
    const rBal = evaluateParentalSupport(balanced);
    const rAct = evaluateParentalSupport(onlyActive);
    expect(rBal.score).toBeGreaterThanOrEqual(rAct.score);
  });
});

// ── evaluateFamilyPlanning ────────────────────────────────────────────────

describe("evaluateFamilyPlanning", () => {
  it("returns zeroed result for empty plans", () => {
    const result = evaluateFamilyPlanning([]);
    expect(result.totalPlans).toBe(0);
    expect(result.goalAchievementRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("counts total plans", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.totalPlans).toBe(3);
  });

  it("tallies goals correctly", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.totalGoalsSet).toBe(15);
    expect(result.totalGoalsAchieved).toBe(9);
    expect(result.totalGoalsPartiallyAchieved).toBe(4);
  });

  it("calculates goal achievement rate including partial", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    // (9 + 4*0.5) / 15 = 11/15 = 73%
    expect(result.goalAchievementRate).toBe(73);
  });

  it("calculates family involvement rate", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.familyInvolvementRate).toBe(100);
  });

  it("calculates child involvement rate", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.childInvolvementRate).toBe(100);
  });

  it("calculates professional involvement rate", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.professionalInvolvementRate).toBe(100);
  });

  it("identifies current vs overdue plans", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.currentPlans).toBe(3);
    expect(result.overduePlans).toBe(0);
  });

  it("detects overdue plans", () => {
    const plans = [
      makePlan({ id: "overdue-1", nextReviewDate: "2026-04-01" }),
      makePlan({ id: "overdue-2", nextReviewDate: "2026-03-15" }),
      makePlan({ id: "current-1", nextReviewDate: "2026-08-01" }),
    ];
    const result = evaluateFamilyPlanning(plans, REFERENCE_DATE);
    expect(result.overduePlans).toBe(2);
    expect(result.currentPlans).toBe(1);
  });

  it("aggregates common barriers", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.commonBarriers.length).toBeGreaterThan(0);
    const barrierTexts = result.commonBarriers.map((b) => b.barrier);
    expect(barrierTexts).toContain("Dave's non-engagement");
  });

  it("aggregates common strengths", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.commonStrengths.length).toBeGreaterThan(0);
  });

  it("generates positive score for good plans", () => {
    const result = evaluateFamilyPlanning(OAK_HOUSE_PLANS, REFERENCE_DATE);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives zero goal achievement when no goals set", () => {
    const plans = [makePlan({ goalsSet: 0, goalsAchieved: 0, goalsPartiallyAchieved: 0 })];
    const result = evaluateFamilyPlanning(plans, REFERENCE_DATE);
    expect(result.goalAchievementRate).toBe(0);
  });

  it("gives 100% goal achievement when all achieved", () => {
    const plans = [
      makePlan({ goalsSet: 5, goalsAchieved: 5, goalsPartiallyAchieved: 0 }),
    ];
    const result = evaluateFamilyPlanning(plans, REFERENCE_DATE);
    expect(result.goalAchievementRate).toBe(100);
  });

  it("handles no family involvement", () => {
    const plans = [
      makePlan({ familyInvolved: false, childInvolved: false, professionalInvolved: false }),
    ];
    const result = evaluateFamilyPlanning(plans, REFERENCE_DATE);
    expect(result.familyInvolvementRate).toBe(0);
    expect(result.childInvolvementRate).toBe(0);
    expect(result.professionalInvolvementRate).toBe(0);
  });

  it("handles single plan", () => {
    const result = evaluateFamilyPlanning([makePlan()], REFERENCE_DATE);
    expect(result.totalPlans).toBe(1);
  });

  it("sorts barriers by frequency descending", () => {
    const plans = [
      makePlan({ id: "b1", barriers: ["Transport", "Distance"] }),
      makePlan({ id: "b2", barriers: ["Transport", "Work"] }),
      makePlan({ id: "b3", barriers: ["Transport"] }),
    ];
    const result = evaluateFamilyPlanning(plans, REFERENCE_DATE);
    expect(result.commonBarriers[0].barrier).toBe("Transport");
    expect(result.commonBarriers[0].count).toBe(3);
  });
});

// ── evaluateParentalFeedback ──────────────────────────────────────────────

describe("evaluateParentalFeedback", () => {
  it("returns zeroed result for empty feedback", () => {
    const result = evaluateParentalFeedback([]);
    expect(result.totalFeedbacks).toBe(0);
    expect(result.averageSatisfaction).toBe(0);
    expect(result.score).toBe(0);
  });

  it("counts total feedbacks", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    expect(result.totalFeedbacks).toBe(4);
  });

  it("calculates average satisfaction", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    // (9+5+10+3)/4 = 6.75
    expect(result.averageSatisfaction).toBe(6.75);
  });

  it("calculates average communication", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    // (8+4+9+3)/4 = 6
    expect(result.averageCommunication).toBe(6);
  });

  it("calculates average involvement", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    // (9+3+10+2)/4 = 6
    expect(result.averageInvolvement).toBe(6);
  });

  it("calculates overall average feedback", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    // (6.75 + 6 + 6) / 3 = 6.25
    expect(result.overallAverageFeedback).toBe(6.25);
  });

  it("aggregates common improvements", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    expect(result.commonImprovements.length).toBeGreaterThan(0);
  });

  it("aggregates common positives", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    expect(result.commonPositives.length).toBeGreaterThan(0);
  });

  it("generates positive score for good feedback", () => {
    const result = evaluateParentalFeedback(OAK_HOUSE_FEEDBACK);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives max score for perfect feedback", () => {
    const feedback = [
      makeFeedback({ satisfactionScore: 10, communicationScore: 10, involvementScore: 10 }),
    ];
    const result = evaluateParentalFeedback(feedback);
    expect(result.score).toBe(25);
  });

  it("gives low score for terrible feedback", () => {
    const feedback = [
      makeFeedback({ satisfactionScore: 1, communicationScore: 1, involvementScore: 1 }),
    ];
    const result = evaluateParentalFeedback(feedback);
    expect(result.score).toBeLessThan(5);
  });

  it("handles single feedback record", () => {
    const result = evaluateParentalFeedback([makeFeedback()]);
    expect(result.totalFeedbacks).toBe(1);
    expect(result.averageSatisfaction).toBe(8);
  });

  it("sorts improvements by frequency", () => {
    const feedback = [
      makeFeedback({ id: "fi-1", areasForImprovement: ["Communication", "Timing"] }),
      makeFeedback({ id: "fi-2", areasForImprovement: ["Communication"] }),
      makeFeedback({ id: "fi-3", areasForImprovement: ["Timing", "Environment"] }),
    ];
    const result = evaluateParentalFeedback(feedback);
    expect(result.commonImprovements[0].area).toBe("Communication");
    expect(result.commonImprovements[0].count).toBe(2);
  });

  it("sorts positives by frequency", () => {
    const feedback = [
      makeFeedback({ id: "fp-1", positiveAspects: ["Welcoming", "Staff"] }),
      makeFeedback({ id: "fp-2", positiveAspects: ["Welcoming", "Communication"] }),
    ];
    const result = evaluateParentalFeedback(feedback);
    expect(result.commonPositives[0].aspect).toBe("Welcoming");
    expect(result.commonPositives[0].count).toBe(2);
  });
});

// ── buildFamilyProfiles ───────────────────────────────────────────────────

describe("buildFamilyProfiles", () => {
  it("builds profiles for all children", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    expect(profiles.length).toBe(3);
  });

  it("includes child name on each profile", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const names = profiles.map((p) => p.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });

  it("builds parent sub-profiles with engagement levels", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    expect(alex.parents.length).toBeGreaterThanOrEqual(1);
    const michelle = alex.parents.find((p) => p.parentId === MICHELLE_ID)!;
    expect(michelle.engagementLevel).toBe("highly_engaged");
  });

  it("assesses Steve as inconsistent", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const jordan = profiles.find((p) => p.childId === JORDAN_ID)!;
    const steve = jordan.parents.find((p) => p.parentId === STEVE_ID)!;
    expect(steve.engagementLevel).toBe("inconsistent");
  });

  it("assesses Karen as highly engaged", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const morgan = profiles.find((p) => p.childId === MORGAN_ID)!;
    const karen = morgan.parents.find((p) => p.parentId === KAREN_ID)!;
    expect(karen.engagementLevel).toBe("highly_engaged");
  });

  it("assesses Dave as disengaged", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const morgan = profiles.find((p) => p.childId === MORGAN_ID)!;
    const dave = morgan.parents.find((p) => p.parentId === DAVE_ID)!;
    expect(["disengaged", "no_contact"]).toContain(dave.engagementLevel);
  });

  it("calculates total contacts per child", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    expect(alex.totalContacts).toBe(4);
    const morgan = profiles.find((p) => p.childId === MORGAN_ID)!;
    expect(morgan.totalContacts).toBe(5);
  });

  it("calculates positive contact rate per child", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    expect(alex.positiveContactRate).toBe(100);
  });

  it("calculates mood uplift average", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    expect(alex.averageMoodUplift).toBeGreaterThan(0);
  });

  it("detects active family plan", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    for (const p of profiles) {
      expect(p.activeFamilyPlan).toBe(true);
    }
  });

  it("calculates goal achievement rate per child", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const morgan = profiles.find((p) => p.childId === MORGAN_ID)!;
    // 5 achieved + 0.5*1 partial = 5.5 out of 6 = 92%
    expect(morgan.goalAchievementRate).toBe(92);
  });

  it("tracks parent contact counts", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const jordan = profiles.find((p) => p.childId === JORDAN_ID)!;
    const steve = jordan.parents.find((p) => p.parentId === STEVE_ID)!;
    expect(steve.contactCount).toBe(3);
  });

  it("tracks supports provided per parent", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    const michelle = alex.parents.find((p) => p.parentId === MICHELLE_ID)!;
    expect(michelle.supportsProvided).toBe(2);
  });

  it("tracks feedback given per parent", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    const michelle = alex.parents.find((p) => p.parentId === MICHELLE_ID)!;
    expect(michelle.feedbackGiven).toBe(1);
  });

  it("handles child with no contacts", () => {
    const profiles = buildFamilyProfiles([], OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, [ALEX_ID]);
    const alex = profiles.find((p) => p.childId === ALEX_ID)!;
    expect(alex.totalContacts).toBe(0);
    expect(alex.positiveContactRate).toBe(0);
  });

  it("handles empty data for all inputs", () => {
    const profiles = buildFamilyProfiles([], [], [], [], [ALEX_ID]);
    expect(profiles.length).toBe(1);
    expect(profiles[0].parents.length).toBe(0);
    expect(profiles[0].activeFamilyPlan).toBe(false);
  });

  it("uses childId as name when no other source available", () => {
    const profiles = buildFamilyProfiles([], [], [], [], ["unknown-child"]);
    expect(profiles[0].childName).toBe("unknown-child");
  });

  it("calculates parent positive contact rate", () => {
    const profiles = buildFamilyProfiles(OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK, CHILD_IDS);
    const morgan = profiles.find((p) => p.childId === MORGAN_ID)!;
    const karen = morgan.parents.find((p) => p.parentId === KAREN_ID)!;
    expect(karen.positiveContactRate).toBe(100);
  });
});

// ── generateParentalEngagementIntelligence ────────────────────────────────

describe("generateParentalEngagementIntelligence", () => {
  const run = () =>
    generateParentalEngagementIntelligence(
      OAK_HOUSE_CONTACTS, OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK,
      CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );

  it("returns correct homeId", () => {
    expect(run().homeId).toBe(HOME_ID);
  });

  it("returns correct period", () => {
    const result = run();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns assessedAt date", () => {
    expect(run().assessedAt).toBe(REFERENCE_DATE);
  });

  it("calculates overall score between 0 and 100", () => {
    const result = run();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a rating based on score", () => {
    const result = run();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes contact quality sub-result", () => {
    expect(run().contactQuality.totalContacts).toBe(12);
  });

  it("includes parental support sub-result", () => {
    expect(run().parentalSupport.totalSupports).toBe(6);
  });

  it("includes family planning sub-result", () => {
    expect(run().familyPlanning.totalPlans).toBe(3);
  });

  it("includes parental feedback sub-result", () => {
    expect(run().parentalFeedback.totalFeedbacks).toBe(4);
  });

  it("includes family profiles for all children", () => {
    expect(run().familyProfiles.length).toBe(3);
  });

  it("generates strengths array", () => {
    const result = run();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areasForImprovement array", () => {
    const result = run();
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const result = run();
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatoryLinks array", () => {
    const result = run();
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("includes Reg 7 in regulatory links", () => {
    const result = run();
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
  });

  it("includes Reg 22 in regulatory links", () => {
    const result = run();
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 22"))).toBe(true);
  });

  it("includes SCCIF reference in regulatory links", () => {
    const result = run();
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("filters contacts to the specified period", () => {
    // Add out-of-period contact
    const outOfPeriod = makeContact({
      id: "oop-1",
      contactDate: "2026-04-01",
    });
    const result = generateParentalEngagementIntelligence(
      [...OAK_HOUSE_CONTACTS, outOfPeriod], OAK_HOUSE_SUPPORTS, OAK_HOUSE_PLANS, OAK_HOUSE_FEEDBACK,
      CHILD_IDS, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.contactQuality.totalContacts).toBe(12);
  });

  it("overall score is sum of four domain scores", () => {
    const result = run();
    const expectedSum = result.contactQuality.score + result.parentalSupport.score +
      result.familyPlanning.score + result.parentalFeedback.score;
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("handles all empty data without crashing", () => {
    const result = generateParentalEngagementIntelligence(
      [], [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.familyProfiles.length).toBe(0);
  });

  it("mentions parent no-shows in actions when present", () => {
    const result = run();
    const hasNoShowAction = result.actions.some((a) => a.includes("no-show"));
    expect(hasNoShowAction).toBe(true);
  });

  it("includes Working Together 2023 in regulatory links when plans exist", () => {
    const result = run();
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });
});

// ── getRating ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(75)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(55)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });

  it("handles boundary at 80 exactly", () => {
    expect(getRating(80)).toBe("outstanding");
  });

  it("handles boundary at 60 exactly", () => {
    expect(getRating(60)).toBe("good");
  });

  it("handles boundary at 40 exactly", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });
});

// ── Label Functions ───────────────────────────────────────────────────────

describe("getContactTypeLabel", () => {
  it("returns Face-to-Face for face_to_face", () => {
    expect(getContactTypeLabel("face_to_face")).toBe("Face-to-Face");
  });

  it("returns Phone Call for phone", () => {
    expect(getContactTypeLabel("phone")).toBe("Phone Call");
  });

  it("returns Video Call for video_call", () => {
    expect(getContactTypeLabel("video_call")).toBe("Video Call");
  });

  it("returns Letter for letter", () => {
    expect(getContactTypeLabel("letter")).toBe("Letter");
  });

  it("returns Email for email", () => {
    expect(getContactTypeLabel("email")).toBe("Email");
  });

  it("returns Supervised Contact for supervised", () => {
    expect(getContactTypeLabel("supervised")).toBe("Supervised Contact");
  });

  it("returns Community Outing for community_outing", () => {
    expect(getContactTypeLabel("community_outing")).toBe("Community Outing");
  });
});

describe("getContactOutcomeLabel", () => {
  it("returns Positive for positive", () => {
    expect(getContactOutcomeLabel("positive")).toBe("Positive");
  });

  it("returns Neutral for neutral", () => {
    expect(getContactOutcomeLabel("neutral")).toBe("Neutral");
  });

  it("returns Negative for negative", () => {
    expect(getContactOutcomeLabel("negative")).toBe("Negative");
  });

  it("returns Child Refused for child_refused", () => {
    expect(getContactOutcomeLabel("child_refused")).toBe("Child Refused");
  });

  it("returns Parent No-Show for parent_no_show", () => {
    expect(getContactOutcomeLabel("parent_no_show")).toBe("Parent No-Show");
  });

  it("returns Cancelled (Professional) for cancelled_by_professional", () => {
    expect(getContactOutcomeLabel("cancelled_by_professional")).toBe("Cancelled (Professional)");
  });
});

describe("getEngagementLevelLabel", () => {
  it("returns Highly Engaged for highly_engaged", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
  });

  it("returns Engaged for engaged", () => {
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
  });

  it("returns Inconsistent for inconsistent", () => {
    expect(getEngagementLevelLabel("inconsistent")).toBe("Inconsistent");
  });

  it("returns Disengaged for disengaged", () => {
    expect(getEngagementLevelLabel("disengaged")).toBe("Disengaged");
  });

  it("returns Hostile for hostile", () => {
    expect(getEngagementLevelLabel("hostile")).toBe("Hostile");
  });

  it("returns No Contact for no_contact", () => {
    expect(getEngagementLevelLabel("no_contact")).toBe("No Contact");
  });
});

describe("getSupportTypeLabel", () => {
  it("returns Transport for transport", () => {
    expect(getSupportTypeLabel("transport")).toBe("Transport");
  });

  it("returns Venue Provision for venue", () => {
    expect(getSupportTypeLabel("venue")).toBe("Venue Provision");
  });

  it("returns Mediation for mediation", () => {
    expect(getSupportTypeLabel("mediation")).toBe("Mediation");
  });

  it("returns Parenting Support for parenting_support", () => {
    expect(getSupportTypeLabel("parenting_support")).toBe("Parenting Support");
  });

  it("returns Therapeutic Support for therapeutic", () => {
    expect(getSupportTypeLabel("therapeutic")).toBe("Therapeutic Support");
  });

  it("returns Financial Assistance for financial", () => {
    expect(getSupportTypeLabel("financial")).toBe("Financial Assistance");
  });

  it("returns Practical Support for practical", () => {
    expect(getSupportTypeLabel("practical")).toBe("Practical Support");
  });
});

describe("getRelationshipLabel", () => {
  it("returns Mother for mother", () => {
    expect(getRelationshipLabel("mother")).toBe("Mother");
  });

  it("returns Father for father", () => {
    expect(getRelationshipLabel("father")).toBe("Father");
  });

  it("returns Step-Parent for step_parent", () => {
    expect(getRelationshipLabel("step_parent")).toBe("Step-Parent");
  });

  it("returns Grandparent for grandparent", () => {
    expect(getRelationshipLabel("grandparent")).toBe("Grandparent");
  });

  it("returns Sibling for sibling", () => {
    expect(getRelationshipLabel("sibling")).toBe("Sibling");
  });

  it("returns Other for other", () => {
    expect(getRelationshipLabel("other")).toBe("Other");
  });
});

describe("getEffectivenessLabel", () => {
  it("returns Effective for effective", () => {
    expect(getEffectivenessLabel("effective")).toBe("Effective");
  });

  it("returns Partially Effective for partially_effective", () => {
    expect(getEffectivenessLabel("partially_effective")).toBe("Partially Effective");
  });

  it("returns Ineffective for ineffective", () => {
    expect(getEffectivenessLabel("ineffective")).toBe("Ineffective");
  });

  it("returns Too Early to Tell for too_early_to_tell", () => {
    expect(getEffectivenessLabel("too_early_to_tell")).toBe("Too Early to Tell");
  });
});
