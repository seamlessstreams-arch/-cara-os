import { describe, it, expect } from "vitest";
import {
  computeInOutBoard,
  type WhereaboutsYoungPerson,
  type WhereaboutsAppointment,
  type WhereaboutsFamilyTime,
  type WhereaboutsMissing,
} from "../whereabouts-engine";

// "Now" = 2026-07-13 14:00 UTC
const NOW = "2026-07-13T14:00:00.000Z";

const yp = (id: string, first: string, status = "current"): WhereaboutsYoungPerson => ({
  id,
  first_name: first,
  last_name: "Test",
  status,
});

const EMPTY = { appointments: [], familyTime: [], missing: [] } as {
  appointments: WhereaboutsAppointment[];
  familyTime: WhereaboutsFamilyTime[];
  missing: WhereaboutsMissing[];
};

function board(over: Partial<Parameters<typeof computeInOutBoard>[0]>) {
  return computeInOutBoard({ youngPeople: [], ...EMPTY, nowIso: NOW, ...over });
}

describe("computeInOutBoard — presence states", () => {
  it("no events → everyone IN", () => {
    const b = board({ youngPeople: [yp("a", "Ana"), yp("b", "Ben")] });
    expect(b.summary).toEqual({ in: 2, out: 0, missing: 0, total: 2 });
    expect(b.children.every((c) => c.state === "in")).toBe(true);
  });

  it("active missing episode → MISSING (wins over everything), expected_back null", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      missing: [{ child_id: "a", date_missing: "2026-07-13", time_missing: "11:30", date_returned: null, status: "active", location_last_seen: "Town centre" }],
      // even if scheduled out, missing wins:
      familyTime: [{ child_id: "a", date: "2026-07-13", time: "13:30", duration_minutes: 120 }],
    });
    expect(b.children[0].state).toBe("missing");
    expect(b.children[0].location).toBe("Town centre");
    expect(b.children[0].since).toBe("2026-07-13T11:30:00.000Z");
    expect(b.children[0].expected_back).toBeNull();
    expect(b.summary.missing).toBe(1);
  });

  it("a returned/closed missing episode does NOT mark the child missing", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      missing: [{ child_id: "a", date_missing: "2026-07-10", date_returned: "2026-07-10", status: "returned" }],
    });
    expect(b.children[0].state).toBe("in");
  });

  it("appointment window containing now → OUT with due-back (start + 90m default)", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      appointments: [{ child_id: "a", date: "2026-07-13", time: "13:30", type: "Dental", location: "Clinic", status: "scheduled" }],
    });
    expect(b.children[0].state).toBe("out");
    expect(b.children[0].detail).toBe("Dental appointment");
    expect(b.children[0].since).toBe("2026-07-13T13:30:00.000Z");
    expect(b.children[0].expected_back).toBe("2026-07-13T15:00:00.000Z"); // 13:30 + 90m
    expect(b.children[0].source).toBe("appointment");
  });

  it("appointment that has already ended (now past window) → IN", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      appointments: [{ child_id: "a", date: "2026-07-13", time: "09:00", type: "Dental", status: "scheduled" }],
    });
    expect(b.children[0].state).toBe("in"); // 09:00–10:30, now is 14:00
  });

  it("cancelled / missed appointments never put a child out", () => {
    const b = board({
      youngPeople: [yp("a", "Ana"), yp("b", "Ben")],
      appointments: [
        { child_id: "a", date: "2026-07-13", time: "13:30", type: "CAMHS", status: "cancelled" },
        { child_id: "b", date: "2026-07-13", time: "13:30", type: "CAMHS", status: "missed" },
      ],
    });
    expect(b.summary.out).toBe(0);
  });

  it("family-time window uses its real duration for due-back", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      familyTime: [{ child_id: "a", date: "2026-07-13", time: "13:00", duration_minutes: 120, location: "contact_centre" }],
    });
    expect(b.children[0].state).toBe("out");
    expect(b.children[0].detail).toBe("Family time (contact_centre)");
    expect(b.children[0].expected_back).toBe("2026-07-13T15:00:00.000Z"); // 13:00 + 120m
    expect(b.children[0].source).toBe("family_time");
  });

  it("overlapping out-events → keep the one due back latest", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      appointments: [{ child_id: "a", date: "2026-07-13", time: "13:45", type: "GP", status: "scheduled" }], // ends 15:15
      familyTime: [{ child_id: "a", date: "2026-07-13", time: "13:00", duration_minutes: 90 }], // ends 14:30
    });
    expect(b.children[0].expected_back).toBe("2026-07-13T15:15:00.000Z"); // appointment wins (later)
    expect(b.children[0].source).toBe("appointment");
  });
});

describe("computeInOutBoard — scoping & ordering", () => {
  it("non-current young people are excluded", () => {
    const b = board({ youngPeople: [yp("a", "Ana", "ended"), yp("b", "Ben", "planned"), yp("c", "Cara", "current")] });
    expect(b.summary.total).toBe(1);
    expect(b.children[0].child_id).toBe("c");
  });

  it("another child's event does not move this child", () => {
    const b = board({
      youngPeople: [yp("a", "Ana")],
      appointments: [{ child_id: "someone_else", date: "2026-07-13", time: "13:30", status: "scheduled" }],
    });
    expect(b.children[0].state).toBe("in");
  });

  it("ordered missing → out → in", () => {
    const b = board({
      youngPeople: [yp("i", "Ivy"), yp("o", "Omar"), yp("m", "Mo")],
      missing: [{ child_id: "m", date_missing: "2026-07-13", time_missing: "10:00", status: "active" }],
      appointments: [{ child_id: "o", date: "2026-07-13", time: "13:30", status: "scheduled" }],
    });
    expect(b.children.map((c) => c.state)).toEqual(["missing", "out", "in"]);
  });

  it("carries the honesty note (expected, not a sign-out register)", () => {
    const b = board({ youngPeople: [yp("a", "Ana")] });
    expect(b.as_of_note).toMatch(/not a physical sign-out register/i);
  });
});
