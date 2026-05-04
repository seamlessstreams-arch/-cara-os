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
  Flag, AlertTriangle, CheckCircle2, Clock, Calendar,
  Star, Heart, Shield, Bell, Users
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type EventCategory = "positive_achievement" | "placement_change" | "health_event" | "safeguarding" | "legal_court" | "family_event" | "education_milestone" | "behavioural" | "disclosure" | "other";
type Severity = "positive" | "routine" | "concerning" | "serious" | "critical";
type NotificationStatus = "not_required" | "notified" | "pending" | "escalated";

interface SignificantEvent {
  id: string;
  youngPersonId: string;
  date: string;
  time: string;
  category: EventCategory;
  severity: Severity;
  title: string;
  description: string;
  immediateAction: string;
  staffPresent: string[];
  witnessedBy: string[];
  childResponse: string;
  outcome: string;
  notifications: { party: string; status: NotificationStatus; date: string }[];
  followUpRequired: boolean;
  followUpActions: string;
  followUpDate: string;
  linkedDocuments: string[];
  recordedBy: string;
  createdAt: string;
}

const CATEGORY_META: Record<EventCategory, { label: string; icon: React.ReactNode; color: string }> = {
  positive_achievement: { label: "Positive Achievement", icon: <Star className="h-4 w-4" />,          color: "bg-green-100 text-green-800" },
  placement_change:     { label: "Placement Change",     icon: <Users className="h-4 w-4" />,         color: "bg-blue-100 text-blue-800" },
  health_event:         { label: "Health Event",         icon: <Heart className="h-4 w-4" />,         color: "bg-pink-100 text-pink-800" },
  safeguarding:         { label: "Safeguarding",         icon: <Shield className="h-4 w-4" />,        color: "bg-red-100 text-red-800" },
  legal_court:          { label: "Legal / Court",        icon: <Flag className="h-4 w-4" />,          color: "bg-purple-100 text-purple-800" },
  family_event:         { label: "Family Event",         icon: <Heart className="h-4 w-4" />,         color: "bg-amber-100 text-amber-800" },
  education_milestone:  { label: "Education Milestone",  icon: <Star className="h-4 w-4" />,          color: "bg-indigo-100 text-indigo-800" },
  behavioural:          { label: "Behavioural",          icon: <AlertTriangle className="h-4 w-4" />, color: "bg-orange-100 text-orange-800" },
  disclosure:           { label: "Disclosure",           icon: <Bell className="h-4 w-4" />,          color: "bg-rose-100 text-rose-800" },
  other:                { label: "Other",                icon: <Flag className="h-4 w-4" />,          color: "bg-gray-100 text-gray-800" },
};

