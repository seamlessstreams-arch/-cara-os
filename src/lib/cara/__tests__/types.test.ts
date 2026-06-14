import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — TYPE SYSTEM INTEGRITY TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  REPORT_AUDIENCES,
  REPORT_AUDIENCE_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  RISK_TIERS,
  RISK_TIER_LABELS,
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_LABELS,
  AGENT_IDS,
  AGENT_ID_LABELS,
} from "@/types/cara-reports";

describe("REPORT_TYPES", () => {
  it("contains exactly 9 report types", () => {
    expect(REPORT_TYPES).toHaveLength(9);
  });

  it("every type has a label", () => {
    for (const type of REPORT_TYPES) {
      expect(
        REPORT_TYPE_LABELS[type],
        `Missing label for report type: ${type}`,
      ).toBeDefined();
      expect(REPORT_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it("includes the key report types", () => {
    expect(REPORT_TYPES).toContain("weekly_child_report");
    expect(REPORT_TYPES).toContain("social_worker_update");
    expect(REPORT_TYPES).toContain("end_of_placement_transition_report");
    expect(REPORT_TYPES).toContain("risk_review_report");
  });
});

describe("REPORT_AUDIENCES", () => {
  it("contains exactly 7 audiences", () => {
    expect(REPORT_AUDIENCES).toHaveLength(7);
  });

  it("every audience has a label", () => {
    for (const audience of REPORT_AUDIENCES) {
      expect(
        REPORT_AUDIENCE_LABELS[audience],
        `Missing label for audience: ${audience}`,
      ).toBeDefined();
    }
  });

  it("includes child_friendly audience", () => {
    expect(REPORT_AUDIENCES).toContain("child_friendly");
  });
});

describe("REPORT_STATUSES", () => {
  it("contains exactly 6 statuses", () => {
    expect(REPORT_STATUSES).toHaveLength(6);
  });

  it("every status has a label", () => {
    for (const status of REPORT_STATUSES) {
      expect(
        REPORT_STATUS_LABELS[status],
        `Missing label for status: ${status}`,
      ).toBeDefined();
    }
  });

  it("covers the full workflow lifecycle", () => {
    expect(REPORT_STATUSES).toContain("draft");
    expect(REPORT_STATUSES).toContain("pending_review");
    expect(REPORT_STATUSES).toContain("approved");
    expect(REPORT_STATUSES).toContain("rejected");
    expect(REPORT_STATUSES).toContain("locked");
    expect(REPORT_STATUSES).toContain("archived");
  });
});

describe("RISK_TIERS", () => {
  it("contains exactly 3 risk tiers", () => {
    expect(RISK_TIERS).toHaveLength(3);
  });

  it("every tier has a label", () => {
    for (const tier of RISK_TIERS) {
      expect(RISK_TIER_LABELS[tier]).toBeDefined();
    }
  });
});

describe("EVIDENCE_STATUSES", () => {
  it("contains exactly 4 statuses", () => {
    expect(EVIDENCE_STATUSES).toHaveLength(4);
  });

  it("every status has a label", () => {
    for (const status of EVIDENCE_STATUSES) {
      expect(EVIDENCE_STATUS_LABELS[status]).toBeDefined();
    }
  });
});

describe("AGENT_IDS", () => {
  it("contains exactly 8 agent IDs", () => {
    expect(AGENT_IDS).toHaveLength(8);
  });

  it("every ID has a label", () => {
    for (const id of AGENT_IDS) {
      expect(
        AGENT_ID_LABELS[id],
        `Missing label for agent: ${id}`,
      ).toBeDefined();
    }
  });

  it("includes the core agents", () => {
    expect(AGENT_IDS).toContain("oversight_agent");
    expect(AGENT_IDS).toContain("safeguarding_agent");
    expect(AGENT_IDS).toContain("report_generator_agent");
    expect(AGENT_IDS).toContain("filing_agent");
  });
});
