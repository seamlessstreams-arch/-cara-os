"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Care Event Patterns  (Milestone 17)
//
// Cross-event pattern scan over the last N days. Cara detected — requires
// manager review. Each pattern card lists the source events for full
// transparency.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, AlertTriangle, RefreshCw, TrendingUp, Users, Clock, Sparkles, CheckCircle2, Send,
} from "lucide-react";
import {
  useCareEventPatterns,
} from "@/hooks/use-care-event-patterns";
import { usePromotePatternsToReg45 } from "@/hooks/use-promote-patterns-to-reg45";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import type {
  CareEventPattern,
  CareEventPatternSeverity,
  CareEventPatternType,
} from "@/lib/care-events/pattern-detection";

const HOME_ID = "home_oak";

const TYPE_ICONS: Record<CareEventPatternType, React.ReactNode> = {
  frequency_cluster:    <Activity className="h-4 w-4" />,
  safeguarding_spike:   <AlertTriangle className="h-4 w-4" />,
  behaviour_escalation: <TrendingUp className="h-4 w-4" />,
  time_of_day_cluster:  <Clock className="h-4 w-4" />,
  cross_child_theme:    <Users className="h-4 w-4" />,
};

const TYPE_LABELS: Record<CareEventPatternType, string> = {
  frequency_cluster:    "Frequency cluster",
  safeguarding_spike:   "Safeguarding spike",
  behaviour_escalation: "Behaviour escalation",
  time_of_day_cluster:  "Time-of-day cluster",
  cross_child_theme:    "Cross-child theme",
};

const SEVERITY_TONES: Record<CareEventPatternSeverity, string> = {
  high:   "bg-rose-100 text-rose-800 border-rose-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low:    "bg-slate-100 text-slate-800 border-slate-200",
};

export default function CareEventPatternsPage() {
  const [lookbackDays, setLookbackDays] = useState(30);
  const [minCluster, setMinCluster] = useState(3);
  const { data, isLoading, refetch, isFetching } = useCareEventPatterns(HOME_ID, {
    lookbackDays, minCluster,
  });
  const { currentUser } = useAuthContext();
  const caraRole = appRoleToCaraRole(currentUser?.role ?? "registered_manager");
  const promote = usePromotePatternsToReg45();

  const summary = data?.data;
  const promoteResult = promote.data?.data;

  return (
    <PageShell
      title="Care Event Patterns"
      subtitle="Cara detected — requires manager review. Cross-event analysis of verified care entries to surface themes individual reviews would miss."
      actions={
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={7}
            max={365}
            value={lookbackDays}
            onChange={(e) => setLookbackDays(Math.max(7, Math.min(365, Number(e.target.value) || 30)))}
            className="h-8 w-20"
            aria-label="Lookback days"
          />
          <span className="text-xs text-muted-foreground">days</span>
          <Input
            type="number"
            min={2}
            max={20}
            value={minCluster}
            onChange={(e) => setMinCluster(Math.max(2, Math.min(20, Number(e.target.value) || 3)))}
            className="h-8 w-20"
            aria-label="Minimum cluster size"
          />
          <span className="text-xs text-muted-foreground">min cluster</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Rescan
          </Button>
          <Button
            size="sm"
            onClick={() =>
              promote.mutate({
                home_id: HOME_ID,
                lookback_days: lookbackDays,
                min_cluster: minCluster,
                actor_id: currentUser?.id,
                actor_role: caraRole,
              })
            }
            disabled={promote.isPending || (summary?.total_patterns ?? 0) === 0}
          >
            <Send className="mr-1 h-4 w-4" />
            Promote to Reg 45
          </Button>
        </div>
      }
    >
      {promoteResult && (
        <div className="mb-3 rounded border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
          Promoted {promoteResult.scanned} pattern{promoteResult.scanned === 1 ? "" : "s"} into Reg 45 evidence —{" "}
          {promoteResult.created} new draft chip{promoteResult.created === 1 ? "" : "s"},{" "}
          {promoteResult.refreshed} refreshed,{" "}
          {promoteResult.skipped_locked} kept locked. All chips remain provisional until a manager accepts them in the Reg 45 evidence bank.
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Patterns" value={summary?.total_patterns ?? 0} icon={<Sparkles className="h-4 w-4" />} tone="bg-violet-50" />
        <SummaryCard label="High" value={summary?.by_severity.high ?? 0} icon={<AlertTriangle className="h-4 w-4 text-rose-700" />} tone="bg-rose-50" />
        <SummaryCard label="Medium" value={summary?.by_severity.medium ?? 0} icon={<TrendingUp className="h-4 w-4 text-amber-700" />} tone="bg-amber-50" />
        <SummaryCard label="Low" value={summary?.by_severity.low ?? 0} icon={<Activity className="h-4 w-4 text-slate-700" />} tone="bg-slate-50" />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Scanning care events…
            </CardContent>
          </Card>
        ) : !summary || summary.patterns.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              No patterns detected in the lookback window.
            </CardContent>
          </Card>
        ) : (
          summary.patterns.map((p) => <PatternCard key={p.id} pattern={p} />)
        )}
      </div>

      {summary && (
        <p className="mt-4 text-xs text-muted-foreground">
          Window: {summary.period_start} → {summary.period_end} · scanned {summary.total_patterns} pattern
          {summary.total_patterns === 1 ? "" : "s"}.
        </p>
      )}
    </PageShell>
  );
}

function SummaryCard({
  label, value, icon, tone,
}: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <Card className={tone}>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: CareEventPattern }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">{TYPE_ICONS[pattern.type]}</div>
            <div>
              <CardTitle className="text-sm">{pattern.title}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {TYPE_LABELS[pattern.type]}
                {pattern.child_id ? ` · child ${pattern.child_id}` : " · home-wide"}
                {pattern.category ? ` · ${pattern.category.replace(/_/g, " ")}` : ""}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={SEVERITY_TONES[pattern.severity]}>
            {pattern.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-xs">
        <p className="text-foreground">{pattern.description}</p>
        <div className="rounded border bg-violet-50 px-2 py-1 text-violet-900">
          <span className="font-medium">Reflective prompt:</span> {pattern.reflective_prompt}
        </div>
        <details>
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {pattern.event_ids.length} source care event{pattern.event_ids.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1 space-y-0.5 pl-4">
            {pattern.event_ids.map((id) => (
              <li key={id}>
                <a href={`/care-events/${id}`} className="text-blue-700 hover:underline">
                  {id}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}
