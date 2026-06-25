"use client";

// CARA HQ — AI usage & cost (30 days)

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HqBoundaryNote, HqStat } from "@/components/hq/hq-bits";
import { useHqAiUsage, useHqAiGateway } from "@/hooks/use-hq";

const REFUSAL_LABEL: Record<string, string> = {
  no_provider: "No AI provider configured",
  kill_switch: "AI disabled (kill-switch)",
  sensitivity_block: "Too sensitive to send",
  cost_limit: "Cost limit reached",
  permission: "Caller not permitted",
  provider_unavailable: "Provider unavailable",
  other: "Other",
};

export default function HqAiUsagePage() {
  const { data, isLoading } = useHqAiUsage();
  const s = data?.summary;
  const orgName = (id: string) => data?.org_names[id] ?? "—";

  const { data: gw, isLoading: gLoading } = useHqAiGateway();
  const g = gw?.summary;

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
        {/* ── Cara AI Gateway — deterministic-first ledger ──────────────── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--cs-navy)]">Cara AI Gateway</h2>
            <p className="text-xs text-[var(--cs-text-muted)]">
              Every AI-eligible request flows through one chokepoint. This is how many were
              answered with no model call, what was refused, and what was redacted before send —
              evidence that AI is the exception, not the default.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <HqStat
              label="AI calls avoided"
              value={gLoading ? "—" : g && g.total > 0 ? `${g.avoided_pct}%` : "—"}
              hint={
                g && g.total > 0
                  ? `${g.avoided_calls.toLocaleString()} of ${g.total.toLocaleString()} answered without a model`
                  : "no gateway traffic yet"
              }
            />
            <HqStat
              label="Answered by engine / cache"
              value={gLoading ? "—" : (g?.deterministic_calls ?? 0).toLocaleString()}
              hint="rules-first + learned-cache wins"
            />
            <HqStat
              label="Identifiable data sent"
              value={gLoading ? "—" : (g?.identifiable_sent ?? 0).toLocaleString()}
              hint="items that reached a model · target 0"
            />
          </div>

          {g && g.total === 0 && (
            <Card>
              <CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">
                No AI-eligible requests have passed through the gateway yet. When they do, you&apos;ll
                see here how many Cara answered deterministically, what it refused, and what it
                redacted before any model call.
              </CardContent>
            </Card>
          )}

          {g && g.total > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">How requests were handled</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {[
                    { label: "Deterministic (rules engine)", value: g.by_method.deterministic, accent: true },
                    { label: "Cache (learned answer)", value: g.by_method.cache, accent: true },
                    { label: "AI (model call)", value: g.by_method.ai, accent: false },
                    { label: "Refused / fell back", value: g.by_method.refused, accent: false },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className={row.accent ? "text-[var(--cs-teal)]" : "text-[var(--cs-text-secondary)]"}>
                        {row.label}
                      </span>
                      <span className="font-semibold text-[var(--cs-navy)]">{row.value.toLocaleString()}</span>
                    </div>
                  ))}
                  {g.refused_by_reason.length > 0 && (
                    <div className="mt-2 border-t border-[var(--cs-border-subtle)] pt-2">
                      <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">
                        Why refused
                      </p>
                      <ul className="space-y-1">
                        {g.refused_by_reason.map((r) => (
                          <li key={r.reason} className="flex justify-between">
                            <span className="text-[var(--cs-text-secondary)]">
                              {REFUSAL_LABEL[r.reason] ?? r.reason}
                            </span>
                            <span className="font-semibold text-[var(--cs-navy)]">{r.count.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Data protection before send</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-secondary)]">Calls with PII redacted</span>
                    <span className="font-semibold text-[var(--cs-navy)]">{g.redaction_events.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-secondary)]">Identifiers stripped (total)</span>
                    <span className="font-semibold text-[var(--cs-navy)]">{g.redacted_items.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-secondary)]">Blocked — too sensitive to send</span>
                    <span className="font-semibold text-[var(--cs-navy)]">{g.sensitivity_blocks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-secondary)]">Identifiable data that reached a model</span>
                    <span
                      className={`font-semibold ${
                        g.identifiable_sent > 0 ? "text-[var(--cs-navy)]" : "text-[var(--cs-teal)]"
                      }`}
                    >
                      {g.identifiable_sent.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {g && g.by_feature.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">By feature (gateway)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {g.by_feature.map((f) => (
                    <li key={f.feature} className="flex items-center justify-between gap-2">
                      <span className="text-[var(--cs-text-secondary)]">{f.feature.replaceAll("_", " ")}</span>
                      <span className="text-[var(--cs-text-gentle)]">
                        {f.total.toLocaleString()} total ·{" "}
                        <span className="font-semibold text-[var(--cs-teal)]">{f.avoided.toLocaleString()} avoided</span>
                        {f.ai > 0 && (
                          <span className="ml-1 font-semibold text-[var(--cs-navy)]">· {f.ai.toLocaleString()} AI</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
