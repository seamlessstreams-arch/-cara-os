import { describe, it, expect, vi } from "vitest";

// Behaviour consolidation's projection proof: ABC capture rows come back as
// honest BehaviourEntry objects — binary direction, the documented
// safety-first intensity translation (self-harm never under-alarms), the
// antecedent as the trigger, nothing invented.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    cs_behaviour_entries: [
      {
        id: "be-1", home_id: "33333333-3333-4333-8333-333333333333", child_id: "yp-1",
        date: "2026-09-06", time: "18:30:00", category: "self_harm",
        description: "Superficial scratching after a difficult phone call",
        antecedent: "Phone call with family member ended abruptly",
        behaviour: "Scratched forearm", consequence: "Staff sat with them, wound cleaned",
        de_escalation_used: ["calm presence", "distraction"], de_escalation_effective: true,
        physical_intervention: false, pi_technique: null, pi_duration_minutes: null,
        pi_staff_involved: [], pi_injuries_child: null, pi_injuries_staff: null,
        pi_debrief_completed: null, pi_debrief_date: null,
        outcome: "Settled by 20:00, agreed to talk to key worker tomorrow",
        recorded_by: "st-1", created_at: "2026-09-06T19:00:00Z", updated_at: "2026-09-06T19:00:00Z",
      },
      {
        id: "be-2", home_id: "33333333-3333-4333-8333-333333333333", child_id: "yp-1",
        date: "2026-09-07", time: "10:00:00", category: "positive",
        description: "Helped a younger resident with homework unprompted",
        antecedent: null, behaviour: "Peer support", consequence: null,
        de_escalation_used: [], de_escalation_effective: null,
        physical_intervention: null, pi_technique: null, pi_duration_minutes: null,
        pi_staff_involved: [], pi_injuries_child: null, pi_injuries_staff: null,
        pi_debrief_completed: null, pi_debrief_date: null, outcome: null,
        recorded_by: "st-2", created_at: "2026-09-07T10:30:00Z", updated_at: "2026-09-07T10:30:00Z",
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("dal.behaviourLog (live leg — the consolidation projection)", () => {
  it("projects ABC capture honestly", async () => {
    const entries = await dal.behaviourLog.findAll();
    expect(entries).toHaveLength(2);
    const sh = entries.find((e) => e.id === "be-1")!;
    expect(sh.direction).toBe("concern");
    expect(sh.intensity).toBe("high");            // self_harm never under-alarms
    expect(sh.trigger).toContain("Phone call");   // the recorded antecedent IS the trigger
    expect(sh.strategy_used).toBe("calm presence, distraction");
    expect(sh.time).toBe("18:30");
    const pos = entries.find((e) => e.id === "be-2")!;
    expect(pos.direction).toBe("positive");
    expect(pos.intensity).toBe("low");
    expect(pos.trigger).toBe("");                 // nothing recorded, nothing invented
  });
});
