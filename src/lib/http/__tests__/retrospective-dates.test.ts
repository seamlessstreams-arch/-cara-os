import { describe, it, expect } from "vitest";
import { isFutureDate, rejectFutureDates } from "@/lib/http/retrospective-dates";

const TODAY = "2026-08-15";

describe("isFutureDate", () => {
  it("is true only for a date after today", () => {
    expect(isFutureDate("2026-08-16", TODAY)).toBe(true);
    expect(isFutureDate("2027-08-15", TODAY)).toBe(true); // the mistyped-year case
    expect(isFutureDate("2026-08-15", TODAY)).toBe(false); // today is not future
    expect(isFutureDate("2026-08-14", TODAY)).toBe(false);
  });

  it("reads the date part of a full ISO timestamp", () => {
    expect(isFutureDate("2026-08-16T09:00:00.000Z", TODAY)).toBe(true);
    expect(isFutureDate("2026-08-14T23:59:00.000Z", TODAY)).toBe(false);
  });

  it("does not adjudicate what it cannot parse", () => {
    // A non-date is someone else's validation problem — claiming it is
    // "future" would 400 a legitimate create for the wrong reason.
    for (const v of ["", "yesterday", "15/08/2026", null, undefined, 42, {}]) {
      expect(isFutureDate(v as unknown, TODAY)).toBe(false);
    }
  });
});

describe("rejectFutureDates", () => {
  it("returns null when every named field is in the past", () => {
    const body = { incidentDate: "2026-08-14", debriefDate: TODAY, note: "x" };
    expect(rejectFutureDates(body, ["incidentDate", "debriefDate"], TODAY)).toBeNull();
  });

  it("400s a future-dated event and names the offending field", async () => {
    const res = rejectFutureDates({ incidentDate: "2027-01-02" }, ["incidentDate"], TODAY);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(400);
    const json = (await res!.json()) as { error: string; future: string[] };
    expect(json.future).toEqual(["incidentDate"]);
    expect(json.error).toContain("incidentDate");
    expect(json.error).toContain(TODAY);
  });

  it("only judges the fields it is given — a future review date is legitimate", () => {
    // The whole point of naming fields: reviews, targets and expiries are
    // SUPPOSED to be ahead of today and must not be rejected.
    const body = { incidentDate: "2026-08-10", review_date: "2026-12-01", expiry_date: "2027-01-01" };
    expect(rejectFutureDates(body, ["incidentDate"], TODAY)).toBeNull();
  });

  it("reports every offending field, not just the first", async () => {
    const res = rejectFutureDates(
      { incidentDate: "2026-09-01", debriefDate: "2026-09-02" },
      ["incidentDate", "debriefDate"],
      TODAY,
    );
    const json = (await res!.json()) as { future: string[] };
    expect(json.future).toEqual(["incidentDate", "debriefDate"]);
  });

  it("ignores a named field the body does not carry", () => {
    expect(rejectFutureDates({ note: "no dates here" }, ["incidentDate"], TODAY)).toBeNull();
  });
});
