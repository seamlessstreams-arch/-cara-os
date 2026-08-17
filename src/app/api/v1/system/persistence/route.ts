// ══════════════════════════════════════════════════════════════════════════════
// CARA — PERSISTENCE STATUS API  (GET /api/v1/system/persistence)
//
// Reports the data-durability mode honestly: env presence as booleans only
// (never values), a live table probe when Supabase is enabled, and the
// write-through coverage manifest.
//
// The probe used to cover four hardcoded tables. It now covers every table the
// app expects, because migrations reach the live tenant BY HAND — no `supabase
// db push` in CI, in vercel.json, or in package.json scripts. A merged and
// deployed migration proves the BUILD shipped, not that the table exists, and
// a table that does not exist reads exactly like a collection with no records.
// This endpoint is the only place that can tell the difference.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { isSupabaseEnabled, createServerClient } from "@/lib/supabase/server";
import { PERSISTENCE_MANIFEST, persistenceSummary } from "@/lib/persistence-manifest";
import { EXPECTED_TABLES } from "@/lib/supabase/expected-tables";
import {
  classifyProbe, summariseDrift, missingColumnName,
  type TableProbeResult, type MissingColumn,
} from "@/lib/supabase/table-probe";

export const dynamic = "force-dynamic";

/** Probe in batches — 46 tables at once is a lot of sockets for one request. */
const BATCH = 8;

export async function GET() {
  const enabled = isSupabaseEnabled();
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("YOUR_"),
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("YOUR_"),
    NEXT_PUBLIC_SUPABASE_ENABLED: process.env.NEXT_PUBLIC_SUPABASE_ENABLED === "true",
  };

  let probe: TableProbeResult[] = [];
  if (enabled) {
    const c = createServerClient();
    if (c) {
      /**
       * Which of these columns does the table not have?
       *
       * They can only be found ONE AT A TIME, because PostgREST rejects the
       * entire select on the first unknown column and names just that one. So:
       * ask for all of them, and each time it refuses, drop the column it
       * named and ask again. Bounded by the number of columns — a refusal that
       * does not name one ends the loop rather than spinning.
       */
      const probeColumns = async (
        table: string,
        expected: { name: string; migration: string | null }[],
      ): Promise<MissingColumn[] | null> => {
        if (expected.length === 0) return [];
        let remaining = expected.map((c) => c.name);
        const found: MissingColumn[] = [];

        for (let attempt = 0; attempt <= expected.length; attempt++) {
          if (remaining.length === 0) break;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (c.from(table as any) as any)
            .select(remaining.join(","), { head: true })
            .limit(1);
          if (!error) break;

          const named = missingColumnName(error);
          // Refused for some other reason — report nothing rather than guess
          // which columns are absent.
          if (!named || !remaining.includes(named)) return null;
          found.push({ name: named, migration: expected.find((c2) => c2.name === named)?.migration ?? null });
          remaining = remaining.filter((n) => n !== named);
        }
        return found.sort((a, b) => a.name.localeCompare(b.name));
      };

      for (let i = 0; i < EXPECTED_TABLES.length; i += BATCH) {
        const batch = EXPECTED_TABLES.slice(i, i + BATCH);
        probe.push(
          ...(await Promise.all(
            batch.map(async ({ table, migration, columns }) => {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { count, error } = await (c.from(table as any) as any)
                  .select("*", { count: "exact", head: true });
                // Only probe columns on a table that is actually there — on a
                // missing one every column is trivially absent, and saying so
                // would bury the one fact that matters.
                const missingColumns = error ? null : await probeColumns(table, columns);
                return classifyProbe(table, migration, { count, error, missingColumns });
              } catch (e) {
                return classifyProbe(table, migration, {
                  error: { message: e instanceof Error ? e.message : "probe failed" },
                });
              }
            }),
          )),
        );
      }
      probe = probe.sort((a, b) => a.table.localeCompare(b.table));
    }
  }

  return NextResponse.json({
    data: {
      mode: enabled ? "durable" : "demo",
      enabled,
      env,
      probe,
      // Null rather than a zero-filled object when nothing was probed: an
      // unprobed tenant has NOT been found to have every table.
      drift: enabled && probe.length > 0 ? summariseDrift(probe) : null,
      summary: persistenceSummary(),
      manifest: PERSISTENCE_MANIFEST,
      demo_note: enabled
        ? null
        : "Demo mode: records live in a seeded in-memory store and reset on redeploy or instance recycle. Set the Supabase environment variables and run the migrations to make changes durable — see the runbook on this page.",
      migration_note:
        "Migrations are applied to the live tenant by hand — nothing in CI or the deploy runs them. " +
        "A shipped migration is not an applied one; `drift.pending_migrations` is the list still to run.",
    },
  });
}
