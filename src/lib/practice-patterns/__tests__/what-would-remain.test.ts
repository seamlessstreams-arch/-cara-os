import { describe, it, expect } from "vitest";
import { whatWouldRemain, type WhatWouldRemainInput } from "../what-would-remain";

function input(overrides: Partial<WhatWouldRemainInput> = {}): WhatWouldRemainInput {
  return {
    childRef: "YP-1",
    links: [],
    communityTies: [],
    ...overrides,
  };
}

describe("whatWouldRemain", () => {
  it("names enduring connections when unpaid, active links + community exist", () => {
    const r = whatWouldRemain(
      input({
        links: [
          { relation: "sibling", paid: false, active: true },
          { relation: "social_worker", paid: true, active: true },
        ],
        communityTies: ["football club"],
      }),
    );
    expect(r.enduring).toContain("sibling");
    expect(r.enduring).toContain("football club");
    expect(r.enduring).not.toContain("social_worker"); // paid — would not remain
    expect(r.reliantOnPaidSupport).toBe(false);
    expect(r.insufficientlyRecorded).toBe(false);
  });

  it("flags reliance on paid support when only paid/inactive links and no community (eval case)", () => {
    const r = whatWouldRemain(
      input({
        links: [
          { relation: "key_worker", paid: true, active: true },
          { relation: "old_friend", paid: false, active: false }, // inactive — would not remain
        ],
        communityTies: [],
      }),
    );
    expect(r.reliantOnPaidSupport).toBe(true);
    expect(r.thin.some((t) => /relies on paid/i.test(t))).toBe(true);
    expect(r.prompts.some((p) => /disappeared tomorrow/i.test(p))).toBe(true);
  });

  it("treats nothing-recorded as a gap to ask about, NOT a verdict (refusal doctrine)", () => {
    const r = whatWouldRemain(input());
    expect(r.insufficientlyRecorded).toBe(true);
    expect(r.reliantOnPaidSupport).toBe(false); // must not assert reliance from absence
    expect(r.summary).toMatch(/not enough is recorded/i);
  });

  it("surfaces thin belonging/relationship scores without scoring the child", () => {
    const r = whatWouldRemain(
      input({
        links: [{ relation: "sibling", paid: false, active: true }],
        communityTies: ["art group"],
        belongingScore: 25,
        relationshipsScore: 30,
      }),
    );
    expect(r.thin.some((t) => /belonging is thin/i.test(t))).toBe(true);
    expect(r.thin.some((t) => /relationships are thin/i.test(t))).toBe(true);
    // but it still recognised the enduring connections — not a pass/fail
    expect(r.enduring).toContain("sibling");
  });
});
