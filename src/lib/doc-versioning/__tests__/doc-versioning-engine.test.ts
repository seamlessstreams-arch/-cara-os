import { describe, it, expect } from "vitest";
import {
  nextVersionLabel,
  planNewVersion,
  currentOf,
  getHistory,
  type DocVersionRecord,
} from "../doc-versioning-engine";

const NOW = "2026-07-13T12:00:00.000Z";

const row = (over: Partial<DocVersionRecord> & { id: string }): DocVersionRecord => ({
  doc_type: "home_policy",
  doc_id: "pol_1",
  version_label: "1.0",
  content_snapshot: null,
  change_summary: "Initial",
  changed_by: "staff_darren",
  changed_at: "2026-07-01T09:00:00.000Z",
  previous_version_id: null,
  is_current: true,
  ...over,
});

describe("nextVersionLabel — total + deterministic", () => {
  it("derives across the common shapes", () => {
    expect(nextVersionLabel(null)).toBe("1.0");
    expect(nextVersionLabel("")).toBe("1.0");
    expect(nextVersionLabel("3.1")).toBe("3.2");
    expect(nextVersionLabel("v3")).toBe("v4");
    expect(nextVersionLabel("7")).toBe("8");
    expect(nextVersionLabel("2026-A1")).toBe("2026-A2");
    expect(nextVersionLabel("March-final")).toBe("March-final.1");
  });
});

describe("planNewVersion — append-only supersession", () => {
  it("first version: 1.0, no previous, nothing superseded", () => {
    const p = planNewVersion([], {
      doc_type: "home_policy",
      doc_id: "pol_1",
      change_summary: "Initial adoption",
      changed_by: "staff_darren",
      nowIso: NOW,
    });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.record).toMatchObject({
      version_label: "1.0",
      previous_version_id: null,
      is_current: true,
      changed_at: NOW,
    });
    expect(p.supersede_ids).toEqual([]);
  });

  it("second version chains to the current one and supersedes exactly it", () => {
    const v1 = row({ id: "dv1", version_label: "3.1" });
    const p = planNewVersion([v1], {
      doc_type: "home_policy",
      doc_id: "pol_1",
      change_summary: "Annual review changes",
      changed_by: "staff_darren",
      nowIso: NOW,
    });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.record.version_label).toBe("3.2"); // derived from current
    expect(p.record.previous_version_id).toBe("dv1");
    expect(p.supersede_ids).toEqual(["dv1"]);
  });

  it("an explicit version_label wins over derivation", () => {
    const p = planNewVersion([row({ id: "dv1", version_label: "3.1" })], {
      doc_type: "home_policy",
      doc_id: "pol_1",
      version_label: "4.0",
      change_summary: "Major rewrite",
      changed_by: "staff_darren",
      nowIso: NOW,
    });
    expect(p.ok && p.record.version_label).toBe("4.0");
  });

  it("refuses a duplicate label against the current version, named", () => {
    const p = planNewVersion([row({ id: "dv1", version_label: "3.1" })], {
      doc_type: "home_policy",
      doc_id: "pol_1",
      version_label: "3.1",
      change_summary: "x",
      changed_by: "staff_darren",
      nowIso: NOW,
    });
    expect(p.ok).toBe(false);
    if (p.ok) return;
    expect(p.errors.join(" ")).toMatch(/already the current version/);
  });

  it("names every missing required field", () => {
    const p = planNewVersion([], { doc_type: "", doc_id: "", change_summary: " ", changed_by: "", nowIso: NOW });
    expect(p.ok).toBe(false);
    if (p.ok) return;
    expect(p.errors).toHaveLength(4);
  });

  it("cross-document isolation: another doc's current version is not superseded", () => {
    const other = row({ id: "dvX", doc_id: "pol_OTHER", version_label: "9.9" });
    const p = planNewVersion([other], {
      doc_type: "home_policy",
      doc_id: "pol_1",
      change_summary: "Initial",
      changed_by: "staff_darren",
      nowIso: NOW,
    });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.supersede_ids).toEqual([]); // pol_OTHER untouched
    expect(p.record.version_label).toBe("1.0");
  });
});

describe("currentOf / getHistory", () => {
  const v1 = row({ id: "dv1", version_label: "1.0", is_current: false, changed_at: "2026-06-01T09:00:00.000Z" });
  const v2 = row({ id: "dv2", version_label: "1.1", is_current: true, changed_at: "2026-07-01T09:00:00.000Z", previous_version_id: "dv1" });
  const noise = row({ id: "dvX", doc_id: "pol_OTHER", version_label: "2.0" });

  it("currentOf returns the flagged row only (never guesses from order)", () => {
    expect(currentOf([v1, v2, noise], "home_policy", "pol_1")?.id).toBe("dv2");
    expect(currentOf([v1, { ...v2, is_current: false }], "home_policy", "pol_1")).toBeNull();
  });

  it("getHistory is newest-first and doc-scoped", () => {
    expect(getHistory([v1, noise, v2], "home_policy", "pol_1").map((v) => v.id)).toEqual(["dv2", "dv1"]);
  });
});
