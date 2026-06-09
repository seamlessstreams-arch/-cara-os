"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT PLANS
// Tracks each child's placement plan with objectives, targets, responsible
// persons, and progress. Supports Reg 14 (Placement Plan) and Schedule 2
// (Information in Respect of Children in Children's Homes).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { usePlacementObjectives, useCreatePlacementObjective } from "@/hooks/use-placement-objectives";
import type { PlacementObjective, ObjectiveArea, PlacementObjectiveStatus } from "@/types/extended";
import {
  Search, ArrowUpDown, X, Plus, Target, CheckCircle2,
  AlertTriangle, Clock, User, Calendar, ChevronDown,
  ChevronUp, Shield, TrendingUp, ListChecks, FileText,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const AREA_CONFIG: Record<ObjectiveArea, { label: string; colour: string }> = {
  health:              { label: "Health",              colour: "bg-red-100 text-red-700" },
  education:           { label: "Education",           colour: "bg-blue-100 text-blue-700" },
  emotional_wellbeing: { label: "Emotional Wellbeing", colour: "bg-purple-100 text-purple-700" },
  identity:            { label: "Identity",            colour: "bg-pink-100 text-pink-700" },
  family_social:       { label: "Family & Social",     colour: "bg-green-100 text-green-700" },
  social_presentation: { label: "Social Presentation", colour: "bg-amber-100 text-amber-700" },
  self_care:           { label: "Self-Care Skills",    colour: "bg-cyan-100 text-cyan-700" },
  stability:           { label: "Placement Stability", colour: "bg-orange-100 text-orange-700" },
};

const STATUS_CONFIG: Record<PlacementObjectiveStatus, { label: string; colour: string }> = {
  on_track:      { label: "On Track",      colour: "bg-green-100 text-green-700" },
  some_progress: { label: "Some Progress", colour: "bg-amber-100 text-amber-700" },
  no_progress:   { label: "No Progress",   colour: "bg-red-100 text-red-700" },
  achieved:      { label: "Achieved",      colour: "bg-emerald-100 text-emerald-700" },
  not_started:   { label: "Not Started",   colour: "bg-gray-100 text-gray-600" },
  at_risk:       { label: "At Risk",       colour: "bg-red-100 text-red-800" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlacementPlanPage() {
  const { currentUser } = useAuthContext();

  const { data: res, isLoading } = usePlacementObjectives();
  const createMut = useCreatePlacementObjective();
  const entries = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("child");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "active" | "needs_review">("all");

  // new form
  const [nChild, setNChild] = useState("");
  const [nArea, setNArea] = useState<ObjectiveArea | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nTarget, setNTarget] = useState("");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);
  const today = todayStr();

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "active") list = list.filter(e => e.current_status !== "achieved");
    if (tab === "needs_review") list = list.filter(e => e.review_date <= today);
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (areaFilter !== "all") list = list.filter(e => e.area === areaFilter);
    if (statusFilter !== "all") list = list.filter(e => e.current_status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.progress_notes.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "area":  return a.area.localeCompare(b.area);
        case "status": return a.current_status.localeCompare(b.current_status);
        case "review": return a.review_date.localeCompare(b.review_date);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, areaFilter, statusFilter, sortBy, tab, today]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: entries.length,
    onTrack: entries.filter(e => e.current_status === "on_track" || e.current_status === "achieved").length,
    atRisk: entries.filter(e => e.current_status === "at_risk" || e.current_status === "no_progress").length,
    needsReview: entries.filter(e => e.review_date <= today).length,
    achieved: entries.filter(e => e.current_status === "achieved").length,
  }), [entries, today]);

  /* ── per-child summary ──────────────────────────────────────────────────── */
  const childSummaries = useMemo(() => {
    const map = new Map<string, { total: number; onTrack: number; atRisk: number; nextReview: string }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { total: 0, onTrack: 0, atRisk: 0, nextReview: "9999" };
      cur.total++;
      if (e.current_status === "on_track" || e.current_status === "achieved") cur.onTrack++;
      if (e.current_status === "at_risk" || e.current_status === "no_progress") cur.atRisk++;
      if (e.review_date < cur.nextReview) cur.nextReview = e.review_date;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<PlacementObjective>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Area", accessor: r => AREA_CONFIG[r.area].label },
    { header: "Title", accessor: r => r.title },
    { header: "Description", accessor: r => r.description },
    { header: "Target", accessor: r => r.target },
    { header: "Status", accessor: r => STATUS_CONFIG[r.current_status].label },
    { header: "Responsible", accessor: r => getStaffName(r.responsible) },
    { header: "Start Date", accessor: r => r.start_date },
    { header: "Review Date", accessor: r => r.review_date },
    { header: "Progress Notes", accessor: r => r.progress_notes },
    { header: "Last Updated", accessor: r => r.last_updated },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nArea || !nTitle || !nDesc || !nTarget) return;
    createMut.mutate({
      child_id: nChild,
      area: nArea as ObjectiveArea,
      title: nTitle,
      description: nDesc,
      target: nTarget,
      current_status: "not_started",
      responsible: currentUser?.id || "staff_darren",
      start_date: todayStr(),
      review_date: (() => { const dt = new Date(); dt.setDate(dt.getDate() + 90); return dt.toISOString().slice(0, 10); })(),
      progress_notes: "",
      last_updated: todayStr(),
    });
    setShowNew(false);
    setNChild(""); setNArea(""); setNTitle(""); setNDesc(""); setNTarget("");
  };

  /* ── loading state ──────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell title="Placement Plans" subtitle="Objectives, targets, and progress tracking">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Placement Plans"
      subtitle="Objectives, targets, and progress tracking"
      ariaContext={{ pageTitle: "Placement Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Placement Plans" subtitle="Chamberlain House — Care Planning" />
          <ExportButton data={filtered} columns={exportCols} filename="placement-plans" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Objective
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Objectives", value: stats.total, icon: ListChecks, c: "text-blue-600" },
          { label: "On Track",         value: stats.onTrack, icon: TrendingUp, c: "text-green-600" },
          { label: "At Risk",          value: stats.atRisk, icon: AlertTriangle, c: "text-red-600" },
          { label: "Needs Review",     value: stats.needsReview, icon: Clock, c: "text-amber-600" },
          { label: "Achieved",         value: stats.achieved, icon: CheckCircle2, c: "text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── At risk alert ─────────────────────────────────────────────────────── */}
      {stats.atRisk > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            {stats.atRisk} objective{stats.atRisk !== 1 ? "s" : ""} at risk or showing no progress — review required.
          </p>
        </div>
      )}

      {/* ── Per-child cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const s = childSummaries.get(cid)!;
          const overdue = s.nextReview <= today;
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{getYPName(cid)}</p>
                <Badge variant="outline" className={cn("text-xs",
                  s.atRisk > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                )}>
                  {s.onTrack}/{s.total} on track
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{s.total} objective{s.total !== 1 ? "s" : ""}</span>
                {s.atRisk > 0 && <span className="text-red-600">{s.atRisk} at risk</span>}
                <span className={overdue ? "text-amber-600 font-medium" : ""}>
                  Review: {formatDate(s.nextReview)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All Objectives", count: entries.length },
          { key: "active", label: "Active", count: entries.filter(e => e.current_status !== "achieved").length },
          { key: "needs_review", label: "Needs Review", count: stats.needsReview },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label} <span className="text-xs ml-1 text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Area" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {(Object.entries(AREA_CONFIG) as [ObjectiveArea, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [PlacementObjectiveStatus, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="area">By Area</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="review">By Review Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} objective{filtered.length !== 1 ? "s" : ""}
        {(search || childFilter !== "all" || areaFilter !== "all" || statusFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Objective Cards ───────────────────────────────────────────────────── */}
      <div className="space-y-3" id="placement-plans-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No objectives found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const ac = AREA_CONFIG[entry.area];
          const sc = STATUS_CONFIG[entry.current_status];
          const overdue = entry.review_date <= today;

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-card overflow-hidden",
              entry.current_status === "at_risk" && "border-red-200",
              overdue && "border-amber-200",
            )}>
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0", ac.colour)}>
                  <Target className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.title}</span>
                    <Badge variant="outline" className={cn("text-xs", ac.colour)}>{ac.label}</Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                    {overdue && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">Review Due</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(entry.child_id)} · {getStaffName(entry.responsible)} · Review: {formatDate(entry.review_date)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-sm">{entry.description}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Target</p>
                    <p className="text-sm">{entry.target}</p>
                  </div>
                  {entry.progress_notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Progress Notes</p>
                      <p className="text-sm">{entry.progress_notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.responsible)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Started: {formatDate(entry.start_date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Updated: {formatDate(entry.last_updated)}</span>
                  </div>
                  <SmartLinkPanel sourceType="placement-objective" sourceId={entry.id} childId={entry.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 14 (Placement Plan)</strong> requires each child to have a placement plan that sets out
              how their day-to-day needs will be met. The plan must cover all seven dimensions of the Assessment Framework
              and be reviewed regularly. <strong>Schedule 2</strong> specifies the information that must be included.
              Ofsted inspectors expect to see individualised, measurable targets with evidence of progress.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Placement Objective</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Development Area *</label>
              <Select value={nArea} onValueChange={v => setNArea(v as ObjectiveArea)}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(AREA_CONFIG) as [ObjectiveArea, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Objective Title *</label>
              <Input placeholder="e.g. Improve school attendance" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea placeholder="Full description of the objective..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Measurable Target *</label>
              <Textarea placeholder="SMART target..." value={nTarget} onChange={e => setNTarget(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nArea || !nTitle || !nDesc || !nTarget}>Save Objective</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Care Planning"
        category={["general", "behaviour", "health"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Placement Plans — placement objectives, care plan goals, placement purpose, anticipated length, stability targets, education plan, health plan, family contact plan, Reg 45 outcomes evidence"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
