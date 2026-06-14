"use client";

import { useState, useMemo } from "react";
import {
  Smile, Heart, Sun, Cloud,
  ChevronUp, ChevronDown, ArrowUpDown,
  Search, TrendingUp,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type {
  MentalHealthCheckIn,
  MoodRating,
  CheckInSleepQuality,
  CheckInAppetite,
  CheckInEnergy,
  CheckInConversationLength,
} from "@/types/extended";
import {
  CHECK_IN_SLEEP_QUALITY_LABEL,
  CHECK_IN_APPETITE_LABEL,
  CHECK_IN_ENERGY_LABEL,
  CHECK_IN_CONVERSATION_LENGTH_LABEL,
} from "@/types/extended";
import { useMentalHealthCheckIns } from "@/hooks/use-mental-health-check-ins";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── colour maps ──────────────────────────────────────────────────────── */
const MOOD_CONFIG: Record<MoodRating, { color: string; bar: string; label: string }> = {
  1: { color: "text-red-600",    bar: "bg-red-400",    label: "Very low" },
  2: { color: "text-orange-600", bar: "bg-orange-400", label: "Low" },
  3: { color: "text-amber-600",  bar: "bg-amber-400",  label: "OK" },
  4: { color: "text-sky-600",    bar: "bg-sky-400",    label: "Good" },
  5: { color: "text-[var(--cs-cara-gold)]", bar: "bg-[var(--cs-cara-gold-bg)]0", label: "Great" },
};

const SLEEP_COLORS: Record<CheckInSleepQuality, string> = {
  "poor":      "bg-red-100 text-red-800",
  "disrupted": "bg-orange-100 text-orange-800",
  "ok":        "bg-amber-100 text-amber-800",
  "good":      "bg-sky-100 text-sky-800",
  "great":     "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]",
};

const APPETITE_COLORS: Record<CheckInAppetite, string> = {
  "skipped_meals":   "bg-red-100 text-red-800",
  "picked":          "bg-amber-100 text-amber-800",
  "ate_normally":    "bg-sky-100 text-sky-800",
  "hungry_ate_well": "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]",
};

const ENERGY_COLORS: Record<CheckInEnergy, string> = {
  "exhausted": "bg-red-100 text-red-800",
  "low":       "bg-orange-100 text-orange-800",
  "ok":        "bg-amber-100 text-amber-800",
  "good":      "bg-sky-100 text-sky-800",
  "buzzy":     "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function ChildMentalHealthDailyCheckPage() {
  const { data: raw, isLoading } = useMentalHealthCheckIns();
  const items = raw?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.whats_heavy.toLowerCase().includes(q) ||
          r.whats_good.toLowerCase().includes(q) ||
          r.what_would_help.toLowerCase().includes(q) ||
          (r.follow_up_action ?? "").toLowerCase().includes(q) ||
          r.flags_concerns.some((f) => f.toLowerCase().includes(q))
      );
    }
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":      return b.date.localeCompare(a.date);
        case "yp":        return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "mood-high": return b.mood_rating - a.mood_rating;
        case "mood-low":  return a.mood_rating - b.mood_rating;
        default:          return 0;
      }
    });
    return list;
  }, [items, search, filterYP, sortBy]);

  /* stats */
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const thisWeekRecords = items.filter((r) => r.date >= sevenDaysAgoStr);
  const checkInsThisWeek = thisWeekRecords.length;
  const avgMood = items.length === 0 ? 0
    : items.reduce((s, r) => s + r.mood_rating, 0) / items.length;
  const flagsThisWeek = thisWeekRecords.reduce((s, r) => s + r.flags_concerns.length, 0);
  const childLedConversations = items.filter(
    (r) => r.conversation_length === "ten_plus_minutes" || r.conversation_length === "extended"
  ).length;

  const ypIds = [...new Set(items.map(r => r.child_id))];

  const exportCols: ExportColumn<MentalHealthCheckIn>[] = useMemo(() => [
    { header: "ID",                  accessor: (r: MentalHealthCheckIn) => r.id },
    { header: "Young Person",        accessor: (r: MentalHealthCheckIn) => getYPName(r.child_id) },
    { header: "Date",                accessor: (r: MentalHealthCheckIn) => r.date },
    { header: "Mood Rating",         accessor: (r: MentalHealthCheckIn) => r.mood_rating },
    { header: "Mood Emoji",          accessor: (r: MentalHealthCheckIn) => r.mood_emoji },
    { header: "What's Heavy",        accessor: (r: MentalHealthCheckIn) => r.whats_heavy },
    { header: "What's Good",         accessor: (r: MentalHealthCheckIn) => r.whats_good },
    { header: "What Would Help",     accessor: (r: MentalHealthCheckIn) => r.what_would_help },
    { header: "Sleep Quality",       accessor: (r: MentalHealthCheckIn) => CHECK_IN_SLEEP_QUALITY_LABEL[r.sleep_quality] },
    { header: "Appetite",            accessor: (r: MentalHealthCheckIn) => CHECK_IN_APPETITE_LABEL[r.appetite] },
    { header: "Energy",              accessor: (r: MentalHealthCheckIn) => CHECK_IN_ENERGY_LABEL[r.energy] },
    { header: "Conversation Length", accessor: (r: MentalHealthCheckIn) => CHECK_IN_CONVERSATION_LENGTH_LABEL[r.conversation_length] },
    { header: "Staff Present",       accessor: (r: MentalHealthCheckIn) => getStaffName(r.staff_present) },
    { header: "Follow-Up Action",    accessor: (r: MentalHealthCheckIn) => r.follow_up_action ?? "" },
    { header: "Flags / Concerns",    accessor: (r: MentalHealthCheckIn) => r.flags_concerns.join("; ") },
    { header: "Weekly Trend Note",   accessor: (r: MentalHealthCheckIn) => r.weekly_trend_note ?? "" },
  ], []);

  if (isLoading) {
    return <PageShell title="Daily Mental Health Check-Ins" subtitle="Loading…"><div /></PageShell>;
  }

  return (
    <PageShell
      title="Daily Mental Health Check-Ins"
      subtitle="Quick child-led mood and wellbeing pulse — a daily moment to ask, listen, and notice patterns"
      caraContext={{ pageTitle: "Daily Mental Health Check-Ins", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Daily Mental Health Check-Ins" />
          <ExportButton data={filtered} columns={exportCols} filename="daily-mental-health-check-ins" />
          <CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-gradient-to-br from-sky-50 to-white p-4 flex items-center gap-3">
            <Heart className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-xs text-muted-foreground">Check-Ins This Week</p>
              <p className="text-lg font-bold">{checkInsThisWeek}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-[var(--cs-cara-gold-bg)] to-white p-4 flex items-center gap-3">
            <Smile className={cn("h-5 w-5", MOOD_CONFIG[Math.round(avgMood) as MoodRating]?.color ?? "text-[var(--cs-cara-gold)]")} />
            <div>
              <p className="text-xs text-muted-foreground">Average Mood</p>
              <p className={cn("text-lg font-bold", MOOD_CONFIG[Math.round(avgMood) as MoodRating]?.color)}>
                {avgMood.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/5</span>
              </p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4 flex items-center gap-3">
            <Cloud className={cn("h-5 w-5", flagsThisWeek > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]")} />
            <div>
              <p className="text-xs text-muted-foreground">Flags This Week</p>
              <p className={cn("text-lg font-bold", flagsThisWeek > 0 && "text-amber-600")}>{flagsThisWeek}</p>
            </div>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-[var(--cs-cara-gold-bg)] to-white p-4 flex items-center gap-3">
            <Sun className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            <div>
              <p className="text-xs text-muted-foreground">Child-Led Conversations</p>
              <p className="text-lg font-bold">{childLedConversations}</p>
            </div>
          </div>
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search what's heavy, what's good, flags…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => (
                <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="yp">Young Person</SelectItem>
                <SelectItem value="mood-high">Mood (High → Low)</SelectItem>
                <SelectItem value="mood-low">Mood (Low → High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No check-ins match your filters.</div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expandedId === rec.id;
            const moodCfg = MOOD_CONFIG[rec.mood_rating];
            return (
              <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-sky-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0",
                      "bg-gradient-to-br from-sky-50 to-[var(--cs-cara-gold-bg)] border"
                    )}>
                      <span aria-hidden>{rec.mood_emoji}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {getYPName(rec.child_id)} — {rec.date}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge className={cn("text-xs", moodCfg.color, "bg-white border")}>
                          {rec.mood_rating}/5 · {moodCfg.label}
                        </Badge>
                        <Badge className={cn("text-xs", SLEEP_COLORS[rec.sleep_quality])}>
                          Sleep: {CHECK_IN_SLEEP_QUALITY_LABEL[rec.sleep_quality]}
                        </Badge>
                        <Badge className={cn("text-xs", APPETITE_COLORS[rec.appetite])}>
                          {CHECK_IN_APPETITE_LABEL[rec.appetite]}
                        </Badge>
                        <Badge className={cn("text-xs", ENERGY_COLORS[rec.energy])}>
                          {CHECK_IN_ENERGY_LABEL[rec.energy]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {rec.flags_concerns.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        {rec.flags_concerns.length} flag{rec.flags_concerns.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-gradient-to-br from-sky-50/40 to-[var(--cs-cara-gold-bg)]/30 p-4 space-y-4">
                    {/* mood scale visual */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs font-medium text-[var(--cs-text-secondary)] mb-2">Mood Scale (1-5)</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const cfg = MOOD_CONFIG[n as MoodRating];
                          const active = n === rec.mood_rating;
                          return (
                            <div key={n} className="flex-1">
                              <div className={cn(
                                "h-2 rounded-full",
                                active ? cfg.bar : "bg-slate-100"
                              )} />
                              <p className={cn(
                                "text-[10px] mt-1 text-center",
                                active ? cfg.color + " font-semibold" : "text-[var(--cs-text-muted)]"
                              )}>
                                {n}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border border-[var(--cs-border)] p-3">
                        <p className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 flex items-center gap-1.5">
                          <Cloud className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                          What&apos;s Heavy Today
                        </p>
                        <p className="text-sm italic text-[var(--cs-navy)]">&ldquo;{rec.whats_heavy}&rdquo;</p>
                      </div>
                      <div className="rounded-lg bg-white border border-[var(--cs-cara-gold-soft)] p-3">
                        <p className="text-xs font-medium text-[var(--cs-cara-gold)] mb-1 flex items-center gap-1.5">
                          <Sun className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
                          What&apos;s Good Today
                        </p>
                        <p className="text-sm italic text-[var(--cs-navy)]">&ldquo;{rec.whats_good}&rdquo;</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-white border border-sky-200 p-3">
                      <p className="text-xs font-medium text-sky-700 mb-1 flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-sky-600" />
                        What Would Help
                      </p>
                      <p className="text-sm text-sky-900">{rec.what_would_help}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Conversation</p>
                        <p className="font-medium">{CHECK_IN_CONVERSATION_LENGTH_LABEL[rec.conversation_length]}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Staff Present</p>
                        <p className="font-medium">{getStaffName(rec.staff_present)}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Sleep</p>
                        <p className="font-medium">{CHECK_IN_SLEEP_QUALITY_LABEL[rec.sleep_quality]}</p>
                      </div>
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground">Energy</p>
                        <p className="font-medium">{CHECK_IN_ENERGY_LABEL[rec.energy]}</p>
                      </div>
                    </div>

                    {rec.follow_up_action && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-1">Follow-Up Action</p>
                        <p className="text-sm text-amber-900">{rec.follow_up_action}</p>
                      </div>
                    )}

                    {rec.flags_concerns.length > 0 && (
                      <div className="rounded-lg bg-white border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-800 mb-2">Flags / Concerns</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.flags_concerns.map((f, i) => (
                            <Badge key={i} className="bg-amber-100 text-amber-800 text-xs">{f}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {rec.weekly_trend_note && (
                      <div className="rounded-lg bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-3">
                        <p className="text-xs font-medium text-[var(--cs-navy)] mb-1 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Weekly Trend Note
                        </p>
                        <p className="text-sm text-[var(--cs-navy)]">{rec.weekly_trend_note}</p>
                      </div>
                    )}

                    <SmartLinkPanel sourceType="mental-health-check-in" sourceId={rec.id} childId={rec.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 text-sm text-sky-900">
          <strong>Anna Freud Centre &mdash; Mentally Healthy Schools framework</strong> &middot;
          {" "}<strong>Quality Standard 8 (Health &amp; Wellbeing)</strong>, The Children&apos;s Homes
          (England) Regulations 2015 &middot; <strong>UNCRC Article 12</strong> (the right of the child
          to be heard) &middot; <strong>Working Together 2023</strong>. Daily check-ins are a brief,
          child-led pulse — distinct from clinical CAMHS appointments and from digital-wellbeing
          monitoring. They surface emerging worries early, evidence ongoing voice-of-the-child
          practice for Ofsted and Reg 44 visitors, and feed weekly trend notes into key work and
          care plan reviews.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Daily Mental Health Check-Ins — emotional wellbeing scores, mood tracking, self-harm risk, anxiety level, sleep quality, daily check-in, therapeutic rapport, CAMHS monitoring, Reg 45 evidence"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
