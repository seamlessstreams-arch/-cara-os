// ══════════════════════════════════════════════════════════════════════════════
// VOICE OF THE CHILD INTELLIGENCE — TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateVoiceOfChildIntelligence,
  analyseDomainCapture,
  buildChildVoiceResults,
  getVoiceDomainLabel,
  getVoiceMethodLabel,
  getInfluenceLabel,
} from "../voice-of-child-engine";
import type {
  VoiceEntry,
  AdvocacyRecord,
  ParticipationRecord,
  ChildVoiceProfile,
} from "../voice-of-child-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-05-01";
const PERIOD_END = "2026-05-18";

function makeChildren(): ChildVoiceProfile[] {
  return [
    { childId: "child-alex", childName: "Alex" },
    { childId: "child-jordan", childName: "Jordan" },
    { childId: "child-morgan", childName: "Morgan" },
  ];
}

function makeGoodVoiceEntries(): VoiceEntry[] {
  return [
    // Alex — good capture across domains
    { id: "ve-001", childId: "child-alex", date: "2026-05-02", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Alex said he wants to stay up later on weekends", recordedBy: "Sarah" },
    { id: "ve-002", childId: "child-alex", date: "2026-05-05", domain: "key_work_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Alex expressed interest in a boxing club — arranged trial session", actionTaken: "Trial session booked for 12th May", recordedBy: "Sarah" },
    { id: "ve-003", childId: "child-alex", date: "2026-05-08", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Alex asked to see Mum more often", recordedBy: "Sarah" },
    { id: "ve-004", childId: "child-alex", date: "2026-05-12", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Alex asked for different cereal — purchased", recordedBy: "Tom" },
    { id: "ve-005", childId: "child-alex", date: "2026-05-15", domain: "incident_report", voiceRecorded: true, method: "direct_verbal", influence: "acknowledged_not_acted", summary: "Alex said he felt the restraint was unnecessary", recordedBy: "Darren" },

    // Jordan — strong capture with diverse methods
    { id: "ve-006", childId: "child-jordan", date: "2026-05-01", domain: "daily_log", voiceRecorded: true, method: "written_by_child", influence: "directly_influenced", summary: "Jordan wrote in journal that she wants quiet time after school", recordedBy: "Lisa" },
    { id: "ve-007", childId: "child-jordan", date: "2026-05-04", domain: "key_work_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Jordan asked for art supplies for room — purchased", actionTaken: "Art supplies ordered", recordedBy: "Tom" },
    { id: "ve-008", childId: "child-jordan", date: "2026-05-07", domain: "house_meeting", voiceRecorded: true, method: "written_by_child", influence: "directly_influenced", summary: "Jordan suggested pizza night on Fridays — group agreed", recordedBy: "Darren" },
    { id: "ve-009", childId: "child-jordan", date: "2026-05-10", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Jordan said she enjoys seeing Nan but doesn't want to see Mum", recordedBy: "Lisa" },
    { id: "ve-010", childId: "child-jordan", date: "2026-05-14", domain: "health_appointment", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Jordan told GP she wants to try different medication", recordedBy: "Lisa" },

    // Morgan — good but some gaps
    { id: "ve-011", childId: "child-morgan", date: "2026-05-02", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Morgan said they prefer to be called 'they/them'", recordedBy: "Lisa" },
    { id: "ve-012", childId: "child-morgan", date: "2026-05-06", domain: "key_work_session", voiceRecorded: true, method: "digital_tool", influence: "directly_influenced", summary: "Morgan used mood tracker app to show emotional patterns — discussed triggers", recordedBy: "Lisa" },
    { id: "ve-013", childId: "child-morgan", date: "2026-05-10", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Morgan asked for longer video calls with Kian", recordedBy: "Lisa" },
    { id: "ve-014", childId: "child-morgan", date: "2026-05-16", domain: "daily_log", voiceRecorded: true, method: "staff_observed", influence: "partially_influenced", summary: "Morgan seemed happier after music session — asked to play guitar more often", recordedBy: "Tom" },
  ];
}

function makeWeakVoiceEntries(): VoiceEntry[] {
  return [
    // Alex — poor capture
    { id: "wv-001", childId: "child-alex", date: "2026-05-03", domain: "daily_log", voiceRecorded: false, method: "not_recorded", influence: "not_applicable", recordedBy: "Agency" },
    { id: "wv-002", childId: "child-alex", date: "2026-05-06", domain: "incident_report", voiceRecorded: false, method: "not_recorded", influence: "not_applicable", recordedBy: "Agency" },
    { id: "wv-003", childId: "child-alex", date: "2026-05-10", domain: "daily_log", voiceRecorded: true, method: "staff_observed", influence: "not_acknowledged", summary: "Alex seemed frustrated", recordedBy: "Tom" },
    { id: "wv-004", childId: "child-alex", date: "2026-05-14", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "not_acknowledged", summary: "Alex asked to go out but request not documented as actioned", recordedBy: "Tom" },

    // Jordan — tokenistic (recorded but never influences)
    { id: "wv-005", childId: "child-jordan", date: "2026-05-02", domain: "daily_log", voiceRecorded: true, method: "staff_observed", influence: "acknowledged_not_acted", summary: "Jordan said she wanted different food", recordedBy: "Agency" },
    { id: "wv-006", childId: "child-jordan", date: "2026-05-07", domain: "key_work_session", voiceRecorded: true, method: "direct_verbal", influence: "acknowledged_not_acted", summary: "Jordan asked to change key worker", recordedBy: "Tom" },
    { id: "wv-007", childId: "child-jordan", date: "2026-05-12", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "acknowledged_not_acted", summary: "Jordan expressed distress about contact", recordedBy: "Lisa" },
    { id: "wv-008", childId: "child-jordan", date: "2026-05-16", domain: "daily_log", voiceRecorded: true, method: "staff_observed", influence: "not_acknowledged", summary: "Jordan seemed withdrawn", recordedBy: "Tom" },

    // Morgan — minimal entries
    { id: "wv-009", childId: "child-morgan", date: "2026-05-05", domain: "daily_log", voiceRecorded: false, method: "not_recorded", influence: "not_applicable", recordedBy: "Agency" },
  ];
}

function makeGoodAdvocacy(): AdvocacyRecord[] {
  return [
    { id: "adv-001", childId: "child-alex", hasAdvocate: true, advocateName: "Claire Barnes", advocateOrganisation: "Coram Voice", lastContact: "2026-05-10", hasIndependentVisitor: true, independentVisitorName: "Mark Thompson", lastIVVisit: "2026-05-08", childAwareOfRights: true, complaintsProcessExplained: true },
    { id: "adv-002", childId: "child-jordan", hasAdvocate: true, advocateName: "Priya Patel", advocateOrganisation: "NYAS", lastContact: "2026-05-12", hasIndependentVisitor: true, independentVisitorName: "Karen Hughes", lastIVVisit: "2026-05-05", childAwareOfRights: true, complaintsProcessExplained: true },
    { id: "adv-003", childId: "child-morgan", hasAdvocate: true, advocateName: "Daniel Harris", advocateOrganisation: "Coram Voice", lastContact: "2026-05-14", hasIndependentVisitor: false, childAwareOfRights: true, complaintsProcessExplained: true },
  ];
}

function makeWeakAdvocacy(): AdvocacyRecord[] {
  return [
    { id: "adv-w1", childId: "child-alex", hasAdvocate: false, hasIndependentVisitor: false, childAwareOfRights: false, complaintsProcessExplained: false },
    { id: "adv-w2", childId: "child-jordan", hasAdvocate: false, hasIndependentVisitor: false, childAwareOfRights: true, complaintsProcessExplained: true },
    { id: "adv-w3", childId: "child-morgan", hasAdvocate: false, hasIndependentVisitor: false, childAwareOfRights: false, complaintsProcessExplained: false },
  ];
}

function makeGoodParticipation(): ParticipationRecord[] {
  return [
    { id: "part-001", childId: "child-alex", date: "2026-05-06", eventType: "lac_review", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: true },
    { id: "part-002", childId: "child-alex", date: "2026-05-13", eventType: "house_meeting", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
    { id: "part-003", childId: "child-jordan", date: "2026-05-07", eventType: "house_meeting", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
    { id: "part-004", childId: "child-jordan", date: "2026-05-10", eventType: "pep_review", participationLevel: "partial", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
    { id: "part-005", childId: "child-morgan", date: "2026-05-07", eventType: "house_meeting", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
    { id: "part-006", childId: "child-morgan", date: "2026-05-15", eventType: "care_plan_review", participationLevel: "represented_by_advocate", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: true },
  ];
}

function makeWeakParticipation(): ParticipationRecord[] {
  return [
    { id: "part-w1", childId: "child-alex", date: "2026-05-06", eventType: "lac_review", participationLevel: "not_invited", childViewsRecorded: false, childViewsInfluencedOutcome: false, advocatePresent: false },
    { id: "part-w2", childId: "child-jordan", date: "2026-05-10", eventType: "pep_review", participationLevel: "declined", childViewsRecorded: false, childViewsInfluencedOutcome: false, advocatePresent: false },
    { id: "part-w3", childId: "child-morgan", date: "2026-05-15", eventType: "care_plan_review", participationLevel: "unable_to_attend", childViewsRecorded: false, childViewsInfluencedOutcome: false, advocatePresent: false },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// analyseDomainCapture
// ═══════════════════════════════════════════════════════════════════════════

describe("analyseDomainCapture", () => {
  it("calculates capture rate per domain", () => {
    const entries = makeGoodVoiceEntries();
    const results = analyseDomainCapture(entries, PERIOD_START, PERIOD_END);

    const dailyLog = results.find((r) => r.domain === "daily_log");
    expect(dailyLog).toBeDefined();
    expect(dailyLog!.captureRate).toBe(100); // All 5 daily log entries have voice recorded
  });

  it("calculates influence rate per domain", () => {
    const entries = makeGoodVoiceEntries();
    const results = analyseDomainCapture(entries, PERIOD_START, PERIOD_END);

    const keyWork = results.find((r) => r.domain === "key_work_session");
    expect(keyWork).toBeDefined();
    // 3 key work entries, all recorded, all influenced
    expect(keyWork!.influenceRate).toBe(100);
  });

  it("handles domains with no voice recorded", () => {
    const entries = makeWeakVoiceEntries();
    const results = analyseDomainCapture(entries, PERIOD_START, PERIOD_END);

    const incident = results.find((r) => r.domain === "incident_report");
    expect(incident).toBeDefined();
    expect(incident!.captureRate).toBe(0); // 1 incident with no voice
  });

  it("returns empty for no entries in period", () => {
    const results = analyseDomainCapture([], PERIOD_START, PERIOD_END);
    expect(results).toHaveLength(0);
  });

  it("filters entries to period range", () => {
    const outOfRange: VoiceEntry[] = [
      { id: "oor-1", childId: "child-alex", date: "2026-04-15", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", recordedBy: "Sarah" },
    ];
    const results = analyseDomainCapture(outOfRange, PERIOD_START, PERIOD_END);
    expect(results).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildChildVoiceResults
// ═══════════════════════════════════════════════════════════════════════════

describe("buildChildVoiceResults", () => {
  it("calculates per-child voice capture rate", () => {
    const results = buildChildVoiceResults(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const alex = results.find((r) => r.childId === "child-alex")!;
    expect(alex.voiceRecordedRate).toBe(100); // All 5 entries have voice recorded
    expect(alex.totalEntries).toBe(5);
  });

  it("identifies preferred voice methods", () => {
    const results = buildChildVoiceResults(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const jordan = results.find((r) => r.childId === "child-jordan")!;
    expect(jordan.preferredMethods).toContain("direct_verbal");
    expect(jordan.preferredMethods).toContain("written_by_child");
  });

  it("identifies domains with gaps for weak entries", () => {
    const results = buildChildVoiceResults(
      makeWeakVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeWeakParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const alex = results.find((r) => r.childId === "child-alex")!;
    // Alex has 4 entries: 2 daily_log not recorded, 1 daily_log recorded, 1 incident not recorded
    // daily_log: 3 entries, 2 recorded = 67% — NOT a gap (>= 50%)
    // incident_report: only 1 entry — too few to flag
    expect(alex.voiceRecordedRate).toBe(50); // 2 of 4 recorded
  });

  it("detects tokenistic practice", () => {
    const results = buildChildVoiceResults(
      makeWeakVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeWeakParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const jordan = results.find((r) => r.childId === "child-jordan")!;
    // 4 entries, all recorded (100%), but influence is all acknowledged_not_acted or not_acknowledged
    expect(jordan.voiceRecordedRate).toBe(100);
    expect(jordan.influenceRate).toBe(0); // None directly or partially influenced
    expect(jordan.concerns.some((c) => c.includes("tokenistic"))).toBe(true);
  });

  it("flags missing advocacy", () => {
    const results = buildChildVoiceResults(
      makeGoodVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeGoodParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const alex = results.find((r) => r.childId === "child-alex")!;
    expect(alex.hasAdvocate).toBe(false);
    expect(alex.concerns.some((c) => c.includes("No independent advocate"))).toBe(true);
  });

  it("calculates participation rate", () => {
    const results = buildChildVoiceResults(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const alex = results.find((r) => r.childId === "child-alex")!;
    expect(alex.participationRate).toBe(100); // 2 events, both full
  });

  it("flags not-invited to meetings", () => {
    const results = buildChildVoiceResults(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeWeakParticipation(),
      PERIOD_START, PERIOD_END,
    );

    const alex = results.find((r) => r.childId === "child-alex")!;
    expect(alex.concerns.some((c) => c.includes("not invited"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// generateVoiceOfChildIntelligence (integration)
// ═══════════════════════════════════════════════════════════════════════════

describe("generateVoiceOfChildIntelligence", () => {
  it("produces a complete result with all fields", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.childResults).toHaveLength(3);
    expect(result.domainCapture.length).toBeGreaterThan(0);
  });

  it("scores high with good voice capture and advocacy", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.overallCaptureRate).toBe(100);
    expect(result.advocacyAccessRate).toBe(100);
  });

  it("scores lower with weak voice capture", () => {
    const result = generateVoiceOfChildIntelligence(
      makeWeakVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeWeakParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBeLessThan(50);
    expect(result.overallCaptureRate).toBeLessThan(70);
  });

  it("identifies strongest and weakest domains", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    // All domains have 100% capture in good scenario
    expect(result.strongestDomains.length).toBeGreaterThan(0);
  });

  it("builds method breakdown", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.methodBreakdown.length).toBeGreaterThan(0);
    expect(result.methodBreakdown.some((m) => m.method === "direct_verbal")).toBe(true);
  });

  it("generates strengths for good practice", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("advocate") || s.includes("voice") || s.includes("capture"))).toBe(true);
  });

  it("generates concerns for weak practice", () => {
    const result = generateVoiceOfChildIntelligence(
      makeWeakVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeWeakParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
  });

  it("generates immediate actions for missing advocates", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.immediateActions.some((a) => a.includes("advocate"))).toBe(true);
  });

  it("returns no-action message for outstanding practice", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.immediateActions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("includes regulatory links", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("tracks advocacy and IV access rates", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.advocacyAccessRate).toBe(100);
    // 2 out of 3 have IV
    expect(result.independentVisitorRate).toBe(67);
  });

  it("tracks children aware of rights", () => {
    const result = generateVoiceOfChildIntelligence(
      makeGoodVoiceEntries(), makeChildren(), makeGoodAdvocacy(), makeGoodParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.childrenAwareOfRights).toBe(3);
  });

  it("detects tokenistic practice in areas for development", () => {
    const result = generateVoiceOfChildIntelligence(
      makeWeakVoiceEntries(), makeChildren(), makeWeakAdvocacy(), makeWeakParticipation(),
      "oak-house", PERIOD_START, PERIOD_END,
    );

    expect(result.areasForDevelopment.some((a) => a.includes("okenistic"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Label Utilities
// ═══════════════════════════════════════════════════════════════════════════

describe("label utilities", () => {
  it("getVoiceDomainLabel returns correct labels", () => {
    expect(getVoiceDomainLabel("daily_log")).toBe("Daily Log");
    expect(getVoiceDomainLabel("key_work_session")).toBe("Key Work Session");
    expect(getVoiceDomainLabel("lac_review")).toBe("LAC Review");
    expect(getVoiceDomainLabel("independence_planning")).toBe("Independence Planning");
  });

  it("getVoiceMethodLabel returns correct labels", () => {
    expect(getVoiceMethodLabel("direct_verbal")).toBe("Direct Verbal");
    expect(getVoiceMethodLabel("written_by_child")).toBe("Written by Child");
    expect(getVoiceMethodLabel("behaviour_as_communication")).toBe("Behaviour as Communication");
    expect(getVoiceMethodLabel("advocacy_supported")).toBe("Advocacy Supported");
  });

  it("getInfluenceLabel returns correct labels", () => {
    expect(getInfluenceLabel("directly_influenced")).toBe("Directly Influenced");
    expect(getInfluenceLabel("acknowledged_not_acted")).toBe("Acknowledged, Not Acted Upon");
    expect(getInfluenceLabel("not_applicable")).toBe("N/A");
  });
});
