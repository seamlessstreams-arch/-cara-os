import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";

// This route mapped ten collections onto the impact engine's inputs through
// `??` chains that led with fields the records do not have. With every operand
// undefined the trailing literal was the only thing that ever ran, so whole
// dimensions of a child's impact assessment were constants:
//
//   risk_level    always "medium"   (the record says current_level)
//   controls      always []         (the record says mitigations)
//   category      always ""         (the record says domain)
//   severity      always "low"      (the record says intensity)
//   exclusions    always 0          (the record says record_type)
//   attended      always true       (health assessments: the record says status)
//   date          always today      (missing episodes: the record says date_missing)
//
// Each test computes its expectation from the store rather than hard-coding.

const CHILD = "yp_alex";
const call = () =>
  GET(new NextRequest(`http://localhost/api/v1/child-impact/${CHILD}`), {
    params: Promise.resolve({ childId: CHILD }),
  });
const domain = (b: { domains: { domain: string; score: number; highlights: string[]; concerns: string[] }[] }, name: string) =>
  b.domains.find((d) => d.domain === name)!;

describe("GET /api/v1/child-impact/[childId] — risk reduction", () => {
  it("counts the control measures actually on the assessments", async () => {
    const ra = getStore().riskAssessments.filter((r) => r.child_id === CHILD);
    const controls = ra.reduce((n, r) => n + r.mitigations.length, 0);
    expect(controls).toBeGreaterThan(0); // non-vacuity: an always-[] read agrees with 0

    const body = (await (await call()).json()).data;
    expect(domain(body, "risk_reduction").highlights).toContain(
      `${controls} risk control measures in place`,
    );
  });

  it("can see a risk rated high, which a constant \"medium\" never could", async () => {
    const ra = getStore().riskAssessments.filter((r) => r.child_id === CHILD);
    const serious = ra.filter((r) => r.current_level === "high" || r.current_level === "very_high");
    expect(serious.length).toBeGreaterThan(0);

    const body = (await (await call()).json()).data;
    expect(domain(body, "risk_reduction").concerns.join(" ")).toContain("rated high or critical");
  });
});

describe("GET /api/v1/child-impact/[childId] — education", () => {
  it("finds an exclusion through record_type rather than a field that does not exist", async () => {
    const excl = (getStore().educationRecords ?? []).filter(
      (r) => r.child_id === CHILD && (r.record_type === "exclusion" || r.record_type === "suspension"),
    );
    expect(excl.length).toBeGreaterThan(0);

    const body = (await (await call()).json()).data;
    expect(domain(body, "education").concerns.join(" ")).toContain("exclusion");
  });
});

describe("GET /api/v1/child-impact/[childId] — behaviour", () => {
  it("credits regulation support from the strategy the entry records", async () => {
    // `regulation_support_given` is not on BehaviourEntry, so it always read
    // false and no child had ever been supported to regulate.
    const withStrategy = getStore().behaviourLog.filter(
      (b) => b.child_id === CHILD && b.strategy_used.trim().length > 0,
    );
    expect(withStrategy.length).toBeGreaterThan(0);

    const body = (await (await call()).json()).data;
    expect(domain(body, "behaviour_wellbeing").highlights).toContain(
      "Emotional regulation support consistently provided",
    );
  });
});

describe("GET /api/v1/child-impact/[childId] — missing episodes", () => {
  it("dates an episode from date_missing, not from today", async () => {
    // Neither `date` nor `reported_at` is on MissingEpisode, so this fell
    // through to today — every episode looked like it happened this morning.
    const today = todayStr();
    const theirs = getStore().missingEpisodes.filter((m) => m.child_id === CHILD);
    const within90 = theirs.filter((m) => {
      const days = (new Date(today).getTime() - new Date(m.date_missing).getTime()) / 86_400_000;
      return days >= 0 && days <= 90;
    });
    // Non-vacuity: at least one episode must NOT be dated today, or "dated
    // from date_missing" and "dated today" would agree.
    expect(theirs.some((m) => m.date_missing.slice(0, 10) !== today)).toBe(true);
    expect(within90.length).toBeGreaterThan(0);

    const body = (await (await call()).json()).data;
    expect(domain(body, "safety_stability").concerns.join(" ")).toContain(
      `${within90.length} missing episodes in the last 90 days`,
    );
  });
});
