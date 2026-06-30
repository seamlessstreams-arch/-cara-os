import { describe, it, expect } from "vitest";
import { buildPracticeFollowUps, type FollowUpInput } from "../workflow-suggestion-engine";

const NOW = "2026-06-30T12:00:00.000Z";
const children = [{ id: "yp_alex", name: "Alex" }];

function input(over: Partial<FollowUpInput> = {}): FollowUpInput {
  return { now: NOW, children, records: [], ...over };
}

describe("buildPracticeFollowUps", () => {
  it("turns a recent physical incident into oversight + debrief + risk + session, with source context", () => {
    const out = buildPracticeFollowUps(
      input({
        records: [
          {
            event: "incident_created",
            source_table: "incidents",
            source_id: "inc_1",
            child_id: "yp_alex",
            content: "Physical intervention / restraint used during a transition.",
            label: "Incident — physical",
            date: "2026-06-28",
          },
        ],
      }),
    );
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(out.every((f) => f.source_id === "inc_1" && f.child_name === "Alex")).toBe(true);
    expect(out.some((f) => f.type === "oversight")).toBe(true);
    expect(out.some((f) => f.type === "debrief")).toBe(true); // physical content → debrief
  });

  it("deep-links oversight/session/risk into Cara Studio, leaves referrals unlinked", () => {
    const out = buildPracticeFollowUps(
      input({
        records: [
          {
            event: "safeguarding_concern_raised",
            source_table: "disclosures",
            source_id: "dis_1",
            child_id: "yp_alex",
            content: "Concern about exploitation.",
            label: "Safeguarding concern",
            date: "2026-06-29",
          },
        ],
      }),
    );
    const oversight = out.find((f) => f.target_type === "management_oversight_drafts")!;
    expect(oversight.studio_link).toContain("/cara-studio?type=management_oversight");
    expect(oversight.studio_link).toContain("childId=yp_alex");
    const referral = out.find((f) => f.target_type === "referral")!;
    expect(referral.studio_link).toBeNull(); // Studio can't draft a referral
  });

  it("excludes records outside the recent window (old and future-dated)", () => {
    const out = buildPracticeFollowUps(
      input({
        windowDays: 30,
        records: [
          { event: "incident_created", source_table: "incidents", source_id: "old", child_id: "yp_alex", content: "x", label: "old", date: "2026-01-01" },
          { event: "incident_created", source_table: "incidents", source_id: "future", child_id: "yp_alex", content: "x", label: "future", date: "2026-12-01" },
        ],
      }),
    );
    expect(out).toHaveLength(0);
  });

  it("daily-log follow-up uses word boundaries — no substring false positives", () => {
    const log = (content: string, id: string) => ({
      event: "daily_log_created" as const,
      source_table: "daily_log",
      source_id: id,
      child_id: "yp_alex",
      content,
      label: "Daily log",
      date: "2026-06-29",
    });
    // "brisk"/"harmonious"/"harmless" must NOT trigger (substrings of risk/harm).
    expect(buildPracticeFollowUps(input({ records: [log("Lovely brisk walk; a harmonious, harmless day", "d1")] }))).toHaveLength(0);
    // genuine concern (stemmed) must still trigger an oversight follow-up.
    const real = buildPracticeFollowUps(input({ records: [log("Staff raised a safeguarding concern about contact", "d2")] }));
    expect(real.length).toBeGreaterThan(0);
    expect(real[0].type).toBe("oversight");
  });

  it("sorts by priority (urgent first) and resolves child names", () => {
    const out = buildPracticeFollowUps(
      input({
        records: [
          { event: "missing_episode_created", source_table: "missing_episodes", source_id: "m1", child_id: "yp_alex", content: "", label: "Missing episode", date: "2026-06-29" },
        ],
      }),
    );
    expect(out[0].priority).toBe("urgent");
    const rank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < out.length; i++) {
      expect(rank[out[i].priority]).toBeGreaterThanOrEqual(rank[out[i - 1].priority]);
    }
  });
});
