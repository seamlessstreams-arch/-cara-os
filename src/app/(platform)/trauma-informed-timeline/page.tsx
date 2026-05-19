"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  AlertTriangle,
  Home,
  Users,
  GraduationCap,
  Shield,
  Star,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import type { TimelineEvent, TimelineEventCategory } from "@/types/extended";
import { useTimelineEvents } from "@/hooks/use-timeline-events";

// ── category config ─────────────────────────────────────────────────────────
const categoryConfig: Record<TimelineEventCategory, { icon: typeof Heart; colour: string }> = {
  Loss: { icon: Heart, colour: "text-purple-600 bg-purple-50" },
  Trauma: { icon: AlertTriangle, colour: "text-red-600 bg-red-50" },
  Placement: { icon: Home, colour: "text-blue-600 bg-blue-50" },
  Positive: { icon: Star, colour: "text-green-600 bg-green-50" },
  Health: { icon: Shield, colour: "text-cyan-600 bg-cyan-50" },
  Education: { icon: GraduationCap, colour: "text-amber-600 bg-amber-50" },
  Family: { icon: Users, colour: "text-pink-600 bg-pink-50" },
  Legal: { icon: Shield, colour: "text-[var(--cs-text-secondary)] bg-slate-50" },
};

const impactColour: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-green-100 text-green-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<TimelineEvent>[] = [
  { header: "Young Person", accessor: (r: TimelineEvent) => getYPName(r.child_id) },
  { header: "Date", accessor: (r: TimelineEvent) => r.date },
  { header: "Age", accessor: (r: TimelineEvent) => String(r.ageAtEvent) },
  { header: "Category", accessor: (r: TimelineEvent) => r.category },
  { header: "Title", accessor: (r: TimelineEvent) => r.title },
  { header: "Impact", accessor: (r: TimelineEvent) => r.impact },
  { header: "Therapeutic Relevance", accessor: (r: TimelineEvent) => r.therapeuticRelevance },
  { header: "Linked Interventions", accessor: (r: TimelineEvent) => r.linkedInterventions.join("; ") },
];

// ── component ───────────────────────────────────────────────────────────────
export default function TraumaInformedTimelinePage() {
  const { data: result, isLoading } = useTimelineEvents(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((e) => e.child_id === filterYP);
    if (filterCategory !== "all") items = items.filter((e) => e.category === filterCategory);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "date-desc":
          return b.date.localeCompare(a.date);
        case "impact": {
          const impOrd = { High: 0, Medium: 1, Low: 2 };
          return impOrd[a.impact] - impOrd[b.impact];
        }
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterCategory, sortBy, data]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const highImpact = data.filter((e) => e.impact === "High").length;
  const positiveEvents = data.filter((e) => e.category === "Positive").length;
  const uniqueYP = new Set(data.map((e) => e.child_id)).size;

  return (
    <PageShell
      title="Trauma-Informed Timeline"
      subtitle="Life event chronology for therapeutic understanding — supporting TIAR and trauma-informed care"
      ariaContext={{ pageTitle: "Trauma-Informed Timeline", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="trauma-informed-timeline" />
          <PrintButton title="Trauma-Informed Timeline" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Total Events</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{highImpact}</p>
          <p className="text-xs text-muted-foreground">High Impact</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{positiveEvents}</p>
          <p className="text-xs text-muted-foreground">Positive Events</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{uniqueYP}</p>
          <p className="text-xs text-muted-foreground">Children Mapped</p>
        </div>
      </div>

      {/* ── info banner ────────────────────────────────────────────────── */}
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          This timeline informs trauma-informed practice. Events are used therapeutically — never punitively.
          Share only with professionals on a need-to-know basis per data protection requirements.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Loss">Loss</SelectItem>
            <SelectItem value="Trauma">Trauma</SelectItem>
            <SelectItem value="Placement">Placement</SelectItem>
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Health">Health</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Family">Family</SelectItem>
            <SelectItem value="Legal">Legal</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="date-desc">Most Recent</SelectItem>
              <SelectItem value="impact">Impact (High→Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── timeline cards ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No timeline events match your filters.</div>
        )}
        {filtered.map((evt) => {
          const isExpanded = expandedId === evt.id;
          const cfg = categoryConfig[evt.category];
          const CatIcon = cfg.icon;

          return (
            <div key={evt.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : evt.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2 rounded-lg shrink-0", cfg.colour)}>
                    <CatIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{evt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evt.date} &middot; Age {evt.ageAtEvent} &middot; {getYPName(evt.child_id)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", impactColour[evt.impact])}>
                    {evt.impact}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                    <p className="text-sm">{evt.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Therapeutic Relevance</p>
                    <p className="text-sm text-purple-800 bg-purple-50 rounded-lg p-3">{evt.therapeuticRelevance}</p>
                  </div>
                  {evt.linkedInterventions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Linked Interventions</p>
                      <div className="flex flex-wrap gap-2">
                        {evt.linkedInterventions.map((int, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{int}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Added: {evt.addedDate}</span>
                    <span>Source: {evt.source}</span>
                    <span>Category: {evt.category}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Trauma-informed timelines support Quality Standard 2 (quality of care),
          the TIAR (Trauma-Informed Assessment & Response) model, and NICE guidelines on attachment and trauma.
          Information is handled in accordance with GDPR Article 9 (special category data) and shared only on a
          need-to-know basis per the child&apos;s care plan.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Trauma-Informed Timeline — adverse childhood experiences, ACEs, trauma history, significant events, therapeutic context, life story work, placement history, developmental impact, care planning"
        recordType="care_plan"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
