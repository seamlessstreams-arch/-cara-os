"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FIRE DRILLS & EMERGENCY PROCEDURES
// Records fire drills, evacuation exercises, and emergency procedure checks.
// Tracks times, attendance, issues identified, and remedial actions.
// Supports Reg 25 (Fire Precautions), Health & Safety at Work Act, and
// Regulatory Reform (Fire Safety) Order 2005.
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
import {
  Search, ArrowUpDown, X, Plus, Flame,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, Shield, Timer, Users,
  XCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useFireDrills, useCreateFireDrill } from "@/hooks/use-fire-drills";
import { FireDrillType, FireDrillResult, FireDrill } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<FireDrillType, { label: string; colour: string }> = {
  fire_drill:      { label: "Fire Drill",       colour: "bg-red-100 text-red-700"    },
  evacuation:      { label: "Evacuation",        colour: "bg-orange-100 text-orange-700" },
  lockdown:        { label: "Lockdown",          colour: "bg-purple-100 text-purple-700" },
  bomb_threat:     { label: "Bomb Threat",       colour: "bg-slate-100 text-[var(--cs-text-secondary)]" },
  flood:           { label: "Flood",             colour: "bg-blue-100 text-blue-700" },
  equipment_check: { label: "Equipment Check",   colour: "bg-green-100 text-green-700" },
};

