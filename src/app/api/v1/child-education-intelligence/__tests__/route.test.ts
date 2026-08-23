import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";

// Every field this route sent the engine about a PEP named a property
// PepRecord does not have, so the whole PEP dimension was constants:
//
//   date                     always ""     — the record says pep_date
//   targets_set              always 0      —                 targets
//   virtual_school_involved  always false  —                 virtual_school_contact
//   child_participated       always false  —                 child_views
//   pupil_premium_discussed  always false  —                 pupil_premium
//
// With the date empty, `peps_last_12m` read 0 and `pep_current` read false —
// a child with a PEP dated June looked like a child with no PEP on file.
//
// And with targets_set at 0, `target_achievement_rate` read 100: the engine's
// local pct(n,d) returns 100 for an empty denominator, so "100% of PEP targets
// achieved" was reported for every child, and fed +5 into the education score.
//
// Measured on yp_alex: targets_set 0 → 3, virtual_school / child_participation
// / pupil_premium rates 0% → 100%, pep_current false → true, and
// target_achievement_rate 100 → 0 (none of this child's three targets is
// recorded as exceeded).

const call = (childId: string) =>
  GET(new NextRequest(`http://localhost/api/v1/child-education-intelligence?childId=${childId}`));

const pepChild = () => {
  const p = getStore().pepRecords[0];
  expect(p).toBeDefined(); // non-vacuity: no PEPs ⇒ nothing below proves anything
  return p.child_id;
};

describe("GET /api/v1/child-education-intelligence — PEP compliance", () => {
  it("counts the targets the PEP actually sets", async () => {
    const childId = pepChild();
    const peps = getStore().pepRecords.filter((p) => p.child_id === childId);
    const targets = peps.reduce((n, p) => n + p.targets.length, 0);
    expect(targets).toBeGreaterThan(0);

    const body = (await (await call(childId)).json()).data;
    expect(body.pep_compliance.targets_set).toBe(targets);
  });

  it("does not report 100% of targets achieved when it can see no targets", async () => {
    // The engine's pct(n,d) returns 100 on an empty denominator, which is
    // exactly the fabricate-on-empty shape. It is allowlisted as a helper with
    // the note that "call-site correctness depends on each caller's semantics";
    // this is a call site where it does not hold, so it now uses rate().
    const childId = pepChild();
    const peps = getStore().pepRecords.filter((p) => p.child_id === childId);
    const exceeded = peps.reduce(
      (n, p) => n + p.targets.filter((t) => t.progress === "exceeded").length,
      0,
    );
    const set = peps.reduce((n, p) => n + p.targets.length, 0);

    const body = (await (await call(childId)).json()).data;
    expect(body.pep_compliance.target_achievement_rate).toBe(Math.round((exceeded / set) * 100));
    expect(body.pep_compliance.target_achievement_rate).not.toBe(100); // it was 100 for every child
  });

  it("finds the PEP date, so a child with a PEP is not read as having none", async () => {
    const childId = pepChild();
    const peps = getStore().pepRecords.filter((p) => p.child_id === childId);
    expect(peps.some((p) => p.pep_date.trim().length > 0)).toBe(true);

    const body = (await (await call(childId)).json()).data;
    expect(body.pep_compliance.latest_pep_date).not.toBe("");
    expect(body.pep_compliance.peps_last_12m).toBeGreaterThan(0); // was 0
  });

  it("credits the child's own views as participation", async () => {
    const childId = pepChild();
    const peps = getStore().pepRecords.filter((p) => p.child_id === childId);
    expect(peps.every((p) => p.child_views.trim().length > 0)).toBe(true);

    const body = (await (await call(childId)).json()).data;
    expect(body.pep_compliance.child_participation_rate).toBe(100); // was 0
  });

  it("credits virtual school and pupil premium from the fields that record them", async () => {
    const childId = pepChild();
    const peps = getStore().pepRecords.filter((p) => p.child_id === childId);
    expect(peps.every((p) => p.virtual_school_contact.trim().length > 0)).toBe(true);
    expect(peps.every((p) => p.pupil_premium.annual_allocation > 0)).toBe(true);

    const body = (await (await call(childId)).json()).data;
    expect(body.pep_compliance.virtual_school_involved_rate).toBe(100); // was 0
    expect(body.pep_compliance.pupil_premium_discussed_rate).toBe(100); // was 0
  });
});