const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  positive:   { label: "Positive",    color: "bg-green-100 text-green-700" },
  routine:    { label: "Routine",     color: "bg-blue-100 text-blue-700" },
  concerning: { label: "Concerning",  color: "bg-amber-100 text-amber-700" },
  serious:    { label: "Serious",     color: "bg-orange-100 text-orange-700" },
  critical:   { label: "Critical",    color: "bg-red-100 text-red-700" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: SignificantEvent[] = [
  {
    id: "se_001", youngPersonId: "yp_alex", date: d(-2), time: "14:30",
    category: "positive_achievement", severity: "positive",
    title: "Alex used calming strategies independently at school",
    description: "School SENCO reported that Alex successfully de-escalated a confrontation with a peer using breathing techniques learned in key work sessions. Alex walked away from the situation and sought support from a trusted teacher.",
    immediateAction: "Praised Alex on return home. Recorded as evidence of progress in emotional regulation.",
    staffPresent: ["staff_darren"], witnessedBy: ["School SENCO — Mrs Thompson"],
    childResponse: "Alex was proud and said 'I remembered what you taught me.' Wanted to tell everyone at dinner.",
    outcome: "Significant step in emotional regulation journey. Evidence for care plan review and school PEP.",
    notifications: [
      { party: "Social Worker (Sarah Mitchell)", status: "notified", date: d(-2) },
      { party: "Therapist", status: "notified", date: d(-1) },
    ],
    followUpRequired: false, followUpActions: "", followUpDate: "",
    linkedDocuments: ["Behaviour Log", "Key Working Session"], recordedBy: "staff_darren", createdAt: d(-2),
  },
  {
    id: "se_002", youngPersonId: "yp_jordan", date: d(-5), time: "19:45",
    category: "family_event", severity: "concerning",
    title: "Cancelled contact with mother — Jordan's distress",
    description: "Jordan's mother cancelled planned telephone contact for the third consecutive week. Jordan became visibly upset, withdrew to bedroom, and refused evening meal. Expressed frustration and sadness about the cancelled call.",
    immediateAction: "Staff sat with Jordan, offered emotional support. Made hot chocolate and had quiet conversation. Jordan eventually came down for supper.",
    staffPresent: ["staff_anna", "staff_ryan"], witnessedBy: [],
    childResponse: "Jordan said 'She doesn't care about me. Why does she keep doing this?' Later calmed and talked about other things.",
    outcome: "Emotional support provided. Contact issue escalated to social worker. Will be discussed at next LAC review.",
    notifications: [
      { party: "Social Worker (David Clarke)", status: "notified", date: d(-4) },
      { party: "IRO", status: "pending", date: "" },
    ],
    followUpRequired: true, followUpActions: "Discuss with SW about contact plan. Consider reducing expectations around contact to manage disappointment.", followUpDate: d(2),
    linkedDocuments: ["Daily Log", "Contact Log"], recordedBy: "staff_anna", createdAt: d(-5),
  },
  {
    id: "se_003", youngPersonId: "yp_casey", date: d(-1), time: "10:00",
    category: "education_milestone", severity: "positive",
    title: "Casey achieved Merit award in English",
    description: "Casey received a Merit certificate for creative writing at school. Teacher praised Casey's short story as 'exceptional and deeply moving'. This is Casey's first academic recognition since placement.",
    immediateAction: "Certificate displayed on Casey's wall. Staff congratulated Casey. Added to life story work.",
    staffPresent: ["staff_chervelle"], witnessedBy: [],
    childResponse: "Casey was initially dismissive but later showed the certificate to everyone. Clearly very proud.",
    outcome: "Boost to Casey's confidence and engagement with education. Good evidence for PEP and Reg 44.",
    notifications: [
      { party: "Social Worker (Emma Watson)", status: "notified", date: d(-1) },
    ],
    followUpRequired: false, followUpActions: "", followUpDate: "",
    linkedDocuments: ["Education Record"], recordedBy: "staff_chervelle", createdAt: d(-1),
  },
  {
    id: "se_004", youngPersonId: "yp_alex", date: d(-10), time: "08:15",
    category: "health_event", severity: "routine",
    title: "Alex attended GP for routine health check",
    description: "Annual LAC health assessment completed at Derby GP surgery. All developmental markers on track. Immunisations up to date. No concerns raised by GP.",
    immediateAction: "Health report filed. Copy sent to social worker.",
    staffPresent: ["staff_darren"], witnessedBy: ["Dr Patel — Derby Medical Centre"],
    childResponse: "Alex cooperative throughout. Asked questions about diet and exercise — good sign of taking ownership of health.",
    outcome: "Clean bill of health. Next assessment due in 12 months.",
    notifications: [
      { party: "Social Worker (Sarah Mitchell)", status: "notified", date: d(-10) },
      { party: "LAC Nurse", status: "notified", date: d(-9) },
    ],
    followUpRequired: false, followUpActions: "", followUpDate: "",
    linkedDocuments: ["Health Records"], recordedBy: "staff_darren", createdAt: d(-10),
  },
  {
    id: "se_005", youngPersonId: "yp_jordan", date: d(-15), time: "22:10",
    category: "behavioural", severity: "concerning",
    title: "Jordan found smoking in garden",
    description: "Night staff found Jordan smoking a cigarette in the back garden after lights out. Jordan was calm and cooperative when spoken to. Admitted a friend had given them cigarettes at school.",
    immediateAction: "Cigarettes confiscated. Calm conversation about health risks. No further escalation. Jordan returned to bed.",
    staffPresent: ["staff_edward"], witnessedBy: [],
    childResponse: "Jordan was apologetic. Said 'Everyone at school does it.' Agreed to think about it.",
    outcome: "Key work session planned around smoking and health. Risk assessment updated. No sanctions — used as teachable moment.",
    notifications: [
      { party: "Social Worker (David Clarke)", status: "notified", date: d(-14) },
    ],
    followUpRequired: true, followUpActions: "Key work session about smoking. Source age-appropriate resources. Update risk assessment.", followUpDate: d(-8),
    linkedDocuments: ["Daily Log", "Risk Register"], recordedBy: "staff_edward", createdAt: d(-15),
  },
  {
    id: "se_006", youngPersonId: "yp_casey", date: d(-7), time: "16:30",
    category: "disclosure", severity: "serious",
    title: "Casey made a disclosure about previous placement",
    description: "During a key work session, Casey disclosed feeling unsafe in a previous foster placement. Casey became emotional but was able to describe general feelings of being ignored and not listened to. No specific allegations made at this time.",
    immediateAction: "Listened without leading. Reassured Casey they were believed. Recorded verbatim. LADO notification considered — consulted with RM.",
    staffPresent: ["staff_chervelle"], witnessedBy: [],
    childResponse: "Casey said 'I just want someone to know. I feel safe here and I didn't feel safe there.'",
    outcome: "RM consulted. SW informed. Decision: monitor and allow Casey to share at their own pace. Therapy referral expedited.",
    notifications: [
      { party: "Registered Manager (Darren)", status: "notified", date: d(-7) },
      { party: "Social Worker (Emma Watson)", status: "notified", date: d(-7) },
      { party: "Therapist", status: "notified", date: d(-6) },
    ],
    followUpRequired: true, followUpActions: "Monitor wellbeing. Ensure therapy sessions commence. Record any further disclosures verbatim.", followUpDate: d(0),
    linkedDocuments: ["Safeguarding Record", "Key Working"], recordedBy: "staff_chervelle", createdAt: d(-7),
  },
  {
    id: "se_007", youngPersonId: "yp_alex", date: d(-20), time: "11:00",
    category: "legal_court", severity: "routine",
    title: "Alex's care order renewed at court hearing",
    description: "Care order renewed for a further 12 months at Derby Family Court. Alex did not attend but views were represented by Guardian. No changes to placement or contact arrangements.",
    immediateAction: "Outcome shared with Alex in age-appropriate way. Alex relieved about staying at Oak House.",
    staffPresent: ["staff_darren"], witnessedBy: ["Guardian — Ms Roberts"],
    childResponse: "Alex said 'Good. I like it here. I don't want to move.' Seemed reassured.",
    outcome: "Stable placement confirmed. Care plan continues as agreed.",
    notifications: [
      { party: "Social Worker (Sarah Mitchell)", status: "notified", date: d(-20) },
      { party: "IRO", status: "notified", date: d(-20) },
    ],
    followUpRequired: false, followUpActions: "", followUpDate: "",
    linkedDocuments: ["Placement Plan"], recordedBy: "staff_darren", createdAt: d(-20),
  },
  {
    id: "se_008", youngPersonId: "yp_casey", date: d(-31), time: "14:00",
    category: "placement_change", severity: "routine",
    title: "Casey's arrival at Oak House — new placement",
    description: "Casey moved to Oak House from previous foster placement. Welcome meeting held with all young people and staff. Casey settled into bedroom and was given time to unpack. Welcome pack provided.",
    immediateAction: "Room prepared. Key worker allocated (Chervelle). Welcome house meeting held. Essential information gathered.",
    staffPresent: ["staff_darren", "staff_anna", "staff_ryan", "staff_chervelle"], witnessedBy: ["SW Emma Watson"],
    childResponse: "Casey was quiet and nervous initially but relaxed after meeting Alex and Jordan. Ate supper with the group.",
    outcome: "Smooth transition. Casey settled well. 72-hour placement plan completed.",
    notifications: [
      { party: "Social Worker (Emma Watson)", status: "notified", date: d(-31) },
      { party: "Ofsted", status: "notified", date: d(-31) },
      { party: "Local Authority", status: "notified", date: d(-31) },
    ],
    followUpRequired: false, followUpActions: "", followUpDate: "",
    linkedDocuments: ["Placement Plan", "Welcome Meeting", "Risk Assessment"], recordedBy: "staff_darren", createdAt: d(-31),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<SignificantEvent>[] = [
  { header: "ID",              accessor: (r: SignificantEvent) => r.id },
  { header: "Young Person",    accessor: (r: SignificantEvent) => getYPName(r.youngPersonId) },
  { header: "Date",            accessor: (r: SignificantEvent) => r.date },
  { header: "Time",            accessor: (r: SignificantEvent) => r.time },
  { header: "Category",        accessor: (r: SignificantEvent) => CATEGORY_META[r.category].label },
  { header: "Severity",        accessor: (r: SignificantEvent) => SEVERITY_META[r.severity].label },
  { header: "Title",           accessor: (r: SignificantEvent) => r.title },
  { header: "Description",     accessor: (r: SignificantEvent) => r.description },
  { header: "Immediate Action",accessor: (r: SignificantEvent) => r.immediateAction },
  { header: "Child Response",  accessor: (r: SignificantEvent) => r.childResponse },
  { header: "Outcome",         accessor: (r: SignificantEvent) => r.outcome },
  { header: "Staff Present",   accessor: (r: SignificantEvent) => r.staffPresent.map(getStaffName).join(", ") },
  { header: "Notifications",   accessor: (r: SignificantEvent) => r.notifications.map((n: { party: string; status: string }) => `${n.party}: ${n.status}`).join("; ") },
  { header: "Follow Up",       accessor: (r: SignificantEvent) => r.followUpActions || "—" },
  { header: "Recorded By",     accessor: (r: SignificantEvent) => getStaffName(r.recordedBy) },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function SignificantEventsPage() {
  const [events, setEvents] = useState<SignificantEvent[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(events.map((e) => e.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [events]);

  const filtered = useMemo(() => {
    let list = [...events];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((e) => e.youngPersonId === childFilter);
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    if (severityFilter !== "all") list = list.filter((e) => e.severity === severityFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date.localeCompare(a.date);
        case "category": return CATEGORY_META[a.category].label.localeCompare(CATEGORY_META[b.category].label);
        case "severity": return a.severity.localeCompare(b.severity);
        case "child":    return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default:         return 0;
      }
    });
    return list;
  }, [events, search, childFilter, categoryFilter, severityFilter, sortBy]);

  const stats = useMemo(() => {
    const total = events.length;
    const positive = events.filter((e) => e.severity === "positive").length;
    const serious = events.filter((e) => e.severity === "serious" || e.severity === "critical").length;
    const pendingFollowUp = events.filter((e) => e.followUpRequired && e.followUpDate && e.followUpDate <= d(3)).length;
    const pendingNotifications = events.flatMap((e) => e.notifications).filter((n) => n.status === "pending").length;
    return { total, positive, serious, pendingFollowUp, pendingNotifications };
  }, [events]);

  return (
    <PageShell
      title="Significant Events"
      subtitle="Recording and tracking important events in each child&apos;s journey"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Significant Events" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="significant-events" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Event</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Events",        value: stats.total,                icon: <Flag className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Positive",            value: stats.positive,             icon: <Star className="h-4 w-4" />,          color: "text-green-600" },
            { label: "Serious / Critical",  value: stats.serious,              icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
            { label: "Follow-Up Due",       value: stats.pendingFollowUp,      icon: <Clock className="h-4 w-4" />,         color: "text-amber-600" },
            { label: "Pending Notifications",value: stats.pendingNotifications,icon: <Bell className="h-4 w-4" />,          color: "text-purple-600" },
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

        {/* ── Alert banner ─────────────────────────────────────────────────── */}
        {(stats.pendingNotifications > 0 || stats.pendingFollowUp > 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {stats.pendingNotifications > 0 && <><strong>{stats.pendingNotifications}</strong> notification{stats.pendingNotifications !== 1 && "s"} pending. </>}
                {stats.pendingFollowUp > 0 && <><strong>{stats.pendingFollowUp}</strong> follow-up action{stats.pendingFollowUp !== 1 && "s"} due within 3 days.</>}
              </span>
            </CardContent>
          </Card>
        )}

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search events…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(SEVERITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Event list ───────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No events match your filters.</p>}
          {filtered.map((e) => {
            const open = !!expanded[e.id];
            const catM = CATEGORY_META[e.category];
            const sevM = SEVERITY_META[e.severity];
            return (
              <Card key={e.id} className={cn("border-l-4", e.severity === "positive" ? "border-l-green-500" : e.severity === "critical" || e.severity === "serious" ? "border-l-red-500" : e.severity === "concerning" ? "border-l-amber-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(e.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", catM.color)}>{catM.icon}<span className="ml-1">{catM.label}</span></Badge>
                        <Badge className={cn("text-xs", sevM.color)}>{sevM.label}</Badge>
                        {e.followUpRequired && e.followUpDate && e.followUpDate <= d(3) && (
                          <Badge variant="destructive" className="text-xs">Follow-up due</Badge>
                        )}
                      </div>
                      <p className="font-semibold">{e.title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{getYPName(e.youngPersonId)}</span>
                        <span>{e.date} at {e.time}</span>
                        <span>By {getStaffName(e.recordedBy)}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Description</p>
                        <p>{e.description}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Immediate Action Taken</p>
                        <p>{e.immediateAction}</p>
                      </div>
                      {e.childResponse && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Child&apos;s Response</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{e.childResponse}</div>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Outcome</p>
                        <p>{e.outcome}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Staff Present</p>
                          <div className="flex flex-wrap gap-1">{e.staffPresent.map((s) => <Badge key={s} variant="secondary" className="text-xs">{getStaffName(s)}</Badge>)}</div>
                        </div>
                        {e.witnessedBy.length > 0 && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Witnessed By</p>
                            <div className="flex flex-wrap gap-1">{e.witnessedBy.map((w, i) => <Badge key={i} variant="outline" className="text-xs">{w}</Badge>)}</div>
                          </div>
                        )}
                      </div>
                      {/* Notifications */}
                      {e.notifications.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notifications</p>
                          <div className="space-y-1">
                            {e.notifications.map((n, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {n.status === "notified" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                                <span>{n.party}</span>
                                <Badge variant="outline" className={cn("text-xs", n.status === "notified" ? "text-green-600" : "text-amber-600")}>{n.status}</Badge>
                                {n.date && <span className="text-muted-foreground">{n.date}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {e.followUpRequired && (
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-900">
                          <p className="font-medium mb-1">Follow-Up Required</p>
                          <p>{e.followUpActions}</p>
                          {e.followUpDate && <p className="mt-1 text-muted-foreground">Due: {e.followUpDate}</p>}
                        </div>
                      )}
                      {e.linkedDocuments.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Linked: {e.linkedDocuments.join(", ")}</span>
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
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Significant events must be recorded within 24 hours. Serious and critical events require immediate notification to the Registered Manager and the placing authority. All events contribute to chronology and Reg 44/45 reporting. Positive events are equally important to record for evidencing progress and outcomes.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New event dialog ──────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Significant Event</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input type="time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(SEVERITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Brief title for the event" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Full description of what happened…" rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium">Immediate Action Taken</label>
              <Textarea placeholder="What was done in response?" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Child&apos;s Response</label>
              <Textarea placeholder="Record the child's response in their own words…" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
