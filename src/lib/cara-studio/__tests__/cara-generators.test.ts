import { describe, it, expect } from "vitest";
import { buildChildContext, type CaraChildContext } from "../cara-context-builder";
import { generateCaraSessionPlan } from "../cara-session-generator";
import { generateCaraCurriculumMap } from "../cara-curriculum-generator";
import { generateCaraConversationBlueprint } from "../cara-conversation-coach";
import { convertIncidentToLearning } from "../cara-incident-converter";
import { generateCaraInteractiveMaterial } from "../cara-material-generator";
import { generateStaffDebrief } from "../cara-debrief-builder";
import { adaptCaraContent } from "../cara-adaptation-engine";
import { runCaraGuardrails } from "../cara-guardrails";
import {
  CaraSessionPlanOutputSchema,
  CaraCurriculumMapOutputSchema,
  CaraConversationBlueprintOutputSchema,
  CaraIncidentLearningOutputSchema,
  CaraInteractiveMaterialOutputSchema,
  CaraStaffDebriefOutputSchema,
  CaraAdaptedContentOutputSchema,
  CARA_MATERIAL_TYPES,
  type CaraChildLearningProfile,
} from "../cara-types";

const TODAY = "2026-06-11";

function profile(over: Partial<CaraChildLearningProfile> = {}): CaraChildLearningProfile {
  return {
    id: "clp_1",
    child_id: "yp_alex",
    age: 14,
    developmental_age_notes: "Works at around 11–12 emotionally",
    communication_needs: "Short sentences, processing time",
    send_needs: "ADHD traits, suspected dyslexia",
    learning_style: { visual: true, audio: false, practical: true, movement_based: true, conversation_based: false, creative: true, low_literacy: true, short_bursts: true },
    attention_profile: "5–10 minute bursts",
    sensory_profile: "Noise-sensitive in the evenings",
    emotional_triggers: "Being told no in front of peers; family contact cancellations",
    calming_strategies: "Music, kicking a ball outside",
    trauma_considerations: "Neglect; multiple moves",
    cultural_identity_notes: null,
    literacy_level: "Reads reluctantly, writes very little",
    preferred_activities: "Football, drawing",
    avoided_topics: "Dad",
    trusted_adults: "Olivia, Marcus",
    known_strengths: "Funny, protective of younger kids",
    current_goals: "Settle at school",
    risk_themes: ["missing", "cannabis"],
    review_notes: null,
    created_by: "staff_darren",
    updated_by: "staff_darren",
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-01T09:00:00Z",
    ...over,
  };
}

function ctx(over: Partial<Parameters<typeof buildChildContext>[0]> = {}): CaraChildContext {
  return buildChildContext({
    child: { id: "yp_alex", first_name: "Alex", preferred_name: null, date_of_birth: "2012-03-01" },
    profile: profile(),
    recentIncidents: [{ date: "2026-06-09", type: "missing_from_care", severity: "high", description: "Left after family call cancelled, returned 2am" }],
    keyworkThemes: ["trust", "family time"],
    approvedResources: [],
    theme: "Trusting adults",
    today: TODAY,
    ...over,
  });
}

describe("context builder", () => {
  it("detects trigger and avoided-topic overlap and assembles context text", () => {
    const c = buildChildContext({
      child: { id: "yp_alex", first_name: "Alex", preferred_name: "Al", date_of_birth: "2012-03-01" },
      profile: profile(),
      recentIncidents: [],
      keyworkThemes: [],
      approvedResources: [],
      theme: "Family contact and mixed feelings",
      today: TODAY,
    });
    expect(c.name).toBe("Al");
    expect(c.age).toBe(14); // profile age wins
    expect(c.triggerMatch).toBe(true); // "family contact cancellations"
    expect(c.contextText).toMatch(/Risk themes: missing, cannabis/);
  });

  it("prefers approved library resources and reports usage", () => {
    const c = ctx({
      approvedResources: [
        { id: "res_1", title: "Trusting adults toolkit", resource_type: "guide", domain: "Trust and safe adults", age_range: "11-16", send_tags: [], trauma_tags: [], content: "x", source: "internal", source_type: "internal", approved: true, approved_by: "m", created_by: "m", created_at: TODAY, updated_at: TODAY },
        { id: "res_2", title: "Unapproved thing", resource_type: "guide", domain: "Trust", age_range: "11-16", send_tags: [], trauma_tags: [], content: "x", source: "internal", source_type: "internal", approved: false, approved_by: null, created_by: "m", created_at: TODAY, updated_at: TODAY },
      ],
    });
    expect(c.usedApprovedResource).toBe(true);
    expect(c.matchedResources.map((m) => m.id)).toEqual(["res_1"]);
  });
});

