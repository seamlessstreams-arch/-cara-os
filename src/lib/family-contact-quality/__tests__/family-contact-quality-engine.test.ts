import { describe, it, expect } from "vitest";
import {
  evaluateFamilyContactQuality,
  evaluateFamilyContactCompliance,
  evaluateFamilyContactPolicy,
  evaluateStaffFamilyContactReadiness,
  buildChildFamilyContactProfiles,
  generateFamilyContactQualityIntelligence,
  pct,
  getRating,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getRatingLabel,
} from "../family-contact-quality-engine";
import type {
  FamilyContact,
  FamilyContactPolicy,
  StaffFamilyContactTraining,
} from "../family-contact-quality-engine";

// ── Factory Helpers ─────────────────────────────────────────────────────────

let _contactId = 0;
function makeContact(overrides: Partial<FamilyContact> = {}): FamilyContact {
  _contactId++;
  return {
    id: `fc-${_contactId}`,
    childId: "child-alex",
    childName: "Alex",
    contactDate: "2026-03-15",
    contactType: "face_to_face_visit",
    contactOutcome: "positive",
    childPrepared: true,
    childConsulted: true,
    supportProvided: true,
    documentedInPlan: true,
    staffSupervised: true,
    feedbackRecorded: true,
    ...overrides,
  };
}

let _policyId = 0;
function makePolicy(overrides: Partial<FamilyContactPolicy> = {}): FamilyContactPolicy {
  _policyId++;
  return {
    id: `pol-${_policyId}`,
    contactPromotionStrategy: true,
    safeguardingProtocol: true,
    supervisedContactProcedure: true,
    letteringAndPhonePolicy: true,
    siblingContactFramework: true,
    familyEngagementPlan: true,
    regularReview: true,
    ...overrides,
  };
}

let _trainingId = 0;
function makeTraining(overrides: Partial<StaffFamilyContactTraining> = {}): StaffFamilyContactTraining {
  _trainingId++;
  return {
    id: `tr-${_trainingId}`,
    staffId: `staff-${_trainingId}`,
    staffName: `Staff ${_trainingId}`,
    familyDynamicsAwareness: true,
    contactSupervision: true,
    safeguardingInContact: true,
    childPreparationSkills: true,
    conflictManagement: true,
    recordKeeping: true,
    ...overrides,
  };
}

// ── pct() ───────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ── getRating() ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ── Label Functions ─────────────────────────────────────────────────────────

describe("getContactTypeLabel", () => {
  it("returns Face-to-Face Visit", () => {
    expect(getContactTypeLabel("face_to_face_visit")).toBe("Face-to-Face Visit");
  });
  it("returns Video Call", () => {
    expect(getContactTypeLabel("video_call")).toBe("Video Call");
  });
  it("returns Phone Call", () => {
    expect(getContactTypeLabel("phone_call")).toBe("Phone Call");
  });
  it("returns Letter / Email", () => {
    expect(getContactTypeLabel("letter_email")).toBe("Letter / Email");
  });
  it("returns Supervised Contact", () => {
    expect(getContactTypeLabel("supervised_contact")).toBe("Supervised Contact");
  });
  it("returns Unsupervised Contact", () => {
    expect(getContactTypeLabel("unsupervised_contact")).toBe("Unsupervised Contact");
  });
  it("returns Family Activity", () => {
    expect(getContactTypeLabel("family_activity")).toBe("Family Activity");
  });
  it("returns Sibling Contact", () => {
    expect(getContactTypeLabel("sibling_contact")).toBe("Sibling Contact");
  });
});

