"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPracticePanel } from "@/components/cara-practice/cara-practice-panel";
import { WritingToChildPanel } from "@/components/writing-to-child/writing-to-child-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Plus, Heart, Activity, Star, Smile, Meh, Frown,
  Moon, Sun, Utensils, ChevronDown, Loader2, AlertCircle, X, Sparkles,
  Brain, CheckCircle2, ChevronUp, Search, BarChart3, AlertTriangle,
  Users, ArrowUpDown,
} from "lucide-react";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import { useDailyLog, useCreateDailyLog } from "@/hooks/use-daily-log";
import { InlinePracticeReasoning } from "@/components/cara-reasoning/inline-practice-reasoning";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { CaraQuickActions } from "@/components/intelligence/cara-quick-actions";
import { CaraCompose } from "@/components/cara/cara-compose";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import type { DailyLogEntry } from "@/types";
import type { TrainingNeedPriority } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const DAILY_LOG_EXPORT_COLS: ExportColumn<DailyLogEntry>[] = [
  { header: "Date", accessor: (e) => e.date },
  { header: "Time", accessor: (e) => e.time },
  { header: "Young Person", accessor: (e) => getYPName(e.child_id) },
  { header: "Entry Type", accessor: (e) => e.entry_type },
  { header: "Content", accessor: (e) => e.content },
  { header: "Mood Score", accessor: (e) => e.mood_score !== null ? String(e.mood_score) : "" },
  { header: "Significant", accessor: (e) => e.is_significant ? "Yes" : "No" },
  { header: "Staff", accessor: (e) => getStaffName(e.staff_id) },
  { header: "Created", accessor: (e) => e.created_at },
];


// ── Constants ────────────────────────────────────────────────────────────────

const ENTRY_TYPES: DailyLogEntry["entry_type"][] = [
  "general", "behaviour", "health", "education", "contact", "activity", "mood", "sleep", "food",
];

const ENTRY_TYPE_ICONS: Record<string, React.ElementType> = {
  general: BookOpen,
  behaviour: Activity,
  health: Heart,
  education: BookOpen,
  contact: Heart,
  activity: Star,
  mood: Smile,
  sleep: Moon,
  food: Utensils,
};

const ENTRY_TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600",
  behaviour: "bg-orange-100 text-orange-700",
  health: "bg-red-100 text-red-700",
  education: "bg-blue-100 text-blue-700",
  contact: "bg-violet-100 text-violet-700",
  activity: "bg-emerald-100 text-emerald-700",
  mood: "bg-amber-100 text-amber-700",
  sleep: "bg-indigo-100 text-indigo-700",
  food: "bg-teal-100 text-teal-700",
};

type DateFilter = "today" | "yesterday" | "7days" | "all";

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7days": "Last 7 days",
  all: "All",
};