describe("session generator", () => {
  it("produces a schema-valid, guardrail-clean plan with the full structure", () => {
    const { output } = generateCaraSessionPlan({ ctx: ctx(), theme: "Trusting adults", aim: "Help Alex name one trusted adult", durationMinutes: 20, childReadiness: "medium", emotionalIntensity: "low", staffConfidence: "medium" });
    expect(CaraSessionPlanOutputSchema.safeParse(output).success).toBe(true);
    expect(runCaraGuardrails(output).passed).toBe(true);
    const steps = output.sessionStructure.map((s) => s.stepTitle);
    expect(steps[0]).toBe("Before you start");
    expect(steps).toContain("Child choice");
    expect(steps.some((s) => s.startsWith("Main activity"))).toBe(true);
  });

  it("micro-sessions compress but keep before/opening/closing; movement profile picks walk-and-talk", () => {
    const { output } = generateCaraSessionPlan({ ctx: ctx(), theme: "Sharing space", aim: "One small win", durationMinutes: 5, childReadiness: "low", emotionalIntensity: "low", staffConfidence: "low" });
    expect(output.title).toMatch(/micro-session/);
    expect(output.sessionStructure.length).toBeLessThan(8);
    expect(output.mainActivity).toMatch(/walk/i);
  });

  it("trigger overlap forces manager review and a pairing caution", () => {
    const { output, review } = generateCaraSessionPlan({ ctx: ctx({ theme: "Family contact" }), theme: "Family contact", aim: "Prepare for Saturday", durationMinutes: 20, childReadiness: "medium", emotionalIntensity: "medium", staffConfidence: "high" });
    expect(review.required).toBe(true);
    expect(output.managerReviewNeeded).toBe(true);
    expect(output.emotionalSafetyCheck).toMatch(/CAUTION/);
  });
});

describe("curriculum generator", () => {
  it("schema-valid; foundations first, independence last; risk themes drive domains", () => {
    const { output } = generateCaraCurriculumMap({ ctx: ctx(), desiredOutcomes: ["Safer free time"], timeframeWeeks: 8 });
    expect(CaraCurriculumMapOutputSchema.safeParse(output).success).toBe(true);
    expect(output.weeklyPlan[0].focus).toBe("Trust and safe adults");
    expect(output.weeklyPlan).toHaveLength(8);
    expect(output.curriculumDomains).toContain("Safety literacy"); // from "missing"
    expect(output.curriculumDomains).toContain("Health and wellbeing"); // from "cannabis"
    const last = output.weeklyPlan[output.weeklyPlan.length - 1].focus;
    expect(["Independence skills", "Self-advocacy"]).toContain(last);
  });

  it("clamps timeframe and stays deterministic", () => {
    const input = { ctx: ctx(), desiredOutcomes: [], timeframeWeeks: 4 };
    expect(generateCaraCurriculumMap(input)).toEqual(generateCaraCurriculumMap(input));
    expect(generateCaraCurriculumMap(input).output.weeklyPlan).toHaveLength(4);
  });

  it("blends preparation-for-adulthood independence skills into session ideas", () => {
    const { output } = generateCaraCurriculumMap({ ctx: ctx(), desiredOutcomes: ["Safer free time"], timeframeWeeks: 8 });
    const allIdeas = output.weeklyPlan.flatMap((w) => w.sessionIdeas);
    expect(allIdeas.some((i) => /Independence skill —/.test(i))).toBe(true);
  });
});

describe("conversation coach", () => {
  it("schema-valid with PACE language and avoid-phrases; high risk → review", () => {
    const { output, review } = generateCaraConversationBlueprint({ ctx: ctx(), conversationTopic: "staying out late", reasonForConversation: "missing episode on Monday", emotionalRisk: "high" });
    expect(CaraConversationBlueprintOutputSchema.safeParse(output).success).toBe(true);
    expect(review.required).toBe(true);
    expect(output.avoidPhrases).toContain("Why did you do that?");
    expect(output.openingLines.join(" ")).toMatch(/not here to have a go at you/i);
    expect(output.safetyQuestions.length).toBeGreaterThan(1);
    expect(runCaraGuardrails(output).passed).toBe(true);
  });
});

