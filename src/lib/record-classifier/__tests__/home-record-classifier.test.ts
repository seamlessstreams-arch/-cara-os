import { describe, it, expect } from "vitest";
import { classifyHomeRecord } from "../home-record-classifier";

describe("Home Record Classifier", () => {
  describe("fire safety", () => {
    it("detects a fire drill", () => {
      const r = classifyHomeRecord("Completed the monthly fire drill. All residents evacuated within 3 minutes.", "Chamberlain House");
      expect(r.primary_type).toBe("fire_drill");
      expect(r.tags).toContain("fire-safety");
    });
    it("flags a fire hazard for immediate action", () => {
      const r = classifyHomeRecord("Fire door faulty on the first floor landing and the fire exit blocked by boxes.", "Chamberlain House");
      expect(r.requires_immediate_action).toBe(true);
      expect(r.flags.some((f) => f.type === "fire" && f.urgency === "immediate")).toBe(true);
    });
  });

  describe("health & safety", () => {
    it("detects an H&S check", () => {
      const r = classifyHomeRecord("Carried out the weekly health and safety check. Legionella water temperatures recorded.", "Chamberlain House");
      expect(r.primary_type).toBe("health_safety_check");
      expect(r.tags).toContain("legionella");
    });
    it("flags a serious safety hazard", () => {
      const r = classifyHomeRecord("Possible gas leak detected in the kitchen during the health and safety check.", "Chamberlain House");
      expect(r.flags.some((f) => f.type === "safety" && f.urgency === "immediate")).toBe(true);
    });
  });

  describe("maintenance", () => {
    it("detects a repair need", () => {
      const r = classifyHomeRecord("The washing machine is broken and not working. Needs repairing urgently.", "Chamberlain House");
      expect(r.primary_type).toBe("maintenance_request");
      expect(r.flags.some((f) => f.type === "maintenance")).toBe(true);
    });
    it("detects damp and mould", () => {
      const r = classifyHomeRecord("Damp and mould appearing in the downstairs bathroom ceiling.", "Chamberlain House");
      expect(r.primary_type).toBe("maintenance_request");
      expect(r.tags).toContain("damp-mould");
    });
  });

  describe("vehicle", () => {
    it("detects a vehicle check", () => {
      const r = classifyHomeRecord("Completed the minibus vehicle check. MOT due next month, tyres fine.", "Chamberlain House");
      expect(r.primary_type).toBe("vehicle_check");
      expect(r.tags).toContain("vehicle");
    });
  });

  describe("audit", () => {
    it("detects a home audit", () => {
      const r = classifyHomeRecord("Manager's monthly walk-round audit of the premises completed.", "Chamberlain House");
      expect(r.primary_type).toBe("home_audit");
      expect(r.tags).toContain("compliance");
    });
    it("detects reg 44 visit", () => {
      const r = classifyHomeRecord("Regulation 44 visit carried out by the independent visitor.", "Chamberlain House");
      expect(r.primary_type).toBe("home_audit");
    });
  });

  describe("default + confidence", () => {
    it("defaults to a home note for general text", () => {
      const r = classifyHomeRecord("Held a house meeting with the young people about weekend activities.", "Chamberlain House");
      expect(r.primary_type).toBe("observation");
    });
    it("short text has low confidence", () => {
      const r = classifyHomeRecord("All fine today.", "Chamberlain House");
      expect(r.confidence).toBe("low");
    });
  });

  describe("flags & titles", () => {
    it("flags expiring compliance", () => {
      const r = classifyHomeRecord("Gas safety certificate is expiring and overdue for renewal.", "Chamberlain House");
      expect(r.flags.some((f) => f.type === "compliance")).toBe(true);
    });
    it("flags a passed check as positive", () => {
      const r = classifyHomeRecord("Fire alarm test completed and all systems compliant and satisfactory.", "Chamberlain House");
      expect(r.tags).toContain("positive");
    });
    it("generates a home-specific title", () => {
      const r = classifyHomeRecord("Fire drill completed today", "Willow Lodge");
      expect(r.suggested_title).toContain("Willow Lodge");
    });
    it("flows to home record and compliance", () => {
      const r = classifyHomeRecord("Health and safety check completed", "Chamberlain House");
      expect(r.flows_to).toContain("home_record");
    });
  });
});
