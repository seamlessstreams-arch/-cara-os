"use client";

// CARA HQ — customer detail (status, usage, break-glass audit)

import { use, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HqBoundaryNote, HqStat, HqStatusBadge } from "@/components/hq/hq-bits";
import {
  useHqCustomer,
  useRecordBreakGlass,
  useRevokeBreakGlass,
  useSetCustomerStatus,
} from "@/hooks/use-hq";
import { ArrowLeft } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]";
const labelCls = "mb-1 block text-xs font-semibold text-[var(--cs-text-secondary)]";

export default function HqCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useHqCustomer(id);
  const setStatus = useSetCustomerStatus(id);
  const breakGlass = useRecordBreakGlass(id);
  const revoke = useRevokeBreakGlass(id);
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState(4);

  const c = data?.customer;

  return (
    <PageShell
      title={c?.name ?? "Customer"}
      subtitle="Customer record — status, activity and break-glass audit."
      showQuickCreate={false}
    >
      <div className="space-y-6">
        <Link
          href="/hq/customers"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-teal)] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All customers
        </Link>

        <HqBoundaryNote />

        {error && (
          <Card>
            <CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">
              {(error as Error).message}
            </CardContent>
          </Card>
        )}
        {isLoading && (
          <Card>
            <CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Loading…</CardContent>
          </Card>
        )}

        {c && data && (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-sm">Account</CardTitle>
                  <HqStatusBadge status={c.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-[var(--cs-text-muted)]">Plan:</span>{" "}
                    <span className="font-semibold capitalize text-[var(--cs-navy)]">{c.plan}</span>
                  </p>
                  <p>
                    <span className="text-[var(--cs-text-muted)]">First home:</span>{" "}
                    <span className="font-semibold text-[var(--cs-navy)]">{c.first_home_name ?? "—"}</span>
                  </p>
                  <p>
                    <span className="text-[var(--cs-text-muted)]">Manager:</span>{" "}
                    <span className="font-semibold text-[var(--cs-navy)]">
                      {c.primary_contact_name ?? "—"}
                    </span>
                    {c.primary_contact_email && (
                      <span className="block text-xs text-[var(--cs-text-gentle)]">{c.primary_contact_email}</span>
                    )}
                  </p>
                  <p>
                    <span className="text-[var(--cs-text-muted)]">Customer since:</span>{" "}
                    <span className="font-semibold text-[var(--cs-navy)]">
                      {new Date(c.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[var(--cs-border-subtle)] pt-3">
                  {(["active", "suspended", "churned"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus.mutate(s)}
                      disabled={setStatus.isPending || c.status === s}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        c.status === s
                          ? "bg-[var(--cs-navy)] text-white"
                          : "border border-[var(--cs-border)] text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
                      } disabled:opacity-60`}
                    >
                      {s}
                    </button>
                  ))}
                  <span className="self-center text-[11px] text-[var(--cs-text-gentle)]">
                    Status changes are logged to the usage trail.
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <HqStat label="Activity (24h)" value={data.usage.events_24h} hint="recorded actions" />
              <HqStat label="Activity (30d)" value={data.usage.events_30d} />
              <HqStat
                label="AI cost (30d)"
                value={`£${data.ai.cost_30d_gbp.toFixed(2)}`}
                hint={`${data.ai.calls_30d} calls · estimated`}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Break-glass (support access audit)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[var(--cs-text-muted)]">
                  Records an auditable, time-boxed request. It does <strong>not</strong> open
                  children&apos;s records — record-level support access requires the separate
                  DPO-approved process.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    breakGlass.mutate(
                      { reason, hours },
                      { onSuccess: () => setReason("") },
                    );
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className={labelCls}>Reason (auditable)</label>
                    <textarea
                      required
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why support access is needed…"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Time-box (hours, max 72)</label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      className={`${inputCls} w-32`}
                    />
                  </div>
                  {breakGlass.isError && (
                    <p className="text-sm text-[var(--cs-warning)]">{(breakGlass.error as Error).message}</p>
                  )}
                  <button
                    type="submit"
                    disabled={breakGlass.isPending}
                    className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--cs-navy)] hover:bg-[var(--cs-surface)] disabled:opacity-50"
                  >
                    {breakGlass.isPending ? "Recording…" : "Record break-glass request"}
                  </button>
                </form>

                {data.break_glass.recent.length > 0 && (
                  <div className="border-t border-[var(--cs-border-subtle)] pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
                      Grant history
                    </p>
                    <ul className="space-y-2">
                      {data.break_glass.recent.map((g) => {
                        const open = !g.revoked_at && Date.parse(g.expires_at) > Date.now();
                        return (
                          <li
                            key={g.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--cs-surface)] px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="text-[var(--cs-text-secondary)]">{g.reason}</p>
                              <p className="text-[11px] text-[var(--cs-text-gentle)]">
                                {g.admin_label} · {new Date(g.granted_at).toLocaleString("en-GB")} →
                                expires {new Date(g.expires_at).toLocaleString("en-GB")}
                                {g.revoked_at && " · revoked"}
                              </p>
                            </div>
                            {open ? (
                              <button
                                onClick={() => revoke.mutate(g.id)}
                                disabled={revoke.isPending}
                                className="rounded-lg bg-[var(--cs-warning-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--cs-warning)] hover:opacity-80 disabled:opacity-50"
                              >
                                Revoke now
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-[var(--cs-text-gentle)]">
                                {g.revoked_at ? "Revoked" : "Expired"}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageShell>
  );
}
