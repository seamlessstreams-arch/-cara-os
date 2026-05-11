// ══════════════════════════════════════════════════════════════════════════════
// Reg 44 Visit Evidence Pack — persistence tests (Milestone 35)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  generateReg44Pack,
  persistReg44Pack,
  listPersistedReg44Packs,
  getPersistedReg44Pack,
} from "@/lib/care-events/reg44-pack";

const HOME_ID = "home_reg44_persist_test";

function clearAll() {
  // wipe the home's persisted packs by replacing the underlying array length
  const arr = db.reg44Packs.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME_ID) arr.splice(i, 1);
  }
}

beforeEach(() => clearAll());

describe("Reg 44 Pack persistence (M35)", () => {
  it("persistReg44Pack writes a header row with the payload", () => {
    const pack = generateReg44Pack(HOME_ID, { generatedBy: "user_a" });
    const row = persistReg44Pack(pack);
    expect(row.id).toBe(pack.id);
    expect(row.home_id).toBe(HOME_ID);
    expect(row.window_start).toBe(pack.window.start);
    expect(row.window_end).toBe(pack.window.end);
    expect(row.headline_children).toBe(pack.headline.children_in_residence);
    expect(row.payload).toBeDefined();
  });

  it("listPersistedReg44Packs strips payload and returns newest first", async () => {
    const a = generateReg44Pack(HOME_ID);
    persistReg44Pack(a);
    // ensure ms-distinct ids
    await new Promise((r) => setTimeout(r, 5));
    const b = generateReg44Pack(HOME_ID);
    persistReg44Pack(b);

    const rows = listPersistedReg44Packs(HOME_ID);
    expect(rows.length).toBe(2);
    expect(rows[0].generated_at >= rows[1].generated_at).toBe(true);
    for (const r of rows) {
      expect((r as unknown as Record<string, unknown>).payload).toBeUndefined();
    }
  });

  it("create rejects duplicate ids (id-level idempotency)", () => {
    const pack = generateReg44Pack(HOME_ID);
    persistReg44Pack(pack);
    persistReg44Pack(pack);
    persistReg44Pack(pack);
    const rows = listPersistedReg44Packs(HOME_ID);
    expect(rows.length).toBe(1);
  });

  it("getPersistedReg44Pack returns full payload by id; null when missing", () => {
    const pack = generateReg44Pack(HOME_ID, { generatedBy: "user_x" });
    persistReg44Pack(pack);
    const got = getPersistedReg44Pack(pack.id);
    expect(got).not.toBeNull();
    expect(got!.payload).toBeDefined();
    expect(getPersistedReg44Pack("r44pack_nope")).toBeNull();
  });

  it("isolates by home", () => {
    const pack = generateReg44Pack(HOME_ID);
    persistReg44Pack(pack);
    const other = listPersistedReg44Packs("home_other_xyz");
    expect(other.length).toBe(0);
  });
});
