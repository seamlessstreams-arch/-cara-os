import { describe, it, expect } from "vitest";
import {
  pct, getRating, getPreventionTopicLabel, getUnderstandingLevelLabel, getRatingLabel,
  evaluatePreventionQuality, evaluatePreventionCompliance, evaluatePreventionPolicy,
  evaluateStaffPreventionReadiness, buildChildPreventionProfiles,
  generateSubstanceMisusePreventionIntelligence,
} from "../substance-misuse-prevention-engine";
import type { PreventionSession, PreventionPolicy, StaffPreventionTraining, PreventionTopic } from "../substance-misuse-prevention-engine";

let _sid = 0;
function makeSession(o: Partial<PreventionSession> = {}): PreventionSession {
  _sid++;
  return { id: `s-${_sid}`, childId: "child-1", childName: "Alex", sessionDate: "2026-03-01", topic: "drug_awareness", understandingLevel: "excellent", childEngaged: true, scenarioPracticed: true, copingStrategyIdentified: true, documentedInPlan: true, staffDelivered: true, followUpPlanned: true, ...o };
}
function makePolicy(o: Partial<PreventionPolicy> = {}): PreventionPolicy {
  return { id: "p-1", substanceMisuseStrategy: true, ageAppropriateCurriculum: true, incidentResponseProtocol: true, externalAgencyPartnership: true, staffTrainingRequirement: true, parentCarerEngagement: true, regularReview: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffPreventionTraining> = {}): StaffPreventionTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, substanceKnowledge: true, riskIndicatorRecognition: true, motivationalInterviewing: true, incidentManagement: true, safeguardingLinks: true, ageAppropriateDelivery: true, ...o };
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
    expect(getPreventionTopicLabel("drug_awareness")).toBe("Drug Awareness");
    expect(getPreventionTopicLabel("alcohol_awareness")).toBe("Alcohol Awareness");
    expect(getPreventionTopicLabel("smoking_vaping")).toBe("Smoking & Vaping");
    expect(getPreventionTopicLabel("peer_pressure_resistance")).toBe("Peer Pressure Resistance");
    expect(getPreventionTopicLabel("healthy_coping_strategies")).toBe("Healthy Coping Strategies");
    expect(getPreventionTopicLabel("support_signposting")).toBe("Support Signposting");
    expect(getPreventionTopicLabel("risk_recognition")).toBe("Risk Recognition");
    expect(getPreventionTopicLabel("legal_consequences")).toBe("Legal Consequences");
  });
  it("understanding labels", () => {
    expect(getUnderstandingLevelLabel("excellent")).toBe("Excellent");
    expect(getUnderstandingLevelLabel("good")).toBe("Good");
    expect(getUnderstandingLevelLabel("developing")).toBe("Developing");
    expect(getUnderstandingLevelLabel("limited")).toBe("Limited");
    expect(getUnderstandingLevelLabel("not_assessed")).toBe("Not Assessed");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluatePreventionQuality", () => {
  it("zeros for empty", () => {
    const r = evaluatePreventionQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalSessions).toBe(0);
    expect(r.understandingRate).toBe(0);
    expect(r.engagementRate).toBe(0);
    expect(r.scenarioRate).toBe(0);
    expect(r.copingStrategyRate).toBe(0);
  });
  it("max 25 with perfect sessions", () => {
    const r = evaluatePreventionQuality(Array.from({ length: 10 }, () => makeSession()));
    expect(r.overallScore).toBe(25);
    expect(r.understandingRate).toBe(100);
    expect(r.engagementRate).toBe(100);
    expect(r.scenarioRate).toBe(100);
    expect(r.copingStrategyRate).toBe(100);
  });
  it("excellent+good count as understanding", () => {
    const s = [
      makeSession({ understandingLevel: "excellent" }),
      makeSession({ understandingLevel: "good" }),
      makeSession({ understandingLevel: "developing" }),
      makeSession({ understandingLevel: "limited" }),
    ];
    expect(evaluatePreventionQuality(s).understandingRate).toBe(50);
  });
  it("individual rates calculated correctly", () => {
    const s = [
      makeSession({ childEngaged: true, scenarioPracticed: false, copingStrategyIdentified: false }),
      makeSession({ childEngaged: false, scenarioPracticed: true, copingStrategyIdentified: false }),
      makeSession({ childEngaged: false, scenarioPracticed: false, copingStrategyIdentified: true }),
      makeSession({ childEngaged: false, scenarioPracticed: false, copingStrategyIdentified: false }),
    ];
    const r = evaluatePreventionQuality(s);
    expect(r.engagementRate).toBe(25);
    expect(r.scenarioRate).toBe(25);
    expect(r.copingStrategyRate).toBe(25);
  });
  it("caps at 25", () => {
    expect(evaluatePreventionQuality(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25);
  });
  it("totalSessions matches input", () => {
    expect(evaluatePreventionQuality([makeSession(), makeSession(), makeSession()]).totalSessions).toBe(3);
  });
  it("rating outstanding when score 25", () => {
    expect(evaluatePreventionQuality(Array.from({ length: 5 }, () => makeSession())).rating).toBe("outstanding");
  });
  it("rating inadequate when all poor", () => {
    const s = [makeSession({ understandingLevel: "limited", childEngaged: false, scenarioPracticed: false, copingStrategyIdentified: false })];
    expect(evaluatePreventionQuality(s).rating).toBe("inadequate");
  });
});

