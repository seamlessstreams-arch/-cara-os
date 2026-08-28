import { describe, it, expect } from "vitest";
import { computeCamhsSpecialistReferral } from "../home-camhs-specialist-referral-intelligence-engine";

// `children_waiting` was `waiting.length` — the number of waiting REFERRALS. A
// child can hold more than one open referral, so a home with one child waiting
// on two referrals reported two children waiting, in the field and in the
// headline. The sibling field is named `active_referrals` precisely because
// that one does count records.

function referral(id: string, child_id: string, status: string) {
  return {
    id,
    child_id,
    referral_date: "2026-06-01",
    status,
    waiting_days: 30,
    appointments_offered: 0,
    appointments_attended: 0,
    outcome_recorded: false,
  };
}

const BASE = {
  today: "2026-08-28",
  total_children: 4,
  emergency_referrals: [],
  specialist_contacts: [],
};

describe("children_waiting counts children, not referrals", () => {
  it("counts one child holding two waiting referrals once", () => {
    const r = computeCamhsSpecialistReferral({
      ...BASE,
      camhs_referrals: [
        referral("r1", "yp_alex", "waiting"),
        referral("r2", "yp_alex", "waiting"),
      ],
    });
    expect(r.children_waiting).toBe(1);
    expect(r.headline).not.toContain("2 child(ren) waiting");
  });

  it("still counts two different children as two", () => {
    const r = computeCamhsSpecialistReferral({
      ...BASE,
      camhs_referrals: [
        referral("r1", "yp_alex", "waiting"),
        referral("r2", "yp_jordan", "waiting"),
      ],
    });
    expect(r.children_waiting).toBe(2);
  });

  it("leaves the referral-shaped sibling counting referrals", () => {
    const r = computeCamhsSpecialistReferral({
      ...BASE,
      camhs_referrals: [
        referral("r1", "yp_alex", "active"),
        referral("r2", "yp_alex", "active"),
      ],
    });
    expect(r.active_referrals).toBe(2);
  });
});
