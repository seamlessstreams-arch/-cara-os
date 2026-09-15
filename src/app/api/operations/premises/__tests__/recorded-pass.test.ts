// ══════════════════════════════════════════════════════════════════════════════
// Tests — a record that does not state its result must not be given a passing one
//
//   result:               body.result ?? "pass",           // premises safety check
//   overall_rating:       body.overallRating ?? "good",    // QA audit, appraisal
//   condition_on_arrival: body.conditionOnArrival ?? "good",
//   outcome:              body.outcome ?? "positive",      // contact log
//
// Each returned 201 having written the favourable answer for a field nobody
// filled in. On a premises check that is a fire, gas or electrical inspection
// recorded as passed.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as premisesPOST } from "../route";
import { POST as qaPOST } from "../../quality-assurance/route";
import { POST as possessionsPOST } from "../../possessions/route";
import { POST as contactLogsPOST } from "../../../v1/contact-logs/route";

function post(handler: (r: NextRequest) => Promise<Response>, url: string, body: unknown) {
  return handler(new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("premises safety check", () => {
  const base = {
    action: "create_check",
    homeId: "home_oak",
    checkType: "fire_alarm",
    checkDate: "2026-05-01",
    completedBy: "staff_darren",
  };

  it("is not recorded as passed when no result was given", async () => {
    const res = await post(premisesPOST, "/api/operations/premises", base);
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("result");
  });

  it("accepts a stated result", async () => {
    const res = await post(premisesPOST, "/api/operations/premises", { ...base, result: "fail" });
    expect(res.status).not.toBe(400);
  });
});

describe("quality-assurance audit", () => {
  it("is not rated good by default", async () => {
    const res = await post(qaPOST, "/api/operations/quality-assurance", {
      action: "create_audit", homeId: "home_oak", auditType: "monthly", auditDate: "2026-05-01",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("overallRating");
  });
});

describe("a child's possessions", () => {
  it("are not recorded as arriving in good condition by default", async () => {
    const res = await post(possessionsPOST, "/api/operations/possessions", {
      action: "create_possession", homeId: "home_oak", childId: "child_1", itemName: "Phone",
    });
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("conditionOnArrival");
  });
});

describe("contact log", () => {
  const base = { child_id: "child_1", home_id: "home_oak", date: "2026-05-01", narrative: "Call home" };

  it("does not default the outcome to positive", async () => {
    const res = await post(contactLogsPOST, "/api/v1/contact-logs", base);
    expect(res.status).toBe(400);
    expect((await res.json()).missing).toContain("outcome");
  });

  it("does not default away a safeguarding concern", async () => {
    const res = await post(contactLogsPOST, "/api/v1/contact-logs", { ...base, outcome: "positive" });
    expect((await res.json()).missing).toContain("safeguarding_concern");
  });

  it("accepts an explicit 'no concerns' — false is a recorded answer", async () => {
    const res = await post(contactLogsPOST, "/api/v1/contact-logs", {
      ...base, outcome: "positive", concerns_identified: false, safeguarding_concern: false,
    });
    expect(res.status).toBe(201);
  });
});
