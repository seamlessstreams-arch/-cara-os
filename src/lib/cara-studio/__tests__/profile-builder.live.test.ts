import { describe, it, expect, vi } from "vitest";

// Live-leg regression for feat/studio-promotion-followthrough: the incident
// read selected phantom columns (category, trigger) — on live that 400s the
// whole query, so every child profile built with ZERO incident evidence and
// the self-harm / missing-from-care risk flags could never fire (the mapper
// read i.category, a field no schema has; the real column is `type`, and the
// missing member is "missing_from_care", not "missing").
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  const recent = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
  return makeFakeSupabaseModule({
    young_people: [{
      id: "yp-live-1", first_name: "Jayden", last_name: "Tester", preferred_name: "Jay",
      date_of_birth: "2011-04-01", gender: "male", placement_start: "2025-03-01", key_worker_id: "st-1",
    }],
    incidents: [
      { id: "inc-1", date: recent(3), type: "self_harm", severity: "high", description: "superficial scratching, staff supported" },
      { id: "inc-2", date: recent(9), type: "missing_from_care", severity: "medium", description: "returned same evening" },
    ],
    // cara_studio_profiles accepts the snapshot insert; archived tables
    // (care_plan_objectives, key_work_sessions, risk_assessments) error like
    // live PostgREST and the profile degrades exactly as on the live tenant.
    cara_studio_profiles: [],
  });
});

import { buildChildProfile } from "../profile-builder";

describe("buildChildProfile (live leg, mocked client)", () => {
  it("maps incidents by their real columns and fires the risk flags", async () => {
    const p = await buildChildProfile("yp-live-1", "org_default", "home-1", "st-1");
    expect(p.childName).toBe("Jayden Tester");
    expect(p.preferredName).toBe("Jay");
    expect(p.riskFlags).toContain("Self-harm risk");
    expect(p.riskFlags).toContain("Missing from care history");
    const incidentRef = p.evidenceRefs.find((r) => r.type === "incident");
    expect(incidentRef).toBeDefined();
    expect(incidentRef!.summary).toContain("2 incidents");
  });
});
