// ══════════════════════════════════════════════════════════════════════════════
// CARA OS — RLS GUARD (scripts/check-rls.js)
//
// The app queries as service_role, which bypasses RLS, so an open policy is
// invisible from inside the app. The guard is the only thing that sees one.
//
// It was vacuous until 2026-11-09: it read only the first three characters of
// each migration's file name, so "20260816210000_x.sql" parsed as 202 — below
// its 423 cut-off — and it checked nothing while printing "clean". Its original
// can-fail proof passed because the fixture used a 3-digit name. So every
// fixture below uses the real timestamped shape, and the guard must fail
// outright when nothing is in scope.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GUARD = path.join(process.cwd(), "scripts", "check-rls.js");

/** Runs the real guard over throwaway migrations; returns its exit code and output. */
function run(files: Record<string, string>): { code: number; out: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rls-guard-"));
  for (const [name, sql] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), sql);
  try {
    const out = execFileSync("node", [GUARD], {
      env: { ...process.env, RLS_GUARD_MIGRATIONS_DIR: dir },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}\n${e.stderr ?? ""}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const TABLE = "create table if not exists t (id uuid primary key, home_id uuid);\nalter table t enable row level security;\n";
const OPEN_POLICY = `create policy "Tenant isolation" on t for all using (true) with check (true);\n`;
const OPEN = TABLE + OPEN_POLICY;

describe("RLS guard — scope", () => {
  it("checks timestamped migrations (the real file-name shape)", () => {
    const r = run({ "20260816210000_open.sql": OPEN });
    expect(r.code).toBe(1);
    expect(r.out).toContain(`policy "Tenant isolation" on "t"`);
  });

  it("fails instead of reporting clean when no migration is in scope", () => {
    const r = run({ "00000000000000_baseline.sql": OPEN, "028_history.sql": OPEN });
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/no migration .* has a version >= 423/);
  });

  it("fails on an empty directory", () => {
    expect(run({}).code).toBe(1);
  });

  it("reports how many migrations it checked when clean", () => {
    const r = run({ "20261108120200_clean.sql": TABLE, "20261110100000_clean.sql": TABLE.replace(/\bt\b/g, "u") });
    expect(r.code).toBe(0);
    expect(r.out).toContain("2 migration(s) >= 423 clean");
  });
});

describe("RLS guard — policies are judged on their end state", () => {
  it("flags an open policy that nothing later drops", () => {
    expect(run({ "20260816210000_open.sql": OPEN }).code).toBe(1);
  });

  it("clears an open policy dropped later in the same file (the replay shape)", () => {
    const replay =
      OPEN +
      `drop policy if exists "Tenant isolation" on t;\n` +
      `create policy "Tenant isolation" on t for all using (home_id = (select get_my_home_id()));\n`;
    expect(run({ "20260918120000_replay.sql": replay }).code).toBe(0);
  });

  it("clears an open policy fixed by a later migration", () => {
    const r = run({
      "20260816210000_open.sql": OPEN,
      "20261110100000_fix.sql": `drop policy if exists "Tenant isolation" on t;\n`,
    });
    expect(r.code).toBe(0);
  });

  it("does not let an EARLIER migration's drop clear a later create", () => {
    const r = run({
      "20260101000000_drop_first.sql": `drop policy if exists "Tenant isolation" on t;\n`,
      "20260816210000_open.sql": OPEN,
    });
    expect(r.code).toBe(1);
  });

  it("matches quoted policy names exactly, so a different name does not clear it", () => {
    const r = run({
      "20260816210000_open.sql": OPEN,
      "20261110100000_fix.sql": `drop policy if exists "tenant isolation" on t;\n`,
    });
    expect(r.code).toBe(1);
  });

  it("clears policies when their table is dropped", () => {
    const r = run({ "20260816210000_open.sql": OPEN, "20261110100000_drop.sql": "drop table if exists t cascade;\n" });
    expect(r.code).toBe(0);
  });

  it("re-judges a policy that a static alter policy opens", () => {
    const scoped = TABLE + `create policy "p" on t for select to authenticated using (home_id = (select get_my_home_id()));\n`;
    const r = run({ "20260816210000_scoped.sql": scoped, "20261110100000_open.sql": `alter policy "p" on t using (true);\n` });
    expect(r.code).toBe(1);
    expect(r.out).toContain("TO authenticated");
  });

  it("re-judges a policy that a static alter policy narrows", () => {
    const r = run({
      "20260816210000_open.sql": OPEN,
      "20261110100000_narrow.sql": `alter policy "Tenant isolation" on t using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));\n`,
    });
    expect(r.code).toBe(0);
  });

  it("ignores dynamic DDL it cannot read (names are %I inside execute format)", () => {
    const dynamic =
      TABLE +
      "do $$ begin execute format('create policy %I on %I using (true)', 'x', 't'); end $$;\n";
    expect(run({ "20261019120000_dynamic.sql": dynamic }).code).toBe(0);
  });
});

describe("RLS guard — who a policy applies to", () => {
  it("flags an insert policy with WITH CHECK (true) and no TO clause as PUBLIC", () => {
    const r = run({
      "20260918120000_outputs.sql": TABLE + `create policy "Users can insert own outputs" on t for insert with check (true);\n`,
    });
    expect(r.code).toBe(1);
    expect(r.out).toContain("PUBLIC (includes anon)");
  });

  it("flags TO authenticated USING (true)", () => {
    const r = run({ "20260918120000_auth.sql": TABLE + `create policy "read" on t for select to authenticated using (true);\n` });
    expect(r.code).toBe(1);
    expect(r.out).toContain("TO authenticated");
  });

  it("allows TO service_role, which grants nothing the role lacks", () => {
    const r = run({ "20260918120000_svc.sql": TABLE + `create policy "svc" on t for all to service_role using (true) with check (true);\n` });
    expect(r.code).toBe(0);
  });

  it("allows a predicate scoped to the caller's home", () => {
    const r = run({
      "20260918120000_scoped.sql": TABLE + `create policy "Tenant isolation" on t using (home_id = (select get_my_home_id())) with check (home_id = (select get_my_home_id()));\n`,
    });
    expect(r.code).toBe(0);
  });

  it("does not trip on an open policy quoted in a comment", () => {
    const r = run({ "20260918120000_doc.sql": TABLE + `-- e.g. create policy "x" on t using (true);\n` });
    expect(r.code).toBe(0);
  });
});

describe("RLS guard — tables and the escape hatch", () => {
  it("flags a public table created without enabling RLS in the same migration", () => {
    const r = run({ "20260918120000_bare.sql": "create table if not exists bare (id uuid primary key);\n" });
    expect(r.code).toBe(1);
    expect(r.out).toContain(`table "bare"`);
  });

  it("skips temp tables, which the Data API cannot reach", () => {
    expect(run({ "20260918120000_tmp.sql": "create temp table scratch (id int);\n" }).code).toBe(0);
  });

  it("honours `-- rls-guard: allow <reason>` and says which file it skipped", () => {
    const r = run({ "20260918120000_hatch.sql": `-- rls-guard: allow dynamic DDL reviewed by hand\n${OPEN}` });
    expect(r.code).toBe(0);
    expect(r.out).toContain("20260918120000_hatch.sql — dynamic DDL reviewed by hand");
  });
});
