"use client";

// CARA — Per-staff Compliance & Absence card (staff profile overview).
// The staff-member analog of the per-child safeguarding card: a consolidated,
// at-a-glance verdict reusing the home-level staff-compliance + absence engines
// scoped to one person. Deterministic; deep-links to the home cockpits.

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { ShieldCheck, MessageCircle, Star, GraduationCap, Fingerprint, Activity, ArrowRight } from "lucide-react";
import { useStaffComplianceSummary } from "@/hooks/use-staff-compliance-summary";

const LEVEL_CHIP: Record<string, string> = {
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  attention: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  compliant: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
  ok: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
};
const LEVEL_BAR: Record<string, string> = {
  critical: "border-l-[var(--cs-risk)]",
  attention: "border-l-[var(--cs-warning)]",
  compliant: "border-l-[var(--cs-success)]",
  ok: "border-l-[var(--cs-success)]",
};

function Metric({ icon: Icon, label, value, bad }: { icon: React.ElementType; label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-text-gentle)]"}`} />
      <span className="text-[11px] text-[var(--cs-text-muted)]">{label}:</span>
      <span className={`text-[11px] font-semibold ${bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-navy)]"}`}>{value}</span>
    </div>
  );
}

function Inner({ staffId }: { staffId: string }) {
  const { data, isLoading } = useStaffComplianceSummary(staffId);
  const c = data?.data.compliance;
  const a = data?.data.absence;
  const worst = c?.level === "critical" || a?.level === "critical" ? "critical" : c?.level === "attention" || a?.level === "attention" ? "attention" : "compliant";
  const flags = [...(c?.flags ?? []), ...(a?.flags ?? [])];

  return (
    <Card className={`border-l-4 ${LEVEL_BAR[worst]}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-[var(--cs-teal)]" /> Compliance &amp; absence
        </CardTitle>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LEVEL_CHIP[worst]}`}>
          {worst === "critical" ? "Critical" : worst === "attention" ? "Needs attention" : "On track"}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">Loading…</p>
        ) : !c ? (
          <p className="py-2 text-sm text-[var(--cs-text-muted)]">No compliance data for this staff member.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <Metric icon={MessageCircle} label="Supervision" value={c.supervision.text} bad={c.supervision.overdue || c.supervision.due === null} />
              <Metric icon={Star} label="Appraisal" value={c.appraisal.text} bad={c.appraisal.overdue} />
              <Metric icon={GraduationCap} label="Training" value={c.training.text} bad={c.training.expired > 0 || c.training.outstanding > 0 || c.training.mandatory_total === 0} />
              <Metric icon={Fingerprint} label="DBS" value={c.dbs.text} bad={c.dbs.due_for_renewal || !c.dbs.issue_date} />
              <Metric icon={Activity} label="Absence (Bradford)" value={a ? String(a.bradford) : "—"} bad={!!a && a.level !== "ok"} />
              <Metric icon={Activity} label="Spells (12m)" value={a ? `${a.spells_12m} · ${a.days_12m}d` : "—"} />
            </div>
            {flags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {flags.map((f, i) => (
                  <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.severity === "critical" ? "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]" : "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]"}`}>{f.text}</span>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-4">
              <Link href="/staff-compliance" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">Team compliance <ArrowRight className="h-3 w-3" /></Link>
              <Link href="/workforce-absence" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">Absence patterns <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function StaffComplianceCard({ staffId }: { staffId: string }) {
  return (
    <CardErrorBoundary>
      <Inner staffId={staffId} />
    </CardErrorBoundary>
  );
}