describe("getContactOutcomeLabel", () => {
  it("returns Very Positive", () => {
    expect(getContactOutcomeLabel("very_positive")).toBe("Very Positive");
  });
  it("returns Positive", () => {
    expect(getContactOutcomeLabel("positive")).toBe("Positive");
  });
  it("returns Neutral", () => {
    expect(getContactOutcomeLabel("neutral")).toBe("Neutral");
  });
  it("returns Difficult", () => {
    expect(getContactOutcomeLabel("difficult")).toBe("Difficult");
  });
  it("returns Distressing", () => {
    expect(getContactOutcomeLabel("distressing")).toBe("Distressing");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateFamilyContactQuality ────────────────────────────────────────────

describe("evaluateFamilyContactQuality", () => {
  it("returns all zeros for empty contacts", () => {
    const r = evaluateFamilyContactQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalContacts).toBe(0);
    expect(r.positiveOutcomeRate).toBe(0);
    expect(r.childPreparedRate).toBe(0);
    expect(r.childConsultedRate).toBe(0);
    expect(r.supportRate).toBe(0);
  });

  it("scores 25 for single perfect contact", () => {
    const c = makeContact({ contactOutcome: "very_positive" });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.overallScore).toBe(25);
    expect(r.positiveOutcomeRate).toBe(100);
    expect(r.childPreparedRate).toBe(100);
    expect(r.childConsultedRate).toBe(100);
    expect(r.supportRate).toBe(100);
  });

  it("counts very_positive as positive outcome", () => {
    const c = makeContact({ contactOutcome: "very_positive" });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.positiveOutcomeRate).toBe(100);
  });

  it("counts positive as positive outcome", () => {
    const c = makeContact({ contactOutcome: "positive" });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.positiveOutcomeRate).toBe(100);
  });

  it("does not count neutral as positive outcome", () => {
    const c = makeContact({ contactOutcome: "neutral" });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.positiveOutcomeRate).toBe(0);
  });

  it("does not count difficult as positive outcome", () => {
    const c = makeContact({ contactOutcome: "difficult" });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.positiveOutcomeRate).toBe(0);
  });

  it("does not count distressing as positive outcome", () => {
    const c = makeContact({ contactOutcome: "distressing" });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.positiveOutcomeRate).toBe(0);
  });

  it("all false booleans score 0", () => {
    const c = makeContact({
      contactOutcome: "difficult",
      childPrepared: false,
      childConsulted: false,
      supportProvided: false,
    });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.overallScore).toBe(0);
  });

  it("mixed outcomes produce mid-range score", () => {
    const good = makeContact({ contactOutcome: "very_positive" });
    const bad = makeContact({
      contactOutcome: "difficult",
      childPrepared: false,
      childConsulted: false,
      supportProvided: false,
    });
    const r = evaluateFamilyContactQuality([good, bad]);
    expect(r.positiveOutcomeRate).toBe(50);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("score capped at 25", () => {
    const contacts = Array.from({ length: 20 }, () =>
      makeContact({ contactOutcome: "very_positive" }),
    );
    const r = evaluateFamilyContactQuality(contacts);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("tracks totalContacts correctly", () => {
    const contacts = [makeContact(), makeContact(), makeContact()];
    const r = evaluateFamilyContactQuality(contacts);
    expect(r.totalContacts).toBe(3);
  });

  it("calculates childPreparedRate correctly with mix", () => {
    const prepared = makeContact();
    const notPrepared = makeContact({ childPrepared: false });
    const r = evaluateFamilyContactQuality([prepared, notPrepared]);
    expect(r.childPreparedRate).toBe(50);
  });

  it("calculates childConsultedRate correctly with mix", () => {
    const consulted = makeContact();
    const notConsulted = makeContact({ childConsulted: false });
    const r = evaluateFamilyContactQuality([consulted, notConsulted]);
    expect(r.childConsultedRate).toBe(50);
  });

  it("calculates supportRate correctly with mix", () => {
    const supported = makeContact();
    const notSupported = makeContact({ supportProvided: false });
    const r = evaluateFamilyContactQuality([supported, notSupported]);
    expect(r.supportRate).toBe(50);
  });

  it("weight verification: positiveOutcome max 7", () => {
    // 100% positive -> Math.round(1 * 7) = 7
    const c = makeContact({
      contactOutcome: "very_positive",
      childPrepared: false,
      childConsulted: false,
      supportProvided: false,
    });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.overallScore).toBe(7);
  });

  it("weight verification: childPrepared max 6", () => {
    const c = makeContact({
      contactOutcome: "difficult",
      childPrepared: true,
      childConsulted: false,
      supportProvided: false,
    });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.overallScore).toBe(6);
  });

  it("weight verification: childConsulted max 6", () => {
    const c = makeContact({
      contactOutcome: "difficult",
      childPrepared: false,
      childConsulted: true,
      supportProvided: false,
    });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.overallScore).toBe(6);
  });

  it("weight verification: support max 6", () => {
    const c = makeContact({
      contactOutcome: "difficult",
      childPrepared: false,
      childConsulted: false,
      supportProvided: true,
    });
    const r = evaluateFamilyContactQuality([c]);
    expect(r.overallScore).toBe(6);
  });
});

