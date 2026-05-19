"use client";

import { useState, useMemo } from "react";
import {
  Moon, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, Clock, CheckCircle2,
  ChevronDown, ChevronUp, CloudMoon, Sun, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useSleepLog, useCreateSleepLogEntry } from "@/hooks/use-sleep-log";
import { toast } from "sonner";
import type { SleepLogEntry, SleepShiftType, SleepDisturbanceLevel, SleepDisturbance } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── config ──────────────────────────────────────────────────────────── */
const SHIFT_TYPES: SleepShiftType[] = ["sleep_in", "waking_night"];
const SHIFT_LABELS: Record<SleepShiftType, string> = {
  sleep_in: "Sleep-in", waking_night: "Waking Night",
};

const DISTURBANCE_LEVELS: SleepDisturbanceLevel[] = ["none", "minor", "moderate", "significant"];
const DISTURBANCE_COLORS: Record<SleepDisturbanceLevel, string> = {
  none: "bg-green-100 text-green-800", minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800", significant: "bg-red-100 text-red-800",
};


/* ── component ───────────────────────────────────────────────────────── */
export default function SleepLogPage() {
  const { data: slData, isLoading } = useSleepLog();
  const createEntry = useCreateSleepLogEntry();
  const entries = slData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          getStaffName(e.staff_id).toLowerCase().includes(q) ||
          e.handover_notes.toLowerCase().includes(q) ||
          e.morning_handover.toLowerCase().includes(q) ||
          e.disturbances.some((d) => d.young_person.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((e) => e.shift_type === filterType);
    if (filterLevel !== "all") list = list.filter((e) => e.disturbance_level === filterLevel);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "staff": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "disturbances": return b.disturbances.length - a.disturbances.length;
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterType, filterLevel, sortBy]);

  /* stats */
  const totalNights = entries.length;
  const quietNights = entries.filter((e) => e.disturbance_level === "none").length;
  const totalDisturbances = entries.reduce((s, e) => s + e.disturbances.length, 0);
  const significantNights = entries.filter((e) => e.disturbance_level === "significant").length;

  const exportCols: ExportColumn<SleepLogEntry>[] = [
    { header: "ID", accessor: (r: SleepLogEntry) => r.id },
    { header: "Date", accessor: (r: SleepLogEntry) => r.date },
    { header: "Shift Type", accessor: (r: SleepLogEntry) => SHIFT_LABELS[r.shift_type] },
    { header: "Staff", accessor: (r: SleepLogEntry) => getStaffName(r.staff_id) },
    { header: "Start", accessor: (r: SleepLogEntry) => r.start_time },
    { header: "End", accessor: (r: SleepLogEntry) => r.end_time },
    { header: "Disturbance Level", accessor: (r: SleepLogEntry) => r.disturbance_level },
    { header: "No. Disturbances", accessor: (r: SleepLogEntry) => r.disturbances.length },
    { header: "Disturbance Details", accessor: (r: SleepLogEntry) => r.disturbances.map((d: SleepDisturbance) => `${d.time} — ${d.young_person}: ${d.description}`).join("; ") },
    { header: "Building Secure", accessor: (r: SleepLogEntry) => r.building_secure ? "Yes" : "No" },
    { header: "Alarms Set", accessor: (r: SleepLogEntry) => r.alarms_set ? "Yes" : "No" },
    { header: "Hours Slept", accessor: (r: SleepLogEntry) => r.hours_slept?.toString() ?? "N/A (Waking)" },
    { header: "Handover Notes", accessor: (r: SleepLogEntry) => r.handover_notes },
    { header: "Morning Handover", accessor: (r: SleepLogEntry) => r.morning_handover },
  ];

  return (
    <PageShell
      title="Sleep-in & Waking Night Log"
      subtitle="Overnight shift records, disturbances, and morning handover"
      ariaContext={{ pageTitle: "Sleep Log", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Sleep-in & Waking Night Log" />
          <ExportButton data={filtered} columns={exportCols} filename="sleep-log" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Entry
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Nights", value: totalNights, icon: Moon, colour: "text-indigo-600" },
            { label: "Quiet Nights", value: quietNights, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Total Disturbances", value: totalDisturbances, icon: Clock, colour: "text-orange-600" },
            { label: "Significant Nights", value: significantNights, icon: AlertTriangle, colour: significantNights > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
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

        {/* ── alerts ────────────────────────────────────────────── */}
        {significantNights > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{significantNights}</strong> night(s) with significant disturbances in this period —
                review patterns and consider support plan adjustments.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, young people, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shift Types</SelectItem>
                {SHIFT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{SHIFT_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {DISTURBANCE_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="staff">Staff Name</SelectItem>
                <SelectItem value="disturbances">Most Disturbances</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No entries match your filters.</div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expanded === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.shift_type === "sleep_in" ? (
                      <CloudMoon className="h-5 w-5 text-indigo-600 shrink-0" />
                    ) : (
                      <Moon className="h-5 w-5 text-[var(--cs-aria-gold)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{entry.date} — {SHIFT_LABELS[entry.shift_type]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getStaffName(entry.staff_id)} · {entry.start_time}–{entry.end_time} · {entry.disturbances.length} disturbance(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", DISTURBANCE_COLORS[entry.disturbance_level])}>
                      {entry.disturbance_level.charAt(0).toUpperCase() + entry.disturbance_level.slice(1)}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* security checks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-4 w-4", entry.building_secure ? "text-green-600" : "text-red-600")} />
                        <span>Building Secure: <strong>{entry.building_secure ? "Yes" : "No"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-4 w-4", entry.alarms_set ? "text-green-600" : "text-red-600")} />
                        <span>Alarms Set: <strong>{entry.alarms_set ? "Yes" : "No"}</strong></span>
                      </div>
                      {entry.hours_slept !== null && (
                        <div><span className="text-muted-foreground">Hours Slept:</span> <strong>{entry.hours_slept}h</strong></div>
                      )}
                    </div>

                    {/* evening handover */}
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                      <p className="text-xs font-medium text-indigo-700 mb-1">Evening Handover Notes</p>
                      <p className="text-sm">{entry.handover_notes}</p>
                    </div>

                    {/* checks completed */}
                    <div>
                      <p className="text-sm font-medium mb-2">Checks Completed</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                        {entry.checks_completed.map((check: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* disturbances */}
                    {entry.disturbances.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Disturbances</p>
                        <div className="space-y-2">
                          {entry.disturbances.map((dist: SleepDisturbance, idx: number) => (
                            <div key={idx} className="rounded-lg border bg-white p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">{dist.time}</Badge>
                                <span className="font-medium text-sm">{dist.young_person}</span>
                                <Badge variant="outline" className="text-xs">{dist.duration} min</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{dist.description}</p>
                              <p className="text-sm"><strong>Action:</strong> {dist.action_taken}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* morning handover */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Sun className="h-4 w-4 text-amber-600" />
                        <p className="text-xs font-medium text-amber-700">Morning Handover</p>
                      </div>
                      <p className="text-sm">{entry.morning_handover}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Overnight Records:</strong> All overnight shifts must be recorded with building security
          checks, disturbance logs, and morning handover. Records are reviewed by the Registered Manager
          and are subject to Reg 44 inspection. Waking night staff must maintain hourly awareness checks.
        </div>
      </div>
      )}

      {/* ── create dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Sleep / Waking Night Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createEntry.mutate({
              date: fd.get("date") as string,
              shift_type: fd.get("shift_type") as SleepShiftType,
              staff_id: fd.get("staff_id") as string || "staff_darren",
              start_time: fd.get("start_time") as string,
              end_time: fd.get("end_time") as string,
              disturbance_level: "none" as SleepDisturbanceLevel,
              disturbances: [],
              checks_completed: [],
              building_secure: true,
              alarms_set: true,
              handover_notes: fd.get("handover_notes") as string,
              morning_handover: "",
              hours_slept: null,
            } as Partial<SleepLogEntry>, {
              onSuccess: () => { toast.success("Entry saved"); setShowNew(false); },
              onError: () => toast.error("Failed to save"),
            });
          }} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div>
              <div><Label>Shift Type</Label>
                <select name="shift_type" required className="w-full rounded-md border px-3 py-2 text-sm">
                  {SHIFT_TYPES.map((t) => <option key={t} value={t}>{SHIFT_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" name="start_time" defaultValue="22:00" required /></div>
              <div><Label>End Time</Label><Input type="time" name="end_time" defaultValue="07:00" required /></div>
            </div>
            <div><Label>Handover Notes</Label><Textarea name="handover_notes" placeholder="Evening handover notes…" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createEntry.isPending}>
                {createEntry.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : "Save Entry"}
              </Button>
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
      <AriaPanel
        mode="assist"
        pageContext="Sleep Log — daily child sleep records, sleep quality, night-time disturbances, sleep intervention records, bedtime routine compliance, care plan evidence, Reg 45 wellbeing evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
