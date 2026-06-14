import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT TEMPLATES TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  getSectionsForReportType,
  getRequiredSections,
  getChildVoiceSections,
} from "../reports/report-templates";
import { REPORT_TYPES } from "@/types/cara-reports";

describe("getSectionsForReportType", () => {
  it("returns sections for all 9 report types", () => {
    for (const type of REPORT_TYPES) {
      const sections = getSectionsForReportType(type);
      expect(
        sections.length,
        `Report type "${type}" should have at least 1 section`,
      ).toBeGreaterThan(0);
    }
  });

  it("weekly_child_report has 15 sections", () => {
    const sections = getSectionsForReportType("weekly_child_report");
    expect(sections).toHaveLength(15);
  });

  it("sections are ordered sequentially", () => {
    for (const type of REPORT_TYPES) {
      const sections = getSectionsForReportType(type);
      for (let i = 1; i < sections.length; i++) {
        expect(
          sections[i].order,
          `Section "${sections[i].title}" order should be >= previous in ${type}`,
        ).toBeGreaterThanOrEqual(sections[i - 1].order);
      }
    }
  });

  it("every section has key, title, and order", () => {
    for (const type of REPORT_TYPES) {
      const sections = getSectionsForReportType(type);
      for (const section of sections) {
        expect(section.key).toBeDefined();
        expect(section.key.length).toBeGreaterThan(0);
        expect(section.title).toBeDefined();
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.order).toBeGreaterThan(0);
        expect(typeof section.required).toBe("boolean");
        expect(typeof section.needsChildVoice).toBe("boolean");
        expect(typeof section.needsEvidence).toBe("boolean");
      }
    }
  });

  it("section keys are unique within each report type", () => {
    for (const type of REPORT_TYPES) {
      const sections = getSectionsForReportType(type);
      const keys = sections.map((s) => s.key);
      const uniqueKeys = new Set(keys);
      expect(
        uniqueKeys.size,
        `Report type "${type}" has duplicate section keys`,
      ).toBe(keys.length);
    }
  });
});

describe("getRequiredSections", () => {
  it("returns only required sections", () => {
    const required = getRequiredSections("weekly_child_report");
    for (const section of required) {
      expect(section.required).toBe(true);
    }
  });

  it("every report type has at least 1 required section", () => {
    for (const type of REPORT_TYPES) {
      const required = getRequiredSections(type);
      expect(
        required.length,
        `Report type "${type}" should have required sections`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("getChildVoiceSections", () => {
  it("returns only sections needing child voice", () => {
    const voiceSections = getChildVoiceSections("weekly_child_report");
    for (const section of voiceSections) {
      expect(section.needsChildVoice).toBe(true);
    }
  });

  it("weekly_child_report has child voice sections", () => {
    const voiceSections = getChildVoiceSections("weekly_child_report");
    expect(voiceSections.length).toBeGreaterThan(0);
  });

  it("child voice sections include a childs_voice key", () => {
    const voiceSections = getChildVoiceSections("weekly_child_report");
    const hasChildVoiceKey = voiceSections.some((s) => s.key === "childs_voice");
    expect(hasChildVoiceKey).toBe(true);
  });
});
