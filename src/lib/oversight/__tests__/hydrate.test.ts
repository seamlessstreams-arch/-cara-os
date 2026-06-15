import { describe, it, expect } from "vitest";
import { incidentToOversightInput } from "../hydrate";
import type { Incident, YoungPerson } from "@/types";

// Minimal builders — the mapper only reads a subset of fields.
function mkIncident(over: Partial<Incident>): Incident {
  return {
    id: "inc_x",
    reference: "INC-TEST",
    type: "behaviour_incident",
    severity: "medium",
    child_id: "yp_alex",
    date: "2026-06-01",
    time: "12:00",
    location: "Home",
    description: "Something happened.",
    immediate_action: "Staff responded.",
    reported_by: "staff_edward",
    witnesses: [],
    body_map_required: false,
    body_map_completed: false,
    body_map_url: null,
    notifications: [],
    requires_oversight: true,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    home_id: "home_oak",
    created_at: "2026-06-01T12:00:00Z",
    updated_at: "2026-06-01T12:00:00Z",
    created_by: "staff_edward",
    updated_by: "staff_edward",
    ...over,
  } as Incident;
}

const ALEX: YoungPerson = {
  id: "yp_alex",
  first_name: "Alex",
  last_name: "M",
  preferred_name: "Alex",
  date_of_birth: "2012-06-01",
  risk_flags: ["missing from care", "child exploitation"],
  ethnicity: "White British",
  religion: null,
  social_worker_name: "Karen Holding",
} as YoungPerson;

const TODAY = "2026-06-14";

