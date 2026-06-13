import { describe, expect, it } from "vitest";
import { parsePlanNotes } from "../plan-notes";

describe("parsePlanNotes", () => {
  it("splits lines and bullets into items", () => {
    const items = parsePlanNotes(`Call the social worker\n- Update Alex's plan\n* Order medication\n1. Staff supervision`);
    expect(items.map((i) => i.title)).toEqual([
      "Call the social worker",
      "Update Alex's plan",
      "Order medication",
      "Staff supervision",
    ]);
  });

  it("detects a time when unambiguous (am/pm, HH:MM, or at/by)", () => {
    expect(parsePlanNotes("Call the LA at 2pm")[0].time).toBe("14:00");
    expect(parsePlanNotes("14:30 placement review")[0].time).toBe("14:30");
    expect(parsePlanNotes("MDT 9:15am")[0].time).toBe("09:15");
    expect(parsePlanNotes("Handover by 8")[0].time).toBe("08:00");
    expect(parsePlanNotes("Pick up at 9.30")[0].time).toBe("09:30");
  });

  it("does NOT treat bare counts as times", () => {
    expect(parsePlanNotes("Call 3 parents")[0].time).toBeNull();
    expect(parsePlanNotes("Order 12 items")[0].time).toBeNull();
  });

  it("honours durations, defaults otherwise", () => {
    expect(parsePlanNotes("Team meeting 45 min")[0].duration_min).toBe(45);
    expect(parsePlanNotes("Deep clean 2h")[0].duration_min).toBe(120);
    expect(parsePlanNotes("Quick call")[0].duration_min).toBe(30);
  });

  it("strips checkbox / numbering marks and dedupes", () => {
    const items = parsePlanNotes(`[ ] Email IRO\n[x] Email IRO\n2) File incident`);
    expect(items.map((i) => i.title)).toEqual(["Email IRO", "File incident"]);
  });

  it("splits a single semicolon-separated line", () => {
    const items = parsePlanNotes("call mum; book transport; update risk plan");
    expect(items).toHaveLength(3);
  });

  it("handles empty / whitespace input and caps the count", () => {
    expect(parsePlanNotes("")).toEqual([]);
    expect(parsePlanNotes("   \n  \n ")).toEqual([]);
    const many = Array.from({ length: 60 }, (_, i) => `task ${i}`).join("\n");
    expect(parsePlanNotes(many).length).toBe(40);
  });
});
