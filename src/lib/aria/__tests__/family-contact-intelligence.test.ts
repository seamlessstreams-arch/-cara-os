// ══════════════════════════════════════════════════════════════════════════════
// ARIA — Family Contact Intelligence Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { analyseFamilyContact } from "../family-contact-intelligence";
import type { FamilyContact, FamilyContactInput, ContactPlanRequirement } from "../family-contact-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeContact(overrides?: Partial<FamilyContact>): FamilyContact {
  return {
    id: `contact_${Math.random().toString(36).slice(2, 8)}`,
    date: "2026-05-10",
    contactType: "face_to_face",
    familyMember: "Mum",
    familyMemberRelation: "mother",
    planned: true,
    occurred: true,
    quality: "positive",
    childMoodBefore: 3,
    childMoodAfter: 4,
    ...overrides,
  };
}

function makeRequirement(overrides?: Partial<ContactPlanRequirement>): ContactPlanRequirement {
  return {
    familyMember: "Mum",
    relation: "mother",
    requiredFrequency: "weekly",
    contactType: "face_to_face",
    supervised: false,
    ...overrides,
  };
}

function makeInput(overrides?: Partial<FamilyContactInput>): FamilyContactInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    contacts: [],
    planRequirements: [],
    placementStartDate: "2026-01-01",
    ...overrides,
  };
}

