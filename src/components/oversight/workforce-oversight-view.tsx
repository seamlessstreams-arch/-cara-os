"use client";

import { useState } from "react";
import {
  Users, ShieldCheck, Siren, FileText, AlertTriangle, Download, Loader2, CheckCircle2, MessageSquareText, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkforceOversight, fetchWorkforceEvidence } from "@/hooks/use-workforce-oversight";

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div>
      <p className={cn("text-2xl font-bold", tone === "bad" ? "text-[var(--cs-avisaar-coral)]" : tone === "warn" ? "text-amber-600" : "text-[var(--cs-navy)]")}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)]">{label}</p>
    </div>
  );
}

export function WorkforceOversightView() {
  const { data, isLoading } = useWorkforceOversight();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const exportPack = async () => {
    setExporting(true);
    try {
      const pack = await fetchWorkforceEvidence();
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workforce-evidence-${pack.home_id}-${pack.generated_at.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading || !data) {
    return <div className="p-8 text-center text-sm text-[var(--cs-text-muted)]">Loading oversight…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Flags */}
      {data.flags.length > 0 && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)] mb-2">Needs attention</p>
          <ul className="space-y-1.5">
            {data.flags.map((f, i) => (
              <li key={i} className={cn("flex items-center gap-2 text-sm", f.severity === "critical" ? "text-[var(--cs-avisaar-coral)]" : f.severity === "attention" ? "text-amber-700" : "text-[var(--cs-text-secondary)]")}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{f.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)] mb-3"><Users className="h-4 w-4 text-[var(--cs-teal)]" />Attendance & presence</p>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="On shift now" value={data.attendance.currently_on_shift} />
            <Metric label="Clock-ins today" value={data.attendance.clock_ins_today} />
            <Metric label="Late today" value={data.attendance.late_today} tone={data.attendance.late_today ? "warn" : undefined} />
            <Metric label="Verified" value={data.presence.verified} tone="ok" />
            <Metric label="Unverified" value={data.presence.unverified} tone={data.presence.unverified ? "warn" : undefined} />
            <Metric label="Checks" value={data.presence.total} />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)] mb-3"><MessageSquareText className="h-4 w-4 text-[var(--cs-teal)]" />Message governance</p>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Converted" value={data.governance.conversions_total} />
            <Metric label="Holds" value={data.governance.active_investigation_holds} tone={data.governance.active_investigation_holds ? "warn" : undefined} />
            <Metric label="Retained" value={data.governance.retained_non_routine} />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)] mb-3"><Siren className="h-4 w-4 text-[var(--cs-avisaar-coral)]" />Emergency response</p>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Raised" value={data.emergencies.raised} />
            <Metric label="Active" value={data.emergencies.active} tone={data.emergencies.active ? "bad" : undefined} />
            <Metric label="Resolved" value={data.emergencies.resolved} tone="ok" />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--cs-navy)] mb-3"><ShieldCheck className="h-4 w-4 text-[var(--cs-teal)]" />Safe staffing now</p>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="On shift" value={data.staffing.on_shift_count} />
            <Metric label="Minimum" value={data.staffing.minimum_required} />
            <Metric label="Status" value={data.staffing.severity} tone={data.staffing.severity === "critical" ? "bad" : data.staffing.severity === "high" ? "warn" : "ok"} />
          </div>
        </div>
      </div>

      {/* Evidence pack export */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]"><FileText className="h-4 w-4 text-[var(--cs-teal)]" />Evidence pack</p>
          <p className="text-xs text-[var(--cs-text-muted)]">Audit-ready summary (Reg 31/36/40/45-aligned) over the last {data.period_days} days.</p>
        </div>
        <Button onClick={exportPack} disabled={exporting} className="gap-1.5 shrink-0">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : exported ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {exported ? "Downloaded" : "Export"}
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--cs-text-muted)]">
        <Lock className="h-3 w-3" />Read-only oversight. Presence stores no coordinates; emergency broadcasts carry no sensitive detail.
      </p>
    </div>
  );
}
