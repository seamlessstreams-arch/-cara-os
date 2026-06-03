"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT ROUTING (detail page)
// Where each event flows, and the human-gated queue of external notifications.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, Brain, Loader2, Info, Send, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventRouting } from "@/hooks/use-event-routing";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  auto_routed: { bg: "bg-green-100", text: "text-green-700", label: "auto-routed" },
  pending_approval: { bg: "bg-amber-100", text: "text-amber-700", label: "pending approval" },
  unrouted: { bg: "bg-gray-100", text: "text-gray-600", label: "unrouted" },
};

export default function EventRoutingPage() {
  const { data, isLoading } = useEventRouting();
  const intel = data?.data;
  const [filter, setFilter] = useState<string>("all");

  const plans = useMemo(() => {
    const all = intel?.plans ?? [];
    if (filter === "external") return all.filter((p) => p.external_apis.length > 0);
    if (filter === "all") return all;
    return all.filter((p) => p.status === filter);
  }, [intel, filter]);

  return (
    <PageShell
      title="Event Routing"
      subtitle="How each event is linked and surfaced across the platform — with every external notification gated behind human approval"
      icon={<Route className="h-5 w-5" />}
      showQuickCreate={false}
      ariaContext={{ pageTitle: "Event Routing", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Each event is matched against routing rules to decide where it surfaces — child profile, risk assessment,
              care plan, manager inbox, evidence banks, the notification centre. In-app surfaces route automatically
              (<strong>capture once, surface everywhere</strong>). Anything that would leave the building — an external
              notification to <strong>Ofsted, the police, the LADO or the Virtual School</strong> — is only ever
              <em> planned</em> here and is <strong>always held for a human to approve</strong>, so a statutory
              notification is never missed and never sent in error.
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <OverviewStat label="Events routed" value={intel.overview.total_events} />
            <OverviewStat label="Auto-routed" value={intel.overview.auto_routed} tone="green" />
            <OverviewStat label="Pending approval" value={intel.overview.pending_approval} tone={intel.overview.pending_approval > 0 ? "amber" : "green"} />
            <OverviewStat label="External pending" value={intel.overview.external_notifications_pending} tone={intel.overview.external_notifications_pending > 0 ? "red" : "green"} />
            <OverviewStat label="Unrouted" value={intel.overview.unrouted} tone={intel.overview.unrouted > 0 ? "amber" : "green"} />
          </div>

          {/* External notification queue */}
          {Object.keys(intel.overview.external_api_counts ?? {}).length > 0 && (
            <Card className="overflow-hidden ring-1 ring-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700"><Send className="h-4 w-4" /> External notifications — awaiting human approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(intel.overview.external_api_counts).sort((a, b) => b[1] - a[1]).map(([api, count], i) => (
                    <Badge key={i} className="text-[11px] bg-red-100 text-red-700 border-red-200">{api} ×{count}</Badge>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--cs-text-muted)]">These are planned from the routing rules but never sent automatically — approve each one to dispatch.</p>
              </CardContent>
            </Card>
          )}

          {/* Insights + alerts */}
          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}>{a.message}</div>
          ))}

          {/* Destination matrix */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Destination matrix</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {Object.entries(intel.overview.destination_counts ?? {}).sort((a, b) => b[1] - a[1]).map(([dest, count], i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-36 truncate text-[var(--cs-text-secondary)]">{dest}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand/60" style={{ width: `${Math.min(100, (count / (intel.overview.total_events || 1)) * 100)}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Per-event plans */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "pending_approval", "external", "auto_routed", "unrouted"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                    filter === f ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]")}>
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
            {plans.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No events match this filter.</p>}
            {plans.slice(0, 60).map((p) => {
              const s = STATUS_STYLES[p.status] ?? STATUS_STYLES.unrouted;
              return (
                <div key={p.event_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge className="text-[9px] bg-[var(--cs-bg)] text-[var(--cs-text-secondary)] border">{p.event_type}</Badge>
                      <span className="truncate text-[var(--cs-text-secondary)]">{p.summary}</span>
                    </div>
                    <Badge className={cn("text-[9px] shrink-0", s.bg, s.text)}>{s.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.destinations.map((dst, i) => <Badge key={i} className="text-[9px] bg-gray-50 text-gray-600 border">{dst}</Badge>)}
                    {p.external_apis.map((api, i) => <Badge key={`e${i}`} className="text-[9px] bg-red-50 text-red-700 border-red-200 flex items-center gap-0.5"><Send className="h-2.5 w-2.5" />{api}</Badge>)}
                  </div>
                </div>
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
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
