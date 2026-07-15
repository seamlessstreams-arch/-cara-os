"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ACCESS GOVERNANCE  (route: /access-governance)
//
// One question, answered from evidence: if we switched the attribute-based
// access rules from advisory to enforcing, WHO would lose access to WHAT, and
// for what reason?
//
// The engine already runs beside the enforced permission check on every
// child-record and confidential-HR request. It never blocks — it records where
// it would have refused. This is that record, read back for the person who has
// to make the call.
//
// It states what the numbers cannot support as loudly as what they can:
// silence here is not proof that enforcing is safe.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAbacDivergence } from "@/hooks/use-abac-divergence";
import { ShieldCheck, AlertTriangle, Info, Users, Clock } from "lucide-react";

function Stat({ label, value, tone, hint }: { label: string; value: number | string; tone: "risk" | "neutral" | "muted"; hint: string }) {
  const colour =
    tone === "risk" ? "text-[var(--cs-warning)]" : tone === "neutral" ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className={`text-3xl font-extrabold tabular-nums ${colour}`}>{value}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--cs-navy)]">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--cs-text-muted)]">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function AccessGovernancePage() {
  const { data, isLoading, error } = useAbacDivergence();
  const s = data?.data;

  return (
    <PageShell
      title="Access Governance"
      subtitle="What enforcing the access rules would change — measured, not predicted"
      showQuickCreate={false}
    >
      {/* The posture, stated before any number is read. */}
      <Card className="mb-6 border-[var(--cs-info-soft)] bg-[var(--cs-info-bg)]">
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cs-info)]" />
          <div>
            <p className="text-sm font-bold text-[var(--cs-navy)]">Advisory — nothing here is blocking anyone today.</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text-secondary)]">
              The attribute rules (on shift? still employed? this child&rsquo;s key worker?) run alongside the enforced
              permission check on every child-record and confidential-HR request. They record where they would have
              refused. Each row below is access a member of staff has today and would lose if these rules were enforced.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p className="text-sm text-[var(--cs-text-muted)]">Reading the access record…</p>}
      {error && (
        <Card className="border-[var(--cs-risk-soft)] bg-[var(--cs-risk-bg)]">
          <CardContent className="pt-6 text-sm text-[var(--cs-risk)]">
            Couldn&rsquo;t read the access record. This page is read-only — nothing is affected.
          </CardContent>
        </Card>
      )}

      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Would be refused"
              value={s.evidenceCount}
              tone={s.evidenceCount > 0 ? "risk" : "neutral"}
              hint="Decided on the person's real shift, employment and key-worker links."
            />
            <Stat
              label="Staff affected"
              value={s.affectedUsers}
              tone={s.affectedUsers > 0 ? "risk" : "neutral"}
              hint="Distinct people who would hit a refusal."
            />
            <Stat
              label="Not evidence"
              value={s.fallbackCount}
              tone="muted"
              hint="Decided without a staff record — kept separate rather than counted."
            />
          </div>

          {/* The honest reading — deliberately given the same weight as the stats. */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-[var(--cs-teal-strong)]" /> What this does and doesn&rsquo;t tell you
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[var(--cs-text-secondary)]">{s.verdict}</p>
            </CardContent>
          </Card>

          {s.byReason.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-[var(--cs-warning)]" /> Why access would be refused
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-[var(--cs-text-secondary)]">
                  Each reason is a decision for you, not a fault to fix. &ldquo;Requires active shift&rdquo; asks whether
                  your staff should read a child&rsquo;s record off shift — writing up afterwards, preparing before, on call.
                </p>
                <ul className="space-y-2">
                  {s.byReason.map((r) => (
                    <li
                      key={r.reason}
                      className="flex items-center justify-between rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] px-4 py-2.5"
                    >
                      <span className="text-sm text-[var(--cs-text)]">{r.reason}</span>
                      <span className="text-sm font-bold tabular-nums text-[var(--cs-navy)]">{r.count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {s.rows.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-[var(--cs-teal-strong)]" /> The access itself
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--cs-border)] text-left text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">
                      <th className="py-2 pr-4 font-bold">When</th>
                      <th className="py-2 pr-4 font-bold">Who</th>
                      <th className="py-2 pr-4 font-bold">Reading</th>
                      <th className="py-2 pr-4 font-bold">Would be refused because</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r, i) => (
                      <tr key={i} className="border-b border-[var(--cs-border-subtle)] last:border-0">
                        <td className="py-2 pr-4 text-xs tabular-nums text-[var(--cs-text-muted)]">
                          {r.at.slice(11, 16)} · {r.at.slice(0, 10)}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="text-[var(--cs-text)]">{r.userId}</span>
                          <span className="ml-2 text-xs text-[var(--cs-text-muted)]">{r.role.replace(/_/g, " ")}</span>
                        </td>
                        <td className="py-2 pr-4 text-[var(--cs-text-secondary)]">
                          {r.resource.replace(/_/g, " ")} · {r.action}
                        </td>
                        <td className="py-2 pr-4 text-[var(--cs-text-secondary)]">
                          {r.reason}
                          {!r.contextReal && (
                            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]">
                              no staff record — not evidence
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardContent className="flex items-start gap-3 pt-6">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" />
              <p className="text-xs leading-relaxed text-[var(--cs-text-muted)]">
                This record is held in memory per server instance, so it empties on a restart and only accumulates
                durably once the database is connected. Judge it over a period of real use — a short or empty list is
                not the same as a safe one.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  );
}
