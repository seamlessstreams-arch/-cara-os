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
  FileText, Star, MessageSquare
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type MeetingType = "team_meeting" | "management" | "clinical" | "safeguarding" | "training_debrief" | "ad_hoc";

interface StaffMeetingAction {
  action: string;
  owner: string;
  dueDate: string;
  completed: boolean;
}

interface StaffMeeting {
  id: string;
  date: string;
  type: MeetingType;
  title: string;
  chair: string;
  attendees: string[];
  apologies: string[];
  agendaItems: { topic: string; discussion: string; outcome: string }[];
  actionsFromPrevious: StaffMeetingAction[];
  newActions: StaffMeetingAction[];
  generalNotes: string;
  nextMeetingDate: string;
  duration: number;
  recordedBy: string;
  createdAt: string;
}

const TYPE_META: Record<MeetingType, { label: string; color: string }> = {
  team_meeting:     { label: "Team Meeting",       color: "bg-blue-100 text-blue-800" },
  management:       { label: "Management",         color: "bg-purple-100 text-purple-800" },
  clinical:         { label: "Clinical / Formulation", color: "bg-pink-100 text-pink-800" },
  safeguarding:     { label: "Safeguarding",       color: "bg-red-100 text-red-800" },
  training_debrief: { label: "Training Debrief",   color: "bg-green-100 text-green-800" },
  ad_hoc:           { label: "Ad Hoc",             color: "bg-gray-100 text-gray-800" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: StaffMeeting[] = [
  {
    id: "sm_001", date: d(-2), type: "team_meeting", title: "Weekly Team Meeting",
    chair: "staff_darren", attendees: ["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle", "staff_edward"],
    apologies: ["staff_diane"],
    agendaItems: [
      { topic: "Child updates — individual YP discussion", discussion: "Reviewed each child's progress. Alex thriving with independence goals. Jordan's sleep issues discussed — CAMHS referral made. Casey settling well.", outcome: "Continue current plans. Monitor Jordan closely." },
      { topic: "Rota changes for half-term", discussion: "Need extra cover during half-term week for activity days. Edward volunteered for extra shifts.", outcome: "Edward to cover Monday and Wednesday. Rota updated." },
      { topic: "Fire drill debrief", discussion: "Last fire drill — 2 min 45 sec. Good improvement. Casey confused about assembly point.", outcome: "Re-train Casey on fire procedures. Next drill in 4 weeks." },
      { topic: "Training update", discussion: "Trauma-informed care training booked for all staff next month. Mandatory attendance.", outcome: "Darren to circulate dates. All to confirm availability." },
    ],
    actionsFromPrevious: [
      { action: "Book kitchen tap repair", owner: "staff_ryan", dueDate: d(-7), completed: true },
      { action: "Order art supplies for Casey", owner: "staff_anna", dueDate: d(-5), completed: true },
      { action: "Arrange youth club visit for Jordan", owner: "staff_darren", dueDate: d(-3), completed: false },
    ],
    newActions: [
      { action: "Re-train Casey on fire procedures", owner: "staff_chervelle", dueDate: d(5) , completed: false },
      { action: "Circulate training dates", owner: "staff_darren", dueDate: d(3), completed: false },
      { action: "Update rota for half-term", owner: "staff_ryan", dueDate: d(2), completed: false },
    ],
    generalNotes: "Positive meeting. Team morale good. Discussed how well Casey has settled — team effort acknowledged.",
    nextMeetingDate: d(5), duration: 60, recordedBy: "staff_darren", createdAt: d(-2),
  },
  {
    id: "sm_002", date: d(-9), type: "management", title: "Management Meeting",
    chair: "staff_darren", attendees: ["staff_darren", "staff_ryan"],
    apologies: [],
    agendaItems: [
      { topic: "Referral — Child B", discussion: "Reviewed new referral from Derby City. Impact assessment needed. Good potential match.", outcome: "Proceed to impact assessment. Ryan to lead." },
      { topic: "Reg 44 preparation", discussion: "Next visit in two weeks. Need to ensure all records are up to date.", outcome: "Darren to complete monthly summary. Ryan to audit daily logs." },
      { topic: "Budget review", discussion: "Slight overspend on food this month. Need to plan meals more cost-effectively.", outcome: "Introduce meal planning system. Review menu weekly." },
      { topic: "Staffing — bank staff cover", discussion: "Need to reduce bank staff usage. Consider recruiting a permanent night worker.", outcome: "Darren to discuss with RI about advertising for permanent night staff." },
    ],
    actionsFromPrevious: [
      { action: "Complete Reg 45 Q1 report", owner: "staff_darren", dueDate: d(-10), completed: true },
    ],
    newActions: [
      { action: "Lead impact assessment for Child B", owner: "staff_ryan", dueDate: d(-2), completed: true },
      { action: "Complete monthly summary for Reg 44", owner: "staff_darren", dueDate: d(5), completed: false },
      { action: "Audit daily logs for completeness", owner: "staff_ryan", dueDate: d(5), completed: false },
      { action: "Discuss permanent night worker with RI", owner: "staff_darren", dueDate: d(7), completed: false },
    ],
    generalNotes: "Productive management meeting. Good alignment on priorities for the month ahead.",
    nextMeetingDate: d(5), duration: 45, recordedBy: "staff_darren", createdAt: d(-9),
  },
  {
    id: "sm_003", date: d(-16), type: "clinical", title: "Formulation Meeting — Jordan",
    chair: "staff_darren", attendees: ["staff_darren", "staff_anna", "staff_ryan"],
    apologies: ["staff_chervelle"],
    agendaItems: [
      { topic: "Jordan's emotional presentation", discussion: "Discussed pattern of sleep disruption linked to cancelled contact. Attachment theory lens applied — anxious-ambivalent pattern observed.", outcome: "Adapt key work approach. Increase predictability around contact expectations." },
      { topic: "Therapeutic strategies", discussion: "Agreed to implement PACE approach more consistently with Jordan. Relaxation techniques before bed.", outcome: "Anna to lead bedtime routine changes. All staff to use PACE language." },
    ],
    actionsFromPrevious: [],
    newActions: [
      { action: "Implement new bedtime routine for Jordan", owner: "staff_anna", dueDate: d(-9), completed: true },
      { action: "Share PACE prompt cards with team", owner: "staff_darren", dueDate: d(-12), completed: true },
    ],
    generalNotes: "Insightful discussion. Team showing strong understanding of Jordan's attachment needs. Good clinical thinking.",
    nextMeetingDate: d(14), duration: 40, recordedBy: "staff_darren", createdAt: d(-16),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<StaffMeeting>[] = [
  { header: "ID",            accessor: (r: StaffMeeting) => r.id },
  { header: "Date",          accessor: (r: StaffMeeting) => r.date },
  { header: "Type",          accessor: (r: StaffMeeting) => TYPE_META[r.type].label },
  { header: "Title",         accessor: (r: StaffMeeting) => r.title },
  { header: "Chair",         accessor: (r: StaffMeeting) => getStaffName(r.chair) },
  { header: "Attendees",     accessor: (r: StaffMeeting) => r.attendees.map(getStaffName).join(", ") },
  { header: "Apologies",     accessor: (r: StaffMeeting) => r.apologies.length > 0 ? r.apologies.map(getStaffName).join(", ") : "None" },
  { header: "Agenda",        accessor: (r: StaffMeeting) => r.agendaItems.map((a: { topic: string }) => a.topic).join("; ") },
  { header: "New Actions",   accessor: (r: StaffMeeting) => r.newActions.map((a: StaffMeetingAction) => `${a.action} (${getStaffName(a.owner)})`).join("; ") },
  { header: "Duration",      accessor: (r: StaffMeeting) => `${r.duration} mins` },
  { header: "Next Meeting",  accessor: (r: StaffMeeting) => r.nextMeetingDate },
  { header: "Notes",         accessor: (r: StaffMeeting) => r.generalNotes },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function StaffMeetingsPage() {
  const [meetings, setMeetings] = useState<StaffMeeting[]>(SEED);
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
      list = list.filter((m) => m.title.toLowerCase().includes(s) || m.agendaItems.some((a) => a.topic.toLowerCase().includes(s) || a.discussion.toLowerCase().includes(s)));
    }
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label);
        default:     return 0;
      }
    });
    return list;
  }, [meetings, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = meetings.length;
    const pendingActions = meetings.flatMap((m) => m.newActions).filter((a) => !a.completed).length;
    const nextMeeting = meetings.map((m) => m.nextMeetingDate).filter(Boolean).sort()[0] || "—";
    return { total, pendingActions, nextMeeting };
  }, [meetings]);

  return (
    <PageShell
      title="Staff Meetings"
      subtitle="Team meetings, management meetings, and clinical formulations"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Meetings" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="staff-meetings" />
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
              {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
            const typeM = TYPE_META[m.type];
            const pendingActions = m.newActions.filter((a) => !a.completed).length;
            return (
              <Card key={m.id} className={cn("border-l-4", m.type === "safeguarding" ? "border-l-red-400" : m.type === "clinical" ? "border-l-pink-400" : m.type === "management" ? "border-l-purple-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
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

                      {m.actionsFromPrevious.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Previous Actions</p>
                          <div className="space-y-1">
                            {m.actionsFromPrevious.map((a, i) => (
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
                          {m.agendaItems.map((a, i) => (
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

                      {m.newActions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">New Actions</p>
                          <div className="space-y-1">
                            {m.newActions.map((a, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-blue-500" />}
                                <span>{a.action}</span>
                                <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                                <Badge variant="outline" className="text-xs">Due: {a.dueDate}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.generalNotes && <p className="italic text-muted-foreground text-xs">{m.generalNotes}</p>}
                      <p className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline mr-1" />Next meeting: {m.nextMeetingDate}</p>
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
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
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
