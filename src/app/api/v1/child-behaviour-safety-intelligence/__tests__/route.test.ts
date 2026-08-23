import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// Every field this route sent the engine about a restraint named a property
// RestraintRecord does not have, so the whole restraint-oversight picture was
// constants: de-escalation always credited (`?? true`), debrief never credited,
// review never credited. Incidents were the same story — Incident records
// neither de-escalation nor physical intervention, and both were hard-coded to
// false, so no incident in the system had ever de-escalated or been restrained.
//
// The record carries all of it: de_escalation_attempts, child_debriefed,
// staff_debriefed, review_status, and linked_incident_id back to the incident.
//
// Measured on yp_alex before and after: incident de-escalation rate 0% → 60%,
// restraint debrief rate 0% → 67%, unreviewed restraints 6 of 6 → 3, safety
// score 13 → 23.

const call = (childId: string) =>
  GET(new NextRequest(`http://localhost/api/v1/child-behaviour-safety-intelligence?childId=${childId}`));

const childWithRestraints = () => {
  const store = getStore();
  const r = store.restraints[0];
  expect(r).toBeDefined(); // non-vacuity: no restraints ⇒ nothing below proves anything
  return r.child_id;
};

describe("GET /api/v1/child-behaviour-safety-intelligence — restraint oversight", () => {
  it("credits a debrief that the record says happened", async () => {
    const childId = childWithRestraints();
    const theirs = getStore().restraints.filter((r) => r.child_id === childId);
    const debriefed = theirs.filter((r) => r.child_debriefed && r.staff_debriefed);
    expect(debriefed.length).toBeGreaterThan(0);

    const body = (await (await call(childId)).json()).data;
    expect(body.restraint_profile.debrief_rate).toBeGreaterThan(0); // was 0 for every home
  });

  it("counts as unreviewed only the restraints not marked reviewed", async () => {
    const childId = childWithRestraints();
    const theirs = getStore().restraints.filter((r) => r.child_id === childId);
    const reviewed = theirs.filter((r) => r.review_status === "reviewed");
    expect(reviewed.length).toBeGreaterThan(0);

    const body = (await (await call(childId)).json()).data;
    // Every restraint used to count as unreviewed, so this equalled the total.
    expect(body.restraint_profile.unreviewed_count).toBeLessThan(body.restraint_profile.total_90d);
  });

  it("credits de-escalation before an incident from the restraint linked to it", async () => {
    const childId = childWithRestraints();
    const linked = getStore().restraints.filter(
      (r) => r.child_id === childId && r.linked_incident_id && r.de_escalation_attempts.length > 0,
    );
    expect(linked.length).toBeGreaterThan(0);

    const body = (await (await call(childId)).json()).data;
    expect(body.incident_profile.de_escalation_rate).toBeGreaterThan(0); // was 0 for every home
  });
});

describe("GET /api/v1/child-behaviour-safety-intelligence — sleep", () => {
  it("reports sleep as insufficient rather than inventing a 21:30 bedtime", async () => {
    // store.sleepLog is the staff night-shift log: no child_id, no bedtime, no
    // wake time. The old mapping filtered on a child_id that cannot exist and
    // then defaulted bedtime 21:30 / wake 07:00 / quality 3 for entries that
    // never arrived. Nothing in the system records a child's nightly sleep.
    //
    // Unlike the three above, this one does not pin a live delta: sleepLog is
    // empty today, so the answer was already "insufficient_data". It holds the
    // honest empty against a future re-mapping onto the wrong collection.
    const body = (await (await call(childWithRestraints())).json()).data;
    expect(body.sleep_profile.trend).toBe("insufficient_data");
    expect(body.sleep_profile.entries_14d).toBe(0);
    expect(body.sleep_profile.avg_quality).toBeNull(); // not a fabricated 3
  });
});

describe("GET /api/v1/child-behaviour-safety-intelligence — behaviour vocabulary", () => {
  it("files a concerning entry as concerning whichever spelling it carries", async () => {
    // extended.ts and the engine disagree on this word — "concern" vs
    // "concerning" — and the store holds BOTH today, alongside all six
    // intensity spellings. Testing for one and assuming the other files real
    // concerning behaviour as positive, which is the flattering direction:
    // for this child it turns 11 concerning entries into 3 and lifts the
    // positive ratio from 42% to 84%.
    const childId = childWithRestraints();
    const today = todayStr();
    const within30 = (d: string) => {
      const days = (new Date(today).getTime() - new Date(d).getTime()) / 86_400_000;
      return days >= 0 && days <= 30;
    };
    const recent = getStore().behaviourLog.filter((b) => b.child_id === childId && within30(b.date));
    const concerning = recent.filter((b) => b.direction !== "positive");
    const spellings = new Set(concerning.map((b) => b.direction));

    // Non-vacuity, and the whole point: with one spelling present, an equality
    // test on the other would pass here by luck.
    expect(concerning.length).toBeGreaterThan(0);
    expect(spellings.size).toBeGreaterThan(1);

    const body = (await (await call(childId)).json()).data;
    expect(body.behaviour_profile.concerning_count_30d).toBe(concerning.length);
    expect(body.behaviour_profile.positive_count_30d).toBe(recent.length - concerning.length);
  });
});