// Generate a series of weekly contacts over 8 weeks
function generateWeeklyContacts(
  member: string,
  relation: FamilyContact["familyMemberRelation"],
  weeks: number,
  quality: FamilyContact["quality"] = "positive",
): FamilyContact[] {
  const contacts: FamilyContact[] = [];
  for (let i = 0; i < weeks; i++) {
    const date = new Date(2026, 3, 1 + i * 7).toISOString().slice(0, 10);
    contacts.push(makeContact({
      date,
      familyMember: member,
      familyMemberRelation: relation,
      quality,
      childMoodBefore: quality === "positive" ? 3 : quality === "negative" ? 3 : 3,
      childMoodAfter: quality === "positive" ? 4 : quality === "negative" ? 2 : 3,
    }));
  }
  return contacts;
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("family-contact-intelligence", () => {
  describe("analyseFamilyContact", () => {
    it("returns a complete assessment structure", () => {
      const result = analyseFamilyContact(makeInput());
      expect(result.childId).toBe("child_1");
      expect(result.childName).toBe("Jordan");
      expect(result.assessedAt).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.overallRating).toBeDefined();
      expect(result.complianceScore).toBeDefined();
      expect(result.qualityScore).toBeDefined();
      expect(result.emotionalImpactScore).toBeDefined();
      expect(result.memberAnalysis).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.concerns).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.regulatoryFlags).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("rates excellent when all contacts are positive and compliant", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 8, "positive");
      const result = analyseFamilyContact(makeInput({
        contacts,
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      expect(result.overallRating).toBe("excellent");
      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.complianceScore).toBe(100);
    });

    it("rates inadequate when no contacts have occurred despite requirements", () => {
      const result = analyseFamilyContact(makeInput({
        contacts: [],
        planRequirements: [
          makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" }),
          makeRequirement({ familyMember: "Dad", relation: "father", requiredFrequency: "fortnightly" }),
        ],
      }));
      expect(result.overallRating).toBe("inadequate");
      expect(result.complianceScore).toBe(0);
    });

    it("calculates compliance correctly for partial attendance", () => {
      // 4 out of 8 expected weekly contacts
      const contacts = generateWeeklyContacts("Mum", "mother", 4, "positive");
      const result = analyseFamilyContact(makeInput({
        contacts,
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      expect(result.complianceScore).toBe(50);
    });

    it("scores quality correctly for all positive contacts", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 6, "positive");
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.qualityScore).toBe(100);
    });

    it("scores quality lower for negative contacts", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 6, "negative");
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.qualityScore).toBeLessThan(30);
    });

    it("scores quality for mixed contacts", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 6, "mixed");
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.qualityScore).toBe(50);
    });

    it("calculates emotional impact when mood improves", () => {
      const contacts = Array.from({ length: 6 }, (_, i) => makeContact({
        date: `2026-04-${(i + 1).toString().padStart(2, "0")}`,
        childMoodBefore: 2,
        childMoodAfter: 4,
      }));
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.emotionalImpactScore).toBe(100);
    });

    it("calculates emotional impact when mood drops", () => {
      const contacts = Array.from({ length: 6 }, (_, i) => makeContact({
        date: `2026-04-${(i + 1).toString().padStart(2, "0")}`,
        childMoodBefore: 4,
        childMoodAfter: 2,
      }));
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.emotionalImpactScore).toBe(10);
    });

    it("calculates neutral emotional impact when no mood change", () => {
      const contacts = Array.from({ length: 6 }, (_, i) => makeContact({
        date: `2026-04-${(i + 1).toString().padStart(2, "0")}`,
        childMoodBefore: 3,
        childMoodAfter: 3,
      }));
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.emotionalImpactScore).toBe(50);
    });
  });

  describe("member analysis", () => {
    it("groups contacts by family member", () => {
      const contacts = [
        ...generateWeeklyContacts("Mum", "mother", 4),
        ...generateWeeklyContacts("Dad", "father", 3),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.memberAnalysis.length).toBe(2);
      const mum = result.memberAnalysis.find(m => m.familyMember === "Mum");
      const dad = result.memberAnalysis.find(m => m.familyMember === "Dad");
      expect(mum!.occurredCount).toBe(4);
      expect(dad!.occurredCount).toBe(3);
    });

    it("tracks cancellations by canceller", () => {
      const contacts = [
        makeContact({ occurred: true }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "child" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      const mum = result.memberAnalysis.find(m => m.familyMember === "Mum")!;
      expect(mum.cancelledByFamily).toBe(2);
      expect(mum.cancelledByChild).toBe(1);
      expect(mum.cancelledCount).toBe(3);
    });

    it("calculates average quality", () => {
      const contacts = [
        makeContact({ quality: "positive" }),
        makeContact({ quality: "positive" }),
        makeContact({ quality: "mixed" }),
        makeContact({ quality: "negative" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      const mum = result.memberAnalysis.find(m => m.familyMember === "Mum")!;
      // (1 + 1 + 0.5 + 0) / 4 = 0.625
      expect(mum.averageQuality).toBeCloseTo(0.625);
    });

    it("calculates average mood change", () => {
      const contacts = [
        makeContact({ childMoodBefore: 3, childMoodAfter: 5 }),  // +2
        makeContact({ childMoodBefore: 3, childMoodAfter: 4 }),  // +1
        makeContact({ childMoodBefore: 3, childMoodAfter: 2 }),  // -1
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      const mum = result.memberAnalysis.find(m => m.familyMember === "Mum")!;
      // (2 + 1 + -1) / 3 ≈ 0.67
      expect(mum.averageMoodChange).toBeCloseTo(0.667, 1);
    });

    it("includes required members with no contacts", () => {
      const result = analyseFamilyContact(makeInput({
        contacts: [],
        planRequirements: [makeRequirement({ familyMember: "Dad", relation: "father" })],
      }));
      const dad = result.memberAnalysis.find(m => m.familyMember === "Dad");
      expect(dad).toBeDefined();
      expect(dad!.occurredCount).toBe(0);
    });

    it("detects improving trend", () => {
      const contacts = [
        makeContact({ date: "2026-04-01", quality: "negative" }),
        makeContact({ date: "2026-04-08", quality: "negative" }),
        makeContact({ date: "2026-04-15", quality: "mixed" }),
        makeContact({ date: "2026-04-22", quality: "positive" }),
        makeContact({ date: "2026-04-29", quality: "positive" }),
        makeContact({ date: "2026-05-06", quality: "positive" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      const mum = result.memberAnalysis.find(m => m.familyMember === "Mum")!;
      expect(mum.trend).toBe("improving");
    });

    it("detects declining trend", () => {
      const contacts = [
        makeContact({ date: "2026-04-01", quality: "positive" }),
        makeContact({ date: "2026-04-08", quality: "positive" }),
        makeContact({ date: "2026-04-15", quality: "positive" }),
        makeContact({ date: "2026-04-22", quality: "mixed" }),
        makeContact({ date: "2026-04-29", quality: "negative" }),
        makeContact({ date: "2026-05-06", quality: "negative" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      const mum = result.memberAnalysis.find(m => m.familyMember === "Mum")!;
      expect(mum.trend).toBe("declining");
    });
  });

  describe("pattern detection", () => {
    it("detects family cancellation pattern", () => {
      const contacts = [
        makeContact({ occurred: true }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.some(p => p.type === "family_cancellation_pattern")).toBe(true);
    });

    it("detects child refusal pattern", () => {
      const contacts = [
        makeContact({ occurred: false, cancelledBy: "child" }),
        makeContact({ occurred: false, cancelledBy: "child" }),
        makeContact({ occurred: true }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.some(p => p.type === "child_refusal_pattern")).toBe(true);
    });

    it("detects post-contact distress pattern", () => {
      const contacts = [
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, date: "2026-04-01" }),
        makeContact({ childMoodBefore: 4, childMoodAfter: 2, date: "2026-04-08" }),
        makeContact({ childMoodBefore: 3, childMoodAfter: 4, date: "2026-04-15" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.some(p => p.type === "post_contact_distress")).toBe(true);
    });

    it("detects contact-triggered incidents", () => {
      const contacts = [
        makeContact({ incidentAfter: true, date: "2026-04-01" }),
        makeContact({ incidentAfter: true, date: "2026-04-08" }),
        makeContact({ incidentAfter: false, date: "2026-04-15" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.some(p => p.type === "contact_triggered_incidents")).toBe(true);
    });

    it("detects quality declining pattern", () => {
      const contacts = [
        makeContact({ date: "2026-04-01", quality: "positive" }),
        makeContact({ date: "2026-04-08", quality: "positive" }),
        makeContact({ date: "2026-04-15", quality: "mixed" }),
        makeContact({ date: "2026-04-22", quality: "negative" }),
        makeContact({ date: "2026-04-29", quality: "negative" }),
        makeContact({ date: "2026-05-06", quality: "negative" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.some(p => p.type === "quality_declining")).toBe(true);
    });

    it("detects consistent positive pattern", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 6, "positive");
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.some(p => p.type === "consistent_positive")).toBe(true);
    });

    it("does not detect patterns with insufficient data", () => {
      const contacts = [makeContact({ occurred: true })];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.patterns.filter(p => p.type === "family_cancellation_pattern")).toHaveLength(0);
      expect(result.patterns.filter(p => p.type === "child_refusal_pattern")).toHaveLength(0);
    });
  });

  describe("concern identification", () => {
    it("raises concern when no contact despite requirement", () => {
      const result = analyseFamilyContact(makeInput({
        contacts: [],
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      expect(result.concerns.some(c => c.category === "compliance")).toBe(true);
      expect(result.concerns.some(c => c.severity === "significant")).toBe(true);
    });

    it("raises concern for high family cancellation rate", () => {
      const contacts = [
        makeContact({ occurred: true }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.concerns.some(c => c.category === "engagement")).toBe(true);
    });

    it("raises concern for child refusal", () => {
      const contacts = [
        makeContact({ occurred: false, cancelledBy: "child" }),
        makeContact({ occurred: false, cancelledBy: "child" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.concerns.some(c => c.category === "child_voice")).toBe(true);
    });

    it("raises concern for consistently negative quality", () => {
      const contacts = [
        makeContact({ quality: "negative" }),
        makeContact({ quality: "negative" }),
        makeContact({ quality: "negative" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.concerns.some(c => c.category === "quality")).toBe(true);
    });

    it("raises critical concern for repeated mood drops", () => {
      const contacts = [
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, date: "2026-04-01" }),
        makeContact({ childMoodBefore: 4, childMoodAfter: 2, date: "2026-04-08" }),
        makeContact({ childMoodBefore: 3, childMoodAfter: 1, date: "2026-04-15" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.concerns.some(c => c.severity === "critical" && c.category === "emotional_impact")).toBe(true);
    });

    it("raises concern for contact-linked incidents", () => {
      const contacts = [
        makeContact({ incidentAfter: true }),
        makeContact({ incidentDuring: true }),
        makeContact({ incidentAfter: true }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.concerns.some(c => c.category === "safety")).toBe(true);
    });

    it("sorts concerns by severity", () => {
      const contacts = [
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, date: "2026-04-01" }),
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, date: "2026-04-08" }),
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, date: "2026-04-15" }),
        makeContact({ occurred: false, cancelledBy: "family", date: "2026-04-22" }),
        makeContact({ occurred: false, cancelledBy: "family", date: "2026-04-29" }),
        makeContact({ occurred: false, cancelledBy: "family", date: "2026-05-06" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      if (result.concerns.length >= 2) {
        const severityOrder = { critical: 0, significant: 1, moderate: 2, low: 3 };
        for (let i = 0; i < result.concerns.length - 1; i++) {
          expect(severityOrder[result.concerns[i].severity]).toBeLessThanOrEqual(
            severityOrder[result.concerns[i + 1].severity]
          );
        }
      }
    });
  });

  describe("regulatory flags", () => {
    it("flags Reg 7 as met when contacts are compliant", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 8, "positive");
      const result = analyseFamilyContact(makeInput({
        contacts,
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      const reg7 = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 7");
      expect(reg7).toBeDefined();
      expect(reg7!.status).toBe("met");
    });

    it("flags Reg 7 as not met when no contacts occur", () => {
      const result = analyseFamilyContact(makeInput({
        contacts: [],
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      const reg7 = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 7");
      expect(reg7).toBeDefined();
      expect(reg7!.status).toBe("not_met");
    });

    it("flags Reg 7(2)(a) as met when positive contacts exist", () => {
      const contacts = [makeContact({ quality: "positive" })];
      const result = analyseFamilyContact(makeInput({ contacts }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 7(2)(a)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("met");
    });

    it("flags sibling contact regulation when sibling requirements exist", () => {
      const contacts = generateWeeklyContacts("Sister", "sibling", 4, "positive");
      const result = analyseFamilyContact(makeInput({
        contacts,
        planRequirements: [makeRequirement({ familyMember: "Sister", relation: "sibling", requiredFrequency: "fortnightly" })],
      }));
      const siblingFlag = result.regulatoryFlags.find(f => f.regulation.includes("Children Act"));
      expect(siblingFlag).toBeDefined();
      expect(siblingFlag!.status).toBe("met");
    });

    it("flags sibling contact as not met when no sibling contacts occur", () => {
      const result = analyseFamilyContact(makeInput({
        contacts: [],
        planRequirements: [makeRequirement({ familyMember: "Brother", relation: "sibling", requiredFrequency: "monthly" })],
      }));
      const siblingFlag = result.regulatoryFlags.find(f => f.regulation.includes("Children Act"));
      expect(siblingFlag).toBeDefined();
      expect(siblingFlag!.status).toBe("not_met");
    });
  });

  describe("recommendations", () => {
    it("generates recommendations for inadequate rating", () => {
      const result = analyseFamilyContact(makeInput({
        contacts: [],
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.toLowerCase().includes("review"))).toBe(true);
    });

    it("generates recommendations for declining quality", () => {
      const contacts = [
        makeContact({ date: "2026-04-01", quality: "positive" }),
        makeContact({ date: "2026-04-08", quality: "positive" }),
        makeContact({ date: "2026-04-15", quality: "positive" }),
        makeContact({ date: "2026-04-22", quality: "mixed" }),
        makeContact({ date: "2026-04-29", quality: "negative" }),
        makeContact({ date: "2026-05-06", quality: "negative" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.recommendations.some(r => r.toLowerCase().includes("declining"))).toBe(true);
    });

    it("limits recommendations to 5", () => {
      const contacts = [
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, incidentAfter: true }),
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, incidentAfter: true }),
        makeContact({ childMoodBefore: 4, childMoodAfter: 1, incidentAfter: true }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "family" }),
        makeContact({ occurred: false, cancelledBy: "child" }),
        makeContact({ occurred: false, cancelledBy: "child" }),
      ];
      const result = analyseFamilyContact(makeInput({
        contacts,
        planRequirements: [makeRequirement({ familyMember: "Mum", requiredFrequency: "weekly" })],
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe("summary", () => {
    it("includes child name in summary", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 4, "positive");
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.summary).toContain("Jordan");
    });

    it("includes score in summary", () => {
      const contacts = generateWeeklyContacts("Mum", "mother", 4, "positive");
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.summary).toMatch(/\d+%/);
    });

    it("includes attendance stats when planned contacts exist", () => {
      const contacts = [
        makeContact({ planned: true, occurred: true }),
        makeContact({ planned: true, occurred: true }),
        makeContact({ planned: true, occurred: false, cancelledBy: "family" }),
      ];
      const result = analyseFamilyContact(makeInput({ contacts }));
      expect(result.summary).toContain("2 of 3");
    });
  });
});
