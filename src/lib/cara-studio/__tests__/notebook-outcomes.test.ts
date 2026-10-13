import { describe, it, expect } from "vitest";
import { buildNotebookOutcomes } from "../notebook/notebook-outcomes";
import type { KeyWorkingSession, MissingEpisode, EducationRecord, LACReview } from "@/types/extended";
import type { Incident } from "@/types";

const NOW = "2026-10-13T12:00:00.000Z";
const CHILD = "yp_1";

function base() {
  return {
    childId: CHILD,
    childName: "Alex River",
    now: NOW,
    keyWorkingSessions: [] as KeyWorkingSession[],
    incidents: [] as Incident[],
    missingEpisodes: [] as MissingEpisode[],
    educationRecords: [] as EducationRecord[],
    lacReviews: [] as LACReview[],
  };
}

describe("notebook outcomes (live-safe wrapper)", () => {
  it("returns the five SCCIF outcome domains with no records (no throw, store-only empty)", () => {
    const o = buildNotebookOutcomes(base());
    expect(o.childId).toBe(CHILD);
    expect(o.domains).toHaveLength(5);
    expect(o.domains.every((d) => typeof d.label === "string" && typeof d.status === "string")).toBe(true);
    expect(typeof o.headline).toBe("string");
  });

  it("registers key-work as evidence and stays deterministic", () => {
    const a = base();
    a.keyWorkingSessions = [{ id: "k1", child_id: CHILD, staff_id: "st1", date: "2026-10-08", topic: "Trust", created_at: "2026-10-08T10:00:00Z" } as unknown as KeyWorkingSession];
    const o = buildNotebookOutcomes(a);
    expect(o.domains.some((d) => d.hasEvidence)).toBe(true);
    expect(buildNotebookOutcomes(a)).toEqual(buildNotebookOutcomes(a));
  });

  it("scopes to the requested child (another child's incident does not count)", () => {
    const a = base();
    a.incidents = [{ id: "i1", child_id: "someone_else", type: "x", severity: "minor", description: "d", date: "2026-10-05", status: "closed", reported_by: "st1", home_id: "h", created_at: "2026-10-05T10:00:00Z" } as unknown as Incident];
    const o = buildNotebookOutcomes(a);
    expect(o.domains.every((d) => d.recentCount === 0 && d.priorCount === 0)).toBe(true);
  });
});
