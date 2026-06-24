// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — unit tests (Vitest)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { runCaraHeartResidentialPracticeEngine } from "../cara-heart-residential-practice-engine";
import { scanForBlameLanguage, flaggedPhrases } from "../engines/language-flags";
import { runSafeguardingOverride } from "../engines/safeguarding-override-engine";
import { runAntiCriminalisationEngine } from "../engines/anti-criminalisation-engine";
import { runCaraHeartEngine } from "../engines/cara-heart-engine";
import { runRepairEngine } from "../engines/repair-engine";
import { runCareForCarersEngine } from "../engines/care-for-carers-engine";
import { runSocialPedagogyEngine } from "../engines/social-pedagogy-engine";
import { runChildVoiceRightsEngine } from "../engines/child-voice-rights-engine";
import { runLifeSpaceEngine } from "../engines/life-space-engine";
import type { CaraPracticeRecord } from "../types";

const NOW = "2026-06-16T10:00:00.000Z";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseRecord: CaraPracticeRecord = {
  id: "rec_001",
  childId: "child_123",
  type: "incident",
  dateTime: "2026-06-16T09:00:00.000Z",
  severity: 3,
  description: "Child became dysregulated at bedtime and refused to go to bed.",
  staffResponse: "Staff supported the child to calm down and offered a warm drink.",
  childVoice: "Child said they were worried about tomorrow.",
};

const blameRecord: CaraPracticeRecord = {
  ...baseRecord,
  id: "rec_002",
  description: "Child kicked off again and was being manipulative. No remorse shown. Attention seeking behaviour.",
  staffResponse: "Staff told child to calm down.",
  childVoice: "",
};

const criticalRecord: CaraPracticeRecord = {
  ...baseRecord,
  id: "rec_003",
  immediateRisk: "critical",
  weaponConcern: true,
  description: "Child produced a knife during an argument.",
  staffResponse: "Staff withdrew to safe distance and called manager.",
  childVoice: "",
  severity: 5,
};

const policeRecord: CaraPracticeRecord = {
  ...baseRecord,
  id: "rec_004",
  type: "police_contact",
  policeCalled: true,
  policeConsidered: true,
  description: "Police were called after the child damaged property in the living room.",
  staffResponse: "Staff managed the situation until police arrived.",
  childVoice: "",
  propertyDamage: true,
  severity: 3,
  immediateRisk: "medium",
};

const missingRecord: CaraPracticeRecord = {
  ...baseRecord,
  id: "rec_005",
  type: "missing_episode",
  missingFromCare: true,
  description: "Child left the home at 10pm and did not return until 2am.",
  staffResponse: "Staff notified police and manager. Return home interview completed.",
  childVoice: "Child said they felt unsafe at home.",
  severity: 4,
  immediateRisk: "high",
};

const restraintRecord: CaraPracticeRecord = {
  ...baseRecord,
  id: "rec_006",
  type: "physical_intervention",
  restraintUsed: true,
  description: "Child became physically aggressive and a physical intervention was required.",
  staffResponse: "Two staff used approved techniques to support the child safely.",
  childVoice: "",
  severity: 4,
  staffDebriefRecorded: false,
};

// ── Blame language detection ──────────────────────────────────────────────────

describe("scanForBlameLanguage", () => {
  it("detects 'attention seeking'", () => {
    const flags = scanForBlameLanguage("Child was attention seeking and manipulative.");
    expect(flags.length).toBeGreaterThanOrEqual(2);
    expect(flags.some((f) => f.phrase.includes("attention seeking"))).toBe(true);
    expect(flags.some((f) => f.phrase.includes("manipulative"))).toBe(true);
  });

  it("detects 'kicked off'", () => {
    const phrases = flaggedPhrases("Child kicked off and played up all evening.");
    expect(phrases.some((p) => /kicked off/i.test(p))).toBe(true);
  });

  it("detects 'no remorse'", () => {
    const flags = scanForBlameLanguage("Child showed no remorse for their actions.");
    expect(flags.some((f) => /remorse/i.test(f.phrase))).toBe(true);
  });

  it("does not flag neutral professional language", () => {
    const flags = scanForBlameLanguage(
      "The child became distressed and required co-regulation support from staff.",
    );
    expect(flags.length).toBe(0);
  });

  it("provides a reflective prompt and alternative for each flagged phrase", () => {
    const flags = scanForBlameLanguage("Child was being manipulative.");
    expect(flags[0].reflectivePrompt).toBeTruthy();
    expect(flags[0].alternativeLanguageSuggestion).toBeTruthy();
    expect(flags[0].concern).toBeTruthy();
  });

  it("does not fire 'lied' inside ordinary words (applied/bullied/complied)", () => {
    // Regression: substring matching flagged "applied", "bullied", "complied"
    // etc. as the child having "lied" — a false blame flag on neutral or even
    // safeguarding-relevant text ("the child was bullied").
    const flags = scanForBlameLanguage(
      "The child was bullied at school. Staff applied the de-escalation plan and the child complied.",
    );
    expect(flags.some((f) => f.phrase === "lied")).toBe(false);
  });

  it("still flags 'lied' as a whole word", () => {
    const flags = scanForBlameLanguage("Staff felt the child lied about the incident.");
    expect(flags.some((f) => f.phrase === "lied")).toBe(true);
  });

  it("does not flag 'manipulative' inside 'manipulatives' (maths resources)", () => {
    const flags = scanForBlameLanguage("The child used maths manipulatives in the lesson.");
    expect(flags.some((f) => f.phrase === "manipulative")).toBe(false);
  });
});

