"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HANDOVER PROMPT
// Live data from supervision intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, ArrowRightLeft, Brain, ChevronRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupervisionIntelligence } from "@/hooks/use-supervision-intelligence";

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// Theme-aware stat tile. Uses --cs tokens (which the dark reskin overrides) so
// the number and label stay readable in both the light and dark themes —
// raw bg-green-50 / text-slate-600 do not, and the dark shim saturated them.
function StatTile({ value, label, tone = "neutral" }: { value: React.ReactNode; label: string; tone?: "neutral" | "success" | "warning" }) {
  const styles =
    tone === "success" ? "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]"
    : tone === "warning" ? "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]"
    : "border-[--cs-border] bg-[--cs-surface] text-[--cs-text]";
  return (
    <div className={cn("text-center rounded-lg border p-2", styles)}>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-[--cs-text-muted]">{label}</p>
    </div>
  );
}

export function HandoverPrompt() {
  const { data, isLoading } = useSupervisionIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-[--cs-border]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[--cs-text-muted]" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  const insights = d?.insights ?? [];
  const alerts = d?.alerts ?? [];
  const overdue = d?.overview?.supervisions_overdue ?? 0;

  return (
    <Card className="overflow-hidden border-[--cs-border]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-[--cs-text-muted]" />
            <span className="text-[--cs-text]">Handover Prompt</span>
          </CardTitle>
          <Link href="/supervision" className="text-xs text-[--cs-text-muted] hover:text-[--cs-text] hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <StatTile value={d?.overview?.total_staff ?? 0} label="Staff" />
          <StatTile value={d?.overview?.supervisions_completed_90d ?? 0} label="Done 90d" tone="success" />
          <StatTile value={overdue} label="Overdue" tone={overdue > 0 ? "warning" : "success"} />
          <StatTile value={`${Math.round(d?.overview?.action_completion_rate ?? 0)}%`} label="Actions %" tone="success" />
        </div>

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[--cs-text-muted] flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alerts
            </p>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}>
                {a.message}
              </div>
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-[--cs-text-secondary]">
              <Brain className="h-3 w-3" />
              Cara Handover Prompt Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
