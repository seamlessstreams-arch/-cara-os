"use client";

import React, { useState, useMemo, useRef } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { PrintButton } from "@/components/common/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  useKeyWorkingSessions,
  useCreateKeyWorkingSession,
  useUpdateKeyWorkingSession,
} from "@/hooks/use-key-working";
import type { KeyWorkingSession } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  ListChecks, Heart, MessageSquare, Target, Shield,
  AlertTriangle, CheckCircle2, Clock, Calendar, Star, BookOpen,
  Loader2,
} from "lucide-react";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Local view-model type (camelCase for the page) ──────────────────────────
interface SessionView {
  id: string;
  youngPersonId: string;
  keyWorker: string;
  date: string;
  type: SessionType;
  duration: number;
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

// ── Types ────────────────────────────────────────────────────────────────────
type SessionType = "one_to_one" | "group" | "informal" | "review" | "wellbeing_check" | "goal_setting" | "life_skills" | "therapeutic";
type MoodRating = 1 | 2 | 3 | 4 | 5;

// ── Mapping helpers ─────────────────────────────────────────────────────────
function toView(s: KeyWorkingSession): SessionView {
  return {
    id: s.id,
    youngPersonId: s.child_id,
    keyWorker: s.staff_id,
    date: s.date,
    type: s.type,
    duration: s.duration,
    location: s.location,
    topicsDiscussed: s.topics,
    childVoice: s.child_voice,
    workerObservations: s.worker_observations,
    actionsAgreed: s.actions_agreed,
    moodBefore: s.mood_before,
    moodAfter: s.mood_after,
    followUp: s.follow_up,
    followUpDate: s.follow_up_date,
    followUpCompleted: s.follow_up_completed,
    linkedGoals: s.linked_goals,
    confidential: s.confidential,
    createdAt: s.created_at,
  };
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
const MOOD_EMOJI: Record<MoodRating, string> = { 1: "\u{1F622}", 2: "\u{1F61F}", 3: "\u{1F610}", 4: "\u{1F642}", 5: "\u{1F60A}" };

// ── Export columns ──────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<SessionView>[] = [
  { header: "ID",                accessor: (r: SessionView) => r.id },
  { header: "Young Person",     accessor: (r: SessionView) => getYPName(r.youngPersonId) },
  { header: "Key Worker",       accessor: (r: SessionView) => getStaffName(r.keyWorker) },
  { header: "Date",             accessor: (r: SessionView) => r.date },
  { header: "Type",             accessor: (r: SessionView) => TYPE_META[r.type].label },
  { header: "Duration (mins)",  accessor: (r: SessionView) => String(r.duration) },
  { header: "Location",         accessor: (r: SessionView) => r.location },
  { header: "Topics",           accessor: (r: SessionView) => r.topicsDiscussed.join("; ") },
  { header: "Child Voice",      accessor: (r: SessionView) => r.childVoice },
  { header: "Observations",     accessor: (r: SessionView) => r.workerObservations },
  { header: "Actions",          accessor: (r: SessionView) => r.actionsAgreed.join("; ") },
  { header: "Mood Before",      accessor: (r: SessionView) => MOOD_LABELS[r.moodBefore] },
  { header: "Mood After",       accessor: (r: SessionView) => MOOD_LABELS[r.moodAfter] },
  { header: "Follow Up",        accessor: (r: SessionView) => r.followUp },
  { header: "Follow Up Date",   accessor: (r: SessionView) => r.followUpDate },
  { header: "Confidential",     accessor: (r: SessionView) => r.confidential ? "Yes" : "No" },
];

// ── Date helper for stats ───────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

// ══════════════════════════════════════════════════════════════════════════════
export default function KeyWorkingPage() {
  const { data: queryData, isLoading } = useKeyWorkingSessions();
  const createMutation = useCreateKeyWorkingSession();
  const updateMutation = useUpdateKeyWorkingSession();

  const sessions: SessionView[] = useMemo(
    () => (queryData?.data ?? []).map(toView),
    [queryData],
  );

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  // Form refs
  const formRef = useRef<HTMLFormElement>(null);
  const [formChildId, setFormChildId] = useState("");
  const [formType, setFormType] = useState("");
  const [formMoodBefore, setFormMoodBefore] = useState("");
  const [formMoodAfter, setFormMoodAfter] = useState("");

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

  // ── Form submit handler ────────────────────────────────────────────────────
  function handleNewSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const topicsRaw = (fd.get("topics") as string) || "";
    const actionsRaw = (fd.get("actions") as string) || "";

    createMutation.mutate(
      {
        child_id: formChildId,
        staff_id: "staff_darren",
        date: (fd.get("date") as string) || new Date().toISOString().slice(0, 10),
        type: formType as SessionType,
        duration: Number(fd.get("duration")) || 30,
        location: (fd.get("location") as string) || "",
        topics: topicsRaw.split(",").map((t) => t.trim()).filter(Boolean),
        child_voice: (fd.get("child_voice") as string) || "",
        worker_observations: (fd.get("worker_observations") as string) || "",
        actions_agreed: actionsRaw.split("\n").map((a) => a.trim()).filter(Boolean),
        mood_before: (Number(formMoodBefore) || 3) as 1 | 2 | 3 | 4 | 5,
        mood_after: (Number(formMoodAfter) || 3) as 1 | 2 | 3 | 4 | 5,
        follow_up: "",
        follow_up_date: "",
        follow_up_completed: false,
        linked_goals: [],
        confidential: false,
      },
      {
        onSuccess: () => {
          toast.success("Session saved", { description: "Key working session recorded successfully." });
          setShowNew(false);
          setFormChildId("");
          setFormType("");
          setFormMoodBefore("");
          setFormMoodAfter("");
          formRef.current?.reset();
        },
      },
    );
  }