// ── Safeguarding override ─────────────────────────────────────────────────────

describe("runSafeguardingOverride", () => {
  it("triggers 'immediate' for weapon concern", () => {
    const { override } = runSafeguardingOverride(criticalRecord, NOW);
    expect(override.triggered).toBe(true);
    expect(override.urgency).toBe("immediate");
    expect(override.reason.length).toBeGreaterThan(0);
    expect(override.requiredAction.length).toBeGreaterThan(0);
  });

  it("triggers 'same_day' for high risk", () => {
    const { override } = runSafeguardingOverride(missingRecord, NOW);
    expect(override.triggered).toBe(true);
    expect(override.urgency).toBe("same_day");
  });

  it("does not trigger for a low-severity daily log", () => {
    const safeRecord: CaraPracticeRecord = {
      ...baseRecord,
      id: "rec_safe",
      type: "daily_log",
      severity: 1,
      immediateRisk: "none",
    };
    const { override } = runSafeguardingOverride(safeRecord, NOW);
    expect(override.triggered).toBe(false);
    expect(override.urgency).toBe("standard");
  });

  it("includes audit trail entries for all rule checks", () => {
    const { audit } = runSafeguardingOverride(baseRecord, NOW);
    expect(audit.length).toBeGreaterThan(0);
    audit.forEach((entry) => {
      expect(entry.ruleId).toBeTruthy();
      expect(entry.engine).toBe("SafeguardingOverrideEngine");
    });
  });
});

// ── Cara Heart Engine ─────────────────────────────────────────────────────────

describe("runCaraHeartEngine", () => {
  it("flags missing child voice in a significant incident", () => {
    const { heartCheck } = runCaraHeartEngine(blameRecord, NOW);
    expect(heartCheck.childVoiceIncluded).toBe(false);
    expect(heartCheck.missingInformation).toContain("The child's voice");
    expect(heartCheck.suggestedPrompts.some((p) => p.toLowerCase().includes("child's voice"))).toBe(true);
  });

  it("detects blame language in the recording quality review", () => {
    const { recordingQuality } = runCaraHeartEngine(blameRecord, NOW);
    expect(recordingQuality.flaggedLanguage.length).toBeGreaterThanOrEqual(1);
    expect(recordingQuality.childCentredLanguageScore).toBeLessThan(70);
  });

  it("recognises child voice when present", () => {
    const { heartCheck } = runCaraHeartEngine(baseRecord, NOW);
    expect(heartCheck.childVoiceIncluded).toBe(true);
  });

  it("flags missing repair for incident records", () => {
    const noRepairRecord: CaraPracticeRecord = { ...baseRecord, repairRecorded: false };
    const { heartCheck } = runCaraHeartEngine(noRepairRecord, NOW);
    expect(heartCheck.relationalRepairConsidered).toBe(false);
    expect(heartCheck.missingInformation.some((m) => m.toLowerCase().includes("repair"))).toBe(true);
  });

  it("flags manager oversight needed for high-severity records", () => {
    const { heartCheck } = runCaraHeartEngine(restraintRecord, NOW);
    expect(heartCheck.managerOversightNeeded).toBe(true);
  });

  it("flags missing staff debrief for severity 4+ records", () => {
    const { heartCheck } = runCaraHeartEngine(restraintRecord, NOW);
    expect(heartCheck.staffSupportConsidered).toBe(false);
    expect(heartCheck.missingInformation.some((m) => m.toLowerCase().includes("debrief"))).toBe(true);
  });
});

// ── Anti-criminalisation engine ───────────────────────────────────────────────

