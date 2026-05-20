import { describe, it, expect } from "vitest";
import {
  pct, getRating, getOnlineSafetyTopicLabel, getComprehensionLevelLabel, getRatingLabel,
  evaluateOnlineSafetyQuality, evaluateOnlineSafetyCompliance, evaluateOnlineSafetyPolicy,
  evaluateStaffOnlineSafetyReadiness, buildChildOnlineSafetyProfiles,
  generateSocialMediaOnlineSafetyIntelligence,
} from "../social-media-online-safety-engine";
import type { OnlineSafetySession, OnlineSafetyPolicy, StaffOnlineSafetyTraining, OnlineSafetyTopic } from "../social-media-online-safety-engine";

let _sid = 0;
function makeSession(o: Partial<OnlineSafetySession> = {}): OnlineSafetySession {
  _sid++;
  return { id: `s-${_sid}`, childId: "child-1", childName: "Alex", sessionDate: "2026-03-01", topic: "cyberbullying_awareness", comprehensionLevel: "excellent", childEngaged: true, practicalDemonstration: true, safetyPlanUpdated: true, documentedInPlan: true, staffDelivered: true, feedbackGiven: true, ...o };
}
function makePolicy(o: Partial<OnlineSafetyPolicy> = {}): OnlineSafetyPolicy {
  return { id: "p-1", esafetyStrategy: true, socialMediaGuidance: true, screenTimeFramework: true, incidentReportingProtocol: true, contentFilteringPolicy: true, parentalEngagementPlan: true, regularReview: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffOnlineSafetyTraining> = {}): StaffOnlineSafetyTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, esafetyKnowledge: true, socialMediaAwareness: true, onlineGroomingRecognition: true, incidentResponse: true, ageAppropriateGuidance: true, digitalToolsCompetency: true, ...o };
}

