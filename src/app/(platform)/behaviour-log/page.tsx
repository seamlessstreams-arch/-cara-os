"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR LOG
// Records observed behaviours using the ABC model (Antecedent, Behaviour,
// Consequence). Captures both positive and concerning behaviour to build
// patterns and inform care planning. Supports Reg 11 (Positive Relationships)
// and Reg 12 (Protection of Children).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
import { toast } from "sonner";
import { useBehaviourLog, useCreateBehaviourEntry } from "@/hooks/use-behaviour-log";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { BehaviourEntry, BehaviourDirection, BehaviourIntensity } from "@/types/extended";
import {
  Search, ArrowUpDown, X, Plus, Activity,
  CheckCircle2, AlertTriangle, User, Calendar,
  ChevronDown, ChevronUp, Shield, Smile, Frown,
  TrendingUp, Zap, Heart, Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const INTENSITY_CONFIG: Record<BehaviourIntensity, { label: string; colour: string }> = {
  low:      { label: "Low",      colour: "bg-green-100 text-green-700" },
  moderate: { label: "Moderate", colour: "bg-amber-100 text-amber-700" },
  high:     { label: "High",     colour: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", colour: "bg-red-100 text-red-700" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BehaviourLogPage() {
  const { currentUser } = useAuthContext();

  const { data: result, isLoading } = useBehaviourLog();
  const entries = result?.data ?? [];
  const createEntry = useCreateBehaviourEntry();

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [intensityFilter, setIntensityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "positive" | "concerns">("all");

  // new form
  const [nChild, setNChild] = useState("");
  const [nDir, setNDir] = useState<BehaviourDirection | "">("");
  const [nIntensity, setNIntensity] = useState<BehaviourIntensity>("moderate");
  const [nTitle, setNTitle] = useState("");
  const [nAntecedent, setNAntecedent] = useState("");
  const [nBehaviour, setNBehaviour] = useState("");
  const [nConsequence, setNConsequence] = useState("");
  const [nTrigger, setNTrigger] = useState("");
  const [nStrategy, setNStrategy] = useState("");
  const [nOutcome, setNOutcome] = useState("");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "positive") list = list.filter(e => e.direction === "positive");
    if (tab === "concerns") list = list.filter(e => e.direction === "concern");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (intensityFilter !== "all") list = list.filter(e => e.intensity === intensityFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.behaviour.toLowerCase().includes(q) ||
        e.antecedent.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "intensity": {
          const io: Record<BehaviourIntensity, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
          return io[a.intensity] - io[b.intensity];
        }
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, intensityFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const positive = entries.filter(e => e.direction === "positive").length;
    const concerns = entries.filter(e => e.direction === "concern").length;
    return {
      total: entries.length,
      positive,
      concerns,
      ratio: concerns > 0 ? (positive / concerns).toFixed(1) : "∞",
      highCritical: entries.filter(e => e.direction === "concern" && (e.intensity === "high" || e.intensity === "critical")).length,
    };
  }, [entries]);

  /* ── per-child ratios ───────────────────────────────────────────────────── */
  const childRatios = useMemo(() => {
    const map = new Map<string, { positive: number; concerns: number }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { positive: 0, concerns: 0 };
      if (e.direction === "positive") cur.positive++; else cur.concerns++;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<BehaviourEntry>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Date", accessor: r => r.date },
    { header: "Time", accessor: r => r.time },
    { header: "Direction", accessor: r => r.direction === "positive" ? "Positive" : "Concern" },
    { header: "Intensity", accessor: r => INTENSITY_CONFIG[r.intensity]?.label ?? String(r.intensity ?? "—") },
    { header: "Title", accessor: r => r.title },
    { header: "Antecedent", accessor: r => r.antecedent },
    { header: "Behaviour", accessor: r => r.behaviour },
    { header: "Consequence", accessor: r => r.consequence },
    { header: "Trigger", accessor: r => r.trigger },
    { header: "Strategy Used", accessor: r => r.strategy_used },
    { header: "Outcome", accessor: r => r.outcome },
    { header: "Recorded By", accessor: r => getStaffName(r.recorded_by) },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nDir || !nTitle || !nBehaviour) return;
    createEntry.mutate({
      child_id: nChild,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      direction: nDir as BehaviourDirection,
      intensity: nIntensity,
      title: nTitle,
      antecedent: nAntecedent,
      behaviour: nBehaviour,
      consequence: nConsequence,
      trigger: nTrigger,
      strategy_used: nStrategy,
      outcome: nOutcome,
      recorded_by: currentUser?.id || "staff_darren",
    });
    toast.success("Behaviour entry recorded");
    setShowNew(false);
    setNChild(""); setNDir(""); setNIntensity("moderate"); setNTitle("");
    setNAntecedent(""); setNBehaviour(""); setNConsequence("");
    setNTrigger(""); setNStrategy(""); setNOutcome("");
  };

  if (isLoading) {
    return (
      <PageShell title="Behaviour Log" subtitle="ABC observations — antecedent, behaviour, consequence">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Behaviour Log"
      subtitle="ABC observations — antecedent, behaviour, consequence"
      ariaContext={{ pageTitle: "Behaviour Log", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Behaviour Log" subtitle="Chamberlain House — Behaviour Management" />
          <ExportButton data={filtered} columns={exportCols} filename="behaviour-log" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log Behaviour
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >      <AriaPanel mode="assist" pageContext="Behaviour Log — ABC observations, antecedent-behaviour-consequence, intensity tracking, positive behaviour support" recordType="behaviour_log" userRole="registered_manager" className="mb-2" />      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Entries", value: stats.total, icon: Activity, c: "text-blue-600" },
          { label: "Positive",      value: stats.positive, icon: Smile, c: "text-green-600" },
          { label: "Concerns",      value: stats.concerns, icon: Frown, c: "text-amber-600" },
          { label: "Pos:Con Ratio", value: `${stats.ratio}:1`, icon: TrendingUp, c: "text-purple-600" },
          { label: "High/Critical", value: stats.highCritical, icon: Zap, c: "text-red-600" },
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

      {/* ── Per-child cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const r = childRatios.get(cid)!;
          const ratio = r.concerns > 0 ? (r.positive / r.concerns).toFixed(1) : "∞";
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{getYPName(cid)}</p>
                <Badge variant="outline" className="text-xs">{ratio}:1</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Smile className="h-3 w-3 text-green-600" />{r.positive} positive</span>
                <span className="flex items-center gap-1"><Frown className="h-3 w-3 text-amber-600" />{r.concerns} concern{r.concerns !== 1 ? "s" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All", count: entries.length },
          { key: "positive", label: "Positive", count: stats.positive },
          { key: "concerns", label: "Concerns", count: stats.concerns },
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
        <Select value={intensityFilter} onValueChange={setIntensityFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Intensity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {(Object.entries(INTENSITY_CONFIG) as [BehaviourIntensity, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="intensity">By Intensity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
        {(search || childFilter !== "all" || intensityFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Entry Cards ───────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="behaviour-log-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No entries found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const isPositive = entry.direction === "positive";
          const ic = INTENSITY_CONFIG[entry.intensity] ?? { label: String(entry.intensity ?? "—"), colour: "bg-slate-100 text-slate-700" };

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-card overflow-hidden",
              isPositive ? "border-l-4 border-l-green-400" : "border-l-4 border-l-amber-400"
            )}>
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0",
                  isPositive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isPositive ? <Smile className="h-4 w-4" /> : <Frown className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.title}</span>
                    <Badge variant="outline" className={cn("text-xs",
                      isPositive ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {isPositive ? "Positive" : "Concern"}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", ic.colour)}>{ic.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(entry.child_id)} · {formatDate(entry.date)} at {entry.time} · {getStaffName(entry.recorded_by)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  {(entry as never as { care_event_id?: string }).care_event_id && (
                    <Link
                      href={`/care-events/${(entry as never as { care_event_id: string }).care_event_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Zap className="h-3 w-3" />
                      Logged from Care Event
                    </Link>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border p-2.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">A — Antecedent</p>
                      <p className="text-sm">{entry.antecedent}</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">B — Behaviour</p>
                      <p className="text-sm">{entry.behaviour}</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">C — Consequence</p>
                      <p className="text-sm">{entry.consequence}</p>
                    </div>
                  </div>
                  {entry.trigger && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Identified Trigger</p>
                      <p className="text-sm">{entry.trigger}</p>
                    </div>
                  )}
                  {entry.strategy_used && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Strategy Used</p>
                      <p className="text-sm">{entry.strategy_used}</p>
                    </div>
                  )}
                  {entry.outcome && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outcome</p>
                      <p className="text-sm">{entry.outcome}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.recorded_by)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(entry.date)} at {entry.time}</span>
                  </div>
                  <SmartLinkPanel sourceType="behaviour_log" sourceId={entry.id} childId={entry.child_id} compact />
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
              <strong>Regulation 11 (Positive Relationships)</strong> requires staff to use positive relationships to
              encourage desirable behaviour. <strong>Regulation 12 (Protection)</strong> ensures proportionate responses.
              The ABC model (Antecedent-Behaviour-Consequence) is recommended by Ofsted as best practice for behaviour
              recording, enabling pattern identification and informed care planning.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Behaviour Observation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Child *</label>
                <Select value={nChild} onValueChange={setNChild}>
                  <SelectTrigger><SelectValue placeholder="Child" /></SelectTrigger>
                  <SelectContent>
                    {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Direction *</label>
                <Select value={nDir} onValueChange={v => setNDir(v as BehaviourDirection)}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="concern">Concern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Intensity</label>
              <Select value={nIntensity} onValueChange={v => setNIntensity(v as BehaviourIntensity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(INTENSITY_CONFIG) as [BehaviourIntensity, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="Brief title" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">A — Antecedent</label>
              <Textarea placeholder="What happened before..." value={nAntecedent} onChange={e => setNAntecedent(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">B — Behaviour *</label>
              <Textarea placeholder="What the child did..." value={nBehaviour} onChange={e => setNBehaviour(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">C — Consequence</label>
              <Textarea placeholder="What happened after..." value={nConsequence} onChange={e => setNConsequence(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Trigger</label>
              <Input placeholder="Identified trigger" value={nTrigger} onChange={e => setNTrigger(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Strategy Used</label>
              <Textarea placeholder="De-escalation or reinforcement approach..." value={nStrategy} onChange={e => setNStrategy(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Outcome</label>
              <Textarea placeholder="Result..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nDir || !nTitle || !nBehaviour}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Care Events pipeline — behaviour events routed here */}
      <CareEventsPanel
        title="Care Events — Behaviour"
        category={["behaviour", "physical_intervention", "restraint"]}
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
