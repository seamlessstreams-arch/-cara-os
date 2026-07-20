"use client";

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import {
  HandHeart, Plus, Calendar, Clock, User, Target,
  FileText, ChevronRight, Sparkles,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Static reference data ────────────────────────────────────────────────────

interface DirectWorkSession {
  id: string;
  youngPerson: string;
  worker: string;
  date: string;
  duration: string;
  type: "therapeutic" | "life_story" | "social_skills" | "independence" | "identity" | "emotional_regulation" | "other";
  title: string;
  summary: string;
  outcomes: string[];
  status: "completed" | "planned" | "cancelled";
}

const TYPE_META: Record<DirectWorkSession["type"], { label: string; colour: string }> = {
  therapeutic:          { label: "Therapeutic",          colour: "bg-purple-50 text-purple-700 border-purple-200" },
  life_story:           { label: "Life Story",           colour: "bg-blue-50 text-blue-700 border-blue-200" },
  social_skills:        { label: "Social Skills",        colour: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  independence:         { label: "Independence",         colour: "bg-amber-50 text-amber-700 border-amber-200" },
  identity:             { label: "Identity",             colour: "bg-rose-50 text-rose-700 border-rose-200" },
  emotional_regulation: { label: "Emotional Regulation", colour: "bg-sky-50 text-sky-700 border-sky-200" },
  other:                { label: "Other",                colour: "bg-slate-50 text-slate-700 border-slate-200" },
};

const STATUS_COLOUR: Record<DirectWorkSession["status"], string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  planned:   "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-slate-50 text-slate-500 border-slate-200",
};

const DEMO_SESSIONS: DirectWorkSession[] = [
  {
    id: "dw_1",
    youngPerson: "Alex T.",
    worker: "Marcus Bell",
    date: "2026-05-30",
    duration: "45 mins",
    type: "life_story",
    title: "Life Story Book — Chapter 3",
    summary: "Continued work on Alex's life story book. Focused on memories from primary school and key friendships. Alex engaged well and contributed three photos.",
    outcomes: ["New chapter section completed", "Identified positive school memories", "Agreed to interview former teacher"],
    status: "completed",
  },
  {
    id: "dw_2",
    youngPerson: "Jordan H.",
    worker: "Priya Sharma",
    date: "2026-05-29",
    duration: "30 mins",
    type: "emotional_regulation",
    title: "Zones of Regulation — Session 4",
    summary: "Practised identifying yellow zone triggers. Jordan was able to name three early-warning signs and chose two calming strategies to try this week.",
    outcomes: ["3 triggers identified", "2 calming strategies selected", "Regulation plan updated"],
    status: "completed",
  },
  {
    id: "dw_3",
    youngPerson: "Casey L.",
    worker: "Marcus Bell",
    date: "2026-06-03",
    duration: "60 mins",
    type: "independence",
    title: "Cooking & Budgeting — Meal Planning",
    summary: "Planning a weekly menu within a budget. Casey will shop independently and prepare two meals.",
    outcomes: [],
    status: "planned",
  },
  {
    id: "dw_4",
    youngPerson: "Alex T.",
    worker: "Olivia Hayes",
    date: "2026-05-27",
    duration: "40 mins",
    type: "identity",
    title: "Identity & Heritage Exploration",
    summary: "Explored cultural heritage through guided conversation and creative activities. Alex created a heritage map and discussed family traditions.",
    outcomes: ["Heritage map created", "Discussion about family traditions", "Follow-up with social worker agreed"],
    status: "completed",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function DirectWorkPage() {
  const [filter, setFilter] = useState<"all" | "completed" | "planned">("all");

  const filtered = demoSeed(DEMO_SESSIONS).filter((s) => filter === "all" || s.status === filter);

  return (
    <PageShell
      title="Direct Work Sessions"
      subtitle="One-to-one therapeutic and developmental work with young people"
      icon={<HandHeart className="h-5 w-5 text-purple-600" />}
      showQuickCreate={false}
      actions={
        <Button size="sm" className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white">
          <Plus className="h-3.5 w-3.5" />
          Record a Session
        </Button>
      }
    >
      {/* Summary banner */}
      <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-sm text-purple-800">
        <span className="font-semibold">Direct Work</span> — Structured one-to-one sessions
        covering life story work, emotional regulation, independence skills, identity
        exploration, and therapeutic activities. Each session is recorded as evidence for
        care planning and reviews.
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "This Month", value: demoSeed(DEMO_SESSIONS).filter((s) => s.status === "completed").length, colour: "border-emerald-200 bg-emerald-50/40 text-emerald-600" },
          { label: "Planned", value: demoSeed(DEMO_SESSIONS).filter((s) => s.status === "planned").length, colour: "border-blue-200 bg-blue-50/40 text-blue-600" },
          { label: "Young People", value: new Set(demoSeed(DEMO_SESSIONS).map((s) => s.youngPerson)).size, colour: "border-violet-200 bg-violet-50/40 text-violet-600" },
          { label: "Session Types", value: new Set(demoSeed(DEMO_SESSIONS).map((s) => s.type)).size, colour: "border-amber-200 bg-amber-50/40 text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded-2xl border p-4", stat.colour)}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {(["all", "completed", "planned"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
              filter === f
                ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            {f === "all" ? "All Sessions" : f}
          </button>
        ))}
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <HandHeart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No sessions recorded yet</p>
          <p className="text-xs text-slate-400 mb-4">
            Record your first direct work session to start building evidence.
          </p>
          <Button size="sm" className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white">
            <Plus className="h-3.5 w-3.5" />
            Record a Session
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const typeMeta = TYPE_META[session.type];
            return (
              <Card key={session.id} className="hover:bg-[var(--cs-surface)] transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm">{session.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)]">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {session.youngPerson}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.duration}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px] border", typeMeta.colour)}>
                        {typeMeta.label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] border capitalize", STATUS_COLOUR[session.status])}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{session.summary}</p>
                  {session.outcomes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {session.outcomes.map((outcome) => (
                        <span
                          key={outcome}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-100"
                        >
                          <Target className="h-2.5 w-2.5" />
                          {outcome}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400">
                      Worker: {session.worker}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes (England) Regulations 2015: Reg 6 (quality and purpose of
        care), Reg 12 (promoting independence). Guide to the Quality Standards: direct
        work as evidence of relationship-based practice and purposeful engagement.
      </div>
    </PageShell>
  );
}
