"use client";

import { useState, useMemo } from "react";
import {
  Home, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Calendar, Shield,
  Heart, Target, Clock, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { PlacementStabilityRecord, StabilityFactor, PlacementEvent, StabilityRiskLevel, StabilityTrend } from "@/types/extended";
import { STABILITY_RISK_LEVEL_LABEL } from "@/types/extended";
import { usePlacementStabilityRecords } from "@/hooks/use-placement-stability-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── constants ──────────────────────────────────────────────────────── */
const RISK_LEVELS: StabilityRiskLevel[] = ["low", "medium", "high", "critical"];
const RISK_COLORS: Record<StabilityRiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function PlacementStabilityPage() {
  const { data: res, isLoading } = usePlacementStabilityRecords();
  const entries = res?.data ?? [];
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          r.action_plan.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk": return RISK_LEVELS.indexOf(b.stability_risk) - RISK_LEVELS.indexOf(a.stability_risk);
        case "days": return b.days_in_placement - a.days_in_placement;
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return 0;
      }
    });
    return list;
  }, [entries, search, sortBy]);

  if (isLoading) {
    return (
      <PageShell title="Placement Stability" subtitle="Monitor and support placement stability for every young person">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const avgDays = entries.length > 0 ? Math.round(entries.reduce((s, r) => s + r.days_in_placement, 0) / entries.length) : 0;
  const atRisk = entries.filter((r) => r.stability_risk === "high" || r.stability_risk === "critical").length;
  const improving = entries.filter((r) => r.trend === "improving").length;

  const exportCols: ExportColumn<PlacementStabilityRecord>[] = [
    { header: "Young Person", accessor: (r: PlacementStabilityRecord) => getYPName(r.child_id) },
    { header: "Placement Start", accessor: (r: PlacementStabilityRecord) => r.placement_start_date },
    { header: "Days in Placement", accessor: (r: PlacementStabilityRecord) => r.days_in_placement },
    { header: "Previous Placements", accessor: (r: PlacementStabilityRecord) => r.previous_placements },
    { header: "Stability Risk", accessor: (r: PlacementStabilityRecord) => r.stability_risk },
    { header: "Trend", accessor: (r: PlacementStabilityRecord) => r.trend },
    { header: "Key Worker", accessor: (r: PlacementStabilityRecord) => getStaffName(r.key_worker) },
    { header: "Social Worker", accessor: (r: PlacementStabilityRecord) => r.social_worker },
    { header: "Strengths", accessor: (r: PlacementStabilityRecord) => r.strengths.join("; ") },
    { header: "Concerns", accessor: (r: PlacementStabilityRecord) => r.concerns.join("; ") },
    { header: "Factors", accessor: (r: PlacementStabilityRecord) => r.factors.map((f: StabilityFactor) => `${f.factor}: ${f.status}`).join("; ") },
    { header: "Action Plan", accessor: (r: PlacementStabilityRecord) => r.action_plan },
    { header: "Next Review", accessor: (r: PlacementStabilityRecord) => r.next_review },
    { header: "Notes", accessor: (r: PlacementStabilityRecord) => r.notes },
  ];

  return (
    <PageShell
      title="Placement Stability"
      subtitle="Monitor and support placement stability for every young person"
      ariaContext={{ pageTitle: "Placement Stability", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Placement Stability" />
          <ExportButton data={filtered} columns={exportCols} filename="placement-stability" />
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Young People", value: entries.length, icon: Heart, colour: "text-pink-600" },
            { label: "Avg. Days in Placement", value: avgDays, icon: Calendar, colour: "text-blue-600" },
            { label: "At Risk", value: atRisk, icon: AlertTriangle, colour: atRisk > 0 ? "text-red-600" : "text-green-600" },
            { label: "Improving", value: improving, icon: TrendingUp, colour: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young people, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Level</SelectItem>
                <SelectItem value="days">Days in Placement</SelectItem>
                <SelectItem value="name">Young Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── cards ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((rec) => {
            const isExpanded = expanded === rec.id;
            const concerns = rec.factors.filter((f: StabilityFactor) => f.status !== "positive").length;

            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Home className={cn("h-5 w-5 shrink-0",
                      rec.stability_risk === "low" ? "text-green-600" :
                      rec.stability_risk === "medium" ? "text-yellow-600" :
                      "text-red-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(rec.child_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.days_in_placement} days · {rec.previous_placements} previous placement(s) · KW: {getStaffName(rec.key_worker)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.trend === "improving" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {rec.trend === "declining" && <TrendingDown className="h-4 w-4 text-red-600" />}
                    <Badge className={cn("text-xs", RISK_COLORS[rec.stability_risk])}>
                      {rec.stability_risk.charAt(0).toUpperCase() + rec.stability_risk.slice(1)} Risk
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Placed:</span> <span className="font-medium">{rec.placement_start_date}</span></div>
                      <div><span className="text-muted-foreground">Social Worker:</span> <span className="font-medium">{rec.social_worker}</span></div>
                      <div><span className="text-muted-foreground">Last Review:</span> <span className="font-medium">{rec.last_review}</span></div>
                      <div><span className="text-muted-foreground">Next Review:</span> <span className="font-medium">{rec.next_review}</span></div>
                    </div>

                    {/* stability factors */}
                    <div>
                      <p className="text-sm font-medium mb-2">Stability Factors</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {rec.factors.map((f: StabilityFactor, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-2.5 text-sm",
                            f.status === "positive" ? "bg-green-50 border-green-200" :
                            f.status === "concern" ? "bg-yellow-50 border-yellow-200" :
                            "bg-red-50 border-red-200"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              {f.status === "positive" ? <CheckCircle2 className="h-3 w-3 text-green-600" /> :
                               f.status === "concern" ? <AlertTriangle className="h-3 w-3 text-yellow-600" /> :
                               <Shield className="h-3 w-3 text-red-600" />}
                              <span className="font-medium">{f.factor}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{f.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* recent events */}
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Events</p>
                      <div className="space-y-2">
                        {rec.recent_events.map((evt: PlacementEvent, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 rounded-lg border bg-white p-2.5 text-sm">
                            {evt.impact === "positive" ? <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> :
                             evt.impact === "negative" ? <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 shrink-0" /> :
                             <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{evt.date}</Badge>
                                <span>{evt.event}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">Response: {evt.response}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* strengths & concerns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {rec.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                        <p className="text-xs font-medium text-orange-700 mb-2">Concerns</p>
                        <ul className="space-y-1">
                          {rec.concerns.map((c: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* action plan */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Target className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-medium text-blue-700">Action Plan</p>
                      </div>
                      <p className="text-sm">{rec.action_plan}</p>
                    </div>

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">RM Notes</p>
                      <p className="text-sm">{rec.notes}</p>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="placement-stability-record" sourceId={rec.id} childId={rec.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Placement Stability:</strong> Reg 5 requires that children experience stable placements
          that meet their needs. The home must actively monitor stability factors and take proactive steps
          to address emerging risks. Placement breakdowns should be prevented through early intervention,
          skilled relationship-building, and partnership with placing authorities.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Placement Stability"
        category={["behaviour", "safeguarding", "general"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Placement Stability — stability indicators, breakdown risk, protective factors, stability plan, length of placement, relationship quality, placement timeline, Reg 45 evidence, Annex A"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
