import { describe, it, expect } from "vitest";
import {
  evaluateTransitionPlanning,
  evaluateHandover,
  evaluateReadiness,
  evaluatePostTransition,
  buildChildTransitionProfiles,
  generateTransitionReadinessIntelligence,
  getRating,
  getTransitionTypeLabel,
  getTransitionStatusLabel,
  getReadinessLevelLabel,
  getHandoverQualityLabel,
  getSupportPlanStatusLabel,
  getChildFeelingLabel,
} from "../transition-readiness-engine";
import type {
  TransitionPlan,
  HandoverRecord,
  ReadinessAssessment,
  PostTransitionSupport,
} from "../transition-readiness-engine";

// ── Demo Data: Chamberlain House ───────────────────────────────────────────────────

const PLAN_MORGAN: TransitionPlan = {
  id: "tp-morgan",
  childId: "child-morgan",
  childName: "Morgan",
  transitionType: "semi_independent",
  status: "completed",
  plannedDate: "2026-04-01",
  actualDate: "2026-04-03",
  receivingPlacementIdentified: true,
  visitToNewPlacementCompleted: true,
  introductoryVisitsCount: 3,
  childInvolvedInPlanning: true,
  childViewsRecorded: true,
  childFeelingAboutMove: "positive",
  parentCarerInvolved: true,
  socialWorkerInvolved: true,
  riskAssessmentUpdated: true,
  healthInfoTransferred: true,
  educationInfoTransferred: true,
  personalBelongingsArranged: true,
  lifeStoryWorkUpToDate: true,
  memoryBoxPrepared: true,
  goodbyesCelebrated: true,
};

const PLAN_ALEX: TransitionPlan = {
  id: "tp-alex",
  childId: "child-alex",
  childName: "Alex",
  transitionType: "foster_care",
  status: "planned",
  plannedDate: "2026-05-15",
  receivingPlacementIdentified: true,
  visitToNewPlacementCompleted: true,
  introductoryVisitsCount: 2,
  childInvolvedInPlanning: true,
  childViewsRecorded: true,
  childFeelingAboutMove: "mixed",
  parentCarerInvolved: true,
  socialWorkerInvolved: true,
  riskAssessmentUpdated: true,
  healthInfoTransferred: true,
  educationInfoTransferred: true,
  personalBelongingsArranged: true,
  lifeStoryWorkUpToDate: true,
  memoryBoxPrepared: false,
  goodbyesCelebrated: false,
};

const PLAN_JORDAN_EMERGENCY: TransitionPlan = {
  id: "tp-jordan",
  childId: "child-jordan",
  childName: "Jordan",
  transitionType: "emergency_move",
  status: "emergency",
  plannedDate: "2026-03-20",
  actualDate: "2026-03-20",
  receivingPlacementIdentified: false,
  visitToNewPlacementCompleted: false,
  introductoryVisitsCount: 0,
  childInvolvedInPlanning: false,
  childViewsRecorded: false,
  childFeelingAboutMove: "resistant",
  parentCarerInvolved: false,
  socialWorkerInvolved: true,
  riskAssessmentUpdated: true,
  healthInfoTransferred: true,
  educationInfoTransferred: false,
  personalBelongingsArranged: false,
  lifeStoryWorkUpToDate: false,
  memoryBoxPrepared: false,
  goodbyesCelebrated: false,
};

const HANDOVER_MORGAN: HandoverRecord = {
  id: "ho-morgan",
  childId: "child-morgan",
  transitionId: "tp-morgan",
  handoverDate: "2026-04-03",
  sendingKeyWorker: "Sarah Johnson",
  receivingKeyWorker: "Jane Mitchell",
  quality: "comprehensive",
  allDocumentsTransferred: true,
  carePlanShared: true,
  riskAssessmentShared: true,
  healthPassportShared: true,
  educationRecordsShared: true,
  personalHistoryShared: true,
  allergiesHighlighted: true,
  medicationInfoTransferred: true,
  keyRelationshipsDocumented: true,
  childPreferencesShared: true,
  triggersAndStrategiesShared: true,
};

