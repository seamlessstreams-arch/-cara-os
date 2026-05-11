// ══════════════════════════════════════════════════════════════════════════════
// Export Abuse Detection — engine tests (Milestone 40)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db, type ExportHistoryEntry } from "@/lib/db/store";
import { detectExportAbuse } from "@/lib/care-events/export-abuse";

const HOME = "home_export_abuse_test";

function clear() {
  const arr = db.exportHistory.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
}

beforeEach(() => clear());

function seed(overrides: Partial<ExportHistoryEntry>): ExportHistoryEntry {
  const ts = overrides.exported_at ?? new Date().toISOString();
  const e: ExportHistoryEntry = {
    id: `seed_${Math.random().toString(36).slice(2)}`,
    home_id: HOME,
    kind: "inspection_snapshot",
    artifact_id: "a1",
    format: "json",
    exported_at: ts,
    exported_by: "u_a",
    exported_by_role: "registered_manager",
    is_safeguarding_sensitive: false,
    byte_size: 100,
    reason: "ok",
    ...overrides,
  };
  return db.exportHistory.create(e);
}

describe("export abuse detection (M40)", () => {
  it("flags ≥ 5 exports by one user in 24h as high_volume_24h", () => {
    for (let i = 0; i < 5; i++) seed({ id: `hv_${i}`, artifact_id: `a${i}` });
    const r = detectExportAbuse(HOME);
    expect(r.by_kind.high_volume_24h).toBe(1);
    expect(r.flags[0].kind).toBe("high_volume_24h");
    expect(r.flags[0].count).toBe(5);
  });

  it("flags ≥ 2 sensitive exports in 24h as sensitive_burst_24h (critical)", () => {
    seed({ id: "sb_1", is_safeguarding_sensitive: true, kind: "reg44_pack", artifact_id: "p1" });
    seed({ id: "sb_2", is_safeguarding_sensitive: true, kind: "reg44_pack", artifact_id: "p2" });
    const r = detectExportAbuse(HOME);
    const burst = r.flags.find((f) => f.kind === "sensitive_burst_24h");
    expect(burst).toBeDefined();
    expect(burst!.severity).toBe("critical");
    expect(burst!.count).toBe(2);
  });

  it("flags off-hours sensitive exports", () => {
    seed({
      id: "off_1",
      is_safeguarding_sensitive: true,
      kind: "reg44_pack",
      artifact_id: "off_p",
      exported_at: "2026-05-10T03:30:00.000Z", // 03:30 UTC = off hours
    });
    const r = detectExportAbuse(HOME);
    expect(r.flags.some((f) => f.kind === "off_hours_sensitive")).toBe(true);
  });

  it("flags sensitive exports without a recorded reason", () => {
    seed({
      id: "ur_1",
      is_safeguarding_sensitive: true,
      kind: "reg44_pack",
      artifact_id: "ur_p",
      exported_at: "2026-05-10T12:00:00.000Z", // mid-day to avoid off-hours flag
      reason: null,
    });
    const r = detectExportAbuse(HOME);
    expect(r.flags.some((f) => f.kind === "unreasoned_sensitive")).toBe(true);
  });

  it("returns empty report when no exports", () => {
    const r = detectExportAbuse(HOME);
    expect(r.total_flags).toBe(0);
    expect(r.flags.length).toBe(0);
  });

  it("ignores volume signals from > 24h ago", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    for (let i = 0; i < 5; i++) {
      seed({ id: `old_${i}`, artifact_id: `a${i}`, exported_at: old });
    }
    const r = detectExportAbuse(HOME);
    expect(r.by_kind.high_volume_24h).toBe(0);
  });

  it("isolates flags by home", () => {
    for (let i = 0; i < 5; i++) seed({ id: `hv2_${i}`, artifact_id: `a${i}` });
    db.exportHistory.create({
      id: "other_1",
      home_id: "home_other_xx",
      kind: "inspection_snapshot",
      artifact_id: "x",
      format: "json",
      exported_at: new Date().toISOString(),
      exported_by: "u",
      exported_by_role: "rm",
      is_safeguarding_sensitive: false,
      byte_size: 1,
      reason: "ok",
    });
    expect(detectExportAbuse(HOME).by_kind.high_volume_24h).toBe(1);
    expect(detectExportAbuse("home_other_xx").by_kind.high_volume_24h).toBe(0);
  });

  it("sorts flags critical first", () => {
    const recent1 = new Date(Date.now() - 60 * 1000).toISOString();
    const recent2 = new Date(Date.now() - 30 * 1000).toISOString();
    seed({ id: "sb1", is_safeguarding_sensitive: true, kind: "reg44_pack", artifact_id: "p1", reason: "ok", exported_at: recent1 });
    seed({ id: "sb2", is_safeguarding_sensitive: true, kind: "reg44_pack", artifact_id: "p2", reason: "ok", exported_at: recent2 });
    for (let i = 0; i < 5; i++) seed({ id: `hv3_${i}`, artifact_id: `a${i}` });
    const r = detectExportAbuse(HOME);
    expect(r.flags[0].severity).toBe("critical");
  });
});
