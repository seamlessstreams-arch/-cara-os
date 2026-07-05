// ══════════════════════════════════════════════════════════════════════════════
// CARA — POST-INCIDENT REFLECTION ASSEMBLY TESTS
//
// Pins: the pack pre-populates from records (previous related incidents, time/
// location patterns, triggers, restraint, child voice, escalation); every
// suggestion cites its records; "insufficient data" is stated honestly rather
// than guessed; and applying suggestions NEVER overwrites what a human wrote.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { assembleReflectionPack, applyAssemblySuggestions, type ReflectionAssemblyInput } from "../reflection-assembly";
import { freshStages } from "../types";
import type { PostIncidentReflection } from "../types";

const input = (overrides: Partial<ReflectionAssemblyInput> = {}): ReflectionAssemblyInput => ({
  incident: {
    id: "inc_007",
    date: "2026-06-25",
    time: "18:30",
    type: "physical_intervention",
    severity: "critical",
    location: "Alex's Bedroom",
    description: "Alex attempted self-harm during a conversation about court proceedings.",
    immediateAction: "Wrap hold used; ambulance precaution.",
    childId: "yp_alex",
  },
  previousIncidents: [
    { id: "inc_005", date: "2026-05-31", time: "21:15", type: "physical_intervention", severity: "high", location: "Communal Lounge", description: "PI after family call." },
    { id: "inc_006", date: "2026-06-13", time: "14:50", type: "physical_intervention", severity: "high", location: "Upstairs Corridor", description: "PI in corridor." },
    { id: "inc_002", date: "2026-06-01", time: "08:15", type: "medication_error", severity: "medium", location: "Med Room", description: "Late med." },
  ],
  behaviourEntries: [
    { id: "b1", date: "2026-06-10", direction: "concern", intensity: "high", trigger: "family contact", behaviour: "x" },
    { id: "b2", date: "2026-06-17", direction: "concern", intensity: "moderate", trigger: "family contact", behaviour: "y" },
    { id: "b3", date: "2026-06-20", direction: "concern", intensity: "high", trigger: "court proceedings", behaviour: "z" },
    { id: "b4", date: "2026-06-22", direction: "concern", intensity: "high", trigger: "court proceedings", behaviour: "w" },
  ],
  linkedRestraint: { id: "rst_007", duration: 7, restraint_type: "other", child_debriefed: false, de_escalation_attempts: ["Calm narration"], injuries: [] },
  escalationDecisions: [{ id: "escd_1", suggestedLevel: "immediate_safeguarding", confirmedLevel: "immediate_safeguarding", status: "decided" }],
  childQuotes: [],
  medicationContext: [],
  ...overrides,
});

describe("assembleReflectionPack", () => {
  const a = assembleReflectionPack(input());

  it("pulls previous RELATED incidents (same type or location), not unrelated ones", () => {
    const ids = a.previousRelated.map((p) => p.id);
    expect(ids).toContain("inc_005"); // same type (PI)
    expect(ids).toContain("inc_006"); // same type (PI)
    expect(ids).not.toContain("inc_002"); // medication error — unrelated
  });

  it("reads the evening time-of-day window as a pattern with its sources", () => {
    const time = a.patterns.find((p) => p.label === "Time of day")!;
    expect(time.sufficientData).toBe(true);
    expect(time.detail).toMatch(/evening/i);
    expect(time.sources.length).toBeGreaterThan(0);
  });

  it("suggests likely_triggers from the recurring behaviour triggers", () => {
    expect(a.suggestions.likely_triggers).toMatch(/family contact/i);
    expect(a.suggestions.likely_triggers).toMatch(/court proceedings/i);
  });

  it("folds the linked restraint into the staff_response suggestion", () => {
    expect(a.suggestions.staff_response).toMatch(/7-minute/);
    expect(a.suggestions.staff_response).toMatch(/de-escalation/i);
  });

  it("flags the repair gap when a restraint has no child debrief", () => {
    expect(a.patterns.some((p) => p.label === "Repair gap")).toBe(true);
  });

  it("carries the confirmed escalation as context", () => {
    expect(a.patterns.some((p) => p.label === "Escalation" && /immediate safeguarding/i.test(p.detail))).toBe(true);
  });

  it("every source is cited and de-duplicated", () => {
    const keys = a.sources.map((s) => `${s.recordType}/${s.recordId}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("incidents/inc_007");
  });
});

describe("honesty — insufficient data is stated, not guessed", () => {
  it("says insufficient data when there are fewer than three timed incidents", () => {
    const a = assembleReflectionPack(input({ previousIncidents: [] }));
    const time = a.patterns.find((p) => p.label === "Time of day")!;
    expect(time.sufficientData).toBe(false);
    expect(time.detail).toMatch(/insufficient data/i);
  });

  it("flags missing child voice instead of inventing a quote", () => {
    const a = assembleReflectionPack(input({ childQuotes: [] }));
    expect(a.suggestions.child_view).toBeUndefined();
    expect(a.patterns.some((p) => p.label === "Child voice" && /not yet in the records/i.test(p.detail))).toBe(true);
  });

  it("uses the child's quoted words for child_view when the records hold them", () => {
    const a = assembleReflectionPack(input({ childQuotes: [{ recordId: "b5", recordType: "behaviourLog", quote: "I didn't want to hurt anyone" }] }));
    expect(a.suggestions.child_view).toMatch(/I didn't want to hurt anyone/);
  });
});

describe("applyAssemblySuggestions — never overwrites a human", () => {
  const bare = (): PostIncidentReflection => ({
    id: "pir_1", incident_id: "inc_007", child_id: "yp_alex", home_id: "home_oak",
    incident_date: "2026-06-25", severity: "critical",
    what_happened: "", location: "", who_involved: "",
    impact_on_child: "", impact_on_others: "", impact_on_staff: "", impact_on_environment: "",
    likely_triggers: "", contributing_factors: "", communication_factors: "", sensory_environmental_factors: "",
    staff_response: "", response_helped: "unknown", response_escalated: "unknown",
    what_went_well: "", what_could_be_different: "", child_view: "", staff_reflection: "", manager_reflection: "",
    learning_points: "", actions: [], support_needed: "",
    staying_safe_plan_review: false, risk_assessment_review: false, behaviour_support_review: false,
    relationship_map_review: false, restrictive_practice_review: false,
    staff_debrief_done: "unknown", child_debrief_done: "unknown",
    stages: freshStages("2026-06-26T09:00:00Z"), status: "in_progress",
    manager_id: null, signed_off_by: null, signed_off_at: null,
    created_at: "2026-06-26T09:00:00Z", updated_at: "2026-06-26T09:00:00Z", created_by: "staff_test", updated_by: "staff_test",
  });

  it("pre-fills empty derivable fields and reports which it filled", () => {
    const a = assembleReflectionPack(input());
    const { reflection, prefilled } = applyAssemblySuggestions(bare(), a);
    expect(prefilled).toContain("likely_triggers");
    expect(reflection.likely_triggers).toMatch(/family contact/i);
  });

  it("does NOT overwrite a field a human already wrote", () => {
    const a = assembleReflectionPack(input());
    const r = bare();
    r.likely_triggers = "Staff already recorded: it was the court letter.";
    const { reflection, prefilled } = applyAssemblySuggestions(r, a);
    expect(prefilled).not.toContain("likely_triggers");
    expect(reflection.likely_triggers).toBe("Staff already recorded: it was the court letter.");
  });
});