  // ── Mark follow-up done ────────────────────────────────────────────────────
  function handleMarkDone(sessionId: string) {
    updateMutation.mutate(
      { id: sessionId, follow_up_completed: true },
      {
        onSuccess: () => {
          toast.success("Follow-up completed", { description: "Follow-up marked as done." });
        },
      },
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell title="Key Working Sessions" subtitle="Recording meaningful interactions and tracking progress with each young person">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Key Working Sessions"
      subtitle="Recording meaningful interactions and tracking progress with each young person"
      ariaContext={{ pageTitle: "Key Working Sessions", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Key Working Sessions" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="key-working-sessions" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Session</Button>
          <AriaStudioQuickActionButton context={{ record_type: "keywork", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <AriaPanel
          mode="assist"
          pageContext="Key Working Sessions — meaningful interactions, goal tracking, child voice"
          recordType="key_work"
          userRole="registered_manager"
          className="mb-2"
        />
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
                      <p className="font-semibold">{getYPName(s.youngPersonId)} &mdash; {s.topicsDiscussed.slice(0, 2).join(", ")}{s.topicsDiscussed.length > 2 ? "…" : ""}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{s.date}</span>
                        <span>{s.duration} mins</span>
                        <span>{getStaffName(s.keyWorker)}</span>
                        <span>{s.location}</span>
                      </div>
                      {/* Mood change */}
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span>Mood: {MOOD_EMOJI[s.moodBefore]} &rarr; {MOOD_EMOJI[s.moodAfter]}</span>
                        {s.moodAfter > s.moodBefore && <span className="text-green-600 font-medium">&uarr; Improved</span>}
                        {s.moodAfter < s.moodBefore && <span className="text-red-600 font-medium">&darr; Decreased</span>}
                        {s.moodAfter === s.moodBefore && <span className="text-gray-500">&rarr; Same</span>}
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
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              disabled={updateMutation.isPending}
                              onClick={() => handleMarkDone(s.id)}
                            >
                              {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
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
                      {/* Smart Link Panel */}
                      <SmartLinkPanel
                        sourceType="key_work_session"
                        sourceId={s.id}
                        childId={s.youngPersonId}
                      />
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
          <form ref={formRef} onSubmit={handleNewSession} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select value={formChildId} onValueChange={setFormChildId}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Session Type</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" name="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (mins)</label>
                <Input type="number" name="duration" placeholder="30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input name="location" placeholder="Where did the session take place?" />
            </div>
            <div>
              <label className="text-sm font-medium">Topics Discussed</label>
              <Input name="topics" placeholder="Comma-separated topics" />
            </div>
            <div>
              <label className="text-sm font-medium">Child&apos;s Voice</label>
              <Textarea name="child_voice" placeholder="Record what the child said in their own words…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Worker Observations</label>
              <Textarea name="worker_observations" placeholder="Your professional observations…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Actions Agreed</label>
              <Textarea name="actions" placeholder="One action per line" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Mood Before (1-5)</label>
                <Select value={formMoodBefore} onValueChange={setFormMoodBefore}>
                  <SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>{([1,2,3,4,5] as MoodRating[]).map((m) => <SelectItem key={m} value={String(m)}>{MOOD_EMOJI[m]} {MOOD_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Mood After (1-5)</label>
                <Select value={formMoodAfter} onValueChange={setFormMoodAfter}>
                  <SelectTrigger><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>{([1,2,3,4,5] as MoodRating[]).map((m) => <SelectItem key={m} value={String(m)}>{MOOD_EMOJI[m]} {MOOD_LABELS[m]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Save Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