const HANDOVER_ALEX: HandoverRecord = {
  id: "ho-alex",
  childId: "child-alex",
  transitionId: "tp-alex",
  handoverDate: "2026-05-15",
  sendingKeyWorker: "Tom Richards",
  receivingKeyWorker: "Mike Dawson",
  quality: "adequate",
  allDocumentsTransferred: true,
  carePlanShared: true,
  riskAssessmentShared: true,
  healthPassportShared: true,
  educationRecordsShared: true,
  personalHistoryShared: true,
  allergiesHighlighted: true,
  medicationInfoTransferred: true,
  keyRelationshipsDocumented: true,
  childPreferencesShared: true,
  triggersAndStrategiesShared: true,
};

const HANDOVER_JORDAN_INCOMPLETE: HandoverRecord = {
  id: "ho-jordan",
  childId: "child-jordan",
  transitionId: "tp-jordan",
  handoverDate: "2026-03-20",
  sendingKeyWorker: "Lisa Williams",
  quality: "incomplete",
  allDocumentsTransferred: false,
  carePlanShared: false,
  riskAssessmentShared: true,
  healthPassportShared: false,
  educationRecordsShared: false,
  personalHistoryShared: false,
  allergiesHighlighted: true,
  medicationInfoTransferred: true,
  keyRelationshipsDocumented: false,
  childPreferencesShared: false,
  triggersAndStrategiesShared: false,
};

const READINESS_MORGAN: ReadinessAssessment = {
  id: "ra-morgan",
  childId: "child-morgan",
  transitionId: "tp-morgan",
  assessedDate: "2026-03-28",
  assessedBy: "Sarah Johnson",
  overallReadiness: "fully_ready",
  emotionalReadiness: "fully_ready",
  practicalReadiness: "fully_ready",
  socialReadiness: "mostly_ready",
  educationalReadiness: "fully_ready",
  supportPlanStatus: "in_place",
  contingencyPlanInPlace: true,
  professionalNetworkBriefed: true,
  familyNetworkBriefed: true,
};

const READINESS_ALEX: ReadinessAssessment = {
  id: "ra-alex",
  childId: "child-alex",
  transitionId: "tp-alex",
  assessedDate: "2026-05-10",
  assessedBy: "Tom Richards",
  overallReadiness: "mostly_ready",
  emotionalReadiness: "partially_ready",
  practicalReadiness: "mostly_ready",
  socialReadiness: "mostly_ready",
  educationalReadiness: "fully_ready",
  supportPlanStatus: "in_place",
  contingencyPlanInPlace: true,
  professionalNetworkBriefed: true,
  familyNetworkBriefed: false,
};

const READINESS_JORDAN_NOTREADY: ReadinessAssessment = {
  id: "ra-jordan",
  childId: "child-jordan",
  transitionId: "tp-jordan",
  assessedDate: "2026-03-20",
  assessedBy: "Lisa Williams",
  overallReadiness: "not_ready",
  emotionalReadiness: "not_ready",
  practicalReadiness: "not_assessed",
  socialReadiness: "not_ready",
  educationalReadiness: "not_assessed",
  supportPlanStatus: "not_started",
  contingencyPlanInPlace: false,
  professionalNetworkBriefed: false,
  familyNetworkBriefed: false,
};

const SUPPORT_MORGAN: PostTransitionSupport = {
  id: "pts-morgan",
  childId: "child-morgan",
  transitionId: "tp-morgan",
  followUpVisitCompleted: true,
  followUpVisitDate: "2026-04-07",
  followUpWithin7Days: true,
  settlingInReviewCompleted: true,
  previousKeyWorkerContactMaintained: true,
  feedbackFromChild: true,
  feedbackFromNewPlacement: true,
  issuesIdentified: 1,
  issuesResolved: 1,
};

const SUPPORT_JORDAN: PostTransitionSupport = {
  id: "pts-jordan",
  childId: "child-jordan",
  transitionId: "tp-jordan",
  followUpVisitCompleted: true,
  followUpVisitDate: "2026-03-25",
  followUpWithin7Days: true,
  settlingInReviewCompleted: false,
  previousKeyWorkerContactMaintained: true,
  feedbackFromChild: true,
  feedbackFromNewPlacement: false,
  issuesIdentified: 3,
  issuesResolved: 1,
};

// ── Label Function Tests ────────────────────────────────────────────────────

