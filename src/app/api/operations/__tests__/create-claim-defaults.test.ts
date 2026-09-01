import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as SANCTIONS } from "../sanctions-rewards/route";
import { POST as EMERGENCY } from "../emergency/route";
import { POST as HEALTH } from "../health/route";
import { POST as NIGHT } from "../night-monitoring/route";

// These create routes required only `homeId`. Every judgement about what
// happened defaulted to the compliant answer, so a partial POST produced a
// record asserting a proportionate sanction, a fire drill where everyone was
// accounted for, or a medical appointment with consent obtained — none of it
// stated by anyone. The risk-bearing flags beside them already defaulted to
// false; only the judgements flattered.

function post(handler: (r: NextRequest) => Promise<Response>, path: string, body: Record<string, unknown>) {
  return handler(
    new NextRequest(`http://localhost/api/operations/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const CASES = [
  { name: "sanction", handler: SANCTIONS, path: "sanctions-rewards",
    // durationMinutes is required alongside the judgements (`?? 0` used to file
    // an unstated duration as zero minutes) — supplied here so this case tests
    // the boolean claims in isolation.
    body: { homeId: "home_oak", action: "create_sanction", durationMinutes: 60 },
    claims: ["proportionate", "ageAppropriate", "consistentWithPlan", "childInformed"] },
  { name: "fire drill", handler: EMERGENCY, path: "emergency",
    body: { homeId: "home_oak", action: "create_drill" },
    claims: ["alarmActivated", "allAccountedFor"] },
  { name: "health appointment", handler: HEALTH, path: "health",
    body: { homeId: "home_oak", action: "record_appointment" },
    claims: ["consentObtained"] },
  { name: "night check", handler: NIGHT, path: "night-monitoring",
    body: { homeId: "home_oak", action: "create_log" },
    claims: ["premisesSecure", "firePanelChecked"] },
];

describe("operations create routes refuse to answer for the recorder", () => {
  for (const c of CASES) {
    it(`${c.name}: rejects a POST that states none of the judgements`, async () => {
      const res = await post(c.handler, c.path, c.body);
      expect(res.status).toBe(400);
      const { error } = await res.json();
      for (const claim of c.claims) expect(error).toContain(claim);
    });

    it(`${c.name}: accepts "no" as an answer`, async () => {
      // The important half: false is a recorded judgement, not a missing one,
      // and must never be turned back into true.
      const withFalse = { ...c.body, ...Object.fromEntries(c.claims.map((k) => [k, false])) };
      const res = await post(c.handler, c.path, withFalse);
      expect(res.status).not.toBe(400);
    });
  }
});
