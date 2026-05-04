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
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  ListChecks, Heart, MessageSquare, Target, Shield,
  AlertTriangle, CheckCircle2, Clock, Calendar, Star, BookOpen
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type SessionType = "one_to_one" | "group" | "informal" | "review" | "wellbeing_check" | "goal_setting" | "life_skills" | "therapeutic";
type MoodRating = 1 | 2 | 3 | 4 | 5;

interface KeyWorkSession {
  id: string;
  youngPersonId: string;
  keyWorker: string;
  date: string;
  type: SessionType;
  duration: number; // minutes
  location: string;
  topicsDiscussed: string[];
  childVoice: string;
  workerObservations: string;
  actionsAgreed: string[];
  moodBefore: MoodRating;
  moodAfter: MoodRating;
  followUp: string;
  followUpDate: string;
  followUpCompleted: boolean;
  linkedGoals: string[];
  confidential: boolean;
  createdAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const TYPE_META: Record<SessionType, { label: string; icon: React.ReactNode; color: string }> = {
  one_to_one:      { label: "1:1 Session",        icon: <MessageSquare className="h-4 w-4" />, color: "bg-blue-100 text-blue-800" },
  group:           { label: "Group Session",       icon: <ListChecks className="h-4 w-4" />,    color: "bg-purple-100 text-purple-800" },
  informal:        { label: "Informal",            icon: <Heart className="h-4 w-4" />,         color: "bg-pink-100 text-pink-800" },
  review:          { label: "Progress Review",     icon: <Target className="h-4 w-4" />,        color: "bg-green-100 text-green-800" },
  wellbeing_check: { label: "Wellbeing Check",     icon: <Shield className="h-4 w-4" />,        color: "bg-amber-100 text-amber-800" },
  goal_setting:    { label: "Goal Setting",        icon: <Star className="h-4 w-4" />,          color: "bg-indigo-100 text-indigo-800" },
  life_skills:     { label: "Life Skills",         icon: <BookOpen className="h-4 w-4" />,      color: "bg-teal-100 text-teal-800" },
  therapeutic:     { label: "Therapeutic",          icon: <Heart className="h-4 w-4" />,         color: "bg-rose-100 text-rose-800" },
};

const MOOD_LABELS: Record<MoodRating, string> = { 1: "Very Low", 2: "Low", 3: "Okay", 4: "Good", 5: "Great" };
const MOOD_EMOJI: Record<MoodRating, string> = { 1: "😢", 2: "😟", 3: "😐", 4: "🙂", 5: "😊" };

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: KeyWorkSession[] = [
  {
    id: "kw_001", youngPersonId: "yp_alex", keyWorker: "staff_darren", date: d(-1), type: "one_to_one",
    duration: 45, location: "Quiet room",
    topicsDiscussed: ["College application progress", "Anxiety about interviews", "Weekend plans"],
    childVoice: "I'm worried about the college interview. I don't know what to say about why I want to do the course. Can we practise?",
    workerObservations: "Alex appeared anxious initially but relaxed during the session. Engaged well with mock interview practice. Showed genuine interest in the course but lacks confidence in articulating this.",
    actionsAgreed: ["Practise interview questions together on Thursday", "Write three reasons for choosing the course", "Staff to contact college about support for LAC students"],
    moodBefore: 2, moodAfter: 4, followUp: "Mock interview session", followUpDate: d(2), followUpCompleted: false,
    linkedGoals: ["College application"], confidential: false, createdAt: d(-1),
  },
  {
    id: "kw_002", youngPersonId: "yp_alex", keyWorker: "staff_darren", date: d(-8), type: "goal_setting",
    duration: 30, location: "Kitchen",
    topicsDiscussed: ["Cooking independence goal", "Meal planning", "Budgeting for food shopping"],
    childVoice: "I want to learn how to make a roast dinner. My nan used to make the best roasts and I want to learn.",
    workerObservations: "Emotional connection to cooking through memories of nan. This is a strong motivator. Alex planned a shopping list independently with minimal prompting.",
    actionsAgreed: ["Plan roast dinner for Sunday", "Create shopping list together", "Alex to try making a simple dessert midweek"],
    moodBefore: 3, moodAfter: 5, followUp: "Sunday roast cooking session", followUpDate: d(-3), followUpCompleted: true,
    linkedGoals: ["Independent cooking skills"], confidential: false, createdAt: d(-8),
  },
  {
    id: "kw_003", youngPersonId: "yp_jordan", keyWorker: "staff_anna", date: d(-2), type: "wellbeing_check",
    duration: 20, location: "Jordan's bedroom",
    topicsDiscussed: ["Sleep patterns", "Contact with mum", "Football club"],
    childVoice: "I'm not sleeping well again. I keep thinking about things. Football helps though — I feel better after training.",
    workerObservations: "Jordan tired and quieter than usual. Sleep disruption coincides with cancelled contact with mum last week. Football clearly a positive outlet. May need referral to CAMHS if sleep issues persist.",
    actionsAgreed: ["Try relaxation techniques before bed", "Staff to follow up with social worker about contact", "Keep attending football twice weekly"],
    moodBefore: 2, moodAfter: 3, followUp: "Check in about sleep in 3 days", followUpDate: d(1), followUpCompleted: false,
    linkedGoals: ["Health & wellbeing"], confidential: false, createdAt: d(-2),
  },
  {
    id: "kw_004", youngPersonId: "yp_jordan", keyWorker: "staff_ryan", date: d(-5), type: "review",
    duration: 40, location: "Office",
    topicsDiscussed: ["Pathway plan review", "Housing options", "Leaving care entitlements"],
    childVoice: "I don't want to think about leaving yet. It's scary. But I know I need to start looking at places.",
    workerObservations: "Jordan is anxious about transition but willing to engage when given time. Responded well to visiting supported accommodation photos. Preferred the option with communal living spaces.",
    actionsAgreed: ["Visit supported accommodation next Tuesday", "Jordan to list three things important in a home", "Staff to arrange meeting with leaving care PA"],
    moodBefore: 2, moodAfter: 3, followUp: "Supported accommodation visit", followUpDate: d(-1), followUpCompleted: true,
    linkedGoals: ["Housing preparation"], confidential: false, createdAt: d(-5),
  },
  {
    id: "kw_005", youngPersonId: "yp_casey", keyWorker: "staff_chervelle", date: d(-3), type: "one_to_one",
    duration: 35, location: "Garden",
    topicsDiscussed: ["School friendships", "Identity exploration", "Creative writing"],
    childVoice: "I wrote a poem about who I am. Do you want to hear it? I'm not sure if it's any good but it felt important to write it.",
    workerObservations: "Casey shared a deeply personal poem about identity and belonging. Showed vulnerability and trust in sharing this. The poem referenced feeling 'in between two worlds'. Casey is processing complex feelings about heritage with maturity.",
    actionsAgreed: ["Casey to keep writing journal", "Consider sharing poem with therapist if comfortable", "Staff to source creative writing resources"],
    moodBefore: 3, moodAfter: 4, followUp: "Check if Casey wants to continue creative work", followUpDate: d(4), followUpCompleted: false,
    linkedGoals: ["Identity exploration"], confidential: true, createdAt: d(-3),
  },
  {
    id: "kw_006", youngPersonId: "yp_casey", keyWorker: "staff_chervelle", date: d(-10), type: "life_skills",
    duration: 60, location: "Kitchen & utility room",
    topicsDiscussed: ["Laundry skills", "Cleaning routine", "Personal hygiene"],
    childVoice: "I didn't know you had to separate colours! No one ever showed me before.",
    workerObservations: "Casey engaged well with practical learning. Needed step-by-step guidance but picked up quickly. Showed pride in completing a full wash cycle independently. Good opportunity for positive reinforcement.",
    actionsAgreed: ["Casey to do own laundry every Saturday", "Create visual guide for laundry steps", "Try ironing school uniform next week"],
    moodBefore: 3, moodAfter: 5, followUp: "Check laundry routine on Saturday", followUpDate: d(-3), followUpCompleted: true,
    linkedGoals: ["Independent living skills"], confidential: false, createdAt: d(-10),
  },
  {
    id: "kw_007", youngPersonId: "yp_alex", keyWorker: "staff_darren", date: d(-14), type: "therapeutic",
    duration: 50, location: "Quiet room",
    topicsDiscussed: ["Anger management strategies", "Recent frustration at school", "Coping techniques"],
    childVoice: "I tried the breathing thing you showed me and it actually worked. I walked away instead of kicking off. I was proud of myself.",
    workerObservations: "Significant progress with emotional regulation. Alex self-reported using calming strategies in a school situation that would previously have escalated. This is a breakthrough moment worth celebrating and recording.",
    actionsAgreed: ["Continue practising grounding techniques daily", "Create a personal calm-down plan card", "Share progress with school SENCO"],
    moodBefore: 4, moodAfter: 5, followUp: "Follow up with school about incident", followUpDate: d(-10), followUpCompleted: true,
    linkedGoals: ["Emotional wellbeing"], confidential: false, createdAt: d(-14),
  },
  {
    id: "kw_008", youngPersonId: "yp_jordan", keyWorker: "staff_anna", date: d(-12), type: "informal",
    duration: 15, location: "Living room",
    topicsDiscussed: ["Weekend activities", "TV preferences", "Family memories"],
    childVoice: "Can we watch that cooking show together? It reminds me of when my dad used to cook.",
    workerObservations: "Brief but meaningful interaction. Jordan initiated conversation about family memories which is rare. Didn't push further but noted the openness. Watching TV together provided a natural, low-pressure connection point.",
    actionsAgreed: ["Watch cooking show together on Wednesdays", "Consider cooking activity linked to family memories"],
    moodBefore: 3, moodAfter: 4, followUp: "", followUpDate: "", followUpCompleted: false,
    linkedGoals: [], confidential: false, createdAt: d(-12),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<KeyWorkSession>[] = [
  { header: "ID",                accessor: (r: KeyWorkSession) => r.id },
  { header: "Young Person",     accessor: (r: KeyWorkSession) => getYPName(r.youngPersonId) },
  { header: "Key Worker",       accessor: (r: KeyWorkSession) => getStaffName(r.keyWorker) },
  { header: "Date",             accessor: (r: KeyWorkSession) => r.date },
  { header: "Type",             accessor: (r: KeyWorkSession) => TYPE_META[r.type].label },
  { header: "Duration (mins)",  accessor: (r: KeyWorkSession) => String(r.duration) },
  { header: "Location",         accessor: (r: KeyWorkSession) => r.location },
  { header: "Topics",           accessor: (r: KeyWorkSession) => r.topicsDiscussed.join("; ") },
  { header: "Child Voice",      accessor: (r: KeyWorkSession) => r.childVoice },
  { header: "Observations",     accessor: (r: KeyWorkSession) => r.workerObservations },
  { header: "Actions",          accessor: (r: KeyWorkSession) => r.actionsAgreed.join("; ") },
  { header: "Mood Before",      accessor: (r: KeyWorkSession) => MOOD_LABELS[r.moodBefore] },
  { header: "Mood After",       accessor: (r: KeyWorkSession) => MOOD_LABELS[r.moodAfter] },
  { header: "Follow Up",        accessor: (r: KeyWorkSession) => r.followUp },
  { header: "Follow Up Date",   accessor: (r: KeyWorkSession) => r.followUpDate },
  { header: "Confidential",     accessor: (r: KeyWorkSession) => r.confidential ? "Yes" : "No" },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function KeyWorkingPage() {
  const [sessions, setSessions] = useState<KeyWorkSession[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(sessions.map((s) => s.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [sessions]);

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) =>
        r.topicsDiscussed.some((t) => t.toLowerCase().includes(s)) ||
        r.childVoice.toLowerCase().includes(s) ||
        r.workerObservations.toLowerCase().includes(s)
      );
    }
    if (childFilter !== "all") list = list.filter((r) => r.youngPersonId === childFilter);
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (tab === "follow_up") list = list.filter((r) => r.followUp && !r.followUpCompleted);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date.localeCompare(a.date);
        case "type":     return TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label);
        case "duration": return b.duration - a.duration;
        case "child":    return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default:         return 0;
      }
    });
    return list;
  }, [sessions, search, childFilter, typeFilter, tab, sortBy]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = sessions.length;
    const thisWeek = sessions.filter((s) => s.date >= d(-7)).length;
    const avgDuration = total > 0 ? Math.round(sessions.reduce((a, s) => a + s.duration, 0) / total) : 0;
    const pendingFollowUp = sessions.filter((s) => s.followUp && !s.followUpCompleted).length;
    const avgMoodImprovement = total > 0 ? (sessions.reduce((a, s) => a + (s.moodAfter - s.moodBefore), 0) / total).toFixed(1) : "0";
    return { total, thisWeek, avgDuration, pendingFollowUp, avgMoodImprovement };
  }, [sessions]);

  // ── Per-child summary ──────────────────────────────────────────────────────
  const childSummary = useMemo(() => {
    return children.map((c) => {
      const cs = sessions.filter((s) => s.youngPersonId === c.id);
      const lastSession = cs.sort((a, b) => b.date.localeCompare(a.date))[0];
      const avgMood = cs.length > 0 ? (cs.reduce((a, s) => a + s.moodAfter, 0) / cs.length).toFixed(1) : "—";
      return { ...c, total: cs.length, lastDate: lastSession?.date || "—", avgMood };
    });
  }, [children, sessions]);

  return (
    <PageShell
      title="Key Working Sessions"
      subtitle="Recording meaningful interactions and tracking progress with each young person"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Key Working Sessions" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="key-working-sessions" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Session</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Sessions",    value: stats.total,              icon: <ListChecks className="h-4 w-4" />,     color: "text-blue-600" },
            { label: "This Week",         value: stats.thisWeek,           icon: <Calendar className="h-4 w-4" />,       color: "text-green-600" },
            { label: "Avg Duration",      value: `${stats.avgDuration}m`,  icon: <Clock className="h-4 w-4" />,          color: "text-purple-600" },
            { label: "Pending Follow-Up", value: stats.pendingFollowUp,    icon: <AlertTriangle className="h-4 w-4" />,  color: "text-amber-600" },
            { label: "Avg Mood Change",   value: `+${stats.avgMoodImprovement}`, icon: <Heart className="h-4 w-4" />,   color: "text-pink-600" },
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

        {/* ── Per-child cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {childSummary.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{c.name}</p>
                  <Badge variant="outline">{c.total} sessions</Badge>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Last: {c.lastDate}</span>
                  <span>Avg mood: {c.avgMood}/5</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Sessions</TabsTrigger>
            <TabsTrigger value="follow_up">Pending Follow-Up ({stats.pendingFollowUp})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sessions…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
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
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Session list ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No sessions match your filters.</p>}
          {filtered.map((s) => {
            const open = !!expanded[s.id];
            const typeM = TYPE_META[s.type];
            return (
              <Card key={s.id} className={cn("border-l-4", s.type === "therapeutic" || s.type === "wellbeing_check" ? "border-l-pink-400" : s.type === "one_to_one" ? "border-l-blue-400" : "border-l-green-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(s.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.icon}<span className="ml-1">{typeM.label}</span></Badge>
                        {s.confidential && <Badge variant="outline" className="text-xs text-red-600 border-red-300">Confidential</Badge>}
                        {s.followUp && !s.followUpCompleted && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Follow-up needed</Badge>}
                      </div>
                      <p className="font-semibold">{getYPName(s.youngPersonId)} — {s.topicsDiscussed.slice(0, 2).join(", ")}{s.topicsDiscussed.length > 2 ? "…" : ""}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{s.date}</span>
                        <span>{s.duration} mins</span>
                        <span>{getStaffName(s.keyWorker)}</span>
                        <span>{s.location}</span>
                      </div>
                      {/* Mood change */}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span>Mood: {MOOD_EMOJI[s.moodBefore]} → {MOOD_EMOJI[s.moodAfter]}</span>
                        {s.moodAfter > s.moodBefore && <span className="text-green-600 font-medium">↑ Improved</span>}
                        {s.moodAfter < s.moodBefore && <span className="text-red-600 font-medium">↓ Decreased</span>}
                        {s.moodAfter === s.moodBefore && <span className="text-gray-500">→ Same</span>}
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Topics Discussed</p>
                        <div className="flex flex-wrap gap-1">
                          {s.topicsDiscussed.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Child&apos;s Voice</p>
                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 italic text-pink-900">
                          &ldquo;{s.childVoice}&rdquo;
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Worker Observations</p>
                        <p>{s.workerObservations}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Actions Agreed</p>
                        <ul className="list-disc list-inside space-y-1">
                          {s.actionsAgreed.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                      {s.followUp && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">Follow-up:</p>
                          <p className="text-sm font-medium">{s.followUp}</p>
                          {s.followUpDate && <Badge variant="outline" className="text-xs">{s.followUpDate}</Badge>}
                          {s.followUpCompleted ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, followUpCompleted: true } : x))}>
                              Mark Done
                            </Button>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">Mood Before</p><p className="font-medium">{MOOD_EMOJI[s.moodBefore]} {MOOD_LABELS[s.moodBefore]}</p></div>
                        <div><p className="text-xs text-muted-foreground">Mood After</p><p className="font-medium">{MOOD_EMOJI[s.moodAfter]} {MOOD_LABELS[s.moodAfter]}</p></div>
                        <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-medium">{s.duration} minutes</p></div>
                        <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{s.location}</p></div>
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
            <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Key working sessions should be recorded within 24 hours. Always capture the child&apos;s voice in their own words. Sessions contribute to care plan reviews, pathway plans, and Reg 44/45 evidence. Confidential sessions are restricted to the key worker and management only.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New session dialog ────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Key Working Session</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Session Type</label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (mins)</label>
                <Input type="number" placeholder="30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input placeholder="Where did the session take place?" />
            </div>
            <div>
              <label className="text-sm font-medium">Topics Discussed</label>
              <Input placeholder="Comma-separated topics" />
            </div>
            <div>
              <label className="text-sm font-medium">Child&apos;s Voice</label>
              <Textarea placeholder="Record what the child said in their own words…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Worker Observations</label>
              <Textarea placeholder="Your professional observations…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Actions Agreed</label>
              <Textarea placeholder="One action per line" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Mood Before (1-5)</label>
                <Select><SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>{([1,2,3,4,5] as MoodRating[]).map((m) => <SelectItem key={m} value={String(m)}>{MOOD_EMOJI[m]} {MOOD_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Mood After (1-5)</label>
                <Select><SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>{([1,2,3,4,5] as MoodRating[]).map((m) => <SelectItem key={m} value={String(m)}>{MOOD_EMOJI[m]} {MOOD_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
