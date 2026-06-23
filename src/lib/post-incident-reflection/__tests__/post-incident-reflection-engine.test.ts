import { describe, it, expect } from "vitest";
import {
  analysePostIncidentReflection,
  buildReflectionOverview,
} from "../post-incident-reflection-engine";
import { freshStages, type PostIncidentReflection } from "../types";

const NOW = "2026-06-23T12:00:00.000Z";

function reflection(over: Partial<PostIncidentReflection> = {}): PostIncidentReflection {
  const stages = freshStages(NOW).map((s) =>
    ["incident_recorded", "immediate_safety", "staff_reflection", "child_debrief", "manager_oversight"].includes(s.key)
      ? { ...s, status: "completed" as const }
      : s,
  );
  return {
    id: "pir_1", incident_id: "inc_1", child_id: "yp_alex", home_id: "home_oak",
    incident_date: "2026-06-21", severity: "moderate",
    what_happened: "Kicked a door after a phone call", location: "Hallway", who_involved: "Alex, staff Mirela",
    impact_on_child: "Upset and dysregulated", impact_on_others: "None", impact_on_staff: "Mirela shaken", impact_on_environment: "Door dented",
    likely_triggers: "Phone call with family fell through", contributing_factors: "Tired, hungry",
    communication_factors: "Felt unheard", sensory_environmental_factors: "Loud hallway",
    staff_response: "Gave space then talked calmly", response_helped: "yes", response_escalated: "no",
    what_went_well: "Staff stayed calm", what_could_be_different: "Plan the call better",
    child_view: "Alex said he felt let down by the cancelled call",
    staff_reflection: "Could have prepped Alex for the call", manager_reflection: "Good de-escalation",
    learning_points: "Prepare Alex before family calls; have a backup activity",
    actions: [], support_needed: "None",
    staying_safe_plan_review: true, risk_assessment_review: false, behaviour_support_review: false,
    relationship_map_review: false, restrictive_practice_review: false,
    staff_debrief_done: "yes", child_debrief_done: "yes",
    stages, status: "in_progress", manager_id: "staff_dl", signed_off_by: null, signed_off_at: null,
    created_at: NOW, updated_at: NOW, created_by: "staff_mirela", updated_by: "staff_mirela",
    ...over,
  };
}

describe("analysePostIncidentReflection", () => {
  it("rates a thorough reflection highly with no high flags", () => {
    const a = analysePostIncidentReflection(reflection(), NOW);
    expect(a.progressPct).toBeGreaterThanOrEqual(50);
    expect(a.flags.some((f) => f.severity === "high")).toBe(false);
    expect(a.nextStageLabel).toBeTruthy();
  });

  it("flags a missing child view as high", () => {
    const a = analysePostIncidentReflection(reflection({ child_view: "" }), NOW);
    expect(a.flags.find((f) => f.key === "no-child-voice")?.severity).toBe("high");
    expect(a.needsManagerAttention).toBe(true);
  });

  it("flags a serious incident with no plan review", () => {
    const a = analysePostIncidentReflection(
      reflection({ severity: "serious", staying_safe_plan_review: false }),
      NOW,
    );
    expect(a.flags.some((f) => f.key === "serious-no-plan-update")).toBe(true);
  });

  it("flags overdue unresolved actions", () => {
    const a = analysePostIncidentReflection(
      reflection({ actions: [{ id: "a1", description: "Update plan", owner: "RM", due_date: "2026-06-01", status: "open" }] }),
      NOW,
    );
    expect(a.flags.find((f) => f.key === "unresolved-actions")?.severity).toBe("high");
  });

  it("computes stage progress from completed stages", () => {
    const a = analysePostIncidentReflection(reflection(), NOW);
    expect(a.stagesComplete).toBe(5);
    expect(a.stagesTotal).toBe(10);
    expect(a.progressPct).toBe(50);
  });
});

describe("buildReflectionOverview", () => {
  const children = [{ id: "yp_alex", name: "Alex" }, { id: "yp_jordan", name: "Jordan" }];

  it("reports settled with nothing outstanding", () => {
    const o = buildReflectionOverview({ now: NOW, reflections: [], incidents: [], children });
    expect(o.homeStatus).toBe("settled");
    expect(o.incidentsNeedingReflection).toHaveLength(0);
  });

  it("surfaces a recent incident with no reflection", () => {
    const incidents = [{ id: "inc_99", child_id: "yp_jordan", date: "2026-06-20", severity: "high", type: "physical", description: "x" }] as never[];
    const o = buildReflectionOverview({ now: NOW, reflections: [], incidents, children });
    expect(o.incidentsNeedingReflection).toHaveLength(1);
    expect(o.incidentsNeedingReflection[0].childName).toBe("Jordan");
    expect(o.alerts.some((a) => a.key === "incidents_no_reflection")).toBe(true);
    expect(o.homeStatus).toBe("action_needed");
  });

  it("does not surface an incident that already has a reflection", () => {
    const incidents = [{ id: "inc_1", child_id: "yp_alex", date: "2026-06-21", severity: "moderate", type: "verbal", description: "x" }] as never[];
    const o = buildReflectionOverview({ now: NOW, reflections: [reflection()], incidents, children });
    expect(o.incidentsNeedingReflection).toHaveLength(0);
  });

  it("detects a repeated trigger pattern for a child", () => {
    const r1 = reflection({ id: "pir_a", incident_id: "inc_a", likely_triggers: "family contact phone call cancelled" });
    const r2 = reflection({ id: "pir_b", incident_id: "inc_b", incident_date: "2026-06-10", likely_triggers: "another family contact call fell through" });
    const o = buildReflectionOverview({ now: NOW, reflections: [r1, r2], incidents: [], children });
    expect(o.repeatedTriggers.length).toBeGreaterThanOrEqual(1);
    expect(o.repeatedTriggers[0].childName).toBe("Alex");
    expect(o.alerts.some((a) => a.key === "repeated_triggers")).toBe(true);
  });

  it("is deterministic", () => {
    const args = { now: NOW, reflections: [reflection()], incidents: [], children };
    expect(buildReflectionOverview(args)).toEqual(buildReflectionOverview(args));
  });
});
