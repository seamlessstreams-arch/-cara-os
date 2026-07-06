"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask CARA Governance dashboard (§24)
// Manager/RI cockpit over the Ask CARA audit trail + external-AI declarations.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/auth-context";
import { useAskCaraGovernance } from "@/hooks/use-ask-cara-governance";
import { ShieldCheck, Loader2, Lock, MessageSquare, AlertTriangle, ClipboardList, PoundSterling } from "lucide-react";

const MANAGEMENT = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);

function Stat({ label, value, sub, tone = "slate", icon: Icon }: { label: string; value: React.ReactNode; sub?: string; tone?: string; icon: React.ElementType }) {
  const tones: Record<string, string> = {
    slate: "text-slate-700", emerald: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700", teal: "text-teal-700",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className={`text-2xl font-bold ${tones[tone]}`}>{value}</div>
        {sub && <p className="mt-0.5 text-[12px] text-slate-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function GovernancePage() {
  const { currentRole } = useAuthContext();
  const isManager = MANAGEMENT.has(String(currentRole));
  const { data, isLoading } = useAskCaraGovernance(String(currentRole));
  const g = data?.data;

  if (!isManager) {
    return (
      <PageShell title="Ask CARA Governance" subtitle="Management oversight of Ask CARA usage">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <Lock className="h-4 w-4" /> This cockpit is for managers and the Responsible Individual.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Ask CARA Governance" subtitle="Usage, safety, declarations and deterministic-only compliance — the defensible audit picture">
      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading governance data…</div>
        )}

        {g && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Ask CARA requests" value={g.usage.total} icon={MessageSquare} sub="all deterministic" />
              <Stat label="Deterministic-only" value={`${g.deterministic.compliancePct}%`} tone="emerald" icon={ShieldCheck} sub={`${g.deterministic.deterministicOnly} of ${g.deterministic.total}`} />
              <Stat label="External calls avoided" value={g.costAvoidance.externalCallsAvoided} tone="teal" icon={PoundSterling} sub={`≈ £${g.costAvoidance.estimatedCreditsSavedGbp} saved (est.)`} />
              <Stat label="Unsafe asks refused" value={g.safety.prohibitedAttempts} tone={g.safety.prohibitedAttempts > 0 ? "rose" : "slate"} icon={AlertTriangle} sub="prohibited-request classifier" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Declarations" value={g.declarations.total} icon={ClipboardList} sub="external AI declared" />
              <Stat label="Awaiting review" value={g.declarations.pendingReview} tone={g.declarations.pendingReview > 0 ? "amber" : "slate"} icon={ClipboardList} sub="manager review queue" />
              <Stat label="Confidential data entered" value={g.declarations.confidentialDataEntered} tone={g.declarations.confidentialDataEntered > 0 ? "rose" : "slate"} icon={AlertTriangle} sub="declared by staff" />
            </div>

            {/* Usage by intent */}
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 text-sm font-bold text-slate-800">What staff use Ask CARA for</h3>
                {g.usage.byIntent.length === 0 ? (
                  <p className="text-sm text-slate-400">No Ask CARA activity recorded on this instance yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {g.usage.byIntent.slice(0, 12).map((row) => {
                      const pct = g.usage.total ? Math.round((row.count / g.usage.total) * 100) : 0;
                      return (
                        <div key={row.intent} className="flex items-center gap-2">
                          <span className="w-40 shrink-0 truncate text-[12px] text-slate-600">{row.intent.replace(/_/g, " ")}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-slate-500">{row.count} · {pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Link href="/ask-cara/declare" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Declaration review queue →</Link>
              <Link href="/ask-cara" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Open Ask CARA →</Link>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400">
              Every Ask CARA answer is deterministic and logged with hashed input/output — no child, staff or family information is stored raw, and none is sent to an external AI provider. Cost saving is a conservative estimate (one avoided external call per deterministic answer).
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