describe("label functions", () => {
  describe("getTransitionTypeLabel", () => {
    it("returns correct label for placement_move", () => {
      expect(getTransitionTypeLabel("placement_move")).toBe("Placement Move");
    });
    it("returns correct label for step_down", () => {
      expect(getTransitionTypeLabel("step_down")).toBe("Step Down");
    });
    it("returns correct label for step_up", () => {
      expect(getTransitionTypeLabel("step_up")).toBe("Step Up");
    });
    it("returns correct label for return_home", () => {
      expect(getTransitionTypeLabel("return_home")).toBe("Return Home");
    });
    it("returns correct label for foster_care", () => {
      expect(getTransitionTypeLabel("foster_care")).toBe("Foster Care");
    });
    it("returns correct label for semi_independent", () => {
      expect(getTransitionTypeLabel("semi_independent")).toBe("Semi-Independent");
    });
    it("returns correct label for independent_living", () => {
      expect(getTransitionTypeLabel("independent_living")).toBe("Independent Living");
    });
    it("returns correct label for adult_services", () => {
      expect(getTransitionTypeLabel("adult_services")).toBe("Adult Services");
    });
    it("returns correct label for education_transition", () => {
      expect(getTransitionTypeLabel("education_transition")).toBe("Education Transition");
    });
    it("returns correct label for emergency_move", () => {
      expect(getTransitionTypeLabel("emergency_move")).toBe("Emergency Move");
    });
  });

  describe("getTransitionStatusLabel", () => {
    it("returns Planned", () => expect(getTransitionStatusLabel("planned")).toBe("Planned"));
    it("returns In Progress", () => expect(getTransitionStatusLabel("in_progress")).toBe("In Progress"));
    it("returns Completed", () => expect(getTransitionStatusLabel("completed")).toBe("Completed"));
    it("returns Cancelled", () => expect(getTransitionStatusLabel("cancelled")).toBe("Cancelled"));
    it("returns Emergency", () => expect(getTransitionStatusLabel("emergency")).toBe("Emergency"));
  });

  describe("getReadinessLevelLabel", () => {
    it("returns Fully Ready", () => expect(getReadinessLevelLabel("fully_ready")).toBe("Fully Ready"));
    it("returns Mostly Ready", () => expect(getReadinessLevelLabel("mostly_ready")).toBe("Mostly Ready"));
    it("returns Partially Ready", () => expect(getReadinessLevelLabel("partially_ready")).toBe("Partially Ready"));
    it("returns Not Ready", () => expect(getReadinessLevelLabel("not_ready")).toBe("Not Ready"));
    it("returns Not Assessed", () => expect(getReadinessLevelLabel("not_assessed")).toBe("Not Assessed"));
  });

  describe("getHandoverQualityLabel", () => {
    it("returns Comprehensive", () => expect(getHandoverQualityLabel("comprehensive")).toBe("Comprehensive"));
    it("returns Adequate", () => expect(getHandoverQualityLabel("adequate")).toBe("Adequate"));
    it("returns Basic", () => expect(getHandoverQualityLabel("basic")).toBe("Basic"));
    it("returns Incomplete", () => expect(getHandoverQualityLabel("incomplete")).toBe("Incomplete"));
    it("returns Not Completed", () => expect(getHandoverQualityLabel("not_completed")).toBe("Not Completed"));
  });

  describe("getSupportPlanStatusLabel", () => {
    it("returns In Place", () => expect(getSupportPlanStatusLabel("in_place")).toBe("In Place"));
    it("returns In Development", () => expect(getSupportPlanStatusLabel("in_development")).toBe("In Development"));
    it("returns Not Started", () => expect(getSupportPlanStatusLabel("not_started")).toBe("Not Started"));
    it("returns Not Required", () => expect(getSupportPlanStatusLabel("not_required")).toBe("Not Required"));
  });

  describe("getChildFeelingLabel", () => {
    it("returns Positive", () => expect(getChildFeelingLabel("positive")).toBe("Positive"));
    it("returns Mixed", () => expect(getChildFeelingLabel("mixed")).toBe("Mixed"));
    it("returns Anxious", () => expect(getChildFeelingLabel("anxious")).toBe("Anxious"));
    it("returns Resistant", () => expect(getChildFeelingLabel("resistant")).toBe("Resistant"));
    it("returns Not Recorded", () => expect(getChildFeelingLabel("not_recorded")).toBe("Not Recorded"));
  });
});

