import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// A physical-intervention debrief records what was done to a child. The create
// route used to default the technique to a named Team Teach hold, the position
// to standing, the duration to nil, and de-escalation to attempted — so a POST
// carrying only an incident_id produced a restraint record nobody had stated.

function post(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/pi-debriefs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const COMPLETE = {
  incident_id: "inc_001",
  technique_used: "price_seated",
  body_position: "seated",
  duration_minutes: 4,
  de_escalation_attempted: true,
};

describe("POST /api/v1/pi-debriefs", () => {
  it("refuses to invent the technique, position, duration or de-escalation", async () => {
    const res = await POST(post({ incident_id: "inc_001" }));
    expect(res.status).toBe(400);
    const { error } = await res.json();
    for (const field of ["technique_used", "body_position", "duration_minutes", "de_escalation_attempted"]) {
      expect(error).toContain(field);
    }
  });

  it("records what was stated, unchanged", async () => {
    const res = await POST(post(COMPLETE));
    expect(res.status).toBeLessThan(300);
    const { data } = await res.json();
    expect(data.technique_used).toBe("price_seated");
    expect(data.body_position).toBe("seated");
    expect(data.duration_minutes).toBe(4);
    expect(data.de_escalation_attempted).toBe(true);
  });

  it("accepts a debrief saying de-escalation was NOT attempted", async () => {
    // The important case: "no" is an answer, not a missing field, and it must
    // never be silently turned into "yes".
    const res = await POST(post({ ...COMPLETE, de_escalation_attempted: false, duration_minutes: 0 }));
    expect(res.status).toBeLessThan(300);
    const { data } = await res.json();
    expect(data.de_escalation_attempted).toBe(false);
    expect(data.duration_minutes).toBe(0);
  });
});
