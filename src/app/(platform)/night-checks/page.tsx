"use client";

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
import { cn } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Moon, Sun, Search, ArrowUpDown, X, Plus,
  AlertTriangle, Clock, Calendar,
  Eye, CloudMoon, BedDouble,
  Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useNightChecks, useCreateNightCheck } from "@/hooks/use-night-checks";
import type { NightCheck, NightCheckSleepStatus, NightCheckType, DoorPosition } from "@/types/extended";
import { NIGHT_CHECK_SLEEP_STATUS_LABEL, NIGHT_CHECK_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SLEEP_STATUS_CONFIG: Record<NightCheckSleepStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  sleeping:        { label: "Sleeping",          icon: Moon,          color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200" },
  awake_settled:   { label: "Awake (Settled)",   icon: Sun,           color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  awake_unsettled: { label: "Awake (Unsettled)", icon: CloudMoon,     color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  asleep_restless: { label: "Restless Sleep",    icon: BedDouble,     color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200" },
  distressed:      { label: "Distressed",        icon: AlertTriangle, color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  not_in_room:     { label: "Not in Room",       icon: Eye,           color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200" },
};

function CheckRow({ check }: { check: NightCheck }) {
  const [expanded, setExpanded] = useState(false);
  const ss = SLEEP_STATUS_CONFIG[check.sleep_status];
  const SsIcon = ss.icon;

  return (
    <div className={cn("rounded-lg border bg-white transition-all", check.concern_raised && "border-[--cs-warning-soft] bg-[--cs-warning-bg]")}>
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 text-center flex-shrink-0"><div className="text-sm font-bold text-slate-700 tabular-nums">{check.time}</div></div>
        <div className={cn("rounded-md p-1.5 border flex-shrink-0", ss.bg, ss.border)}><SsIcon className={cn("h-3.5 w-3.5", ss.color)} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-slate-900">{getYPName(check.child_id)}</span>
            <Badge className={cn("text-[9px] px-1.5 py-0 border", ss.bg, ss.color, ss.border)}>{ss.label}</Badge>
            {check.concern_raised && <Badge className="bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft] text-[9px] px-1.5 py-0"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Concern</Badge>}
            {check.check_type !== "scheduled" && <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[9px] px-1.5 py-0">{NIGHT_CHECK_TYPE_LABEL[check.check_type]}</Badge>}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-1">{check.notes}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-slate-400">
          <span>{getStaffName(check.staff_id)}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <p className="text-xs text-slate-700">{check.notes}</p>
          {check.concern_detail && (
            <div className="rounded-md bg-[--cs-warning-bg] border border-[--cs-warning-soft] p-2">
              <p className="text-[11px] font-semibold text-[--cs-warning] mb-0.5">Concern Raised</p>
              <p className="text-xs text-[--cs-warning]">{check.concern_detail}</p>
            </div>
          )}
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span>Room temp: {check.room_temp_ok ? "OK" : "Issue"}</span>
            <span>Door: {check.door_position}</span>
            <span>Staff: {getStaffName(check.staff_id)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NightChecksPage() {
  const { data: res, isLoading } = useNightChecks();
  const checks: NightCheck[] = res?.data ?? [];

  const [showNew, setShowNew] = useState(false);

  const createNightCheck = useCreateNightCheck();
  const [ncForm, setNcForm] = useState({ child_id: "", check_type: "scheduled" as NightCheckType, sleep_status: "sleeping" as NightCheckSleepStatus, door_position: "ajar" as DoorPosition, notes: "" });
  const setNC = (k: string, v: unknown) => setNcForm((p) => ({ ...p, [k]: v }));

  const handleSaveCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncForm.child_id) { toast.error("Please select a young person."); return; }
    const now = new Date();
    await createNightCheck.mutateAsync({ date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5), child_id: ncForm.child_id, staff_id: "staff_darren", sleep_status: ncForm.sleep_status, check_type: ncForm.check_type, notes: ncForm.notes.trim(), concern_raised: false, concern_detail: "", room_temp_ok: true, door_position: ncForm.door_position, created_at: now.toISOString() });
    toast.success("Night check recorded.");
    setNcForm({ child_id: "", check_type: "scheduled", sleep_status: "sleeping", door_position: "ajar", notes: "" });
    setShowNew(false);
  };
  const [dateFilter, setDateFilter] = useState(d(0));
  const [childFilter, setChildFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<NightCheckSleepStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("time_desc");

  const availableDates = useMemo(() => {
    const dates = new Set(checks.map((c) => c.date));
    return Array.from(dates).sort().reverse();
  }, [checks]);

  const filtered = useMemo(() => {
    let list = checks.filter((c) => c.date === dateFilter);
    if (childFilter !== "all") list = list.filter((c) => c.child_id === childFilter);
    if (statusFilter !== "all") list = list.filter((c) => c.sleep_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.notes.toLowerCase().includes(q) || getYPName(c.child_id).toLowerCase().includes(q) || getStaffName(c.staff_id).toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "time_asc": list.sort((a, b) => a.time.localeCompare(b.time)); break;
      case "child": list.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      default: list.sort((a, b) => b.time.localeCompare(a.time));
    }
    return list;
  }, [checks, dateFilter, childFilter, statusFilter, search, sortBy]);

  const stats = useMemo(() => {
    const dateChecks = checks.filter((c) => c.date === dateFilter);
    return {
      total: dateChecks.length,
      concerns: dateChecks.filter((c) => c.concern_raised).length,
      sleeping: dateChecks.filter((c) => c.sleep_status === "sleeping").length,
      distressed: dateChecks.filter((c) => c.sleep_status === "distressed").length,
      uniqueYP: new Set(dateChecks.map((c) => c.child_id)).size,
    };
  }, [checks, dateFilter]);

  const ypSummary = useMemo(() => {
    const dateChecks = checks.filter((c) => c.date === dateFilter);
    return ["yp_alex", "yp_casey", "yp_jordan"].map((id) => {
      const yc = dateChecks.filter((c) => c.child_id === id);
      const hasConcern = yc.some((c) => c.concern_raised);
      const lastCheck = yc.sort((a, b) => b.time.localeCompare(a.time))[0];
      return { id, name: getYPName(id), checkCount: yc.length, hasConcern, lastCheck };
    });
  }, [checks, dateFilter]);

  const hasFilters = search || childFilter !== "all" || statusFilter !== "all";

  const CHECK_EXPORT_COLS: ExportColumn<NightCheck>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Sleep Status", accessor: (r) => NIGHT_CHECK_SLEEP_STATUS_LABEL[r.sleep_status] },
    { header: "Check Type", accessor: (r) => NIGHT_CHECK_TYPE_LABEL[r.check_type] },
    { header: "Concern", accessor: (r) => r.concern_raised ? "Yes" : "No" },
    { header: "Concern Detail", accessor: (r) => r.concern_detail ?? "" },
    { header: "Notes", accessor: (r) => r.notes },
    { header: "Room Temp OK", accessor: (r) => r.room_temp_ok ? "Yes" : "No" },
    { header: "Door", accessor: (r) => r.door_position },
    { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
  ];

  if (isLoading) return <PageShell title="Night Checks" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Night Checks"
      subtitle="Overnight welfare observations and sleep monitoring"
      caraContext={{ pageTitle: "Night Checks", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={CHECK_EXPORT_COLS} filename={`night-checks-${dateFilter}`} />
          <PrintButton title="Night Checks" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Record Check</Button>
          <CaraStudioQuickActionButton context={{ record_type: "daily_log", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Checks", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
          { label: "YP Checked", value: stats.uniqueYP, color: "text-[--cs-info]", bg: "bg-[--cs-info-bg]", border: "border-[--cs-info-soft]" },
          { label: "Sleeping", value: stats.sleeping, color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]", border: "border-[--cs-success-soft]" },
          { label: "Concerns", value: stats.concerns, color: stats.concerns > 0 ? "text-[--cs-warning]" : "text-[--cs-success]", bg: stats.concerns > 0 ? "bg-[--cs-warning-bg]" : "bg-[--cs-success-bg]", border: stats.concerns > 0 ? "border-[--cs-warning-soft]" : "border-[--cs-success-soft]" },
          { label: "Distressed", value: stats.distressed, color: stats.distressed > 0 ? "text-[--cs-risk]" : "text-[--cs-success]", bg: stats.distressed > 0 ? "bg-[--cs-risk-bg]" : "bg-[--cs-success-bg]", border: stats.distressed > 0 ? "border-[--cs-risk-soft]" : "border-[--cs-success-soft]" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {ypSummary.map((yp) => {
          const lastSs = yp.lastCheck ? SLEEP_STATUS_CONFIG[yp.lastCheck.sleep_status] : null;
          return (
            <div key={yp.id} className={cn("rounded-lg border p-3", yp.hasConcern ? "border-[--cs-warning-soft] bg-[--cs-warning-bg]" : "border-slate-200 bg-white")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">{yp.name}</span>
                {yp.hasConcern && <Badge className="bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft] text-[9px] px-1.5 py-0">Concern</Badge>}
              </div>
              <div className="text-[10px] text-slate-500">{yp.checkCount} check{yp.checkCount !== 1 ? "s" : ""} recorded</div>
              {yp.lastCheck && lastSs && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <lastSs.icon className={cn("h-3 w-3", lastSs.color)} />
                  <span className="text-[10px] text-slate-600">Last: {yp.lastCheck.time} — {lastSs.label}</span>
                </div>
              )}
              {yp.checkCount === 0 && <div className="text-[10px] text-[--cs-risk] font-medium mt-1">No checks recorded yet</div>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableDates.map((dt) => <SelectItem key={dt} value={dt}>{dt === d(0) ? `Tonight (${dt})` : dt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Young person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as NightCheckSleepStatus | "all")}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(SLEEP_STATUS_CONFIG) as NightCheckSleepStatus[]).map((s) => <SelectItem key={s} value={s}>{SLEEP_STATUS_CONFIG[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="time_desc">Latest first</SelectItem>
              <SelectItem value="time_asc">Earliest first</SelectItem>
              <SelectItem value="child">Young person</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => { setSearch(""); setChildFilter("all"); setStatusFilter("all"); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Moon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No checks recorded</p>
          <p className="text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "No night checks for this date yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">{filtered.map((check) => <CheckRow key={check.id} check={check} />)}</div>
      )}

      <div className="text-center text-[10px] text-slate-400 mt-6">
        Showing {filtered.length} check{filtered.length !== 1 ? "s" : ""} for {dateFilter === d(0) ? "tonight" : dateFilter}
      </div>

      <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Moon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1">About Night Checks</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Night checks are a regulatory requirement under the Children&apos;s Homes Regulations 2015
              (Reg 12 — Protection of Children). Staff must monitor the welfare of young people during
              overnight hours, recording sleep observations, any concerns, and follow-up actions.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><Moon className="h-4 w-4 text-indigo-600" /> Record Night Check</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveCheck} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person *</label>
                <Select value={ncForm.child_id} onValueChange={(v) => setNC("child_id", v)}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Check Type</label>
                <Select value={ncForm.check_type} onValueChange={(v) => setNC("check_type", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(NIGHT_CHECK_TYPE_LABEL) as NightCheckType[]).map((t) => <SelectItem key={t} value={t}>{NIGHT_CHECK_TYPE_LABEL[t]}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Sleep Status</label>
                <Select value={ncForm.sleep_status} onValueChange={(v) => setNC("sleep_status", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(SLEEP_STATUS_CONFIG) as NightCheckSleepStatus[]).map((s) => <SelectItem key={s} value={s}>{SLEEP_STATUS_CONFIG[s].label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">Door Position</label>
                <Select value={ncForm.door_position} onValueChange={(v) => setNC("door_position", v)}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="ajar">Ajar</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Notes</label>
              <Textarea placeholder="Observations during this check…" className="text-xs min-h-[60px]" value={ncForm.notes} onChange={(e) => setNC("notes", e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="text-xs" type="button" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button size="sm" className="text-xs" type="submit" disabled={createNightCheck.isPending}>{createNightCheck.isPending ? "Saving…" : "Record Check"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Sleep"
        category="sleep"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Night Checks — welfare checks, sleep observation records, night-time routines, safe sleeping, presence monitoring, waking night staff, Reg 31 evidence, young person welfare"
        recordType="daily_log"
        className="mt-6"
      />
    </PageShell>
  );
}