describe("incidentToOversightInput", () => {
  it("maps a physical intervention with a completed body map + manager oversight", () => {
    const inc = mkIncident({
      id: "inc_005",
      type: "physical_intervention",
      severity: "high",
      body_map_required: true,
      body_map_completed: true,
      oversight_by: "staff_darren",
      oversight_note: "Proportionate hold.",
      notifications: [
        { role: "Registered Manager", name: "Olivia", method: "Phone", notified_at: "2026-06-01T21:30:00Z", acknowledged: true },
        { role: "Social Worker", name: "Karen Holding", method: "Phone", notified_at: "2026-06-01T21:45:00Z", acknowledged: true },
      ],
    });
    const input = incidentToOversightInput(inc, { youngPerson: ALEX, today: TODAY });
    expect(input.recordType).toBe("physical_intervention");
    expect(input.restraintUsed).toBe(true);
    expect(input.existingRiskLevel).toBe("high");
    expect(input.injuriesRecordedOrRuledOut).toBe(true);
    expect(input.childName).toBe("Alex");
    expect(input.childAge).toBe(14);
    // body map paperwork recorded complete
    expect(input.workflowCompletionContext?.associatedPaperwork?.[0]).toMatchObject({ paperworkType: "body_map", status: "complete" });
    // manager oversight reflected
    expect(input.managementAccountabilityContext?.registeredManagerOversightCompleted).toBe(true);
    // referrals derived from notifications
    const kinds = input.referralContext?.referralsAndNotifications?.map((r) => r.type);
    expect(kinds).toEqual(expect.arrayContaining(["social_worker"]));
  });

  it("maps a critical safeguarding disclosure with exploitation + police", () => {
    const inc = mkIncident({
      id: "inc_004",
      type: "safeguarding_concern",
      severity: "critical",
      description: "Alex disclosed an older peer asking them to carry items — possible exploitation.",
      notifications: [
        { role: "Police", name: "MASH referral", method: "Phone", notified_at: "2026-06-01T20:00:00Z", acknowledged: false },
      ],
    });
    const input = incidentToOversightInput(inc, { youngPerson: ALEX, today: TODAY });
    expect(input.recordType).toBe("safeguarding");
    expect(input.disclosure).toBe(true);
    expect(input.exploitationConcern).toBe(true);
    expect(input.policeInvolved).toBe(true);
    expect(input.existingRiskLevel).toBe("critical");
    // unacknowledged notification is still recorded as made
    expect(input.referralContext?.referralsAndNotifications?.[0]).toMatchObject({ type: "police", completed: true });
  });

  it("maps a critical PI with ambulance + self-harm + injury", () => {
    const inc = mkIncident({
      id: "inc_007",
      type: "physical_intervention",
      severity: "critical",
      description: "Alex attempted to self-harm; minor bruise sustained.",
      body_map_required: true,
      body_map_completed: true,
      notifications: [
        { role: "NHS Ambulance", name: "EMAS", method: "999", notified_at: "2026-06-01T18:32:00Z", acknowledged: true },
      ],
    });
    const input = incidentToOversightInput(inc, { youngPerson: ALEX, today: TODAY });
    expect(input.emergencyServicesInvolved).toBe(true);
    expect(input.selfHarmConcern).toBe(true);
    expect(input.injury).toBe(true);
    expect(input.referralContext?.referralsAndNotifications?.[0].type).toBe("health");
  });

  it("derives recent context + repeated pattern from sibling incidents", () => {
    const target = mkIncident({ id: "inc_a", type: "physical_intervention", severity: "high" });
    const siblings = [
      target,
      mkIncident({ id: "inc_b", type: "physical_intervention", severity: "high" }),
      mkIncident({ id: "inc_c", type: "physical_intervention", severity: "medium" }),
      mkIncident({ id: "inc_d", type: "missing_from_care", severity: "high" }),
    ];
    const input = incidentToOversightInput(target, { youngPerson: ALEX, recentIncidents: siblings, today: TODAY });
    expect(input.recentContext?.recentIncidentsCount).toBe(3); // excludes the target itself
    expect(input.recentContext?.recentPhysicalInterventionsCount).toBe(2);
    expect(input.recentContext?.recentMissingEpisodesCount).toBe(1);
    expect(input.repeatedPattern).toBe(true);
    expect(input.patternContext?.patternConfidence).toBe("high"); // 2 prior PIs
  });

  it("maps a complaint to the complaint record type with no false safeguarding signals", () => {
    const inc = mkIncident({ id: "inc_003", type: "complaint", severity: "medium", description: "Jordan raised a complaint about noise." });
    const input = incidentToOversightInput(inc, { today: TODAY });
    expect(input.recordType).toBe("complaint");
    expect(input.restraintUsed).toBeUndefined();
    expect(input.allegation).toBeUndefined();
    expect(input.exploitationConcern).toBeUndefined();
  });

  it("surfaces recording-gap signals honestly from a thin incident record", () => {
    const inc = mkIncident({
      type: "behaviour_incident",
      severity: "high",
      description: "Behaviour incident occurred.", // no antecedent or child-voice language
      immediate_action: "", // no staff actions recorded
      status: "closed",
      outcome: null, // closed with no outcome
      lessons_learned: null,
      requires_oversight: true,
      oversight_note: null, // no manager oversight note
      notifications: [],
    });
    const input = incidentToOversightInput(inc, { youngPerson: ALEX, today: TODAY });
    expect(input.staffActionsRecorded).toBe(false);
    expect(input.childVoiceCaptured).toBe(false);
    expect(input.antecedentsIncluded).toBe(false);
    expect(input.outcomeRecorded).toBe(false);
    expect(input.managementActionRecorded).toBe(false);
    expect(input.lessonsLearnedRecorded).toBe(false);
  });

  it("does not over-flag a well-documented incident", () => {
    const inc = mkIncident({
      type: "physical_intervention",
      severity: "high",
      description: "Alex became agitated following a phone call and said he felt unheard; staff stayed calm.",
      immediate_action: "Team Teach hold used; Alex supported afterwards.",
      status: "closed",
      outcome: "No injuries; Alex settled.",
      lessons_learned: "Prepare Alex before contact calls.",
      requires_oversight: true,
      oversight_note: "Proportionate and least-restrictive.",
      body_map_required: true,
      body_map_completed: true,
    });
    const input = incidentToOversightInput(inc, { youngPerson: ALEX, today: TODAY });
    expect(input.antecedentsIncluded).toBe(true); // "following a phone call"
    expect(input.childVoiceCaptured).toBe(true); // "said he felt"
    expect(input.outcomeRecorded).toBe(true);
    expect(input.lessonsLearnedRecorded).toBe(true);
    expect(input.managementActionRecorded).toBe(true);
    expect(input.injuriesRecordedOrRuledOut).toBe(true);
  });
});
