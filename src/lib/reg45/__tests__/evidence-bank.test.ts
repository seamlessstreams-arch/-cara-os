import { describe, it, expect } from "vitest";
import { buildReg45EvidenceBank, evidenceCategoryLabel } from "@/lib/reg45/evidence-bank";
import type { CareEvent } from "@/types/care-events";

// A minimal synthetic care event. We build these by hand rather than seeding so
// the counts under test are exactly what the test declares — never a count the
// engine could have derived from a shared fixture.
function event(p: { category: string; title: string; event_date: string; home_id?: string }): CareEvent {
  return {
    id: Math.random().toString(36).slice(2),
    home_id: p.home_id ?? "home-1",
    child_id: null,
    shift_id: null,
    staff_id: "staff-1",
    verified_by: null,
    category: p.category as CareEvent["category"],
    title: p.title,
    status: "verified",
    event_date: p.event_date,
  } as CareEvent;
}

describe("evidenceCategoryLabel", () => {
  it("names the known evidence categories, including the live seed tokens", () => {
    expect(evidenceCategoryLabel("daily_log")).toBe("Daily Logs");
    expect(evidenceCategoryLabel("key_work")).toBe("Key-Work Sessions");
    expect(evidenceCategoryLabel("positive_moment")).toBe("Positive Moments");
    expect(evidenceCategoryLabel("safeguarding")).toBe("Safeguarding Records");
  });

  it("Title-cases an unknown token rather than dropping it", () => {
    expect(evidenceCategoryLabel("new_future_category")).toBe("New Future Category");
  });

  it("never returns an empty label", () => {
    expect(evidenceCategoryLabel("")).toBe("Uncategorised");
    expect(evidenceCategoryLabel("   ")).toBe("Uncategorised");
  });
});

describe("buildReg45EvidenceBank", () => {
  it("counts real events per category and shows real titles as examples", () => {
    const bank = buildReg45EvidenceBank([
      event({ category: "key_work", title: "Key-work with Alex", event_date: "2026-11-01" }),
      event({ category: "key_work", title: "Key-work with Jordan", event_date: "2026-11-02" }),
      event({ category: "safeguarding", title: "Disclosure logged", event_date: "2026-11-03" }),
    ]);
    expect(bank).toEqual([
      { category: "Key-Work Sessions", count: 2, examples: ["Key-work with Jordan", "Key-work with Alex"] },
      { category: "Safeguarding Records", count: 1, examples: ["Disclosure logged"] },
    ]);
  });

  it("orders categories by count, then name", () => {
    const bank = buildReg45EvidenceBank([
      event({ category: "health", title: "A", event_date: "2026-11-01" }),
      event({ category: "daily_log", title: "B", event_date: "2026-11-02" }),
      event({ category: "daily_log", title: "C", event_date: "2026-11-03" }),
    ]);
    expect(bank.map((c) => c.category)).toEqual(["Daily Logs", "Health Records"]);
  });

  it("an empty spine yields an empty bank — no categories invented", () => {
    expect(buildReg45EvidenceBank([])).toEqual([]);
  });

  it("a category appears only when a real event carries it", () => {
    const bank = buildReg45EvidenceBank([event({ category: "health", title: "Dental check", event_date: "2026-11-01" })]);
    expect(bank).toHaveLength(1);
    expect(bank[0]).toMatchObject({ category: "Health Records", count: 1 });
  });

  it("caps examples per category but keeps the full count", () => {
    const events = Array.from({ length: 6 }, (_, i) =>
      event({ category: "daily_log", title: `Log ${i + 1}`, event_date: `2026-11-0${i + 1}` }),
    );
    const [bank] = buildReg45EvidenceBank(events, { maxExamples: 2 });
    expect(bank.count).toBe(6);
    expect(bank.examples).toHaveLength(2);
  });

  it("shows the most recent records as examples (newest first)", () => {
    const [bank] = buildReg45EvidenceBank([
      event({ category: "daily_log", title: "Oldest", event_date: "2026-01-01" }),
      event({ category: "daily_log", title: "Newest", event_date: "2026-12-31" }),
    ], { maxExamples: 1 });
    expect(bank.examples).toEqual(["Newest"]);
  });

  it("does not repeat an identical title in the examples", () => {
    const [bank] = buildReg45EvidenceBank([
      event({ category: "health", title: "Dental check", event_date: "2026-11-01" }),
      event({ category: "health", title: "Dental check", event_date: "2026-11-02" }),
    ]);
    expect(bank.count).toBe(2);
    expect(bank.examples).toEqual(["Dental check"]);
  });

  it("counts an event with a blank title but shows no empty example", () => {
    const [bank] = buildReg45EvidenceBank([
      event({ category: "health", title: "   ", event_date: "2026-11-01" }),
      event({ category: "health", title: "Review", event_date: "2026-11-02" }),
    ]);
    expect(bank.count).toBe(2);
    expect(bank.examples).toEqual(["Review"]);
  });
});
