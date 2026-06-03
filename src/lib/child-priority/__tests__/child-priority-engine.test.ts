import { describe, it, expect } from "vitest";
import {
  computeChildPriority,
  type ChildPriorityInput,
  type PriorityIncidentInput,
  type PriorityMedErrorInput,
} from "../child-priority-engine";
import type { ChildInput } from "../../placement-breakdown-forecast/placement-breakdown-forecast-engine";
import type { ComplaintCorrInput } from "../../complaints-incident-correlation/complaints-incident-correlation-engine";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const ago = (n: number) => addDays(TODAY, -n);

function makeChild(o: Partial<ChildInput> & { id: string; name: string }): ChildInput {
  return {
    date_of_birth: "2010-06-02",
    placement_start: ago(200),
    placement_type: "residential",
    risk_flags: [],
    ...o,
  };
}
const incident = (o: Partial<PriorityIncidentInput> & { child_id: string }): PriorityIncidentInput => ({
  date: ago(5), type: "physical_intervention", severity: "high", ...o,
});
const complaint = (o: Partial<ComplaintCorrInput> & { child_id: string }): ComplaintCorrInput => ({
  date: ago(10), category: "care_practice", includes_safeguarding_element: false, status: "closed", ...o,
});
const medErr = (o: Partial<PriorityMedErrorInput> & { child_id: string }): PriorityMedErrorInput => ({
  date: ago(20), severity: "no_harm", ...o,
});

