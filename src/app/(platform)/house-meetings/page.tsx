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
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Users, Calendar, Clock, MessageSquare, CheckCircle2,
  AlertTriangle, ClipboardList, Mic, Star, Home
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type MeetingType = "regular" | "special" | "emergency" | "welcome" | "feedback";

interface AgendaItem {
  topic: string;
  raisedBy: string;
  discussion: string;
  outcome: string;
}

interface HouseMeeting {
  id: string;
  date: string;
  type: MeetingType;
  chairPerson: string;
  minutesTaker: string;
  childrenPresent: string[];
  childrenAbsent: string[];
  staffPresent: string[];
  agenda: AgendaItem[];
  childFeedback: string[];
  actionsFromPrevious: { action: string; owner: string; completed: boolean }[];
  newActions: { action: string; owner: string; dueDate: string }[];
  generalComments: string;
  nextMeetingDate: string;
  duration: number; // minutes
  createdAt: string;
}

const TYPE_META: Record<MeetingType, { label: string; color: string }> = {
  regular:   { label: "Regular",     color: "bg-blue-100 text-blue-800" },
  special:   { label: "Special",     color: "bg-purple-100 text-purple-800" },
  emergency: { label: "Emergency",   color: "bg-red-100 text-red-800" },
  welcome:   { label: "Welcome",     color: "bg-green-100 text-green-800" },
  feedback:  { label: "Feedback",    color: "bg-amber-100 text-amber-800" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: HouseMeeting[] = [
  {
    id: "hm_001", date: d(-3), type: "regular", chairPerson: "staff_darren", minutesTaker: "staff_anna",
    childrenPresent: ["yp_alex", "yp_jordan", "yp_casey"], childrenAbsent: [],
    staffPresent: ["staff_darren", "staff_anna", "staff_ryan"],
    agenda: [
      { topic: "Weekend activities planning", raisedBy: "staff_darren", discussion: "Discussed options for the upcoming weekend. Alex suggested bowling, Jordan wanted cinema, Casey preferred staying in.", outcome: "Saturday: bowling trip for those who want to go. Sunday: movie afternoon at home." },
      { topic: "Kitchen cleanliness", raisedBy: "yp_jordan", discussion: "Jordan raised concerns about dishes being left in the sink overnight. Staff agreed to implement a rota.", outcome: "New kitchen rota to start Monday. Each YP has two nights per week." },
      { topic: "Wi-Fi issues", raisedBy: "yp_alex", discussion: "Wi-Fi has been slow in the evenings. Staff acknowledged the issue.", outcome: "Darren to contact provider about upgrading bandwidth." },
      { topic: "Garden improvements", raisedBy: "yp_casey", discussion: "Casey would like to start a small herb garden. Staff supportive of the idea.", outcome: "Chervelle to take Casey to garden centre next week to buy supplies." },
    ],
    childFeedback: [
      "Alex: 'I like that we get to choose what we do at weekends now. It feels like our home.'",
      "Jordan: 'Thanks for listening about the kitchen. It's been annoying me for ages.'",
      "Casey: 'Can we do these meetings more often? I like having a say.'",
    ],
    actionsFromPrevious: [
      { action: "Fix bathroom door lock", owner: "staff_ryan", completed: true },
      { action: "Order new board games", owner: "staff_anna", completed: true },
      { action: "Arrange visit to youth club", owner: "staff_darren", completed: false },
    ],
    newActions: [
      { action: "Create kitchen cleaning rota", owner: "staff_anna", dueDate: d(0) },
      { action: "Contact broadband provider", owner: "staff_darren", dueDate: d(3) },
      { action: "Garden centre trip with Casey", owner: "staff_chervelle", dueDate: d(7) },
    ],
    generalComments: "Positive meeting. All three YP engaged well. Casey particularly vocal today — good to see increased confidence.",
    nextMeetingDate: d(11), duration: 35, createdAt: d(-3),
  },
  {
    id: "hm_002", date: d(-17), type: "regular", chairPerson: "staff_ryan", minutesTaker: "staff_darren",
    childrenPresent: ["yp_alex", "yp_jordan"], childrenAbsent: ["yp_casey"],
    staffPresent: ["staff_ryan", "staff_darren", "staff_chervelle"],
    agenda: [
      { topic: "Half-term activities", raisedBy: "staff_ryan", discussion: "Planning activities for half-term week. YP keen on a day trip.", outcome: "Trip to Alton Towers agreed. Budget to be confirmed by Darren." },
      { topic: "Noise levels in the evening", raisedBy: "staff_ryan", discussion: "Discussion about music volume after 9pm. YP understood the need for quieter evenings.", outcome: "Agreed: headphones after 9:30pm on school nights." },
      { topic: "New furniture for lounge", raisedBy: "yp_alex", discussion: "Alex pointed out the sofa is uncomfortable. Others agreed.", outcome: "Ryan to look at replacement options within budget." },
    ],
    childFeedback: [
      "Alex: 'Alton Towers would be amazing! I've never been.'",
      "Jordan: 'Fair enough about the headphones. Can we get some decent ones?'",
    ],
    actionsFromPrevious: [
      { action: "Set up games console in lounge", owner: "staff_ryan", completed: true },
      { action: "Book dentist for Alex", owner: "staff_anna", completed: true },
    ],
    newActions: [
      { action: "Confirm Alton Towers budget", owner: "staff_darren", dueDate: d(-10) },
      { action: "Research replacement sofas", owner: "staff_ryan", dueDate: d(-7) },
      { action: "Buy headphones for communal use", owner: "staff_chervelle", dueDate: d(-12) },
    ],
    generalComments: "Casey absent due to school trip. Minutes to be shared with them. Good engagement from Alex and Jordan.",
    nextMeetingDate: d(-3), duration: 30, createdAt: d(-17),
  },
  {
    id: "hm_003", date: d(-31), type: "welcome", chairPerson: "staff_darren", minutesTaker: "staff_anna",
    childrenPresent: ["yp_alex", "yp_jordan", "yp_casey"], childrenAbsent: [],
    staffPresent: ["staff_darren", "staff_anna", "staff_ryan", "staff_chervelle"],
    agenda: [
      { topic: "Welcome Casey to Oak House", raisedBy: "staff_darren", discussion: "Introduction meeting for Casey's first week. Alex and Jordan shared house routines and favourite things about living here.", outcome: "Casey given welcome pack. Alex volunteered to be buddy for first two weeks." },
      { topic: "House rules review", raisedBy: "staff_darren", discussion: "Went through house expectations together so Casey could ask questions. Casey asked about having friends visit.", outcome: "Friends welcome with 24hr notice. Casey to be shown visitor signing-in process." },
      { topic: "Casey's interests", raisedBy: "yp_casey", discussion: "Casey enjoys drawing, reading, and cooking. Staff to look at local art classes.", outcome: "Chervelle to find local art group. Casey can use art supplies in the craft room anytime." },
    ],
    childFeedback: [
      "Casey: 'Everyone seems really nice. I was scared but I feel a bit better now.'",
      "Alex: 'I'll show you around properly after this. The garden is the best bit.'",
      "Jordan: 'Welcome to Oak House. It's alright here, honest.'",
    ],
    actionsFromPrevious: [],
    newActions: [
      { action: "Create Casey's welcome pack", owner: "staff_anna", dueDate: d(-28) },
      { action: "Find local art classes", owner: "staff_chervelle", dueDate: d(-24) },
      { action: "Set up Casey's bedroom fully", owner: "staff_darren", dueDate: d(-29) },
    ],
    generalComments: "Lovely welcoming meeting. All YP made Casey feel at home. Alex particularly supportive — showing real maturity.",
    nextMeetingDate: d(-17), duration: 40, createdAt: d(-31),
  },
  {
    id: "hm_004", date: d(-45), type: "special", chairPerson: "staff_darren", minutesTaker: "staff_ryan",
    childrenPresent: ["yp_alex", "yp_jordan"], childrenAbsent: [],
    staffPresent: ["staff_darren", "staff_ryan"],
    agenda: [
      { topic: "Summer holiday planning", raisedBy: "staff_darren", discussion: "Discussion about what YP would like to do during summer holidays. Both keen on a residential trip.", outcome: "Staff to research PGL-type activities. Budget for day trips also agreed." },
      { topic: "Redecoration of bedrooms", raisedBy: "yp_alex", discussion: "Alex wants to repaint bedroom. Jordan wants new curtains. Both reasonable requests.", outcome: "Alex and Jordan to choose colours. Staff to arrange painting weekend." },
    ],
    childFeedback: [
      "Alex: 'Can we go camping? Like proper camping with a fire and everything?'",
      "Jordan: 'I want my room to feel more like mine. Can I put up pictures too?'",
    ],
    actionsFromPrevious: [
      { action: "Repair garden fence", owner: "staff_ryan", completed: true },
      { action: "Order new duvet sets", owner: "staff_anna", completed: true },
    ],
    newActions: [
      { action: "Research PGL/camping options", owner: "staff_darren", dueDate: d(-38) },
      { action: "Buy paint samples", owner: "staff_ryan", dueDate: d(-40) },
    ],
    generalComments: "Good engagement. Both YP excited about summer plans. Jordan more talkative than usual.",
    nextMeetingDate: d(-31), duration: 25, createdAt: d(-45),
  },
  {
    id: "hm_005", date: d(-60), type: "feedback", chairPerson: "staff_anna", minutesTaker: "staff_darren",
    childrenPresent: ["yp_alex", "yp_jordan"], childrenAbsent: [],
    staffPresent: ["staff_anna", "staff_darren", "staff_edward"],
    agenda: [
      { topic: "Reg 44 visitor feedback", raisedBy: "staff_anna", discussion: "Shared key points from latest Reg 44 visit. Visitor praised the homely environment and relationships between staff and YP.", outcome: "YP pleased with positive feedback. Areas for improvement: more structured activities at weekends." },
      { topic: "Menu suggestions", raisedBy: "yp_jordan", discussion: "Jordan wants more variety in evening meals. Suggested a taco night.", outcome: "New meal suggestion box in kitchen. Each YP to choose one meal per week." },
    ],
    childFeedback: [
      "Alex: 'It's good that the visitor said nice things. We do have a nice home.'",
      "Jordan: 'I just want different food sometimes. Same meals every week gets boring.'",
    ],
    actionsFromPrevious: [
      { action: "Set up weekly movie night", owner: "staff_edward", completed: true },
    ],
    newActions: [
      { action: "Create meal suggestion box", owner: "staff_anna", dueDate: d(-55) },
      { action: "Plan structured weekend activity calendar", owner: "staff_darren", dueDate: d(-50) },
    ],
    generalComments: "Both YP engaged positively with Reg 44 feedback. Meal variety is a reasonable request — easy win.",
    nextMeetingDate: d(-45), duration: 20, createdAt: d(-60),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<HouseMeeting>[] = [
  { header: "ID",              accessor: (r: HouseMeeting) => r.id },
  { header: "Date",            accessor: (r: HouseMeeting) => r.date },
  { header: "Type",            accessor: (r: HouseMeeting) => TYPE_META[r.type].label },
  { header: "Chair",           accessor: (r: HouseMeeting) => getStaffName(r.chairPerson) },
  { header: "Minutes By",      accessor: (r: HouseMeeting) => getStaffName(r.minutesTaker) },
  { header: "Children Present",accessor: (r: HouseMeeting) => r.childrenPresent.map(getYPName).join(", ") },
  { header: "Children Absent", accessor: (r: HouseMeeting) => r.childrenAbsent.length > 0 ? r.childrenAbsent.map(getYPName).join(", ") : "None" },
  { header: "Staff Present",   accessor: (r: HouseMeeting) => r.staffPresent.map(getStaffName).join(", ") },
  { header: "Agenda Items",    accessor: (r: HouseMeeting) => r.agenda.map((a: AgendaItem) => a.topic).join("; ") },
  { header: "Child Feedback",  accessor: (r: HouseMeeting) => r.childFeedback.join(" | ") },
  { header: "New Actions",     accessor: (r: HouseMeeting) => r.newActions.map((a: { action: string; owner: string; dueDate: string }) => `${a.action} (${getStaffName(a.owner)})`).join("; ") },
  { header: "Duration (mins)", accessor: (r: HouseMeeting) => String(r.duration) },
  { header: "Next Meeting",    accessor: (r: HouseMeeting) => r.nextMeetingDate },
  { header: "Comments",        accessor: (r: HouseMeeting) => r.generalComments },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function HouseMeetingsPage() {
  const [meetings, setMeetings] = useState<HouseMeeting[]>(SEED);
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
        m.childFeedback.some((f) => f.toLowerCase().includes(s)) ||
        m.generalComments.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date.localeCompare(a.date);
        case "type":     return TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label);
        case "duration": return b.duration - a.duration;
        default:         return 0;
      }
    });
    return list;
  }, [meetings, search, typeFilter, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = meetings.length;
    const allActions = meetings.flatMap((m) => m.newActions);
    const totalAgendaItems = meetings.reduce((a, m) => a + m.agenda.length, 0);
    const totalFeedback = meetings.reduce((a, m) => a + m.childFeedback.length, 0);
    const nextMeeting = meetings.map((m) => m.nextMeetingDate).filter((d) => d >= new Date().toISOString().slice(0, 10)).sort()[0] || "—";
    const avgDuration = total > 0 ? Math.round(meetings.reduce((a, m) => a + m.duration, 0) / total) : 0;
    return { total, totalAgendaItems, totalFeedback, nextMeeting, avgDuration };
  }, [meetings]);

  return (
    <PageShell
      title="House Meetings"
      subtitle="Children&apos;s participation in household decisions — capturing voice, actions, and outcomes"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="House Meetings" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="house-meetings" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Meeting</Button>
        </div>
      }
    >
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
            const typeM = TYPE_META[m.type];
            return (
              <Card key={m.id} className={cn("border-l-4", m.type === "emergency" ? "border-l-red-400" : m.type === "welcome" ? "border-l-green-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(m.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        <Badge variant="outline" className="text-xs">{m.agenda.length} agenda items</Badge>
                        <Badge variant="outline" className="text-xs">{m.childFeedback.length} feedback</Badge>
                      </div>
                      <p className="font-semibold">House Meeting — {m.date}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Chair: {getStaffName(m.chairPerson)}</span>
                        <span>{m.duration} mins</span>
                        <span>{m.childrenPresent.length} children present</span>
                        {m.childrenAbsent.length > 0 && <span className="text-amber-600">{m.childrenAbsent.length} absent</span>}
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
                          <div className="flex flex-wrap gap-1">{m.childrenPresent.map((c) => <Badge key={c} variant="secondary" className="text-xs">{getYPName(c)}</Badge>)}</div>
                        </div>
                        {m.childrenAbsent.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Children Absent</p>
                            <div className="flex flex-wrap gap-1">{m.childrenAbsent.map((c) => <Badge key={c} variant="outline" className="text-xs text-amber-600">{getYPName(c)}</Badge>)}</div>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Staff Present</p>
                          <div className="flex flex-wrap gap-1">{m.staffPresent.map((s) => <Badge key={s} variant="secondary" className="text-xs">{getStaffName(s)}</Badge>)}</div>
                        </div>
                      </div>

                      {/* Previous actions */}
                      {m.actionsFromPrevious.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Actions from Previous Meeting</p>
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

                      {/* Agenda */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-2">Agenda & Discussion</p>
                        <div className="space-y-3">
                          {m.agenda.map((a, i) => (
                            <div key={i} className="bg-muted/40 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{i + 1}. {a.topic}</p>
                                <span className="text-xs text-muted-foreground">Raised by: {a.raisedBy.startsWith("yp_") ? getYPName(a.raisedBy) : a.raisedBy.startsWith("staff_") ? getStaffName(a.raisedBy) : a.raisedBy}</span>
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
                      {m.childFeedback.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Children&apos;s Feedback</p>
                          <div className="space-y-2">
                            {m.childFeedback.map((f, i) => (
                              <div key={i} className="bg-pink-50 p-2 rounded border border-pink-200 text-xs italic text-pink-900">
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New actions */}
                      {m.newActions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">New Actions</p>
                          <div className="space-y-1">
                            {m.newActions.map((a, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <AlertTriangle className="h-3.5 w-3.5 text-blue-500" />
                                <span>{a.action}</span>
                                <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                                <Badge variant="outline" className="text-xs">Due: {a.dueDate}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.generalComments && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">General Comments</p>
                          <p className="italic text-muted-foreground">{m.generalComments}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Next meeting: {m.nextMeetingDate}</span>
                        <span>•</span>
                        <span>Minutes by: {getStaffName(m.minutesTaker)}</span>
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

      {/* ── New meeting dialog ────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New House Meeting</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select><SelectTrigger><SelectValue placeholder="Meeting type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Chair</label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                    <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                    <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Minutes Taker</label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
              <Input type="number" placeholder="30" />
            </div>
            <div>
              <label className="text-sm font-medium">General Comments</label>
              <Textarea placeholder="Overall observations from the meeting…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Next Meeting Date</label>
              <Input type="date" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Create Meeting</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
