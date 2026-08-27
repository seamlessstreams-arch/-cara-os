import { describe, it, expect } from "vitest";
import { enumParam, enumParamList } from "../enum-param";

// These filters used to be cast straight from the query string into a narrow
// union, so a mistyped value matched nothing and the screen showed an empty
// list — indistinguishable from a home with nothing on file.

const STATUSES = ["draft", "submitted", "approved"] as const;

describe("enumParam", () => {
  it("passes a recognised value through", () => {
    const r = enumParam("status", "submitted", STATUSES);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("submitted");
  });

  it("treats an absent parameter as no filter, not as an error", () => {
    for (const raw of [null, undefined, ""]) {
      const r = enumParam("status", raw, STATUSES);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.value).toBeUndefined();
    }
  });

  it("rejects an unrecognised value instead of filtering on it", async () => {
    const r = enumParam("status", "banana", STATUSES);
    expect(r.ok).toBe(false);
    if (r.ok) return;

    expect(r.response.status).toBe(400);
    const body = await r.response.json();
    expect(body.received).toBe("banana");
    expect(body.allowed).toEqual([...STATUSES]);
    expect(body.parameter).toBe("status");
  });

  it("is case-sensitive — a near-miss is still a miss", () => {
    expect(enumParam("status", "Submitted", STATUSES).ok).toBe(false);
  });
});

describe("enumParamList", () => {
  it("accepts a list where every value is recognised", () => {
    const r = enumParamList("status", ["draft", "approved"], STATUSES);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(["draft", "approved"]);
  });

  it("rejects the request when ANY value is unrecognised", async () => {
    // dropping the bad one silently would widen the result set without saying so
    const r = enumParamList("status", ["draft", "banana"], STATUSES);
    expect(r.ok).toBe(false);
    if (r.ok) return;

    const body = await r.response.json();
    expect(r.response.status).toBe(400);
    expect(body.received).toEqual(["banana"]);
  });

  it("treats an empty list as no filter", () => {
    const r = enumParamList("status", [], STATUSES);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeUndefined();
  });
});