// ── getRating ───────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ── evaluateTransitionPlanning ──────────────────────────────────────────────

describe("evaluateTransitionPlanning", () => {
  it("returns max score (30) for empty plans — stability", () => {
    const result = evaluateTransitionPlanning([]);
    expect(result.overallScore).toBe(30);
    expect(result.totalTransitions).toBe(0);
    expect(result.plannedTransitionRate).toBe(100);
    expect(result.childInvolvementRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.parentInvolvementRate).toBe(100);
    expect(result.visitCompletedRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
    expect(result.infoTransferRate).toBe(100);
    expect(result.goodbyesCelebratedRate).toBe(100);
  });

  it("scores well for a single excellent planned transition", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN]);
    expect(result.totalTransitions).toBe(1);
    expect(result.plannedTransitionRate).toBe(100);
    expect(result.childInvolvementRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.parentInvolvementRate).toBe(100);
    expect(result.visitCompletedRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
    expect(result.infoTransferRate).toBe(100);
    expect(result.goodbyesCelebratedRate).toBe(100);
    expect(result.overallScore).toBe(30);
  });

  it("scores lower when emergency transition included", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_JORDAN_EMERGENCY]);
    expect(result.totalTransitions).toBe(2);
    // 1 planned, 1 emergency = 50% planned rate
    expect(result.plannedTransitionRate).toBe(50);
    // child involvement: 1/2 = 50%
    expect(result.childInvolvementRate).toBe(50);
  });

  it("calculates info transfer rate across health and education", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_JORDAN_EMERGENCY]);
    // Morgan: both transferred, Jordan: health yes, education no = 3/4
    expect(result.infoTransferRate).toBe(75);
  });

  it("calculates goodbyes celebrated rate", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_ALEX]);
    // Morgan: yes, Alex: no = 50%
    expect(result.goodbyesCelebratedRate).toBe(50);
  });

  it("gives partial points for visit completed at 67%", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_ALEX, PLAN_JORDAN_EMERGENCY]);
    // Morgan and Alex visited, Jordan didn't = 67%
    expect(result.visitCompletedRate).toBe(67);
  });

  it("gives full planned transition rate points for all planned", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_ALEX]);
    expect(result.plannedTransitionRate).toBe(100);
  });

  it("score is capped at 30", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN]);
    expect(result.overallScore).toBeLessThanOrEqual(30);
  });

  it("handles all-emergency transitions with low scores", () => {
    const allEmergency: TransitionPlan = {
      ...PLAN_JORDAN_EMERGENCY,
      id: "tp-em2",
      childName: "Test",
    };
    const result = evaluateTransitionPlanning([PLAN_JORDAN_EMERGENCY, allEmergency]);
    expect(result.plannedTransitionRate).toBe(0);
    expect(result.childInvolvementRate).toBe(0);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("counts risk assessment updates correctly", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_ALEX, PLAN_JORDAN_EMERGENCY]);
    // All three have riskAssessmentUpdated = true
    expect(result.riskAssessmentRate).toBe(100);
  });

  it("parent involvement rate calculated correctly", () => {
    const result = evaluateTransitionPlanning([PLAN_MORGAN, PLAN_ALEX, PLAN_JORDAN_EMERGENCY]);
    // Morgan yes, Alex yes, Jordan no = 67%
    expect(result.parentInvolvementRate).toBe(67);
  });
});

// ── evaluateHandover ────────────────────────────────────────────────────────

