"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATED EVIDENCE BANK (detail page)
// Coverage across the 14 Ofsted evidence categories, built from the event stream.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, Brain, Loader2, Info, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvidenceBank } from "@/hooks/use-evidence-bank";

const STATUS_META: Record<string, { label: string; bg: string; text: string; ring: string; icon: React.ReactNode }> = {
  well_evidenced: { label: "well evidenced", bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200", icon: <CheckCircle2 className="h-4 w-4 text-green-600" /> },
  thin: { label: "thin", bg: "bg-amber-100", text: "text-amber-700", ring: "ring-[var(--cs-warning-soft)]", icon: <CircleDashed className="h-4 w-4 text-amber-600" /> },
  gap: { label: "gap", bg: "bg-red-100", text: "text-red-700", ring: "ring-[var(--cs-risk-soft)]", icon: <AlertTriangle className="h-4 w-4 text-red-600" /> },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800", low: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function EvidenceBankPage() {
  const { data, isLoading } = useEvidenceBank();
  const intel = data?.data;

  return (
    <PageShell
      title="Automated Evidence Bank"
      subtitle="The home's evidence across all 14 Ofsted categories — assembled automatically from day-to-day events, with gaps surfaced"
      icon={<Archive className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Automated Evidence Bank", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Every event is automatically mapped to the Ofsted evidence categories it contributes to — so the evidence
              pack builds itself as staff record their day-to-day work. A <strong>gap</strong> usually means the work is
              happening but not being captured as structured events. Close gaps by recording the relevant activity, not by
              manufacturing evidence. Reg 44 / Reg 45, Reg 13.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OverviewStat label="Coverage" value={`${intel.overview.coverage_rate}%`} tone={intel.overview.coverage_rate >= 80 ? "green" : "amber"} />
            <OverviewStat label="Well evidenced" value={intel.overview.well_evidenced} tone="green" />
            <OverviewStat label="Thin" value={intel.overview.thin} tone={intel.overview.thin > 0 ? "amber" : "green"} />
            <OverviewStat label="Gaps" value={intel.overview.gaps} tone={intel.overview.gaps > 0 ? "red" : "green"} />
          </div>

          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed flex items-start gap-2", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{a.message}</div>
          ))}

          <div className="grid sm:grid-cols-2 gap-3">
            {(intel.categories ?? []).map((c) => {
              const s = STATUS_META[c.status] ?? STATUS_META.gap;
              return (
                <Card key={c.category} className={cn("overflow-hidden ring-1", s.ring)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 capitalize">{s.icon} {c.category}</CardTitle>
                      <Badge className={cn("text-[10px]", s.bg, s.text)}>{s.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1.5">
                    <p className="text-[var(--cs-text-muted)]">
                      {c.count_90d} event{c.count_90d === 1 ? "" : "s"} in 90d · {c.count_30d} recent
                      {c.last_evidenced ? ` · last ${c.last_evidenced}` : " · none recorded"}
                    </p>
                    {c.top_event_types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.top_event_types.map((t, i) => <Badge key={i} className="text-[9px] bg-gray-50 text-gray-600 border">{t.type.replace(/_/g, " ")} {t.count}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function OverviewStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "red" | "amber" | "green" | "gray" }) {
  const toneCls: Record<string, string> = { neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400" };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