// ── evaluateFamilyContactCompliance ─────────────────────────────────────────

describe("evaluateFamilyContactCompliance", () => {
  it("returns all zeros for empty contacts", () => {
    const r = evaluateFamilyContactCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.staffSupervisedRate).toBe(0);
    expect(r.feedbackRate).toBe(0);
    expect(r.contactTypeDiversityRatio).toBe(0);
  });

  it("scores high for fully compliant contacts with diverse types", () => {
    const types = [
      "face_to_face_visit", "video_call", "phone_call", "letter_email",
      "supervised_contact", "unsupervised_contact", "family_activity", "sibling_contact",
    ] as const;
    const contacts = types.map((t) => makeContact({ contactType: t }));
    const r = evaluateFamilyContactCompliance(contacts);
    expect(r.overallScore).toBe(25);
    expect(r.documentedRate).toBe(100);
    expect(r.staffSupervisedRate).toBe(100);
    expect(r.feedbackRate).toBe(100);
    expect(r.contactTypeDiversityRatio).toBe(100);
  });

  it("calculates documentedRate correctly", () => {
    const doc = makeContact();
    const notDoc = makeContact({ documentedInPlan: false });
    const r = evaluateFamilyContactCompliance([doc, notDoc]);
    expect(r.documentedRate).toBe(50);
  });

  it("calculates staffSupervisedRate correctly", () => {
    const sup = makeContact();
    const notSup = makeContact({ staffSupervised: false });
    const r = evaluateFamilyContactCompliance([sup, notSup]);
    expect(r.staffSupervisedRate).toBe(50);
  });

  it("calculates feedbackRate correctly", () => {
    const fb = makeContact();
    const noFb = makeContact({ feedbackRecorded: false });
    const r = evaluateFamilyContactCompliance([fb, noFb]);
    expect(r.feedbackRate).toBe(50);
  });

  it("calculates contactTypeDiversityRatio correctly", () => {
    // 1 unique type out of 8 = 13% (Math.round(1/8 * 100))
    const c = makeContact({ contactType: "phone_call" });
    const r = evaluateFamilyContactCompliance([c]);
    expect(r.contactTypeDiversityRatio).toBe(13);
  });

  it("4 unique types = 50% diversity", () => {
    const contacts = [
      makeContact({ contactType: "face_to_face_visit" }),
      makeContact({ contactType: "video_call" }),
      makeContact({ contactType: "phone_call" }),
      makeContact({ contactType: "letter_email" }),
    ];
    const r = evaluateFamilyContactCompliance(contacts);
    expect(r.contactTypeDiversityRatio).toBe(50);
  });

  it("all false booleans with single type scores 0 or very low", () => {
    const c = makeContact({
      documentedInPlan: false,
      staffSupervised: false,
      feedbackRecorded: false,
    });
    const r = evaluateFamilyContactCompliance([c]);
    // Only diversity contributes: Math.round(13/100 * 5) = Math.round(0.625) = 1
    expect(r.overallScore).toBe(1);
  });

  it("score capped at 25", () => {
    const types = [
      "face_to_face_visit", "video_call", "phone_call", "letter_email",
      "supervised_contact", "unsupervised_contact", "family_activity", "sibling_contact",
    ] as const;
    const contacts = types.map((t) => makeContact({ contactType: t }));
    const r = evaluateFamilyContactCompliance(contacts);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("weight verification: documented max 8", () => {
    const c = makeContact({
      staffSupervised: false,
      feedbackRecorded: false,
    });
    const r = evaluateFamilyContactCompliance([c]);
    // documented 8 + diversity Math.round(13/100 * 5)=1 = 9
    expect(r.overallScore).toBe(9);
  });

  it("weight verification: staffSupervised max 7", () => {
    const c = makeContact({
      documentedInPlan: false,
      feedbackRecorded: false,
    });
    const r = evaluateFamilyContactCompliance([c]);
    // supervised 7 + diversity 1 = 8
    expect(r.overallScore).toBe(8);
  });

  it("weight verification: feedback max 5", () => {
    const c = makeContact({
      documentedInPlan: false,
      staffSupervised: false,
    });
    const r = evaluateFamilyContactCompliance([c]);
    // feedback 5 + diversity 1 = 6
    expect(r.overallScore).toBe(6);
  });
});

// ── evaluateFamilyContactPolicy ─────────────────────────────────────────────

describe("evaluateFamilyContactPolicy", () => {
  it("returns 0 and all false for null policy", () => {
    const r = evaluateFamilyContactPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.contactPromotionStrategy).toBe(false);
    expect(r.safeguardingProtocol).toBe(false);
    expect(r.supervisedContactProcedure).toBe(false);
    expect(r.letteringAndPhonePolicy).toBe(false);
    expect(r.siblingContactFramework).toBe(false);
    expect(r.familyEngagementPlan).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("returns 25 for full policy", () => {
    const r = evaluateFamilyContactPolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("scores contactPromotionStrategy as 4", () => {
    const p = makePolicy({
      contactPromotionStrategy: true,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(4);
  });

  it("scores safeguardingProtocol as 4", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: true,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(4);
  });

  it("scores supervisedContactProcedure as 4", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: true,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(4);
  });

  it("scores letteringAndPhonePolicy as 4", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: true,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(4);
  });

  it("scores siblingContactFramework as 3", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: true,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(3);
  });

  it("scores familyEngagementPlan as 3", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: true,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(3);
  });

  it("scores regularReview as 3", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: true,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(3);
  });

  it("first 4 booleans total 16", () => {
    const p = makePolicy({
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(16);
  });

  it("last 3 booleans total 9", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(9);
  });

  it("all false scores 0", () => {
    const p = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    expect(evaluateFamilyContactPolicy(p).overallScore).toBe(0);
  });

  it("mirrors boolean values in result", () => {
    const p = makePolicy({ regularReview: false });
    const r = evaluateFamilyContactPolicy(p);
    expect(r.regularReview).toBe(false);
    expect(r.contactPromotionStrategy).toBe(true);
  });

  it("score capped at 25", () => {
    const r = evaluateFamilyContactPolicy(makePolicy());
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("all weights sum to 25", () => {
    // 4+4+4+4+3+3+3 = 25
    expect(4 + 4 + 4 + 4 + 3 + 3 + 3).toBe(25);
    expect(evaluateFamilyContactPolicy(makePolicy()).overallScore).toBe(25);
  });
});

// ── evaluateStaffFamilyContactReadiness ─────────────────────────────────────

describe("evaluateStaffFamilyContactReadiness", () => {
  it("returns all zeros for empty training", () => {
    const r = evaluateStaffFamilyContactReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.familyDynamicsAwarenessRate).toBe(0);
    expect(r.contactSupervisionRate).toBe(0);
    expect(r.safeguardingInContactRate).toBe(0);
    expect(r.childPreparationSkillsRate).toBe(0);
    expect(r.conflictManagementRate).toBe(0);
    expect(r.recordKeepingRate).toBe(0);
  });

  it("scores 25 for single fully trained staff", () => {
    const r = evaluateStaffFamilyContactReadiness([makeTraining()]);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(1);
  });

  it("scores 25 for all staff fully trained", () => {
    const r = evaluateStaffFamilyContactReadiness([makeTraining(), makeTraining()]);
    expect(r.overallScore).toBe(25);
  });

  it("all untrained staff scores 0", () => {
    const t = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: false,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: false,
    });
    const r = evaluateStaffFamilyContactReadiness([t]);
    expect(r.overallScore).toBe(0);
  });

  it("weight: familyDynamicsAwareness = 6", () => {
    const t = makeTraining({
      familyDynamicsAwareness: true,
      contactSupervision: false,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: false,
    });
    expect(evaluateStaffFamilyContactReadiness([t]).overallScore).toBe(6);
  });

  it("weight: contactSupervision = 5", () => {
    const t = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: true,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: false,
    });
    expect(evaluateStaffFamilyContactReadiness([t]).overallScore).toBe(5);
  });

  it("weight: safeguardingInContact = 5", () => {
    const t = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: false,
      safeguardingInContact: true,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: false,
    });
    expect(evaluateStaffFamilyContactReadiness([t]).overallScore).toBe(5);
  });

  it("weight: childPreparationSkills = 4", () => {
    const t = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: false,
      safeguardingInContact: false,
      childPreparationSkills: true,
      conflictManagement: false,
      recordKeeping: false,
    });
    expect(evaluateStaffFamilyContactReadiness([t]).overallScore).toBe(4);
  });

  it("weight: conflictManagement = 3", () => {
    const t = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: false,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: true,
      recordKeeping: false,
    });
    expect(evaluateStaffFamilyContactReadiness([t]).overallScore).toBe(3);
  });

  it("weight: recordKeeping = 2", () => {
    const t = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: false,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: true,
    });
    expect(evaluateStaffFamilyContactReadiness([t]).overallScore).toBe(2);
  });

  it("all weights sum to 25", () => {
    expect(6 + 5 + 5 + 4 + 3 + 2).toBe(25);
    expect(evaluateStaffFamilyContactReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("score capped at 25", () => {
    const r = evaluateStaffFamilyContactReadiness([makeTraining()]);
    expect(r.overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates per-skill rates correctly for mixed staff", () => {
    const full = makeTraining();
    const partial = makeTraining({
      conflictManagement: false,
      recordKeeping: false,
    });
    const r = evaluateStaffFamilyContactReadiness([full, partial]);
    expect(r.totalStaff).toBe(2);
    expect(r.familyDynamicsAwarenessRate).toBe(100);
    expect(r.contactSupervisionRate).toBe(100);
    expect(r.safeguardingInContactRate).toBe(100);
    expect(r.childPreparationSkillsRate).toBe(100);
    expect(r.conflictManagementRate).toBe(50);
    expect(r.recordKeepingRate).toBe(50);
  });

  it("partial training produces mid-range score", () => {
    const t = makeTraining({
      familyDynamicsAwareness: true,
      contactSupervision: true,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: false,
    });
    const r = evaluateStaffFamilyContactReadiness([t]);
    expect(r.overallScore).toBe(11);
  });
});

// ── buildChildFamilyContactProfiles ─────────────────────────────────────────

describe("buildChildFamilyContactProfiles", () => {
  it("returns empty array for empty contacts", () => {
    expect(buildChildFamilyContactProfiles([])).toHaveLength(0);
  });

  it("builds one profile per child", () => {
    const contacts = [
      makeContact({ childId: "child-a", childName: "A" }),
      makeContact({ childId: "child-a", childName: "A" }),
      makeContact({ childId: "child-b", childName: "B" }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    expect(profiles).toHaveLength(2);
  });

  it("calculates totalContacts correctly", () => {
    const contacts = [
      makeContact({ childId: "child-x", childName: "X" }),
      makeContact({ childId: "child-x", childName: "X" }),
      makeContact({ childId: "child-x", childName: "X" }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    expect(profiles[0].totalContacts).toBe(3);
  });

  it("calculates positiveOutcomeRate correctly", () => {
    const contacts = [
      makeContact({ childId: "child-x", childName: "X", contactOutcome: "very_positive" }),
      makeContact({ childId: "child-x", childName: "X", contactOutcome: "neutral" }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    expect(profiles[0].positiveOutcomeRate).toBe(50);
  });

  it("calculates preparedRate correctly", () => {
    const contacts = [
      makeContact({ childId: "child-x", childName: "X", childPrepared: true }),
      makeContact({ childId: "child-x", childName: "X", childPrepared: false }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    expect(profiles[0].preparedRate).toBe(50);
  });

  it("uses childName from first contact", () => {
    const contacts = [
      makeContact({ childId: "child-x", childName: "Xavier" }),
      makeContact({ childId: "child-x", childName: "Xavier Smith" }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    expect(profiles[0].childName).toBe("Xavier");
  });

  it("score includes frequency bonus for >= 5 contacts", () => {
    const contacts = Array.from({ length: 5 }, () =>
      makeContact({ childId: "child-x", childName: "X", contactOutcome: "very_positive" }),
    );
    const profiles = buildChildFamilyContactProfiles(contacts);
    // 1 (freq) + 3 (positive) + 3 (prepared) + 0 (only 1 type) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("score includes frequency bonus for >= 10 contacts", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ childId: "child-x", childName: "X", contactOutcome: "very_positive" }),
    );
    const profiles = buildChildFamilyContactProfiles(contacts);
    // 2 (freq) + 3 (positive) + 3 (prepared) + 0 (only 1 type) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("score includes diversity bonus for >= 2 types", () => {
    const contacts = [
      makeContact({ childId: "child-x", childName: "X", contactType: "face_to_face_visit", contactOutcome: "very_positive" }),
      makeContact({ childId: "child-x", childName: "X", contactType: "video_call", contactOutcome: "very_positive" }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    // 0 (freq < 5) + 3 (positive) + 3 (prepared) + 1 (2 types) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("score includes diversity bonus for >= 4 types", () => {
    const types = ["face_to_face_visit", "video_call", "phone_call", "letter_email"] as const;
    const contacts = types.map((t) =>
      makeContact({ childId: "child-x", childName: "X", contactType: t, contactOutcome: "very_positive" }),
    );
    const profiles = buildChildFamilyContactProfiles(contacts);
    // 0 (freq < 5) + 3 (positive) + 3 (prepared) + 2 (4 types) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("score capped at 10", () => {
    const types = ["face_to_face_visit", "video_call", "phone_call", "letter_email", "supervised_contact"] as const;
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        childId: "child-x",
        childName: "X",
        contactType: types[i % types.length],
        contactOutcome: "very_positive",
      }),
    );
    const profiles = buildChildFamilyContactProfiles(contacts);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    // 2 (freq >= 10) + 3 (positive) + 3 (prepared) + 2 (5 types) = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("all bad contacts produce score 0", () => {
    const c = makeContact({
      childId: "child-x",
      childName: "X",
      contactOutcome: "distressing",
      childPrepared: false,
    });
    const profiles = buildChildFamilyContactProfiles([c]);
    // 0 (freq) + 0 (positive 0%) + 0 (prepared 0%) + 0 (1 type) = 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("multiple children each get correct profiles", () => {
    const contacts = [
      makeContact({ childId: "child-a", childName: "A", contactOutcome: "very_positive" }),
      makeContact({ childId: "child-b", childName: "B", contactOutcome: "difficult" }),
    ];
    const profiles = buildChildFamilyContactProfiles(contacts);
    const a = profiles.find((p) => p.childId === "child-a")!;
    const b = profiles.find((p) => p.childId === "child-b")!;
    expect(a.positiveOutcomeRate).toBe(100);
    expect(b.positiveOutcomeRate).toBe(0);
  });
});

// ── generateFamilyContactQualityIntelligence ────────────────────────────────

describe("generateFamilyContactQualityIntelligence", () => {
  const fullContacts: FamilyContact[] = [
    makeContact({ childId: "child-alex", childName: "Alex", contactType: "face_to_face_visit", contactOutcome: "very_positive" }),
    makeContact({ childId: "child-alex", childName: "Alex", contactType: "video_call", contactOutcome: "positive" }),
    makeContact({ childId: "child-jordan", childName: "Jordan", contactType: "phone_call", contactOutcome: "very_positive" }),
    makeContact({ childId: "child-jordan", childName: "Jordan", contactType: "supervised_contact", contactOutcome: "positive" }),
    makeContact({ childId: "child-morgan", childName: "Morgan", contactType: "family_activity", contactOutcome: "very_positive" }),
    makeContact({ childId: "child-morgan", childName: "Morgan", contactType: "sibling_contact", contactOutcome: "positive" }),
  ];
  const fullPolicy = makePolicy();
  const fullTraining = [makeTraining(), makeTraining(), makeTraining()];

  it("returns complete structure", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r).toHaveProperty("homeId", "oak-house");
    expect(r).toHaveProperty("periodStart", "2026-01-01");
    expect(r).toHaveProperty("periodEnd", "2026-05-20");
    expect(r).toHaveProperty("overallScore");
    expect(r).toHaveProperty("rating");
    expect(r).toHaveProperty("familyContactQuality");
    expect(r).toHaveProperty("familyContactCompliance");
    expect(r).toHaveProperty("familyContactPolicy");
    expect(r).toHaveProperty("staffFamilyContactReadiness");
    expect(r).toHaveProperty("childProfiles");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("areasForImprovement");
    expect(r).toHaveProperty("actions");
    expect(r).toHaveProperty("regulatoryLinks");
  });

  it("overall score is sum of 4 evaluators capped at 100", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    const sum =
      r.familyContactQuality.overallScore +
      r.familyContactCompliance.overallScore +
      r.familyContactPolicy.overallScore +
      r.staffFamilyContactReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("empty data produces inadequate with score 0", () => {
    const r = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("full data produces good or outstanding", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(60);
    expect(["good", "outstanding"]).toContain(r.rating);
  });

  it("includes 7 regulatory links", () => {
    const r = generateFamilyContactQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links include CHR 2015 Regulation 7", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 7"))).toBe(true);
  });

  it("regulatory links include CHR 2015 Regulation 14", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 14"))).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links include NMS 10", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
  });

  it("regulatory links include Children Act 1989 Section 34", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989 Section 34"))).toBe(true);
  });

  it("regulatory links include UNCRC Article 9", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 9"))).toBe(true);
  });

  it("regulatory links include Care Planning Regulations 2010", () => {
    const r = generateFamilyContactQualityIntelligence([], null, [], "h", "s", "e");
    expect(r.regulatoryLinks.some((l) => l.includes("Care Planning Regulations 2010"))).toBe(true);
  });

  it("generates strengths for good practice", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT action when no contacts", () => {
    const r = generateFamilyContactQualityIntelligence(
      [], fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT action when no policy", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, null, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.includes("URGENT") && a.toLowerCase().includes("policy"))).toBe(true);
  });

  it("generates URGENT action when no training", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.actions.some((a) => a.includes("URGENT") && a.toLowerCase().includes("training"))).toBe(true);
  });

  it("score capped at 100", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("child profiles included in output", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.childProfiles).toHaveLength(3);
  });

  it("contacts only — no policy, no training", () => {
    const r = generateFamilyContactQualityIntelligence(
      fullContacts, null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.familyContactPolicy.overallScore).toBe(0);
    expect(r.staffFamilyContactReadiness.overallScore).toBe(0);
    expect(r.overallScore).toBeGreaterThan(0);
  });

  it("policy only — no contacts, no training", () => {
    const r = generateFamilyContactQualityIntelligence(
      [], fullPolicy, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.familyContactQuality.overallScore).toBe(0);
    expect(r.familyContactCompliance.overallScore).toBe(0);
    expect(r.familyContactPolicy.overallScore).toBe(25);
    expect(r.overallScore).toBe(25);
  });

  it("training only — no contacts, no policy", () => {
    const r = generateFamilyContactQualityIntelligence(
      [], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.staffFamilyContactReadiness.overallScore).toBe(25);
    expect(r.overallScore).toBe(25);
  });

  it("all poor data produces inadequate", () => {
    const badContact = makeContact({
      contactOutcome: "distressing",
      childPrepared: false,
      childConsulted: false,
      supportProvided: false,
      documentedInPlan: false,
      staffSupervised: false,
      feedbackRecorded: false,
    });
    const emptyPolicy = makePolicy({
      contactPromotionStrategy: false,
      safeguardingProtocol: false,
      supervisedContactProcedure: false,
      letteringAndPhonePolicy: false,
      siblingContactFramework: false,
      familyEngagementPlan: false,
      regularReview: false,
    });
    const untrainedStaff = makeTraining({
      familyDynamicsAwareness: false,
      contactSupervision: false,
      safeguardingInContact: false,
      childPreparationSkills: false,
      conflictManagement: false,
      recordKeeping: false,
    });
    const r = generateFamilyContactQualityIntelligence(
      [badContact], emptyPolicy, [untrainedStaff], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.rating).toBe("inadequate");
    // Only diversity contributes 1 point from compliance
    expect(r.overallScore).toBe(1);
  });

  it("large number of contacts does not exceed caps", () => {
    const contacts = Array.from({ length: 100 }, () =>
      makeContact({ contactOutcome: "very_positive" }),
    );
    const r = generateFamilyContactQualityIntelligence(
      contacts, fullPolicy, fullTraining, "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.familyContactQuality.overallScore).toBeLessThanOrEqual(25);
    expect(r.familyContactCompliance.overallScore).toBeLessThanOrEqual(25);
  });
});
