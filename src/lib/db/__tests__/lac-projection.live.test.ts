import { describe, it, expect, vi } from "vitest";

// LAC consolidation's projection proof: BOTH writer shapes come back as honest
// LACReviews — completed-only gate, exact/least-claiming vocabulary maps, the
// escalation alarm surviving, evidence-derived outcomes, and the null-vs-[]
// discrimination the stripped jsonb defaults make possible.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  const home = "33333333-3333-4333-8333-333333333333";
  return makeFakeSupabaseModule({
    cs_lac_reviews: [
      // A-shape (lac-review-service): escalation outcome, domain flags, roles.
      {
        id: "lr-1", home_id: home, child_id: "yp-1", child_name: "A.",
        review_type: "second", review_date: "2026-09-01", status: "completed",
        next_review_due: "2026-12-01", iro_name: "Sarah Mitchell",
        child_participation: "views_via_worker", child_views_recorded: true,
        parent_attended: true, social_worker_attended: true, key_worker_attended: false,
        outcome: "escalation_required",
        recommendations: ["Escalate to placement panel"],
        actions_agreed: ["Convene professionals meeting"],
        placement_stability_discussed: true, permanence_plan_reviewed: false,
        health_reviewed: true, education_reviewed: true, within_timescale: true,
        notes: "IRO requested escalation.",
        chaired_by: null, attendees: null, outcomes: null, actions: null,
        child_participated: null, plan_changes: null, next_review_date: null,
        minutes_recorded: null,
        created_at: "2026-09-01T15:00:00Z", updated_at: "2026-09-01T15:00:00Z",
      },
      // B-shape (placement-service): completed with plan changes, no outcome enum.
      {
        id: "lr-2", home_id: home, child_id: "yp-2", child_name: null,
        review_type: "subsequent", review_date: "2026-08-15", status: "completed",
        next_review_due: null, iro_name: null, child_participation: null,
        child_views_recorded: true, parent_attended: null, social_worker_attended: null,
        key_worker_attended: null, outcome: null, recommendations: null,
        actions_agreed: null, placement_stability_discussed: null,
        permanence_plan_reviewed: null, health_reviewed: null, education_reviewed: null,
        within_timescale: null, notes: null,
        chaired_by: "David Wright", attendees: ["David Wright", "Lisa Chen"],
        outcomes: ["Placement endorsed by all present"],
        actions: [{ action: "Update pathway plan", responsible: "Social worker", due_date: "2026-09-15", completed: true }],
        child_participated: true, plan_changes: ["Contact schedule amended"],
        next_review_date: "2027-02-15", minutes_recorded: true,
        created_at: "2026-08-15T11:00:00Z", updated_at: "2026-08-15T11:00:00Z",
      },
      // Scheduled — not a held review; must NOT project as one.
      {
        id: "lr-3", home_id: home, child_id: "yp-1", child_name: null,
        review_type: "subsequent", review_date: "2026-11-01", status: "scheduled",
        next_review_due: null, iro_name: null, child_participation: null,
        child_views_recorded: false, parent_attended: null, social_worker_attended: null,
        key_worker_attended: null, outcome: null, recommendations: null,
        actions_agreed: null, placement_stability_discussed: null,
        permanence_plan_reviewed: null, health_reviewed: null, education_reviewed: null,
        within_timescale: null, notes: null,
        chaired_by: "David Wright", attendees: [], outcomes: [], actions: [],
        child_participated: false, plan_changes: [], next_review_date: null,
        minutes_recorded: false,
        created_at: "2026-09-05T09:00:00Z", updated_at: "2026-09-05T09:00:00Z",
      },
    ],
  });
});

import { dal } from "@/lib/db";

describe("dal.lacReviews (live leg — the consolidation projection)", () => {
  it("projects both writer shapes honestly; scheduled rows never masquerade as held reviews", async () => {
    const all = await dal.lacReviews.findAll();
    expect(all.map((r) => r.id).sort()).toEqual(["lr-1", "lr-2"]); // lr-3 scheduled

    const a = all.find((r) => r.id === "lr-1")!;
    expect(a.review_type).toBe("first_review");          // "second" IS the 3-month review
    expect(a.outcome).toBe("escalation_required");        // the alarm survives translation
    expect(a.child_participation).toBe("views_submitted"); // views_via_worker → views submitted
    expect(a.iro).toBe("Sarah Mitchell");
    expect(a.attendees).toEqual([
      { name: "", role: "Parent" },
      { name: "", role: "Social Worker" },
    ]);                                                   // key_worker_attended false → no entry
    expect(a.key_discussions).toEqual(["Placement stability", "Health", "Education"]);
    expect(a.actions_agreed).toEqual([
      { action: "Convene professionals meeting", owner: "", due_date: "", completed: false },
    ]);                                                   // no completion record = outstanding
    expect(a.next_review_date).toBe("2026-12-01");
    expect(a.placement_stability).toBeNull();             // never judged at capture
    expect(a.care_plan_updated).toBeNull();               // plan_changes null = never asked
    expect(a.child_views).toBe("");                       // only THAT views were recorded

    const b = all.find((r) => r.id === "lr-2")!;
    expect(b.iro).toBe("David Wright");                   // the chair
    expect(b.child_participation).toBe("attended");       // recorded participated: true
    expect(b.outcome).toBe("care_plan_amended");          // DERIVED from recorded plan change
    expect(b.care_plan_updated).toBe(true);               // evidenced by the same record
    expect(b.attendees).toEqual([
      { name: "David Wright", role: "" },
      { name: "Lisa Chen", role: "" },
    ]);
    expect(b.actions_agreed).toEqual([
      { action: "Update pathway plan", owner: "Social worker", due_date: "2026-09-15", completed: true },
    ]);
    expect(b.next_review_date).toBe("2027-02-15");
  });

  it("findById honours the completed-only gate", async () => {
    // The fake's .single returns the first seeded row (its .eq is a documented
    // no-op) — lr-1 is completed, so this exercises the mapper's accept path.
    const one = await dal.lacReviews.findById("lr-1");
    expect(one?.outcome).toBe("escalation_required");
  });
});
