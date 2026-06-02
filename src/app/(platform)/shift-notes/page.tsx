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
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Clock, Sun, Moon, Sunset, AlertTriangle, CheckCircle2,
  FileText, Star, Loader2,
} from "lucide-react";
import { useShiftNoteRecords, useCreateShiftNoteRecord } from "@/hooks/use-shift-note-records";
import { toast } from "sonner";
import { STAFF } from "@/lib/seed-data";
import type { ShiftNoteRecord, ShiftNoteShiftType } from "@/types/extended";
import { SHIFT_NOTE_SHIFT_TYPE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (icons are React.ReactNode — cannot serialize) ─────────── */

const SHIFT_META: Record<ShiftNoteShiftType, { icon: React.ReactNode; color: string; times: string }> = {
  morning:   { icon: <Sun className="h-4 w-4" />,    color: "bg-amber-100 text-amber-800",   times: "07:00 – 14:00" },
  afternoon: { icon: <Sunset className="h-4 w-4" />, color: "bg-orange-100 text-orange-800", times: "14:00 – 21:00" },
  evening:   { icon: <Moon className="h-4 w-4" />,   color: "bg-indigo-100 text-indigo-800", times: "21:00 – 23:00" },
  night:     { icon: <Moon className="h-4 w-4" />,   color: "bg-slate-100 text-[var(--cs-navy)]",   times: "23:00 – 07:00" },
  sleep_in:  { icon: <Moon className="h-4 w-4" />,   color: "bg-purple-100 text-purple-800", times: "23:00 – 07:00" },
};

const MOOD_META: Record<string, { label: string; emoji: string; color: string }> = {
  great:     { label: "Great",     emoji: "😊", color: "text-green-600" },
  good:      { label: "Good",      emoji: "🙂", color: "text-blue-600" },
  okay:      { label: "Okay",      emoji: "😐", color: "text-gray-600" },
  low:       { label: "Low",       emoji: "😟", color: "text-amber-600" },
  distressed:{ label: "Distressed",emoji: "😢", color: "text-red-600" },
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── component ────────────────────────────────────────────────────────────── */

export default function ShiftNotesPage() {
  const { data: records = [], isLoading } = useShiftNoteRecords();
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createNote = useCreateShiftNoteRecord();
  const [snForm, setSnForm] = useState({ date: new Date().toISOString().slice(0, 10), shift: "evening" as ShiftNoteShiftType, general_notes: "", handover: "", outstanding: "" });
  const setSNF = (k: keyof typeof snForm, v: string) => setSnForm((p) => ({ ...p, [k]: v }));

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snForm.general_notes.trim()) { toast.error("General notes are required."); return; }
    const meta = SHIFT_META[snForm.shift];
    const [start, end] = meta.times.split(" – ");
    await createNote.mutateAsync({ date: snForm.date, shift: snForm.shift, start_time: start || "19:00", end_time: end || "22:00", staff_on_duty: ["staff_darren"], child_notes: [], general_notes: snForm.general_notes.trim(), maintenance_issues: "", visitors_log: "", handover_priorities: snForm.handover ? snForm.handover.split("\n").map((s) => s.trim()).filter(Boolean) : [], incidents_ref: [], completed_tasks: [], outstanding_tasks: snForm.outstanding ? snForm.outstanding.split("\n").map((s) => s.trim()).filter(Boolean) : [], recorded_by: "staff_darren", created_at: new Date().toISOString() });
    toast.success("Shift note saved.");
    setSnForm({ date: new Date().toISOString().slice(0, 10), shift: "evening", general_notes: "", handover: "", outstanding: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((n) => n.general_notes.toLowerCase().includes(s) || n.child_notes.some((cn) => cn.summary.toLowerCase().includes(s)) || n.handover_priorities.some((h) => h.toLowerCase().includes(s)));
    }
    if (shiftFilter !== "all") list = list.filter((n) => n.shift === shiftFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":  return b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time);
        case "shift": return SHIFT_NOTE_SHIFT_TYPE_LABEL[a.shift].localeCompare(SHIFT_NOTE_SHIFT_TYPE_LABEL[b.shift]);
        default:      return 0;
      }
    });
    return list;
  }, [records, search, shiftFilter, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const today = records.filter((n) => n.date === d(0)).length;
    const outstandingTotal = records.reduce((a, n) => a + (n.outstanding_tasks?.length ?? 0), 0);
    const concerns = records.flatMap((n) => n.child_notes).filter((cn) => cn.concerns).length;
    return { total, today, outstandingTotal, concerns };
  }, [records]);

  const exportCols: ExportColumn<ShiftNoteRecord>[] = [
    { header: "ID",               accessor: (r) => r.id },
    { header: "Date",             accessor: (r) => r.date },
    { header: "Shift",            accessor: (r) => SHIFT_NOTE_SHIFT_TYPE_LABEL[r.shift] },
    { header: "Times",            accessor: (r) => `${r.start_time} – ${r.end_time}` },
    { header: "Staff on Duty",    accessor: (r) => r.staff_on_duty.map(getStaffName).join(", ") },
    { header: "General Notes",    accessor: (r) => r.general_notes },
    { header: "Handover",         accessor: (r) => r.handover_priorities.join("; ") },
    { header: "Completed Tasks",  accessor: (r) => r.completed_tasks.join("; ") },
    { header: "Outstanding",      accessor: (r) => r.outstanding_tasks.join("; ") },
    { header: "Maintenance",      accessor: (r) => r.maintenance_issues || "—" },
    { header: "Visitors",         accessor: (r) => r.visitors_log || "—" },
    { header: "Recorded By",      accessor: (r) => getStaffName(r.recorded_by) },
  ];

  if (isLoading) {
    return (
      <PageShell title="Shift Notes" subtitle="Detailed per-shift records for continuity of care across the team">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Shift Notes"
      subtitle="Detailed per-shift records for continuity of care across the team"
      ariaContext={{ pageTitle: "Shift Notes", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Shift Notes" />
          <ExportButton data={filtered} columns={exportCols} filename="shift-notes" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Shift Note</Button>
          <AriaStudioQuickActionButton context={{ record_type: "daily_log", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <AriaPanel mode="assist" pageContext="Shift Notes — detailed per-shift records for continuity of care, handover observations, children's behaviour, significant events" recordType="shift_note" userRole="registered_manager" className="mb-2" />
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Entries",   value: stats.total,            icon: <FileText className="h-4 w-4" />,      color: "text-blue-600" },
            { label: "Today",           value: stats.today,            icon: <Sun className="h-4 w-4" />,           color: "text-amber-600" },
            { label: "Outstanding Tasks",value: stats.outstandingTotal,icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
            { label: "Concerns Logged", value: stats.concerns,         icon: <Star className="h-4 w-4" />,          color: "text-purple-600" },
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

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shift notes…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={shiftFilter} onValueChange={setShiftFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Shift" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {(Object.keys(SHIFT_NOTE_SHIFT_TYPE_LABEL) as ShiftNoteShiftType[]).map((k) => <SelectItem key={k} value={k}>{SHIFT_NOTE_SHIFT_TYPE_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="shift">Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Shift notes list ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No shift notes match your filters.</p>}
          {filtered.map((n) => {
            const open = !!expanded[n.id];
            const shiftM = SHIFT_META[n.shift];
            const hasOutstanding = (n.outstanding_tasks?.length ?? 0) > 0;
            const hasConcerns = n.child_notes.some((cn) => cn.concerns);
            return (
              <Card key={n.id} className={cn("border-l-4", n.shift === "night" || n.shift === "sleep_in" ? "border-l-indigo-400" : n.shift === "morning" ? "border-l-amber-400" : "border-l-orange-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(n.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", shiftM.color)}>{shiftM.icon}<span className="ml-1">{SHIFT_NOTE_SHIFT_TYPE_LABEL[n.shift]}</span></Badge>
                        <Badge variant="outline" className="text-xs">{shiftM.times}</Badge>
                        {hasOutstanding && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{(n.outstanding_tasks?.length ?? 0)} outstanding</Badge>}
                        {hasConcerns && <Badge variant="outline" className="text-xs text-red-600 border-red-300">Concerns</Badge>}
                      </div>
                      <p className="font-semibold">{n.date} — {SHIFT_NOTE_SHIFT_TYPE_LABEL[n.shift]} Shift</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Staff: {n.staff_on_duty.map(getStaffName).join(", ")}</span>
                        <span>By {getStaffName(n.recorded_by)}</span>
                      </div>
                      {/* Child mood overview */}
                      <div className="flex items-center gap-3 mt-2">
                        {(n.child_notes ?? []).map((cn) => (
                          <span key={cn.child_id} className="flex items-center gap-1 text-xs">
                            <span>{getYPName(cn.child_id)}</span>
                            <span className={MOOD_META[cn.mood]?.color}>{MOOD_META[cn.mood]?.emoji}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-3 text-sm">
                      {/* Per-child notes */}
                      {(n.child_notes ?? []).map((childNote) => (
                        <div key={childNote.child_id} className="bg-muted/40 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{getYPName(childNote.child_id)}</p>
                            <span className={cn("text-xs font-medium", MOOD_META[childNote.mood]?.color)}>{MOOD_META[childNote.mood]?.emoji} {MOOD_META[childNote.mood]?.label}</span>
                          </div>
                          <p className="text-xs mb-1">{childNote.summary}</p>
                          {childNote.meals && <p className="text-xs text-muted-foreground">Meals: {childNote.meals}</p>}
                          {childNote.concerns && (
                            <div className="mt-1 flex items-start gap-1 text-xs text-red-700 bg-red-50 p-1.5 rounded">
                              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{childNote.concerns}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">General Notes</p>
                        <p>{n.general_notes}</p>
                      </div>

                      {n.visitors_log && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Visitors</p>
                          <p className="text-xs">{n.visitors_log}</p>
                        </div>
                      )}

                      {n.maintenance_issues && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Maintenance Issues</p>
                          <p className="text-xs text-amber-700">{n.maintenance_issues}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Completed Tasks</p>
                          <ul className="text-xs space-y-0.5">{(n.completed_tasks ?? []).map((t, i) => (
                            <li key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />{t}</li>
                          ))}</ul>
                        </div>
                        {(n.outstanding_tasks?.length ?? 0) > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Outstanding Tasks</p>
                            <ul className="text-xs space-y-0.5">{(n.outstanding_tasks ?? []).map((t, i) => (
                              <li key={i} className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-600" />{t}</li>
                            ))}</ul>
                          </div>
                        )}
                      </div>

                      {n.handover_priorities.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-blue-800 mb-1 text-xs">Handover Priorities</p>
                          <ul className="text-xs text-blue-900 space-y-0.5">{n.handover_priorities.map((h, i) => (
                            <li key={i} className="flex items-center gap-1"><Star className="h-3 w-3 text-blue-500" />{h}</li>
                          ))}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Shift notes must be completed before the end of each shift. They form part of the daily record and are referenced during handover, Reg 44 visits, and Ofsted inspections. Outstanding tasks must be handed over to the incoming team. Each child&apos;s mood, meals, and any concerns should be recorded every shift.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New shift note dialog ─────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Shift Note</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateNote} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={snForm.date} onChange={(e) => setSNF("date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Shift</label>
                <Select value={snForm.shift} onValueChange={(v) => setSNF("shift", v)}><SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                  <SelectContent>{(Object.keys(SHIFT_NOTE_SHIFT_TYPE_LABEL) as ShiftNoteShiftType[]).map((k) => <SelectItem key={k} value={k}>{SHIFT_NOTE_SHIFT_TYPE_LABEL[k]} ({SHIFT_META[k].times})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">General Notes *</label>
              <Textarea placeholder="Overview of the shift…" rows={4} value={snForm.general_notes} onChange={(e) => setSNF("general_notes", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Handover Priorities</label>
              <Textarea placeholder="One priority per line" rows={2} value={snForm.handover} onChange={(e) => setSNF("handover", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Outstanding Tasks</label>
              <Textarea placeholder="One task per line" rows={2} value={snForm.outstanding} onChange={(e) => setSNF("outstanding", e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createNote.isPending}>{createNote.isPending ? "Saving…" : "Save Shift Note"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Daily Log"
        category="general"
        days={14}
        defaultCollapsed
      />
    </PageShell>
  );
}