describe("incident converter", () => {
  it("infers themes from incident text and serious classes force review", () => {
    const missing = convertIncidentToLearning({ ctx: ctx(), incidentSummary: "Alex went missing after curfew and returned at 2am." });
    expect(CaraIncidentLearningOutputSchema.safeParse(missing.output).success).toBe(true);
    expect(missing.output.learningTheme).toMatch(/missing/i);
    expect(missing.output.managerReviewNeeded).toBe(true);

    const damage = convertIncidentToLearning({ ctx: ctx(), incidentSummary: "Kicked the door and smashed a plate after the phone call." });
    expect(damage.output.learningTheme).toMatch(/body|angry/i);
    expect(damage.output.nonShamingReframe).not.toMatch(/fault|bad kid/i);

    const peer = convertIncidentToLearning({ ctx: ctx(), incidentSummary: "Argument with another child over the PlayStation." });
    expect(peer.output.learningTheme).toMatch(/living with other/i);
    expect(peer.output.microSession.durationMinutes).toBeLessThanOrEqual(5);
  });

  it("outputs stay guardrail-clean (non-shaming by construction)", () => {
    const r = convertIncidentToLearning({ ctx: ctx(), incidentSummary: "Refused to attend school and ignored staff all morning." });
    expect(runCaraGuardrails(r.output).passed).toBe(true);
  });

  it("frames the unmet need through behaviour-as-communication drivers", () => {
    const r = convertIncidentToLearning({ ctx: ctx(), incidentSummary: "Alex went missing after curfew and returned at 2am." });
    expect(r.output.possibleUnmetNeed.some((n) => /Behaviour is communication/i.test(n))).toBe(true);
  });
});

describe("material generator", () => {
  it("every material type is schema-valid, guardrail-clean and has a low-writing alternative", () => {
    for (const type of CARA_MATERIAL_TYPES) {
      const { output } = generateCaraInteractiveMaterial({ ctx: ctx(), materialType: type, theme: "Online safety", difficulty: "gentle" });
      const parsed = CaraInteractiveMaterialOutputSchema.safeParse(output);
      expect(parsed.success, type).toBe(true);
      expect(runCaraGuardrails(output).passed, type).toBe(true);
      expect(output.lowWritingAlternative.length, type).toBeGreaterThan(10);
      expect(output.blocks.length, type).toBeGreaterThan(0);
      expect(output.printableText, type).toContain(output.blocks[0].heading.toUpperCase());
    }
  });

  it("exploitation-themed materials require manager review", () => {
    const { output } = generateCaraInteractiveMaterial({ ctx: ctx(), materialType: "exploitation_awareness_activity", theme: "Understanding exploitation and pressure", difficulty: "gentle" });
    expect(output.managerReviewNeeded).toBe(true);
  });
});

describe("adaptation engine", () => {
  it("applies need rules, plain language and numbered steps; schema-valid", () => {
    const out = adaptCaraContent({
      originalContent: "We will facilitate a session on emotional regulation. Subsequently the child should reflect upon consequences and communicate effectively.",
      adaptationNeeds: ["adhd", "low_literacy", "demand_avoidance"],
      format: "low_writing",
    });
    expect(CaraAdaptedContentOutputSchema.safeParse(out).success).toBe(true);
    expect(out.adaptedVersion).toMatch(/^1\./);
    expect(out.adaptedVersion).not.toMatch(/facilitate|subsequently/i);
    expect(out.adaptedVersion).toMatch(/big feelings/);
    expect(out.doNotDoList.join(" ")).toMatch(/No long worksheets/);
    expect(out.doNotDoList.join(" ")).toMatch(/you need to \/ you must/);
    expect(out.changesMade.length).toBeGreaterThan(3);
  });

  it("unknown needs are ignored gracefully", () => {
    const out = adaptCaraContent({ originalContent: "A simple piece of content here.", adaptationNeeds: ["unicorn_mode"], format: "text" });
    expect(out.adaptationNotes[0]).toMatch(/No specific needs declared/);
  });
});

describe("debrief builder", () => {
  it("schema-valid, non-blaming, honours staff feelings; serious incidents flag review", () => {
    const { output, review } = generateStaffDebrief({
      incidentSummary: "Restraint-free de-escalation of violence between two children",
      staffFeelings: "shaken and a bit guilty",
      whatDidNotWork: "I raised my voice early",
    });
    expect(CaraStaffDebriefOutputSchema.safeParse(output).success).toBe(true);
    expect(review.required).toBe(true); // violence theme
    expect(output.staffRegulationReminder).toMatch(/shaken/);
    expect(output.whatCouldBeImproved.join(" ")).toMatch(/raised my voice/);
    expect(runCaraGuardrails(output).passed).toBe(true);
    expect(output.staffGuidance).toMatch(/never disciplinary/i);
  });

  it("offers an R-Domain behaviour lens and a child-centred supervision question", () => {
    const { output } = generateStaffDebrief({ incidentSummary: "De-escalation after a difficult phone call" });
    expect(output.whatTheChildMayHaveBeenCommunicating.some((x) => /R-Domain/i.test(x))).toBe(true);
    expect(output.supervisionQuestions.some((q) => /recognise themselves/i.test(q))).toBe(true);
  });
});
