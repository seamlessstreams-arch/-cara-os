import { describe, it, expect } from "vitest";
import {
  generateBodyMapProtocolIntelligence,
  evaluateRecordingQuality,
  evaluateAuditCompliance,
  evaluateStaffCompetence,
  evaluateEscalationEffectiveness,
  buildChildBodyMapProfiles,
  getRating,
  getMarkTypeLabel,
  getMarkOriginLabel,
  getDocumentationQualityLabel,
  getBodyRegionLabel,
  getActionTakenLabel,
  getRatingLabel,
} from "../body-map-protocol-engine";
import type {
  BodyMapRecord,
  BodyMapAudit,
  BodyMapTraining,
  SafeguardingEscalation,
} from "../body-map-protocol-engine";

// ── Helpers ───────────────────────────────────────────────────────────────

function mkRecord(overrides: Partial<BodyMapRecord> = {}): BodyMapRecord {
  return {
    id: "bm-1",
    childId: "child-1",
    childName: "Alex",
    dateRecorded: "2026-03-01",
    recordedBy: "Staff A",
    markType: "bruise",
    markOrigin: "accidental_explained",
    bodyRegion: "upper_limbs",
    documentationQuality: "thorough",
    childExplanationSought: true,
    childExplanationRecorded: true,
    witnessPresent: true,
    photographTaken: true,
    dateDiscovered: "2026-03-01",
    timelyRecording: true,
    actionsTaken: ["monitoring_only"],
    managerInformed: true,
    followUpRequired: false,
    followUpCompleted: null,
    ...overrides,
  };
}