function moodColor(score: number): string {
  if (score >= 8) return "bg-emerald-100 text-emerald-700";
  if (score >= 6) return "bg-amber-100 text-amber-700";
  if (score >= 4) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function MoodIcon({ score }: { score: number }) {
  if (score >= 7) return <Smile className="h-3 w-3" />;
  if (score >= 4) return <Meh className="h-3 w-3" />;
  return <Frown className="h-3 w-3" />;
}

// ── New Entry Form ────────────────────────────────────────────────────────────

interface NewEntryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewEntryForm({ onClose, onSuccess }: NewEntryFormProps) {
  const ypQuery = useYoungPeople();
  const currentYP = ypQuery.data?.data ?? [];
  const createMutation = useCreateDailyLog();
  const { currentUser, currentRole } = useAuthContext();

  const [childId, setChildId] = useState(currentYP[0]?.id ?? "");
  const [entryType, setEntryType] = useState<DailyLogEntry["entry_type"]>("general");
  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [isSignificant, setIsSignificant] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await createMutation.mutateAsync({
      child_id: childId,
      entry_type: entryType,
      content: content.trim(),
      mood_score: moodScore,
      is_significant: isSignificant,
    });
    onSuccess();
  }

  return (
    <Card className="border-2 border-slate-900 rounded-2xl">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-900">New Log Entry</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* YP selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Young Person</label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {currentYP.map((yp) => (
                  <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
                ))}
              </select>
            </div>
            {/* Entry type selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Entry Type</label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as DailyLogEntry["entry_type"])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Practice reasoning for the selected child — the engine heart at the point of recording */}
          {childId && <InlinePracticeReasoning childId={childId} childName={getYPName(childId)} />}

          {/* Content */}
          <CaraCompose
            value={content}
            onChange={setContent}
            actorUserId={currentUser?.id ?? "staff_darren"}
            actorRole={appRoleToCaraRole(currentRole)}
            homeId={currentUser?.home_id ?? "home_oak"}
            childId={childId || undefined}
            sourceModule="daily_log"
            sourceField="content"
            defaultCommand="professionalise_record"
            label="Notes"
            placeholder="Record what happened, how the young person was, any significant events or observations..."
            rows={5}
          />

          <div className="flex items-center gap-6">
            {/* Mood score */}
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Mood Score (optional): {moodScore !== null ? `${moodScore}/10` : "—"}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore ?? 5}
                onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
                onMouseDown={() => { if (moodScore === null) setMoodScore(5); }}
                className="w-full accent-slate-900"
              />
              {moodScore !== null && (
                <button
                  type="button"
                  onClick={() => setMoodScore(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 mt-0.5"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Significant toggle */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsSignificant(!isSignificant)}
                className={cn(
                  "h-5 w-9 rounded-full transition-colors",
                  isSignificant ? "bg-amber-500" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5",
                    isSignificant ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
              <span className="text-xs text-slate-600">Significant</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Saving...</>
              ) : (
                "Save Entry"
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {createMutation.error?.message || "Failed to save"}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ── Log Entry Card ────────────────────────────────────────────────────────────

function LogEntryCard({ entry }: { entry: DailyLogEntry }) {
  const [showCara, setShowCara] = useState(false);
  const Icon = ENTRY_TYPE_ICONS[entry.entry_type] || BookOpen;
  const ypName = getYPName(entry.child_id);
  const staffFirst = getStaffName(entry.staff_id).split(" ")[0];

  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            ENTRY_TYPE_COLORS[entry.entry_type] || "bg-slate-100 text-slate-600"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[9px] rounded-full capitalize", ENTRY_TYPE_COLORS[entry.entry_type])}>
                {entry.entry_type}
              </Badge>
              <span className="text-xs text-violet-600 flex items-center gap-1">
                <Heart className="h-2.5 w-2.5" />{ypName}
              </span>
              <span className="text-xs text-slate-400">{entry.time} · {staffFirst}</span>
              {entry.is_significant && (
                <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700">
                  <Star className="h-2.5 w-2.5 mr-0.5" />Significant
                </Badge>
              )}
              {entry.mood_score !== null && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5", moodColor(entry.mood_score))}>
                  <MoodIcon score={entry.mood_score} />
                  {entry.mood_score}/10
                </span>
              )}
              {/* Cara quick-action toggle */}
              <button
                onClick={() => setShowCara((v) => !v)}
                className={cn(
                  "ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors",
                  showCara
                    ? "bg-violet-100 text-violet-700 border-violet-200"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
                )}
              >
                <Sparkles className="h-2.5 w-2.5" />Ask Cara
              </button>
            </div>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">{entry.content}</p>

            {/* Care event source link */}
            {(entry as never as { care_event_id?: string }).care_event_id && (
              <Link
                href={`/care-events/${(entry as never as { care_event_id: string }).care_event_id}`}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Logged from Care Event
              </Link>
            )}

            {/* Inline Cara actions */}
            {showCara && (
              <div className="mt-3">
                <CaraQuickActions
                  childId={entry.child_id}
                  sourceType={entry.entry_type === "behaviour" ? "behaviour" : "daily_log"}
                  sourceId={entry.id}
                  defaultOpen
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Cara Pattern Scanner ──────────────────────────────────────────────────────
type DetectedPattern = {
  need_type: string;
  title: string;
  description: string;
  priority: TrainingNeedPriority;
};

function CaraPatternScanner({ entries }: { entries: DailyLogEntry[] }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [created, setCreated] = useState<Set<number>>(new Set());
  const [scanError, setScanError] = useState("");
  const createNeed = useCreateTrainingNeed();

  async function handleScan() {
    if (entries.length === 0) return;
    setScanning(true);
    setScanError("");
    setPatterns([]);
    setOpen(true);
    try {
      const summary = entries
        .slice(0, 20)
        .map((e) => `[${e.entry_type}] ${getYPName(e.child_id)}: ${e.content.slice(0, 120)}`)
        .join("\n");
      const res = await api.post<{ data: { parsed?: { needs?: DetectedPattern[] } } }>("/cara", {
        mode: "training_needs_analysis",
        source_content: summary,
        page_context: "daily_log",
        record_type: "daily_log_batch",
        user_role: "registered_manager",
      });
      setPatterns(res.data?.parsed?.needs ?? []);
    } catch {
      setScanError("Cara could not analyse the entries. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function handleCreate(p: DetectedPattern, idx: number) {
    await createNeed.mutateAsync({
      home_id: homeId,
      identified_by: "daily_log",
      need_type: p.need_type as "safeguarding",
      title: p.title,
      description: p.description,
      priority: p.priority,
      affected_roles: ["residential_care_worker", "senior_residential_care_worker"],
      status: "identified",
      cara_evidence: `Detected by Cara from ${entries.length} daily log entries`,
      created_by: currentUser?.id ?? "staff_darren",
    });
    setCreated((prev) => new Set(prev).add(idx));
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
          <Brain className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Cara Pattern Analysis</p>
          <p className="text-xs text-slate-500">Scan current entries for staff training patterns</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
          onClick={handleScan}
          disabled={scanning || entries.length === 0}
        >
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {scanning ? "Scanning…" : "Scan Now"}
        </Button>
        {patterns.length > 0 && (
          <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-slate-600">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {open && (
        <div className="border-t border-violet-100 px-4 pb-4 pt-3 space-y-2">
          {scanning && (
            <div className="flex items-center gap-2 text-sm text-violet-600 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysing {entries.length} entries for training patterns…
            </div>
          )}
          {scanError && <p className="text-xs text-red-600">{scanError}</p>}
          {!scanning && patterns.length === 0 && !scanError && (
            <p className="text-xs text-slate-500 py-1">No training patterns detected in these entries.</p>
          )}
          {patterns.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                  <Badge className={cn("text-[10px] h-4 px-1.5 border",
                    p.priority === "urgent" ? "bg-red-100 text-red-700 border-red-200" :
                    p.priority === "high" ? "bg-orange-100 text-orange-700 border-orange-200" :
                    "bg-amber-100 text-amber-700 border-amber-200"
                  )}>{p.priority}</Badge>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{p.need_type.replace(/_/g, " ")}</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">{p.description}</p>
              </div>
              {created.has(i) ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium shrink-0 pt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Created
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0"
                  onClick={() => handleCreate(p, i)}
                  disabled={createNeed.isPending}
                >
                  Create Need
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DailyLogPage() {
  const [selectedYP, setSelectedYP] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("7days");
  const [typeFilter, setTypeFilter] = useState<DailyLogEntry["entry_type"] | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "type" | "mood" | "yp">("date");
  const [showForm, setShowForm] = useState(false);

  const ypQuery = useYoungPeople();
  const currentYP = ypQuery.data?.data ?? [];

  // Build params for useDailyLog
  const queryParams = {
    ...(selectedYP !== "all" ? { child_id: selectedYP } : {}),
    ...(dateFilter === "today" ? { date: new Date().toISOString().slice(0, 10) } : {}),
    ...(dateFilter === "yesterday" ? { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10) } : {}),
    ...(dateFilter === "7days" ? { days: 7 } : {}),
    ...(typeFilter !== "all" ? { entry_type: typeFilter } : {}),
  };

  const { data, isLoading, isError, error } = useDailyLog(queryParams);

  const allEntries = data?.data ?? [];
  const typeCounts = data?.meta.by_type ?? {};

  // Search + sort filter
  const entries = useMemo(() => {
    let result = allEntries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.content.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q) ||
        getStaffName(e.staff_id).toLowerCase().includes(q) ||
        e.entry_type.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "type": return a.entry_type.localeCompare(b.entry_type);
        case "mood": return (b.mood_score ?? -1) - (a.mood_score ?? -1);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`);
      }
    });
  }, [allEntries, search, sortBy]);

  // Summary stats
  const stats = useMemo(() => {
    const significantCount = entries.filter((e) => e.is_significant).length;
    const moodEntries = entries.filter((e) => e.mood_score !== null);
    const avgMood = moodEntries.length > 0
      ? Math.round(moodEntries.reduce((sum, e) => sum + (e.mood_score ?? 0), 0) / moodEntries.length * 10) / 10
      : null;
    const lowMoodCount = moodEntries.filter((e) => (e.mood_score ?? 10) <= 4).length;
    const uniqueYP = new Set(entries.map((e) => e.child_id)).size;
    const uniqueStaff = new Set(entries.map((e) => e.staff_id)).size;
    return {
      total: entries.length,
      significant: significantCount,
      avgMood,
      lowMoodCount,
      uniqueYP,
      uniqueStaff,
    };
  }, [entries]);

  // Group by date
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // YP entry counts
  const ypCounts: Record<string, number> = {};
  for (const e of allEntries) {
    ypCounts[e.child_id] = (ypCounts[e.child_id] || 0) + 1;
  }

  return (
    <PageShell
      title="Daily Log"
      subtitle="Individual daily observations, mood, health, education, and contact records"
      quickCreateContext={{
        module: "daily-log",
        defaultTaskCategory: "young_person_plans",
        defaultFormType: "daily_check",
        preferredTab: "form",
      }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Daily Log" subtitle="Chamberlain House — Daily Observations" targetId="daily-log-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Daily Log — supporting document upload" />
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {showForm ? "Cancel" : "New Entry"}
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "daily_log", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
      caraContext={{ pageTitle: "Daily Log", sourceType: "general" }}
    >
      <CaraPanel
        mode="write"
        pageContext="Daily Log — shift observations, significant events, behaviour, welfare, activities, mood, sleep, food, child voice, continuity of care recording"
        recordType="daily_log"
        userRole="registered_manager"
        className="mb-5"
      />
      <div id="daily-log-content" className="space-y-5">
        {/* Stats row */}
        {!isLoading && entries.length > 0 && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Total Entries", value: stats.total, colour: "text-slate-700", bg: "bg-slate-50", icon: BookOpen },
              { label: "Significant", value: stats.significant, colour: stats.significant > 0 ? "text-amber-700" : "text-slate-400", bg: stats.significant > 0 ? "bg-amber-50" : "bg-slate-50", icon: Star },
              { label: "Avg Mood", value: stats.avgMood !== null ? `${stats.avgMood}/10` : "—", colour: stats.avgMood !== null && stats.avgMood >= 6 ? "text-emerald-700" : stats.avgMood !== null ? "text-amber-700" : "text-slate-400", bg: stats.avgMood !== null && stats.avgMood >= 6 ? "bg-emerald-50" : "bg-amber-50", icon: Smile },
              { label: "Low Mood", value: stats.lowMoodCount, colour: stats.lowMoodCount > 0 ? "text-red-700" : "text-emerald-700", bg: stats.lowMoodCount > 0 ? "bg-red-50" : "bg-emerald-50", icon: AlertTriangle },
              { label: "Young People", value: stats.uniqueYP, colour: "text-violet-700", bg: "bg-violet-50", icon: Heart },
              { label: "Staff Recording", value: stats.uniqueStaff, colour: "text-blue-700", bg: "bg-blue-50", icon: Users },
            ].map(({ label, value, colour, bg, icon: Icon }) => (
              <div key={label} className={cn("rounded-xl border border-slate-100 p-3", bg)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", colour)} />
                  <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                </div>
                <div className={cn("text-lg font-bold tabular-nums", colour)}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Cara Pattern Scanner */}
        <CaraPatternScanner entries={entries} />

        {/* New entry form */}
        {showForm && (
          <NewEntryForm
            onClose={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        )}

        {/* Search bar + sort + export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entries by content, young person, or staff…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="date">Date &amp; Time</option>
              <option value="type">Entry Type</option>
              <option value="mood">Mood Score</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
          <ExportButton data={entries} columns={DAILY_LOG_EXPORT_COLS} filename="daily-log" />
        </div>

        {/* Results count */}
        {search && (
          <p className="text-xs text-slate-500">
            Showing {entries.length} of {allEntries.length} entr{allEntries.length !== 1 ? "ies" : "y"}
            <span className="text-slate-400"> matching &ldquo;{search}&rdquo;</span>
          </p>
        )}

        {/* YP filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedYP("all")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all border",
              selectedYP === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            All young people
            <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 ml-1 font-semibold",
              selectedYP === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {entries.length}
            </span>
          </button>
          {currentYP.map((yp) => (
            <button
              key={yp.id}
              onClick={() => setSelectedYP(yp.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                selectedYP === yp.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Heart className="h-3.5 w-3.5" />
              {yp.preferred_name || yp.first_name}
              <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 ml-1 font-semibold",
                selectedYP === yp.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {ypCounts[yp.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Date + Type filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  dateFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {DATE_FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
                typeFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              All types
            </button>
            {ENTRY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border capitalize",
                  typeFilter === t
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                {t}
                {typeCounts[t] ? (
                  <span className="ml-1 opacity-70">({typeCounts[t]})</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-sm">Loading entries...</span>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Failed to load log entries</p>
              <p className="text-xs mt-0.5">{error?.message}</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-200" />
            <div className="text-sm font-medium">No log entries found</div>
            <div className="text-xs mt-1">Try a different filter or add a new entry</div>
            <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {formatDate(date)}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] text-slate-400">{grouped[date].length} entries</span>
                </div>
                <div className="space-y-3">
                  {grouped[date].map((entry) => (
                    <LogEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Care Events pipeline — records routed to the daily log */}
        <CareEventsPanel
          title="Care Events — Daily Log"
          category="general"
          days={14}
          defaultCollapsed
          className="mt-2"
        />
      </div>
      <CaraPracticePanel sourceType="daily_record" homeId="home_oak" title="Run Cara on this log" />
      <div className="mt-4">
        <WritingToChildPanel defaultRecordType="daily_log" showRecordTypeSelect={false} showAdvanced={false} title="Writing to the Child — check this log entry" />
      </div>
    </PageShell>
  );
}
