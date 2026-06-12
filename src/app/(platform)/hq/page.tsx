"use client";

// CARA HQ — overview (platform-owner cockpit)

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { HqBoundaryNote, HqModeChip, HqStat } from "@/components/hq/hq-bits";
import { useHqOverview } from "@/hooks/use-hq";
import { ArrowRight, ExternalLink } from "lucide-react";

const OPS_LINKS: [string, string][] = [
  ["Vercel dashboard / logs", "https://vercel.com/dashboard"],
  ["Supabase project (DB, auth, logs)", "https://supabase.com/dashboard"],
  ["Supabase status", "https://status.supabase.com"],
  ["Vercel status", "https://www.vercel-status.com"],
];

export default function HqOverviewPage() {
  const { data, isLoading, error } = useHqOverview();
  const o = data?.overview;

  return (
    <PageShell
      title="Cara HQ"
      subtitle="Platform owner — customers, usage, AI cost and system health. Pain Point Resolutions Ltd."
      showQuickCreate={false}
    >
      <div className="space-y-6">
        <HqBoundaryNote />

        {error && (
          <Card>
            <CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">
              Could not load the HQ overview: {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {data && (
          <div className="flex flex-wrap items-center gap-2">
            <HqModeChip
              on={data.mode.durable}
              onLabel="Durable mode — Supabase connected"
              offLabel="Demo mode — in-memory store (resets on redeploy)"
            />
            <HqModeChip
              on={data.mode.ai_configured}
              onLabel="AI configured"
              offLabel="AI off — deterministic scaffolds only"
            />
          </div>
        )}

        <CardErrorBoundary>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HqStat
              label="Customers"
              value={isLoading ? "—" : o?.customers.total ?? 0}
              hint={o ? `${o.customers.active} active · ${o.customers.suspended} suspended` : undefined}
            />
            <HqStat
              label="Activity (24h)"
              value={isLoading ? "—" : o?.usage.events_24h ?? 0}
              hint="recorded user actions"
            />
            <HqStat
              label="AI cost (30d)"
              value={isLoading ? "—" : `£${(o?.ai.cost_30d_gbp ?? 0).toFixed(2)}`}
              hint={o ? `${o.ai.calls_30d} calls · estimated` : undefined}
            />
            <HqStat
              label="Open break-glass"
              value={isLoading ? "—" : o?.break_glass.open_count ?? 0}
              hint="active, unexpired grants"
            />
          </div>
        </CardErrorBoundary>

        {o && o.attention.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Needs your attention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {o.attention.map((a) => (
                <p
                  key={a}
                  className="rounded-lg bg-[var(--cs-warning-bg)] px-3 py-2 text-sm text-[var(--cs-text-secondary)]"
                >
                  {a}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity by kind (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {o && o.usage.by_kind_30d.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {o.usage.by_kind_30d.map((k) => (
                    <li key={k.kind} className="flex justify-between">
                      <span className="text-[var(--cs-text-secondary)]">{k.kind.replaceAll("_", " ")}</span>
                      <span className="font-semibold text-[var(--cs-navy)]">{k.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--cs-text-muted)]">No activity recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Operations links</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {OPS_LINKS.map(([label, url]) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[var(--cs-teal)] hover:underline"
                    >
                      {label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--cs-text-gentle)]">
                Live infra metrics live in Vercel &amp; Supabase. Wire alerting before go-live.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/hq/customers"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Customers <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/hq/ai-usage"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]"
          >
            AI usage &amp; cost <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/data-persistence"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-surface)]"
          >
            Data persistence <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
