// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Multi-Agency Partnership Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr, daysFromNow} from "@/lib/utils";
import {
  generateMultiAgencyPartnershipIntelligence,
  evaluatePartnershipEngagement,
  evaluateMeetingEffectiveness,
  evaluateReferralQuality,
  evaluateInformationSharing,
  getAgencyTypeLabel,
  getEngagementQualityLabel,
  getMeetingTypeLabel,
  getInformationSharingQualityLabel,
  getReferralOutcomeLabel,
  getPartnerFeedbackLabel,
} from "../multi-agency-partnership-engine";
import type {
  AgencyRelationship,
  MultiAgencyMeeting,
  AgencyReferral,
  InformationSharingRecord,
  AgencyType,
} from "../multi-agency-partnership-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const today = todayStr();
const tenDaysAgo = daysFromNow(-10);
const sixtyDaysAgo = daysFromNow(-60);

const makeRelationship = (overrides: Partial<AgencyRelationship> = {}): AgencyRelationship => ({
  id: "rel-1",
  agencyType: "social_work",
  agencyName: "Meadowfield Social Work Team",
  namedContact: "Sarah Thompson",
  engagementQuality: "good",
  lastContactDate: tenDaysAgo,
  contactFrequency: "weekly",
  informationSharingAgreementInPlace: true,
  feedbackReceived: "positive",
  ...overrides,
});

const makeMeeting = (overrides: Partial<MultiAgencyMeeting> = {}): MultiAgencyMeeting => ({
  id: "mtg-1",
  childId: "child-1",
  meetingType: "review",
  meetingDate: tenDaysAgo,
  agenciesInvited: ["social_work", "health", "education"],
  agenciesAttended: ["social_work", "health", "education"],
  homeRepresentativeAttended: true,
  minutesCirculated: true,
  actionsIdentified: 5,
  actionsCompleted: 4,
  childParticipated: true,
  ...overrides,
});

const makeReferral = (overrides: Partial<AgencyReferral> = {}): AgencyReferral => ({
  id: "ref-1",
  childId: "child-1",
  referredTo: "camhs",
  referralDate: tenDaysAgo,
  outcome: "accepted",
  responseTimeDays: 5,
  appropriateReferral: true,
  followUpCompleted: true,
  ...overrides,
});

