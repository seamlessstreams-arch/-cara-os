"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Heart, BookOpen, Shield, Dumbbell, Home, Star, Clock,
} from "lucide-react";
import { useYoungPeople } from "@/hooks/use-young-people";
import type { PlacementQuality, ChildPlacementQualityResult } from "@/lib/engines/child-placement-quality-engine";

// ── useChildPlacementQuality (inlined from deleted
// src/hooks/use-child-placement-quality.ts). Also used, byte-identical, in
// components/intelligence/child-placement-quality-card.tsx.

function useChildPlacementQuality(childId: string | null) {
  return useQuery<{ data: ChildPlacementQualityResult }>({
    queryKey: ["child-placement-quality", childId],
    queryFn: () =>
      fetch(`/api/v1/child-placement-quality?childId=${encodeURIComponent(childId!)}`).then((r) => r.json()),
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}

// ── Rating helpers ─────────────────────────────────────────────────────────────

const QUALITY_META: Record<PlacementQuality, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  concerning:        { label: "Concerning",         color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200" },
  poor:              { label: "Poor",               color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

// ── Stat row ───────────────────────────────────────────────────────────────────

function StatRow({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

// ── Rate bar ───────────────────────────────────────────────────────────────────

function RateBar({ label, value, warn = 70 }: { label: string; value: number; warn?: number }) {
  const color = value >= warn ? "bg-emerald-500" : value >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium text-foreground">{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.round(value)}%` }} />
      </div>
    </div>
  );
}

// ── Score dial (SVG) ───────────────────────────────────────────────────────────

function ScoreDial({ score, quality }: { score: number; quality: PlacementQuality }) {
  const meta = QUALITY_META[quality];
  const r = 42;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const strokeColor =
    score >= 80 ? "#10b981" : score >= 65 ? "#3b82f6" : score >= 50 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={strokeColor} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
        />
        <text x="55" y="51" textAnchor="middle" className="text-foreground" style={{ fontSize: 22, fontWeight: 700, fill: "currentColor" }}>
          {score}
        </text>
        <text x="55" y="67" textAnchor="middle" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}>
          /100
        </text>
      </svg>
      <Badge variant="outline" className={`text-xs border ${meta.border} ${meta.color} ${meta.bg}`}>
        {meta.label}
      </Badge>
    </div>
  );
}

// ── Trend icon ────────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: "improving" | "stable" | "declining" | "insufficient_data" }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ChildPlacementQualityPage() {
  const { data: ypData, isLoading: ypLoading } = useYoungPeople("current");
  const youngPeople = ypData?.data ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && youngPeople.length > 0) {
      setSelectedId(youngPeople[0].id);
    }
  }, [youngPeople, selectedId]);

  const { data, isLoading: qLoading } = useChildPlacementQuality(selectedId);
  const d = data?.data;

  const selectedChild = youngPeople.find((yp) => yp.id === selectedId);
  const displayName = (yp: { preferred_name?: string | null; first_name?: string }) =>
    yp.preferred_name ?? yp.first_name ?? "Unknown";

  if (ypLoading) {
    return (
      <PageShell title="Child Placement Quality" description="Loading young people…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }

  if (youngPeople.length === 0) {
    return (
      <PageShell title="Child Placement Quality" description="No current young people found.">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No current young people recorded.</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Placement Quality"
      description="Per-child placement quality across mood, engagement, key work, welfare, activities, and stability (CHR 2015 Reg 5, 6, 7, 9)."
    >
      <div className="space-y-6">

        {/* Child selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Viewing:</label>
          <Select value={selectedId ?? ""} onValueChange={setSelectedId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a young person" />
            </SelectTrigger>
            <SelectContent>
              {youngPeople.map((yp) => (
                <SelectItem key={yp.id} value={yp.id}>
                  {displayName(yp)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {qLoading && (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading placement quality…</div>
        )}

        {!qLoading && !d && (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No placement data found for {selectedChild ? displayName(selectedChild) : "this young person"}.
          </div>
        )}

        {!qLoading && d && (
          <>
            {/* Quality banner */}
            {(() => {
              const meta = QUALITY_META[d.placement_quality];
              return (
                <Card className={`border-2 ${meta.border}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <ScoreDial score={d.quality_score} quality={d.placement_quality} />
                      <div className="flex-1">
                        <p className="text-base font-semibold text-foreground">{d.child_name}</p>
                        <p className="text-sm text-foreground mt-1">{d.headline}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Profiles grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              {/* Mood trajectory */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    Mood Trajectory (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <StatRow label="Average mood" value={d.mood_trajectory.average_30d.toFixed(1)} note="out of 10" />
                  <StatRow label="Previous 30 days" value={d.mood_trajectory.average_previous_30d.toFixed(1)} />
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-muted-foreground">Trend</span>
                    <div className="flex items-center gap-1.5">
                      <TrendIcon trend={d.mood_trajectory.trend} />
                      <span className="text-sm font-medium capitalize">{d.mood_trajectory.trend.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Daily Log Engagement (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <StatRow label="Log entries" value={d.engagement.daily_log_count_30d} />
                  <StatRow label="Significant entries" value={d.engagement.significant_entries_30d} />
                  <StatRow label="Staff variety" value={d.engagement.staff_variety_30d} note="unique staff" />
                  {d.engagement.entry_type_spread.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.engagement.entry_type_spread.slice(0, 4).map((e) => (
                        <Badge key={e.type} variant="secondary" className="text-xs capitalize">
                          {e.type.replace(/_/g, " ")} ({e.count})
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key work */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Key Work (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <StatRow label="Sessions" value={d.key_work.sessions_30d} />
                  <RateBar label="Child engagement rate" value={d.key_work.engagement_rate} />
                  <RateBar label="Mood improvement rate" value={d.key_work.mood_improvement_rate} />
                  {d.key_work.top_themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.key_work.top_themes.slice(0, 3).map((t) => (
                        <Badge key={t.theme} variant="outline" className="text-xs capitalize">
                          {t.theme.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Welfare */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    Welfare Checks (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <StatRow label="Checks completed" value={d.welfare.checks_30d} />
                  <RateBar label="OK rate" value={d.welfare.ok_rate} />
                  {d.welfare.concern_count > 0 && (
                    <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      {d.welfare.concern_count} welfare concern{d.welfare.concern_count !== 1 ? "s" : ""} recorded
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Activities */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    Activities (30 days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <StatRow label="Activities" value={d.activities.activities_30d} />
                  <RateBar label="Participation rate" value={d.activities.participation_rate} />
                  {d.activities.types.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.activities.types.slice(0, 4).map((t) => (
                        <Badge key={t.type} variant="secondary" className="text-xs capitalize">
                          {t.type.replace(/_/g, " ")} ({t.count})
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stability */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Placement Stability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <StatRow label="Days in placement" value={d.stability.days_in_placement} />
                  <StatRow label="Total moves" value={d.stability.total_moves} />
                  {d.stability.unplanned_moves > 0 && (
                    <StatRow label="Unplanned moves" value={d.stability.unplanned_moves} />
                  )}
                  {d.stability.is_long_term && (
                    <div className="flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700 mt-2">
                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                      Long-term placement (&gt;6 months)
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            {d.insights.length > 0 && (
              <div className="space-y-2">
                {d.insights.map((ins, i) => {
                  const cls =
                    ins.severity === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                    ins.severity === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                    "bg-emerald-50 border-emerald-200 text-emerald-800";
                  return (
                    <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                      {ins.severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                       ins.severity === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                       <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
                      {ins.text}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Strengths + Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {d.strengths.length > 0 && (
                <Card className="border-emerald-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {d.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-2">
                          <Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {d.concerns.length > 0 && (
                <Card className="border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Concerns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {d.concerns.map((c, i) => (
                        <li key={i} className="text-xs text-foreground flex gap-2">
                          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recommendations */}
            {d.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recommendations for {d.child_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {d.recommendations.map((rec) => {
                    const urgencyColor =
                      rec.urgency === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                      rec.urgency === "soon"       ? "bg-amber-100 text-amber-700 border-amber-200" :
                      "bg-blue-100 text-blue-700 border-blue-200";
                    return (
                      <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {rec.rank}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{rec.recommendation}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.domain} · {rec.regulatory_ref}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>
                          {rec.urgency}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground border-t pt-3">
              CHR 2015 Reg 5 (engaging children), Reg 6 (quality of care), Reg 7 (welfare), Reg 9 (accommodation). SCCIF: "Experiences and progress of children in care."
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
