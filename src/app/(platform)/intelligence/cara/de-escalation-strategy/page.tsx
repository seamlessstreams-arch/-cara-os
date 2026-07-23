"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Star, Clock } from "lucide-react";
import { formatRate, meets } from "@/lib/metrics/rate";
import {
  useDeEscalationStrategyIntelligence,
  type ChildBehaviourProfile,
  type BehaviourSignal,
  type StrategyResult,
  type TimeSlot,
  type StaffEngagementProfile,
} from "@/hooks/use-de-escalation-strategy-intelligence";

// ── Signal helpers ─────────────────────────────────────────────────────────────

const SIGNAL_META: Record<BehaviourSignal, { label: string; color: string; bg: string }> = {
  needs_support: { label: "Needs Support", color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  developing:    { label: "Developing",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  progressing:   { label: "Progressing",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  strengths:     { label: "Strengths",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
};

function SignalBadge({ signal }: { signal: BehaviourSignal }) {
  const m = SIGNAL_META[signal];
  return (
    <Badge variant="outline" className={`text-xs font-medium border ${m.color} ${m.bg}`}>
      {m.label}
    </Badge>
  );
}

// ── Trend icon ─────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: "improving" | "stable" | "worsening" }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (trend === "worsening") return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// ── Strategy effectiveness bar ────────────────────────────────────────────────

function StrategyBar({ strategies }: { strategies: StrategyResult[] }) {
  if (strategies.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No strategy data</p>;
  }
  return (
    <div className="space-y-2">
      {strategies.map((s) => (
        <div key={s.strategy} className="space-y-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate mr-2">{s.strategy}</span>
            <span className="text-muted-foreground whitespace-nowrap">
              {s.resolutionRate}% resolved ({s.usageCount}×)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-2 rounded-full ${s.resolutionRate >= 70 ? "bg-emerald-500" : s.resolutionRate >= 40 ? "bg-amber-400" : "bg-red-500"}`}
              style={{ width: `${s.resolutionRate}%` }}
            />
          </div>
          {s.escalatedCount > 0 && (
            <p className="text-xs text-red-600">{s.escalatedCount} escalated to PI or serious incident</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Time risk display ─────────────────────────────────────────────────────────

function TimeRiskRow({ slots }: { slots: TimeSlot[] }) {
  const maxConcerning = Math.max(...slots.map((s) => s.concerningCount), 1);
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {slots.map((s) => (
        <div key={s.slot} className={`rounded border p-2 text-xs text-center ${s.concerningCount >= 3 ? "border-red-200 bg-red-50" : s.concerningCount >= 2 ? "border-amber-200 bg-amber-50" : "border-muted bg-muted/20"}`}>
          <p className="font-medium">{s.slot.split(" ")[0]}</p>
          <p className={`text-base font-bold mt-0.5 ${s.concerningCount >= 3 ? "text-red-700" : s.concerningCount >= 2 ? "text-amber-700" : "text-foreground"}`}>
            {s.concerningCount}
          </p>
          <p className="text-muted-foreground text-xs">concerning</p>
          <div className="h-1.5 w-full rounded-full bg-white/50 overflow-hidden mt-1">
            <div
              className={`h-1.5 rounded-full ${s.concerningCount >= 3 ? "bg-red-500" : "bg-amber-400"}`}
              style={{ width: `${Math.round((s.concerningCount / maxConcerning) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Child card ─────────────────────────────────────────────────────────────────

function ChildBehaviourCard({ profile }: { profile: ChildBehaviourProfile }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SIGNAL_META[profile.signal];

  return (
    <Card className={`border ${profile.signal === "needs_support" ? "border-red-300" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{profile.childName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <TrendIcon trend={profile.concernTrend} />
              <span className={`text-xs ${profile.concernTrend === "improving" ? "text-emerald-600" : profile.concernTrend === "worsening" ? "text-red-600" : "text-muted-foreground"}`}>
                {profile.concernTrend}
              </span>
            </div>
          </div>
          <SignalBadge signal={profile.signal} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entry breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Positive</p>
            <p className="text-xl font-bold text-emerald-600">{profile.positiveCount}</p>
            <p className="text-xs text-muted-foreground">{formatRate(profile.positiveRatio)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Concerning</p>
            <p className={`text-xl font-bold ${profile.concerningCount > 0 ? "text-amber-600" : "text-foreground"}`}>
              {profile.concerningCount}
            </p>
            <p className="text-xs text-muted-foreground">30d: {profile.last30dConcerning}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-2 text-center">
            <p className="text-xs text-muted-foreground">Severe</p>
            <p className={`text-xl font-bold ${profile.severeEntries > 0 ? "text-red-600" : "text-foreground"}`}>
              {profile.severeEntries}
            </p>
            <p className="text-xs text-muted-foreground">high/severe</p>
          </div>
        </div>

        {/* Strategy effectiveness */}
        {profile.topStrategies.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">De-escalation approaches used</p>
            <StrategyBar strategies={profile.topStrategies} />
          </div>
        )}

        {/* Time-of-day risk */}
        {profile.timeRisk.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Time-of-day risk
            </p>
            <TimeRiskRow slots={profile.timeRisk} />
          </div>
        )}

        {/* Supervision prompt */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground w-full"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Hide" : "Supervision prompt"}
        </Button>
        {expanded && (
          <div className={`rounded-lg border p-3 ${meta.bg}`}>
            <p className={`font-medium text-xs mb-1.5 ${meta.color}`}>Supervision prompt</p>
            <p className="text-sm text-foreground leading-relaxed">{profile.supervisionPrompt}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Filter type ───────────────────────────────────────────────────────────────

type Filter = "all" | BehaviourSignal;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DeEscalationStrategyPage() {
  const { data, isLoading, error } = useDeEscalationStrategyIntelligence();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) {
    return (
      <PageShell title="De-Escalation Strategy Intelligence" description="Understanding what works for each child">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading behaviour data...
        </div>
      </PageShell>
    );
  }

  if (error || !data?.data) {
    return (
      <PageShell title="De-Escalation Strategy Intelligence" description="Understanding what works for each child">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load de-escalation intelligence. Please try again.
        </div>
      </PageShell>
    );
  }

  const { childProfiles, summary } = data.data;

  const filtered = filter === "all" ? childProfiles : childProfiles.filter((p) => p.signal === filter);
  const needsSupportCount = childProfiles.filter((p) => p.signal === "needs_support").length;
  const developingCount = childProfiles.filter((p) => p.signal === "developing").length;
  const progressingCount = childProfiles.filter((p) => p.signal === "progressing").length;
  const strengthsCount = childProfiles.filter((p) => p.signal === "strengths").length;

  return (
    <PageShell
      title="De-Escalation Strategy Effectiveness Intelligence"
      description="Which approaches work, when risk peaks, and how the team is responding — per child and across the home"
    >
      <div className="space-y-6">
        {/* Worsening trend banner */}
        {summary.homeConcernTrend === "worsening" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">
                Concerning behaviour frequency is increasing across the home compared to the previous 30 days. Review care plan approaches and consider a team debrief.
              </p>
            </div>
          </div>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Home positive rate</p>
            <p className={`text-2xl font-bold mt-1 ${
              summary.homePositiveRatio === null ? "text-muted-foreground"
              : meets(summary.homePositiveRatio, 60) ? "text-emerald-600"
              : meets(summary.homePositiveRatio, 40) ? "text-amber-600"
              : "text-red-600"
            }`}>
              {formatRate(summary.homePositiveRatio)}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendIcon trend={summary.homeConcernTrend} />
              <span className="text-xs text-muted-foreground">{summary.homeConcernTrend}</span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total entries</p>
            <p className="text-2xl font-bold mt-1">{summary.totalEntries}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{summary.totalConcerning} concerning</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">High risk slot</p>
            <p className="text-sm font-bold mt-1">
              {summary.highRiskTimeSlots[0]?.slot.split(" ")[0] ?? "None"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.highRiskTimeSlots[0]?.concerningCount ?? 0} concerning
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Staff recording</p>
            <p className="text-2xl font-bold mt-1">{summary.staffEngagementProfiles.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">staff contributing</p>
          </div>
        </div>

        {/* Home-wide strategies */}
        {summary.mostEffectiveStrategies.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">De-escalation strategy effectiveness — across all children</CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyBar strategies={summary.mostEffectiveStrategies} />
            </CardContent>
          </Card>
        )}

        {/* Home-wide time risk */}
        {summary.highRiskTimeSlots.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Home time-of-day risk profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TimeRiskRow slots={summary.highRiskTimeSlots} />
            </CardContent>
          </Card>
        )}

        {/* Staff engagement */}
        {summary.staffEngagementProfiles.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Staff recording — positive engagement rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.staffEngagementProfiles.map((sp) => (
                  <div key={sp.staffId} className="flex items-center gap-3">
                    <span className="text-sm w-36 shrink-0 truncate">{sp.staffName}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${sp.positiveRate >= 60 ? "bg-emerald-500" : sp.positiveRate >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${sp.positiveRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {sp.positiveRate}% ({sp.totalEntries} entries)
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Positive rate reflects recorded interactions — staff who record more concerning entries may be doing more crisis-response work, not less skilled.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ofsted note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{summary.ofstedNote}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all",          label: `All (${childProfiles.length})` },
              { key: "needs_support",label: `Needs Support (${needsSupportCount})` },
              { key: "developing",   label: `Developing (${developingCount})` },
              { key: "progressing",  label: `Progressing (${progressingCount})` },
              { key: "strengths",    label: `Strengths (${strengthsCount})` },
            ] as { key: Filter; label: string }[]
          ).map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Child cards */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No children match this filter.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((profile) => (
              <ChildBehaviourCard key={profile.childId} profile={profile} />
            ))}
          </div>
        )}

        {/* Accountability callout */}
        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 text-sm text-muted-foreground italic">
          "The aim is not to control behaviour but to understand it — to ask what is this child communicating, and what does this child need from us right now? A therapeutic response starts with curiosity, not consequences."
          <br />
          <span className="text-xs not-italic mt-1 block">Dan Hughes, DDP / Therapeutic residential care principles</span>
        </blockquote>
      </div>
    </PageShell>
  );
}
