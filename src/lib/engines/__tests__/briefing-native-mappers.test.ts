import { describe, it, expect } from "vitest";
import {
  mapInspectionToSignal,
  mapOutcomeHomeToSignal,
  mapRelationshipHomeToSignal,
  mapSopRealityCheckToSignal,
} from "../briefing-native-mappers";

describe("briefing native mappers", () => {
  describe("mapInspectionToSignal", () => {
    it("returns null for empty data", () => {
      expect(mapInspectionToSignal(null)).toBeNull();
      expect(mapInspectionToSignal(undefined)).toBeNull();
    });

    it("maps a limited area to an 'inadequate' rating (→ critical in the briefing)", () => {
      const s = mapInspectionToSignal({ areasLimited: 1, areasDeveloping: 0, headline: "x", priorities: [] })!;
      expect(s.rating).toBe("inadequate");
      expect(s.domain).toBe("leadership");
      expect(s.engine_key).toBe("inspection-intelligence");
    });

    it("maps developing-only to 'requires_improvement', none to 'good'", () => {
      expect(mapInspectionToSignal({ areasLimited: 0, areasDeveloping: 2, priorities: [] })!.rating).toBe("requires_improvement");
      expect(mapInspectionToSignal({ areasLimited: 0, areasDeveloping: 0, priorities: [] })!.rating).toBe("good");
    });

    it("turns each priority into a high-severity insight with label + detail", () => {
      const s = mapInspectionToSignal({
        areasLimited: 0,
        areasDeveloping: 1,
        headline: "h",
        priorities: [{ label: "6 overdue supervisions", detail: "A date has passed" }],
      })!;
      expect(s.insights).toHaveLength(1);
      expect(s.insights[0]).toEqual({ text: "6 overdue supervisions — A date has passed", severity: "high" });
    });
  });

  describe("mapOutcomeHomeToSignal", () => {
    it("returns null for empty data", () => {
      expect(mapOutcomeHomeToSignal(null)).toBeNull();
    });

    it("rates requires_improvement when any child needs focus, else good", () => {
      expect(mapOutcomeHomeToSignal({ childrenNeedingFocus: 1, children: [] })!.rating).toBe("requires_improvement");
      expect(mapOutcomeHomeToSignal({ childrenNeedingFocus: 0, children: [] })!.rating).toBe("good");
    });

    it("emits one high insight per needs_focus child, skipping the rest", () => {
      const s = mapOutcomeHomeToSignal({
        childrenNeedingFocus: 1,
        children: [
          { childName: "Alex", overallStatus: "needs_focus", topConcern: "Safety declining" },
          { childName: "Casey", overallStatus: "on_track" },
        ],
      })!;
      expect(s.insights).toHaveLength(1);
      expect(s.insights[0].severity).toBe("high");
      expect(s.insights[0].text).toContain("Alex");
      expect(s.insights[0].text).toContain("Safety declining");
    });
  });

  describe("mapRelationshipHomeToSignal", () => {
    it("returns null for empty data", () => {
      expect(mapRelationshipHomeToSignal(undefined)).toBeNull();
    });

    it("flags fragile relationships as high and ES concern as warning", () => {
      const s = mapRelationshipHomeToSignal({
        children: [
          { childName: "Alex", relStatus: "fragile", esStatus: "secure", topGap: "No trusted adult" },
          { childName: "Bea", relStatus: "secure", esStatus: "concern" },
          { childName: "Cy", relStatus: "secure", esStatus: "secure" },
        ],
      })!;
      expect(s.insights).toHaveLength(2);
      const alex = s.insights.find((i) => i.text.includes("Alex"))!;
      const bea = s.insights.find((i) => i.text.includes("Bea"))!;
      expect(alex.severity).toBe("high");
      expect(bea.severity).toBe("warning");
      expect(s.rating).toBe("requires_improvement");
    });

    it("rates good when no child needs support", () => {
      const s = mapRelationshipHomeToSignal({
        children: [{ childName: "Cy", relStatus: "secure", esStatus: "secure" }],
      })!;
      expect(s.rating).toBe("good");
      expect(s.insights).toHaveLength(0);
    });
  });

  describe("mapSopRealityCheckToSignal", () => {
    it("returns null for empty data", () => {
      expect(mapSopRealityCheckToSignal(null)).toBeNull();
      expect(mapSopRealityCheckToSignal(undefined)).toBeNull();
    });

    it("rates inadequate/limited, requires_improvement/developing, else good", () => {
      expect(mapSopRealityCheckToSignal({ areasLimited: 1, areasDeveloping: 0, inspectionRisks: [] })!.rating).toBe("inadequate");
      expect(mapSopRealityCheckToSignal({ areasLimited: 0, areasDeveloping: 2, inspectionRisks: [] })!.rating).toBe("requires_improvement");
      expect(mapSopRealityCheckToSignal({ areasLimited: 0, areasDeveloping: 0, inspectionRisks: [] })!.rating).toBe("good");
    });

    it("turns each inspection risk into a high-severity SoP insight (leadership domain)", () => {
      const s = mapSopRealityCheckToSignal({
        areasLimited: 1,
        areasDeveloping: 0,
        headline: "3 of 7 SOP areas strongly evidenced",
        inspectionRisks: [{ area: "safeguarding", label: "Safeguarding", detail: "No recent oversight evidence" }],
      })!;
      expect(s.engine_key).toBe("sop-reality-check");
      expect(s.domain).toBe("leadership");
      expect(s.insights).toEqual([
        { text: "SoP — Safeguarding: No recent oversight evidence", severity: "high" },
      ]);
    });
  });
});
