import { describe, it, expect } from "vitest";
import {
  computeStaffChildContinuity,
  recencyScore, concentrationScore, frequencyScore, bandOf, daysAgo,
  type StaffChildContinuityInput,
  type ContinuityChildInput,
  type ContinuityStaffInput,
  type ContinuitySessionInput,
} from "../staff-child-continuity-engine";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const ago = (n: number) => addDays(TODAY, -n);

const child = (o: Partial<ContinuityChildInput> & { id: string; name: string }): ContinuityChildInput => ({
  key_worker_id: "staff_kw", secondary_worker_id: null, ...o,
});
const staff = (o: Partial<ContinuityStaffInput> & { id: string }): ContinuityStaffInput => ({
  name: o.id, active: true, ...o,
});
const session = (o: Partial<ContinuitySessionInput> & { child_id: string; staff_id: string }): ContinuitySessionInput => ({
  date: ago(5), ...o,
});
function run(p: Partial<StaffChildContinuityInput>): StaffChildContinuityInput {
  return { children: [], staff: [], sessions: [], today: TODAY, ...p };
}

// ══════════════════════════════════════════════════════════════════════════════
describe("scoring helpers", () => {
  it("recencyScore decays with time", () => {
    expect(recencyScore(5)).toBe(100);
    expect(recencyScore(20)).toBe(70);
    expect(recencyScore(40)).toBe(40);
    expect(recencyScore(60)).toBe(10);
    expect(recencyScore(null)).toBe(0);
  });
  it("concentrationScore rewards fewer distinct staff", () => {
    expect(concentrationScore(1)).toBe(100);
    expect(concentrationScore(2)).toBe(80);
    expect(concentrationScore(5)).toBe(10);
    expect(concentrationScore(0)).toBe(0);
  });
  it("frequencyScore rewards regular sessions", () => {
    expect(frequencyScore(6)).toBe(100);
    expect(frequencyScore(1)).toBe(30);
    expect(frequencyScore(0)).toBe(0);
  });
  it("bandOf maps index to band", () => {
    expect(bandOf(90)).toBe("strong");
    expect(bandOf(60)).toBe("adequate");
    expect(bandOf(40)).toBe("fragmented");
    expect(bandOf(20)).toBe("critical");
  });
  it("daysAgo counts whole days", () => {
    expect(daysAgo(ago(10), TODAY)).toBe(10);
  });
});

describe("empty input", () => {
  const r = computeStaffChildContinuity(run({}));
  it("returns no children and a zeroed overview", () => {
    expect(r.children).toHaveLength(0);
    expect(r.overview.children_analysed).toBe(0);
    expect(r.alerts).toHaveLength(0);
  });
});

describe("strong continuity (key worker delivers, recent, single staff)", () => {
  const r = computeStaffChildContinuity(run({
    children: [child({ id: "c1", name: "Casey", key_worker_id: "kw" })],
    staff: [staff({ id: "kw", name: "Chervelle", active: true })],
    sessions: [
      session({ child_id: "c1", staff_id: "kw", date: ago(3) }),
      session({ child_id: "c1", staff_id: "kw", date: ago(17) }),
      session({ child_id: "c1", staff_id: "kw", date: ago(31) }),
    ],
  }));
  const c = r.children[0];
  it("scores a strong continuity index with no flags", () => {
    expect(c.band).toBe("strong");
    expect(c.continuity_index).toBeGreaterThanOrEqual(75);
    expect(c.key_worker_share).toBe(100);
    expect(c.flags).toHaveLength(0);
  });
});

describe("fragmented continuity (assigned key worker not delivering)", () => {
  const r = computeStaffChildContinuity(run({
    children: [child({ id: "a", name: "Alex", key_worker_id: "edward" })],
    staff: [staff({ id: "edward", name: "Edward", active: true }), staff({ id: "darren", name: "Darren", active: true })],
    sessions: [
      session({ child_id: "a", staff_id: "darren", date: ago(1) }),
      session({ child_id: "a", staff_id: "darren", date: ago(8) }),
      session({ child_id: "a", staff_id: "darren", date: ago(20) }),
    ],
  }));
  const c = r.children[0];
  it("scores low because the named key worker delivers none of the sessions", () => {
    expect(c.key_worker_share).toBe(0);
    expect(c.continuity_index).toBeLessThan(55);
    expect(c.flags.some((f) => /delivering few or none/i.test(f))).toBe(true);
  });
  it("recommends protecting key-working time for the named worker", () => {
    expect(c.recommended_actions.some((a) => /protect key-working time/i.test(a.action))).toBe(true);
  });
});

