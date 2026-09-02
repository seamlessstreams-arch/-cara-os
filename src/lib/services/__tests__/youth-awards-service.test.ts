import { describe, it, expect } from "vitest";
import { todayStr, daysFromNow} from "@/lib/utils";
import {
  validateYouthAward,
  AWARD_SCHEMES,
  SECTIONS,
  computeAlerts,
  computeMetrics,
  type YouthAwardsRow,
} from "../youth-awards-service";

const now = todayStr();

function makeRow(overrides?: Partial<YouthAwardsRow>): YouthAwardsRow {
  return {
    id: "row-1",
    home_id: "home-1",
    young_person_name: "Young Person A",
    record_date: now,
    supporting_staff: "Staff A",
    award_scheme: "Duke of Edinburgh (Bronze)",
    section: "Volunteering",
    activity_description: "Volunteered at local food bank",
    hours_completed: 10,
    hours_required: 26,
    assessor_name: "Assessor A",
    evidence_recorded: true,
    young_person_engaged: true,
    barriers_identified: null,
    support_provided: null,
    milestone_achieved: false,
    completion_date: null,
    certificate_received: false,
    celebrated_achievement: false,
    linked_to_pathway_plan: true,
    social_worker_informed: true,
    notes: null,
    created_at: now,
    updated_at: now,
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("youth-awards-service", () => {
  describe("validateYouthAward", () => {
    it("valid complete record passes", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "Duke of Edinburgh (Bronze)",
        section: "Volunteering",
        activityDescription: "Volunteered at local food bank",
        hoursCompleted: 10,
        hoursRequired: 26,
        milestoneAchieved: false,
        celebratedAchievement: false,
        completionDate: null,
        certificateReceived: false,
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("missing young person name fails", () => {
      const result = validateYouthAward({
        youngPersonName: "",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Young person's name is required");
    });

    it("missing record date fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: undefined,
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Record date is required"));
    });

    it("future date fails", () => {
      const futureDate = daysFromNow(30);
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: futureDate,
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("future"));
    });

    it("missing supporting staff fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Supporting staff member is required"));
    });

    it("missing award scheme fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: undefined,
        activityDescription: "Some activity",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Award scheme must be one of"));
    });

    it("invalid award scheme fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "Made Up Award",
        activityDescription: "Some activity",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Award scheme must be one of"));
    });

    it("missing activity description fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Activity description is required"));
    });

    it("hours_completed > hours_required fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        hoursCompleted: 50,
        hoursRequired: 26,
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Hours completed cannot exceed hours required"));
    });

    it("milestone achieved without celebration produces advisory", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        milestoneAchieved: true,
        celebratedAchievement: false,
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("milestone has been achieved but not yet celebrated"));
    });

    it("completion date without certificate produces advisory", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        completionDate: "2025-02-28",
        certificateReceived: false,
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("certificate has not yet been received"));
    });

    it("not linked to pathway plan produces advisory", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "ASDAN",
        activityDescription: "Some activity",
        linkedToPathwayPlan: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("not linked to the young person's pathway plan"));
    });

    it("DofE Gold + Residential section with low hours produces advisory about 5 days", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "Duke of Edinburgh (Gold)",
        section: "Residential",
        activityDescription: "Residential project",
        hoursRequired: 20,
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("minimum of 5 days"));
    });

    it("Residential section with non-Gold DofE fails", () => {
      const result = validateYouthAward({
        youngPersonName: "Young Person A",
        recordDate: "2025-03-01",
        supportingStaff: "Staff A",
        awardScheme: "Duke of Edinburgh (Bronze)",
        section: "Residential",
        activityDescription: "Residential project",
        linkedToPathwayPlan: true,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("Residential section is only available for Duke of Edinburgh Gold"));
    });
  });

  describe("AWARD_SCHEMES", () => {
    it("contains DofE Bronze, Silver, Gold", () => {
      expect(AWARD_SCHEMES).toContain("Duke of Edinburgh (Bronze)");
      expect(AWARD_SCHEMES).toContain("Duke of Edinburgh (Silver)");
      expect(AWARD_SCHEMES).toContain("Duke of Edinburgh (Gold)");
    });

    it("contains ASDAN", () => {
      expect(AWARD_SCHEMES).toContain("ASDAN");
    });

    it("contains AQA Unit Award", () => {
      expect(AWARD_SCHEMES).toContain("AQA Unit Award");
    });

    it("contains Arts Award schemes", () => {
      expect(AWARD_SCHEMES).toContain("Arts Award (Discover)");
      expect(AWARD_SCHEMES).toContain("Arts Award (Gold)");
    });

    it("contains Saltire Award", () => {
      expect(AWARD_SCHEMES).toContain("Saltire Award");
    });

    it("has 15 schemes total", () => {
      expect(AWARD_SCHEMES.length).toBe(15);
    });
  });

  describe("SECTIONS", () => {
    it("includes Volunteering, Physical, Skills, Expedition, Residential", () => {
      expect(SECTIONS).toContain("Volunteering");
      expect(SECTIONS).toContain("Physical");
      expect(SECTIONS).toContain("Skills");
      expect(SECTIONS).toContain("Expedition");
      expect(SECTIONS).toContain("Residential");
    });

    it("has 5 sections", () => {
      expect(SECTIONS.length).toBe(5);
    });
  });

  describe("computeMetrics", () => {
    it("returns expected structure from sample data", () => {
      const rows = [
        makeRow({ young_person_name: "YP A", award_scheme: "Duke of Edinburgh (Bronze)", hours_completed: 10 }),
        makeRow({ id: "row-2", young_person_name: "YP B", award_scheme: "ASDAN", hours_completed: 5 }),
        makeRow({ id: "row-3", young_person_name: "YP A", award_scheme: "Duke of Edinburgh (Bronze)", hours_completed: 8, milestone_achieved: true, celebrated_achievement: true }),
      ];
      const metrics = computeMetrics(rows);
      expect(metrics.total_records).toBe(3);
      expect(metrics.unique_young_people).toBe(2);
      expect(metrics.by_award_scheme["Duke of Edinburgh (Bronze)"]).toBe(2);
      expect(metrics.by_award_scheme["ASDAN"]).toBe(1);
      expect(metrics.milestones_achieved).toBe(1);
      expect(metrics.total_hours_completed).toBe(23);
      expect(metrics.dofe_participants).toBe(1);
    });

    it("returns zeros for empty array", () => {
      const metrics = computeMetrics([]);
      expect(metrics.total_records).toBe(0);
      expect(metrics.unique_young_people).toBe(0);
      expect(metrics.engagement_rate).toBeNull();;
      expect(metrics.total_hours_completed).toBe(0);
    });
  });

  describe("computeAlerts", () => {
    it("returns alerts for milestone not celebrated", () => {
      const rows = [makeRow({ milestone_achieved: true, celebrated_achievement: false })];
      const alerts = computeAlerts(rows);
      const found = alerts.find((a) => a.type === "milestone_not_celebrated");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("returns alerts for certificate outstanding", () => {
      const rows = [makeRow({ completion_date: "2025-03-01", certificate_received: false })];
      const alerts = computeAlerts(rows);
      const found = alerts.find((a) => a.type === "certificate_outstanding");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("returns alerts when not linked to pathway plan", () => {
      const rows = [makeRow({ linked_to_pathway_plan: false })];
      const alerts = computeAlerts(rows);
      const found = alerts.find((a) => a.type === "not_linked_to_pathway_plan");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("returns no alerts for fully compliant record", () => {
      const rows = [makeRow({ milestone_achieved: false, linked_to_pathway_plan: true, evidence_recorded: true, young_person_engaged: true })];
      const alerts = computeAlerts(rows);
      expect(alerts.length).toBe(0);
    });
  });
});
