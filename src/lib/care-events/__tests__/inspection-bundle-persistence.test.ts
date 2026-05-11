// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle persistence tests (Milestone 43)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildInspectionBundle,
  persistInspectionBundle,
  listPersistedInspectionBundles,
  getPersistedInspectionBundle,
} from "@/lib/care-events/inspection-bundle";

const HOME = "home_oak";

beforeEach(() => {
  const arr = db.inspectionBundles.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
});

describe("inspection bundle persistence (M43)", () => {
  it("persistInspectionBundle stores a header row keyed by bundle_id", () => {
    const b = buildInspectionBundle(HOME, { generatedBy: "u_test" });
    const row = persistInspectionBundle(b);
    expect(row.id).toBe(b.bundle_id);
    expect(row.home_id).toBe(HOME);
    expect(row.generated_by).toBe("u_test");
    expect(row.reg44_packs_included).toBe(b.headline.reg44_packs_included);
  });

  it("is idempotent: persisting the same bundle twice keeps one row", () => {
    const b = buildInspectionBundle(HOME);
    persistInspectionBundle(b);
    persistInspectionBundle(b);
    const list = listPersistedInspectionBundles(HOME);
    expect(list.filter((r) => r.id === b.bundle_id)).toHaveLength(1);
  });

  it("listPersistedInspectionBundles returns header rows newest first", async () => {
    const a = buildInspectionBundle(HOME);
    persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const c = buildInspectionBundle(HOME);
    persistInspectionBundle(c);
    const list = listPersistedInspectionBundles(HOME);
    expect(list[0].id).toBe(c.bundle_id);
    expect(list[1].id).toBe(a.bundle_id);
    // header rows do not include the full payload
    expect((list[0] as unknown as { payload?: unknown }).payload).toBeUndefined();
  });

  it("getPersistedInspectionBundle returns the full payload", () => {
    const b = buildInspectionBundle(HOME);
    persistInspectionBundle(b);
    const fetched = getPersistedInspectionBundle(b.bundle_id);
    expect(fetched).not.toBeNull();
    expect(fetched!.payload).toBeDefined();
  });

  it("isolates by home", () => {
    const b = buildInspectionBundle(HOME);
    persistInspectionBundle(b);
    const otherList = listPersistedInspectionBundles("home_does_not_exist");
    expect(otherList).toHaveLength(0);
  });
});