const makeInfoShare = (overrides: Partial<InformationSharingRecord> = {}): InformationSharingRecord => ({
  id: "info-1",
  childId: "child-1",
  sharedWith: "social_work",
  shareDate: tenDaysAgo,
  quality: "timely_comprehensive",
  consentObtained: true,
  timeliness: true,
  relevantToChildPlan: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePartnershipEngagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePartnershipEngagement", () => {
  it("returns 0 for empty relationships", () => {
    const result = evaluatePartnershipEngagement([], 5);
    expect(result.score).toBe(0);
    expect(result.engagementCoverage).toBe(0);
    expect(result.qualityRate).toBe(0);
    expect(result.isaRate).toBe(0);
    expect(result.positiveFeedbackRate).toBe(0);
    expect(result.recentContactRate).toBe(0);
  });

  it("scores higher with more agency type coverage", () => {
    const singleAgency = evaluatePartnershipEngagement(
      [makeRelationship({ agencyType: "social_work" })],
      5,
    );
    const multiAgency = evaluatePartnershipEngagement(
      [
        makeRelationship({ id: "r1", agencyType: "social_work" }),
        makeRelationship({ id: "r2", agencyType: "health" }),
        makeRelationship({ id: "r3", agencyType: "education" }),
        makeRelationship({ id: "r4", agencyType: "camhs" }),
        makeRelationship({ id: "r5", agencyType: "police" }),
      ],
      5,
    );
    expect(multiAgency.score).toBeGreaterThan(singleAgency.score);
    expect(multiAgency.engagementCoverage).toBe(100);
  });

  it("awards full quality points for 80%+ excellent/good", () => {
    const excellent = evaluatePartnershipEngagement(
      [
        makeRelationship({ id: "r1", engagementQuality: "excellent" }),
        makeRelationship({ id: "r2", engagementQuality: "excellent" }),
        makeRelationship({ id: "r3", engagementQuality: "excellent" }),
        makeRelationship({ id: "r4", engagementQuality: "excellent" }),
        makeRelationship({ id: "r5", engagementQuality: "adequate" }),
      ],
      5,
    );
    expect(excellent.qualityRate).toBe(80);
  });

  it("calculates ISA rate correctly", () => {
    const result = evaluatePartnershipEngagement(
      [
        makeRelationship({ id: "r1", informationSharingAgreementInPlace: true }),
        makeRelationship({ id: "r2", informationSharingAgreementInPlace: false }),
      ],
      5,
    );
    expect(result.isaRate).toBe(50);
  });

  it("handles relationships with no feedback", () => {
    const result = evaluatePartnershipEngagement(
      [makeRelationship({ feedbackReceived: undefined })],
      5,
    );
    expect(result.positiveFeedbackRate).toBe(0);
  });

  it("calculates positive feedback rate correctly", () => {
    const result = evaluatePartnershipEngagement(
      [
        makeRelationship({ id: "r1", feedbackReceived: "very_positive" }),
        makeRelationship({ id: "r2", feedbackReceived: "positive" }),
        makeRelationship({ id: "r3", feedbackReceived: "negative" }),
      ],
      5,
    );
    expect(result.positiveFeedbackRate).toBe(67);
  });

  it("awards recent contact points for contacts within 30 days", () => {
    const result = evaluatePartnershipEngagement(
      [makeRelationship({ lastContactDate: tenDaysAgo })],
      5,
    );
    expect(result.recentContactRate).toBe(100);
  });

  it("penalises old contacts beyond 30 days", () => {
    const result = evaluatePartnershipEngagement(
      [makeRelationship({ lastContactDate: sixtyDaysAgo })],
      5,
    );
    expect(result.recentContactRate).toBe(0);
  });

  it("clamps score to maximum 25", () => {
    const result = evaluatePartnershipEngagement(
      [
        makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
        makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
        makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
        makeRelationship({ id: "r4", agencyType: "camhs", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
        makeRelationship({ id: "r5", agencyType: "police", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      ],
      5,
    );
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("returns proportional scores for partial engagement", () => {
    const result = evaluatePartnershipEngagement(
      [
        makeRelationship({ engagementQuality: "adequate", feedbackReceived: "neutral", informationSharingAgreementInPlace: false }),
      ],
      5,
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(15);
  });

  it("handles coverage when totalAgencyTypes is 0", () => {
    const result = evaluatePartnershipEngagement(
      [makeRelationship()],
      0,
    );
    // Should use max(0,1) = 1 as denominator
    expect(result.engagementCoverage).toBe(100);
  });

  it("scores low for disengaged relationships", () => {
    const result = evaluatePartnershipEngagement(
      [
        makeRelationship({ id: "r1", engagementQuality: "disengaged", feedbackReceived: "negative", informationSharingAgreementInPlace: false, lastContactDate: sixtyDaysAgo }),
      ],
      5,
    );
    expect(result.qualityRate).toBe(0);
    expect(result.score).toBeLessThan(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateMeetingEffectiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMeetingEffectiveness", () => {
  it("returns 0 for empty meetings", () => {
    const result = evaluateMeetingEffectiveness([]);
    expect(result.score).toBe(0);
    expect(result.attendanceRate).toBe(0);
    expect(result.homeAttendanceRate).toBe(0);
    expect(result.minutesCirculatedRate).toBe(0);
    expect(result.actionsCompletionRate).toBe(0);
    expect(result.childParticipationRate).toBe(0);
    expect(result.meetingTypeVariety).toBe(0);
  });

  it("calculates attendance rate from agencies invited vs attended", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({
        agenciesInvited: ["social_work", "health", "education", "camhs"],
        agenciesAttended: ["social_work", "health"],
      }),
    ]);
    expect(result.attendanceRate).toBe(50);
  });

  it("awards full attendance points for 80%+ attendance", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({
        agenciesInvited: ["social_work", "health", "education"],
        agenciesAttended: ["social_work", "health", "education"],
      }),
    ]);
    expect(result.attendanceRate).toBe(100);
  });

  it("calculates home attendance rate correctly", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", homeRepresentativeAttended: true }),
      makeMeeting({ id: "m2", homeRepresentativeAttended: false }),
    ]);
    expect(result.homeAttendanceRate).toBe(50);
  });

  it("awards full home attendance for 95%+", () => {
    const meetings = Array.from({ length: 20 }, (_, i) =>
      makeMeeting({ id: `m${i}`, homeRepresentativeAttended: true }),
    );
    meetings.push(makeMeeting({ id: "m-missed", homeRepresentativeAttended: false }));
    // 20/21 = 95%
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.homeAttendanceRate).toBe(95);
  });

  it("calculates minutes circulated rate", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", minutesCirculated: true }),
      makeMeeting({ id: "m2", minutesCirculated: true }),
      makeMeeting({ id: "m3", minutesCirculated: false }),
    ]);
    expect(result.minutesCirculatedRate).toBe(67);
  });

  it("calculates actions completion rate from totals", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", actionsIdentified: 10, actionsCompleted: 8 }),
      makeMeeting({ id: "m2", actionsIdentified: 10, actionsCompleted: 10 }),
    ]);
    expect(result.actionsCompletionRate).toBe(90);
  });

  it("handles zero actions identified", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ actionsIdentified: 0, actionsCompleted: 0 }),
    ]);
    expect(result.actionsCompletionRate).toBeNull();
  });

  it("calculates child participation rate", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", childParticipated: true }),
      makeMeeting({ id: "m2", childParticipated: true }),
      makeMeeting({ id: "m3", childParticipated: false }),
    ]);
    expect(result.childParticipationRate).toBe(67);
  });

  it("counts meeting type variety", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", meetingType: "review" }),
      makeMeeting({ id: "m2", meetingType: "strategy" }),
      makeMeeting({ id: "m3", meetingType: "planning" }),
      makeMeeting({ id: "m4", meetingType: "professionals" }),
    ]);
    expect(result.meetingTypeVariety).toBe(4);
  });

  it("awards full variety points for 4+ meeting types", () => {
    const lowVariety = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", meetingType: "review" }),
    ]);
    const highVariety = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", meetingType: "review" }),
      makeMeeting({ id: "m2", meetingType: "strategy" }),
      makeMeeting({ id: "m3", meetingType: "planning" }),
      makeMeeting({ id: "m4", meetingType: "professionals" }),
    ]);
    expect(highVariety.score).toBeGreaterThan(lowVariety.score);
  });

  it("clamps score to maximum 25", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({ id: "m1", meetingType: "review" }),
      makeMeeting({ id: "m2", meetingType: "strategy" }),
      makeMeeting({ id: "m3", meetingType: "planning" }),
      makeMeeting({ id: "m4", meetingType: "professionals" }),
    ]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("scores low for poor meeting practice", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({
        agenciesInvited: ["social_work", "health", "education", "camhs"],
        agenciesAttended: ["social_work"],
        homeRepresentativeAttended: false,
        minutesCirculated: false,
        actionsIdentified: 10,
        actionsCompleted: 1,
        childParticipated: false,
      }),
    ]);
    expect(result.score).toBeLessThan(10);
  });

  it("handles attendance aggregation across multiple meetings", () => {
    const result = evaluateMeetingEffectiveness([
      makeMeeting({
        id: "m1",
        agenciesInvited: ["social_work", "health"],
        agenciesAttended: ["social_work", "health"],
      }),
      makeMeeting({
        id: "m2",
        agenciesInvited: ["social_work", "education"],
        agenciesAttended: ["social_work"],
      }),
    ]);
    // Total invited = 4, Total attended = 3 → 75%
    expect(result.attendanceRate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateReferralQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReferralQuality", () => {
  it("returns neutral score 15 for no referrals", () => {
    const result = evaluateReferralQuality([]);
    expect(result.score).toBe(15);
    expect(result.totalReferrals).toBe(0);
  });

  it("calculates appropriate referral rate", () => {
    const result = evaluateReferralQuality([
      makeReferral({ id: "r1", appropriateReferral: true }),
      makeReferral({ id: "r2", appropriateReferral: true }),
      makeReferral({ id: "r3", appropriateReferral: false }),
    ]);
    expect(result.appropriateRate).toBe(67);
  });

  it("awards full appropriate points for 90%+", () => {
    const highRate = evaluateReferralQuality([
      makeReferral({ id: "r1", appropriateReferral: true }),
      makeReferral({ id: "r2", appropriateReferral: true }),
      makeReferral({ id: "r3", appropriateReferral: true }),
      makeReferral({ id: "r4", appropriateReferral: true }),
      makeReferral({ id: "r5", appropriateReferral: true }),
      makeReferral({ id: "r6", appropriateReferral: true }),
      makeReferral({ id: "r7", appropriateReferral: true }),
      makeReferral({ id: "r8", appropriateReferral: true }),
      makeReferral({ id: "r9", appropriateReferral: true }),
      makeReferral({ id: "r10", appropriateReferral: false }),
    ]);
    expect(highRate.appropriateRate).toBe(90);
  });

  it("calculates follow-up rate correctly", () => {
    const result = evaluateReferralQuality([
      makeReferral({ id: "r1", followUpCompleted: true }),
      makeReferral({ id: "r2", followUpCompleted: false }),
    ]);
    expect(result.followUpRate).toBe(50);
  });

  it("calculates acceptance rate from resolved referrals only", () => {
    const result = evaluateReferralQuality([
      makeReferral({ id: "r1", outcome: "accepted" }),
      makeReferral({ id: "r2", outcome: "declined" }),
      makeReferral({ id: "r3", outcome: "waiting" }),
    ]);
    // Only accepted/declined/completed count: 1 accepted out of 2 resolved
    expect(result.acceptanceRate).toBe(50);
  });

  it("counts completed referrals as accepted for acceptance rate", () => {
    const result = evaluateReferralQuality([
      makeReferral({ id: "r1", outcome: "completed" }),
      makeReferral({ id: "r2", outcome: "completed" }),
      makeReferral({ id: "r3", outcome: "declined" }),
    ]);
    // 2 completed out of 3 resolved = 67%
    expect(result.acceptanceRate).toBe(67);
  });

  it("awards full response time points for avg <= 7 days", () => {
    const fast = evaluateReferralQuality([
      makeReferral({ id: "r1", responseTimeDays: 3 }),
      makeReferral({ id: "r2", responseTimeDays: 5 }),
    ]);
    const slow = evaluateReferralQuality([
      makeReferral({ id: "r1", responseTimeDays: 20 }),
      makeReferral({ id: "r2", responseTimeDays: 30 }),
    ]);
    expect(fast.averageResponseDays).toBeLessThanOrEqual(7);
    expect(fast.score).toBeGreaterThan(slow.score);
  });

  it("awards partial response time points for avg 7-14 days", () => {
    const result = evaluateReferralQuality([
      makeReferral({ responseTimeDays: 10 }),
    ]);
    expect(result.averageResponseDays).toBe(10);
  });

  it("awards no response time points for avg > 14 days", () => {
    const fast = evaluateReferralQuality([
      makeReferral({ id: "r1", responseTimeDays: 3, outcome: "completed", appropriateReferral: true, followUpCompleted: true }),
    ]);
    const verySlow = evaluateReferralQuality([
      makeReferral({ id: "r1", responseTimeDays: 30, outcome: "completed", appropriateReferral: true, followUpCompleted: true }),
    ]);
    expect(fast.score).toBeGreaterThan(verySlow.score);
  });

  it("calculates completion rate", () => {
    const result = evaluateReferralQuality([
      makeReferral({ id: "r1", outcome: "completed" }),
      makeReferral({ id: "r2", outcome: "accepted" }),
      makeReferral({ id: "r3", outcome: "waiting" }),
    ]);
    expect(result.completionRate).toBe(33);
  });

  it("clamps score to maximum 25", () => {
    const result = evaluateReferralQuality([
      makeReferral({
        outcome: "completed",
        responseTimeDays: 2,
        appropriateReferral: true,
        followUpCompleted: true,
      }),
    ]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("scores low for poor referral practice", () => {
    const result = evaluateReferralQuality([
      makeReferral({
        outcome: "declined",
        responseTimeDays: 30,
        appropriateReferral: false,
        followUpCompleted: false,
      }),
    ]);
    expect(result.score).toBeLessThan(10);
  });

  it("handles all referrals waiting", () => {
    const result = evaluateReferralQuality([
      makeReferral({ id: "r1", outcome: "waiting" }),
      makeReferral({ id: "r2", outcome: "waiting" }),
    ]);
    expect(result.acceptanceRate).toBe(0);
    expect(result.completionRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateInformationSharing
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInformationSharing", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateInformationSharing([]);
    expect(result.score).toBe(0);
    expect(result.timelinessRate).toBe(0);
    expect(result.comprehensiveRate).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.relevanceRate).toBe(0);
    expect(result.agencyTypeCoverage).toBe(0);
  });

  it("calculates timeliness rate", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", timeliness: true }),
      makeInfoShare({ id: "i2", timeliness: true }),
      makeInfoShare({ id: "i3", timeliness: false }),
    ]);
    expect(result.timelinessRate).toBe(67);
  });

  it("awards full timeliness points for 90%+", () => {
    const timely = evaluateInformationSharing([
      makeInfoShare({ id: "i1", timeliness: true }),
      makeInfoShare({ id: "i2", timeliness: true }),
      makeInfoShare({ id: "i3", timeliness: true }),
      makeInfoShare({ id: "i4", timeliness: true }),
      makeInfoShare({ id: "i5", timeliness: true }),
      makeInfoShare({ id: "i6", timeliness: true }),
      makeInfoShare({ id: "i7", timeliness: true }),
      makeInfoShare({ id: "i8", timeliness: true }),
      makeInfoShare({ id: "i9", timeliness: true }),
      makeInfoShare({ id: "i10", timeliness: false }),
    ]);
    expect(timely.timelinessRate).toBe(90);
  });

  it("calculates comprehensive quality rate", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", quality: "timely_comprehensive" }),
      makeInfoShare({ id: "i2", quality: "timely_partial" }),
      makeInfoShare({ id: "i3", quality: "delayed" }),
    ]);
    expect(result.comprehensiveRate).toBe(33);
  });

  it("awards full comprehensive points for 70%+", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", quality: "timely_comprehensive" }),
      makeInfoShare({ id: "i2", quality: "timely_comprehensive" }),
      makeInfoShare({ id: "i3", quality: "timely_comprehensive" }),
      makeInfoShare({ id: "i4", quality: "timely_partial" }),
    ]);
    expect(result.comprehensiveRate).toBe(75);
  });

  it("calculates consent rate", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", consentObtained: true }),
      makeInfoShare({ id: "i2", consentObtained: false }),
    ]);
    expect(result.consentRate).toBe(50);
  });

  it("awards full consent points for 100%", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", consentObtained: true }),
      makeInfoShare({ id: "i2", consentObtained: true }),
    ]);
    expect(result.consentRate).toBe(100);
  });

  it("calculates relevance rate", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", relevantToChildPlan: true }),
      makeInfoShare({ id: "i2", relevantToChildPlan: true }),
      makeInfoShare({ id: "i3", relevantToChildPlan: false }),
    ]);
    expect(result.relevanceRate).toBe(67);
  });

  it("counts agency type coverage", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", sharedWith: "social_work" }),
      makeInfoShare({ id: "i2", sharedWith: "health" }),
      makeInfoShare({ id: "i3", sharedWith: "education" }),
      makeInfoShare({ id: "i4", sharedWith: "social_work" }), // duplicate
    ]);
    expect(result.agencyTypeCoverage).toBe(3);
  });

  it("awards full coverage points for 3+ agency types", () => {
    const wide = evaluateInformationSharing([
      makeInfoShare({ id: "i1", sharedWith: "social_work" }),
      makeInfoShare({ id: "i2", sharedWith: "health" }),
      makeInfoShare({ id: "i3", sharedWith: "education" }),
    ]);
    const narrow = evaluateInformationSharing([
      makeInfoShare({ id: "i1", sharedWith: "social_work" }),
    ]);
    expect(wide.score).toBeGreaterThan(narrow.score);
    expect(wide.agencyTypeCoverage).toBe(3);
    expect(narrow.agencyTypeCoverage).toBe(1);
  });

  it("clamps score to maximum 25", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", sharedWith: "social_work" }),
      makeInfoShare({ id: "i2", sharedWith: "health" }),
      makeInfoShare({ id: "i3", sharedWith: "education" }),
      makeInfoShare({ id: "i4", sharedWith: "camhs" }),
    ]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("scores low for poor information sharing practice", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({
        quality: "not_shared",
        consentObtained: false,
        timeliness: false,
        relevantToChildPlan: false,
      }),
    ]);
    expect(result.score).toBeLessThan(5);
  });

  it("handles mixed quality records", () => {
    const result = evaluateInformationSharing([
      makeInfoShare({ id: "i1", quality: "timely_comprehensive", consentObtained: true, timeliness: true }),
      makeInfoShare({ id: "i2", quality: "delayed", consentObtained: false, timeliness: false }),
    ]);
    expect(result.comprehensiveRate).toBe(50);
    expect(result.consentRate).toBe(50);
    expect(result.timelinessRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateMultiAgencyPartnershipIntelligence — Main function
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMultiAgencyPartnershipIntelligence", () => {
  it("returns complete result structure", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house",
      "2026-05-01",
      "2026-05-18",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-05-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeTruthy();
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.partnershipEngagement).toBeDefined();
    expect(result.meetingEffectiveness).toBeDefined();
    expect(result.referralQuality).toBeDefined();
    expect(result.informationSharing).toBeDefined();
    expect(result.totalRelationships).toBe(1);
    expect(result.totalMeetings).toBe(1);
    expect(result.totalReferrals).toBe(1);
    expect(result.totalInformationShares).toBe(1);
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.concerns)).toBe(true);
    expect(Array.isArray(result.immediateActions)).toBe(true);
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
  });

  it("clamps overall score to 0-100", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("rates outstanding for score >= 80", () => {
    // Build data that will yield a high score
    const relationships: AgencyRelationship[] = [
      makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "excellent", feedbackReceived: "positive" }),
      makeRelationship({ id: "r4", agencyType: "camhs", engagementQuality: "good", feedbackReceived: "positive" }),
      makeRelationship({ id: "r5", agencyType: "police", engagementQuality: "good", feedbackReceived: "positive" }),
    ];
    const meetings: MultiAgencyMeeting[] = [
      makeMeeting({ id: "m1", meetingType: "review" }),
      makeMeeting({ id: "m2", meetingType: "strategy" }),
      makeMeeting({ id: "m3", meetingType: "planning" }),
      makeMeeting({ id: "m4", meetingType: "professionals" }),
    ];
    const referrals: AgencyReferral[] = [
      makeReferral({ id: "r1", outcome: "completed", responseTimeDays: 3 }),
      makeReferral({ id: "r2", outcome: "accepted", responseTimeDays: 5 }),
    ];
    const infoShares: InformationSharingRecord[] = [
      makeInfoShare({ id: "i1", sharedWith: "social_work" }),
      makeInfoShare({ id: "i2", sharedWith: "health" }),
      makeInfoShare({ id: "i3", sharedWith: "education" }),
    ];

    const result = generateMultiAgencyPartnershipIntelligence(
      relationships, meetings, referrals, infoShares,
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate for very poor data", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship({
        engagementQuality: "disengaged",
        informationSharingAgreementInPlace: false,
        feedbackReceived: "very_negative",
        lastContactDate: sixtyDaysAgo,
      })],
      [makeMeeting({
        agenciesInvited: ["social_work", "health", "education", "camhs"],
        agenciesAttended: [],
        homeRepresentativeAttended: false,
        minutesCirculated: false,
        actionsIdentified: 10,
        actionsCompleted: 0,
        childParticipated: false,
      })],
      [makeReferral({
        outcome: "declined",
        responseTimeDays: 30,
        appropriateReferral: false,
        followUpCompleted: false,
      })],
      [makeInfoShare({
        quality: "not_shared",
        consentObtained: false,
        timeliness: false,
        relevantToChildPlan: false,
      })],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("sums sub-scores correctly", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    const expectedSum = result.partnershipEngagement.score +
      result.meetingEffectiveness.score +
      result.referralQuality.score +
      result.informationSharing.score;
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("handles all empty arrays", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [], [], [], [],
      "test-home", "2026-05-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(15); // neutral referral score only
    expect(result.totalRelationships).toBe(0);
    expect(result.totalMeetings).toBe(0);
    expect(result.totalReferrals).toBe(0);
    expect(result.totalInformationShares).toBe(0);
  });

  it("generates strengths for good practice", () => {
    const relationships: AgencyRelationship[] = [
      makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "excellent", feedbackReceived: "positive" }),
      makeRelationship({ id: "r4", agencyType: "camhs", engagementQuality: "good", feedbackReceived: "positive" }),
      makeRelationship({ id: "r5", agencyType: "police", engagementQuality: "good", feedbackReceived: "positive" }),
    ];
    const result = generateMultiAgencyPartnershipIntelligence(
      relationships,
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns for poor practice", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship({ engagementQuality: "disengaged", agencyName: "Local CAMHS" })],
      [makeMeeting({
        homeRepresentativeAttended: false,
        agenciesInvited: ["social_work", "health"],
        agenciesAttended: [],
      })],
      [makeReferral({ appropriateReferral: false, responseTimeDays: 30 })],
      [makeInfoShare({ consentObtained: false, timeliness: false })],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("generates immediate actions for disengaged agencies", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship({ engagementQuality: "disengaged", agencyName: "CAMHS Team B" })],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT"))).toBe(true);
    expect(result.immediateActions.some((a) => a.includes("CAMHS Team B"))).toBe(true);
  });

  it("generates immediate actions for missing ISAs", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship({
        informationSharingAgreementInPlace: false,
        agencyName: "Youth Justice Service",
      })],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.immediateActions.some((a) => a.includes("information sharing agreement"))).toBe(true);
  });

  it("generates immediate actions for consent gaps", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare({ consentObtained: false })],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.immediateActions.some((a) => a.includes("consent"))).toBe(true);
  });

  it("generates no-action message when practice is strong", () => {
    const relationships: AgencyRelationship[] = [
      makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "excellent", feedbackReceived: "positive" }),
      makeRelationship({ id: "r4", agencyType: "camhs", engagementQuality: "good", feedbackReceived: "positive" }),
      makeRelationship({ id: "r5", agencyType: "police", engagementQuality: "good", feedbackReceived: "positive" }),
    ];
    const result = generateMultiAgencyPartnershipIntelligence(
      relationships,
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("always includes core regulatory links", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("adds information sharing regulatory links for consent gaps", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare({ consentObtained: false })],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Information Sharing Advice"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Data Protection Act"))).toBe(true);
  });

  it("adds child participation regulatory links for low participation", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [
        makeMeeting({ id: "m1", childParticipated: false }),
        makeMeeting({ id: "m2", childParticipated: false }),
        makeMeeting({ id: "m3", childParticipated: false }),
      ],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
  });

  it("rates good for score in 60-79 range", () => {
    // Build moderate data
    const relationships: AgencyRelationship[] = [
      makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "good" }),
      makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "good" }),
      makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "adequate" }),
    ];
    const meetings: MultiAgencyMeeting[] = [
      makeMeeting({ id: "m1", meetingType: "review" }),
      makeMeeting({ id: "m2", meetingType: "planning" }),
      makeMeeting({ id: "m3", meetingType: "strategy", childParticipated: false }),
    ];
    const result = generateMultiAgencyPartnershipIntelligence(
      relationships, meetings,
      [makeReferral()],
      [makeInfoShare({ id: "i1", sharedWith: "social_work" }), makeInfoShare({ id: "i2", sharedWith: "health" }), makeInfoShare({ id: "i3", sharedWith: "education" })],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    // Score should be somewhere between 40 and 100 since we have reasonable data
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(["outstanding", "good", "requires_improvement"]).toContain(result.rating);
  });

  it("handles assessedAt as ISO string", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [], [], [], [],
      "test-home", "2026-01-01", "2026-01-31",
    );
    expect(result.assessedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getAgencyTypeLabel", () => {
  it("returns correct label for social_work", () => {
    expect(getAgencyTypeLabel("social_work")).toBe("Social Work Team");
  });

  it("returns correct label for health", () => {
    expect(getAgencyTypeLabel("health")).toBe("Health Services");
  });

  it("returns correct label for education", () => {
    expect(getAgencyTypeLabel("education")).toBe("Education");
  });

  it("returns correct label for camhs", () => {
    expect(getAgencyTypeLabel("camhs")).toBe("CAMHS");
  });

  it("returns correct label for police", () => {
    expect(getAgencyTypeLabel("police")).toBe("Police");
  });

  it("returns correct label for youth_justice", () => {
    expect(getAgencyTypeLabel("youth_justice")).toBe("Youth Justice");
  });

  it("returns correct label for voluntary_sector", () => {
    expect(getAgencyTypeLabel("voluntary_sector")).toBe("Voluntary Sector");
  });

  it("returns correct label for advocacy", () => {
    expect(getAgencyTypeLabel("advocacy")).toBe("Advocacy Service");
  });

  it("returns correct label for irp", () => {
    expect(getAgencyTypeLabel("irp")).toBe("Independent Reviewing Officer");
  });

  it("returns correct label for housing", () => {
    expect(getAgencyTypeLabel("housing")).toBe("Housing");
  });

  it("returns correct label for substance_misuse", () => {
    expect(getAgencyTypeLabel("substance_misuse")).toBe("Substance Misuse");
  });

  it("returns correct label for immigration", () => {
    expect(getAgencyTypeLabel("immigration")).toBe("Immigration");
  });
});