describe("no key worker assigned", () => {
  const r = computeStaffChildContinuity(run({
    children: [child({ id: "x", name: "Sam", key_worker_id: null })],
    sessions: [session({ child_id: "x", staff_id: "any", date: ago(5) })],
    staff: [staff({ id: "any" })],
  }));
  const c = r.children[0];
  it("flags the gap, caps the index, and raises a critical alert", () => {
    expect(c.flags.some((f) => /No key worker assigned/i.test(f))).toBe(true);
    expect(c.continuity_index).toBeLessThanOrEqual(35);
    expect(r.alerts.some((a) => a.severity === "critical" && /no key worker/i.test(a.message))).toBe(true);
  });
});

describe("inactive key worker (leaver)", () => {
  const r = computeStaffChildContinuity(run({
    children: [child({ id: "y", name: "Jo", key_worker_id: "left" })],
    staff: [staff({ id: "left", name: "Pat", active: false })],
    sessions: [session({ child_id: "y", staff_id: "left", date: ago(50) })],
  }));
  const c = r.children[0];
  it("flags the inactive key worker and caps the index", () => {
    expect(c.key_worker_active).toBe(false);
    expect(c.flags.some((f) => /no longer active/i.test(f))).toBe(true);
    expect(c.continuity_index).toBeLessThanOrEqual(40);
    expect(r.alerts.some((a) => a.severity === "critical" && /left or is inactive/i.test(a.message))).toBe(true);
  });
});

describe("no sessions recorded", () => {
  const r = computeStaffChildContinuity(run({
    children: [child({ id: "z", name: "Kit", key_worker_id: "kw" })],
    staff: [staff({ id: "kw", active: true })],
    sessions: [],
  }));
  const c = r.children[0];
  it("flags the absence and scores critical", () => {
    expect(c.sessions_90d).toBe(0);
    expect(c.flags.some((f) => /No key-working sessions recorded/i.test(f))).toBe(true);
    expect(c.band).toBe("critical");
  });
});

describe("overview, ordering and insights across a cohort", () => {
  const r = computeStaffChildContinuity(run({
    children: [
      child({ id: "c1", name: "Casey", key_worker_id: "kw_c" }),
      child({ id: "a", name: "Alex", key_worker_id: "edward" }),
      child({ id: "x", name: "Sam", key_worker_id: null }),
    ],
    staff: [staff({ id: "kw_c", name: "Chervelle" }), staff({ id: "edward", name: "Edward" }), staff({ id: "darren", name: "Darren" })],
    sessions: [
      session({ child_id: "c1", staff_id: "kw_c", date: ago(3) }),
      session({ child_id: "c1", staff_id: "kw_c", date: ago(17) }),
      session({ child_id: "a", staff_id: "darren", date: ago(2) }),
      session({ child_id: "a", staff_id: "darren", date: ago(12) }),
    ],
  }));
  it("orders weakest-first and identifies the weakest child", () => {
    expect(r.children[0].continuity_index).toBeLessThanOrEqual(r.children[r.children.length - 1].continuity_index);
    expect(r.overview.children_analysed).toBe(3);
    expect(r.overview.no_key_worker_count).toBe(1);
  });
  it("emits a critical insight about the missing key worker", () => {
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });
  it("emits a warning about the named key worker not delivering", () => {
    expect(r.insights.some((i) => i.severity === "warning" && /paper but not in practice/i.test(i.text))).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = run({
      children: [child({ id: "a", name: "Alex", key_worker_id: "kw" })],
      staff: [staff({ id: "kw" })],
      sessions: [session({ child_id: "a", staff_id: "kw", date: ago(5) })],
    });
    const x = computeStaffChildContinuity(input);
    const y = computeStaffChildContinuity(input);
    expect(JSON.stringify(x)).toBe(JSON.stringify(y));
  });
});
