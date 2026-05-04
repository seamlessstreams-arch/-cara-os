"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowRightLeft, ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  GraduationCap, Home, Briefcase, Heart, Shield, Wallet, Users,
  AlertTriangle, CheckCircle2, Clock, Target, Calendar
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type TransitionArea = "independent_living" | "education_employment" | "financial" | "health_wellbeing" | "housing" | "relationships" | "legal_rights" | "identity";
type GoalStatus = "not_started" | "in_progress" | "on_track" | "at_risk" | "achieved" | "paused";

interface TransitionGoal {
  id: string;
  youngPersonId: string;
  area: TransitionArea;
  goal: string;
  description: string;
  status: GoalStatus;
  targetDate: string;
  startDate: string;
  keyWorker: string;
  actions: string[];
  progress: string;
  percentComplete: number;
  reviewDate: string;
  notes: string;
  createdAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const AREA_META: Record<TransitionArea, { label: string; icon: React.ReactNode; color: string }> = {
  independent_living:     { label: "Independent Living",     icon: <Home className="h-4 w-4" />,           color: "bg-blue-100 text-blue-800" },
  education_employment:   { label: "Education & Employment", icon: <GraduationCap className="h-4 w-4" />,  color: "bg-purple-100 text-purple-800" },
  financial:              { label: "Financial Capability",   icon: <Wallet className="h-4 w-4" />,         color: "bg-green-100 text-green-800" },
  health_wellbeing:       { label: "Health & Wellbeing",     icon: <Heart className="h-4 w-4" />,          color: "bg-pink-100 text-pink-800" },
  housing:                { label: "Housing",                icon: <Home className="h-4 w-4" />,           color: "bg-amber-100 text-amber-800" },
  relationships:          { label: "Relationships & Networks", icon: <Users className="h-4 w-4" />,       color: "bg-indigo-100 text-indigo-800" },
  legal_rights:           { label: "Legal Rights & Entitlements", icon: <Shield className="h-4 w-4" />,   color: "bg-slate-100 text-slate-800" },
  identity:               { label: "Identity & Culture",     icon: <Target className="h-4 w-4" />,        color: "bg-rose-100 text-rose-800" },
};

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  not_started: { label: "Not Started",  color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress",  color: "bg-blue-100 text-blue-700" },
  on_track:    { label: "On Track",     color: "bg-green-100 text-green-700" },
  at_risk:     { label: "At Risk",      color: "bg-red-100 text-red-700" },
  achieved:    { label: "Achieved",     color: "bg-emerald-100 text-emerald-700" },
  paused:      { label: "Paused",       color: "bg-amber-100 text-amber-700" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: TransitionGoal[] = [
  {
    id: "tg_001", youngPersonId: "yp_alex", area: "independent_living",
    goal: "Learn to cook five basic meals independently",
    description: "Alex to plan, shop for, and cook five different meals without adult assistance as part of independence skills building.",
    status: "in_progress", targetDate: d(60), startDate: d(-30), keyWorker: "staff_darren",
    actions: ["Weekly cooking session with key worker", "Create meal plan for the week", "Practice food hygiene independently", "Budget for weekly shop"],
    progress: "Has mastered pasta dishes and basic stir-fry. Working on oven meals next.", percentComplete: 40,
    reviewDate: d(14), notes: "Alex showing real enthusiasm for cooking. Wants to try baking too.", createdAt: d(-30),
  },
  {
    id: "tg_002", youngPersonId: "yp_alex", area: "financial",
    goal: "Open and manage a bank account",
    description: "Support Alex to open a current account, understand online banking, set up savings, and manage a budget.",
    status: "on_track", targetDate: d(30), startDate: d(-45), keyWorker: "staff_darren",
    actions: ["Visit bank to open account", "Set up online banking app", "Create weekly budget spreadsheet", "Practise paying bills online"],
    progress: "Account opened. Alex is using the app daily and tracking spending.", percentComplete: 70,
    reviewDate: d(7), notes: "Making excellent progress. Saved £45 this month from pocket money.", createdAt: d(-45),
  },
  {
    id: "tg_003", youngPersonId: "yp_alex", area: "education_employment",
    goal: "Complete college application for September intake",
    description: "Support with researching courses, writing personal statement, and attending open days.",
    status: "at_risk", targetDate: d(21), startDate: d(-60), keyWorker: "staff_ryan",
    actions: ["Research three potential courses", "Attend open day at Derby College", "Draft personal statement", "Submit UCAS/college application"],
    progress: "Attended one open day but hasn't started personal statement. Deadline approaching.", percentComplete: 25,
    reviewDate: d(3), notes: "Needs additional support with personal statement. Reluctant to engage this week.", createdAt: d(-60),
  },
  {
    id: "tg_004", youngPersonId: "yp_jordan", area: "health_wellbeing",
    goal: "Register with GP and manage own health appointments",
    description: "Jordan to independently manage GP registration, book appointments, and attend without escort.",
    status: "achieved", targetDate: d(-10), startDate: d(-90), keyWorker: "staff_anna",
    actions: ["Register at local GP surgery", "Book and attend routine check-up", "Learn to order repeat prescriptions", "Attend appointments independently"],
    progress: "All actions completed. Jordan registered, attended two appointments solo.", percentComplete: 100,
    reviewDate: d(30), notes: "Excellent achievement. Jordan confident managing health needs.", createdAt: d(-90),
  },
  {
    id: "tg_005", youngPersonId: "yp_jordan", area: "housing",
    goal: "Understand housing options and complete housing application",
    description: "Explore supported accommodation, council housing, and private renting options for when Jordan turns 18.",
    status: "in_progress", targetDate: d(90), startDate: d(-20), keyWorker: "staff_ryan",
    actions: ["Visit two supported accommodation providers", "Meet with leaving care PA", "Complete housing needs assessment", "Start housing register application"],
    progress: "Visited one provider. Meeting with PA scheduled for next week.", percentComplete: 30,
    reviewDate: d(10), notes: "Jordan anxious about moving on. Extra emotional support needed around this topic.", createdAt: d(-20),
  },
  {
    id: "tg_006", youngPersonId: "yp_jordan", area: "relationships",
    goal: "Build positive peer support network",
    description: "Support Jordan to develop healthy friendships and community connections outside of the home.",
    status: "on_track", targetDate: d(60), startDate: d(-40), keyWorker: "staff_anna",
    actions: ["Join a community group or club", "Maintain contact with positive school friends", "Attend youth group weekly", "Identify a trusted adult outside the home"],
    progress: "Joined local football club. Attending regularly. Made two new friends.", percentComplete: 60,
    reviewDate: d(14), notes: "Real positive engagement. Coach gives excellent feedback.", createdAt: d(-40),
  },
  {
    id: "tg_007", youngPersonId: "yp_casey", area: "independent_living",
    goal: "Manage personal laundry routine",
    description: "Casey to wash, dry, and put away own clothes independently on a weekly schedule.",
    status: "not_started", targetDate: d(45), startDate: d(0), keyWorker: "staff_chervelle",
    actions: ["Learn to sort laundry", "Use washing machine independently", "Iron basic items", "Maintain weekly routine"],
    progress: "", percentComplete: 0,
    reviewDate: d(14), notes: "Starting next week. Casey has agreed to give it a go.", createdAt: d(0),
  },
  {
    id: "tg_008", youngPersonId: "yp_casey", area: "legal_rights",
    goal: "Understand rights as a care leaver",
    description: "Ensure Casey knows entitlements under the Children (Leaving Care) Act 2000 and local offer.",
    status: "in_progress", targetDate: d(30), startDate: d(-14), keyWorker: "staff_darren",
    actions: ["Key work session on leaving care rights", "Review local authority local offer document", "Meet with advocacy service", "Create personal entitlements checklist"],
    progress: "Completed first key work session. Casey has a copy of the local offer.", percentComplete: 35,
    reviewDate: d(7), notes: "Casey engaged well. Asked good questions about housing deposit support.", createdAt: d(-14),
  },
  {
    id: "tg_009", youngPersonId: "yp_casey", area: "identity",
    goal: "Explore cultural identity and heritage",
    description: "Support Casey to learn about and celebrate their cultural heritage and personal identity.",
    status: "in_progress", targetDate: d(60), startDate: d(-21), keyWorker: "staff_chervelle",
    actions: ["Life story session focused on heritage", "Research family cultural background", "Cook traditional family recipes", "Create identity scrapbook"],
    progress: "Started scrapbook. Had a meaningful conversation about family traditions.", percentComplete: 25,
    reviewDate: d(14), notes: "Very personal work — Casey needs space to lead the pace.", createdAt: d(-21),
  },
  {
    id: "tg_010", youngPersonId: "yp_alex", area: "independent_living",
    goal: "Travel independently using public transport",
    description: "Alex to plan and complete journeys using buses and trains without staff support.",
    status: "on_track", targetDate: d(30), startDate: d(-35), keyWorker: "staff_darren",
    actions: ["Learn to read bus timetables", "Plan a journey using Google Maps", "Complete a bus journey with staff shadowing", "Complete a solo journey and report back"],
    progress: "Completed two shadowed journeys. Planning first solo trip to Derby city centre.", percentComplete: 65,
    reviewDate: d(7), notes: "Confident on familiar routes. Needs practice with unfamiliar journeys.", createdAt: d(-35),
  },
];

// ── Export columns ───────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<TransitionGoal>[] = [
  { header: "ID",            accessor: (r: TransitionGoal) => r.id },
  { header: "Young Person",  accessor: (r: TransitionGoal) => getYPName(r.youngPersonId) },
  { header: "Area",          accessor: (r: TransitionGoal) => AREA_META[r.area].label },
  { header: "Goal",          accessor: (r: TransitionGoal) => r.goal },
  { header: "Description",   accessor: (r: TransitionGoal) => r.description },
  { header: "Status",        accessor: (r: TransitionGoal) => STATUS_META[r.status].label },
  { header: "% Complete",    accessor: (r: TransitionGoal) => String(r.percentComplete) },
  { header: "Target Date",   accessor: (r: TransitionGoal) => r.targetDate },
  { header: "Start Date",    accessor: (r: TransitionGoal) => r.startDate },
  { header: "Review Date",   accessor: (r: TransitionGoal) => r.reviewDate },
  { header: "Key Worker",    accessor: (r: TransitionGoal) => getStaffName(r.keyWorker) },
  { header: "Actions",       accessor: (r: TransitionGoal) => r.actions.join("; ") },
  { header: "Progress",      accessor: (r: TransitionGoal) => r.progress },
  { header: "Notes",         accessor: (r: TransitionGoal) => r.notes },
  { header: "Created",       accessor: (r: TransitionGoal) => r.createdAt },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function TransitionPlanningPage() {
  const [goals, setGoals] = useState<TransitionGoal[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("target");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(goals.map((g) => g.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [goals]);

  const filtered = useMemo(() => {
    let list = [...goals];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((g) => g.goal.toLowerCase().includes(s) || g.description.toLowerCase().includes(s) || g.progress.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((g) => g.youngPersonId === childFilter);
    if (areaFilter !== "all") list = list.filter((g) => g.area === areaFilter);
    if (statusFilter !== "all") list = list.filter((g) => g.status === statusFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "target":   return a.targetDate.localeCompare(b.targetDate);
        case "area":     return AREA_META[a.area].label.localeCompare(AREA_META[b.area].label);
        case "status":   return a.status.localeCompare(b.status);
        case "progress": return b.percentComplete - a.percentComplete;
        case "child":    return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default:         return 0;
      }
    });
    return list;
  }, [goals, search, childFilter, areaFilter, statusFilter, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter((g) => g.status === "achieved").length;
    const atRisk = goals.filter((g) => g.status === "at_risk").length;
    const avgProgress = total > 0 ? Math.round(goals.reduce((s, g) => s + g.percentComplete, 0) / total) : 0;
    const overdue = goals.filter((g) => g.targetDate < d(0) && g.status !== "achieved").length;
    return { total, achieved, atRisk, avgProgress, overdue };
  }, [goals]);

  // ── Per-child progress ────────────────────────────────────────────────────
  const childProgress = useMemo(() => {
    return children.map((c) => {
      const cg = goals.filter((g) => g.youngPersonId === c.id);
      const avg = cg.length > 0 ? Math.round(cg.reduce((s, g) => s + g.percentComplete, 0) / cg.length) : 0;
      const achieved = cg.filter((g) => g.status === "achieved").length;
      const atRisk = cg.filter((g) => g.status === "at_risk").length;
      return { ...c, total: cg.length, avg, achieved, atRisk };
    });
  }, [children, goals]);

  return (
    <PageShell
      title="Transition Planning"
      subtitle="Pathway planning for independence — tracking goals across all life areas"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Transition Planning" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="transition-planning" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Goal</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Goals",     value: stats.total,       icon: <Target className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Achieved",        value: stats.achieved,    icon: <CheckCircle2 className="h-4 w-4" />,    color: "text-emerald-600" },
            { label: "At Risk",         value: stats.atRisk,      icon: <AlertTriangle className="h-4 w-4" />,   color: "text-red-600" },
            { label: "Avg Progress",    value: `${stats.avgProgress}%`, icon: <ArrowRightLeft className="h-4 w-4" />, color: "text-purple-600" },
            { label: "Overdue",         value: stats.overdue,     icon: <Clock className="h-4 w-4" />,           color: "text-amber-600" },
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

        {/* ── At-risk alert ──────────────────────────────────────────────────── */}
        {stats.atRisk > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span><strong>{stats.atRisk}</strong> goal{stats.atRisk !== 1 && "s"} at risk — review pathway plans and increase support where needed.</span>
            </CardContent>
          </Card>
        )}

        {/* ── Per-child cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {childProgress.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{c.name}</p>
                  <Badge variant="outline">{c.total} goals</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className={cn("h-2 rounded-full", c.avg >= 60 ? "bg-green-500" : c.avg >= 30 ? "bg-amber-500" : "bg-red-400")} style={{ width: `${c.avg}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.avg}% avg progress</span>
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600">{c.achieved} achieved</span>
                    {c.atRisk > 0 && <span className="text-red-600">{c.atRisk} at risk</span>}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search goals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {Object.entries(AREA_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="target">Target Date</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Goal list ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No goals match your filters.</p>}
          {filtered.map((g) => {
            const open = !!expanded[g.id];
            const areaM = AREA_META[g.area];
            const statusM = STATUS_META[g.status];
            const overdue = g.targetDate < d(0) && g.status !== "achieved";
            return (
              <Card key={g.id} className={cn("border-l-4", g.status === "achieved" ? "border-l-emerald-500" : g.status === "at_risk" ? "border-l-red-500" : g.status === "on_track" ? "border-l-green-500" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(g.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", areaM.color)}>{areaM.icon}<span className="ml-1">{areaM.label}</span></Badge>
                        <Badge className={cn("text-xs", statusM.color)}>{statusM.label}</Badge>
                        {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                      </div>
                      <p className="font-semibold">{g.goal}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{getYPName(g.youngPersonId)}</span>
                        <span>Key Worker: {getStaffName(g.keyWorker)}</span>
                        <span>Target: {g.targetDate}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={cn("h-2 rounded-full transition-all", g.percentComplete >= 80 ? "bg-emerald-500" : g.percentComplete >= 50 ? "bg-blue-500" : g.percentComplete >= 25 ? "bg-amber-500" : "bg-gray-400")} style={{ width: `${g.percentComplete}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{g.percentComplete}%</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Description</p>
                        <p>{g.description}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Action Steps</p>
                        <ul className="list-disc list-inside space-y-1">
                          {g.actions.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                      {g.progress && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Progress Update</p>
                          <p className="bg-blue-50 p-2 rounded text-blue-900">{g.progress}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">Started</p><p className="font-medium">{g.startDate}</p></div>
                        <div><p className="text-xs text-muted-foreground">Target</p><p className="font-medium">{g.targetDate}</p></div>
                        <div><p className="text-xs text-muted-foreground">Next Review</p><p className="font-medium">{g.reviewDate}</p></div>
                        <div><p className="text-xs text-muted-foreground">Key Worker</p><p className="font-medium">{getStaffName(g.keyWorker)}</p></div>
                      </div>
                      {g.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground">{g.notes}</p>
                        </div>
                      )}
                      {g.status !== "achieved" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setGoals((prev) => prev.map((x) => x.id === g.id ? { ...x, status: "on_track" } : x))}>Mark On Track</Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setGoals((prev) => prev.map((x) => x.id === g.id ? { ...x, status: "at_risk" } : x))}>Flag At Risk</Button>
                          <Button size="sm" variant="default" onClick={() => setGoals((prev) => prev.map((x) => x.id === g.id ? { ...x, status: "achieved", percentComplete: 100 } : x))}>Mark Achieved</Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Reg note ───────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Pathway plans must be reviewed at least every six months (or more frequently if circumstances change). All children 16+ must have a transition/pathway plan in place. Plans should be co-produced with the young person and cover all areas identified in the Children (Leaving Care) Act 2000.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New goal dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Transition Goal</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Life Area</label>
              <Select><SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>{Object.entries(AREA_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Goal</label>
              <Input placeholder="What does the young person want to achieve?" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea placeholder="Describe the goal and expected outcome…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Target Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Key Worker</label>
              <Select><SelectTrigger><SelectValue placeholder="Assign key worker" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff_darren">{getStaffName("staff_darren")}</SelectItem>
                  <SelectItem value="staff_ryan">{getStaffName("staff_ryan")}</SelectItem>
                  <SelectItem value="staff_anna">{getStaffName("staff_anna")}</SelectItem>
                  <SelectItem value="staff_chervelle">{getStaffName("staff_chervelle")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Initial Notes</label>
              <Textarea placeholder="Any context or background…" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Create Goal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
