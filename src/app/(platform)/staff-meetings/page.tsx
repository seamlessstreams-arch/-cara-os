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
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Users, Calendar, Clock, CheckCircle2, AlertTriangle,
  Star, MessageSquare, Loader2,
} from "lucide-react";
import { useStaffMeetingRecords } from "@/hooks/use-staff-meeting-records";
import type { StaffMeetingRecord, StaffMeetingType, StaffMeetingAction } from "@/types/extended";
import { STAFF_MEETING_TYPE_LABEL } from "@/types/extended";

/* ── local config (colours not serializable) ─────────────────────────────── */

const TYPE_CLR: Record<StaffMeetingType, string> = {
  team_meeting:     "bg-blue-100 text-blue-800",
  management:       "bg-purple-100 text-purple-800",
  clinical:         "bg-pink-100 text-pink-800",
  safeguarding:     "bg-red-100 text-red-800",
  training_debrief: "bg-green-100 text-green-800",
  ad_hoc:           "bg-gray-100 text-gray-800",
};

const BORDER_CLR: Record<StaffMeetingType, string> = {
  team_meeting:     "border-l-blue-400",
  management:       "border-l-purple-400",
  clinical:         "border-l-pink-400",
  safeguarding:     "border-l-red-400",
  training_debrief: "border-l-green-400",
  ad_hoc:           "border-l-gray-400",
};

/* ── component ────────────────────────────────────────────────────────────── */

export default function StaffMeetingsPage() {
  const { data: meetings = [], isLoading } = useStaffMeetingRecords();
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
      list = list.filter((m) => m.title.toLowerCase().includes(s) || m.agenda_items.some((a) => a.topic.toLowerCase().includes(s) || a.discussion.toLowerCase().includes(s)));
    }
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return STAFF_MEETING_TYPE_LABEL[a.type].localeCompare(STAFF_MEETING_TYPE_LABEL[b.type]);
        default:     return 0;
      }
    });
    return list;
  }, [meetings, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = meetings.length;
    const pendingActions = meetings.flatMap((m) => m.new_actions).filter((a) => !a.completed).length;
    const nextMeeting = meetings.map((m) => m.next_meeting_date).filter(Boolean).sort()[0] || "—";
    return { total, pendingActions, nextMeeting };
  }, [meetings]);

  const exportCols: ExportColumn<StaffMeetingRecord>[] = [
    { header: "ID",            accessor: (r: StaffMeetingRecord) => r.id },
    { header: "Date",          accessor: (r: StaffMeetingRecord) => r.date },
    { header: "Type",          accessor: (r: StaffMeetingRecord) => STAFF_MEETING_TYPE_LABEL[r.type] },
    { header: "Title",         accessor: (r: StaffMeetingRecord) => r.title },
    { header: "Chair",         accessor: (r: StaffMeetingRecord) => getStaffName(r.chair) },
    { header: "Attendees",     accessor: (r: StaffMeetingRecord) => r.attendees.map(getStaffName).join(", ") },
    { header: "Apologies",     accessor: (r: StaffMeetingRecord) => r.apologies.length > 0 ? r.apologies.map(getStaffName).join(", ") : "None" },
    { header: "Agenda",        accessor: (r: StaffMeetingRecord) => r.agenda_items.map((a) => a.topic).join("; ") },
    { header: "New Actions",   accessor: (r: StaffMeetingRecord) => r.new_actions.map((a: StaffMeetingAction) => `${a.action} (${getStaffName(a.owner)})`).join("; ") },
    { header: "Duration",      accessor: (r: StaffMeetingRecord) => `${r.duration} mins` },
    { header: "Next Meeting",  accessor: (r: StaffMeetingRecord) => r.next_meeting_date },
    { header: "Notes",         accessor: (r: StaffMeetingRecord) => r.general_notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Meetings" subtitle="Team meetings, management meetings, and clinical formulations">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Meetings"
      subtitle="Team meetings, management meetings, and clinical formulations"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Meetings" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-meetings" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Meeting</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Meetings",  value: stats.total,          icon: <Users className="h-4 w-4" />,         color: "text-blue-600" },
            { label: "Pending Actions",  value: stats.pendingActions, icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600" },
            { label: "Next Meeting",     value: stats.nextMeeting,    icon: <Calendar className="h-4 w-4" />,      color: "text-purple-600" },
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search meetings…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(STAFF_MEETING_TYPE_LABEL) as [StaffMeetingType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No meetings match your filters.</p>}
          {filtered.map((m) => {
            const open = !!expanded[m.id];
            const pendingActions = m.new_actions.filter((a) => !a.completed).length;
            return (
              <Card key={m.id} className={cn("border-l-4", BORDER_CLR[m.type])}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", TYPE_CLR[m.type])}>{STAFF_MEETING_TYPE_LABEL[m.type]}</Badge>
                        {pendingActions > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{pendingActions} pending</Badge>}
                      </div>
                      <p className="font-semibold">{m.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{m.date}</span>
                        <span>Chair: {getStaffName(m.chair)}</span>
                        <span>{m.duration} mins</span>
                        <span>{m.attendees.length} attended</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Attendees</p>
                          <div className="flex flex-wrap gap-1">{m.attendees.map((a) => <Badge key={a} variant="secondary" className="text-xs">{getStaffName(a)}</Badge>)}</div>
                        </div>
                        {m.apologies.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Apologies</p>
                            <div className="flex flex-wrap gap-1">{m.apologies.map((a) => <Badge key={a} variant="outline" className="text-xs">{getStaffName(a)}</Badge>)}</div>
                          </div>
                        )}
                      </div>

                      {m.actions_from_previous.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Previous Actions</p>
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

                      <div>
                        <p className="font-medium text-muted-foreground mb-2">Agenda & Discussion</p>
                        <div className="space-y-3">
                          {m.agenda_items.map((a, i) => (
                            <div key={i} className="bg-muted/40 p-3 rounded-lg">
                              <p className="font-medium text-xs">{i + 1}. {a.topic}</p>
                              <p className="text-xs text-muted-foreground mt-1">{a.discussion}</p>
                              <div className="flex items-start gap-1 mt-1">
                                <Star className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs font-medium">Outcome: {a.outcome}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {m.new_actions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">New Actions</p>
                          <div className="space-y-1">
                            {m.new_actions.map((a, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-blue-500" />}
                                <span>{a.action}</span>
                                <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                                <Badge variant="outline" className="text-xs">Due: {a.due_date}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.general_notes && <p className="italic text-muted-foreground text-xs">{m.general_notes}</p>}
                      <p className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />Next meeting: {m.next_meeting_date}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Team meetings should be held at least monthly. Minutes must be recorded and distributed to all staff, including those absent. Actions must be tracked to completion. Clinical/formulation meetings inform care plans and should be evidenced in Reg 44/45 reporting.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Staff Meeting</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" /></div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{(Object.entries(STAFF_MEETING_TYPE_LABEL) as [StaffMeetingType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Title</label><Input placeholder="Meeting title" /></div>
            <div><label className="text-sm font-medium">General Notes</label><Textarea placeholder="Meeting notes…" rows={4} /></div>
            <div><label className="text-sm font-medium">Next Meeting Date</label><Input type="date" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Meeting</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
