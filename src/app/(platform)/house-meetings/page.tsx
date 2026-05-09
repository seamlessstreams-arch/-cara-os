"use client";

import React, { useState, useMemo, useRef } from "react";
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
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Users, Calendar, Clock, MessageSquare, CheckCircle2,
  AlertTriangle, ClipboardList, Mic, Star, Home, Loader2
} from "lucide-react";
import { useHouseMeetings, useCreateHouseMeeting } from "@/hooks/use-house-meetings";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { toast } from "sonner";
import type { HouseMeeting, HouseMeetingType } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const TYPE_META: Record<HouseMeetingType, { label: string; color: string }> = {
  regular:   { label: "Regular",     color: "bg-blue-100 text-blue-800" },
  special:   { label: "Special",     color: "bg-purple-100 text-purple-800" },
  emergency: { label: "Emergency",   color: "bg-red-100 text-red-800" },
  welcome:   { label: "Welcome",     color: "bg-green-100 text-green-800" },
  feedback:  { label: "Feedback",    color: "bg-amber-100 text-amber-800" },
};


// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<HouseMeeting>[] = [
  { header: "ID",              accessor: (r: HouseMeeting) => r.id },
  { header: "Date",            accessor: (r: HouseMeeting) => r.date },
  { header: "Type",            accessor: (r: HouseMeeting) => TYPE_META[r.meeting_type].label },
  { header: "Chair",           accessor: (r: HouseMeeting) => getStaffName(r.chair_person) },
  { header: "Minutes By",      accessor: (r: HouseMeeting) => getStaffName(r.minutes_taker) },
  { header: "Children Present",accessor: (r: HouseMeeting) => r.children_present.map(getYPName).join(", ") },
  { header: "Children Absent", accessor: (r: HouseMeeting) => r.children_absent.length > 0 ? r.children_absent.map(getYPName).join(", ") : "None" },
  { header: "Staff Present",   accessor: (r: HouseMeeting) => r.staff_present.map(getStaffName).join(", ") },
  { header: "Agenda Items",    accessor: (r: HouseMeeting) => r.agenda.map((a: { topic: string; raised_by: string; discussion: string; outcome: string }) => a.topic).join("; ") },
  { header: "Child Feedback",  accessor: (r: HouseMeeting) => r.child_feedback.join(" | ") },
  { header: "New Actions",     accessor: (r: HouseMeeting) => r.new_actions.map((a: { action: string; owner: string; due_date: string }) => `${a.action} (${getStaffName(a.owner)})`).join("; ") },
  { header: "Duration (mins)", accessor: (r: HouseMeeting) => String(r.duration) },
  { header: "Next Meeting",    accessor: (r: HouseMeeting) => r.next_meeting_date },
  { header: "Comments",        accessor: (r: HouseMeeting) => r.general_comments },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function HouseMeetingsPage() {
  const { data: hmData, isLoading } = useHouseMeetings();
  const createMeeting = useCreateHouseMeeting();
  const [hmForm, setHmForm] = useState({ date: new Date().toISOString().slice(0, 10), meeting_type: "regular" as HouseMeetingType, chair_person: "", minutes_taker: "", duration: "60", general_comments: "", next_meeting_date: "" });
  const setHM = (k: string, v: unknown) => setHmForm((p) => ({ ...p, [k]: v }));

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hmForm.general_comments.trim()) { toast.error("General comments are required."); return; }
    await createMeeting.mutateAsync({ date: hmForm.date, meeting_type: hmForm.meeting_type, chair_person: hmForm.chair_person || "staff_darren", minutes_taker: hmForm.minutes_taker || "staff_ryan", children_present: [], children_absent: [], staff_present: [], agenda: [], child_feedback: [], actions_from_previous: [], new_actions: [], general_comments: hmForm.general_comments.trim(), next_meeting_date: hmForm.next_meeting_date, duration: parseInt(hmForm.duration) || 60, created_at: new Date().toISOString() });
    toast.success("House meeting recorded.");
    setHmForm({ date: new Date().toISOString().slice(0, 10), meeting_type: "regular", chair_person: "", minutes_taker: "", duration: "60", general_comments: "", next_meeting_date: "" });
    setShowNew(false);
  };
  const meetings = hmData?.data ?? [];
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...meetings];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((m) =>
        m.agenda.some((a) => a.topic.toLowerCase().includes(s) || a.discussion.toLowerCase().includes(s)) ||
        m.child_feedback.some((f) => f.toLowerCase().includes(s)) ||
        m.general_comments.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") list = list.filter((m) => m.meeting_type === typeFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date.localeCompare(a.date);
        case "type":     return TYPE_META[a.meeting_type].label.localeCompare(TYPE_META[b.meeting_type].label);
        case "duration": return b.duration - a.duration;
        default:         return 0;
      }
    });
    return list;
  }, [meetings, search, typeFilter, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = meetings.length;
    const allActions = meetings.flatMap((m) => m.new_actions);
    const totalAgendaItems = meetings.reduce((a, m) => a + m.agenda.length, 0);
    const totalFeedback = meetings.reduce((a, m) => a + m.child_feedback.length, 0);
    const nextMeeting = meetings.map((m) => m.next_meeting_date).filter((d) => d >= new Date().toISOString().slice(0, 10)).sort()[0] || "—";
    const avgDuration = total > 0 ? Math.round(meetings.reduce((a, m) => a + m.duration, 0) / total) : 0;
    return { total, totalAgendaItems, totalFeedback, nextMeeting, avgDuration };
  }, [meetings]);

  return (
    <PageShell
      title="House Meetings"
      subtitle="Children&apos;s participation in household decisions — capturing voice, actions, and outcomes"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="House Meetings" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="house-meetings" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Meeting</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Meetings",  value: stats.total,            icon: <Users className="h-4 w-4" />,        color: "text-blue-600" },
            { label: "Agenda Items",     value: stats.totalAgendaItems, icon: <ClipboardList className="h-4 w-4" />,color: "text-purple-600" },
            { label: "Child Feedback",   value: stats.totalFeedback,    icon: <Mic className="h-4 w-4" />,          color: "text-pink-600" },
            { label: "Avg Duration",     value: `${stats.avgDuration}m`,icon: <Clock className="h-4 w-4" />,        color: "text-green-600" },
            { label: "Next Meeting",     value: stats.nextMeeting,      icon: <Calendar className="h-4 w-4" />,     color: "text-amber-600" },
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
            <Input placeholder="Search meetings…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Meeting list ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No meetings match your filters.</p>}
          {filtered.map((m) => {
            const open = !!expanded[m.id];
            const typeM = TYPE_META[m.meeting_type];
            return (
              <Card key={m.id} className={cn("border-l-4", m.meeting_type === "emergency" ? "border-l-red-400" : m.meeting_type === "welcome" ? "border-l-green-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        <Badge variant="outline" className="text-xs">{m.agenda.length} agenda items</Badge>
                        <Badge variant="outline" className="text-xs">{m.child_feedback.length} feedback</Badge>
                      </div>
                      <p className="font-semibold">House Meeting — {m.date}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Chair: {getStaffName(m.chair_person)}</span>
                        <span>{m.duration} mins</span>
                        <span>{m.children_present.length} children present</span>
                        {m.children_absent.length > 0 && <span className="text-amber-600">{m.children_absent.length} absent</span>}
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-3 text-sm">
                      {/* Attendees */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Children Present</p>
                          <div className="flex flex-wrap gap-1">{m.children_present.map((c) => <Badge key={c} variant="secondary" className="text-xs">{getYPName(c)}</Badge>)}</div>
                        </div>
                        {m.children_absent.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Children Absent</p>
                            <div className="flex flex-wrap gap-1">{m.children_absent.map((c) => <Badge key={c} variant="outline" className="text-xs text-amber-600">{getYPName(c)}</Badge>)}</div>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Staff Present</p>
                          <div className="flex flex-wrap gap-1">{m.staff_present.map((s) => <Badge key={s} variant="secondary" className="text-xs">{getStaffName(s)}</Badge>)}</div>
                        </div>
                      </div>

                      {/* Previous actions */}
                      {m.actions_from_previous.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Actions from Previous Meeting</p>
                          <div className="space-y-1">
                            {m.actions_from_previous.map((a, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                                <span className={a.completed ? "line-through text-muted-foreground" : ""}>{a.action}</span>
                                <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Agenda */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">Agenda & Discussion</p>
                        <div className="space-y-3">
                          {m.agenda.map((a, i) => (
                            <div key={i} className="bg-muted/40 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{i + 1}. {a.topic}</p>
                                <span className="text-xs text-muted-foreground">Raised by: {a.raised_by.startsWith("yp_") ? getYPName(a.raised_by) : a.raised_by.startsWith("staff_") ? getStaffName(a.raised_by) : a.raised_by}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{a.discussion}</p>
                              <div className="flex items-start gap-1 mt-1">
                                <Star className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-medium">Outcome: {a.outcome}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Child feedback */}
                      {m.child_feedback.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Children&apos;s Feedback</p>
                          <div className="space-y-2">
                            {m.child_feedback.map((f, i) => (
                              <div key={i} className="bg-pink-50 p-2 rounded border border-pink-200 text-xs italic text-pink-900">
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New actions */}
                      {m.new_actions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">New Actions</p>
                          <div className="space-y-1">
                            {m.new_actions.map((a, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 text-blue-500" />
                                <span>{a.action}</span>
                                <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                                <Badge variant="outline" className="text-xs">Due: {a.due_date}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.general_comments && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">General Comments</p>
                          <p className="italic text-muted-foreground">{m.general_comments}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Next meeting: {m.next_meeting_date}</span>
                        <span>•</span>
                        <span>Minutes by: {getStaffName(m.minutes_taker)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance note ────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Home className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              House meetings should be held at least fortnightly to ensure children have a regular voice in decisions affecting their home. Minutes must be recorded and actions tracked. Children&apos;s participation and feedback should be evidenced for Reg 44/45 visits and Ofsted inspections.
            </span>
          </CardContent>
        </Card>
      </div>
      )}

      {/* ── New meeting dialog ────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New House Meeting</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateMeeting} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={hmForm.date} onChange={(e) => setHM("date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={hmForm.meeting_type} onValueChange={(v) => setHM("meeting_type", v)}><SelectTrigger><SelectValue placeholder="Meeting type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Chair</label>
                <Select value={hmForm.chair_person} onValueChange={(v) => setHM("chair_person", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                    <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                    <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Minutes Taker</label>
                <Select value={hmForm.minutes_taker} onValueChange={(v) => setHM("minutes_taker", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                    <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                    <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input type="number" placeholder="30" value={hmForm.duration} onChange={(e) => setHM("duration", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">General Comments *</label>
              <Textarea placeholder="Overall observations from the meeting…" rows={3} value={hmForm.general_comments} onChange={(e) => setHM("general_comments", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Next Meeting Date</label>
              <Input type="date" value={hmForm.next_meeting_date} onChange={(e) => setHM("next_meeting_date", e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createMeeting.isPending}>{createMeeting.isPending ? "Saving…" : "Create Meeting"}</Button>
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