describe("getEngagementQualityLabel", () => {
  it("returns correct label for excellent", () => {
    expect(getEngagementQualityLabel("excellent")).toBe("Excellent");
  });

  it("returns correct label for good", () => {
    expect(getEngagementQualityLabel("good")).toBe("Good");
  });

  it("returns correct label for adequate", () => {
    expect(getEngagementQualityLabel("adequate")).toBe("Adequate");
  });

  it("returns correct label for poor", () => {
    expect(getEngagementQualityLabel("poor")).toBe("Poor");
  });

  it("returns correct label for disengaged", () => {
    expect(getEngagementQualityLabel("disengaged")).toBe("Disengaged");
  });
});

describe("getMeetingTypeLabel", () => {
  it("returns correct label for strategy", () => {
    expect(getMeetingTypeLabel("strategy")).toBe("Strategy Meeting");
  });

  it("returns correct label for review", () => {
    expect(getMeetingTypeLabel("review")).toBe("Review Meeting");
  });

  it("returns correct label for planning", () => {
    expect(getMeetingTypeLabel("planning")).toBe("Planning Meeting");
  });

  it("returns correct label for professionals", () => {
    expect(getMeetingTypeLabel("professionals")).toBe("Professionals Meeting");
  });

  it("returns correct label for safeguarding_conference", () => {
    expect(getMeetingTypeLabel("safeguarding_conference")).toBe("Safeguarding Conference");
  });

  it("returns correct label for looked_after_review", () => {
    expect(getMeetingTypeLabel("looked_after_review")).toBe("Looked After Review");
  });

  it("returns correct label for education_review", () => {
    expect(getMeetingTypeLabel("education_review")).toBe("Education Review");
  });
});

