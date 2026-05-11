// ══════════════════════════════════════════════════════════════════════════════
// Notifications — Export abuse promotion (Milestone 41)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db, type ExportHistoryEntry } from "@/lib/db/store";
import { loadNotifications } from "@/lib/care-events/notifications";

const HOME = "home_export_abuse_notify_test";

function clear() {
  const arr = db.exportHistory.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
}

beforeEach(() => clear());

function seed(over: Partial<ExportHistoryEntry>): ExportHistoryEntry {
  return db.exportHistory.create({
    id: `n_${Math.random().toString(36).slice(2)}`,
    home_id: HOME,
    kind: "inspection_snapshot",
    artifact_id: "a",
    format: "json",
    exported_at: new Date().toISOString(),
    exported_by: "u_a",
    exported_by_role: "registered_manager",
    is_safeguarding_sensitive: false,
    byte_size: 100,
    reason: "ok",
    ...over,
  });
}

describe("notifications — export abuse promotion (M41)", () => {
  it("promotes a high-volume abuse flag into manager notifications", () => {
    for (let i = 0; i < 5; i++) seed({ id: `hv_${i}`, artifact_id: `a${i}` });
    const stream = loadNotifications(HOME);
    const item = stream.items.find((i) => i.source === "export_abuse");
    expect(item).toBeDefined();
    expect(item!.audience).toBe("manager");
    expect(item!.severity).toBe("warning");
    expect(item!.link_href).toBe("/intelligence/care-events/export-risk");
    expect(item!.id.startsWith("export_abuse:")).toBe(true);
  });

  it("promotes a sensitive burst as a critical notification", () => {
    seed({ id: "sb_1", is_safeguarding_sensitive: true, kind: "reg44_pack", artifact_id: "p1" });
    seed({ id: "sb_2", is_safeguarding_sensitive: true, kind: "reg44_pack", artifact_id: "p2" });
    const stream = loadNotifications(HOME);
    const burst = stream.items.find(
      (i) => i.source === "export_abuse" && i.id.includes("sensitive_burst_24h"),
    );
    expect(burst).toBeDefined();
    expect(burst!.severity).toBe("critical");
  });

  it("emits no export_abuse notifications when activity is normal", () => {
    seed({ id: "calm_1", reason: "monthly review" });
    const stream = loadNotifications(HOME);
    expect(stream.items.filter((i) => i.source === "export_abuse")).toHaveLength(0);
  });

  it("uses deterministic ids so duplicates are not produced across reloads", () => {
    for (let i = 0; i < 5; i++) seed({ id: `det_${i}`, artifact_id: `a${i}` });
    const a = loadNotifications(HOME).items.filter((i) => i.source === "export_abuse");
    const b = loadNotifications(HOME).items.filter((i) => i.source === "export_abuse");
    expect(a.map((x) => x.id).sort()).toEqual(b.map((x) => x.id).sort());
  });
});
