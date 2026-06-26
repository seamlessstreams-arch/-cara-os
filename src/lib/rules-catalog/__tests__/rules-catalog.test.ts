import { describe, it, expect } from "vitest";
import {
  buildRuleCatalog,
  summariseRuleCatalog,
  categoriseCaraCommand,
} from "../rules-catalog";

describe("buildRuleCatalog", () => {
  const catalog = buildRuleCatalog();

  it("includes entries from all three rule systems", () => {
    const sources = new Set(catalog.map((e) => e.source));
    expect(sources).toContain("automation");
    expect(sources).toContain("compliance");
    expect(sources).toContain("cara_rules");
  });

  it("ids are source-qualified and unique across the catalog", () => {
    for (const e of catalog) {
      expect(e.id).toMatch(/^(automation|compliance|cara):/);
    }
    const ids = catalog.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks only automation rules as config-editable", () => {
    expect(catalog.filter((e) => e.source === "automation").every((e) => e.editable)).toBe(true);
    expect(catalog.filter((e) => e.source !== "automation").some((e) => e.editable)).toBe(false);
  });

  it("gives every compliance rule a statutory basis (7 regulatory rules)", () => {
    const compliance = catalog.filter((e) => e.source === "compliance");
    expect(compliance).toHaveLength(7);
    expect(compliance.every((e) => (e.statutoryBasis ?? "").length > 0)).toBe(true);
    expect(compliance.every((e) => e.category === "regulatory_compliance")).toBe(true);
  });

  it("carries the cara rules-engine command handlers (the rules-first ladder)", () => {
    const cara = catalog.filter((e) => e.source === "cara_rules");
    expect(cara.length).toBeGreaterThanOrEqual(50);
    expect(cara.some((e) => e.id === "cara:improve_writing")).toBe(true);
  });
});

describe("categoriseCaraCommand", () => {
  it("buckets commands by their id prefix", () => {
    expect(categoriseCaraCommand("draft_handover")).toBe("drafting");
    expect(categoriseCaraCommand("check_incident_chronology")).toBe("quality_check");
    expect(categoriseCaraCommand("extract_actions")).toBe("analysis");
    expect(categoriseCaraCommand("identify_document_risks")).toBe("analysis");
    expect(categoriseCaraCommand("improve_writing")).toBe("rewriting");
    expect(categoriseCaraCommand("suggest_due_date")).toBe("task_automation");
  });
});

describe("summariseRuleCatalog", () => {
  it("counts by source, by category, and editable", () => {
    const catalog = buildRuleCatalog();
    const s = summariseRuleCatalog(catalog);
    expect(s.total).toBe(catalog.length);
    expect(s.by_source.automation + s.by_source.compliance + s.by_source.cara_rules).toBe(catalog.length);
    expect(s.by_source.compliance).toBe(7);
    expect(s.editable_count).toBe(s.by_source.automation);
    expect(s.by_category[0].count).toBeGreaterThanOrEqual(s.by_category[s.by_category.length - 1].count);
  });
});
