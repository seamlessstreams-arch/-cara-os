import { describe, it, expect } from "vitest";
import { buildNotebookTimeline } from "../notebook/notebook-timeline";
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
    staffName: (id: string) => (id === "st1" ? "Olivia" : id),
  };
}

describe("notebook relational timeline (live-safe wrapper)", () => {
  it("returns a valid empty timeline when there are no records (no throw, store-only sources empty)", () => {
    const t = buildNotebookTimeline(base());
    expect(t.childId).toBe(CHILD);
    expect(Array.isArray(t.moments)).toBe(true);
    expect(t.moments).toHaveLength(0);
    expect(["secure", "developing", "fragile"]).toContain(t.stability.status);
  });

  it("projects an incident as a rupture moment and key-work as connection", () => {
    const args = base();
    args.incidents = [{ id: "i1", child_id: CHILD, type: "verbal_aggression", severity: "moderate", description: "Shouting after a cancelled call", date: "2026-10-05", status: "closed", reported_by: "st1", home_id: "home_1", created_at: "2026-10-05T10:00:00Z" } as unknown as Incident];
    args.keyWorkingSessions = [{ id: "k1", child_id: CHILD, staff_id: "st1", date: "2026-10-08", topic: "Trust", created_at: "2026-10-08T10:00:00Z" } as unknown as KeyWorkingSession];
    const t = buildNotebookTimeline(args);
    const lenses = t.moments.map((m) => m.lens);
    expect(lenses).toContain("rupture");
    expect(lenses).toContain("connection");
    expect(t.stability.ruptureCount).toBeGreaterThanOrEqual(1);
    expect(t.stability.connectionCount).toBeGreaterThanOrEqual(1);
  });

  it("only includes the requested child's records", () => {
    const args = base();
    args.incidents = [{ id: "i1", child_id: "someone_else", type: "x", severity: "minor", description: "d", date: "2026-10-05", status: "closed", reported_by: "st1", home_id: "home_1", created_at: "2026-10-05T10:00:00Z" } as unknown as Incident];
    expect(buildNotebookTimeline(args).moments).toHaveLength(0);
  });

  it("is deterministic for the same input", () => {
    const a = base();
    a.keyWorkingSessions = [{ id: "k1", child_id: CHILD, staff_id: "st1", date: "2026-10-08", topic: "Trust", created_at: "2026-10-08T10:00:00Z" } as unknown as KeyWorkingSession];
    expect(buildNotebookTimeline(a)).toEqual(buildNotebookTimeline(a));
  });
});
