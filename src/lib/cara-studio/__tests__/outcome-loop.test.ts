import { describe, it, expect } from "vitest";

// outcome-loop.service uses async Supabase calls, so we test the demo data path
// which is returned when createServerClient() returns null (no DB)
import { getArtifactOutcome, getOutcomeLoopSummary } from "../outcome-loop.service";

describe("outcome-loop.service", () => {
  describe("getArtifactOutcome (demo mode)", () => {
    it("returns demo outcome for any artifact ID", async () => {
      const outcome = await getArtifactOutcome("test-artifact-1");

      expect(outcome).not.toBeNull();
      expect(outcome!.artifactId).toBe("test-artifact-1");
      expect(outcome!.artifactType).toBe("management_oversight");
      expect(outcome!.hasLinkedActions).toBe(true);
      expect(outcome!.actionsCompleted).toBe(2);
      expect(outcome!.actionsTotal).toBe(3);
      expect(outcome!.completionRate).toBe(67);
      expect(outcome!.outcomeStatus).toBe("partial");
      expect(outcome!.followUpRecorded).toBe(true);
    });

    it("includes committed date", async () => {
      const outcome = await getArtifactOutcome("test-2");

      expect(outcome!.committedAt).toBeTruthy();
    });
  });

  describe("getOutcomeLoopSummary (demo mode)", () => {
    it("returns summary with aggregate data", async () => {
      const summary = await getOutcomeLoopSummary();

      expect(summary.totalCommitted).toBe(12);
      expect(summary.withActions).toBe(8);
      expect(summary.actionsCompleted).toBe(15);
      expect(summary.actionsTotal).toBe(22);
      expect(summary.completionRate).toBe(68);
      expect(summary.followUpRate).toBe(83);
    });

    it("includes breakdown by type", async () => {
      const summary = await getOutcomeLoopSummary();

      expect(summary.byType.length).toBeGreaterThan(0);
      const mgmtType = summary.byType.find((t) => t.type === "management_oversight");
      expect(mgmtType).toBeTruthy();
      expect(mgmtType!.count).toBe(5);
      expect(mgmtType!.completionRate).toBe(80);
    });

    it("accepts optional childId parameter", async () => {
      const summary = await getOutcomeLoopSummary("child-1");

      // Still returns demo data but shouldn't error
      expect(summary.totalCommitted).toBeGreaterThanOrEqual(0);
    });
  });
});
