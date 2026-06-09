import { describe, it, expect } from "vitest";
import {
  getLatestSnapshots,
  getOrganisationOverview,
  getComparisonMatrix,
  getAlerts,
  generateSnapshot,
} from "../cross-home-intelligence-service";

describe("cross-home-intelligence-service", () => {
  describe("getOrganisationOverview", () => {
    it("returns ok:true with demo data when Supabase disabled", async () => {
      const result = await getOrganisationOverview("org-demo-1");
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("overview data has expected fields", async () => {
      const result = await getOrganisationOverview("org-demo-1");
      const data = result.data!;
      expect(data).toHaveProperty("total_homes");
      expect(data).toHaveProperty("total_children");
      expect(data).toHaveProperty("total_incidents_7d");
      expect(data).toHaveProperty("total_incidents_30d");
      expect(data).toHaveProperty("safeguarding_concerns_open");
      expect(data).toHaveProperty("overall_compliance_pct");
      expect(data).toHaveProperty("homes_at_risk");
      expect(data).toHaveProperty("homes_compliant");
      expect(data).toHaveProperty("avg_ofsted_readiness");
      expect(data).toHaveProperty("key_work_overdue_total");
    });

    it("overview aggregates correctly across demo homes", async () => {
      const result = await getOrganisationOverview("org-demo-1");
      const data = result.data!;
      expect(data.total_homes).toBe(3);
      expect(data.total_children).toBe(9); // 3 + 4 + 2
      expect(data.homes_at_risk).toBe(1); // Willow Lodge is high
    });
  });

  describe("getLatestSnapshots", () => {
    it("returns array of snapshots", async () => {
      const result = await getLatestSnapshots("org-demo-1");
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBe(3);
    });

    it("each snapshot has home_id, home_name, total_children fields", async () => {
      const result = await getLatestSnapshots("org-demo-1");
      for (const snap of result.data!) {
        expect(snap).toHaveProperty("home_id");
        expect(snap).toHaveProperty("home_name");
        expect(snap).toHaveProperty("total_children");
      }
    });

    it("demo data includes Chamberlain House, Willow Lodge, Birch Cottage", async () => {
      const result = await getLatestSnapshots("org-demo-1");
      const names = result.data!.map((s) => s.home_name);
      expect(names).toContain("Chamberlain House");
      expect(names).toContain("Willow Lodge");
      expect(names).toContain("Birch Cottage");
    });

    it("snapshots have expected compliance and risk fields", async () => {
      const result = await getLatestSnapshots("org-demo-1");
      for (const snap of result.data!) {
        expect(snap).toHaveProperty("recording_compliance_pct");
        expect(snap).toHaveProperty("risk_level_overall");
        expect(snap).toHaveProperty("ofsted_readiness_score");
      }
    });
  });

  describe("getComparisonMatrix", () => {
    it("returns matrix with homes and metrics", async () => {
      const result = await getComparisonMatrix("org-demo-1");
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it("each row has metric name and values array", async () => {
      const result = await getComparisonMatrix("org-demo-1");
      for (const row of result.data!) {
        expect(row).toHaveProperty("metric");
        expect(row).toHaveProperty("values");
        expect(Array.isArray(row.values)).toBe(true);
      }
    });

    it("comparison matrix has status colours (green/amber/red)", async () => {
      const result = await getComparisonMatrix("org-demo-1");
      const allStatuses = result.data!.flatMap((row) => row.values.map((v) => v.status));
      const validStatuses = ["green", "amber", "red"];
      for (const status of allStatuses) {
        expect(validStatuses).toContain(status);
      }
    });

    it("each value in matrix has home_id and home_name", async () => {
      const result = await getComparisonMatrix("org-demo-1");
      for (const row of result.data!) {
        for (const val of row.values) {
          expect(val).toHaveProperty("home_id");
          expect(val).toHaveProperty("home_name");
          expect(val).toHaveProperty("value");
        }
      }
    });
  });

  describe("getAlerts", () => {
    it("returns alerts array", async () => {
      const result = await getAlerts("org-demo-1");
      expect(result.ok).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("alert items have severity, message, home_id fields", async () => {
      const result = await getAlerts("org-demo-1");
      expect(result.data!.length).toBeGreaterThan(0);
      for (const alert of result.data!) {
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("home_id");
      }
    });

    it("alerts include critical severity from Willow Lodge", async () => {
      const result = await getAlerts("org-demo-1");
      const criticals = result.data!.filter((a) => a.severity === "critical");
      expect(criticals.length).toBeGreaterThan(0);
      expect(criticals.some((a) => a.home_id === "home-willow")).toBe(true);
    });

    it("alerts are sorted by severity (critical first)", async () => {
      const result = await getAlerts("org-demo-1");
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      for (let i = 1; i < result.data!.length; i++) {
        expect(severityOrder[result.data![i].severity]).toBeGreaterThanOrEqual(
          severityOrder[result.data![i - 1].severity],
        );
      }
    });
  });

  describe("generateSnapshot", () => {
    it("returns ok:true in demo mode", async () => {
      const result = await generateSnapshot("org-demo-1");
      expect(result.ok).toBe(true);
    });

    it("reports number of snapshots generated", async () => {
      const result = await generateSnapshot("org-demo-1");
      expect(result.data).toHaveProperty("generated");
      expect(result.data!.generated).toBe(3);
    });

    it("generates 1 when homeId is specified", async () => {
      const result = await generateSnapshot("org-demo-1", "home-oak");
      expect(result.data!.generated).toBe(1);
    });
  });
});