describe("pct", () => {
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("correct pct", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("0 for num=0", () => { expect(pct(0, 5)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); });
});

describe("labels", () => {
  it("topic labels", () => {
    expect(getOnlineSafetyTopicLabel("cyberbullying_awareness")).toBe("Cyberbullying Awareness");
    expect(getOnlineSafetyTopicLabel("privacy_settings")).toBe("Privacy Settings");
    expect(getOnlineSafetyTopicLabel("screen_time_management")).toBe("Screen Time Management");
    expect(getOnlineSafetyTopicLabel("digital_footprint")).toBe("Digital Footprint");
    expect(getOnlineSafetyTopicLabel("online_grooming_awareness")).toBe("Online Grooming Awareness");
    expect(getOnlineSafetyTopicLabel("safe_social_media_use")).toBe("Safe Social Media Use");
    expect(getOnlineSafetyTopicLabel("content_filtering")).toBe("Content Filtering");
    expect(getOnlineSafetyTopicLabel("reporting_mechanisms")).toBe("Reporting Mechanisms");
  });
  it("comprehension labels", () => {
    expect(getComprehensionLevelLabel("excellent")).toBe("Excellent");
    expect(getComprehensionLevelLabel("not_assessed")).toBe("Not Assessed");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateOnlineSafetyQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateOnlineSafetyQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalSessions).toBe(0);
  });
  it("max 25 with perfect", () => {
    const r = evaluateOnlineSafetyQuality(Array.from({ length: 10 }, () => makeSession()));
    expect(r.overallScore).toBe(25); expect(r.comprehensionRate).toBe(100);
  });
  it("excellent+good count as comprehension", () => {
    const s = [makeSession({ comprehensionLevel: "excellent" }), makeSession({ comprehensionLevel: "good" }), makeSession({ comprehensionLevel: "developing" }), makeSession({ comprehensionLevel: "limited" })];
    expect(evaluateOnlineSafetyQuality(s).comprehensionRate).toBe(50);
  });
  it("individual rates", () => {
    const s = [makeSession({ childEngaged: true, practicalDemonstration: false, safetyPlanUpdated: false }), makeSession({ childEngaged: false, practicalDemonstration: true, safetyPlanUpdated: false }), makeSession({ childEngaged: false, practicalDemonstration: false, safetyPlanUpdated: true }), makeSession({ childEngaged: false, practicalDemonstration: false, safetyPlanUpdated: false })];
    const r = evaluateOnlineSafetyQuality(s);
    expect(r.engagementRate).toBe(25); expect(r.practicalRate).toBe(25); expect(r.safetyPlanRate).toBe(25);
  });
  it("caps at 25", () => { expect(evaluateOnlineSafetyQuality(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateOnlineSafetyCompliance", () => {
  it("zeros for empty", () => { expect(evaluateOnlineSafetyCompliance([]).overallScore).toBe(0); });
  it("max 25 with full diversity", () => {
    const topics: OnlineSafetyTopic[] = ["cyberbullying_awareness", "privacy_settings", "screen_time_management", "digital_footprint", "online_grooming_awareness", "safe_social_media_use", "content_filtering", "reporting_mechanisms"];
    const r = evaluateOnlineSafetyCompliance(topics.map((t) => makeSession({ topic: t })));
    expect(r.overallScore).toBe(25); expect(r.topicDiversityRatio).toBe(100);
  });
  it("doc rate", () => {
    const s = [makeSession({ documentedInPlan: true }), makeSession({ documentedInPlan: false })];
    expect(evaluateOnlineSafetyCompliance(s).documentedRate).toBe(50);
  });
  it("diversity 2/8=25%", () => {
    const s = [makeSession({ topic: "cyberbullying_awareness" }), makeSession({ topic: "privacy_settings" }), makeSession({ topic: "cyberbullying_awareness" })];
    expect(evaluateOnlineSafetyCompliance(s).topicDiversityRatio).toBe(25);
  });
});

describe("evaluateOnlineSafetyPolicy", () => {
  it("null→0", () => { const r = evaluateOnlineSafetyPolicy(null); expect(r.overallScore).toBe(0); expect(r.esafetyStrategy).toBe(false); });
  it("all true→25", () => { expect(evaluateOnlineSafetyPolicy(makePolicy()).overallScore).toBe(25); });
  it("first 4 at 4pts", () => { expect(evaluateOnlineSafetyPolicy(makePolicy({ socialMediaGuidance: false, screenTimeFramework: false, incidentReportingProtocol: false, contentFilteringPolicy: false, parentalEngagementPlan: false, regularReview: false })).overallScore).toBe(4); });
  it("last 3 at 3pts", () => { expect(evaluateOnlineSafetyPolicy(makePolicy({ esafetyStrategy: false, socialMediaGuidance: false, screenTimeFramework: false, incidentReportingProtocol: false })).overallScore).toBe(9); });
  it("all false→0", () => { expect(evaluateOnlineSafetyPolicy(makePolicy({ esafetyStrategy: false, socialMediaGuidance: false, screenTimeFramework: false, incidentReportingProtocol: false, contentFilteringPolicy: false, parentalEngagementPlan: false, regularReview: false })).overallScore).toBe(0); });
  it("mirrors booleans", () => { const r = evaluateOnlineSafetyPolicy(makePolicy({ esafetyStrategy: false })); expect(r.esafetyStrategy).toBe(false); expect(r.socialMediaGuidance).toBe(true); });
});

describe("evaluateStaffOnlineSafetyReadiness", () => {
  it("zeros for empty", () => { expect(evaluateStaffOnlineSafetyReadiness([]).overallScore).toBe(0); });
  it("25 fully trained", () => { expect(evaluateStaffOnlineSafetyReadiness([makeTraining()]).overallScore).toBe(25); });
  it("6+5+5+4+3+2=25", () => { expect(evaluateStaffOnlineSafetyReadiness([makeTraining()]).overallScore).toBe(25); });
  it("partial", () => {
    const t = makeTraining({ esafetyKnowledge: true, socialMediaAwareness: false, onlineGroomingRecognition: false, incidentResponse: false, ageAppropriateGuidance: false, digitalToolsCompetency: false });
    expect(evaluateStaffOnlineSafetyReadiness([t]).overallScore).toBe(6);
  });
  it("mixed rates", () => {
    const t1 = makeTraining({ esafetyKnowledge: true, socialMediaAwareness: false, onlineGroomingRecognition: false, incidentResponse: false, ageAppropriateGuidance: false, digitalToolsCompetency: false });
    const t2 = makeTraining({ esafetyKnowledge: false, socialMediaAwareness: true, onlineGroomingRecognition: false, incidentResponse: false, ageAppropriateGuidance: false, digitalToolsCompetency: false });
    const r = evaluateStaffOnlineSafetyReadiness([t1, t2]);
    expect(r.esafetyKnowledgeRate).toBe(50); expect(r.socialMediaAwarenessRate).toBe(50);
  });
});

describe("buildChildOnlineSafetyProfiles", () => {
  it("empty→[]", () => { expect(buildChildOnlineSafetyProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const s = [makeSession({ childId: "c1", childName: "A" }), makeSession({ childId: "c1", childName: "A" }), makeSession({ childId: "c2", childName: "B" })];
    const p = buildChildOnlineSafetyProfiles(s);
    expect(p).toHaveLength(2); expect(p[0].totalSessions).toBe(2);
  });
  it("caps at 10", () => {
    const topics: OnlineSafetyTopic[] = ["cyberbullying_awareness", "privacy_settings", "screen_time_management", "digital_footprint", "online_grooming_awareness"];
    const s = Array.from({ length: 12 }, (_, i) => makeSession({ childId: "c1", childName: "A", topic: topics[i % topics.length] }));
    expect(buildChildOnlineSafetyProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeSession({ childId: "cx", childName: "X", comprehensionLevel: "limited", childEngaged: false, topic: "cyberbullying_awareness" }));
    expect(buildChildOnlineSafetyProfiles(mk(3))[0].overallScore).toBe(0);
    expect(buildChildOnlineSafetyProfiles(mk(5))[0].overallScore).toBe(1);
    expect(buildChildOnlineSafetyProfiles(mk(10))[0].overallScore).toBe(2);
  });
});

describe("generateSocialMediaOnlineSafetyIntelligence", () => {
  it("complete result", () => {
    const topics: OnlineSafetyTopic[] = ["cyberbullying_awareness", "privacy_settings", "screen_time_management", "digital_footprint", "online_grooming_awareness", "safe_social_media_use", "content_filtering", "reporting_mechanisms"];
    const s = topics.map((t, i) => makeSession({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", topic: t }));
    const r = generateSocialMediaOnlineSafetyIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house"); expect(r.overallScore).toBeLessThanOrEqual(100); expect(r.regulatoryLinks).toHaveLength(7);
  });
  it("100 perfect", () => {
    const topics: OnlineSafetyTopic[] = ["cyberbullying_awareness", "privacy_settings", "screen_time_management", "digital_footprint", "online_grooming_awareness", "safe_social_media_use", "content_filtering", "reporting_mechanisms"];
    const r = generateSocialMediaOnlineSafetyIntelligence(topics.map((t) => makeSession({ topic: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateSocialMediaOnlineSafetyIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions", () => {
    const r = generateSocialMediaOnlineSafetyIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths >=80", () => {
    const topics: OnlineSafetyTopic[] = ["cyberbullying_awareness", "privacy_settings", "screen_time_management", "digital_footprint", "online_grooming_awareness", "safe_social_media_use", "content_filtering", "reporting_mechanisms"];
    const r = generateSocialMediaOnlineSafetyIntelligence(topics.map((t) => makeSession({ topic: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("improvements <60", () => {
    const s = [makeSession({ comprehensionLevel: "limited", childEngaged: false, practicalDemonstration: false, safetyPlanUpdated: false, staffDelivered: false })];
    const r = generateSocialMediaOnlineSafetyIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
});
