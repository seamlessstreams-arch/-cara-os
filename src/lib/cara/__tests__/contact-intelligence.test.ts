// ══════════════════════════════════════════════════════════════════════════════
// Tests — Contact & Relationships Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseContact,
  ContactInput,
  ContactSession,
  ContactArrangement,
  ContactType,
  ContactPerson,
  ContactOutcome,
} from "../contact-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeSession(overrides: Partial<ContactSession> = {}): ContactSession {
  return {
    id: `cs_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    person: "mother",
    personName: "Mum",
    type: "face_to_face",
    plannedDuration: 60,
    actualDuration: 55,
    occurred: true,
    outcome: "positive",
    childWanted: true,
    supervisedRequired: false,
    ...overrides,
  };
}

function makeArrangement(overrides: Partial<ContactArrangement> = {}): ContactArrangement {
  return {
    person: "mother",
    personName: "Mum",
    agreedFrequency: "weekly",
    agreedFrequencyPerMonth: 4,
    contactType: "face_to_face",
    supervisedRequired: false,
    courtOrdered: false,
    childViews: "wants_contact",
    ...overrides,
  };
}

function makeInput(overrides: Partial<ContactInput> = {}): ContactInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    contactSessions: [],
    arrangements: [],
    contactPlanReviewed: true,
    childConsultedOnPlan: true,
    advocateAvailableForContact: true,
    lifestoryWorkStarted: true,
    siblingPlacementConsidered: true,
    letterboxContactAvailable: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Contact & Relationships Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseContact(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("frequencyScore");
      expect(result).toHaveProperty("qualityScore");
      expect(result).toHaveProperty("consistencyScore");
      expect(result).toHaveProperty("voiceScore");
      expect(result).toHaveProperty("contactByPerson");
      expect(result).toHaveProperty("cancellationPatterns");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseContact(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles no sessions", () => {
      const result = analyseContact(makeInput());
      expect(result.totalSessions).toBe(0);
      expect(result.missedSessions).toBe(0);
      expect(result.missedRate).toBe(0);
    });
  });

  // ── Counting ──────────────────────────────────────────────────────────

  describe("Counting", () => {
    it("counts total, occurred, missed correctly", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
        ],
      }));
      expect(result.totalSessions).toBe(3);
      expect(result.occurredSessions).toBe(2);
      expect(result.missedSessions).toBe(1);
    });

    it("calculates missed rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: true }),
        ],
      }));
      expect(result.missedRate).toBe(0.5);
    });
  });

  // ── Quality metrics ───────────────────────────────────────────────────

  describe("Quality metrics", () => {
    it("calculates positive rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "neutral" }),
        ],
      }));
      expect(result.positiveRate).toBeCloseTo(0.67, 1);
    });

    it("calculates distressing rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "distressing" }),
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
        ],
      }));
      expect(result.distressingRate).toBe(0.25);
    });

    it("positive rate is null (not a fabricated 1.0) with no recorded outcomes", () => {
      const result = analyseContact(makeInput());
      // absence of a recorded outcome is not a positive one.
      expect(result.positiveRate).toBeNull();
    });
  });

  // ── Per-person analysis ───────────────────────────────────────────────

  describe("Per-person analysis", () => {
    it("groups sessions by person", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ person: "mother", personName: "Mum" }),
          makeSession({ person: "mother", personName: "Mum" }),
          makeSession({ person: "father", personName: "Dad" }),
        ],
        arrangements: [makeArrangement()],
      }));
      expect(result.contactByPerson.length).toBe(2);
      const mum = result.contactByPerson.find(p => p.personName === "Mum");
      expect(mum!.sessionsPlanned).toBe(2);
      expect(mum!.sessionsOccurred).toBe(2);
    });

    it("calculates per-person compliance against arrangement", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ personName: "Mum" }),
          makeSession({ personName: "Mum" }),
          makeSession({ personName: "Mum" }),
          // 3 sessions for weekly (expects 12 over 3 months)
        ],
        arrangements: [makeArrangement({ personName: "Mum", agreedFrequencyPerMonth: 4 })],
      }));
      const mum = result.contactByPerson.find(p => p.personName === "Mum");
      expect(mum!.complianceRate).toBe(0.25); // 3/12
    });

    it("calculates average outcome per person", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ personName: "Mum", outcome: "positive" }),  // 2
          makeSession({ personName: "Mum", outcome: "neutral" }),   // 1
          makeSession({ personName: "Mum", outcome: "positive" }),  // 2
        ],
        arrangements: [makeArrangement()],
      }));
      const mum = result.contactByPerson.find(p => p.personName === "Mum");
      expect(mum!.avgOutcome).toBeCloseTo(1.7, 1); // (2+1+2)/3
    });
  });

  // ── Cancellation patterns ─────────────────────────────────────────────

  describe("Cancellation patterns", () => {
    it("identifies repeat canceller", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
        ],
      }));
      const pattern = result.cancellationPatterns.find(p => p.pattern === "cancelled_by_parent");
      expect(pattern).toBeDefined();
      expect(pattern!.count).toBe(3);
    });

    it("identifies repeat cancellation for specific person", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ personName: "Dad", occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ personName: "Dad", occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ personName: "Dad", occurred: false, actualDuration: 0, cancelledBy: "parent" }),
        ],
      }));
      const pattern = result.cancellationPatterns.find(p => p.pattern === "repeat_person_cancel");
      expect(pattern).toBeDefined();
      expect(pattern!.description).toContain("Dad");
    });

    it("no patterns when few cancellations", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
        ],
      }));
      expect(result.cancellationPatterns).toHaveLength(0);
    });
  });

  // ── Frequency scoring ─────────────────────────────────────────────────

  describe("Frequency scoring", () => {
    it("100 for full compliance with arrangement", () => {
      const sessions = Array.from({ length: 12 }, (_, i) =>
        makeSession({ personName: "Mum", date: `2026-0${3 + Math.floor(i / 4)}-0${(i % 4) * 7 + 1}` })
      );
      const result = analyseContact(makeInput({
        contactSessions: sessions,
        arrangements: [makeArrangement({ personName: "Mum", agreedFrequencyPerMonth: 4 })],
      }));
      expect(result.frequencyScore).toBe(100);
    });

    it("low score for poor compliance", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ personName: "Mum" }),
          // Only 1 session when 12 expected (weekly over 3 months)
        ],
        arrangements: [makeArrangement({ personName: "Mum", agreedFrequencyPerMonth: 4 })],
      }));
      expect(result.frequencyScore).toBeLessThan(20);
    });

    it("null when contact exists but none maps to an agreed arrangement", () => {
      const result = analyseContact(makeInput({
        contactSessions: [makeSession({ personName: "Mum" })],
        arrangements: [],
      }));
      expect(result.frequencyScore).toBeNull();
    });
  });

  // ── Quality scoring ───────────────────────────────────────────────────

  describe("Quality scoring", () => {
    it("high score for all positive contacts", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
        ],
      }));
      expect(result.qualityScore).toBe(100);
    });

    it("low score for distressing contacts", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "distressing" }),
          makeSession({ outcome: "distressing" }),
          makeSession({ outcome: "negative" }),
        ],
      }));
      expect(result.qualityScore).toBeLessThan(30);
    });

    it("null when no sessions occurred (quality is unmeasured, not perfect)", () => {
      const result = analyseContact(makeInput());
      expect(result.qualityScore).toBeNull();
    });
  });

  // ── Consistency scoring ───────────────────────────────────────────────

  describe("Consistency scoring", () => {
    it("100 for no missed contacts", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
        ],
      }));
      expect(result.consistencyScore).toBe(100);
    });

    it("lower for high missed rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0 }),
          makeSession({ occurred: false, actualDuration: 0 }),
          makeSession({ occurred: false, actualDuration: 0 }),
        ],
      }));
      // 100 - 0.75*150 = -12.5 → clamped to 0
      expect(result.consistencyScore).toBe(0);
    });

    it("null when no sessions recorded (nothing to measure)", () => {
      const result = analyseContact(makeInput());
      expect(result.consistencyScore).toBeNull();
    });
  });

  // ── Voice scoring ─────────────────────────────────────────────────────

  describe("Voice scoring", () => {
    it("100 for full voice support", () => {
      const result = analyseContact(makeInput({
        childConsultedOnPlan: true,
        contactPlanReviewed: true,
        advocateAvailableForContact: true,
        lifestoryWorkStarted: true,
        arrangements: [makeArrangement({ childViews: "wants_contact" })],
      }));
      expect(result.voiceScore).toBe(100);
    });

    it("low score when child not consulted and no advocate", () => {
      const result = analyseContact(makeInput({
        childConsultedOnPlan: false,
        contactPlanReviewed: false,
        advocateAvailableForContact: false,
        lifestoryWorkStarted: false,
        arrangements: [makeArrangement({ childViews: "not_asked" })],
      }));
      expect(result.voiceScore).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical concern for very high missed rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0 }),
          makeSession({ occurred: false, actualDuration: 0 }),
          makeSession({ occurred: false, actualDuration: 0 }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "consistency");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for moderate missed rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0 }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "consistency");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("critical concern for high distressing rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "distressing" }),
          makeSession({ outcome: "distressing" }),
          makeSession({ outcome: "positive" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "quality");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("critical");
    });

    it("significant concern for unwanted contact", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ childWanted: false }),
          makeSession({ childWanted: false }),
          makeSession({ childWanted: false }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "voice");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("significant concern for repeated parent cancellations", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
          makeSession({ occurred: false, actualDuration: 0, cancelledBy: "parent" }),
        ],
      }));
      const c = result.concerns.find(c => c.category === "parent_engagement");
      expect(c).toBeDefined();
      expect(c!.severity).toBe("significant");
    });

    it("concern when child not consulted", () => {
      const result = analyseContact(makeInput({ childConsultedOnPlan: false }));
      const c = result.concerns.find(c => c.category === "voice" && c.description.includes("consulted"));
      expect(c).toBeDefined();
    });

    it("concern for sibling placement not considered", () => {
      const result = analyseContact(makeInput({ siblingPlacementConsidered: false }));
      const c = result.concerns.find(c => c.category === "siblings");
      expect(c).toBeDefined();
    });

    it("no concerns for good practice", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
        ],
        arrangements: [makeArrangement()],
      }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies high quality contacts", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "quality");
      expect(s).toBeDefined();
    });

    it("identifies consistent contacts", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
        ],
      }));
      const s = result.strengths.find(s => s.category === "consistency");
      expect(s).toBeDefined();
    });

    it("identifies child voice support", () => {
      const result = analyseContact(makeInput({
        childConsultedOnPlan: true,
        advocateAvailableForContact: true,
      }));
      const s = result.strengths.find(s => s.category === "voice");
      expect(s).toBeDefined();
    });

    it("identifies life story work", () => {
      const result = analyseContact(makeInput({ lifestoryWorkStarted: true }));
      const s = result.strengths.find(s => s.category === "identity");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ──────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("CHR 2015 Reg 9 met for good contact", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
          makeSession({ occurred: true }),
        ],
        contactPlanReviewed: true,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 9");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("CHR 2015 Reg 9 not_met for very high missed rate", () => {
      const sessions = [
        makeSession({ occurred: false, actualDuration: 0 }),
        makeSession({ occurred: false, actualDuration: 0 }),
        makeSession({ occurred: false, actualDuration: 0 }),
        makeSession({ occurred: true }),
        makeSession({ occurred: false, actualDuration: 0 }),
        makeSession({ occurred: false, actualDuration: 0 }),
      ];
      const result = analyseContact(makeInput({
        contactSessions: sessions,
        contactPlanReviewed: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 9");
      expect(flag).toBeDefined();
      // missedRate = 5/6 ≈ 0.83 → not_met
      expect(flag!.status).toBe("not_met");
    });

    it("Children Act s34 met for court-ordered contact compliance", () => {
      const result = analyseContact(makeInput({
        contactSessions: Array.from({ length: 12 }, () => makeSession({ personName: "Mum" })),
        arrangements: [makeArrangement({ personName: "Mum", courtOrdered: true, agreedFrequencyPerMonth: 4 })],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "Children Act 1989 s34");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("SCCIF met when relationships maintained and child voiced", () => {
      const result = analyseContact(makeInput({
        contactSessions: [makeSession()],
        childConsultedOnPlan: true,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("SCCIF not_met when no contact occurring", () => {
      const result = analyseContact(makeInput({
        contactSessions: [],
        childConsultedOnPlan: false,
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "SCCIF");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("IRO Handbook met when plan reviewed", () => {
      const result = analyseContact(makeInput({ contactPlanReviewed: true }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "IRO Handbook");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("IRO Handbook not_met when plan not reviewed", () => {
      const result = analyseContact(makeInput({ contactPlanReviewed: false }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "IRO Handbook");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends reviewing high missed rate", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0 }),
          makeSession({ occurred: false, actualDuration: 0 }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("missed rate"))).toBe(true);
    });

    it("recommends reviewing distressing contacts", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "distressing" }),
          makeSession({ outcome: "positive" }),
        ],
      }));
      expect(result.recommendations.some(r => r.includes("distress"))).toBe(true);
    });

    it("recommends consulting child", () => {
      const result = analyseContact(makeInput({ childConsultedOnPlan: false }));
      expect(result.recommendations.some(r => r.includes("Consult child"))).toBe(true);
    });

    it("recommends life story work", () => {
      const result = analyseContact(makeInput({ lifestoryWorkStarted: false }));
      expect(result.recommendations.some(r => r.includes("life story"))).toBe(true);
    });

    it("recommends sibling review", () => {
      const result = analyseContact(makeInput({ siblingPlacementConsidered: false }));
      expect(result.recommendations.some(r => r.includes("sibling"))).toBe(true);
    });

    it("recommends advocacy", () => {
      const result = analyseContact(makeInput({ advocateAvailableForContact: false }));
      expect(result.recommendations.some(r => r.includes("advocacy"))).toBe(true);
    });

    it("minimal recommendations for good practice", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ outcome: "positive" }),
          makeSession({ outcome: "positive" }),
        ],
        arrangements: [makeArrangement()],
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────

  describe("Summary", () => {
    it("includes child name", () => {
      const result = analyseContact(makeInput({ childName: "Jordan" }));
      expect(result.summary).toContain("Jordan");
    });

    it("mentions no sessions when empty", () => {
      const result = analyseContact(makeInput());
      expect(result.summary).toContain("No contact sessions");
    });

    it("includes occurred count", () => {
      const result = analyseContact(makeInput({
        contactSessions: [
          makeSession({ occurred: true }),
          makeSession({ occurred: false, actualDuration: 0 }),
        ],
      }));
      expect(result.summary).toContain("1/2");
    });
  });
});
