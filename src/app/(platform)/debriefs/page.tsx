"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, Calendar,
  Heart, Shield, Users, MessageSquare
} from "lucide-react";
import type { DebriefRecord, ReflectiveDebriefType, DebriefFollowUpAction } from "@/types/extended";
import { REFLECTIVE_DEBRIEF_TYPE_LABEL } from "@/types/extended";
import { useDebriefRecords, useCreateDebriefRecord } from "@/hooks/use-debrief-records";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const TYPE_META: Record<ReflectiveDebriefType, { label: string; color: string }> = {
  post_incident:   { label: "Post-Incident",    color: "bg-red-100 text-red-800" },
  post_restraint:  { label: "Post-Restraint",   color: "bg-orange-100 text-orange-800" },
  critical_event:  { label: "Critical Event",   color: "bg-purple-100 text-purple-800" },
  near_miss:       { label: "Near Miss",        color: "bg-amber-100 text-amber-800" },
  team_reflection: { label: "Team Reflection",  color: "bg-blue-100 text-blue-800" },
  safeguarding:    { label: "Safeguarding",     color: "bg-pink-100 text-pink-800" },
};

const EXPORT_COLS: ExportColumn<DebriefRecord>[] = [
  { header: "ID",              accessor: (r: DebriefRecord) => r.id },
  { header: "Date",            accessor: (r: DebriefRecord) => r.date },
  { header: "Type",            accessor: (r: DebriefRecord) => TYPE_META[r.type].label },
  { header: "Incident",        accessor: (r: DebriefRecord) => r.linked_incident_summary },
  { header: "Young Person",    accessor: (r: DebriefRecord) => r.child_id ? getYPName(r.child_id) : "—" },
  { header: "Staff Involved",  accessor: (r: DebriefRecord) => r.staff_involved.map(getStaffName).join(", ") },
  { header: "What Happened",   accessor: (r: DebriefRecord) => r.what_happened },
  { header: "What Worked",     accessor: (r: DebriefRecord) => r.what_worked_well },
  { header: "To Improve",      accessor: (r: DebriefRecord) => r.what_could_improve },
  { header: "Lessons",         accessor: (r: DebriefRecord) => r.lessons_learned.join("; ") },
  { header: "Changes",         accessor: (r: DebriefRecord) => r.changes_needed.join("; ") },
  { header: "Facilitated By",  accessor: (r: DebriefRecord) => getStaffName(r.facilitated_by) },
];