describe("evaluatePreventionCompliance", () => {
  it("zeros for empty", () => {
    const r = evaluatePreventionCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.staffDeliveredRate).toBe(0);
    expect(r.followUpRate).toBe(0);
    expect(r.topicDiversityRatio).toBe(0);
  });
  it("max 25 with full diversity", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies", "support_signposting", "risk_recognition", "legal_consequences"];
    const r = evaluatePreventionCompliance(topics.map((t) => makeSession({ topic: t })));
    expect(r.overallScore).toBe(25);
    expect(r.topicDiversityRatio).toBe(100);
  });
  it("documented rate", () => {
    const s = [makeSession({ documentedInPlan: true }), makeSession({ documentedInPlan: false })];
    expect(evaluatePreventionCompliance(s).documentedRate).toBe(50);
  });
  it("staff delivered rate", () => {
    const s = [makeSession({ staffDelivered: true }), makeSession({ staffDelivered: false }), makeSession({ staffDelivered: false })];
    expect(evaluatePreventionCompliance(s).staffDeliveredRate).toBe(33);
  });
  it("follow-up rate", () => {
    const s = [makeSession({ followUpPlanned: true }), makeSession({ followUpPlanned: true }), makeSession({ followUpPlanned: false })];
    expect(evaluatePreventionCompliance(s).followUpRate).toBe(67);
  });
  it("diversity 2/8=25%", () => {
    const s = [makeSession({ topic: "drug_awareness" }), makeSession({ topic: "alcohol_awareness" }), makeSession({ topic: "drug_awareness" })];
    expect(evaluatePreventionCompliance(s).topicDiversityRatio).toBe(25);
  });
  it("caps at 25", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies", "support_signposting", "risk_recognition", "legal_consequences"];
    expect(evaluatePreventionCompliance(topics.map((t) => makeSession({ topic: t }))).overallScore).toBeLessThanOrEqual(25);
  });
});

describe("evaluatePreventionPolicy", () => {
  it("null → 0", () => {
    const r = evaluatePreventionPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.substanceMisuseStrategy).toBe(false);
    expect(r.ageAppropriateCurriculum).toBe(false);
  });
  it("all true → 25", () => {
    expect(evaluatePreventionPolicy(makePolicy()).overallScore).toBe(25);
  });
  it("first 4 at 4pts each", () => {
    expect(evaluatePreventionPolicy(makePolicy({ staffTrainingRequirement: false, parentCarerEngagement: false, regularReview: false })).overallScore).toBe(16);
  });
  it("last 3 at 3pts each", () => {
    expect(evaluatePreventionPolicy(makePolicy({ substanceMisuseStrategy: false, ageAppropriateCurriculum: false, incidentResponseProtocol: false, externalAgencyPartnership: false })).overallScore).toBe(9);
  });
  it("all false → 0", () => {
    expect(evaluatePreventionPolicy(makePolicy({ substanceMisuseStrategy: false, ageAppropriateCurriculum: false, incidentResponseProtocol: false, externalAgencyPartnership: false, staffTrainingRequirement: false, parentCarerEngagement: false, regularReview: false })).overallScore).toBe(0);
  });
  it("mirrors booleans", () => {
    const r = evaluatePreventionPolicy(makePolicy({ substanceMisuseStrategy: false }));
    expect(r.substanceMisuseStrategy).toBe(false);
    expect(r.ageAppropriateCurriculum).toBe(true);
    expect(r.incidentResponseProtocol).toBe(true);
  });
  it("single boolean only = 4", () => {
    expect(evaluatePreventionPolicy(makePolicy({ substanceMisuseStrategy: true, ageAppropriateCurriculum: false, incidentResponseProtocol: false, externalAgencyPartnership: false, staffTrainingRequirement: false, parentCarerEngagement: false, regularReview: false })).overallScore).toBe(4);
  });
  it("rating outstanding when full", () => {
    expect(evaluatePreventionPolicy(makePolicy()).rating).toBe("outstanding");
  });
  it("rating inadequate when null", () => {
    expect(evaluatePreventionPolicy(null).rating).toBe("inadequate");
  });
});