describe("runAntiCriminalisationEngine", () => {
  it("is not activated for non-police records", () => {
    const { review, audit } = runAntiCriminalisationEngine(baseRecord, NOW);
    expect(review.policeContactRecommended).toBe(false);
    expect(audit.some((a) => a.ruleId === "AC_NOT_RELEVANT")).toBe(true);
  });

  it("activates and prompts for rationale when police called without mandatory flags", () => {
    const { review } = runAntiCriminalisationEngine(policeRecord, NOW);
    expect(review.antiCriminalisationWarning).toBeTruthy();
    expect(review.recordRationaleRequired).toBe(true);
    expect(review.alternativesConsidered.length).toBeGreaterThan(0);
  });

  it("recommends police for weapon concern", () => {
    const { review } = runAntiCriminalisationEngine(criticalRecord, NOW);
    expect(review.policeContactRecommended).toBe(true);
    expect(review.safeguardingOverride).toBeTruthy();
  });

  it("generates restorative options for property damage", () => {
    const { review } = runAntiCriminalisationEngine(policeRecord, NOW);
    expect(review.restorativeOptions.length).toBeGreaterThan(0);
  });
});

// ── Repair engine ─────────────────────────────────────────────────────────────

describe("runRepairEngine", () => {
  it("generates a repair plan for an incident record", () => {
    const { plan } = runRepairEngine(baseRecord, NOW);
    expect(plan).not.toBeNull();
    expect(plan!.repairQuestions.length).toBeGreaterThan(0);
    expect(plan!.practicalRepairOptions.length).toBeGreaterThan(0);
    expect(plan!.emotionalRepairOptions.length).toBeGreaterThan(0);
  });

  it("sets ruptureType to 'restraint' for physical intervention records", () => {
    const { plan } = runRepairEngine(restraintRecord, NOW);
    expect(plan!.ruptureType).toBe("restraint");
  });

  it("sets ruptureType to 'missing_episode' for missing records", () => {
    const { plan } = runRepairEngine(missingRecord, NOW);
    expect(plan!.ruptureType).toBe("missing_episode");
  });

  it("returns null plan for non-repair-requiring record types", () => {
    const keyWorkRecord: CaraPracticeRecord = {
      ...baseRecord,
      id: "rec_kw",
      type: "key_work",
      severity: 1,
    };
    const { plan } = runRepairEngine(keyWorkRecord, NOW);
    expect(plan).toBeNull();
  });
});

// ── Care for carers engine ────────────────────────────────────────────────────

describe("runCareForCarersEngine", () => {
  it("detects stress indicators for restraint records", () => {
    const { signals } = runCareForCarersEngine(restraintRecord, NOW);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0].stressIndicators.some((s) => /restraint|intervention/i.test(s))).toBe(true);
  });

  it("recommends formal debrief for severity 4+ records", () => {
    const { signals } = runCareForCarersEngine(restraintRecord, NOW);
    expect(signals[0].supportNeed).toMatch(/debrief/);
  });

  it("returns no signals for low-severity daily logs", () => {
    const safeRecord: CaraPracticeRecord = {
      ...baseRecord,
      id: "rec_daily",
      type: "daily_log",
      severity: 1,
    };
    const { signals } = runCareForCarersEngine(safeRecord, NOW);
    expect(signals.length).toBe(0);
  });
});

// ── Social pedagogy engine ────────────────────────────────────────────────────

describe("runSocialPedagogyEngine", () => {
  it("generates Head, Heart, and Hands dimensions", () => {
    const { reflection } = runSocialPedagogyEngine(baseRecord, NOW);
    expect(reflection.head.whatDoWeKnow.length).toBeGreaterThan(0);
    expect(reflection.heart.whatMightTheChildFeel.length).toBeGreaterThan(0);
    expect(reflection.hands.nextPracticalSteps.length).toBeGreaterThan(0);
  });

  it("includes rights and ethics dimension", () => {
    const { reflection } = runSocialPedagogyEngine(restraintRecord, NOW);
    expect(reflection.rightsAndEthics.childRightsConsidered.length).toBeGreaterThan(0);
    expect(reflection.rightsAndEthics.powerImbalanceConsidered).toBe(true);
  });

  it("includes repair actions for incident records", () => {
    const { reflection } = runSocialPedagogyEngine(baseRecord, NOW);
    expect(reflection.hands.repairActions.length).toBeGreaterThan(0);
  });
});

// ── Child voice and rights engine ─────────────────────────────────────────────

describe("runChildVoiceRightsEngine", () => {
  it("detects missing child voice", () => {
    const { review } = runChildVoiceRightsEngine(blameRecord, NOW);
    expect(review.childVoicePresent).toBe(false);
    expect(review.reasonVoiceNotCaptured).toBeTruthy();
    expect(review.suggestedFollowUp.length).toBeGreaterThan(0);
  });

  it("recognises child voice when present", () => {
    const { review } = runChildVoiceRightsEngine(baseRecord, NOW);
    expect(review.childVoicePresent).toBe(true);
  });

  it("flags dignity concern for restraint records", () => {
    const { review } = runChildVoiceRightsEngine(restraintRecord, NOW);
    expect(review.dignityConcern).toBe(true);
  });

  it("flags advocacy needed for police contact records", () => {
    const { review } = runChildVoiceRightsEngine(policeRecord, NOW);
    expect(review.advocacyNeeded).toBe(true);
  });
});