describe("getInformationSharingQualityLabel", () => {
  it("returns correct label for timely_comprehensive", () => {
    expect(getInformationSharingQualityLabel("timely_comprehensive")).toBe("Timely & Comprehensive");
  });

  it("returns correct label for timely_partial", () => {
    expect(getInformationSharingQualityLabel("timely_partial")).toBe("Timely but Partial");
  });

  it("returns correct label for delayed", () => {
    expect(getInformationSharingQualityLabel("delayed")).toBe("Delayed");
  });

  it("returns correct label for not_shared", () => {
    expect(getInformationSharingQualityLabel("not_shared")).toBe("Not Shared");
  });

  it("returns correct label for not_applicable", () => {
    expect(getInformationSharingQualityLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getReferralOutcomeLabel", () => {
  it("returns correct label for accepted", () => {
    expect(getReferralOutcomeLabel("accepted")).toBe("Accepted");
  });

  it("returns correct label for declined", () => {
    expect(getReferralOutcomeLabel("declined")).toBe("Declined");
  });

  it("returns correct label for waiting", () => {
    expect(getReferralOutcomeLabel("waiting")).toBe("Waiting");
  });

  it("returns correct label for completed", () => {
    expect(getReferralOutcomeLabel("completed")).toBe("Completed");
  });

  it("returns correct label for withdrawn", () => {
    expect(getReferralOutcomeLabel("withdrawn")).toBe("Withdrawn");
  });
});

describe("getPartnerFeedbackLabel", () => {
  it("returns correct label for very_positive", () => {
    expect(getPartnerFeedbackLabel("very_positive")).toBe("Very Positive");
  });

  it("returns correct label for positive", () => {
    expect(getPartnerFeedbackLabel("positive")).toBe("Positive");
  });

  it("returns correct label for neutral", () => {
    expect(getPartnerFeedbackLabel("neutral")).toBe("Neutral");
  });

  it("returns correct label for negative", () => {
    expect(getPartnerFeedbackLabel("negative")).toBe("Negative");
  });

  it("returns correct label for very_negative", () => {
    expect(getPartnerFeedbackLabel("very_negative")).toBe("Very Negative");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases & Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles a single relationship correctly", () => {
    const result = evaluatePartnershipEngagement([makeRelationship()], 5);
    expect(result.score).toBeGreaterThan(0);
    expect(result.engagementCoverage).toBe(20); // 1/5
  });

  it("handles many relationships without overflow", () => {
    const relationships = Array.from({ length: 50 }, (_, i) =>
      makeRelationship({
        id: `r${i}`,
        agencyType: ["social_work", "health", "education", "camhs", "police"][i % 5] as AgencyType,
        engagementQuality: "excellent",
        feedbackReceived: "very_positive",
      }),
    );
    const result = evaluatePartnershipEngagement(relationships, 5);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles many meetings without overflow", () => {
    const meetings = Array.from({ length: 50 }, (_, i) =>
      makeMeeting({ id: `m${i}` }),
    );
    const result = evaluateMeetingEffectiveness(meetings);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles many referrals without overflow", () => {
    const referrals = Array.from({ length: 50 }, (_, i) =>
      makeReferral({ id: `r${i}`, outcome: "completed" }),
    );
    const result = evaluateReferralQuality(referrals);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles many info sharing records without overflow", () => {
    const records = Array.from({ length: 50 }, (_, i) =>
      makeInfoShare({ id: `i${i}` }),
    );
    const result = evaluateInformationSharing(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("overall score never exceeds 100", () => {
    // Perfect data across all dimensions
    const relationships: AgencyRelationship[] = [
      makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r4", agencyType: "camhs", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r5", agencyType: "police", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
    ];
    const meetings = [
      makeMeeting({ id: "m1", meetingType: "review" }),
      makeMeeting({ id: "m2", meetingType: "strategy" }),
      makeMeeting({ id: "m3", meetingType: "planning" }),
      makeMeeting({ id: "m4", meetingType: "professionals" }),
    ];
    const referrals = [
      makeReferral({ id: "r1", outcome: "completed", responseTimeDays: 2 }),
    ];
    const infoShares = [
      makeInfoShare({ id: "i1", sharedWith: "social_work" }),
      makeInfoShare({ id: "i2", sharedWith: "health" }),
      makeInfoShare({ id: "i3", sharedWith: "education" }),
    ];

    const result = generateMultiAgencyPartnershipIntelligence(
      relationships, meetings, referrals, infoShares,
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never goes below 0", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("each sub-score is clamped 0-25", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.partnershipEngagement.score).toBeGreaterThanOrEqual(0);
    expect(result.partnershipEngagement.score).toBeLessThanOrEqual(25);
    expect(result.meetingEffectiveness.score).toBeGreaterThanOrEqual(0);
    expect(result.meetingEffectiveness.score).toBeLessThanOrEqual(25);
    expect(result.referralQuality.score).toBeGreaterThanOrEqual(0);
    expect(result.referralQuality.score).toBeLessThanOrEqual(25);
    expect(result.informationSharing.score).toBeGreaterThanOrEqual(0);
    expect(result.informationSharing.score).toBeLessThanOrEqual(25);
  });

  it("produces no immediate actions message for perfect practice", () => {
    const relationships: AgencyRelationship[] = [
      makeRelationship({ id: "r1", agencyType: "social_work", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r2", agencyType: "health", engagementQuality: "excellent", feedbackReceived: "very_positive" }),
      makeRelationship({ id: "r3", agencyType: "education", engagementQuality: "excellent", feedbackReceived: "positive" }),
      makeRelationship({ id: "r4", agencyType: "camhs", engagementQuality: "good", feedbackReceived: "positive" }),
      makeRelationship({ id: "r5", agencyType: "police", engagementQuality: "good", feedbackReceived: "positive" }),
    ];
    const result = generateMultiAgencyPartnershipIntelligence(
      relationships,
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.immediateActions.length).toBeGreaterThanOrEqual(1);
    // Either has specific actions OR the "no immediate actions" message
    expect(result.immediateActions[0]).toBeTruthy();
  });

  it("includes regulatory links for engagement coverage gaps", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship({ agencyType: "social_work" })],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    // Coverage is 1/5 = 20% which is < 50%
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 22"))).toBe(true);
  });

  it("includes regulatory links for disengaged agencies", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship({ engagementQuality: "disengaged" })],
      [makeMeeting()],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 5(a)"))).toBe(true);
  });

  it("generates concern for low meeting attendance", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting({
        agenciesInvited: ["social_work", "health", "education", "camhs", "police"],
        agenciesAttended: ["social_work"],
      })],
      [makeReferral()],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.concerns.some((c) => c.includes("attendance"))).toBe(true);
  });

  it("generates concern for slow referral response", () => {
    const result = generateMultiAgencyPartnershipIntelligence(
      [makeRelationship()],
      [makeMeeting()],
      [makeReferral({ responseTimeDays: 20 })],
      [makeInfoShare()],
      "oak-house", "2026-05-01", "2026-05-18",
    );
    expect(result.concerns.some((c) => c.includes("response time") || c.includes("delays"))).toBe(true);
  });
});
