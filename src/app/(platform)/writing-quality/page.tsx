"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WRITING QUALITY INSIGHTS
//
// Manager reporting surface for the writing assistant audit trail. Shows what
// suggestions staff accepted or ignored, broken down by person and category.
// Gate: USE_CARA_INTELLIGENCE. Deterministic — no model calls.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X, TrendingUp, Users, FileText, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn, formatDate } from "@/lib/utils";
import type { IssueType } from "@/lib/writing-assistant/types";
import { currentUserId } from "@/lib/auth/current-user";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditStats { total: number; accepted: number; ignored: number; acceptanceRate: number; days: number; }
interface StaffRow { userId: string; name: string; total: number; accepted: number; ignored: number; rate: number; }
interface RecentEvent { id: string; staffName: string; action: "accepted" | "ignored"; issue_type: IssueType; original_text: string; replacement_text?: string; record_type?: string; created_at: string; }
interface AuditData { stats: AuditStats; byIssueType: Record<string, { accepted: number; ignored: number }>; byStaff: StaffRow[]; recent: RecentEvent[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const ISSUE_LABELS: Partial<Record<IssueType, string>> = {
  spelling:               "Spelling",
  grammar:                "Grammar",
  punctuation:            "Punctuation",
  "safeguarding-quality": "Recording quality",
  "writing-to-child":     "Writing to child",
  tone:                   "Tone",
  "professional-language":"Professional language",
  clarity:                "Clarity",
  chronology:             "Chronology",
  "policy-language":      "Policy language",
};

const RECORD_LABELS: Record<string, string> = {
  daily_log:        "Daily log",
  incident:         "Incident",
  behaviour_log:    "Behaviour log",
  handover:         "Handover",
  return_interview: "Return interview",
  sanction_reward:  "Sanctions & rewards",
  "1to1_keywork":   "1:1 key-work",
};

function useAuditData(days: number) {
  return useQuery<AuditData>({
    queryKey: ["wa-audit", days],
    queryFn: async () => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (typeof window !== "undefined") {
        const id = currentUserId();
        headers["x-user-id"] = id;
        headers["x-cs-user-id"] = id;
      }
      const res = await fetch(`/api/writing-assistant/audit?days=${days}`, { headers });
      if (!res.ok) throw new Error("Failed to load audit data");
      const json = (await res.json()) as { data: AuditData };
      return json.data;
    },
    staleTime: 30_000,
  });
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ icon: Icon, label, value, sub, colour }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; colour: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-4">
      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", colour)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-2xl font-bold text-[var(--cs-navy)]">{value}</p>
      <p className="text-sm font-medium text-[var(--cs-text)]">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "All",     value: 365 },
];