describe("evaluateHandover", () => {
  it("returns max score (25) for empty handovers", () => {
    const result = evaluateHandover([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalHandovers).toBe(0);
    expect(result.comprehensiveRate).toBe(100);
    expect(result.documentTransferRate).toBe(100);
    expect(result.carePlanSharedRate).toBe(100);
    expect(result.healthInfoRate).toBe(100);
    expect(result.triggersSharedRate).toBe(100);
    expect(result.childPreferencesRate).toBe(100);
  });

  it("scores high for a single comprehensive handover", () => {
    const result = evaluateHandover([HANDOVER_MORGAN]);
    expect(result.totalHandovers).toBe(1);
    expect(result.comprehensiveRate).toBe(100);
    expect(result.documentTransferRate).toBe(100);
    expect(result.carePlanSharedRate).toBe(100);
    expect(result.healthInfoRate).toBe(100);
    expect(result.triggersSharedRate).toBe(100);
    expect(result.childPreferencesRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("reduces score for incomplete handover", () => {
    const result = evaluateHandover([HANDOVER_JORDAN_INCOMPLETE]);
    expect(result.comprehensiveRate).toBe(0);
    expect(result.documentTransferRate).toBe(0);
    expect(result.carePlanSharedRate).toBe(0);
    expect(result.healthInfoRate).toBe(0);
    expect(result.triggersSharedRate).toBe(0);
    expect(result.childPreferencesRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("mixes comprehensive and incomplete handovers", () => {
    const result = evaluateHandover([HANDOVER_MORGAN, HANDOVER_JORDAN_INCOMPLETE]);
    expect(result.totalHandovers).toBe(2);
    expect(result.comprehensiveRate).toBe(50);
    expect(result.documentTransferRate).toBe(50);
  });

  it("all three handovers produce mixed results", () => {
    const result = evaluateHandover([HANDOVER_MORGAN, HANDOVER_ALEX, HANDOVER_JORDAN_INCOMPLETE]);
    expect(result.totalHandovers).toBe(3);
    // Morgan comprehensive + Alex adequate = 2/3 = 67%
    expect(result.comprehensiveRate).toBe(67);
    // Morgan + Alex transferred, Jordan not = 2/3
    expect(result.documentTransferRate).toBe(67);
  });

  it("health info requires both passport and medication", () => {
    const result = evaluateHandover([HANDOVER_JORDAN_INCOMPLETE]);
    // Jordan has medicationInfoTransferred but not healthPassportShared
    expect(result.healthInfoRate).toBe(0);
  });

  it("score capped at 25", () => {
    const result = evaluateHandover([HANDOVER_MORGAN]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("basic quality handover not counted as comprehensive/adequate", () => {
    const basicHandover: HandoverRecord = {
      ...HANDOVER_MORGAN,
      id: "ho-basic",
      quality: "basic",
    };
    const result = evaluateHandover([basicHandover]);
    expect(result.comprehensiveRate).toBe(0);
  });

  it("adequate quality counts toward comprehensive rate", () => {
    const result = evaluateHandover([HANDOVER_ALEX]);
    expect(result.comprehensiveRate).toBe(100);
  });
});

// ── evaluateReadiness ───────────────────────────────────────────────────────

describe("evaluateReadiness", () => {
  it("returns max score (25) for empty assessments", () => {
    const result = evaluateReadiness([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalAssessments).toBe(0);
    expect(result.fullyReadyRate).toBe(100);
    expect(result.supportPlanRate).toBe(100);
    expect(result.contingencyRate).toBe(100);
    expect(result.professionalBriefedRate).toBe(100);
    expect(result.emotionalReadinessGoodRate).toBe(100);
  });

  it("scores well for fully ready child", () => {
    const result = evaluateReadiness([READINESS_MORGAN]);
    expect(result.fullyReadyRate).toBe(100);
    expect(result.supportPlanRate).toBe(100);
    expect(result.contingencyRate).toBe(100);
    expect(result.professionalBriefedRate).toBe(100);
    expect(result.emotionalReadinessGoodRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("counts mostly_ready toward fully ready rate", () => {
    const result = evaluateReadiness([READINESS_ALEX]);
    expect(result.fullyReadyRate).toBe(100);
  });

  it("not_ready child produces 0% fully ready rate", () => {
    const result = evaluateReadiness([READINESS_JORDAN_NOTREADY]);
    expect(result.fullyReadyRate).toBe(0);
    expect(result.emotionalReadinessGoodRate).toBe(0);
  });

  it("mixed readiness produces correct rates", () => {
    const result = evaluateReadiness([READINESS_MORGAN, READINESS_ALEX, READINESS_JORDAN_NOTREADY]);
    expect(result.totalAssessments).toBe(3);
    // 2 fully/mostly ready out of 3 = 67%
    expect(result.fullyReadyRate).toBe(67);
    // Morgan and Alex have support plans in place = 67%
    expect(result.supportPlanRate).toBe(67);
    // Morgan and Alex have contingency = 67%
    expect(result.contingencyRate).toBe(67);
    // Morgan and Alex have professionals briefed = 67%
    expect(result.professionalBriefedRate).toBe(67);
  });

  it("not_required support plan counts as in-place", () => {
    const notRequired: ReadinessAssessment = {
      ...READINESS_JORDAN_NOTREADY,
      supportPlanStatus: "not_required",
    };
    const result = evaluateReadiness([notRequired]);
    expect(result.supportPlanRate).toBe(100);
  });

  it("emotional readiness uses fully_ready and mostly_ready", () => {
    const result = evaluateReadiness([READINESS_MORGAN, READINESS_ALEX]);
    // Morgan fully_ready, Alex partially_ready = 50%
    expect(result.emotionalReadinessGoodRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateReadiness([READINESS_MORGAN]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all not-ready children score low", () => {
    const notReady2: ReadinessAssessment = {
      ...READINESS_JORDAN_NOTREADY,
      id: "ra-test",
    };
    const result = evaluateReadiness([READINESS_JORDAN_NOTREADY, notReady2]);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.fullyReadyRate).toBe(0);
    expect(result.contingencyRate).toBe(0);
    expect(result.professionalBriefedRate).toBe(0);
  });
});

// ── evaluatePostTransition ──────────────────────────────────────────────────

describe("evaluatePostTransition", () => {
  it("returns max score (20) for empty supports", () => {
    const result = evaluatePostTransition([]);
    expect(result.overallScore).toBe(20);
    expect(result.totalFollowUps).toBe(0);
    expect(result.followUpCompletedRate).toBe(100);
    expect(result.within7DaysRate).toBe(100);
    expect(result.settlingInReviewRate).toBe(100);
    expect(result.previousKeyWorkerContactRate).toBe(100);
    expect(result.childFeedbackRate).toBe(100);
    expect(result.issueResolutionRate).toBe(100);
  });

  it("scores well for complete post-transition support", () => {
    const result = evaluatePostTransition([SUPPORT_MORGAN]);
    expect(result.followUpCompletedRate).toBe(100);
    expect(result.within7DaysRate).toBe(100);
    expect(result.settlingInReviewRate).toBe(100);
    expect(result.previousKeyWorkerContactRate).toBe(100);
    expect(result.childFeedbackRate).toBe(100);
    expect(result.issueResolutionRate).toBe(100);
    expect(result.overallScore).toBe(20);
  });

  it("reduces score for partial support", () => {
    const result = evaluatePostTransition([SUPPORT_JORDAN]);
    expect(result.followUpCompletedRate).toBe(100);
    expect(result.within7DaysRate).toBe(100);
    expect(result.settlingInReviewRate).toBe(0);
    expect(result.previousKeyWorkerContactRate).toBe(100);
    expect(result.childFeedbackRate).toBe(100);
    // 1 resolved out of 3 identified = 33%
    expect(result.issueResolutionRate).toBe(33);
  });

  it("mixed post-transition support produces averaged rates", () => {
    const result = evaluatePostTransition([SUPPORT_MORGAN, SUPPORT_JORDAN]);
    expect(result.totalFollowUps).toBe(2);
    expect(result.followUpCompletedRate).toBe(100);
    expect(result.within7DaysRate).toBe(100);
    expect(result.settlingInReviewRate).toBe(50);
    expect(result.previousKeyWorkerContactRate).toBe(100);
    expect(result.childFeedbackRate).toBe(100);
  });

  it("no issues identified gives full resolution score", () => {
    const noIssues: PostTransitionSupport = {
      ...SUPPORT_MORGAN,
      issuesIdentified: 0,
      issuesResolved: 0,
    };
    const result = evaluatePostTransition([noIssues]);
    expect(result.issueResolutionRate).toBe(0); // pct(0, 0) = 0 but scoring uses totalIssues === 0 check
    expect(result.overallScore).toBe(20);
  });

  it("no follow-up at all scores poorly", () => {
    const noFollowUp: PostTransitionSupport = {
      id: "pts-none",
      childId: "child-test",
      transitionId: "tp-test",
      followUpVisitCompleted: false,
      followUpWithin7Days: false,
      settlingInReviewCompleted: false,
      previousKeyWorkerContactMaintained: false,
      feedbackFromChild: false,
      feedbackFromNewPlacement: false,
      issuesIdentified: 5,
      issuesResolved: 0,
    };
    const result = evaluatePostTransition([noFollowUp]);
    expect(result.followUpCompletedRate).toBe(0);
    expect(result.within7DaysRate).toBe(0);
    expect(result.settlingInReviewRate).toBe(0);
    expect(result.previousKeyWorkerContactRate).toBe(0);
    expect(result.childFeedbackRate).toBe(0);
    expect(result.issueResolutionRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("score capped at 20", () => {
    const result = evaluatePostTransition([SUPPORT_MORGAN]);
    expect(result.overallScore).toBeLessThanOrEqual(20);
  });

  it("issue resolution rate aggregates across supports", () => {
    // Morgan: 1/1, Jordan: 1/3 => total 2 resolved out of 4 = 50%
    const result = evaluatePostTransition([SUPPORT_MORGAN, SUPPORT_JORDAN]);
    expect(result.issueResolutionRate).toBe(50);
  });
});

// ── buildChildTransitionProfiles ────────────────────────────────────────────

describe("buildChildTransitionProfiles", () => {
  it("builds profiles from plans, handovers, assessments, supports", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_MORGAN, PLAN_ALEX],
      [HANDOVER_MORGAN, HANDOVER_ALEX],
      [READINESS_MORGAN, READINESS_ALEX],
      [SUPPORT_MORGAN],
    );
    expect(profiles).toHaveLength(2);
  });

  it("Morgan profile has correct values", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
    );
    const morgan = profiles[0];
    expect(morgan.childId).toBe("child-morgan");
    expect(morgan.childName).toBe("Morgan");
    expect(morgan.transitionType).toBe("semi_independent");
    expect(morgan.status).toBe("completed");
    expect(morgan.readinessLevel).toBe("fully_ready");
    expect(morgan.handoverQuality).toBe("comprehensive");
    expect(morgan.childFeeling).toBe("positive");
    expect(morgan.followUpCompleted).toBe(true);
    expect(morgan.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("emergency transition child gets penalty", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_JORDAN_EMERGENCY],
      [HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_JORDAN_NOTREADY],
      [SUPPORT_JORDAN],
    );
    const jordan = profiles[0];
    expect(jordan.childId).toBe("child-jordan");
    expect(jordan.status).toBe("emergency");
    // Emergency = -2 penalty, resistant + no views = -1 penalty
    expect(jordan.overallScore).toBeLessThanOrEqual(5);
  });

  it("profile score clamped between 0 and 10", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_JORDAN_EMERGENCY],
      [HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_JORDAN_NOTREADY],
      [],
    );
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("child with no handover defaults to not_completed", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_ALEX],
      [],
      [],
      [],
    );
    expect(profiles[0].handoverQuality).toBe("not_completed");
  });

  it("child with no readiness defaults to not_assessed", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_ALEX],
      [],
      [],
      [],
    );
    expect(profiles[0].readinessLevel).toBe("not_assessed");
  });

  it("child with no follow-up shows followUpCompleted false", () => {
    const profiles = buildChildTransitionProfiles(
      [PLAN_ALEX],
      [],
      [],
      [],
    );
    expect(profiles[0].followUpCompleted).toBe(false);
  });

  it("goodbyes celebrated adds to profile score", () => {
    const withGoodbyes = buildChildTransitionProfiles(
      [PLAN_MORGAN],
      [],
      [],
      [],
    );
    const withoutGoodbyes = buildChildTransitionProfiles(
      [{ ...PLAN_MORGAN, goodbyesCelebrated: false }],
      [],
      [],
      [],
    );
    expect(withGoodbyes[0].overallScore).toBeGreaterThan(withoutGoodbyes[0].overallScore);
  });
});

// ── generateTransitionReadinessIntelligence ─────────────────────────────────

describe("generateTransitionReadinessIntelligence", () => {
  it("returns outstanding rating for empty data (stability)", () => {
    const result = generateTransitionReadinessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.childProfiles).toHaveLength(0);
    expect(result.strengths).toContain("No transitions in period — placement stability maintained");
  });

  it("returns correct structure with all fields", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result).toHaveProperty("homeId");
    expect(result).toHaveProperty("periodStart");
    expect(result).toHaveProperty("periodEnd");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("rating");
    expect(result).toHaveProperty("transitionPlanning");
    expect(result).toHaveProperty("handover");
    expect(result).toHaveProperty("readiness");
    expect(result).toHaveProperty("postTransition");
    expect(result).toHaveProperty("childProfiles");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("areasForImprovement");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("regulatoryLinks");
  });

  it("overall score is sum of 4 component scores", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const expectedSum =
      result.transitionPlanning.overallScore +
      result.handover.overallScore +
      result.readiness.overallScore +
      result.postTransition.overallScore;
    expect(result.overallScore).toBe(Math.min(expectedSum, 100));
  });

  it("scores outstanding for perfect single transition", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("produces child profiles matching plan count", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN, PLAN_ALEX, PLAN_JORDAN_EMERGENCY],
      [HANDOVER_MORGAN, HANDOVER_ALEX, HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_MORGAN, READINESS_ALEX, READINESS_JORDAN_NOTREADY],
      [SUPPORT_MORGAN, SUPPORT_JORDAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths for excellent practice", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("child participation"))).toBe(true);
  });

  it("generates areas for improvement with poor data", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_JORDAN_NOTREADY],
      [SUPPORT_JORDAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for emergency transitions", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_JORDAN_NOTREADY],
      [SUPPORT_JORDAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generateTransitionReadinessIntelligence(
      [], [], [], [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 36"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CA 1989"))).toBe(true);
  });

  it("overall score capped at 100", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("mixed quality data produces mid-range score", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN, PLAN_JORDAN_EMERGENCY],
      [HANDOVER_MORGAN, HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_MORGAN, READINESS_JORDAN_NOTREADY],
      [SUPPORT_MORGAN, SUPPORT_JORDAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThan(20);
    expect(result.overallScore).toBeLessThan(100);
  });

  it("rates poorly for all-bad data", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [HANDOVER_JORDAN_INCOMPLETE],
      [READINESS_JORDAN_NOTREADY],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    // No post-transition support gives 20, but planning/handover/readiness will be very low
    expect(result.overallScore).toBeLessThan(50);
  });
});

