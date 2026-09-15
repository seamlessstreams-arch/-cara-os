import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { GET } from "../route";

// `safeList` swallowed a failed read into []. With no administrations,
// `administeredWithoutWitness` is 0, so the insight about doses given without a
// witness never fires — the concern does not read as unknown, it disappears.

const SRC = fs.readFileSync("src/app/api/v1/medication-safety/route.ts", "utf8");

describe("medication safety says when it could not read a source", () => {
  it("no longer swallows a failure into a bare empty list", () => {
    expect(SRC).not.toMatch(/catch\s*\{\s*return \[\];\s*\}/);
    expect(SRC).toMatch(/createSafeReader\(\)/);
  });

  it("names each source it reads, so a failure can be attributed", () => {
    expect(SRC).toMatch(/reader\.list\("medication administrations"/);
    expect(SRC).toMatch(/reader\.list\("young people"/);
    expect(SRC).toMatch(/reader\.list\("medications"/);
  });

  it("reports completeness alongside the numbers", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveProperty("incomplete");
    expect(body).toHaveProperty("unreadableSources");
    // Nothing failed in this environment, so it must say so rather than warn.
    expect(body.incomplete).toBe(false);
    expect(body.incompleteNote).toBeNull();
  });

  it("still returns the counts it did compute", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.data).toHaveProperty("administeredWithoutWitness");
  });
});