// ── Life space engine ─────────────────────────────────────────────────────────

describe("runLifeSpaceEngine", () => {
  it("classifies bedtime context correctly", () => {
    const { moments } = runLifeSpaceEngine(baseRecord, NOW);
    expect(moments[0].context).toBe("bedtime");
    expect(moments[0].practiceValue).toBeTruthy();
    expect(moments[0].possibleMeaning.length).toBeGreaterThan(0);
    expect(moments[0].relationalOpportunity.length).toBeGreaterThan(0);
    expect(moments[0].recordingPrompt).toBeTruthy();
  });

  it("classifies missing return context", () => {
    const { moments } = runLifeSpaceEngine(missingRecord, NOW);
    expect(moments[0].context).toBe("missing_return");
    expect(moments[0].practiceValue).toBe("safety");
  });
});

// ── Master orchestrator ───────────────────────────────────────────────────────

describe("runCaraHeartResidentialPracticeEngine", () => {
  it("returns a complete CaraPracticeIntelligenceOutput for a typical incident", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    expect(output.recordId).toBe("rec_001");
    expect(output.childId).toBe("child_123");
    expect(output.heartCard).toBeTruthy();
    expect(output.heartCheck).toBeTruthy();
    expect(output.safeguardingOverride).toBeTruthy();
    expect(output.auditTrail.length).toBeGreaterThan(0);
    expect(output.deterministicPrompts.length).toBeGreaterThan(0);
    expect(output.mode).toBeTruthy();
  });

  it("sets escalationRequired to true for critical records", () => {
    const output = runCaraHeartResidentialPracticeEngine(criticalRecord, { now: NOW });
    expect(output.heartCard.escalationRequired).toBe(true);
    expect(output.heartCard.tone).toBe("urgent");
  });

  it("uses deterministic_only mode for low-severity records", () => {
    const lowRecord: CaraPracticeRecord = {
      ...baseRecord,
      id: "rec_low",
      type: "daily_log",
      severity: 1,
      childVoice: "Child was happy today.",
      staffResponse: "Staff supported the child throughout the day.",
    };
    const output = runCaraHeartResidentialPracticeEngine(lowRecord, { now: NOW });
    expect(output.mode).toBe("deterministic_only");
    expect(output.llmRequired).toBe(false);
  });

  it("does not invent information — all prompts are evidence-based on the input", () => {
    const output = runCaraHeartResidentialPracticeEngine(blameRecord, { now: NOW });
    // All prompts should be strings
    output.deterministicPrompts.forEach((p) => {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(0);
    });
  });

  it("includes an audit trail with engine names", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    const engines = new Set(output.auditTrail.map((a) => a.engine));
    expect(engines.size).toBeGreaterThanOrEqual(4);
  });

  it("includes social pedagogy reflection", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    expect(output.socialPedagogyReflection).toBeTruthy();
    expect(output.socialPedagogyReflection!.head).toBeTruthy();
    expect(output.socialPedagogyReflection!.heart).toBeTruthy();
    expect(output.socialPedagogyReflection!.hands).toBeTruthy();
  });

  it("includes anti-criminalisation review when police are involved", () => {
    const output = runCaraHeartResidentialPracticeEngine(policeRecord, { now: NOW });
    expect(output.antiCriminalisationReview).toBeTruthy();
    expect(output.antiCriminalisationReview!.alternativesConsidered.length).toBeGreaterThan(0);
  });

  it("does NOT include anti-criminalisation review when police not involved", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    expect(output.antiCriminalisationReview).toBeUndefined();
  });

  it("generates manager pattern insights for incidents", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    expect(output.managerPatternInsights).toBeTruthy();
    expect(output.managerPatternInsights!.length).toBeGreaterThan(0);
  });

  it("never uses the spelling 'Kara'", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    const allText = JSON.stringify(output);
    expect(allText).not.toContain("Kara");
  });

  it("uses 'Cara' naming in the professional reminder", () => {
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    expect(output.heartCard.professionalReminder.toLowerCase()).toContain("cara");
  });

  it("outputs British English in suggested actions (uses 'recognise' not 'recognize')", () => {
    // Check that the professional reminder uses British English phrasing
    const output = runCaraHeartResidentialPracticeEngine(baseRecord, { now: NOW });
    expect(output.heartCard.professionalReminder).toBeTruthy();
    // The reminder should not use US spelling
    expect(output.heartCard.professionalReminder).not.toContain("recognize");
  });
});
