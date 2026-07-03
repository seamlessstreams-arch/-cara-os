"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED EVENT STREAM (detail page)
// One normalised, filterable timeline of everything that happens in the home.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Loader2, Info, ShieldCheck, AlertTriangle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventStream } from "@/hooks/use-event-stream";
import { eventTypeLabel } from "@/lib/event-stream/event-type-meta";
import { eventTypeIcon, eventTypeIconClass } from "@/lib/event-stream/event-type-icons";

const RISK_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  low: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
  medium: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  high: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-[var(--cs-warning-soft)]" },
  critical: { bg: "bg-red-100", text: "text-red-700", ring: "ring-[var(--cs-risk-soft)]" },
};

export default function EventStreamPage() {
  const { data, isLoading } = useEventStream();
  const intel = data?.data;
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const events = useMemo(() => {
    const all = intel?.events ?? [];
    return all.filter((e) =>
      (typeFilter === "all" || e.eventType === typeFilter) &&
      (riskFilter === "all" || e.riskLevel === riskFilter),
    );
  }, [intel, typeFilter, riskFilter]);

  const typeOptions = useMemo(() => Object.keys(intel?.overview.by_type ?? {}).sort(), [intel]);

  return (
    <PageShell
      title="Unified Event Stream"
      subtitle="Every domain event — incidents, logs, missing, medication, restraint, complaints, family contact, risk assessments, LAC reviews, notifiable events, behaviour plans and more — in one normalised timeline"
      icon={<Layers className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Unified Event Stream", sourceType: "general" }}
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
              Every record in Cara is projected into one canonical event shape — so this single timeline shows
              everything that happens in the home, each with a consistent risk level, the sign-off it needs, its links,
              and a rule-based Cara reading (themes, actions, compliance flags). <strong>Capture once, surface
              everywhere.</strong>
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Events" value={intel.overview.total} />
            <OverviewStat label="Pending approval" value={intel.overview.pending_approvals} tone={intel.overview.pending_approvals > 0 ? "amber" : "green"} />
            <OverviewStat label="High / critical" value={intel.overview.high_or_critical} tone={intel.overview.high_or_critical > 0 ? "red" : "green"} />
            <OverviewStat label="Compliance flags" value={intel.overview.compliance_flags} tone={intel.overview.compliance_flags > 0 ? "amber" : "green"} />
            <OverviewStat label="Critical" value={intel.overview.by_risk.critical} tone={intel.overview.by_risk.critical > 0 ? "red" : "green"} />
            <OverviewStat label="Event types" value={typeOptions.length} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All types</Chip>
            {typeOptions.map((t) => {
              const Icon = eventTypeIcon(t);
              return (
                <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                  <Icon className="h-3 w-3 shrink-0" /> {eventTypeLabel(t)} <span className="opacity-60">{intel.overview.by_type[t]}</span>
                </Chip>
              );
            })}
            <span className="mx-1 text-[var(--cs-text-gentle)]">|</span>
            {(["all", "critical", "high", "medium", "low"] as const).map((r) => (
              <Chip key={r} active={riskFilter === r} onClick={() => setRiskFilter(r)}>{r}</Chip>
            ))}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {events.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No events match these filters.</p>}
            {events.map((e) => {
              const risk = RISK_STYLES[e.riskLevel] ?? RISK_STYLES.low;
              const Icon = eventTypeIcon(e.eventType);
              return (
                <Card key={e.id} className={cn("overflow-hidden ring-1", risk.ring)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className={cn("h-3.5 w-3.5 shrink-0", eventTypeIconClass(e.eventType))} />
                            <Badge className="text-[10px] bg-[var(--cs-bg)] text-[var(--cs-text-secondary)] border">{eventTypeLabel(e.eventType)}</Badge>
                          </span>
                          <span className="font-medium">{e.summary}</span>
                        </CardTitle>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">
                          {e.occurredAt.slice(0, 10)} {e.occurredAt.slice(11, 16)}
                          {e.childId ? ` · ${e.childId}` : ""}{e.staffId ? ` · ${e.staffId}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className={cn("text-[10px] capitalize", risk.bg, risk.text)}>{e.riskLevel}</Badge>
                        {e.requiresApproval && e.approvalLevel && (
                          <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-0.5">
                            <ShieldCheck className="h-3 w-3" /> {e.approvalLevel.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {e.structuredTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {e.structuredTags.map((t, i) => (
                          <Badge key={i} className="text-[9px] bg-gray-50 text-gray-600 border">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {e.caraAnalysis && (
                      <div className="rounded-lg bg-[var(--cs-bg)] p-2.5 text-[11px] space-y-1">
                        <p className="font-semibold text-purple-700 flex items-center gap-1"><Brain className="h-3 w-3" /> Cara · confidence {Math.round(e.caraAnalysis.confidenceScore * 100)}%</p>
                        {e.caraAnalysis.themes.length > 0 && <p className="text-[var(--cs-text-muted)]">Themes: {e.caraAnalysis.themes.join(", ")}</p>}
                        {e.caraAnalysis.complianceFlags.map((f, i) => (
                          <p key={i} className="text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" />{f}</p>
                        ))}
                        {e.caraAnalysis.suggestedActions.length > 0 && (
                          <p className="text-[var(--cs-text-secondary)]">→ {e.caraAnalysis.suggestedActions[0]}</p>
                        )}
                        {e.caraAnalysis.missingInformation.length > 0 && (
                          <p className="text-[var(--cs-text-gentle)]">Missing: {e.caraAnalysis.missingInformation.join(", ")}</p>
                        )}
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] capitalize transition-colors border",
        active ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]",
      )}
    >
      {children}
    </button>
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
