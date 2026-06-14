"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RECORDING PRACTICE (detail page)
// Record quality rolled up by staff member — concrete supervision targets.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, Brain, Loader2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffRecordingPractice } from "@/hooks/use-staff-recording-practice";

const BAND_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  strong: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" },
  good: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  needs_improvement: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  poor: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800", low: "border-blue-200 bg-blue-50 text-blue-800",
};
const DIM_LABELS: Record<string, string> = {
  completeness: "Completeness", clarity: "Clarity", professionalLanguage: "Professional language",
  factuality: "Factuality", childCentredness: "Child's voice", riskRelevance: "Risk relevance",
};
function dimColor(v: number) { return v >= 85 ? "text-green-600" : v >= 70 ? "text-blue-600" : v >= 50 ? "text-amber-600" : "text-red-600"; }

export default function StaffRecordingPracticePage() {
  const { data, isLoading } = useStaffRecordingPractice();
  const intel = data?.data;

  return (
    <PageShell
      title="Staff Recording Practice"
      subtitle="Record quality by staff member — who records well, who needs coaching, and on exactly which dimension"
      icon={<UsersRound className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Staff Recording Practice", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              This rolls the quality of every record up to the staff member who wrote it — turning recording quality
              into named, concrete supervision targets. Each member has an average score, their weakest dimension and a
              top coaching theme drawn from their own records. Best used <em>with</em> the person, looking at real
              examples. Reg 33 (supervision), Reg 36 (records), Reg 13 (oversight).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OverviewStat label="Staff analysed" value={intel.overview.staff_analysed} />
            <OverviewStat label="Team average" value={`${intel.overview.home_avg_overall}/100`} tone={intel.overview.home_avg_overall >= 80 ? "green" : intel.overview.home_avg_overall >= 65 ? "neutral" : "amber"} />
            <OverviewStat label="Need support" value={intel.overview.needing_support} tone={intel.overview.needing_support > 0 ? "amber" : "green"} />
            <OverviewStat label="Strongest" value={intel.overview.strongest_staff ?? "—"} />
          </div>

          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed flex items-start gap-2", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{a.message}</div>
          ))}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">By staff member — weakest practice first</h2>
            {(intel.staff_profiles ?? []).length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No authored records to assess.</p>}
            {(intel.staff_profiles ?? []).map((p) => {
              const band = BAND_STYLES[p.band] ?? BAND_STYLES.good;
              return (
                <Card key={p.staff_id} className={cn("overflow-hidden ring-1", band.ring)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm">{p.staff_name}</CardTitle>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                          {p.records_authored} record{p.records_authored === 1 ? "" : "s"}
                          {p.poor_count > 0 ? ` · ${p.poor_count} poor` : ""}
                          {p.top_suggestion ? ` · focus: ${p.top_suggestion}` : ""}
                        </p>
                      </div>
                      <Badge className={cn("text-[11px] capitalize shrink-0", band.bg, band.text)}>{p.avg_overall}/100 · {p.band.replace("_", " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                      {(Object.entries(DIM_LABELS) as [string, string][]).map(([dim, label]) => {
                        const v = (p.dimension_averages as any)[dim] as number;
                        return (
                          <div key={dim} className="flex items-center justify-between text-[11px]">
                            <span className={cn(dim === p.weakest_dimension ? "font-semibold text-amber-700" : "text-[var(--cs-text-muted)]")}>{label}</span>
                            <span className={cn("tabular-nums font-medium", dimColor(v))}>{v}</span>
                          </div>
                        );
                      })}
                    </div>
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
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-xl font-bold tabular-nums truncate", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
