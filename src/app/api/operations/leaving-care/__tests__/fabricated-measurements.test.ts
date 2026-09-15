// ══════════════════════════════════════════════════════════════════════════════
// Tests — a measurement nobody took must not be filed as zero
//
//   overall_readiness_score: body.overallReadinessScore ?? 0,
//   amount:                  body.amount ?? 0,
//   duration_minutes:        body.durationMinutes ?? 0,   (sanctions-rewards)
//
// An unscored independence assessment was filed as 0/100 readiness and entered
// the home's average; an entitlement of unstated amount recorded money owed to
// a care leaver as £0; a sanction of unstated length lasted no time at all.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as leavingCarePOST } from "../route";
import { POST as sanctionsPOST } from "../../sanctions-rewards/route";

function post(handler: (r: NextRequest) => Promise<Response>, url: string, body: unknown) {
  return handler(new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("independence assessment", () => {
  const base = {
    action: "create_assessment",
    homeId: "home_oak",
    childId: "child_1",
    childName: "Jordan",
    assessmentDate: "2026-05-01",
    assessedBy: "staff_darren",
  };

  it("rejects an assessment that does not state its readiness score", async () => {
    const res = await post(leavingCarePOST, "/api/operations/leaving-care", base);
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("overallReadinessScore");
  });

  it("accepts an explicit score, including a genuine zero", async () => {
    for (const score of [0, 62]) {
      const res = await post(leavingCarePOST, "/api/operations/leaving-care", {
        ...base, overallReadinessScore: score,
      });
      expect(res.status).not.toBe(400);
    }
  });
});

describe("entitlement", () => {
  it("rejects an entitlement that does not state the amount owed", async () => {
    const res = await post(leavingCarePOST, "/api/operations/leaving-care", {
      action: "create_entitlement", homeId: "home_oak", childId: "child_1",
      childName: "Jordan", entitlementType: "setting_up_home_grant", startDate: "2026-05-01",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("amount");
  });
});

describe("sanction duration", () => {
  it("rejects a sanction that does not state how long it lasted", async () => {
    const res = await post(sanctionsPOST, "/api/operations/sanctions-rewards", {
      action: "create_sanction", homeId: "home_oak", childId: "child_1",
      childName: "Jordan", sanctionType: "loss_of_privilege",
      incidentDate: "2026-05-01", incidentTime: "14:00",
      proportionate: true, ageAppropriate: true, consistentWithPlan: true, childInformed: true,
    });
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("durationMinutes");
  });
});