export default function WritingQualityPage() {
  const [days, setDays] = useState(7);
  const { data, isLoading } = useAuditData(days);

  const stats = data?.stats;
  const byStaff = data?.byStaff ?? [];
  const byIssueType = data?.byIssueType ?? {};
  const recent = data?.recent ?? [];

  // Sort issue types by total activity desc
  const issueRows = Object.entries(byIssueType)
    .map(([type, counts]) => ({ type: type as IssueType, ...counts, total: counts.accepted + counts.ignored }))
    .sort((a, b) => b.total - a.total);

  return (
    <PageShell
      title="Writing Quality"
      subtitle="How the team is engaging with Cara's care-recording assistant — accepts, ignores, and patterns."
      icon={<Sparkles className="h-5 w-5 text-[var(--cs-teal,#0d9488)]" />}
    >
      {/* Period selector */}
      <div className="mb-6 flex items-center gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDays(opt.value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              days === opt.value
                ? "border-[var(--cs-navy)] bg-[var(--cs-navy)] text-white"
                : "border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] text-[var(--cs-text)] hover:border-[var(--cs-navy)]",
            )}
          >
            {opt.label}
          </button>
        ))}
        {stats && (
          <span className="ml-2 text-xs text-[var(--cs-text-muted)]">{stats.total} events</span>
        )}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-[var(--cs-text-muted)]">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatChip
                icon={Sparkles}
                label="Suggestions shown"
                value={stats.total}
                sub="total in period"
                colour="bg-[var(--cs-teal,#0d9488)]"
              />
              <StatChip
                icon={Check}
                label="Accepted"
                value={stats.accepted}
                sub={`${stats.acceptanceRate}% acceptance rate`}
                colour="bg-emerald-500"
              />
              <StatChip
                icon={X}
                label="Ignored"
                value={stats.ignored}
                sub="staff chose own wording"
                colour="bg-slate-400"
              />
              <StatChip
                icon={Users}
                label="Staff active"
                value={byStaff.length}
                sub="using the assistant"
                colour="bg-[var(--cs-navy,#1e293b)]"
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Staff breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-navy)]">
                  <Users className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
                  Staff engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {byStaff.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-[var(--cs-text-muted)]">No activity in this period.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--cs-border-subtle)] text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-secondary)]">
                        <th className="px-4 py-2 text-left">Staff member</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-right">Accepted</th>
                        <th className="px-4 py-2 text-right">Ignored</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byStaff.map((row) => (
                        <tr key={row.userId} className="border-b border-[var(--cs-border-subtle)] last:border-0 hover:bg-[var(--cs-surface)]">
                          <td className="px-4 py-2.5 font-medium text-[var(--cs-text)]">{row.name}</td>
                          <td className="px-4 py-2.5 text-right text-[var(--cs-text-muted)]">{row.total}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600">{row.accepted}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400">{row.ignored}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                              row.rate >= 70 ? "bg-emerald-50 text-emerald-700" :
                              row.rate >= 40 ? "bg-amber-50 text-amber-700" :
                              "bg-slate-100 text-slate-600",
                            )}>
                              {row.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Issue type breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-navy)]">
                  <TrendingUp className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
                  Suggestions by category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {issueRows.length === 0 ? (
                  <p className="text-sm text-[var(--cs-text-muted)]">No activity in this period.</p>
                ) : issueRows.map((row) => {
                  const pct = row.total > 0 ? Math.round((row.accepted / row.total) * 100) : 0;
                  return (
                    <div key={row.type}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm text-[var(--cs-text)]">
                          {ISSUE_LABELS[row.type] ?? row.type}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[var(--cs-text-muted)]">
                          <span className="text-emerald-600">{row.accepted} accepted</span>
                          <span>·</span>
                          <span>{row.ignored} ignored</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Recent events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-navy)]">
                <Clock className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
                Recent events (last 50)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recent.length === 0 ? (
                <p className="px-6 py-4 text-sm text-[var(--cs-text-muted)]">No events in this period.</p>
              ) : (
                <div className="divide-y divide-[var(--cs-border-subtle)]">
                  {recent.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--cs-surface)]">
                      <span className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        ev.action === "accepted" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400",
                      )}>
                        {ev.action === "accepted" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-sm font-medium text-[var(--cs-text)]">{ev.staffName}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {ISSUE_LABELS[ev.issue_type] ?? ev.issue_type}
                          </Badge>
                          {ev.record_type && (
                            <span className="text-xs text-[var(--cs-text-muted)]">
                              {RECORD_LABELS[ev.record_type] ?? ev.record_type}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--cs-text-muted)] truncate">
                          <span className="italic">&ldquo;{ev.original_text}&rdquo;</span>
                          {ev.action === "accepted" && ev.replacement_text && (
                            <> → <span className="text-emerald-600">&ldquo;{ev.replacement_text}&rdquo;</span></>
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--cs-text-muted)]">
                        {formatDate(ev.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Governance note */}
          <p className="text-xs text-[var(--cs-text-muted)]">
            <Sparkles className="mr-1 inline h-3 w-3 text-[var(--cs-teal,#0d9488)]" />
            Cara never auto-applies suggestions — every change shown here was an active choice by the staff member.
            Safeguarding-sensitive suggestions are flagged for human judgement and never altered automatically.
          </p>
        </div>
      )}
    </PageShell>
  );
}
