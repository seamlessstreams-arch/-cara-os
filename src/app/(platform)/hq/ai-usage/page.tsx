"use client";

// CARA HQ — AI usage & cost (30 days)

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HqBoundaryNote, HqStat } from "@/components/hq/hq-bits";
import { useHqAiUsage } from "@/hooks/use-hq";

export default function HqAiUsagePage() {
  const { data, isLoading } = useHqAiUsage();
  const s = data?.summary;
  const orgName = (id: string) => data?.org_names[id] ?? "—";

  return (
    <PageShell
      title="AI usage & cost"
      subtitle="Estimated spend across every AI call, metered at the provider seam. Watch cost-per-customer to protect margin."
      showQuickCreate={false}
    >
      <div className="space-y-6">
        <HqBoundaryNote />

        <div className="grid gap-4 sm:grid-cols-3">
          <HqStat
            label="Total spend (30d)"
            value={isLoading ? "—" : `£${(s?.cost_30d_gbp ?? 0).toFixed(2)}`}
            hint="estimated, not billing"
          />
          <HqStat label="AI calls (30d)" value={isLoading ? "—" : s?.calls_30d ?? 0} />
          <HqStat label="Features in use" value={isLoading ? "—" : s?.by_feature.length ?? 0} />
        </div>

        {s && s.calls_30d === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">
              No AI usage recorded yet. Every model call meters itself here automatically the
              moment AI is configured — feature, model, tokens and an estimated cost. Until then,
              Cara runs entirely on its deterministic engines.
            </CardContent>
          </Card>
        )}

        {s && s.calls_30d > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost by feature</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {s.by_feature.map((f) => (
                    <li key={f.feature} className="flex justify-between">
                      <span className="text-[var(--cs-text-secondary)]">
                        {f.feature.replaceAll("_", " ")}{" "}
                        <span className="text-[var(--cs-text-gentle)]">· {f.calls} calls</span>
                      </span>
                      <span className="font-semibold text-[var(--cs-navy)]">£{f.cost_gbp.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost by customer</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {s.by_org.map((o) => (
                    <li key={o.org_id} className="flex justify-between">
                      <span className="text-[var(--cs-text-secondary)]">{orgName(o.org_id)}</span>
                      <span className="font-semibold text-[var(--cs-navy)]">£{o.cost_gbp.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {data && data.recent.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm">Recent calls</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] text-left text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">
                      <th className="px-5 py-2.5 font-semibold">When</th>
                      <th className="px-5 py-2.5 font-semibold">Feature</th>
                      <th className="px-5 py-2.5 font-semibold">Model</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Tokens in/out</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Est. cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r) => (
                      <tr key={r.id} className="border-t border-[var(--cs-border-subtle)]">
                        <td className="px-5 py-2.5 text-[var(--cs-text-secondary)]">
                          {new Date(r.at).toLocaleString("en-GB")}
                        </td>
                        <td className="px-5 py-2.5 text-[var(--cs-text-secondary)]">
                          {r.feature.replaceAll("_", " ")}
                        </td>
                        <td className="px-5 py-2.5 text-[var(--cs-text-gentle)]">{r.model ?? "—"}</td>
                        <td className="px-5 py-2.5 text-right text-[var(--cs-text-secondary)]">
                          {r.tokens_input.toLocaleString()} / {r.tokens_output.toLocaleString()}
                        </td>
                        <td className="px-5 py-2.5 text-right font-semibold text-[var(--cs-navy)]">
                          £{r.cost_gbp.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
