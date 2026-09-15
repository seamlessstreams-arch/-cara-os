// ══════════════════════════════════════════════════════════════════════════════
// Tests — a restraint record must state its duration and whether anyone was hurt
//
//   duration_minutes: body.durationMinutes ?? 0,
//   injuries_child:   body.injuriesChild ?? [],
//   injuries_staff:   body.injuriesStaff ?? [],
//
// A POST that omitted these returned 201 having written a restraint that lasted
// no time and injured nobody. `?? []` is the fabricate-on-empty rule in list
// form: an empty list of injuries reads as "we checked, and there were none".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as restraintPOST } from "../route";
import { POST as behaviourPOST } from "../../behaviour/route";

function post(handler: (r: NextRequest) => Promise<Response>, url: string, body: unknown) {
  return handler(new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

const base = {
  action: "create",
  homeId: "home_oak",
  childId: "child_1",
  incidentDate: "2026-05-01",
  incidentTime: "14:00",
  restraintType: "physical",
  techniqueUsed: "team_teach_holding",
  createdBy: "staff_darren",
};

describe("restraint create", () => {
  it("rejects a record that does not state how long the hold lasted", async () => {
    const res = await post(restraintPOST, "/api/operations/restraint", {
      ...base, injuriesChild: [], injuriesStaff: [],
    });
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("durationMinutes");
  });

  it("rejects a record that does not say whether the child was injured", async () => {
    const res = await post(restraintPOST, "/api/operations/restraint", {
      ...base, durationMinutes: 4, injuriesStaff: [],
    });
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("injuriesChild");
  });

  it("accepts an explicit 'no injuries' — an empty list is a recorded answer", async () => {
    const res = await post(restraintPOST, "/api/operations/restraint", {
      ...base, durationMinutes: 4, injuriesChild: [], injuriesStaff: [],
    });
    expect(res.status).not.toBe(400);
  });

  it("validates before the storage check, so completeness does not depend on Supabase", async () => {
    // With Supabase unconfigured the route short-circuits to persisted:false.
    // The rejection above must still happen, or an incomplete record is accepted
    // in exactly the environment where nobody notices.
    const res = await post(restraintPOST, "/api/operations/restraint", { ...base });
    expect(res.status).toBe(400);
  });
});

describe("behaviour create_entry", () => {
  const entry = {
    action: "create_entry",
    homeId: "home_oak",
    childId: "child_1",
    date: "2026-05-01",
    time: "14:00",
    category: "physical",
    description: "Incident",
    recordedBy: "staff_darren",
  };

  it("requires the injury answers when a physical intervention is recorded", async () => {
    const res = await post(behaviourPOST, "/api/operations/behaviour", {
      ...entry, physicalIntervention: true,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.missing).toContain("piInjuriesChild");
    expect(body.missing).toContain("piInjuriesStaff");
  });

  it("does not require them when no physical intervention took place", async () => {
    const res = await post(behaviourPOST, "/api/operations/behaviour", {
      ...entry, physicalIntervention: false,
    });
    expect(res.status).not.toBe(400);
  });

  it("accepts an explicit 'no injuries'", async () => {
    const res = await post(behaviourPOST, "/api/operations/behaviour", {
      ...entry, physicalIntervention: true, piInjuriesChild: false, piInjuriesStaff: false,
    });
    expect(res.status).not.toBe(400);
  });
});
