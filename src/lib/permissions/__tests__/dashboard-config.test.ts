// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — Dashboard Configuration Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getDashboardConfig,
  hasFeature,
  getNavSections,
  getAllWidgets,
  DASHBOARD_CONFIG,
} from "../dashboard-config";
import type { Role } from "../types";

describe("getDashboardConfig", () => {
  it("returns RSW config", () => {
    const config = getDashboardConfig("rsw");
    expect(config.dashboardTitle).toBe("My Shift");
    expect(config.primaryWidgets).toContain("my_tasks");
    expect(config.primaryWidgets).toContain("shift_checklist");
  });

  it("returns team_leader config", () => {
    const config = getDashboardConfig("team_leader");
    expect(config.dashboardTitle).toBe("Team Overview");
    expect(config.primaryWidgets).toContain("approval_queue");
    expect(config.primaryWidgets).toContain("team_tasks");
  });

  it("returns deputy_manager config", () => {
    const config = getDashboardConfig("deputy_manager");
    expect(config.dashboardTitle).toBe("Home Management");
    expect(config.primaryWidgets).toContain("lifecycle_compliance");
    expect(config.primaryWidgets).toContain("qa_metrics");
  });

  it("returns registered_manager config", () => {
    const config = getDashboardConfig("registered_manager");
    expect(config.dashboardTitle).toBe("Home Control Centre");
    expect(config.primaryWidgets).toContain("governance_score");
    expect(config.primaryWidgets).toContain("aria_regulatory_pulse");
  });

  it("returns responsible_individual config", () => {
    const config = getDashboardConfig("responsible_individual");
    expect(config.dashboardTitle).toBe("Provider Oversight");
    expect(config.primaryWidgets).toContain("cross_home_overview");
    expect(config.primaryWidgets).toContain("ri_alerts");
  });

  it("returns waking_night config", () => {
    const config = getDashboardConfig("waking_night");
    expect(config.dashboardTitle).toBe("Night Shift");
    expect(config.primaryWidgets).toContain("night_summary");
  });

  it("returns agency_staff config", () => {
    const config = getDashboardConfig("agency_staff");
    expect(config.dashboardTitle).toBe("My Shift");
    expect(config.primaryWidgets).toHaveLength(3); // minimal
  });

  it("defaults to RSW for unknown roles", () => {
    const config = getDashboardConfig("unknown_role" as Role);
    expect(config.dashboardTitle).toBe("My Shift");
  });
});

describe("hasFeature", () => {
  describe("Control Centre access", () => {
    it("RSW cannot access Control Centre", () => {
      expect(hasFeature("rsw", "canViewControlCentre")).toBe(false);
    });

    it("team_leader cannot access Control Centre", () => {
      expect(hasFeature("team_leader", "canViewControlCentre")).toBe(false);
    });

    it("deputy_manager cannot access Control Centre", () => {
      expect(hasFeature("deputy_manager", "canViewControlCentre")).toBe(false);
    });

    it("registered_manager CAN access Control Centre", () => {
      expect(hasFeature("registered_manager", "canViewControlCentre")).toBe(true);
    });

    it("operations_manager CAN access Control Centre", () => {
      expect(hasFeature("operations_manager", "canViewControlCentre")).toBe(true);
    });

    it("responsible_individual CAN access Control Centre", () => {
      expect(hasFeature("responsible_individual", "canViewControlCentre")).toBe(true);
    });
  });

  describe("Approval Queue access", () => {
    it("RSW cannot see Approval Queue", () => {
      expect(hasFeature("rsw", "canViewApprovalQueue")).toBe(false);
    });

    it("team_leader CAN see Approval Queue", () => {
      expect(hasFeature("team_leader", "canViewApprovalQueue")).toBe(true);
    });

    it("deputy_manager CAN see Approval Queue", () => {
      expect(hasFeature("deputy_manager", "canViewApprovalQueue")).toBe(true);
    });
  });

  describe("Audit Log access", () => {
    it("RSW cannot view Audit Log", () => {
      expect(hasFeature("rsw", "canViewAuditLog")).toBe(false);
    });

    it("team_leader cannot view Audit Log", () => {
      expect(hasFeature("team_leader", "canViewAuditLog")).toBe(false);
    });

    it("deputy_manager CAN view Audit Log", () => {
      expect(hasFeature("deputy_manager", "canViewAuditLog")).toBe(true);
    });
  });

  describe("QA Metrics", () => {
    it("RSW cannot view QA Metrics", () => {
      expect(hasFeature("rsw", "canViewQAMetrics")).toBe(false);
    });

    it("deputy_manager CAN view QA Metrics", () => {
      expect(hasFeature("deputy_manager", "canViewQAMetrics")).toBe(true);
    });
  });

  describe("Cross-home access", () => {
    it("registered_manager cannot view cross-home", () => {
      expect(hasFeature("registered_manager", "canViewCrossHome")).toBe(false);
    });

    it("operations_manager CAN view cross-home", () => {
      expect(hasFeature("operations_manager", "canViewCrossHome")).toBe(true);
    });

    it("responsible_individual CAN view cross-home", () => {
      expect(hasFeature("responsible_individual", "canViewCrossHome")).toBe(true);
    });
  });

  describe("Data export", () => {
    it("RSW cannot export data", () => {
      expect(hasFeature("rsw", "canExportData")).toBe(false);
    });

    it("agency_staff cannot export data", () => {
      expect(hasFeature("agency_staff", "canExportData")).toBe(false);
    });

    it("deputy_manager CAN export data", () => {
      expect(hasFeature("deputy_manager", "canExportData")).toBe(true);
    });
  });
});