// ── Strength / Areas / Actions edge cases ───────────────────────────────────

describe("strength generation edge cases", () => {
  it("excellent handover triggers strengths", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("handovers"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Triggers"))).toBe(true);
  });

  it("post-transition follow-up triggers strengths", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("post-transition follow-up"))).toBe(true);
  });

  it("key worker contact maintained triggers strengths", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_MORGAN],
      [READINESS_MORGAN],
      [SUPPORT_MORGAN],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("Key worker"))).toBe(true);
  });

  it("goodbyes celebrated triggers strengths", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.some((s) => s.includes("Goodbyes"))).toBe(true);
  });
});

describe("areas for improvement generation", () => {
  it("low child involvement triggers area", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Child involvement"))).toBe(true);
  });

  it("low visit rate triggers area", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("visited new placements"))).toBe(true);
  });

  it("emergency transitions trigger area", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("emergency"))).toBe(true);
  });

  it("low contingency plan rate triggers area", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [],
      [READINESS_JORDAN_NOTREADY],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Contingency"))).toBe(true);
  });
});

describe("action generation", () => {
  it("emergency moves trigger URGENT action", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("low child views trigger action", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_JORDAN_EMERGENCY],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("child views"))).toBe(true);
  });

  it("missing triggers in handovers generates action", () => {
    const result = generateTransitionReadinessIntelligence(
      [PLAN_MORGAN],
      [HANDOVER_JORDAN_INCOMPLETE],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("triggers"))).toBe(true);
  });

  it("low goodbyes rate triggers action", () => {
    const noGoodbyes: TransitionPlan = { ...PLAN_MORGAN, goodbyesCelebrated: false };
    const result = generateTransitionReadinessIntelligence(
      [noGoodbyes],
      [],
      [],
      [],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("goodbyes") || a.includes("Celebrate"))).toBe(true);
  });
});
