import { describe, it, expect, vi } from "vitest";

// Restraints consolidation's projection proof: capture rows come back as
// honest RestraintRecords — no statutory ground invented, no staff-debrief or
// medical-check claims, end time derived from recorded facts, composed (not
// authored) narrative, notification entries only for recorded-true flags.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  const home = "33333333-3333-4333-8333-333333333333";
  return makeFakeSupabaseModule({
    cs_restraint_records: [
      {
        id: "rr-1", home_id: home, child_id: "yp-1", child_name: "A.",
        incident_date: "2026-09-08", incident_time: "21:15:00",
        restraint_type: "standing", technique_used: "Team Teach standing hold",
        duration_minutes: 3,
        staff_involved: [{ staff_name: "Edward P.", role_in_incident: "lead", trained: true }],
        antecedent: "Escalation after phone call",
        behaviour_description: "Struck out at staff",
        de_escalation_attempted: ["Verbal reassurance", "Offered quiet space"],
        outcome: "De-escalated, supported to room",
        injuries_child: [],
        injuries_staff: [{ person_name: "Edward P.", description: "bruise", body_location: "left forearm", severity: "minor", treatment_given: "ice pack", medical_attention_sought: false }],
        body_map_completed: true, child_views_obtained: true,
        child_views: "I was angry about the call.",
        debrief_completed: true, debrief_date: "2026-09-09",
        debrief_notes: "Talked it through next morning.",
        manager_reviewed: false, manager_review_date: null, manager_review_notes: null,
        ofsted_notified: false, parent_carer_notified: true, social_worker_notified: true,
        created_by: "staff_edward",
        created_at: "2026-09-08T21:40:00Z", updated_at: "2026-09-08T21:40:00Z",
      },
      // Free-text hold type + a hold crossing midnight; nothing else recorded.
      {
        id: "rr-2", home_id: home, child_id: "yp-2", child_name: null,
        incident_date: "2026-09-06", incident_time: "23:55:00",
        restraint_type: "guided escort to safe space", technique_used: null,
        duration_minutes: 10,
        staff_involved: null, antecedent: null, behaviour_description: null,
        de_escalation_attempted: null, outcome: null,
        injuries_child: null, injuries_staff: null,
        body_map_completed: null, child_views_obtained: null, child_views: null,
        debrief_completed: null, debrief_date: null, debrief_notes: null,
        manager_reviewed: true, manager_review_date: "2026-09-07",
        manager_review_notes: "Proportionate.", ofsted_notified: null,
        parent_carer_notified: null, social_worker_notified: null,
        created_by: "staff_anna",
        created_at: "2026-09-06T23:59:00Z", updated_at: "2026-09-06T23:59:00Z",
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("dal.restraints (live leg — the consolidation projection)", () => {
  it("projects the capture honestly — nothing worn that the recorder did not give", async () => {
    const all = await dal.restraints.findAll();
    expect(all).toHaveLength(2);

    const full = all.find((r) => r.id === "rr-1")!;
    expect(full.reason).toBeNull();               // no statutory ground captured — none claimed
    expect(full.staff_debriefed).toBeNull();      // never asked — a form gap, not a failure
    expect(full.medical_check_completed).toBeNull();
    expect(full.start_time).toBe("21:15");
    expect(full.end_time).toBe("21:18");          // derived: recorded start + recorded 3 min
    expect(full.restraint_type).toBe("standing");
    expect(full.description).toBe("Team Teach standing hold — De-escalated, supported to room");
    expect(full.staff_involved).toEqual([
      { staff_id: "Edward P.", role: "lead", technique: "", team_teach_trained: true },
    ]);
    expect(full.injuries).toEqual([
      { person: "Edward P.", injury: "bruise — left forearm", treatment: "ice pack" },
    ]);
    expect(full.child_debriefed).toBe(true);
    expect(full.child_debrief_notes).toBe("Talked it through next morning.");
    expect(full.review_status).toBe("pending_rm"); // not yet manager-reviewed
    expect(full.notifications_sent).toEqual([
      { party: "Parent/Carer", date: "" },
      { party: "Social Worker", date: "" },
    ]);                                            // ofsted false → no entry
    expect(full.justification).toBe("");           // never captured, never authored

    const sparse = all.find((r) => r.id === "rr-2")!;
    expect(sparse.restraint_type).toBe("other");   // free text outside the union → the honest catch-all
    expect(sparse.end_time).toBe("00:05");         // midnight wrap on real arithmetic
    expect(sparse.review_status).toBe("reviewed");
    expect(sparse.child_debriefed).toBe(false);    // no record = chase it, never assurance
    expect(sparse.injuries).toEqual([]);
    expect(sparse.notifications_sent).toEqual([]);
  });
});