describe("getNavSections", () => {
  it("RSW sees minimal nav", () => {
    const nav = getNavSections("rsw");
    expect(nav).toContain("dashboard");
    expect(nav).toContain("my_work");
    expect(nav).toContain("children");
    expect(nav).not.toContain("staff");
    expect(nav).not.toContain("control_centre");
    expect(nav).not.toContain("audit");
  });

  it("team_leader sees quality section", () => {
    const nav = getNavSections("team_leader");
    expect(nav).toContain("quality");
    expect(nav).toContain("staff");
    expect(nav).not.toContain("control_centre");
  });

  it("registered_manager sees everything", () => {
    const nav = getNavSections("registered_manager");
    expect(nav).toContain("control_centre");
    expect(nav).toContain("filing_cabinet");
    expect(nav).toContain("audit");
    expect(nav).toContain("hr");
    expect(nav).toContain("recruitment");
  });

  it("agency_staff sees absolute minimum", () => {
    const nav = getNavSections("agency_staff");
    expect(nav).toHaveLength(2);
    expect(nav).toContain("dashboard");
    expect(nav).toContain("my_work");
  });
});

describe("getAllWidgets", () => {
  it("combines primary and secondary widgets", () => {
    const widgets = getAllWidgets("team_leader");
    const config = getDashboardConfig("team_leader");
    expect(widgets.length).toBe(
      config.primaryWidgets.length + config.secondaryWidgets.length,
    );
  });

  it("RSW has no management widgets", () => {
    const widgets = getAllWidgets("rsw");
    expect(widgets).not.toContain("approval_queue");
    expect(widgets).not.toContain("lifecycle_compliance");
    expect(widgets).not.toContain("qa_metrics");
    expect(widgets).not.toContain("governance_score");
  });

  it("registered_manager has governance and compliance", () => {
    const widgets = getAllWidgets("registered_manager");
    expect(widgets).toContain("approval_queue");
    expect(widgets).toContain("lifecycle_compliance");
    expect(widgets).toContain("qa_metrics");
    expect(widgets).toContain("governance_score");
  });
});

describe("DASHBOARD_CONFIG completeness", () => {
  const requiredRoles: Role[] = [
    "rsw",
    "senior_rsw",
    "team_leader",
    "deputy_manager",
    "registered_manager",
    "operations_manager",
    "responsible_individual",
    "waking_night",
    "agency_staff",
  ];

  for (const role of requiredRoles) {
    it(`has config for ${role}`, () => {
      expect(DASHBOARD_CONFIG[role]).toBeDefined();
      expect(DASHBOARD_CONFIG[role].primaryWidgets.length).toBeGreaterThan(0);
      expect(DASHBOARD_CONFIG[role].navSections.length).toBeGreaterThan(0);
    });
  }
});
