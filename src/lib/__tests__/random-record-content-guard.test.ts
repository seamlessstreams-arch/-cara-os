// ══════════════════════════════════════════════════════════════════════════════
// CARA OS — RANDOM-RECORD GUARD
//
// /workforce/qualifications shipped a card whose own comment read "Simulate DBS
// data based on staff". Where a staff member had no DBS number recorded it
// invented one — a different one on every render — defaulted the DBS date to a
// fixed day, coin-flipped the Update Service flag, and asserted
// `barred_list_checked: true` for every member of the team unconditionally.
//
// /quality/reg-45 did the smaller version: a random count of "evidence links"
// under a section of a statutory review.
//
// The rule has to be one line or it erodes: Math.random() is permitted ONLY as
// `Math.random().toString(36)` — the id idiom used in ~30 places here.
// Anything else is producing a value that the record, the manager and the
// inspector will all read as fact.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Runs the real guard over a throwaway file and returns the lines it flags. */
function flagged(source: string, name = "probe.ts"): string[] {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "randrec-"));
  const dir = path.join(root, "src", "lib");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), source);

  let out = "";
  try {
    out = execFileSync("node", [path.join(process.cwd(), "scripts", "check-random-record-content.js")], {
      cwd: root,
      encoding: "utf8",
    });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    out = `${e.stdout ?? ""}\n${e.stderr ?? ""}`;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  return out.split("\n").filter((l) => l.includes("src/lib/"));
}

describe("random-record guard — record content", () => {
  it("flags a fabricated certificate number", () => {
    const src = "const dbs = staff.dbs_number || `DBS-${Math.floor(Math.random() * 900 + 100)}`;\n";
    expect(flagged(src)).toHaveLength(1);
  });

  it("flags a coin-flipped boolean standing in for a missing check", () => {
    expect(flagged("const onUpdateService = s.dbs_update_service ?? (Math.random() > 0.3);\n")).toHaveLength(1);
  });

  it("flags a random count rendered as a figure", () => {
    expect(flagged("const links = Math.floor(Math.random() * 12) + 3;\n")).toHaveLength(1);
  });

  it("flags randomness even inside a demo builder — two loads must agree", () => {
    expect(flagged("const attended = base + (Math.random() > 0.7 ? 1 : 0);\n")).toHaveLength(1);
  });

  it("flags a reference number drawn at random, which can collide", () => {
    expect(flagged("const ref = `CMP-2026-${Math.floor(Math.random() * 900) + 100}`;\n")).toHaveLength(1);
  });
});

describe("random-record guard — what stays allowed", () => {
  it("allows the id idiom", () => {
    expect(flagged("const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;\n")).toEqual([]);
  });

  it("allows the id idiom with spacing", () => {
    expect(flagged("const id = Math.random() . toString( 36 ).slice(2);\n")).toEqual([]);
  });

  it("does not flag a comment ABOUT Math.random", () => {
    // hero-field.tsx notes that it deliberately avoids Math.random for stable frames.
    expect(flagged("// Deterministic per index (no Math.random — stable frames).\nconst x = 1;\n")).toEqual([]);
  });

  it("does not flag a file that never mentions it", () => {
    expect(flagged("export const two = 1 + 1;\n")).toEqual([]);
  });

  it("flags every offending line, not just the first", () => {
    const src = "const a = Math.random() * 5;\nconst b = Math.random() > 0.5;\n";
    expect(flagged(src)).toHaveLength(2);
  });
});
