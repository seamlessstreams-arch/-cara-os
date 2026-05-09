"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ChevronDown, ChevronUp, AlertTriangle, Clock, MapPin,
  TrendingUp, TrendingDown, Minus, ArrowUpDown, Users, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { BehaviourMappingType, BMIntensity, BMTimeOfDay, BehaviourMapEntry } from "@/types/extended";
import { useBehaviourMapEntries } from "@/hooks/use-behaviour-map-entries";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const TYPE_META: Record<BehaviourMappingType, { label: string; color: string }> = {
  aggression: { label: "Aggression", color: "bg-red-100 text-red-800" },
  self_harm: { label: "Self-Harm", color: "bg-red-100 text-red-800" },
  absconding: { label: "Absconding", color: "bg-orange-100 text-orange-800" },
  property_damage: { label: "Property Damage", color: "bg-amber-100 text-amber-800" },
  verbal_aggression: { label: "Verbal Aggression", color: "bg-amber-100 text-amber-800" },
  withdrawal: { label: "Withdrawal", color: "bg-blue-100 text-blue-800" },
  refusal: { label: "Refusal", color: "bg-slate-100 text-slate-700" },
  dysregulation: { label: "Dysregulation", color: "bg-purple-100 text-purple-800" },
};

const INTENSITY_META: Record<BMIntensity, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", color: "bg-amber-100 text-amber-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  crisis: { label: "Crisis", color: "bg-red-100 text-red-800" },
};

