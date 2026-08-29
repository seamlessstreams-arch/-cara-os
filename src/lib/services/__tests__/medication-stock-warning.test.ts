import { describe, it, expect } from "vitest";
import fs from "node:fs";

// A controlled-drug administration decrements the prescription's stock. That
// update's error used to be discarded, and the function returned ok:true — so a
// failed decrement left the recorded running balance disagreeing with what is
// physically in the cabinet, which is precisely what a CD audit reconciles.
//
// The administration itself must stay recorded either way: it happened. What
// changed is that the failure is no longer silent.

const SRC = fs.readFileSync("src/lib/services/medication-service.ts", "utf8");

describe("controlled-drug stock decrement", () => {
  it("captures the error from the decrement rather than discarding it", () => {
    const block = SRC.slice(SRC.indexOf("export async function recordAdministration"));
    const decrement = block.slice(block.indexOf("stock_count: prescription.stock_count - 1"));
    // the update's error must be bound, not dropped
    expect(block).toMatch(/const\s*\{\s*error:\s*stockError\s*\}\s*=\s*await\s*\(s\.from\("cs_medication_prescriptions"\)/);
    expect(decrement.slice(0, 600)).toMatch(/if\s*\(\s*stockError\s*\)/);
  });

  it("still returns ok:true — the administration happened and stays recorded", () => {
    const block = SRC.slice(SRC.indexOf("export async function recordAdministration"));
    const guard = block.slice(block.indexOf("if (stockError)"));
    expect(guard.slice(0, 500)).toMatch(/ok:\s*true/);
    expect(guard.slice(0, 500)).toMatch(/warning:/);
  });

  it("names the cabinet, so the reader knows what to reconcile", () => {
    expect(SRC).toMatch(/cabinet/i);
  });
});