function run(p: Partial<ChildPriorityInput>): ChildPriorityInput {
  return {
    children: [], incidents: [], complaints: [], medicationErrors: [],
    missingEpisodes: [], restraints: [], sanctions: [], behaviour: [], education: [], keyworking: [],
    today: TODAY, ...p,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
describe("empty input", () => {
  const r = computeChildPriority(run({}));
  it("returns no children and a zeroed overview", () => {
    expect(r.children).toHaveLength(0);
    expect(r.overview.children_analysed).toBe(0);
    expect(r.overview.top_priority_child).toBeNull();
    expect(r.insights).toHaveLength(0);
  });
});

describe("convergent child rises to critical #1 (the headline)", () => {
  const A = "a";
  const r = computeChildPriority(run({
    children: [makeChild({ id: A, name: "Alex", placement_start: ago(200), risk_flags: ["CSE risk", "goes missing"] })],
    incidents: [
      incident({ child_id: A, date: ago(35), severity: "high" }),
      incident({ child_id: A, date: ago(22), severity: "high" }),
      incident({ child_id: A, date: ago(10), severity: "critical" }),
      incident({ child_id: A, date: ago(2), type: "missing_from_care", severity: "high" }),
      incident({ child_id: A, date: ago(1), type: "safeguarding_concern", severity: "critical" }),
    ],
    complaints: [
      complaint({ child_id: A, date: ago(52), category: "staff_conduct" }),
      complaint({ child_id: A, date: ago(45) }),
      complaint({ child_id: A, date: ago(38), category: "decisions_about_me", includes_safeguarding_element: true }),
    ],
    medicationErrors: [
      medErr({ child_id: A, date: ago(20), severity: "no_harm" }),
      medErr({ child_id: A, date: ago(25), severity: "no_harm" }),
    ],
  }));
  const top = r.children[0];

  it("ranks the convergent child first at critical priority", () => {
    expect(top.child_name).toBe("Alex");
    expect(top.rank).toBe(1);
    expect(top.priority_band).toBe("critical");
    expect(top.priority_score).toBeGreaterThanOrEqual(75);
  });
  it("flags multi-domain and safeguarding", () => {
    expect(top.multi_domain).toBe(true);
    expect(top.safeguarding).toBe(true);
  });
  it("shows the contributing domains, strongest first", () => {
    const domainKeys = top.domains.map((d) => d.domain);
    expect(domainKeys).toContain("placement");
    expect(domainKeys).toContain("complaints");
    expect(domainKeys).toContain("medication");
    // sorted descending by score
    for (let i = 1; i < top.domains.length; i++) {
      expect(top.domains[i - 1].score).toBeGreaterThanOrEqual(top.domains[i].score);
    }
  });
  it("surfaces a single most-important action from the lead domain", () => {
    expect(top.top_action).not.toBeNull();
    expect(top.top_action!.regulatory_link.length).toBeGreaterThan(0);
  });
  it("emits a critical multi-domain insight", () => {
    expect(r.insights.some((i) => i.severity === "critical" && /more than one/i.test(i.text))).toBe(true);
  });
});

describe("single-domain child stays lower priority", () => {
  const r = computeChildPriority(run({
    children: [makeChild({ id: "b", name: "Bo" })],
    complaints: [complaint({ child_id: "b", date: ago(6), category: "contact_family" })], // emerging_watch, single domain
  }));
  const c = r.children[0];
  it("is not multi-domain and carries only its one real signal", () => {
    expect(c.multi_domain).toBe(false);
    expect(c.domains.map((d) => d.domain)).toEqual(["complaints"]);
  });
  it("does not reach critical from one weak signal", () => {
    expect(c.priority_band).not.toBe("critical");
  });
});

describe("medication harm contributes a domain and an urgent action", () => {
  const r = computeChildPriority(run({
    children: [makeChild({ id: "c", name: "Cara" })],
    medicationErrors: [
      medErr({ child_id: "c", date: ago(10), severity: "moderate" }),
      medErr({ child_id: "c", date: ago(30), severity: "no_harm" }),
    ],
  }));
  const c = r.children[0];
  it("includes a medication domain noting harm", () => {
    const medDomain = c.domains.find((d) => d.domain === "medication");
    expect(medDomain).toBeDefined();
    expect(medDomain!.detail).toMatch(/harm/i);
  });
  it("recommends an urgent medication review", () => {
    expect(c.top_action?.domain).toBe("medication");
    expect(c.top_action?.priority).toBe("urgent");
  });
});

describe("ranking across a cohort", () => {
  const r = computeChildPriority(run({
    children: [
      makeChild({ id: "a", name: "Alex", risk_flags: ["CSE risk"] }),
      makeChild({ id: "b", name: "Bo" }),
      makeChild({ id: "c", name: "Cara" }),
    ],
    incidents: [
      incident({ child_id: "a", date: ago(10), severity: "critical" }),
      incident({ child_id: "a", date: ago(2), type: "safeguarding_concern", severity: "critical" }),
    ],
    complaints: [
      complaint({ child_id: "a", date: ago(45), includes_safeguarding_element: true }),
      complaint({ child_id: "a", date: ago(50) }),
      complaint({ child_id: "b", date: ago(6), category: "contact_family" }),
    ],
    medicationErrors: [medErr({ child_id: "c", date: ago(15), severity: "low" })],
  }));
  it("orders by fused priority score and assigns ranks", () => {
    expect(r.children[0].child_name).toBe("Alex");
    expect(r.children.map((c) => c.rank)).toEqual([1, 2, 3]);
    for (let i = 1; i < r.children.length; i++) {
      expect(r.children[i - 1].priority_score).toBeGreaterThanOrEqual(r.children[i].priority_score);
    }
  });
  it("identifies the top priority child in the overview", () => {
    expect(r.overview.top_priority_child).toBe("Alex");
    expect(r.overview.children_analysed).toBe(3);
  });
});

describe("continuity stream folds into the fusion when provided", () => {
  const A = "a";
  const r = computeChildPriority(run({
    children: [makeChild({ id: A, name: "Alex" })],
    incidents: [incident({ child_id: A, date: ago(5), severity: "high" })],
    staff: [
      { id: "edward", name: "Edward", active: true },
      { id: "darren", name: "Darren", active: true },
    ],
    keyWorkers: [{ child_id: A, key_worker_id: "edward", secondary_worker_id: null }],
    keyWorkingSessions: [
      { child_id: A, staff_id: "darren", date: ago(3) },
      { child_id: A, staff_id: "darren", date: ago(10) },
    ],
  }));
  it("adds a continuity domain when the named key worker delivers none of the sessions", () => {
    const top = r.children.find((c) => c.child_id === A)!;
    expect(top.domains.map((d) => d.domain)).toContain("continuity");
    const cont = top.domains.find((d) => d.domain === "continuity")!;
    expect(cont.score).toBeGreaterThanOrEqual(35); // low continuity → high relational risk
  });
  it("does not add a continuity domain when continuity inputs are omitted", () => {
    const r2 = computeChildPriority(run({
      children: [makeChild({ id: A, name: "Alex" })],
      incidents: [incident({ child_id: A, date: ago(5), severity: "high" })],
    }));
    const top = r2.children.find((c) => c.child_id === A)!;
    expect(top.domains.map((d) => d.domain)).not.toContain("continuity");
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = run({
      children: [makeChild({ id: "a", name: "Alex", risk_flags: ["CSE"] })],
      incidents: [incident({ child_id: "a", date: ago(5), severity: "critical" })],
      complaints: [complaint({ child_id: "a", date: ago(40), includes_safeguarding_element: true })],
    });
    const x = computeChildPriority(input);
    const y = computeChildPriority(input);
    expect(JSON.stringify(x)).toBe(JSON.stringify(y));
  });
});