describe("evaluateStaffPreventionReadiness", () => {
  it("zeros for empty", () => {
    const r = evaluateStaffPreventionReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });
  it("25 fully trained", () => {
    expect(evaluateStaffPreventionReadiness([makeTraining()]).overallScore).toBe(25);
  });
  it("weights: 6+5+5+4+3+2=25", () => {
    expect(evaluateStaffPreventionReadiness([makeTraining()]).overallScore).toBe(25);
  });
  it("partial — substanceKnowledge only = 6", () => {
    const t = makeTraining({ substanceKnowledge: true, riskIndicatorRecognition: false, motivationalInterviewing: false, incidentManagement: false, safeguardingLinks: false, ageAppropriateDelivery: false });
    expect(evaluateStaffPreventionReadiness([t]).overallScore).toBe(6);
  });
  it("partial — riskIndicator only = 5", () => {
    const t = makeTraining({ substanceKnowledge: false, riskIndicatorRecognition: true, motivationalInterviewing: false, incidentManagement: false, safeguardingLinks: false, ageAppropriateDelivery: false });
    expect(evaluateStaffPreventionReadiness([t]).overallScore).toBe(5);
  });
  it("partial — ageAppropriateDelivery only = 2", () => {
    const t = makeTraining({ substanceKnowledge: false, riskIndicatorRecognition: false, motivationalInterviewing: false, incidentManagement: false, safeguardingLinks: false, ageAppropriateDelivery: true });
    expect(evaluateStaffPreventionReadiness([t]).overallScore).toBe(2);
  });
  it("mixed rates across 2 staff", () => {
    const t1 = makeTraining({ substanceKnowledge: true, riskIndicatorRecognition: false, motivationalInterviewing: false, incidentManagement: false, safeguardingLinks: false, ageAppropriateDelivery: false });
    const t2 = makeTraining({ substanceKnowledge: false, riskIndicatorRecognition: true, motivationalInterviewing: false, incidentManagement: false, safeguardingLinks: false, ageAppropriateDelivery: false });
    const r = evaluateStaffPreventionReadiness([t1, t2]);
    expect(r.substanceKnowledgeRate).toBe(50);
    expect(r.riskIndicatorRate).toBe(50);
    expect(r.totalStaff).toBe(2);
  });
  it("rating outstanding when full", () => {
    expect(evaluateStaffPreventionReadiness([makeTraining()]).rating).toBe("outstanding");
  });
  it("rating inadequate when empty", () => {
    expect(evaluateStaffPreventionReadiness([]).rating).toBe("inadequate");
  });
});