export default function DebriefsPage() {
  const { data: raw, isLoading } = useDebriefRecords();
  const debriefs = raw?.data ?? [];
  const createDebrief = useCreateDebriefRecord();
  const [debForm, setDebForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "post_incident" as ReflectiveDebriefType, what_happened: "", what_worked_well: "", what_could_improve: "", lessons_learned: "" });
  const setDeb = (k: string, v: unknown) => setDebForm((p) => ({ ...p, [k]: v }));

  const handleCreateDebrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debForm.what_happened.trim()) { toast.error("What happened is required."); return; }
    await createDebrief.mutateAsync({ date: debForm.date, type: debForm.type, linked_incident_id: "", linked_incident_summary: "", child_id: "", staff_involved: [], facilitated_by: "staff_darren", what_happened: debForm.what_happened.trim(), what_worked_well: debForm.what_worked_well.trim(), what_could_improve: debForm.what_could_improve.trim(), staff_wellbeing: "", child_perspective: "", lessons_learned: debForm.lessons_learned.split("\n").filter(Boolean), changes_needed: [], follow_up_actions: [], support_offered: false, support_details: "", created_at: new Date().toISOString() });
    toast.success("Debrief saved.");
    setDebForm({ date: new Date().toISOString().slice(0, 10), type: "post_incident", what_happened: "", what_worked_well: "", what_could_improve: "", lessons_learned: "" });
    setShowNew(false);
  };
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...debriefs];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((db) => db.what_happened.toLowerCase().includes(s) || db.lessons_learned.some((l) => l.toLowerCase().includes(s)) || db.linked_incident_summary.toLowerCase().includes(s));
    }
    if (typeFilter !== "all") list = list.filter((db) => db.type === typeFilter);
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [debriefs, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = debriefs.length;
    const pendingActions = debriefs.flatMap((db) => db.follow_up_actions).filter((a) => !a.completed).length;
    const lessonsTotal = debriefs.reduce((a, db) => a + db.lessons_learned.length, 0);
    return { total, pendingActions, lessonsTotal };
  }, [debriefs]);

  if (isLoading) return <PageShell title="Debriefs & Reflections" subtitle="Post-incident debriefs, team reflections, and lessons learned"><div /></PageShell>;

  return (
    <PageShell
      title="Debriefs & Reflections"
      subtitle="Post-incident debriefs, team reflections, and lessons learned"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Debriefs & Reflections" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="debriefs" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Debrief</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Debriefs",   value: stats.total,          icon: <RefreshCw className="h-4 w-4" />,     color: "text-blue-600" },
            { label: "Pending Actions",   value: stats.pendingActions, icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600" },
            { label: "Lessons Captured",  value: stats.lessonsTotal,   icon: <CheckCircle2 className="h-4 w-4" />,  color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search debriefs…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No debriefs match your filters.</p>}
          {filtered.map((db) => {
            const open = !!expanded[db.id];
            const typeM = TYPE_META[db.type];
            const pending = db.follow_up_actions.filter((a) => !a.completed).length;
            return (
              <Card key={db.id} className={cn("border-l-4", db.type === "post_restraint" || db.type === "post_incident" ? "border-l-red-400" : db.type === "safeguarding" ? "border-l-pink-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(db.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        {pending > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{pending} pending</Badge>}
                        {db.support_offered && <Badge variant="outline" className="text-xs text-green-600 border-green-300">Support offered</Badge>}
                      </div>
                      <p className="font-semibold">{db.linked_incident_summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{db.date}</span>
                        {db.child_id && <span>Re: {getYPName(db.child_id)}</span>}
                        <span>Staff: {db.staff_involved.map(getStaffName).join(", ")}</span>
                        <span>{db.lessons_learned.length} lessons</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div><p className="font-medium text-muted-foreground mb-1">What Happened</p><p className="text-xs">{db.what_happened}</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="font-medium text-green-800 text-xs mb-1">What Worked Well</p>
                          <p className="text-xs text-green-900">{db.what_worked_well}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="font-medium text-amber-800 text-xs mb-1">What Could Improve</p>
                          <p className="text-xs text-amber-900">{db.what_could_improve}</p>
                        </div>
                      </div>
                      {db.child_perspective && (
                        <div><p className="font-medium text-muted-foreground mb-1">Child&apos;s Perspective</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{db.child_perspective}</div>
                        </div>
                      )}
                      <div><p className="font-medium text-muted-foreground mb-1">Staff Wellbeing</p>
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-900 flex items-start gap-1"><Heart className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />{db.staff_wellbeing}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Lessons Learned</p>
                        <ul className="space-y-0.5 text-xs">{db.lessons_learned.map((l, i) => <li key={i} className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />{l}</li>)}</ul>
                      </div>
                      {db.changes_needed.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Changes Needed</p>
                          <ul className="space-y-0.5 text-xs">{db.changes_needed.map((c, i) => <li key={i} className="flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />{c}</li>)}</ul>
                        </div>
                      )}
                      {db.follow_up_actions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Follow-Up Actions</p>
                          <div className="space-y-1">{db.follow_up_actions.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                              <span className={a.completed ? "line-through text-muted-foreground" : ""}>{a.action}</span>
                              <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                            </div>
                          ))}</div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Facilitated by {getStaffName(db.facilitated_by)}</p>
                      {db.child_id && (
                        <SmartLinkPanel sourceType="debrief" sourceId={db.id} childId={db.child_id} compact />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Post-incident debriefs should take place within 72 hours. Staff wellbeing must be considered and support offered. The child&apos;s perspective must be recorded. Lessons learned should inform practice changes and be shared with the wider team. Post-restraint debriefs are mandatory under Regulation 35.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Debrief</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateDebrief} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={debForm.date} onChange={(e) => setDeb("date", e.target.value)} /></div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={debForm.type} onValueChange={(v) => setDeb("type", v)}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">What Happened *</label><Textarea placeholder="Describe the incident or event…" rows={3} value={debForm.what_happened} onChange={(e) => setDeb("what_happened", e.target.value)} /></div>
            <div><label className="text-sm font-medium">What Worked Well</label><Textarea placeholder="Positive aspects of the response…" rows={2} value={debForm.what_worked_well} onChange={(e) => setDeb("what_worked_well", e.target.value)} /></div>
            <div><label className="text-sm font-medium">What Could Improve</label><Textarea placeholder="Areas for improvement…" rows={2} value={debForm.what_could_improve} onChange={(e) => setDeb("what_could_improve", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Lessons Learned</label><Textarea placeholder="Key lessons (one per line)" rows={2} value={debForm.lessons_learned} onChange={(e) => setDeb("lessons_learned", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createDebrief.isPending}>{createDebrief.isPending ? "Saving…" : "Save Debrief"}</Button>
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
