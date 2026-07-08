import { describe, it, expect } from "vitest";
import { buildPracticeLens } from "@/lib/oversight/practice-lens";
import { buildCaraIntelligence } from "@/lib/oversight/cara-intelligence";
import { generateManagementOversight } from "@/lib/oversight/management-oversight-engine";
import type { OversightInput } from "@/lib/oversight/types";

const base = (over: Partial<OversightInput>): OversightInput => ({
  oversightMode: "professional",
  recordType: "incident",
  childName: "Alex",
  ...over,
});

describe("Oversight — full practice-intelligence lens", () => {
  it("scans the narrative for contextual-safeguarding signals (extra-familial harm)", () => {
    const lens = buildPracticeLens(
      base({
        practiceLensContext: {
          narrativeText:
            "Alex returned late from the park with older friends staff did not recognise. He had new trainers and money he could not account for, and was messaging on Snapchat throughout.",
        },
      }),
    );
    expect(lens.contextualSafeguarding.length).toBeGreaterThan(0);
    expect(lens.contextualSafeguarding.join(" ").toLowerCase()).toContain("guardianship");
  });

  it("uses the child's Digital Twin: flags escalating phrasing and unused known-helps", () => {
    const lens = buildPracticeLens(
      base({
        practiceLensContext: {
          narrativeText: "Staff told Alex to calm down and he was informed he had lost his privileges.",
          childPhrasesThatEscalate: ["Calm down.", "You've lost your privileges."],
          childWhatHelps: ["Time in his room with music", "A walk in the garden"],
          childStrengths: ["Loyal to his mates", "Good at football"],
        },
      }),
    );
    const all = lens.childLens.join(" ").toLowerCase();
    expect(all).toContain("escalating");
    expect(all).toMatch(/help/);
    expect(all).toContain("strengths");
  });

  it("considers training currency for the involved staff (learning need, not blame)", () => {
    const lens = buildPracticeLens(
      base({
        recordType: "physical_intervention",
        practiceLensContext: {
          narrativeText: "A standing hold was used for two minutes.",
          staffTraining: [
            { staffName: "Sam Field", course: "Physical Intervention (Team Teach)", status: "expired", mandatory: true },
            { staffName: "Sam Field", course: "Food Hygiene", status: "expired", mandatory: false },
          ],
        },
      }),
    );
    expect(lens.trainingConsiderations.length).toBe(1); // relevant course only
    expect(lens.trainingConsiderations[0]).toContain("Sam Field");
    expect(lens.trainingConsiderations[0].toLowerCase()).toContain("learning need");
  });

  it("grounds the reflection in the loaded frameworks by record type", () => {
    const restraint = buildPracticeLens(base({ recordType: "physical_intervention", practiceLensContext: { narrativeText: "hold used" } }));
    expect(restraint.knowledgeGrounding.join(" ")).toMatch(/PACE|repair/i);
    const missing = buildPracticeLens(base({ recordType: "missing_from_care", practiceLensContext: { narrativeText: "left the home" } }));
    expect(missing.knowledgeGrounding.join(" ").toLowerCase()).toContain("contextual safeguarding");
  });

  it("flows into buildCaraIntelligence and the generated professional draft", () => {
    const input = base({
      oversightMode: "professional",
      recordType: "physical_intervention",
      summary: "Alex was held after throwing a chair when told his family contact was cancelled.",
      practiceLensContext: {
        narrativeText: "Alex was told to calm down after family contact was cancelled; a standing hold followed.",
        childPhrasesThatEscalate: ["Calm down."],
        childWhatHelps: ["A walk in the garden"],
        childTriggers: ["Family contact being cancelled"],
        childStrengths: ["Good at football"],
        staffTraining: [{ staffName: "Sam Field", course: "Team Teach refresher", status: "overdue", mandatory: true }],
      },
    });
    const intel = buildCaraIntelligence(input);
    expect(intel.practiceLensFindings.length).toBeGreaterThanOrEqual(4);

    const result = generateManagementOversight(input);
    const draft = result.professionalOversight ?? "";
    expect(draft.toLowerCase()).toContain("escalating");
    expect(draft).toContain("Sam Field");
    expect(draft).toMatch(/PACE|repair/i);
  });

  it("is silent when there is nothing to say (no false alarms)", () => {
    const lens = buildPracticeLens(base({ practiceLensContext: { narrativeText: "Alex had a settled evening watching a film with staff." } }));
    expect(lens.contextualSafeguarding.length).toBe(0);
    expect(lens.trainingConsiderations.length).toBe(0);
  });
});