function mkAudit(overrides: Partial<BodyMapAudit> = {}): BodyMapAudit {
  return {
    id: "aud-1",
    auditDate: "2026-03-01",
    auditor: "Manager A",
    protocolAccessible: true,
    staffTrained: true,
    templatesCurrent: true,
    storageSecure: true,
    retentionCompliant: true,
    crossReferencedWithIncidents: true,
    overallCompliant: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<BodyMapTraining> = {}): BodyMapTraining {
  return {
    id: "tr-1",
    staffId: "staff-1",
    staffName: "Staff A",
    trainingDate: "2026-01-15",
    bodyMapTrained: true,
    safeguardingAwareness: true,
    photographyProtocol: true,
    documentationStandards: true,
    escalationProcedure: true,
    ...overrides,
  };
}

function mkEscalation(overrides: Partial<SafeguardingEscalation> = {}): SafeguardingEscalation {
  return {
    id: "esc-1",
    bodyMapId: "bm-1",
    childId: "child-1",
    childName: "Alex",
    escalationDate: "2026-03-01",
    escalatedTo: "LADO",
    referralMade: true,
    outcomeRecorded: true,
    timelyEscalation: true,
    appropriateResponse: true,
    ...overrides,
  };
}

// ── pct helper ────────────────────────────────────────────────────────────


// ── getRating ─────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ── Label functions ───────────────────────────────────────────────────────

describe("label functions", () => {
  it("returns correct mark type labels", () => {
    expect(getMarkTypeLabel("bruise")).toBe("Bruise");
    expect(getMarkTypeLabel("burn")).toBe("Burn");
    expect(getMarkTypeLabel("other_mark")).toBe("Other Mark");
  });

  it("returns correct mark origin labels", () => {
    expect(getMarkOriginLabel("accidental_explained")).toBe("Accidental (Explained)");
    expect(getMarkOriginLabel("alleged_adult")).toBe("Alleged Adult");
    expect(getMarkOriginLabel("restraint_related")).toBe("Restraint Related");
  });

  it("returns correct documentation quality labels", () => {
    expect(getDocumentationQualityLabel("thorough")).toBe("Thorough");
    expect(getDocumentationQualityLabel("not_documented")).toBe("Not Documented");
  });

  it("returns correct body region labels", () => {
    expect(getBodyRegionLabel("head_face")).toBe("Head / Face");
    expect(getBodyRegionLabel("intimate_areas")).toBe("Intimate Areas");
  });

  it("returns correct action taken labels", () => {
    expect(getActionTakenLabel("gp_referral")).toBe("GP Referral");
    expect(getActionTakenLabel("police_notified")).toBe("Police Notified");
  });

  it("returns correct rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateRecordingQuality ──────────────────────────────────────────────

describe("evaluateRecordingQuality", () => {
  it("returns score 25 for empty records (no marks = excellent)", () => {
    const result = evaluateRecordingQuality([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(0);
  });

  it("scores high for all-thorough, all-compliant records", () => {
    const records = [
      mkRecord({ id: "bm-1" }),
      mkRecord({ id: "bm-2", childId: "child-2", childName: "Jordan" }),
      mkRecord({ id: "bm-3", childId: "child-3", childName: "Morgan" }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.thoroughRate).toBe(100);
    expect(result.childExplanationRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.managerInformedRate).toBe(100);
  });

  it("scores low for poor documentation quality", () => {
    const records = [
      mkRecord({ id: "bm-1", documentationQuality: "incomplete", childExplanationSought: false, childExplanationRecorded: false, timelyRecording: false, managerInformed: false, photographTaken: false }),
      mkRecord({ id: "bm-2", documentationQuality: "not_documented", childExplanationSought: false, childExplanationRecorded: false, timelyRecording: false, managerInformed: false, photographTaken: false }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.thoroughRate).toBe(0);
    expect(result.childExplanationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
  });

  it("calculates follow-up rate only from records requiring follow-up", () => {
    const records = [
      mkRecord({ id: "bm-1", followUpRequired: true, followUpCompleted: true }),
      mkRecord({ id: "bm-2", followUpRequired: true, followUpCompleted: false }),
      mkRecord({ id: "bm-3", followUpRequired: false, followUpCompleted: null }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.followUpCompletedRate).toBe(50);
  });

  it("tracks mark type distribution", () => {
    const records = [
      mkRecord({ id: "bm-1", markType: "bruise" }),
      mkRecord({ id: "bm-2", markType: "bruise" }),
      mkRecord({ id: "bm-3", markType: "scratch" }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.markTypeDistribution.bruise).toBe(2);
    expect(result.markTypeDistribution.scratch).toBe(1);
    expect(result.markTypeDistribution.cut).toBe(0);
  });

  it("tracks origin distribution", () => {
    const records = [
      mkRecord({ id: "bm-1", markOrigin: "accidental_explained" }),
      mkRecord({ id: "bm-2", markOrigin: "self_inflicted" }),
      mkRecord({ id: "bm-3", markOrigin: "self_inflicted" }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.originDistribution.accidental_explained).toBe(1);
    expect(result.originDistribution.self_inflicted).toBe(2);
  });

  it("tracks region distribution", () => {
    const records = [
      mkRecord({ id: "bm-1", bodyRegion: "upper_limbs" }),
      mkRecord({ id: "bm-2", bodyRegion: "upper_limbs" }),
      mkRecord({ id: "bm-3", bodyRegion: "head_face" }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.regionDistribution.upper_limbs).toBe(2);
    expect(result.regionDistribution.head_face).toBe(1);
  });

  it("calculates photograph rate", () => {
    const records = [
      mkRecord({ id: "bm-1", photographTaken: true }),
      mkRecord({ id: "bm-2", photographTaken: false }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.photographRate).toBe(50);
  });

  it("score is capped at 25", () => {
    const records = [mkRecord()];
    const result = evaluateRecordingQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score is at least 0", () => {
    const records = [
      mkRecord({ documentationQuality: "not_documented", childExplanationSought: false, childExplanationRecorded: false, timelyRecording: false, managerInformed: false }),
    ];
    const result = evaluateRecordingQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluateAuditCompliance ───────────────────────────────────────────────

describe("evaluateAuditCompliance", () => {
  it("returns score 0 for empty audits", () => {
    const result = evaluateAuditCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
  });

  it("scores high for fully compliant audits", () => {
    const audits = [mkAudit(), mkAudit({ id: "aud-2" })];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallCompliantRate).toBe(100);
    expect(result.storageSecureRate).toBe(100);
    expect(result.protocolAccessibleRate).toBe(100);
    expect(result.crossReferencedRate).toBe(100);
    expect(result.staffTrainedRate).toBe(100);
  });

  it("scores low for non-compliant audits", () => {
    const audits = [
      mkAudit({
        id: "aud-1",
        overallCompliant: false,
        storageSecure: false,
        protocolAccessible: false,
        crossReferencedWithIncidents: false,
        staffTrained: false,
      }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallScore).toBe(0);
  });

  it("handles mixed audit results", () => {
    const audits = [
      mkAudit({ id: "aud-1" }),
      mkAudit({ id: "aud-2", overallCompliant: false, storageSecure: false }),
    ];
    const result = evaluateAuditCompliance(audits);
    expect(result.overallCompliantRate).toBe(50);
    expect(result.storageSecureRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("score is capped at 25", () => {
    const result = evaluateAuditCompliance([mkAudit()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateStaffCompetence ───────────────────────────────────────────────

describe("evaluateStaffCompetence", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffCompetence([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "tr-2", staffId: "staff-2", staffName: "Staff B" })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.bodyMapTrainedRate).toBe(100);
    expect(result.safeguardingRate).toBe(100);
    expect(result.photographyRate).toBe(100);
    expect(result.documentationRate).toBe(100);
    expect(result.escalationRate).toBe(100);
  });

  it("scores low for untrained staff", () => {
    const training = [
      mkTraining({
        bodyMapTrained: false,
        safeguardingAwareness: false,
        photographyProtocol: false,
        documentationStandards: false,
        escalationProcedure: false,
      }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial training rates", () => {
    const training = [
      mkTraining({ id: "tr-1", staffId: "s1" }),
      mkTraining({ id: "tr-2", staffId: "s2", bodyMapTrained: false, photographyProtocol: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.bodyMapTrainedRate).toBe(50);
    expect(result.photographyRate).toBe(50);
    expect(result.safeguardingRate).toBe(100);
  });

  it("score is capped at 25", () => {
    const result = evaluateStaffCompetence([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateEscalationEffectiveness ───────────────────────────────────────

describe("evaluateEscalationEffectiveness", () => {
  it("returns score 25 for no records (no marks = no escalation needed)", () => {
    const result = evaluateEscalationEffectiveness([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalEscalations).toBe(0);
  });

  it("returns score 25 for records without concerning origins and no escalations", () => {
    const records = [mkRecord({ markOrigin: "accidental_explained" })];
    const result = evaluateEscalationEffectiveness([], records);
    expect(result.overallScore).toBe(25);
  });

  it("returns score 0 for concerning marks with no escalations", () => {
    const records = [mkRecord({ markOrigin: "accidental_unexplained" })];
    const result = evaluateEscalationEffectiveness([], records);
    expect(result.overallScore).toBe(0);
  });

  it("returns score 0 for alleged adult with no escalations", () => {
    const records = [mkRecord({ markOrigin: "alleged_adult" })];
    const result = evaluateEscalationEffectiveness([], records);
    expect(result.overallScore).toBe(0);
  });

  it("returns score 0 for unknown origin with no escalations", () => {
    const records = [mkRecord({ markOrigin: "unknown" })];
    const result = evaluateEscalationEffectiveness([], records);
    expect(result.overallScore).toBe(0);
  });

  it("returns score 0 for alleged peer with no escalations", () => {
    const records = [mkRecord({ markOrigin: "alleged_peer" })];
    const result = evaluateEscalationEffectiveness([], records);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for all-perfect escalations", () => {
    const records = [mkRecord({ markOrigin: "accidental_unexplained" })];
    const escalations = [mkEscalation()];
    const result = evaluateEscalationEffectiveness(escalations, records);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.timelyRate).toBe(100);
    expect(result.appropriateRate).toBe(100);
    expect(result.referralMadeRate).toBe(100);
    expect(result.outcomeRecordedRate).toBe(100);
  });

  it("scores low for poor escalation handling", () => {
    const records = [mkRecord({ markOrigin: "alleged_adult" })];
    const escalations = [
      mkEscalation({
        referralMade: false,
        outcomeRecorded: false,
        timelyEscalation: false,
        appropriateResponse: false,
      }),
    ];
    const result = evaluateEscalationEffectiveness(escalations, records);
    expect(result.overallScore).toBe(0);
  });

  it("handles mixed escalation quality", () => {
    const records = [
      mkRecord({ id: "bm-1", markOrigin: "accidental_unexplained" }),
      mkRecord({ id: "bm-2", markOrigin: "alleged_peer" }),
    ];
    const escalations = [
      mkEscalation({ id: "esc-1" }),
      mkEscalation({ id: "esc-2", timelyEscalation: false, referralMade: false }),
    ];
    const result = evaluateEscalationEffectiveness(escalations, records);
    expect(result.timelyRate).toBe(50);
    expect(result.referralMadeRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("score is capped at 25", () => {
    const records = [mkRecord({ markOrigin: "accidental_unexplained" })];
    const escalations = [mkEscalation()];
    const result = evaluateEscalationEffectiveness(escalations, records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// ── buildChildBodyMapProfiles ─────────────────────────────────────────────

describe("buildChildBodyMapProfiles", () => {
  it("returns empty array for no records", () => {
    const result = buildChildBodyMapProfiles([], []);
    expect(result).toEqual([]);
  });

  it("groups records by child", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", childName: "Alex" }),
      mkRecord({ id: "bm-2", childId: "child-1", childName: "Alex" }),
      mkRecord({ id: "bm-3", childId: "child-2", childName: "Jordan" }),
    ];
    const profiles = buildChildBodyMapProfiles(records, []);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-1");
    expect(alex!.totalRecords).toBe(2);
    expect(alex!.childName).toBe("Alex");
    const jordan = profiles.find((p) => p.childId === "child-2");
    expect(jordan!.totalRecords).toBe(1);
  });

  it("calculates thorough rate per child", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", documentationQuality: "thorough" }),
      mkRecord({ id: "bm-2", childId: "child-1", documentationQuality: "incomplete" }),
    ];
    const profiles = buildChildBodyMapProfiles(records, []);
    expect(profiles[0].thoroughRate).toBe(50);
  });

  it("counts unexplained marks", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", markOrigin: "accidental_unexplained" }),
      mkRecord({ id: "bm-2", childId: "child-1", markOrigin: "unknown" }),
      mkRecord({ id: "bm-3", childId: "child-1", markOrigin: "accidental_explained" }),
    ];
    const profiles = buildChildBodyMapProfiles(records, []);
    expect(profiles[0].unexplainedCount).toBe(2);
  });

  it("identifies common body regions", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", bodyRegion: "upper_limbs" }),
      mkRecord({ id: "bm-2", childId: "child-1", bodyRegion: "upper_limbs" }),
      mkRecord({ id: "bm-3", childId: "child-1", bodyRegion: "lower_limbs" }),
      mkRecord({ id: "bm-4", childId: "child-1", bodyRegion: "head_face" }),
    ];
    const profiles = buildChildBodyMapProfiles(records, []);
    expect(profiles[0].commonRegions[0]).toBe("upper_limbs");
    expect(profiles[0].commonRegions).toHaveLength(3);
  });

  it("counts escalations per child", () => {
    const records = [mkRecord({ id: "bm-1", childId: "child-1" })];
    const escalations = [
      mkEscalation({ id: "esc-1", childId: "child-1" }),
      mkEscalation({ id: "esc-2", childId: "child-1" }),
    ];
    const profiles = buildChildBodyMapProfiles(records, escalations);
    expect(profiles[0].escalationCount).toBe(2);
  });

  it("gives higher score with no unexplained marks and good documentation", () => {
    const goodRecords = [
      mkRecord({ id: "bm-1", childId: "child-1", markOrigin: "accidental_explained", documentationQuality: "thorough" }),
    ];
    const badRecords = [
      mkRecord({ id: "bm-2", childId: "child-2", childName: "Jordan", markOrigin: "accidental_unexplained", documentationQuality: "incomplete" }),
    ];
    const goodProfiles = buildChildBodyMapProfiles(goodRecords, []);
    const badProfiles = buildChildBodyMapProfiles(badRecords, []);
    expect(goodProfiles[0].overallScore).toBeGreaterThan(badProfiles[0].overallScore);
  });

  it("score capped at 10", () => {
    const records = [mkRecord({ id: "bm-1", childId: "child-1" })];
    const profiles = buildChildBodyMapProfiles(records, []);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ── generateBodyMapProtocolIntelligence ───────────────────────────────────

describe("generateBodyMapProtocolIntelligence", () => {
  it("returns outstanding for fully compliant home with no marks", () => {
    const result = generateBodyMapProtocolIntelligence(
      [],
      [mkAudit()],
      [mkTraining()],
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.recordingQuality.overallScore).toBe(25);
    expect(result.escalationEffectiveness.overallScore).toBe(25);
  });

  it("returns inadequate with no data at all", () => {
    const result = generateBodyMapProtocolIntelligence([], [], [], [], "empty", "2026-01-01", "2026-05-18");
    // recording=25 (no marks), audit=0, staff=0, escalation=25 (no marks) = 50
    expect(result.overallScore).toBe(50);
    expect(result.rating).toBe("requires_improvement");
  });

  it("assembles all four evaluator scores", () => {
    const records = [mkRecord()];
    const audits = [mkAudit()];
    const training = [mkTraining()];
    const escalations: SafeguardingEscalation[] = [];
    const result = generateBodyMapProtocolIntelligence(
      records, audits, training, escalations,
      "test-home", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(
      result.recordingQuality.overallScore +
      result.auditCompliance.overallScore +
      result.staffCompetence.overallScore +
      result.escalationEffectiveness.overallScore,
    );
  });

  it("score is capped at 100", () => {
    const result = generateBodyMapProtocolIntelligence(
      [], [mkAudit()], [mkTraining()], [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("builds child profiles from records", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", childName: "Alex" }),
      mkRecord({ id: "bm-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generateBodyMapProtocolIntelligence(
      records, [], [], [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  // ── Strengths ──

  it("adds strength for no body map records", () => {
    const result = generateBodyMapProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No body map records"))).toBe(true);
  });

  it("adds strength for thorough documentation", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      mkRecord({ id: `bm-${i}`, documentationQuality: "thorough" }),
    );
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("documentation quality"))).toBe(true);
  });

  it("adds strength for timely recording", () => {
    const records = Array.from({ length: 20 }, (_, i) =>
      mkRecord({ id: `bm-${i}`, timelyRecording: true }),
    );
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("timely recording"))).toBe(true);
  });

  it("adds strength for child explanation", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      mkRecord({ id: `bm-${i}`, childExplanationSought: true, childExplanationRecorded: true }),
    );
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("voice consistently sought"))).toBe(true);
  });

  it("adds strength for manager informed 100%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      mkRecord({ id: `bm-${i}`, managerInformed: true }),
    );
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Manager informed"))).toBe(true);
  });

  it("adds strength for fully compliant audits", () => {
    const audits = [mkAudit(), mkAudit({ id: "aud-2" })];
    const result = generateBodyMapProtocolIntelligence([], audits, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("audits fully compliant"))).toBe(true);
  });

  it("adds strength for all staff trained", () => {
    const training = [mkTraining(), mkTraining({ id: "tr-2", staffId: "s2" })];
    const result = generateBodyMapProtocolIntelligence([], [], training, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("staff trained"))).toBe(true);
  });

  it("adds strength for timely escalations", () => {
    const records = [mkRecord({ markOrigin: "accidental_unexplained" })];
    const escalations = [mkEscalation({ timelyEscalation: true })];
    const result = generateBodyMapProtocolIntelligence(records, [], [], escalations, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("escalations made in a timely"))).toBe(true);
  });

  // ── Areas for improvement ──

  it("adds area for poor documentation quality", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      mkRecord({ id: `bm-${i}`, documentationQuality: "incomplete" }),
    );
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Documentation quality"))).toBe(true);
  });

  it("adds area for no audits", () => {
    const result = generateBodyMapProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No body map protocol audits"))).toBe(true);
  });

  it("adds area for low training coverage", () => {
    const training = [
      mkTraining({ id: "tr-1", staffId: "s1", bodyMapTrained: true }),
      mkTraining({ id: "tr-2", staffId: "s2", bodyMapTrained: false }),
    ];
    const result = generateBodyMapProtocolIntelligence([], [], training, [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Body map training coverage"))).toBe(true);
  });

  it("adds area for low photograph rate", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      mkRecord({ id: `bm-${i}`, photographTaken: false }),
    );
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Photographs taken"))).toBe(true);
  });

  // ── Actions ──

  it("adds URGENT action for unexplained marks without escalation", () => {
    const records = [mkRecord({ markOrigin: "accidental_unexplained" })];
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("unexplained"))).toBe(true);
  });

  it("adds URGENT action for manager not always informed", () => {
    const records = [
      mkRecord({ id: "bm-1", managerInformed: true }),
      mkRecord({ id: "bm-2", managerInformed: false }),
    ];
    const result = generateBodyMapProtocolIntelligence(records, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("manager"))).toBe(true);
  });

  it("adds URGENT action for low body map training", () => {
    const training = [
      mkTraining({ id: "tr-1", staffId: "s1", bodyMapTrained: false }),
      mkTraining({ id: "tr-2", staffId: "s2", bodyMapTrained: false }),
      mkTraining({ id: "tr-3", staffId: "s3", bodyMapTrained: false }),
      mkTraining({ id: "tr-4", staffId: "s4", bodyMapTrained: true }),
    ];
    const result = generateBodyMapProtocolIntelligence([], [], training, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("body map training"))).toBe(true);
  });

  it("adds action to schedule audit if none exist", () => {
    const result = generateBodyMapProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Schedule body map protocol audit"))).toBe(true);
  });

  // ── Regulatory links ──

  it("includes all regulatory links", () => {
    const result = generateBodyMapProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 35"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
  });

  // ── Integration scenarios ──

  it("handles a realistic mixed scenario", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", childName: "Alex", markType: "bruise", markOrigin: "accidental_explained", bodyRegion: "lower_limbs", documentationQuality: "thorough" }),
      mkRecord({ id: "bm-2", childId: "child-2", childName: "Jordan", markType: "scratch", markOrigin: "self_inflicted", bodyRegion: "upper_limbs", documentationQuality: "thorough" }),
      mkRecord({ id: "bm-3", childId: "child-2", childName: "Jordan", markType: "bruise", markOrigin: "accidental_unexplained", bodyRegion: "torso_front", documentationQuality: "adequate", childExplanationSought: true, childExplanationRecorded: false }),
    ];
    const audits = [mkAudit()];
    const training = [
      mkTraining({ id: "tr-1", staffId: "s1" }),
      mkTraining({ id: "tr-2", staffId: "s2" }),
    ];
    const escalations = [mkEscalation({ bodyMapId: "bm-3", childId: "child-2", childName: "Jordan" })];

    const result = generateBodyMapProtocolIntelligence(
      records, audits, training, escalations,
      "oak-house", "2026-01-01", "2026-05-18",
    );

    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(2);
    expect(result.regulatoryLinks.length).toBe(7);
    expect(result.overallScore).toBe(
      result.recordingQuality.overallScore +
      result.auditCompliance.overallScore +
      result.staffCompetence.overallScore +
      result.escalationEffectiveness.overallScore,
    );
  });

  it("handles high-concern scenario with alleged adult marks", () => {
    const records = [
      mkRecord({ id: "bm-1", childId: "child-1", markOrigin: "alleged_adult", documentationQuality: "thorough", managerInformed: true }),
    ];
    const escalations = [
      mkEscalation({ bodyMapId: "bm-1", childId: "child-1", referralMade: true, timelyEscalation: true, appropriateResponse: true }),
    ];
    const result = generateBodyMapProtocolIntelligence(
      records, [mkAudit()], [mkTraining()], escalations,
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
  });
});