describe("buildChildPreventionProfiles", () => {
  it("empty → []", () => {
    expect(buildChildPreventionProfiles([])).toEqual([]);
  });
  it("groups by childId", () => {
    const s = [
      makeSession({ childId: "c1", childName: "A" }),
      makeSession({ childId: "c1", childName: "A" }),
      makeSession({ childId: "c2", childName: "B" }),
    ];
    const p = buildChildPreventionProfiles(s);
    expect(p).toHaveLength(2);
    expect(p[0].totalSessions).toBe(2);
    expect(p[1].totalSessions).toBe(1);
  });
  it("caps at 10", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies"];
    const s = Array.from({ length: 12 }, (_, i) => makeSession({ childId: "c1", childName: "A", topic: topics[i % topics.length] }));
    expect(buildChildPreventionProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring: 3 sessions → 0 freq", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeSession({ childId: "cx", childName: "X", understandingLevel: "limited", childEngaged: false, topic: "drug_awareness" }));
    expect(buildChildPreventionProfiles(mk(3))[0].overallScore).toBe(0);
  });
  it("freq scoring: 5 sessions → 1 freq", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeSession({ childId: "cx", childName: "X", understandingLevel: "limited", childEngaged: false, topic: "drug_awareness" }));
    expect(buildChildPreventionProfiles(mk(5))[0].overallScore).toBe(1);
  });
  it("freq scoring: 10 sessions → 2 freq", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeSession({ childId: "cx", childName: "X", understandingLevel: "limited", childEngaged: false, topic: "drug_awareness" }));
    expect(buildChildPreventionProfiles(mk(10))[0].overallScore).toBe(2);
  });
  it("understanding rate thresholds", () => {
    // 4 excellent out of 5 = 80% → r1=3
    const s = Array.from({ length: 5 }, (_, i) =>
      makeSession({ childId: "c1", childName: "A", understandingLevel: i < 4 ? "excellent" : "limited", childEngaged: false, topic: "drug_awareness" })
    );
    const p = buildChildPreventionProfiles(s)[0];
    expect(p.understandingRate).toBe(80);
  });
  it("diversity scoring: 4 topics → 2", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance"];
    const s = topics.map((t) => makeSession({ childId: "c1", childName: "A", understandingLevel: "limited", childEngaged: false, topic: t }));
    const p = buildChildPreventionProfiles(s)[0];
    // freq=0, r1=0, r2=0, div=2
    expect(p.overallScore).toBe(2);
  });
  it("diversity scoring: 2 topics → 1", () => {
    const s = [
      makeSession({ childId: "c1", childName: "A", understandingLevel: "limited", childEngaged: false, topic: "drug_awareness" }),
      makeSession({ childId: "c1", childName: "A", understandingLevel: "limited", childEngaged: false, topic: "alcohol_awareness" }),
    ];
    const p = buildChildPreventionProfiles(s)[0];
    // freq=0, r1=0, r2=0, div=1
    expect(p.overallScore).toBe(1);
  });
  it("tracks topics covered", () => {
    const s = [
      makeSession({ childId: "c1", childName: "A", topic: "drug_awareness" }),
      makeSession({ childId: "c1", childName: "A", topic: "alcohol_awareness" }),
      makeSession({ childId: "c1", childName: "A", topic: "drug_awareness" }),
    ];
    const p = buildChildPreventionProfiles(s)[0];
    expect(p.topicsCovered).toContain("drug_awareness");
    expect(p.topicsCovered).toContain("alcohol_awareness");
    expect(p.topicsCovered).toHaveLength(2);
  });
  it("perfect child gets 10", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies"];
    const s = Array.from({ length: 10 }, (_, i) => makeSession({ childId: "c1", childName: "A", topic: topics[i % topics.length] }));
    expect(buildChildPreventionProfiles(s)[0].overallScore).toBe(10);
  });
});

describe("generateSubstanceMisusePreventionIntelligence", () => {
  it("complete result structure", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies", "support_signposting", "risk_recognition", "legal_consequences"];
    const s = topics.map((t, i) => makeSession({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", topic: t }));
    const r = generateSubstanceMisusePreventionIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-20");
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.childProfiles).toHaveLength(2);
  });
  it("100 perfect", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies", "support_signposting", "risk_recognition", "legal_consequences"];
    const r = generateSubstanceMisusePreventionIntelligence(topics.map((t) => makeSession({ topic: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateSubstanceMisusePreventionIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions when policy and staff missing", () => {
    const r = generateSubstanceMisusePreventionIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths when scores >= 80%", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies", "support_signposting", "risk_recognition", "legal_consequences"];
    const r = generateSubstanceMisusePreventionIntelligence(topics.map((t) => makeSession({ topic: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("areas for improvement when scores low", () => {
    const s = [makeSession({ understandingLevel: "limited", childEngaged: false, scenarioPracticed: false, copingStrategyIdentified: false, staffDelivered: false, followUpPlanned: false, documentedInPlan: false })];
    const r = generateSubstanceMisusePreventionIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("caps at 100", () => {
    const topics: PreventionTopic[] = ["drug_awareness", "alcohol_awareness", "smoking_vaping", "peer_pressure_resistance", "healthy_coping_strategies", "support_signposting", "risk_recognition", "legal_consequences"];
    const r = generateSubstanceMisusePreventionIntelligence(topics.map((t) => makeSession({ topic: t })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("scenario and coping actions when rates low", () => {
    const s = [makeSession({ scenarioPracticed: false, copingStrategyIdentified: false })];
    const r = generateSubstanceMisusePreventionIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.includes("scenario"))).toBe(true);
    expect(r.actions.some((a) => a.includes("coping"))).toBe(true);
  });
});
