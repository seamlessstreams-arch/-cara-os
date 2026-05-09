"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useTransitionPlanningRecords, useCreateTransitionPlanningRecord } from "@/hooks/use-transition-planning-records";
import type {
  TransitionPlanningRecord,
  TransitionPlanningArea,
  TransitionPlanningGoalStatus,
} from "@/types/extended";
import {
  TRANSITION_PLANNING_AREA_LABEL,
  TRANSITION_PLANNING_GOAL_STATUS_LABEL,
} from "@/types/extended";
import {
  ArrowRightLeft, ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  GraduationCap, Home, Briefcase, Heart, Shield, Wallet, Users,
  AlertTriangle, CheckCircle2, Clock, Target, Calendar, Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Local config ────────────────────────────────────────────────────────────
const AREA_META: Record<TransitionPlanningArea, { icon: React.ReactNode; color: string }> = {
  independent_living:     { icon: <Home className="h-4 w-4" />,           color: "bg-blue-100 text-blue-800" },
  education_employment:   { icon: <GraduationCap className="h-4 w-4" />,  color: "bg-purple-100 text-purple-800" },
  financial:              { icon: <Wallet className="h-4 w-4" />,         color: "bg-green-100 text-green-800" },
  health_wellbeing:       { icon: <Heart className="h-4 w-4" />,          color: "bg-pink-100 text-pink-800" },
  housing:                { icon: <Home className="h-4 w-4" />,           color: "bg-amber-100 text-amber-800" },
  relationships:          { icon: <Users className="h-4 w-4" />,          color: "bg-indigo-100 text-indigo-800" },
  legal_rights:           { icon: <Shield className="h-4 w-4" />,         color: "bg-slate-100 text-slate-800" },
  identity:               { icon: <Target className="h-4 w-4" />,         color: "bg-rose-100 text-rose-800" },
};

const STATUS_META: Record<TransitionPlanningGoalStatus, { color: string }> = {
  not_started: { color: "bg-gray-100 text-gray-700" },
  in_progress: { color: "bg-blue-100 text-blue-700" },
  on_track:    { color: "bg-green-100 text-green-700" },
  at_risk:     { color: "bg-red-100 text-red-700" },
  achieved:    { color: "bg-emerald-100 text-emerald-700" },
  paused:      { color: "bg-amber-100 text-amber-700" },
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

// ── Export columns ───────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<TransitionPlanningRecord>[] = [
  { header: "ID",            accessor: (r: TransitionPlanningRecord) => r.id },
  { header: "Young Person",  accessor: (r: TransitionPlanningRecord) => getYPName(r.child_id) },
  { header: "Area",          accessor: (r: TransitionPlanningRecord) => TRANSITION_PLANNING_AREA_LABEL[r.area] },
  { header: "Goal",          accessor: (r: TransitionPlanningRecord) => r.goal },
  { header: "Description",   accessor: (r: TransitionPlanningRecord) => r.description },
  { header: "Status",        accessor: (r: TransitionPlanningRecord) => TRANSITION_PLANNING_GOAL_STATUS_LABEL[r.status] },
  { header: "% Complete",    accessor: (r: TransitionPlanningRecord) => String(r.percent_complete) },
  { header: "Target Date",   accessor: (r: TransitionPlanningRecord) => r.target_date },
  { header: "Start Date",    accessor: (r: TransitionPlanningRecord) => r.start_date },
  { header: "Review Date",   accessor: (r: TransitionPlanningRecord) => r.review_date },
  { header: "Key Worker",    accessor: (r: TransitionPlanningRecord) => getStaffName(r.key_worker) },
  { header: "Actions",       accessor: (r: TransitionPlanningRecord) => r.actions.join("; ") },
  { header: "Progress",      accessor: (r: TransitionPlanningRecord) => r.progress },
  { header: "Notes",         accessor: (r: TransitionPlanningRecord) => r.notes },
  { header: "Created",       accessor: (r: TransitionPlanningRecord) => r.created_at },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function TransitionPlanningPage() {
  const { data: records = [], isLoading } = useTransitionPlanningRecords();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, { status: TransitionPlanningGoalStatus; percent_complete: number }>>({});
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("target");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createGoal = useCreateTransitionPlanningRecord();
  const [tpForm, setTpForm] = useState({ child_id: "", area: "housing" as TransitionPlanningArea, goal: "", description: "", target_date: "", key_worker: "staff_darren", notes: "" });
  const setTP = (k: string, v: unknown) => setTpForm((p) => ({ ...p, [k]: v }));

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tpForm.child_id) { toast.error("Please select a young person."); return; }
    if (!tpForm.goal.trim()) { toast.error("Goal is required."); return; }
    await createGoal.mutateAsync({ child_id: tpForm.child_id, area: tpForm.area, goal: tpForm.goal.trim(), description: tpForm.description.trim(), status: "not_started", target_date: tpForm.target_date, start_date: new Date().toISOString().slice(0, 10), key_worker: tpForm.key_worker, actions: [], progress: "", percent_complete: 0, review_date: "", notes: tpForm.notes.trim(), created_at: new Date().toISOString() });
    toast.success("Transition goal created.");
    setTpForm({ child_id: "", area: "housing", goal: "", description: "", target_date: "", key_worker: "staff_darren", notes: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // merge overrides on top of fetched records
  const goals = useMemo(() => {
    return records.map((r) => {
      const ov = statusOverrides[r.id];
      if (ov) return { ...r, status: ov.status, percent_complete: ov.percent_complete };
      return r;
    });
  }, [records, statusOverrides]);

  const children = useMemo(() => {
    const ids = [...new Set(goals.map((g) => g.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [goals]);

  const filtered = useMemo(() => {
    let list = [...goals];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((g) => g.goal.toLowerCase().includes(s) || g.description.toLowerCase().includes(s) || g.progress.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((g) => g.child_id === childFilter);
    if (areaFilter !== "all") list = list.filter((g) => g.area === areaFilter);
    if (statusFilter !== "all") list = list.filter((g) => g.status === statusFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "target":   return a.target_date.localeCompare(b.target_date);
        case "area":     return TRANSITION_PLANNING_AREA_LABEL[a.area].localeCompare(TRANSITION_PLANNING_AREA_LABEL[b.area]);
        case "status":   return a.status.localeCompare(b.status);
        case "progress": return b.percent_complete - a.percent_complete;
        case "child":    return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:         return 0;
      }
    });
    return list;
  }, [goals, search, childFilter, areaFilter, statusFilter, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.status === "achieved").length;
    const atRisk = goals.filter((g) => g.status === "at_risk").length;
    const avgProgress = total > 0 ? Math.round(goals.reduce((s, g) => s + g.percent_complete, 0) / total) : 0;
    const overdue = goals.filter((g) => g.target_date < d(0) && g.status !== "achieved").length;
    return { total, achieved, atRisk, avgProgress, overdue };
  }, [goals]);

  // ── Per-child progress ────────────────────────────────────────────────────
  const childProgress = useMemo(() => {
    return children.map((c) => {
      const cg = goals.filter((g) => g.child_id === c.id);
      const avg = cg.length > 0 ? Math.round(cg.reduce((s, g) => s + g.percent_complete, 0) / cg.length) : 0;
      const achieved = cg.filter((g) => g.status === "achieved").length;
      const atRisk = cg.filter((g) => g.status === "at_risk").length;
      return { ...c, total: cg.length, avg, achieved, atRisk };
    });
  }, [children, goals]);

  if (isLoading) {
    return (
      <PageShell title="Transition Planning" subtitle="Pathway planning for independence — tracking goals across all life areas">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Transition Planning"
      subtitle="Pathway planning for independence — tracking goals across all life areas"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Transition Planning" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="transition-planning" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Goal</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Goals",     value: stats.total,       icon: <Target className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Achieved",        value: stats.achieved,    icon: <CheckCircle2 className="h-4 w-4" />,    color: "text-emerald-600" },
            { label: "At Risk",         value: stats.atRisk,      icon: <AlertTriangle className="h-4 w-4" />,   color: "text-red-600" },
            { label: "Avg Progress",    value: `${stats.avgProgress}%`, icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-purple-600" },
            { label: "Overdue",         value: stats.overdue,     icon: <Clock className="h-4 w-4" />,           color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── At-risk alert ──────────────────────────────────────────────────── */}
        {stats.atRisk > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span><strong>{stats.atRisk}</strong> goal{stats.atRisk !== 1 && "s"} at risk — review pathway plans and increase support where needed.</span>
            </CardContent>
          </Card>
        )}

        {/* ── Per-child cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {childProgress.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{c.name}</p>
                  <Badge variant="outline">{c.total} goals</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className={cn("h-2 rounded-full", c.avg >= 60 ? "bg-green-500" : c.avg >= 30 ? "bg-amber-500" : "bg-red-400")} style={{ width: `${c.avg}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.avg}% avg progress</span>
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600">{c.achieved} achieved</span>
                    {c.atRisk > 0 && <span className="text-red-600">{c.atRisk} at risk</span>}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search goals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {(Object.entries(TRANSITION_PLANNING_AREA_LABEL) as [TransitionPlanningArea, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.entries(TRANSITION_PLANNING_GOAL_STATUS_LABEL) as [TransitionPlanningGoalStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="target">Target Date</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Goal list ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No goals match your filters.</p>}
          {filtered.map((g) => {
            const open = !!expanded[g.id];
            const areaM = AREA_META[g.area];
            const statusM = STATUS_META[g.status];
            const overdue = g.target_date < d(0) && g.status !== "achieved";
            return (
              <Card key={g.id} className={cn("border-l-4", g.status === "achieved" ? "border-l-emerald-500" : g.status === "at_risk" ? "border-l-red-500" : g.status === "on_track" ? "border-l-green-500" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(g.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", areaM.color)}>{areaM.icon}<span className="ml-1">{TRANSITION_PLANNING_AREA_LABEL[g.area]}</span></Badge>
                        <Badge className={cn("text-xs", statusM.color)}>{TRANSITION_PLANNING_GOAL_STATUS_LABEL[g.status]}</Badge>
                        {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                      </div>
                      <p className="font-semibold">{g.goal}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{getYPName(g.child_id)}</span>
                        <span>Key Worker: {getStaffName(g.key_worker)}</span>
                        <span>Target: {g.target_date}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={cn("h-2 rounded-full transition-all", g.percent_complete >= 80 ? "bg-emerald-500" : g.percent_complete >= 50 ? "bg-blue-500" : g.percent_complete >= 25 ? "bg-amber-500" : "bg-gray-400")} style={{ width: `${g.percent_complete}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{g.percent_complete}%</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Description</p>
                        <p>{g.description}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Action Steps</p>
                        <ul className="list-disc list-inside space-y-1">
                          {g.actions.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                      {g.progress && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Progress Update</p>
                          <p className="bg-blue-50 p-2 rounded text-blue-900">{g.progress}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">Started</p><p className="font-medium">{g.start_date}</p></div>
                        <div><p className="text-xs text-muted-foreground">Target</p><p className="font-medium">{g.target_date}</p></div>
                        <div><p className="text-xs text-muted-foreground">Next Review</p><p className="font-medium">{g.review_date}</p></div>
                        <div><p className="text-xs text-muted-foreground">Key Worker</p><p className="font-medium">{getStaffName(g.key_worker)}</p></div>
                      </div>
                      {g.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground">{g.notes}</p>
                        </div>
                      )}
                      {g.status !== "achieved" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setStatusOverrides((prev) => ({ ...prev, [g.id]: { status: "on_track", percent_complete: g.percent_complete } }))}>Mark On Track</Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setStatusOverrides((prev) => ({ ...prev, [g.id]: { status: "at_risk", percent_complete: g.percent_complete } }))}>Flag At Risk</Button>
                          <Button size="sm" variant="default" onClick={() => setStatusOverrides((prev) => ({ ...prev, [g.id]: { status: "achieved", percent_complete: 100 } }))}>Mark Achieved</Button>
                        </div>
                      )}
                      <SmartLinkPanel sourceType="transition-planning-record" sourceId={g.id} childId={g.child_id} compact />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Reg note ───────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Pathway plans must be reviewed at least every six months (or more frequently if circumstances change). All children 16+ must have a transition/pathway plan in place. Plans should be co-produced with the young person and cover all areas identified in the Children (Leaving Care) Act 2000.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New goal dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Transition Goal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person *</label>
              <Select value={tpForm.child_id} onValueChange={(v) => setTP("child_id", v)}><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Life Area</label>
              <Select value={tpForm.area} onValueChange={(v) => setTP("area", v)}><SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>{(Object.entries(TRANSITION_PLANNING_AREA_LABEL) as [TransitionPlanningArea, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Goal *</label>
              <Input placeholder="What does the young person want to achieve?" value={tpForm.goal} onChange={(e) => setTP("goal", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Describe the goal and expected outcome…" rows={3} value={tpForm.description} onChange={(e) => setTP("description", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Target Date</label>
              <Input type="date" value={tpForm.target_date} onChange={(e) => setTP("target_date", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Key Worker</label>
              <Select value={tpForm.key_worker} onValueChange={(v) => setTP("key_worker", v)}><SelectTrigger><SelectValue placeholder="Assign key worker" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                  <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                  <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Initial Notes</label>
              <Textarea placeholder="Any context or background…" rows={2} value={tpForm.notes} onChange={(e) => setTP("notes", e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createGoal.isPending}>{createGoal.isPending ? "Saving…" : "Create Goal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
