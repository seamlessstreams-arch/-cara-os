// ══════════════════════════════════════════════════════════════════════════════
// Filing Cabinet Live Index — engine tests (Milestone 25)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  loadFilingCabinetIndex,
  filingCabinetCount,
} from "@/lib/care-events/filing-cabinet-index";
import type { FilingCategory } from "@/types/care-events";

const HOME_ID = "home_filing_test";

function clearAll() {
  const all = db.filingCabinet.findAll();
  for (const f of all.filter((x) => x.home_id === HOME_ID)) {
    const i = all.indexOf(f); if (i >= 0) all.splice(i, 1);
  }
}

let seq = 0;
function file(category: FilingCategory, opts: { verified?: boolean; filed_at?: string; care_event_id?: string; title?: string } = {}) {
  seq += 1;
  return db.filingCabinet.upsert({
    care_event_id: opts.care_event_id ?? `ce_${seq}`,
    home_id: HOME_ID,
    child_id: "yp_a",
    category,
    sub_category: null,
    title: opts.title ?? `t-${seq}`,
    description: null,
    source_type: "care_event",
    linked_record_id: null,
    linked_record_table: null,
    is_verified: opts.verified ?? false,
    verified_at: null,
    verified_by: null,
    tags: [],
    filed_at: opts.filed_at ?? new Date().toISOString(),
  });
}

beforeEach(() => clearAll());

describe("loadFilingCabinetIndex", () => {
  it("returns empty index when nothing filed", () => {
    const r = loadFilingCabinetIndex(HOME_ID);
    expect(r.total).toBe(0);
    expect(r.verified).toBe(0);
    expect(r.unverified).toBe(0);
    expect(r.unverified_pct).toBe(0);
    expect(r.categories).toEqual([]);
    expect(r.recent_filings).toEqual([]);
  });

  it("counts verified vs unverified across all items", () => {
    file("daily_care", { verified: true });
    file("daily_care", { verified: false });
    file("incident", { verified: false });
    const r = loadFilingCabinetIndex(HOME_ID);
    expect(r.total).toBe(3);
    expect(r.verified).toBe(1);
    expect(r.unverified).toBe(2);
    expect(r.unverified_pct).toBe(67); // 2/3 rounded
  });

  it("groups by category and sorts groups by total desc", () => {
    file("daily_care");
    file("daily_care");
    file("daily_care");
    file("incident");
    const r = loadFilingCabinetIndex(HOME_ID);
    expect(r.categories.length).toBe(2);
    expect(r.categories[0].category).toBe("daily_care");
    expect(r.categories[0].total).toBe(3);
    expect(r.categories[1].category).toBe("incident");
  });

  it("computes per-group verified/unverified counts", () => {
    file("safeguarding", { verified: true });
    file("safeguarding", { verified: false });
    const r = loadFilingCabinetIndex(HOME_ID);
    const g = r.categories.find((c) => c.category === "safeguarding")!;
    expect(g.verified).toBe(1);
    expect(g.unverified).toBe(1);
  });

  it("returns recent_items per category, newest first, capped at 5", () => {
    for (let i = 0; i < 7; i += 1) {
      file("health", { filed_at: `2026-05-${String(i + 1).padStart(2, "0")}T00:00:00Z`, title: `h-${i}` });
    }
    const r = loadFilingCabinetIndex(HOME_ID);
    const g = r.categories.find((c) => c.category === "health")!;
    expect(g.total).toBe(7);
    expect(g.recent_items.length).toBe(5);
    expect(g.recent_items[0].title).toBe("h-6"); // most recent
    expect(g.most_recent_filed_at).toBe("2026-05-07T00:00:00Z");
  });

  it("returns global recent_filings newest first, capped at 20", () => {
    for (let i = 0; i < 25; i += 1) {
      file("daily_care", { filed_at: `2026-05-${String((i % 28) + 1).padStart(2, "0")}T00:00:0${i % 10}Z` });
    }
    const r = loadFilingCabinetIndex(HOME_ID);
    expect(r.recent_filings.length).toBe(20);
    for (let i = 1; i < r.recent_filings.length; i += 1) {
      expect(
        r.recent_filings[i - 1].filed_at.localeCompare(r.recent_filings[i].filed_at),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("excludes other homes", () => {
    file("daily_care");
    db.filingCabinet.upsert({
      care_event_id: "ce_other",
      home_id: "other_home",
      child_id: null,
      category: "daily_care",
      sub_category: null,
      title: "other",
      description: null,
      source_type: "care_event",
      linked_record_id: null,
      linked_record_table: null,
      is_verified: false,
      verified_at: null,
      verified_by: null,
      tags: [],
      filed_at: new Date().toISOString(),
    });
    expect(filingCabinetCount(HOME_ID)).toBe(1);
    const r = loadFilingCabinetIndex(HOME_ID);
    expect(r.total).toBe(1);
  });
});
