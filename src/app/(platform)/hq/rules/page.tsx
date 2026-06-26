"use client";

// CARA HQ — Rule catalog (governance view of every rule Cara applies)

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HqBoundaryNote, HqStat } from "@/components/hq/hq-bits";
import { useHqRuleCatalog } from "@/hooks/use-hq";

const SOURCE_LABEL: Record<string, string> = {
  automation: "Automation",
  compliance: "Compliance",
  cara_rules: "Cara engine",
};

const SOURCE_ORDER = ["compliance", "automation", "cara_rules"] as const;

export default function HqRulesPage() {
  const { data, isLoading } = useHqRuleCatalog();
  const s = data?.summary;
  const catalog = data?.catalog ?? [];

  return (
    <PageShell
      title="Rule catalog"
      subtitle="Every deterministic rule Cara applies, across all three rule systems, in one place. Read-only governance view — it never changes how a rule runs."
      showQuickCreate={false}
    >
      <div className="space-y-6">
        <HqBoundaryNote />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HqStat label="Total rules" value={isLoading ? "—" : s?.total ?? 0} hint="across all three systems" />
          <HqStat
            label="Config-editable"
            value={isLoading ? "—" : s?.editable_count ?? 0}
            hint="automation trigger→action rules"
          />
          <HqStat
            label="Regulatory (fixed)"
            value={isLoading ? "—" : s?.by_source.compliance ?? 0}
            hint="compliance pass/fail rules"
          />
          <HqStat
            label="Cara handlers"
            value={isLoading ? "—" : s?.by_source.cara_rules ?? 0}
            hint="deterministic, rules-first ladder"
          />
        </div>

        {s && s.by_category.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">By category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {s.by_category.map((c) => (
                  <span
                    key={c.category}
                    className="rounded-full bg-[var(--cs-surface)] px-3 py-1 text-xs text-[var(--cs-text-secondary)]"
                  >
                    {c.category.replaceAll("_", " ")}{" "}
                    <span className="font-semibold text-[var(--cs-navy)]">{c.count}</span>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {SOURCE_ORDER.map((source) => {
          const rules = catalog.filter((r) => r.source === source);
          if (rules.length === 0) return null;
          return (
            <Card key={source} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm">
                  {SOURCE_LABEL[source]}{" "}
                  <span className="font-normal text-[var(--cs-text-muted)]">· {rules.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--cs-surface)]">
                      <tr className="border-t border-[var(--cs-border-subtle)] text-left text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">
                        <th className="px-5 py-2 font-semibold">Rule</th>
                        <th className="px-5 py-2 font-semibold">Category</th>
                        <th className="px-5 py-2 font-semibold">Basis / note</th>
                        <th className="px-5 py-2 text-right font-semibold">Editable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((r) => (
                        <tr key={r.id} className="border-t border-[var(--cs-border-subtle)]">
                          <td className="px-5 py-2 text-[var(--cs-text-secondary)]">{r.name}</td>
                          <td className="px-5 py-2 text-[var(--cs-text-muted)]">
                            {r.category.replaceAll("_", " ")}
                          </td>
                          <td className="px-5 py-2 text-[var(--cs-text-gentle)]">
                            {r.statutoryBasis ?? r.description ?? "—"}
                          </td>
                          <td className="px-5 py-2 text-right">
                            {r.editable ? (
                              <span className="font-semibold text-[var(--cs-teal)]">yes</span>
                            ) : (
                              <span className="text-[var(--cs-text-gentle)]">fixed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
