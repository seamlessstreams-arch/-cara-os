"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA HOME DYNAMICS DASHBOARD
// Live operational climate of the home: incidents, restraints, missing
// episodes, staffing stability, overdue tasks. Drafted by ARIA, verified by
// the manager. Snapshots are immutable once stored.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  useLatestHomeDynamicsSnapshot,
  useHomeDynamicsSnapshots,
  useGenerateHomeDynamicsSnapshot,
} from "@/hooks/use-aria-home-dynamics";
import { useAuthContext } from "@/contexts/auth-context";
import type {
  AriaHomeDynamicsIndicator,
  AriaIndicatorStatus,
} from "@/types/aria-studio";

const HOME_ID = "home_oak";

const STATUS_TONE: Record<AriaIndicatorStatus, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABEL: Record<AriaIndicatorStatus, string> = {
  green: "Within range",
  amber: "Attention",
  red: "Action required",
};

function IndicatorTile({ ind }: { ind: AriaHomeDynamicsIndicator }) {
  return (
    <Card className={`border ${STATUS_TONE[ind.status]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{ind.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold">{ind.value}</div>
        <Badge variant="outline" className="text-xs">
          {STATUS_LABEL[ind.status]}
        </Badge>
        <p className="text-xs text-muted-foreground">{ind.detail}</p>
      </CardContent>
    </Card>
  );
}

export default function HomeDynamicsPage() {
  const auth = useAuthContext();
  const { data: latest, isLoading } = useLatestHomeDynamicsSnapshot(HOME_ID);
  const { data: history } = useHomeDynamicsSnapshots(HOME_ID);
  const generate = useGenerateHomeDynamicsSnapshot();
  const [windowDays, setWindowDays] = useState(28);

  const snapshot = latest?.data ?? null;
  const historyItems = (history?.data ?? []).slice(0, 10);

  const handleGenerate = () => {
    generate.mutate({
      home_id: HOME_ID,
      window_days: windowDays,
      actor_id: auth.currentUser?.id,
      actor_role: auth.currentRole,
    });
  };

  return (
    <PageShell
      title="Home Dynamics"
      subtitle="ARIA-drafted operational climate. Manager verification required."
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button
            onClick={handleGenerate}
            disabled={generate.isPending}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generate.isPending ? "animate-spin" : ""}`} />
            Generate snapshot
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !snapshot ? (
        <Card>
          <CardHeader>
            <CardTitle>No snapshots yet</CardTitle>
            <CardDescription>
              Generate the first home dynamics snapshot to see a draft of the
              home&rsquo;s current operational climate.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Headline */}
          <Card className={`border-2 ${STATUS_TONE[snapshot.overall_status]}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Overall: {STATUS_LABEL[snapshot.overall_status]}
                  </CardTitle>
                  <CardDescription>
                    Window: {snapshot.window_start} → {snapshot.window_end}
                    {" · "}Generated {new Date(snapshot.generated_at).toLocaleString()}
                  </CardDescription>
                </div>
                {snapshot.is_ai_draft && (
                  <Badge variant="outline" className="bg-background">
                    ARIA draft — manager review required
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {snapshot.narrative_summary}
              </pre>
            </CardContent>
          </Card>

          {/* Indicator grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {snapshot.indicators.map((ind) => (
              <IndicatorTile key={ind.key} ind={ind} />
            ))}
          </div>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Recent snapshots
              </CardTitle>
              <CardDescription>
                Last {historyItems.length} snapshots for this home.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {historyItems.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={STATUS_TONE[h.overall_status]}
                      >
                        {h.overall_status.toUpperCase()}
                      </Badge>
                      <span>{new Date(h.generated_at).toLocaleString()}</span>
                      <span className="text-muted-foreground">
                        ({h.window_days}d window)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {h.incidents_total} inc
                      </span>
                      <span>{h.restraints_total} rstr</span>
                      <span>{h.missing_episodes_total} mep</span>
                      <span>{h.staffing_stability_pct}% stab</span>
                    </div>
                  </div>
                ))}
                {historyItems.length === 0 && (
                  <p className="py-4 text-sm text-muted-foreground">
                    No prior snapshots.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