const TOD_META: Record<BMTimeOfDay, { label: string }> = {
  morning: { label: "Morning (06:00-12:00)" },
  afternoon: { label: "Afternoon (12:00-18:00)" },
  evening: { label: "Evening (18:00-22:00)" },
  night: { label: "Night (22:00-06:00)" },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function BehaviourMappingPage() {
  const { data: bmeData, isLoading } = useBehaviourMapEntries();
  const data = bmeData?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "intensity" | "child">("date");
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...data];
    if (filterChild !== "all") result = result.filter((e) => e.child_id === filterChild);
    if (filterType !== "all") result = result.filter((e) => e.behaviour_type === filterType);
    return result.sort((a, b) => {
      switch (sortBy) {
        case "intensity": {
          const order = { crisis: 0, high: 1, moderate: 2, low: 3 };
          return (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4);
        }
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return b.date.localeCompare(a.date);
      }
    });
  }, [data, sortBy, filterChild, filterType]);

  const exportData = useMemo(() => {
    return data.map((e) => ({
      date: e.date,
      time: e.time,
      child: getYPName(e.child_id),
      type: TYPE_META[e.behaviour_type].label,
      intensity: INTENSITY_META[e.intensity].label,
      location: e.location,
      antecedent: e.antecedent,
      behaviour: e.behaviour,
      consequence: e.consequence,
      duration: e.duration,
      staff: e.staff_present.map((s) => getStaffName(s)).join(", "),
      trigger_pattern: e.trigger_pattern || "None identified",
    }));
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Time", accessor: (r: ExportRow) => r.time },
    { header: "Child", accessor: (r: ExportRow) => r.child },
    { header: "Type", accessor: (r: ExportRow) => r.type },
    { header: "Intensity", accessor: (r: ExportRow) => r.intensity },
    { header: "Location", accessor: (r: ExportRow) => r.location },
    { header: "Antecedent", accessor: (r: ExportRow) => r.antecedent },
    { header: "Behaviour", accessor: (r: ExportRow) => r.behaviour },
    { header: "Consequence", accessor: (r: ExportRow) => r.consequence },
    { header: "Duration", accessor: (r: ExportRow) => r.duration },
    { header: "Staff", accessor: (r: ExportRow) => r.staff },
    { header: "Trigger Pattern", accessor: (r: ExportRow) => r.trigger_pattern },
  ];

  /* pattern summary */
  const childPatterns = useMemo(() => {
    const map = new Map<string, { total: number; byType: Record<string, number>; byTime: Record<string, number>; topTrigger: string | null }>();
    for (const entry of data) {
      const existing = map.get(entry.child_id) || { total: 0, byType: {}, byTime: {}, topTrigger: null };
      existing.total++;
      existing.byType[entry.behaviour_type] = (existing.byType[entry.behaviour_type] || 0) + 1;
      existing.byTime[entry.time_of_day] = (existing.byTime[entry.time_of_day] || 0) + 1;
      if (entry.trigger_pattern) existing.topTrigger = entry.trigger_pattern;
      map.set(entry.child_id, existing);
    }
    return map;
  }, [data]);

  return (
    <PageShell
      title="Behaviour Mapping"
      subtitle="ABC Analysis · Trigger Patterns · De-Escalation · Antecedent–Behaviour–Consequence"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Behaviour Mapping" />
          <ExportButton data={exportData} columns={exportCols} filename="behaviour-mapping" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* pattern summary per child */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
            const patterns = childPatterns.get(ypId);
            if (!patterns) return null;
            const topType = Object.entries(patterns.byType).sort((a, b) => b[1] - a[1])[0];
            const topTime = Object.entries(patterns.byTime).sort((a, b) => b[1] - a[1])[0];
            return (
              <Card key={ypId}>
                <CardContent className="pt-4 pb-3">
                  <p className="font-bold mb-1">{getYPName(ypId)}</p>
                  <p className="text-2xl font-bold">{patterns.total} <span className="text-sm font-normal text-muted-foreground">entries</span></p>
                  <div className="mt-1 space-y-0.5 text-xs">
                    {topType && <p className="text-muted-foreground">Most common: <span className="font-medium">{TYPE_META[topType[0] as BehaviourMappingType]?.label}</span> ({topType[1]})</p>}
                    {topTime && <p className="text-muted-foreground">Peak time: <span className="font-medium">{TOD_META[topTime[0] as BMTimeOfDay]?.label}</span></p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select className="text-sm border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="date">Date (newest)</option>
              <option value="intensity">Intensity (highest)</option>
              <option value="child">Child (A–Z)</option>
            </select>
          </div>
          <select className="text-sm border rounded px-2 py-1" value={filterChild} onChange={(e) => setFilterChild(e.target.value)}>
            <option value="all">All Children</option>
            <option value="yp_alex">{getYPName("yp_alex")}</option>
            <option value="yp_jordan">{getYPName("yp_jordan")}</option>
            <option value="yp_casey">{getYPName("yp_casey")}</option>
          </select>
          <select className="text-sm border rounded px-2 py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {(Object.entries(TYPE_META) as [BehaviourMappingType, { label: string }][]).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>

        {/* behaviour entries */}
        <div className="space-y-3">
          {filtered.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <Card key={entry.id} className={cn(
                "border-l-4",
                entry.intensity === "crisis" ? "border-l-red-500" :
                entry.intensity === "high" ? "border-l-orange-400" :
                entry.intensity === "moderate" ? "border-l-amber-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : entry.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600" />
                        {getYPName(entry.child_id)}
                        <Badge variant="outline" className={TYPE_META[entry.behaviour_type].color}>{TYPE_META[entry.behaviour_type].label}</Badge>
                        <Badge variant="outline" className={INTENSITY_META[entry.intensity].color}>{INTENSITY_META[entry.intensity].label}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.date} at {entry.time} · {entry.location} · Duration: {entry.duration} · Staff: {entry.staff_present.map((s) => getStaffName(s)).join(", ")}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* ABC */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1">A — Antecedent</p>
                        <p className="text-xs text-blue-700">{entry.antecedent}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">B — Behaviour</p>
                        <p className="text-xs text-amber-700">{entry.behaviour}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">C — Consequence</p>
                        <p className="text-xs text-green-700">{entry.consequence}</p>
                      </div>
                    </div>

                    {/* de-escalation */}
                    <div>
                      <p className="font-medium text-xs mb-1">De-Escalation Techniques Used</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.de_escalation_used.map((tech, i) => (
                          <Badge key={i} variant="outline" className="bg-purple-50 text-purple-800 text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* outcome */}
                    <div>
                      <p className="font-medium text-xs mb-1">Outcome</p>
                      <p className="text-xs text-muted-foreground">{entry.outcome}</p>
                    </div>

                    {/* trigger pattern */}
                    {entry.trigger_pattern && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Identified Trigger Pattern</p>
                        <p className="text-xs text-purple-700">{entry.trigger_pattern}</p>
                      </div>
                    )}

                    {/* notes */}
                    {entry.notes && (
                      <div>
                        <p className="font-medium text-xs mb-1">Staff Notes</p>
                        <p className="text-xs text-muted-foreground">{entry.notes}</p>
                      </div>
                    )}

                    {/* smart links */}
                    <SmartLinkPanel sourceType="behaviour_map_entry" sourceId={entry.id} childId={entry.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Behaviour Mapping & ABC Analysis</p>
          <p>Behaviour mapping uses the Antecedent–Behaviour–Consequence (ABC) framework to identify patterns in children&apos;s behaviour. Understanding triggers (antecedents) and what happens after (consequences) allows staff to develop more effective behaviour support plans and de-escalation strategies. The Children&apos;s Homes Regulations 2015 and Quality Standards require that children&apos;s behaviour is understood in the context of their experiences and that responses are therapeutic, not punitive. Behaviour patterns should inform care planning, risk assessment updates, and therapeutic input. Data from behaviour mapping should be reviewed regularly by the RM and shared (appropriately) with CAMHS, social workers, and education professionals. Trends and patterns are more valuable than individual incidents.</p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
