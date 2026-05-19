// ══════════════════════════════════════════════════════════════════════════════
// Care Event Pattern Detection — engine tests (Milestone 17)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  scanCareEventPatterns,
  loadCareEventPatterns,
} from "@/lib/care-events/pattern-detection";
import type { CareEvent, CareEventCategory } from "@/types/care-events";

const HOME_ID = "home_pattern_test";

function clearAll() {
  const all = db.careEvents.findAll();
  const mine = all.filter((e) => e.home_id === HOME_ID);
  for (const e of mine) {
    const idx = all.indexOf(e);
    if (idx >= 0) all.splice(idx, 1);
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function seed(opts: {
  child_id?: string | null;
  category?: CareEventCategory;
  daysBack?: number;
  event_time?: string | null;
  is_safeguarding?: boolean;
  is_significant?: boolean;
  status?: CareEvent["status"];
}): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: opts.child_id ?? "yp_alex",
    category: opts.category ?? "behaviour",
    title: "test",
    content: "x",
    is_current_version: true,
    event_date: daysAgo(opts.daysBack ?? 1),
    event_time: opts.event_time ?? null,
    is_safeguarding: opts.is_safeguarding ?? false,
    is_significant: opts.is_significant ?? false,
    status: opts.status ?? "verified",
  });
}

describe("care event pattern detection", () => {
  beforeEach(() => clearAll());

  it("returns no patterns when nothing matches", () => {
    expect(scanCareEventPatterns(HOME_ID)).toEqual([]);
  });

  it("detects a frequency cluster for one child + category", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3 });
    const ps = scanCareEventPatterns(HOME_ID);
    const freq = ps.find((p) => p.type === "frequency_cluster");
    expect(freq).toBeDefined();
    expect(freq!.child_id).toBe("yp_a");
    expect(freq!.category).toBe("behaviour");
    expect(freq!.event_ids).toHaveLength(3);
  });

  it("does not flag a frequency cluster when below minCluster", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    const ps = scanCareEventPatterns(HOME_ID, { minClusterSize: 3 });
    expect(ps.find((p) => p.type === "frequency_cluster")).toBeUndefined();
  });

  it("detects safeguarding spike using is_safeguarding flag and category", () => {
    seed({ child_id: "yp_a", category: "safeguarding", daysBack: 1 });
    seed({ child_id: "yp_b", category: "missing_episode", daysBack: 2 });
    seed({ child_id: "yp_c", category: "behaviour", is_safeguarding: true, daysBack: 3 });
    const ps = scanCareEventPatterns(HOME_ID);
    const spike = ps.find((p) => p.type === "safeguarding_spike");
    expect(spike).toBeDefined();
    expect(spike!.child_id).toBeNull();
    expect(spike!.event_ids.length).toBe(3);
  });

  it("detects behaviour escalation when later flags exceed earlier", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 20 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 18 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 5, is_significant: true });
    seed({ child_id: "yp_a", category: "safeguarding", daysBack: 3, is_safeguarding: true });
    const ps = scanCareEventPatterns(HOME_ID);
    expect(ps.find((p) => p.type === "behaviour_escalation")).toBeDefined();
  });

  it("detects time-of-day cluster within a recurring band", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1, event_time: "21:15" });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3, event_time: "21:45" });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 5, event_time: "20:30" });
    const ps = scanCareEventPatterns(HOME_ID, { timeBandHours: 2 });
    expect(ps.find((p) => p.type === "time_of_day_cluster")).toBeDefined();
  });

  it("detects cross-child theme when same category spans many children", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_b", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_c", category: "behaviour", daysBack: 3 });
    const ps = scanCareEventPatterns(HOME_ID);
    const cross = ps.find((p) => p.type === "cross_child_theme");
    expect(cross).toBeDefined();
    expect(cross!.event_ids.length).toBeGreaterThanOrEqual(3);
  });

  it("ignores draft and returned events", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1, status: "draft" });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2, status: "returned" });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3, status: "verified" });
    const ps = scanCareEventPatterns(HOME_ID);
    expect(ps.find((p) => p.type === "frequency_cluster")).toBeUndefined();
  });

  it("ignores events outside the lookback window", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 200 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 210 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 220 });
    const ps = scanCareEventPatterns(HOME_ID, { lookbackDays: 30 });
    expect(ps).toEqual([]);
  });

  it("loadCareEventPatterns produces a summary with counts by severity and type", () => {
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 1 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 2 });
    seed({ child_id: "yp_a", category: "behaviour", daysBack: 3 });
    const s = loadCareEventPatterns(HOME_ID);
    expect(s.total_patterns).toBe(s.patterns.length);
    expect(s.by_type.frequency_cluster).toBeGreaterThanOrEqual(1);
    expect(s.by_severity.low + s.by_severity.medium + s.by_severity.high).toBe(s.total_patterns);
  });

  it("sorts patterns by severity descending", () => {
    // Create one high (≥6 events) frequency cluster and one low (3 events)
    for (let i = 0; i < 6; i++) seed({ child_id: "yp_high", category: "behaviour", daysBack: i + 1 });
    for (let i = 0; i < 3; i++) seed({ child_id: "yp_low", category: "education", daysBack: i + 1 });
    const ps = scanCareEventPatterns(HOME_ID);
    const sevOrder = { high: 0, medium: 1, low: 2 } as const;
    for (let i = 1; i < ps.length; i++) {
      expect(sevOrder[ps[i - 1]!.severity]).toBeLessThanOrEqual(sevOrder[ps[i]!.severity]);
    }
  });
});
