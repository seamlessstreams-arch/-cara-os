"use client";

// CARA — Staff Compliance Cockpit: every active staff member's compliance at a glance.

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { PrintButton } from "@/components/common/print-button";
import { api } from "@/hooks/use-api";
import { ShieldCheck, MessageCircle, Star, GraduationCap, Fingerprint, ArrowRight, AlertTriangle } from "lucide-react";
import type { StaffComplianceLevel, StaffComplianceRow } from "@/lib/engines/staff-compliance-engine";
import type { StaffComplianceResult } from "@/lib/engines/staff-compliance-engine";

const LEVEL_BAR: Record<StaffComplianceLevel, string> = {
  critical: "border-l-[var(--cs-risk)]",
  attention: "border-l-[var(--cs-warning)]",
  compliant: "border-l-[var(--cs-success)]",
};
const LEVEL_CHIP: Record<StaffComplianceLevel, string> = {
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  attention: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  compliant: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
};
const LEVEL_LABEL: Record<StaffComplianceLevel, string> = { critical: "Critical", attention: "Attention", compliant: "Compliant" };

function Metric({ icon: Icon, label, value, bad }: { icon: React.ElementType; label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-text-gentle)]"}`} />
      <span className="text-[11px] text-[var(--cs-text-muted)]">{label}:</span>
      <span className={`text-[11px] font-semibold ${bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-navy)]"}`}>{value}</span>
    </div>
  );
}

function StaffRow({ r }: { r: StaffComplianceRow }) {
  return (
    <Link href={`/staff/${r.staff_id}`} className={`block rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3 border-l-4 ${LEVEL_BAR[r.level]} transition-shadow hover:shadow-[var(--cs-shadow-soft)]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--cs-navy)]">{r.full_name}</span>
            <span className="text-[11px] text-[var(--cs-text-gentle)]">{r.job_title}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            <Metric icon={MessageCircle} label="Supervision" value={r.supervision.text} bad={r.supervision.overdue || r.supervision.due === null} />
            <Metric icon={Star} label="Appraisal" value={r.appraisal.text} bad={r.appraisal.overdue} />
            <Metric icon={GraduationCap} label="Training" value={r.training.text} bad={r.training.expired > 0 || r.training.outstanding > 0 || r.training.mandatory_total === 0} />
            <Metric icon={Fingerprint} label="DBS" value={r.dbs.text} bad={r.dbs.due_for_renewal || !r.dbs.issue_date} />
          </div>
          {r.flags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {r.flags.map((f, i) => (
                <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.severity === "critical" ? "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]" : "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]"}`}>{f.text}</span>
              ))}
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LEVEL_CHIP[r.level]}`}>{LEVEL_LABEL[r.level]}</span>
      </div>
    </Link>
  );
}

export default function StaffCompliancePage() {
  // Query config inlined from use-staff-compliance hook
  const { data: resp, isLoading, error } = useQuery({
    queryKey: ["staff-compliance"],
    queryFn: () => api.get<{ data: StaffComplianceResult }>("/staff-compliance"),
    staleTime: 30_000,
  });
  const o = resp?.data;

  return (
    <PageShell
      title="Staff Compliance"
      subtitle={o ? `${o.date} · ${o.headline}` : "Supervision, appraisal, training and DBS compliance across the team."}
      showQuickCreate={false}
      actions={o ? <PrintButton title="Staff Compliance" subtitle={o.headline} targetId="staff-compliance-print" /> : undefined}
    >
      <div className="space-y-6">
        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load compliance: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Loading the team picture…</CardContent></Card>}

        {o && (
          <div id="staff-compliance-print" className="space-y-6">
            {/* Summary */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Team", value: o.total_staff, tone: "navy" },
                { label: "Compliant", value: o.summary.fully_compliant, tone: "success" },
                { label: "Attention", value: o.summary.needs_attention, tone: "warning" },
                { label: "Critical", value: o.summary.critical, tone: "risk" },
                { label: "Supervision overdue", value: o.summary.supervision_overdue, tone: "risk" },
                { label: "Training expired", value: o.summary.training_expired_staff, tone: "risk" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{c.label}</p>
                  <p className={`mt-0.5 text-2xl font-extrabold tracking-tight ${c.tone === "risk" && c.value > 0 ? "text-[var(--cs-risk)]" : c.tone === "warning" && c.value > 0 ? "text-[var(--cs-warning)]" : c.tone === "success" ? "text-[var(--cs-success)]" : "text-[var(--cs-navy)]"}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Staff rows */}
            <CardErrorBoundary>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--cs-teal)]" />
                  <CardTitle className="text-sm">Team — worst first</CardTitle>
                </CardHeader>
                <CardContent>
                  {o.rows.length === 0 ? (
                    <p className="py-2 text-sm text-[var(--cs-text-muted)]">No active staff to show.</p>
                  ) : (
                    <div className="space-y-2">
                      {o.rows.map((r) => <StaffRow key={r.staff_id} r={r} />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardErrorBoundary>

            <p className="flex items-start gap-2 text-xs text-[var(--cs-text-gentle)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Compliance is drawn from each staff record (supervision/appraisal due dates, DBS) and their mandatory training. A missing due date reads &quot;not scheduled&quot;, not compliant. It supports professional judgement — managers remain responsible for workforce decisions.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
