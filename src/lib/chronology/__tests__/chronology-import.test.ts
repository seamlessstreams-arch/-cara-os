import { describe, expect, it } from "vitest";
import {
  extractDate,
  inferCategory,
  inferSignificance,
  parseChronologyText,
} from "../chronology-import";

describe("extractDate", () => {
  it("parses ISO dates", () => {
    expect(extractDate("2024-03-12 Child moved placement")?.iso).toBe("2024-03-12");
  });
  it("parses UK day-first numeric dates", () => {
    expect(extractDate("12/03/2024 - moved")?.iso).toBe("2024-03-12");
    expect(extractDate("12.03.24 moved")?.iso).toBe("2024-03-12");
    expect(extractDate("01-04-2023 review")?.iso).toBe("2023-04-01");
  });
  it("does NOT misread day-first as month-first", () => {
    // 12/03 must be 12 March, never 3 December
    expect(extractDate("12/03/2024 x")?.iso).toBe("2024-03-12");
  });
  it("falls back to month-first when day-first is impossible", () => {
    // 03/15 — 15 can't be a month, so month=03, day=15
    expect(extractDate("03/15/2024 x")?.iso).toBe("2024-03-15");
  });
  it("parses long-form dates with ordinals", () => {
    expect(extractDate("12th March 2024 — incident")?.iso).toBe("2024-03-12");
    expect(extractDate("3 Jan 2023 contact")?.iso).toBe("2023-01-03");
    expect(extractDate("March 12, 2024 review")?.iso).toBe("2024-03-12");
  });
  it("returns null for lines without a leading date", () => {
    expect(extractDate("Some narrative with no date")).toBeNull();
  });
  it("rejects impossible dates", () => {
    expect(extractDate("45/45/2024 nonsense")).toBeNull();
  });
});

describe("inferCategory", () => {
  it("maps keywords to categories", () => {
    expect(inferCategory("went missing overnight, police informed")).toBe("missing"); // missing-from-care, not safeguarding
    expect(inferCategory("absent without authorisation, returned next day")).toBe("missing");
    expect(inferCategory("disclosure of abuse, section 47 strategy discussion")).toBe("safeguarding");
    expect(inferCategory("LAC review chaired by IRO")).toBe("review");
    expect(inferCategory("admitted to A&E after fall")).toBe("health");
    expect(inferCategory("excluded from school for two days")).toBe("education");
    expect(inferCategory("supervised contact with mother")).toBe("contact");
    expect(inferCategory("moved to foster placement")).toBe("placement");
    expect(inferCategory("court hearing for care order")).toBe("legal");
    expect(inferCategory("nothing notable")).toBe("other");
  });
});

describe("inferSignificance", () => {
  it("escalates serious events", () => {
    expect(inferSignificance("police called, child arrested")).toBe("critical");
    expect(inferSignificance("school exclusion")).toBe("significant");
    expect(inferSignificance("attended dentist for check-up")).toBe("routine");
  });
});

describe("parseChronologyText", () => {
  it("parses a mixed chronology into sorted entries (newest first)", () => {
    const text = `
12/03/2022 - Became looked after, moved to first foster placement
2023-01-05: Started at Oakwood Primary School
3 June 2023 — Went missing for 6 hours, police informed, return interview completed
14/09/2023 Supervised contact with mother re-established
    `;
    const r = parseChronologyText(text);
    expect(r.entries).toHaveLength(4);
    expect(r.entries.map((e) => e.date)).toEqual(["2023-09-14", "2023-06-03", "2023-01-05", "2022-03-12"]);
    const missing = r.entries.find((e) => e.date === "2023-06-03")!;
    expect(missing.category).toBe("missing");
    expect(missing.significance).toBe("critical"); // police + missing → critical
    const placement = r.entries.find((e) => e.date === "2022-03-12")!;
    expect(placement.category).toBe("placement");
  });

  it("folds continuation lines into the previous entry", () => {
    const text = [
      "12/03/2024 - Incident during the evening.",
      "Two staff used a hold; child calmed after 10 minutes.",
      "Body map completed.",
      "15/03/2024 - Review meeting held.",
    ].join("\n");
    const r = parseChronologyText(text);
    expect(r.entries).toHaveLength(2);
    const inc = r.entries.find((e) => e.date === "2024-03-12")!;
    expect(inc.description).toContain("Body map completed");
    expect(inc.category).toBe("incident");
  });

  it("collects undated leading lines as unparsed (not silently dropped)", () => {
    const text = ["CHRONOLOGY FOR CHILD A", "Prepared by LA", "12/03/2024 - moved placement"].join("\n");
    const r = parseChronologyText(text);
    expect(r.unparsed).toEqual(["CHRONOLOGY FOR CHILD A", "Prepared by LA"]);
    expect(r.entries).toHaveLength(1);
  });

  it("derives a concise title but keeps the full description", () => {
    const long = "Child disclosed historic information about events before coming into care which required a safeguarding referral and strategy discussion the following day.";
    const r = parseChronologyText(`01/02/2024 - ${long}`);
    expect(r.entries[0].description).toBe(long);
    expect(r.entries[0].title.length).toBeLessThanOrEqual(112);
    expect(r.entries[0].significance).toBe("critical");
  });

  it("handles empty input", () => {
    const r = parseChronologyText("");
    expect(r.entries).toHaveLength(0);
    expect(r.total_lines).toBe(0);
  });
});
