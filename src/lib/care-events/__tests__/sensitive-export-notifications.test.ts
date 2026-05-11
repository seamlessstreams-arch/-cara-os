// ══════════════════════════════════════════════════════════════════════════════
// Sensitive-export notifications (Milestone 39)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { recordExport } from "@/lib/care-events/export-history";
import { loadNotifications } from "@/lib/care-events/notifications";

const HOME = "home_sens_export_notif";

function clear() {
  const arr = db.exportHistory.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
}

beforeEach(() => clear());

describe("sensitive export notifications (M39)", () => {
  it("surfaces sensitive exports as critical manager notifications", () => {
    recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "pk1",
      exportedBy: "u_a", exportedByRole: "registered_manager", byteSize: 100,
      isSafeguardingSensitive: true, reason: "Ofsted prep",
    });
    const items = loadNotifications(HOME).items.filter(
      (i) => i.source === "sensitive_export",
    );
    expect(items.length).toBe(1);
    expect(items[0].severity).toBe("critical");
    expect(items[0].audience).toBe("manager");
    expect(items[0].title).toContain("Reg 44 pack");
    expect(items[0].body).toContain("u_a");
    expect(items[0].body).toContain("Ofsted prep");
  });

  it("ignores non-sensitive exports", () => {
    recordExport({
      homeId: HOME, kind: "inspection_snapshot", artifactId: "snap_x",
      exportedBy: "u", exportedByRole: "rm", byteSize: 50,
      isSafeguardingSensitive: false,
    });
    const items = loadNotifications(HOME).items.filter(
      (i) => i.source === "sensitive_export",
    );
    expect(items.length).toBe(0);
  });

  it("ignores sensitive exports older than 7 days", () => {
    const oldEntry = {
      id: "exp_reg44_pack_old_1",
      home_id: HOME,
      kind: "reg44_pack" as const,
      artifact_id: "old_pk",
      format: "json" as const,
      exported_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      exported_by: "u",
      exported_by_role: "rm",
      is_safeguarding_sensitive: true,
      byte_size: 1,
      reason: null,
    };
    db.exportHistory.create(oldEntry);
    const items = loadNotifications(HOME).items.filter(
      (i) => i.source === "sensitive_export",
    );
    expect(items.length).toBe(0);
  });

  it("scopes notifications to the requesting home", () => {
    recordExport({
      homeId: HOME, kind: "reg44_pack", artifactId: "p1",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    recordExport({
      homeId: "home_other_xx", kind: "reg44_pack", artifactId: "p2",
      exportedBy: "u", exportedByRole: "rm", byteSize: 1,
      isSafeguardingSensitive: true,
    });
    const items = loadNotifications(HOME).items.filter(
      (i) => i.source === "sensitive_export",
    );
    expect(items.length).toBe(1);
    expect(items[0].source_id).toMatch(/p1/);
  });
});
