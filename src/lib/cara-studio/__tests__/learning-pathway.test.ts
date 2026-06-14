import { describe, it, expect } from "vitest";
import { generateStaffPathway, getLearningPathwaySummary } from "../learning-pathway.service";

describe("learning-pathway.service", () => {
  describe("generateStaffPathway (demo mode)", () => {
    it("returns a pathway for any staff ID", async () => {
      const pathway = await generateStaffPathway("staff-1");

      expect(pathway.staffId).toBe("staff-1");
      expect(pathway.staffName).toBeTruthy();
      expect(pathway.role).toBeTruthy();
      expect(pathway.objectives.length).toBeGreaterThan(0);
      expect(pathway.lastUpdated).toBeTruthy();
    });

    it("includes progress metrics", async () => {
      const pathway = await generateStaffPathway("staff-1");

      expect(typeof pathway.overallProgress).toBe("number");
      expect(pathway.overallProgress).toBeGreaterThanOrEqual(0);
      expect(pathway.overallProgress).toBeLessThanOrEqual(100);
      expect(typeof pathway.criticalCount).toBe("number");
      expect(typeof pathway.overdueCount).toBe("number");
      expect(typeof pathway.completedCount).toBe("number");
    });

    it("objectives have required fields", async () => {
      const pathway = await generateStaffPathway("staff-1");
      const obj = pathway.objectives[0];

      expect(obj.id).toBeTruthy();
      expect(obj.title).toBeTruthy();
      expect(obj.description).toBeTruthy();
      expect(["critical", "high", "medium", "low"]).toContain(obj.priority);
      expect(["not_started", "in_progress", "completed", "overdue"]).toContain(obj.status);
      expect(obj.competencyArea).toBeTruthy();
    });
  });

  describe("getLearningPathwaySummary (demo mode)", () => {
    it("returns summary with aggregate data", async () => {
      const summary = await getLearningPathwaySummary();

      expect(summary.totalStaff).toBeGreaterThan(0);
      expect(typeof summary.averageProgress).toBe("number");
      expect(typeof summary.staffWithOverdue).toBe("number");
      expect(typeof summary.criticalObjectives).toBe("number");
    });

    it("includes top competency gaps", async () => {
      const summary = await getLearningPathwaySummary();

      expect(summary.topCompetencyGaps.length).toBeGreaterThan(0);
      const gap = summary.topCompetencyGaps[0];
      expect(gap.area).toBeTruthy();
      expect(gap.staffCount).toBeGreaterThan(0);
    });

    it("includes individual pathways", async () => {
      const summary = await getLearningPathwaySummary();

      expect(summary.pathways.length).toBeGreaterThan(0);
      expect(summary.pathways[0].staffName).toBeTruthy();
      expect(summary.pathways[0].objectives.length).toBeGreaterThan(0);
    });
  });
});
