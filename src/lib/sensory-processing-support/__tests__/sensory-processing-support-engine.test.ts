// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sensory Processing Support Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAssessmentQuality,
  evaluateInterventionEffectiveness,
  evaluateSensoryPolicy,
  evaluateStaffSensoryReadiness,
  buildChildSensoryProfiles,
  generateSensoryProcessingSupportIntelligence,
  getSensoryNeedLabel,
  getInterventionTypeLabel,
  getEffectivenessLabel,
  getChildResponseLabel,
  getRatingLabel,
  pct,
  getRating,
} from "../sensory-processing-support-engine";
import type {
  SensoryAssessment,
  SensoryIntervention,
  SensoryPolicy,
  StaffSensoryTraining,
  SensoryNeed,
  InterventionType,
  Effectiveness,
  ChildResponse,
  Rating,
} from "../sensory-processing-support-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";
const REFERENCE_DATE = "2026-05-19";
const HOME_ID = "oak-house";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES = ["Alex", "Jordan", "Morgan"];

// ── Test Data ────────────────────────────────────────────────────────────────

const DEMO_ASSESSMENTS: SensoryAssessment[] = [
  {
    id: "sa-01",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-01-15",
    assessedBy: "Sarah Johnson",
    sensoryNeeds: ["hyper_auditory", "hypo_proprioceptive"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-02",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-02-01",
    assessedBy: "Tom Richards",
    sensoryNeeds: ["hyper_tactile", "hyper_visual"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: true,
    environmentAdapted: true,
    parentCarerInformed: true,
  },
  {
    id: "sa-03",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-02-15",
    assessedBy: "Lisa Williams",
    sensoryNeeds: ["mixed", "hypo_vestibular"],
    sensoryPlanInPlace: true,
    occupationalTherapyReferred: false,
    environmentAdapted: true,
    parentCarerInformed: false,
  },
];

const DEMO_INTERVENTIONS: SensoryIntervention[] = [
  {
    id: "si-01",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-01-20",
    interventionType: "sensory_diet",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "highly_effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-02",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-02-05",
    interventionType: "calming_strategy",
    facilitatedBy: "Darren Laville",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-03",
    childId: "child-alex",
    childName: "Alex",
    interventionDate: "2026-03-01",
    interventionType: "environmental_modification",
    facilitatedBy: "Tom Richards",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-04",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-02-10",
    interventionType: "therapeutic_activity",
    facilitatedBy: "Lisa Williams",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-05",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-03-05",
    interventionType: "equipment_provision",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "partially_effective",
    childResponse: "neutral",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-06",
    childId: "child-jordan",
    childName: "Jordan",
    interventionDate: "2026-03-20",
    interventionType: "sensory_diet",
    facilitatedBy: "Darren Laville",
    effectiveness: "highly_effective",
    childResponse: "positive",
    sensoryPlanFollowed: true,
  },
  {
    id: "si-07",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-02-20",
    interventionType: "alerting_strategy",
    facilitatedBy: "Tom Richards",
    effectiveness: "effective",
    childResponse: "positive",
    sensoryPlanFollowed: false,
  },
  {
    id: "si-08",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-03-10",
    interventionType: "calming_strategy",
    facilitatedBy: "Lisa Williams",
    effectiveness: "not_effective",
    childResponse: "negative",
    sensoryPlanFollowed: false,
  },
  {
    id: "si-09",
    childId: "child-morgan",
    childName: "Morgan",
    interventionDate: "2026-04-01",
    interventionType: "therapeutic_activity",
    facilitatedBy: "Sarah Johnson",
    effectiveness: "effective",
    childResponse: "neutral",
    sensoryPlanFollowed: true,
  },
];

const DEMO_POLICIES: SensoryPolicy[] = [
  {
    id: "sp-01",
    sensoryScreeningRoutine: true,
    occupationalTherapyAccess: true,
    environmentalAuditCompleted: true,
    sensoryToolsAvailable: true,
    staffTrainingProvided: true,
    individualSensoryPlans: true,
    parentCarerInvolvement: false,
  },
];

const DEMO_TRAINING: StaffSensoryTraining[] = [
  {
    id: "st-01",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: true,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: true,
  },
  {
    id: "st-02",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: true,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: false,
  },
  {
    id: "st-03",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    sensoryAwareness: true,
    sensoryAssessment: true,
    environmentalAdaptation: false,
    interventionDelivery: true,
    calmingStrategies: true,
    equipmentUse: true,
  },
  {
    id: "st-04",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    sensoryAwareness: true,
    sensoryAssessment: false,
    environmentalAdaptation: true,
    interventionDelivery: false,
    calmingStrategies: true,
    equipmentUse: false,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(5, 5)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
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

// ══════════════════════════════════════════════════════════════════════════════
// Label Getter Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("getSensoryNeedLabel", () => {
  it("returns correct label for hyper_auditory", () => {
    expect(getSensoryNeedLabel("hyper_auditory")).toBe("Hyper-Auditory");
  });

  it("returns correct label for hypo_auditory", () => {
    expect(getSensoryNeedLabel("hypo_auditory")).toBe("Hypo-Auditory");
  });

  it("returns correct label for hyper_visual", () => {
    expect(getSensoryNeedLabel("hyper_visual")).toBe("Hyper-Visual");
  });

  it("returns correct label for hypo_visual", () => {
    expect(getSensoryNeedLabel("hypo_visual")).toBe("Hypo-Visual");
  });

  it("returns correct label for hyper_tactile", () => {
    expect(getSensoryNeedLabel("hyper_tactile")).toBe("Hyper-Tactile");
  });

  it("returns correct label for hypo_tactile", () => {
    expect(getSensoryNeedLabel("hypo_tactile")).toBe("Hypo-Tactile");
  });

  it("returns correct label for hyper_vestibular", () => {
    expect(getSensoryNeedLabel("hyper_vestibular")).toBe("Hyper-Vestibular");
  });

  it("returns correct label for hypo_vestibular", () => {
    expect(getSensoryNeedLabel("hypo_vestibular")).toBe("Hypo-Vestibular");
  });

  it("returns correct label for hyper_proprioceptive", () => {
    expect(getSensoryNeedLabel("hyper_proprioceptive")).toBe("Hyper-Proprioceptive");
  });

  it("returns correct label for hypo_proprioceptive", () => {
    expect(getSensoryNeedLabel("hypo_proprioceptive")).toBe("Hypo-Proprioceptive");
  });

  it("returns correct label for mixed", () => {
    expect(getSensoryNeedLabel("mixed")).toBe("Mixed");
  });
});

describe("getInterventionTypeLabel", () => {
  it("returns correct label for sensory_diet", () => {
    expect(getInterventionTypeLabel("sensory_diet")).toBe("Sensory Diet");
  });

  it("returns correct label for environmental_modification", () => {
    expect(getInterventionTypeLabel("environmental_modification")).toBe("Environmental Modification");
  });

  it("returns correct label for therapeutic_activity", () => {
    expect(getInterventionTypeLabel("therapeutic_activity")).toBe("Therapeutic Activity");
  });

  it("returns correct label for calming_strategy", () => {
    expect(getInterventionTypeLabel("calming_strategy")).toBe("Calming Strategy");
  });

  it("returns correct label for alerting_strategy", () => {
    expect(getInterventionTypeLabel("alerting_strategy")).toBe("Alerting Strategy");
  });

  it("returns correct label for equipment_provision", () => {
    expect(getInterventionTypeLabel("equipment_provision")).toBe("Equipment Provision");
  });

  it("returns correct label for other", () => {
    expect(getInterventionTypeLabel("other")).toBe("Other");
  });
});

describe("getEffectivenessLabel", () => {
  it("returns correct label for highly_effective", () => {
    expect(getEffectivenessLabel("highly_effective")).toBe("Highly Effective");
  });

  it("returns correct label for effective", () => {
    expect(getEffectivenessLabel("effective")).toBe("Effective");
  });

  it("returns correct label for partially_effective", () => {
    expect(getEffectivenessLabel("partially_effective")).toBe("Partially Effective");
  });

  it("returns correct label for not_effective", () => {
    expect(getEffectivenessLabel("not_effective")).toBe("Not Effective");
  });

  it("returns correct label for not_assessed", () => {
    expect(getEffectivenessLabel("not_assessed")).toBe("Not Assessed");
  });
});

describe("getChildResponseLabel", () => {
  it("returns correct label for positive", () => {
    expect(getChildResponseLabel("positive")).toBe("Positive");
  });

  it("returns correct label for neutral", () => {
    expect(getChildResponseLabel("neutral")).toBe("Neutral");
  });

  it("returns correct label for negative", () => {
    expect(getChildResponseLabel("negative")).toBe("Negative");
  });

  it("returns correct label for distressed", () => {
    expect(getChildResponseLabel("distressed")).toBe("Distressed");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Assessment Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAssessmentQuality", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateAssessmentQuality([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.sensoryPlanRate).toBe(0);
    expect(result.otReferralRate).toBe(0);
    expect(result.environmentAdaptedRate).toBe(0);
    expect(result.parentInformedRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates correct totals with demo data", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    expect(result.totalAssessments).toBe(3);
  });

  it("calculates sensory plan rate correctly", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    // All 3 have sensoryPlanInPlace = true
    expect(result.sensoryPlanRate).toBe(100);
  });

  it("calculates OT referral rate correctly", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    // 2 out of 3 have OT referral
    expect(result.otReferralRate).toBe(67);
  });

  it("calculates environment adapted rate correctly", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    // All 3 have environment adapted
    expect(result.environmentAdaptedRate).toBe(100);
  });

  it("calculates parent informed rate correctly", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    // 2 out of 3 have parent informed
    expect(result.parentInformedRate).toBe(67);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives maximum score for perfect assessments", () => {
    const perfect: SensoryAssessment[] = [
      {
        id: "p-01",
        childId: "c1",
        childName: "Child 1",
        assessmentDate: "2026-03-01",
        assessedBy: "Staff",
        sensoryNeeds: ["hyper_auditory"],
        sensoryPlanInPlace: true,
        occupationalTherapyReferred: true,
        environmentAdapted: true,
        parentCarerInformed: true,
      },
    ];
    const result = evaluateAssessmentQuality(perfect);
    expect(result.score).toBe(25);
  });

  it("gives low score when all booleans are false", () => {
    const poor: SensoryAssessment[] = [
      {
        id: "p-01",
        childId: "c1",
        childName: "Child 1",
        assessmentDate: "2026-03-01",
        assessedBy: "Staff",
        sensoryNeeds: ["hyper_auditory"],
        sensoryPlanInPlace: false,
        occupationalTherapyReferred: false,
        environmentAdapted: false,
        parentCarerInformed: false,
      },
    ];
    const result = evaluateAssessmentQuality(poor);
    expect(result.score).toBe(0);
  });

  it("handles single assessment correctly", () => {
    const single: SensoryAssessment[] = [DEMO_ASSESSMENTS[0]];
    const result = evaluateAssessmentQuality(single);
    expect(result.totalAssessments).toBe(1);
    expect(result.sensoryPlanRate).toBe(100);
    expect(result.otReferralRate).toBe(100);
  });

  it("caps score at 25", () => {
    const result = evaluateAssessmentQuality(DEMO_ASSESSMENTS);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Intervention Effectiveness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInterventionEffectiveness", () => {
  it("returns zero scores for empty interventions", () => {
    const result = evaluateInterventionEffectiveness([]);
    expect(result.totalInterventions).toBe(0);
    expect(result.effectivenessRate).toBe(0);
    expect(result.positiveResponseRate).toBe(0);
    expect(result.sensoryPlanFollowedRate).toBe(0);
    expect(result.interventionVariety).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates correct totals with demo data", () => {
    const result = evaluateInterventionEffectiveness(DEMO_INTERVENTIONS);
    expect(result.totalInterventions).toBe(9);
  });

  it("calculates effectiveness rate correctly", () => {
    const result = evaluateInterventionEffectiveness(DEMO_INTERVENTIONS);
    // highly_effective: 2, effective: 5 = 7 out of 9
    expect(result.effectivenessRate).toBe(78);
  });

  it("calculates positive response rate correctly", () => {
    const result = evaluateInterventionEffectiveness(DEMO_INTERVENTIONS);
    // positive: 6 out of 9
    expect(result.positiveResponseRate).toBe(67);
  });

  it("calculates sensory plan followed rate correctly", () => {
    const result = evaluateInterventionEffectiveness(DEMO_INTERVENTIONS);
    // followed: 7 out of 9
    expect(result.sensoryPlanFollowedRate).toBe(78);
  });

  it("counts intervention variety correctly", () => {
    const result = evaluateInterventionEffectiveness(DEMO_INTERVENTIONS);
    // Types: sensory_diet, calming_strategy, environmental_modification,
    //        therapeutic_activity, equipment_provision, alerting_strategy = 6
    expect(result.interventionVariety).toBe(6);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateInterventionEffectiveness(DEMO_INTERVENTIONS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives high score for all positive interventions", () => {
    const perfect: SensoryIntervention[] = [
      {
        id: "i-01",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-01",
        interventionType: "sensory_diet",
        facilitatedBy: "Staff",
        effectiveness: "highly_effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
      {
        id: "i-02",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-02",
        interventionType: "calming_strategy",
        facilitatedBy: "Staff",
        effectiveness: "effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
      {
        id: "i-03",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-03",
        interventionType: "environmental_modification",
        facilitatedBy: "Staff",
        effectiveness: "highly_effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
      {
        id: "i-04",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-04",
        interventionType: "therapeutic_activity",
        facilitatedBy: "Staff",
        effectiveness: "effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
      {
        id: "i-05",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-05",
        interventionType: "alerting_strategy",
        facilitatedBy: "Staff",
        effectiveness: "highly_effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
    ];
    const result = evaluateInterventionEffectiveness(perfect);
    expect(result.score).toBe(25);
  });

  it("gives zero score for all ineffective interventions", () => {
    const poor: SensoryIntervention[] = [
      {
        id: "i-01",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-01",
        interventionType: "sensory_diet",
        facilitatedBy: "Staff",
        effectiveness: "not_effective",
        childResponse: "distressed",
        sensoryPlanFollowed: false,
      },
    ];
    const result = evaluateInterventionEffectiveness(poor);
    // effectiveness=0, positive=0, planFollowed=0, variety=1 => ~1
    expect(result.score).toBeLessThanOrEqual(2);
  });

  it("counts only unique intervention types for variety", () => {
    const repeated: SensoryIntervention[] = [
      {
        id: "i-01",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-01",
        interventionType: "sensory_diet",
        facilitatedBy: "Staff",
        effectiveness: "effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
      {
        id: "i-02",
        childId: "c1",
        childName: "Child 1",
        interventionDate: "2026-03-02",
        interventionType: "sensory_diet",
        facilitatedBy: "Staff",
        effectiveness: "effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
    ];
    const result = evaluateInterventionEffectiveness(repeated);
    expect(result.interventionVariety).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Sensory Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSensoryPolicy", () => {
  it("returns zero score for empty policies", () => {
    const result = evaluateSensoryPolicy([]);
    expect(result.score).toBe(0);
    expect(result.sensoryScreeningRoutine).toBe(false);
    expect(result.occupationalTherapyAccess).toBe(false);
    expect(result.environmentalAuditCompleted).toBe(false);
    expect(result.sensoryToolsAvailable).toBe(false);
    expect(result.staffTrainingProvided).toBe(false);
    expect(result.individualSensoryPlans).toBe(false);
    expect(result.parentCarerInvolvement).toBe(false);
  });

  it("calculates correct score with demo policy", () => {
    const result = evaluateSensoryPolicy(DEMO_POLICIES);
    // All true except parentCarerInvolvement
    // 4+4+4+4+3+3+0 = 22
    expect(result.score).toBe(22);
  });

  it("returns max score when all fields are true", () => {
    const perfect: SensoryPolicy[] = [
      {
        id: "sp-01",
        sensoryScreeningRoutine: true,
        occupationalTherapyAccess: true,
        environmentalAuditCompleted: true,
        sensoryToolsAvailable: true,
        staffTrainingProvided: true,
        individualSensoryPlans: true,
        parentCarerInvolvement: true,
      },
    ];
    const result = evaluateSensoryPolicy(perfect);
    expect(result.score).toBe(25);
  });

  it("returns zero when all fields are false", () => {
    const empty: SensoryPolicy[] = [
      {
        id: "sp-01",
        sensoryScreeningRoutine: false,
        occupationalTherapyAccess: false,
        environmentalAuditCompleted: false,
        sensoryToolsAvailable: false,
        staffTrainingProvided: false,
        individualSensoryPlans: false,
        parentCarerInvolvement: false,
      },
    ];
    const result = evaluateSensoryPolicy(empty);
    expect(result.score).toBe(0);
  });

  it("uses the last policy when multiple are provided", () => {
    const multiple: SensoryPolicy[] = [
      {
        id: "sp-01",
        sensoryScreeningRoutine: true,
        occupationalTherapyAccess: true,
        environmentalAuditCompleted: true,
        sensoryToolsAvailable: true,
        staffTrainingProvided: true,
        individualSensoryPlans: true,
        parentCarerInvolvement: true,
      },
      {
        id: "sp-02",
        sensoryScreeningRoutine: false,
        occupationalTherapyAccess: false,
        environmentalAuditCompleted: false,
        sensoryToolsAvailable: false,
        staffTrainingProvided: false,
        individualSensoryPlans: false,
        parentCarerInvolvement: false,
      },
    ];
    const result = evaluateSensoryPolicy(multiple);
    expect(result.score).toBe(0);
  });

  it("correctly reflects each boolean field", () => {
    const result = evaluateSensoryPolicy(DEMO_POLICIES);
    expect(result.sensoryScreeningRoutine).toBe(true);
    expect(result.occupationalTherapyAccess).toBe(true);
    expect(result.environmentalAuditCompleted).toBe(true);
    expect(result.sensoryToolsAvailable).toBe(true);
    expect(result.staffTrainingProvided).toBe(true);
    expect(result.individualSensoryPlans).toBe(true);
    expect(result.parentCarerInvolvement).toBe(false);
  });

  it("scores individual fields correctly", () => {
    // Only sensoryScreeningRoutine = 4 pts
    const single: SensoryPolicy[] = [
      {
        id: "sp-01",
        sensoryScreeningRoutine: true,
        occupationalTherapyAccess: false,
        environmentalAuditCompleted: false,
        sensoryToolsAvailable: false,
        staffTrainingProvided: false,
        individualSensoryPlans: false,
        parentCarerInvolvement: false,
      },
    ];
    const result = evaluateSensoryPolicy(single);
    expect(result.score).toBe(4);
  });

  it("scores parentCarerInvolvement as 3 pts", () => {
    const single: SensoryPolicy[] = [
      {
        id: "sp-01",
        sensoryScreeningRoutine: false,
        occupationalTherapyAccess: false,
        environmentalAuditCompleted: false,
        sensoryToolsAvailable: false,
        staffTrainingProvided: false,
        individualSensoryPlans: false,
        parentCarerInvolvement: true,
      },
    ];
    const result = evaluateSensoryPolicy(single);
    expect(result.score).toBe(3);
  });

  it("caps score at 25", () => {
    const perfect: SensoryPolicy[] = [
      {
        id: "sp-01",
        sensoryScreeningRoutine: true,
        occupationalTherapyAccess: true,
        environmentalAuditCompleted: true,
        sensoryToolsAvailable: true,
        staffTrainingProvided: true,
        individualSensoryPlans: true,
        parentCarerInvolvement: true,
      },
    ];
    const result = evaluateSensoryPolicy(perfect);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Sensory Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffSensoryReadiness", () => {
  it("returns zero scores for empty training", () => {
    const result = evaluateStaffSensoryReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.averageCompetencyRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates correct staff count", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    expect(result.totalStaff).toBe(4);
  });

  it("calculates sensory awareness rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // All 4 have sensory awareness
    expect(result.sensoryAwarenessRate).toBe(100);
  });

  it("calculates sensory assessment rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // 3 out of 4
    expect(result.sensoryAssessmentRate).toBe(75);
  });

  it("calculates environmental adaptation rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // 3 out of 4
    expect(result.environmentalAdaptationRate).toBe(75);
  });

  it("calculates intervention delivery rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // 3 out of 4
    expect(result.interventionDeliveryRate).toBe(75);
  });

  it("calculates calming strategies rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // All 4
    expect(result.calmingStrategiesRate).toBe(100);
  });

  it("calculates equipment use rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // 2 out of 4
    expect(result.equipmentUseRate).toBe(50);
  });

  it("produces score between 0 and 25", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives maximum score for fully trained staff", () => {
    const perfect: StaffSensoryTraining[] = [
      {
        id: "st-01",
        staffId: "s1",
        staffName: "Staff 1",
        sensoryAwareness: true,
        sensoryAssessment: true,
        environmentalAdaptation: true,
        interventionDelivery: true,
        calmingStrategies: true,
        equipmentUse: true,
      },
    ];
    const result = evaluateStaffSensoryReadiness(perfect);
    expect(result.score).toBe(25);
  });

  it("gives zero score for completely untrained staff", () => {
    const untrained: StaffSensoryTraining[] = [
      {
        id: "st-01",
        staffId: "s1",
        staffName: "Staff 1",
        sensoryAwareness: false,
        sensoryAssessment: false,
        environmentalAdaptation: false,
        interventionDelivery: false,
        calmingStrategies: false,
        equipmentUse: false,
      },
    ];
    const result = evaluateStaffSensoryReadiness(untrained);
    expect(result.score).toBe(0);
    expect(result.averageCompetencyRate).toBe(0);
  });

  it("calculates average competency rate correctly", () => {
    const result = evaluateStaffSensoryReadiness(DEMO_TRAINING);
    // Total true: Sarah=6, Tom=5, Lisa=5, Darren=3 = 19 out of 24
    expect(result.averageCompetencyRate).toBe(79);
  });

  it("weights sensory awareness highest in scoring", () => {
    // Only sensoryAwareness true => weight is 6
    const awarenessOnly: StaffSensoryTraining[] = [
      {
        id: "st-01",
        staffId: "s1",
        staffName: "Staff 1",
        sensoryAwareness: true,
        sensoryAssessment: false,
        environmentalAdaptation: false,
        interventionDelivery: false,
        calmingStrategies: false,
        equipmentUse: false,
      },
    ];
    const result = evaluateStaffSensoryReadiness(awarenessOnly);
    expect(result.score).toBe(6);
  });

  it("weights equipment use lowest in scoring", () => {
    // Only equipmentUse true => weight is 2
    const equipmentOnly: StaffSensoryTraining[] = [
      {
        id: "st-01",
        staffId: "s1",
        staffName: "Staff 1",
        sensoryAwareness: false,
        sensoryAssessment: false,
        environmentalAdaptation: false,
        interventionDelivery: false,
        calmingStrategies: false,
        equipmentUse: true,
      },
    ];
    const result = evaluateStaffSensoryReadiness(equipmentOnly);
    expect(result.score).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Build Child Sensory Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildSensoryProfiles", () => {
  it("returns a profile for each child", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles).toHaveLength(3);
  });

  it("assigns correct child names", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[1].childName).toBe("Jordan");
    expect(profiles[2].childName).toBe("Morgan");
  });

  it("assigns correct child IDs", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[1].childId).toBe("child-jordan");
    expect(profiles[2].childId).toBe("child-morgan");
  });

  it("identifies sensory needs from latest assessment", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles[0].sensoryNeeds).toEqual(["hyper_auditory", "hypo_proprioceptive"]);
    expect(profiles[1].sensoryNeeds).toEqual(["hyper_tactile", "hyper_visual"]);
  });

  it("captures sensory plan status", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles[0].hasSensoryPlan).toBe(true);
    expect(profiles[2].hasSensoryPlan).toBe(true);
  });

  it("counts interventions per child correctly", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles[0].interventionCount).toBe(3); // Alex
    expect(profiles[1].interventionCount).toBe(3); // Jordan
    expect(profiles[2].interventionCount).toBe(3); // Morgan
  });

  it("calculates positive response rate per child", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    expect(profiles[0].positiveResponseRate).toBe(100); // Alex: 3/3
    expect(profiles[1].positiveResponseRate).toBe(67);  // Jordan: 2/3
    expect(profiles[2].positiveResponseRate).toBe(33);  // Morgan: 1/3
  });

  it("produces scores between 0 and 10", () => {
    const profiles = buildChildSensoryProfiles(
      DEMO_ASSESSMENTS,
      DEMO_INTERVENTIONS,
      CHILD_IDS,
      CHILD_NAMES,
    );
    for (const p of profiles) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("handles child with no assessments or interventions", () => {
    const profiles = buildChildSensoryProfiles(
      [],
      [],
      ["child-unknown"],
      ["Unknown"],
    );
    expect(profiles).toHaveLength(1);
    expect(profiles[0].sensoryNeeds).toEqual([]);
    expect(profiles[0].hasSensoryPlan).toBe(false);
    expect(profiles[0].interventionCount).toBe(0);
    expect(profiles[0].positiveResponseRate).toBe(0);
    expect(profiles[0].overallScore).toBe(0);
  });

  it("uses latest assessment when multiple exist for a child", () => {
    const multipleAssessments: SensoryAssessment[] = [
      {
        id: "sa-early",
        childId: "c1",
        childName: "Child 1",
        assessmentDate: "2026-01-01",
        assessedBy: "Staff",
        sensoryNeeds: ["hyper_auditory"],
        sensoryPlanInPlace: false,
        occupationalTherapyReferred: false,
        environmentAdapted: false,
        parentCarerInformed: false,
      },
      {
        id: "sa-late",
        childId: "c1",
        childName: "Child 1",
        assessmentDate: "2026-03-01",
        assessedBy: "Staff",
        sensoryNeeds: ["hyper_visual", "mixed"],
        sensoryPlanInPlace: true,
        occupationalTherapyReferred: true,
        environmentAdapted: true,
        parentCarerInformed: true,
      },
    ];
    const profiles = buildChildSensoryProfiles(
      multipleAssessments,
      [],
      ["c1"],
      ["Child 1"],
    );
    expect(profiles[0].sensoryNeeds).toEqual(["hyper_visual", "mixed"]);
    expect(profiles[0].hasSensoryPlan).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator: generateSensoryProcessingSupportIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSensoryProcessingSupportIntelligence", () => {
  const result = generateSensoryProcessingSupportIntelligence(
    DEMO_ASSESSMENTS,
    DEMO_INTERVENTIONS,
    DEMO_POLICIES,
    DEMO_TRAINING,
    CHILD_IDS,
    CHILD_NAMES,
    HOME_ID,
    PERIOD_START,
    PERIOD_END,
    REFERENCE_DATE,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns correct referenceDate", () => {
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("produces overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    const validRatings: Rating[] = ["outstanding", "good", "requires_improvement", "inadequate"];
    expect(validRatings).toContain(result.rating);
  });

  it("rating matches score threshold", () => {
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("includes assessmentQuality result", () => {
    expect(result.assessmentQuality).toBeDefined();
    expect(result.assessmentQuality.score).toBeGreaterThanOrEqual(0);
    expect(result.assessmentQuality.score).toBeLessThanOrEqual(25);
  });

  it("includes interventionEffectiveness result", () => {
    expect(result.interventionEffectiveness).toBeDefined();
    expect(result.interventionEffectiveness.score).toBeGreaterThanOrEqual(0);
    expect(result.interventionEffectiveness.score).toBeLessThanOrEqual(25);
  });

  it("includes sensoryPolicy result", () => {
    expect(result.sensoryPolicy).toBeDefined();
    expect(result.sensoryPolicy.score).toBeGreaterThanOrEqual(0);
    expect(result.sensoryPolicy.score).toBeLessThanOrEqual(25);
  });

  it("includes staffReadiness result", () => {
    expect(result.staffReadiness).toBeDefined();
    expect(result.staffReadiness.score).toBeGreaterThanOrEqual(0);
    expect(result.staffReadiness.score).toBeLessThanOrEqual(25);
  });

  it("overall score equals sum of evaluator scores", () => {
    const expected = Math.min(
      100,
      result.assessmentQuality.score +
        result.interventionEffectiveness.score +
        result.sensoryPolicy.score +
        result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(expected);
  });

  it("includes child profiles for all children", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths array", () => {
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areasForImprovement array", () => {
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("references CHR 2015 Reg 10 in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
  });

  it("references CHR 2015 Reg 12 in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
  });

  it("references SCCIF in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("references SEND Code of Practice 2015 in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("SEND Code of Practice 2015"))).toBe(true);
  });

  it("references NMS 3 in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
  });

  it("references Children Act 1989 in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("references NICE CG170 in regulatory links", () => {
    expect(result.regulatoryLinks.some((l) => l.includes("NICE CG170"))).toBe(true);
  });

  it("filters assessments to period", () => {
    // All 3 demo assessments are within the period
    expect(result.assessmentQuality.totalAssessments).toBe(3);
  });

  it("filters interventions to period", () => {
    // All 9 demo interventions are within the period
    expect(result.interventionEffectiveness.totalInterventions).toBe(9);
  });

  it("handles empty inputs gracefully", () => {
    const emptyResult = generateSensoryProcessingSupportIntelligence(
      [],
      [],
      [],
      [],
      CHILD_IDS,
      CHILD_NAMES,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(emptyResult.overallScore).toBe(0);
    expect(emptyResult.rating).toBe("inadequate");
    expect(emptyResult.childProfiles).toHaveLength(3);
  });

  it("handles no children gracefully", () => {
    const noChildrenResult = generateSensoryProcessingSupportIntelligence(
      [],
      [],
      [],
      [],
      [],
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(noChildrenResult.overallScore).toBe(0);
    expect(noChildrenResult.childProfiles).toHaveLength(0);
  });

  it("excludes out-of-period assessments", () => {
    const outOfPeriod: SensoryAssessment[] = [
      {
        id: "sa-old",
        childId: "child-alex",
        childName: "Alex",
        assessmentDate: "2025-06-01",
        assessedBy: "Staff",
        sensoryNeeds: ["hyper_auditory"],
        sensoryPlanInPlace: true,
        occupationalTherapyReferred: true,
        environmentAdapted: true,
        parentCarerInformed: true,
      },
    ];
    const outResult = generateSensoryProcessingSupportIntelligence(
      outOfPeriod,
      [],
      DEMO_POLICIES,
      DEMO_TRAINING,
      CHILD_IDS,
      CHILD_NAMES,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(outResult.assessmentQuality.totalAssessments).toBe(0);
  });

  it("excludes out-of-period interventions", () => {
    const outOfPeriod: SensoryIntervention[] = [
      {
        id: "si-old",
        childId: "child-alex",
        childName: "Alex",
        interventionDate: "2025-06-01",
        interventionType: "sensory_diet",
        facilitatedBy: "Staff",
        effectiveness: "effective",
        childResponse: "positive",
        sensoryPlanFollowed: true,
      },
    ];
    const outResult = generateSensoryProcessingSupportIntelligence(
      [],
      outOfPeriod,
      DEMO_POLICIES,
      DEMO_TRAINING,
      CHILD_IDS,
      CHILD_NAMES,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(outResult.interventionEffectiveness.totalInterventions).toBe(0);
  });

  it("generates strength for high sensory plan rate", () => {
    const highPlanAssessments: SensoryAssessment[] = DEMO_ASSESSMENTS.map((a) => ({
      ...a,
      sensoryPlanInPlace: true,
    }));
    const r = generateSensoryProcessingSupportIntelligence(
      highPlanAssessments,
      DEMO_INTERVENTIONS,
      DEMO_POLICIES,
      DEMO_TRAINING,
      CHILD_IDS,
      CHILD_NAMES,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(r.strengths.some((s) => s.includes("Sensory plans"))).toBe(true);
  });

  it("generates area for improvement when OT referral rate is low", () => {
    const lowOT: SensoryAssessment[] = DEMO_ASSESSMENTS.map((a) => ({
      ...a,
      occupationalTherapyReferred: false,
    }));
    const r = generateSensoryProcessingSupportIntelligence(
      lowOT,
      DEMO_INTERVENTIONS,
      DEMO_POLICIES,
      DEMO_TRAINING,
      CHILD_IDS,
      CHILD_NAMES,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(r.areasForImprovement.some((a) => a.includes("Occupational therapy"))).toBe(true);
  });
});