const RESULT_CONFIG: Record<FireDrillResult, { label: string; colour: string }> = {
  satisfactory:      { label: "Satisfactory",      colour: "bg-green-100 text-green-700" },
  issues_identified: { label: "Issues Identified", colour: "bg-amber-100 text-amber-700" },
  failed:            { label: "Failed",            colour: "bg-red-100 text-red-700"     },
  not_completed:     { label: "Not Completed",     colour: "bg-gray-100 text-gray-600"   },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FireDrillsPage() {
  const { currentUser } = useAuthContext();

  const { data: fdData, isLoading } = useFireDrills();
  const createDrill = useCreateFireDrill();
  const entries = fdData?.data ?? [];
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [nType, setNType] = useState<FireDrillType | "">("");
  const [nTime, setNTime] = useState("");
  const [nEvacTime, setNEvacTime] = useState("");
  const [nResult, setNResult] = useState<FireDrillResult | "">("");
  const [nIssues, setNIssues] = useState("");
  const [nActions, setNActions] = useState("");
  const [nNotes, setNNotes] = useState("");

  const filtered = useMemo(() => {
    let list = [...entries];
    if (typeFilter !== "all") list = list.filter(e => e.drill_type === typeFilter);
    if (resultFilter !== "all") list = list.filter(e => e.result === resultFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.issues.toLowerCase().includes(q) ||
        e.actions_taken.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "time": return (a.evacuation_time_seconds || 999) - (b.evacuation_time_seconds || 999);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, typeFilter, resultFilter, sortBy]);

  const stats = useMemo(() => {
    const drills = entries.filter(e => e.drill_type === "fire_drill" || e.drill_type === "evacuation");
    const avgTime = drills.filter(e => e.evacuation_time_seconds).reduce((sum, e) => sum + (e.evacuation_time_seconds || 0), 0) / (drills.filter(e => e.evacuation_time_seconds).length || 1);
    const nextDue = entries.reduce((min, e) => e.next_drill_due < min ? e.next_drill_due : min, "9999");
    const overdue = nextDue < todayStr();
    return {
      total: entries.length,
      satisfactory: entries.filter(e => e.result === "satisfactory").length,
      issues: entries.filter(e => e.result === "issues_identified" || e.result === "failed").length,
      avgTime: Math.round(avgTime),
      nextDue,
      overdue,
    };
  }, [entries]);

  const exportCols: ExportColumn<FireDrill>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Date", accessor: r => r.date },
    { header: "Time", accessor: r => r.time },
    { header: "Type", accessor: r => TYPE_CONFIG[r.drill_type].label },
    { header: "Evacuation Time (s)", accessor: r => r.evacuation_time_seconds?.toString() || "N/A" },
    { header: "Result", accessor: r => RESULT_CONFIG[r.result].label },
    { header: "All Present", accessor: r => r.all_present ? "Yes" : "No" },
    { header: "Children", accessor: r => r.children_present.map(c => getYPName(c)).join(", ") },
    { header: "Staff", accessor: r => r.staff_present.map(s => getStaffName(s)).join(", ") },
    { header: "Issues", accessor: r => r.issues },
    { header: "Actions", accessor: r => r.actions_taken },
    { header: "Next Due", accessor: r => r.next_drill_due },
    { header: "Conducted By", accessor: r => getStaffName(r.conducted_by) },
  ];

  const handleCreate = () => {
    if (!nType || !nResult) return;
    createDrill.mutate({
      date: todayStr(),
      time: nTime || new Date().toTimeString().slice(0, 5),
      drill_type: nType as FireDrillType,
      evacuation_time_seconds: nEvacTime ? parseInt(nEvacTime) : null,
      result: nResult as FireDrillResult,
      all_present: true,
      children_present: ["yp_alex", "yp_jordan", "yp_casey"],
      staff_present: [currentUser?.id || "staff_darren"],
      issues: nIssues,
      actions_taken: nActions,
      next_drill_due: "", // will be set properly later
      conducted_by: currentUser?.id || "staff_darren",
      notes: nNotes,
    } as Partial<FireDrill>, {
      onSuccess: () => {
        toast.success("Drill recorded");
        setShowNew(false);
        setNType(""); setNTime(""); setNEvacTime(""); setNResult("");
        setNIssues(""); setNActions(""); setNNotes("");
      },
      onError: () => toast.error("Failed to record drill"),
    });
  };

  if (isLoading) {
    return (
      <PageShell title="Fire Drills & Emergency Procedures" subtitle="Evacuation drills, equipment checks, and emergency readiness">
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading fire drills…</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Fire Drills & Emergency Procedures"
      subtitle="Evacuation drills, equipment checks, and emergency readiness"
      ariaContext={{ pageTitle: "Fire Drills & Emergency Procedures", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Fire Drills" subtitle="Oak House — Health & Safety" />
          <ExportButton data={filtered} columns={exportCols} filename="fire-drills" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Record Drill
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Drills",   value: stats.total, icon: Flame, c: "text-red-600" },
          { label: "Satisfactory",   value: stats.satisfactory, icon: CheckCircle2, c: "text-green-600" },
          { label: "Issues Found",   value: stats.issues, icon: AlertTriangle, c: "text-amber-600" },
          { label: "Avg Time",       value: `${stats.avgTime}s`, icon: Timer, c: "text-blue-600" },
          { label: "Next Due",       value: formatDate(stats.nextDue), icon: Calendar, c: stats.overdue ? "text-red-600" : "text-indigo-600" },
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

      {stats.overdue && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            Fire drill is <strong>overdue</strong> — was due {formatDate(stats.nextDue)}. Schedule immediately.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(TYPE_CONFIG) as [FireDrillType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Result" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            {(Object.entries(RESULT_CONFIG) as [FireDrillResult, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="time">Fastest Evac</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3" id="fire-drills-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No records found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const tc = TYPE_CONFIG[entry.drill_type];
          const rc = RESULT_CONFIG[entry.result];

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-card overflow-hidden",
              entry.result === "failed" && "border-red-200"
            )}>
              <button onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
                <div className={cn("rounded-full p-1.5 shrink-0", tc.colour)}>
                  <Flame className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{tc.label}</span>
                    <Badge variant="outline" className={cn("text-xs", rc.colour)}>{rc.label}</Badge>
                    {entry.evacuation_time_seconds && (
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-0.5" />
                        {Math.floor(entry.evacuation_time_seconds / 60)}m {entry.evacuation_time_seconds % 60}s
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(entry.date)} at {entry.time} · {getStaffName(entry.conducted_by)}
                    · {entry.children_present.length} children · {entry.staff_present.length} staff
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issues / Observations</p>
                    <p className="text-sm">{entry.issues}</p>
                  </div>
                  {entry.actions_taken && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Actions Taken</p>
                      <p className="text-sm">{entry.actions_taken}</p>
                    </div>
                  )}
                  {entry.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                      <p className="text-sm">{entry.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span><Users className="inline h-3.5 w-3.5 mr-0.5" />Children: {entry.children_present.map(c => getYPName(c)).join(", ") || "None"}</span>
                    <span><Users className="inline h-3.5 w-3.5 mr-0.5" />Staff: {entry.staff_present.map(s => getStaffName(s)).join(", ")}</span>
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Next due: {formatDate(entry.next_drill_due)}</span>
                  </div>
                  {entry.children_present.length > 0 && <SmartLinkPanel sourceType="fire_drill" sourceId={entry.id} childId={entry.children_present[0]} compact />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 25 (Fire Precautions)</strong> requires fire drills at least quarterly, covering
              day, evening, and night scenarios. The <strong>Regulatory Reform (Fire Safety) Order 2005</strong>
              requires a responsible person to carry out regular fire risk assessments and maintain equipment.
              Drill records must include evacuation times, issues identified, and remedial actions taken. Ofsted
              inspectors check fire drill logs during every inspection.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Drill / Check</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Type *</label>
                <Select value={nType} onValueChange={v => setNType(v as FireDrillType)}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TYPE_CONFIG) as [FireDrillType, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Time</label>
                <Input type="time" value={nTime} onChange={e => setNTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Evacuation Time (seconds)</label>
                <Input type="number" placeholder="e.g. 120" value={nEvacTime} onChange={e => setNEvacTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Result *</label>
                <Select value={nResult} onValueChange={v => setNResult(v as FireDrillResult)}>
                  <SelectTrigger><SelectValue placeholder="Result" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(RESULT_CONFIG) as [FireDrillResult, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Issues / Observations</label>
              <Textarea placeholder="Any issues observed..." value={nIssues} onChange={e => setNIssues(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Actions Taken</label>
              <Textarea placeholder="Remedial actions..." value={nActions} onChange={e => setNActions(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea placeholder="Additional notes..." value={nNotes} onChange={e => setNNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nType || !nResult}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Fire Drills & Emergency Procedures — fire drills, evacuation, emergency procedures, frequency records, BS 5839, Reg 31, Health & Safety, fire risk, Ofsted, Annex A evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
