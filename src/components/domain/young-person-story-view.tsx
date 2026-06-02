// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — YOUNG PERSON STORY VIEW
// THE key component. A child's profile that reads like a STORY, not a
// database. Every section answers a human question: "How is this child?"
// "What's happening?" "What are we doing about it?" "What's improving?"
// Progressive disclosure keeps it calm — summary first, detail on demand.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useMemo } from "react";
import {
  Heart,
  Calendar,
  Shield,
  Target,
  Clock,
  BookOpen,
  Users,
  GraduationCap,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  MessageCircle,
  Smile,
  Sun,
  Moon,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { getStore } from "@/lib/db/store";
import {
  formatRelative,
  formatDate,
  initials,
  todayStr,
} from "@/lib/utils";
import { RiskBadge } from "@/components/ui/risk-badge";
import { CalmStatusBadge } from "@/components/ui/calm-status-badge";
import { ProgressiveDisclosureSection } from "@/components/ui/progressive-disclosure";
import { CalmEmptyState } from "@/components/ui/empty-state-calm";

// ── Types ────────────────────────────────────────────────────────────────────

interface YoungPersonStoryViewProps {
  childId: string;
}

interface ChildStoryData {
  child: ReturnType<typeof getStore>["youngPeople"][0] | undefined;
  age: number;
  placementDuration: string;
  keyWorker: ReturnType<typeof getStore>["staff"][0] | undefined;
  riskLevel: "low" | "medium" | "high" | "critical" | "none";
  riskAssessments: Array<{
    id: string;
    domain: string;
    current_level: string;
    previous_level: string;
    trend: string;
    assessed_date: string;
    review_date: string;
    child_views: string;
  }>;
  dailyLog: ReturnType<typeof getStore>["dailyLog"];
  keyWorkingSessions: Array<{
    id: string;
    date: string;
    type: string;
    duration: number;
    topics: string[];
    child_voice: string;
    mood_before: number;
    mood_after: number;
    staff_id: string;
  }>;
  educationRecords: Array<{
    id: string;
    record_type: string;
    title: string;
    date: string;
    school: string;
    details: string;
    attendance_status: string | null;
  }>;
  incidents: ReturnType<typeof getStore>["incidents"];
  tasks: ReturnType<typeof getStore>["tasks"];
  medications: ReturnType<typeof getStore>["medications"];
}

// ── Hook: useChildStoryData ──────────────────────────────────────────────────

function useChildStoryData(childId: string): ChildStoryData {
  const store = getStore();
  const today = todayStr();

  return useMemo(() => {
    const child = store.youngPeople.find((yp) => yp.id === childId);

    // Age
    const age = child
      ? (() => {
          const birth = new Date(child.date_of_birth);
          const now = new Date();
          let a = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
          return a;
        })()
      : 0;

    // Placement duration
    const placementDuration = child
      ? (() => {
          const start = new Date(child.placement_start);
          const now = new Date();
          const months = Math.floor(
            (now.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000),
          );
          if (months < 1) return "Less than 1 month";
          if (months === 1) return "1 month";
          if (months < 12) return `${months} months`;
          const years = Math.floor(months / 12);
          const rem = months % 12;
          return rem > 0
            ? `${years} year${years > 1 ? "s" : ""}, ${rem} month${rem > 1 ? "s" : ""}`
            : `${years} year${years > 1 ? "s" : ""}`;
        })()
      : "";

    // Key worker
    const keyWorker = child?.key_worker_id
      ? store.staff.find((s) => s.id === child.key_worker_id)
      : undefined;

    // Risk level (from risk flags)
    const riskLevel: ChildStoryData["riskLevel"] = child
      ? (() => {
          const flags = child.risk_flags;
          if (flags.length === 0) return "low";
          const hasHigh = flags.some(
            (f) =>
              f.toLowerCase().includes("exploitation") ||
              f.toLowerCase().includes("self-harm"),
          );
          if (hasHigh) return "high";
          if (flags.length >= 2) return "medium";
          return "low";
        })()
      : "none";

    // Risk assessments
    const riskAssessments = (
      store.riskAssessments as Array<{
        id: string;
        child_id: string;
        domain: string;
        current_level: string;
        previous_level: string;
        trend: string;
        assessed_date: string;
        review_date: string;
        child_views: string;
        status: string;
      }>
    )
      .filter((ra) => ra.child_id === childId && ra.status === "current")
      .map((ra) => ({
        id: ra.id,
        domain: ra.domain,
        current_level: ra.current_level,
        previous_level: ra.previous_level,
        trend: ra.trend,
        assessed_date: ra.assessed_date,
        review_date: ra.review_date,
        child_views: ra.child_views,
      }));

    // Daily log (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const dailyLog = store.dailyLog
      .filter((dl) => dl.child_id === childId && dl.date >= sevenDaysAgo)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

    // Key working sessions (last 5)
    const keyWorkingSessions = (
      store.keyWorkingSessions as Array<{
        id: string;
        child_id: string;
        staff_id: string;
        date: string;
        type: string;
        duration: number;
        topics: string[];
        child_voice: string;
        mood_before: number;
        mood_after: number;
      }>
    )
      .filter((kw) => kw.child_id === childId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // Education
    const educationRecords = (
      store.educationRecords as Array<{
        id: string;
        child_id: string;
        record_type: string;
        title: string;
        date: string;
        school: string;
        details: string;
        attendance_status: string | null;
      }>
    )
      .filter((e) => e.child_id === childId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // Incidents
    const incidents = store.incidents
      .filter((i) => i.child_id === childId)
      .sort((a, b) => b.date.localeCompare(a.date));

    // Tasks
    const tasks = store.tasks
      .filter((t) => t.linked_child_id === childId)
      .sort((a, b) => (b.due_date || "").localeCompare(a.due_date || ""));

    // Medications
    const medications = store.medications.filter(
      (m) => m.child_id === childId && m.is_active,
    );

    return {
      child,
      age,
      placementDuration,
      keyWorker,
      riskLevel,
      riskAssessments,
      dailyLog,
      keyWorkingSessions,
      educationRecords,
      incidents,
      tasks,
      medications,
    };
  }, [store, childId, today]);
}

// ── Trend arrow helper ───────────────────────────────────────────────────────

function TrendArrow({ trend }: { trend: string }) {
  if (trend === "decreasing") {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-medium">
        <ArrowDownRight className="h-3 w-3" /> Decreasing
      </span>
    );
  }
  if (trend === "increasing") {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600 text-[10px] font-medium">
        <ArrowUpRight className="h-3 w-3" /> Increasing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-600 text-[10px] font-medium">
      <Minus className="h-3 w-3" /> Stable
    </span>
  );
}

// ── Risk level to badge level ────────────────────────────────────────────────

function riskToBadgeLevel(
  level: string,
): "low" | "medium" | "high" | "critical" | "none" {
  switch (level) {
    case "very_high":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    default:
      return "none";
  }
}

// ── Entry type icons ─────────────────────────────────────────────────────────

function EntryTypeIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ElementType> = {
    general: Activity,
    behaviour: AlertTriangle,
    health: Stethoscope,
    education: GraduationCap,
    contact: Phone,
    activity: Star,
    mood: Smile,
    sleep: Moon,
    food: Sun,
  };
  const Icon = iconMap[type] || Activity;
  return <Icon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />;
}

// ── Mood indicator ───────────────────────────────────────────────────────────

function MoodDot({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 7
      ? "bg-emerald-400"
      : score >= 4
        ? "bg-amber-400"
        : "bg-red-400";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={`Mood: ${score}/10`}
      aria-label={`Mood score ${score} out of 10`}
    />
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function YoungPersonStoryView({ childId }: YoungPersonStoryViewProps) {
  const data = useChildStoryData(childId);
  const store = getStore();

  const staffById = useMemo(() => {
    const map = new Map<string, (typeof store.staff)[0]>();
    store.staff.forEach((s) => map.set(s.id, s));
    return map;
  }, [store.staff]);

  if (!data.child) {
    return (
      <CalmEmptyState
        icon="Users"
        title="Young person not found"
        description="We could not find a young person with this ID."
      />
    );
  }

  const { child } = data;
  const displayName = child.preferred_name || child.first_name;

  // ── Today's summary data ───────────────────────────────────────────────
  const todayLogs = data.dailyLog.filter((dl) => dl.date === todayStr());
  const latestMood = todayLogs.find((dl) => dl.mood_score !== null)?.mood_score;
  const todayActiveTasks = data.tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      t.due_date === todayStr(),
  );
  const overdueTasks = data.tasks.filter(
    (t) =>
      t.due_date &&
      t.due_date < todayStr() &&
      t.status !== "completed" &&
      t.status !== "cancelled",
  );

  // ── Improving vs needs attention ───────────────────────────────────────
  const improving = data.riskAssessments.filter(
    (ra) => ra.trend === "decreasing",
  );
  const needsAttention = data.riskAssessments.filter(
    (ra) => ra.trend === "increasing" || ra.current_level === "high" || ra.current_level === "very_high",
  );

  // ── Positive daily log entries ─────────────────────────────────────────
  const positiveEntries = data.dailyLog.filter(
    (dl) =>
      dl.is_significant ||
      (dl.mood_score !== null && dl.mood_score >= 7) ||
      dl.entry_type === "activity",
  );

  return (
    <div className="space-y-5 pb-10">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Photo placeholder (circle with initials) */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-2xl font-bold">
            {initials(`${displayName} ${child.last_name}`)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-[var(--cs-navy)]">
                  {displayName} {child.last_name}
                </h1>
                <p className="text-sm text-[var(--cs-text-muted)] mt-0.5">
                  {data.age} years old &middot; In placement{" "}
                  {data.placementDuration}
                </p>
              </div>
              <RiskBadge level={data.riskLevel} size="md" />
            </div>

            {/* Key details */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {data.keyWorker && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                  <UserCheck className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                  <span>
                    Key worker:{" "}
                    <span className="font-medium">
                      {data.keyWorker.full_name}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                <Users className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                <span>
                  Social worker:{" "}
                  <span className="font-medium">
                    {child.social_worker_name}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                <MapPin className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                <span>{child.local_authority}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                <Shield className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                <span>{child.legal_status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT MATTERS TODAY
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sun className="h-4.5 w-4.5 text-amber-600" />
          <h2 className="text-sm font-bold text-amber-900">
            What Matters Today
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Mood */}
          <div className="rounded-xl bg-white/60 p-3 border border-amber-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/60 mb-1">
              Current mood
            </p>
            <div className="flex items-center gap-2">
              <Smile className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-[var(--cs-navy)]">
                {latestMood !== undefined && latestMood !== null
                  ? `${latestMood}/10`
                  : "Not recorded yet"}
              </span>
              {latestMood !== null && latestMood !== undefined && (
                <MoodDot score={latestMood} />
              )}
            </div>
          </div>

          {/* Today's priorities */}
          <div className="rounded-xl bg-white/60 p-3 border border-amber-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/60 mb-1">
              Today&apos;s tasks
            </p>
            <p className="text-sm font-semibold text-[var(--cs-navy)]">
              {todayActiveTasks.length} due today
            </p>
            {todayActiveTasks.length > 0 && (
              <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5 truncate">
                {todayActiveTasks[0].title}
              </p>
            )}
          </div>

          {/* Alerts */}
          <div className="rounded-xl bg-white/60 p-3 border border-amber-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/60 mb-1">
              Alerts
            </p>
            {overdueTasks.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-sm font-semibold text-red-700">
                  {overdueTasks.length} overdue
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-700">
                  All clear
                </span>
              </div>
            )}
          </div>

          {/* Risk flags */}
          <div className="rounded-xl bg-white/60 p-3 border border-amber-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700/60 mb-1">
              Risk flags
            </p>
            {(child.risk_flags?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-1">
                {(child.risk_flags ?? []).slice(0, 2).map((flag) => (
                  <span
                    key={flag}
                    className="inline-block rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-medium"
                  >
                    {flag}
                  </span>
                ))}
                {(child.risk_flags?.length ?? 0) > 2 && (
                  <span className="text-[10px] text-[var(--cs-text-gentle)]">
                    +{(child.risk_flags?.length ?? 0) - 2} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-emerald-700 font-medium">
                None active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CURRENT RISKS
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Current Risks"
        summary={`${data.riskAssessments.length} active assessment${data.riskAssessments.length !== 1 ? "s" : ""} — ${improving.length} improving`}
        icon="Shield"
        defaultOpen
        badge={String(data.riskAssessments.length)}
      >
        {data.riskAssessments.length === 0 ? (
          <p className="text-xs text-[var(--cs-text-muted)] py-2">
            No active risk assessments recorded.
          </p>
        ) : (
          <div className="space-y-3">
            {data.riskAssessments.map((ra) => (
              <div
                key={ra.id}
                className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <RiskBadge
                      level={riskToBadgeLevel(ra.current_level)}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-[var(--cs-navy)] capitalize">
                      {ra.domain.replace(/_/g, " ")}
                    </span>
                  </div>
                  <TrendArrow trend={ra.trend} />
                </div>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--cs-text-muted)]">
                  <span>Last reviewed: {formatDate(ra.assessed_date)}</span>
                  <span>Next: {formatDate(ra.review_date)}</span>
                </div>

                {ra.child_views && (
                  <div className="mt-2 rounded-lg bg-blue-50/50 border border-blue-100 p-2">
                    <p className="text-[10px] font-semibold text-blue-600 mb-0.5">
                      {displayName}&apos;s voice
                    </p>
                    <p className="text-[11px] text-blue-800 italic leading-relaxed">
                      &ldquo;{ra.child_views}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          PLANS & GOALS
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Plans & Goals"
        summary={`${data.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length} active goals`}
        icon="Target"
      >
        {(() => {
          const activeTasks = data.tasks.filter(
            (t) => t.status !== "completed" && t.status !== "cancelled",
          );
          const completedTasks = data.tasks.filter(
            (t) => t.status === "completed",
          );
          const totalForProgress = activeTasks.length + completedTasks.length;

          return (
            <div className="space-y-3">
              {/* Progress overview */}
              {totalForProgress > 0 && (
                <div className="rounded-xl bg-[var(--cs-surface)] p-3 border border-[var(--cs-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[var(--cs-text-secondary)]">
                      Overall progress
                    </span>
                    <span className="text-xs text-[var(--cs-text-muted)]">
                      {completedTasks.length}/{totalForProgress} complete
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--cs-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${Math.round((completedTasks.length / totalForProgress) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {activeTasks.length === 0 ? (
                <p className="text-xs text-[var(--cs-text-muted)] py-2">
                  No active goals at the moment.
                </p>
              ) : (
                activeTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3"
                  >
                    <Target className="h-4 w-4 shrink-0 text-[var(--cs-text-muted)] mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--cs-navy)] truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-[var(--cs-text-muted)] line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {task.due_date && (
                          <span className="text-[10px] text-[var(--cs-text-gentle)]">
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                        <CalmStatusBadge
                          status={
                            task.due_date && task.due_date < todayStr()
                              ? "overdue"
                              : task.status === "in_progress"
                                ? "info"
                                : "draft"
                          }
                          label={task.status.replace(/_/g, " ")}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })()}
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          RECENT STORY (last 7 days timeline)
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Recent Story"
        summary={`${data.dailyLog.length} entries in the last 7 days`}
        icon="BookOpen"
        defaultOpen
        badge={String(data.dailyLog.length)}
      >
        {data.dailyLog.length === 0 ? (
          <p className="text-xs text-[var(--cs-text-muted)] py-2">
            No log entries in the past 7 days.
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.dailyLog.slice(0, 15).map((entry, idx) => {
              const staffMember = staffById.get(entry.staff_id);
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-[var(--cs-surface)] transition-colors"
                >
                  {/* Date & time */}
                  <div className="shrink-0 w-16 text-right">
                    <p className="text-[10px] font-medium text-[var(--cs-text-muted)]">
                      {formatRelative(entry.date)}
                    </p>
                    <p className="text-[10px] text-[var(--cs-text-gentle)]">
                      {entry.time}
                    </p>
                  </div>

                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <EntryTypeIcon type={entry.entry_type} />
                    {idx < data.dailyLog.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--cs-border)] mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[var(--cs-navy)] capitalize">
                        {entry.entry_type}
                      </span>
                      <MoodDot score={entry.mood_score} />
                      {entry.is_significant && (
                        <Star className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed line-clamp-2 mt-0.5">
                      {entry.content}
                    </p>
                    {staffMember && (
                      <p className="text-[10px] text-[var(--cs-text-gentle)] mt-0.5">
                        {staffMember.first_name} {staffMember.last_name}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          DIRECT WORK & KEY WORK
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Direct Work & Key Work"
        summary={`${data.keyWorkingSessions.length} recent sessions`}
        icon="Heart"
        badge={String(data.keyWorkingSessions.length)}
      >
        {data.keyWorkingSessions.length === 0 ? (
          <p className="text-xs text-[var(--cs-text-muted)] py-2">
            No key working sessions recorded recently.
          </p>
        ) : (
          <div className="space-y-3">
            {data.keyWorkingSessions.map((session) => {
              const worker = staffById.get(session.staff_id);
              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--cs-navy)] capitalize">
                        {session.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-[var(--cs-text-gentle)]">
                        {session.duration} min
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--cs-text-muted)]">
                      {formatDate(session.date)}
                    </span>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full bg-[var(--cs-surface-elevated)] border border-[var(--cs-border)] px-2 py-0.5 text-[10px] text-[var(--cs-text-muted)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Child voice */}
                  {session.child_voice && (
                    <div className="mt-2 rounded-lg bg-blue-50/50 border border-blue-100 p-2">
                      <p className="text-[11px] text-blue-800 italic leading-relaxed line-clamp-3">
                        &ldquo;{session.child_voice}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Engagement (mood change) */}
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--cs-text-muted)]">
                    <span>
                      Mood: {session.mood_before} &rarr; {session.mood_after}
                    </span>
                    {session.mood_after > session.mood_before && (
                      <span className="text-emerald-600 font-medium">
                        Positive shift
                      </span>
                    )}
                    {worker && (
                      <span>
                        with {worker.first_name} {worker.last_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          RELATIONSHIPS
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Relationships"
        summary="Family, professional, and peer connections"
        icon="Users"
      >
        <div className="space-y-4">
          {/* Family / LA contacts */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--cs-navy)] mb-2">
              Professional Contacts
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-[var(--cs-surface)] p-2.5 border border-[var(--cs-border)]">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                  <div>
                    <p className="text-xs font-medium text-[var(--cs-navy)]">
                      {child.social_worker_name}
                    </p>
                    <p className="text-[10px] text-[var(--cs-text-muted)]">
                      Social Worker &middot; {child.local_authority}
                    </p>
                  </div>
                </div>
                {child.social_worker_phone && (
                  <span className="text-[10px] text-[var(--cs-text-gentle)]">
                    {child.social_worker_phone}
                  </span>
                )}
              </div>

              {child.iro_name && (
                <div className="flex items-center justify-between rounded-lg bg-[var(--cs-surface)] p-2.5 border border-[var(--cs-border)]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[var(--cs-text-gentle)]" />
                    <div>
                      <p className="text-xs font-medium text-[var(--cs-navy)]">
                        {child.iro_name}
                      </p>
                      <p className="text-[10px] text-[var(--cs-text-muted)]">
                        Independent Reviewing Officer
                      </p>
                    </div>
                  </div>
                  {child.iro_phone && (
                    <span className="text-[10px] text-[var(--cs-text-gentle)]">
                      {child.iro_phone}
                    </span>
                  )}
                </div>
              )}

              {data.keyWorker && (
                <div className="flex items-center justify-between rounded-lg bg-[var(--cs-surface)] p-2.5 border border-[var(--cs-border)]">
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    <div>
                      <p className="text-xs font-medium text-[var(--cs-navy)]">
                        {data.keyWorker.full_name}
                      </p>
                      <p className="text-[10px] text-[var(--cs-text-muted)]">
                        Key Worker
                      </p>
                    </div>
                  </div>
                  {data.keyWorker.phone && (
                    <span className="text-[10px] text-[var(--cs-text-gentle)]">
                      {data.keyWorker.phone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Peer relationships note */}
          <div className="rounded-lg bg-[var(--cs-surface)] p-3 border border-[var(--cs-border)]">
            <h4 className="text-xs font-semibold text-[var(--cs-navy)] mb-1">
              Peer Relationships
            </h4>
            <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">
              Peer dynamics are tracked through daily logs, key work sessions,
              and incident records. Check the Recent Story section for the
              latest interactions.
            </p>
          </div>
        </div>
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          EDUCATION
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Education"
        summary={`${child.school_name || "No school recorded"} — ${data.educationRecords.length} recent records`}
        icon="GraduationCap"
        badge={String(data.educationRecords.length)}
      >
        <div className="space-y-3">
          {/* School info */}
          <div className="rounded-xl bg-[var(--cs-surface)] p-3 border border-[var(--cs-border)]">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-0.5">
                  School
                </p>
                <p className="font-medium text-[var(--cs-navy)]">
                  {child.school_name || "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-0.5">
                  Contact
                </p>
                <p className="text-[var(--cs-text-secondary)]">
                  {child.school_contact || "Not recorded"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent education records */}
          {data.educationRecords.length === 0 ? (
            <p className="text-xs text-[var(--cs-text-muted)] py-2">
              No recent education records.
            </p>
          ) : (
            data.educationRecords.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[var(--cs-navy)]">
                    {rec.title}
                  </span>
                  <span className="text-[10px] text-[var(--cs-text-gentle)]">
                    {formatDate(rec.date)}
                  </span>
                </div>
                {rec.attendance_status && (
                  <CalmStatusBadge
                    status={
                      rec.attendance_status === "present"
                        ? "complete"
                        : rec.attendance_status === "excluded"
                          ? "urgent"
                          : rec.attendance_status === "late"
                            ? "due"
                            : "info"
                    }
                    label={rec.attendance_status}
                    size="sm"
                    className="mt-1"
                  />
                )}
                <p className="text-[11px] text-[var(--cs-text-muted)] mt-1.5 leading-relaxed line-clamp-2">
                  {rec.details}
                </p>
              </div>
            ))
          )}
        </div>
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          HEALTH
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="Health"
        summary={`GP: ${child.gp_name || "Not recorded"} — ${data.medications.length} active medication${data.medications.length !== 1 ? "s" : ""}`}
        icon="Stethoscope"
      >
        <div className="space-y-3">
          {/* GP & Dentist */}
          <div className="rounded-xl bg-[var(--cs-surface)] p-3 border border-[var(--cs-border)]">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-0.5">
                  GP
                </p>
                <p className="font-medium text-[var(--cs-navy)]">
                  {child.gp_name || "Not recorded"}
                </p>
                {child.gp_phone && (
                  <p className="text-[var(--cs-text-muted)]">{child.gp_phone}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-0.5">
                  Allergies
                </p>
                {child.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {(child.allergies ?? []).map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--cs-text-muted)]">None recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Dietary requirements */}
          {child.dietary_requirements && (
            <div className="rounded-xl bg-[var(--cs-surface)] p-3 border border-[var(--cs-border)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-0.5">
                Dietary requirements
              </p>
              <p className="text-xs font-medium text-[var(--cs-navy)]">
                {child.dietary_requirements}
              </p>
            </div>
          )}

          {/* Medications */}
          {data.medications.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--cs-navy)] mb-2">
                Active Medications
              </h4>
              {data.medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3 mb-2"
                >
                  <Stethoscope className="h-4 w-4 shrink-0 text-[var(--cs-text-gentle)]" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--cs-navy)]">
                      {med.name}
                    </p>
                    <p className="text-[10px] text-[var(--cs-text-muted)]">
                      {med.dosage} &middot; {med.frequency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT'S IMPROVING (green cards)
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="What's Improving"
        summary={
          improving.length > 0
            ? `${improving.length} area${improving.length !== 1 ? "s" : ""} showing positive trends`
            : "Tracking progress across all domains"
        }
        icon="TrendingUp"
        defaultOpen={improving.length > 0}
      >
        {improving.length === 0 && positiveEntries.length === 0 ? (
          <p className="text-xs text-[var(--cs-text-muted)] py-2">
            No specific positive trends captured yet. Keep recording
            observations and these will populate automatically.
          </p>
        ) : (
          <div className="space-y-2">
            {improving.map((ra) => (
              <div
                key={ra.id}
                className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800 capitalize">
                    {ra.domain.replace(/_/g, " ")}
                  </span>
                  <TrendArrow trend={ra.trend} />
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-1">
                  Moved from{" "}
                  <span className="font-medium">
                    {ra.previous_level.replace(/_/g, " ")}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {ra.current_level.replace(/_/g, " ")}
                  </span>
                </p>
              </div>
            ))}

            {positiveEntries.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[11px] text-emerald-800 leading-relaxed line-clamp-2">
                    {entry.content}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-600/60 mt-1">
                  {formatRelative(entry.date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          WHAT NEEDS ATTENTION (amber/red cards)
          ═══════════════════════════════════════════════════════════════════ */}
      <ProgressiveDisclosureSection
        title="What Needs Attention"
        summary={
          needsAttention.length > 0
            ? `${needsAttention.length} area${needsAttention.length !== 1 ? "s" : ""} requiring focus`
            : "Nothing flagged right now"
        }
        icon="AlertTriangle"
        defaultOpen={needsAttention.length > 0}
        badge={
          needsAttention.length > 0
            ? String(needsAttention.length)
            : undefined
        }
      >
        {needsAttention.length === 0 && overdueTasks.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-emerald-700 font-medium">
              No areas of concern flagged right now. Keep up the great work.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {needsAttention.map((ra) => (
              <div
                key={ra.id}
                className="rounded-xl border border-red-200 bg-red-50/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800 capitalize">
                    {ra.domain.replace(/_/g, " ")}
                  </span>
                  <RiskBadge
                    level={riskToBadgeLevel(ra.current_level)}
                    size="sm"
                  />
                </div>
                <p className="text-[11px] text-red-700/80 mt-1">
                  Currently{" "}
                  <span className="font-medium">
                    {ra.current_level.replace(/_/g, " ")}
                  </span>{" "}
                  risk. Next review: {formatDate(ra.review_date)}
                </p>
              </div>
            ))}

            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-amber-200 bg-amber-50/40 p-3"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-800">
                    {task.title}
                  </span>
                  <CalmStatusBadge status="overdue" size="sm" />
                </div>
                <p className="text-[10px] text-amber-700/70 mt-0.5">
                  Due: {formatDate(task.due_date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </ProgressiveDisclosureSection>

      {/* ═══════════════════════════════════════════════════════════════════
          IMPACT SUMMARY
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-gradient-to-br from-[var(--cs-surface-elevated)] to-blue-50/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4.5 w-4.5 text-[var(--cs-navy)]" />
          <h2 className="text-sm font-bold text-[var(--cs-navy)]">
            Impact Summary
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Risk trend */}
          <div className="rounded-xl bg-white/60 p-3 border border-[var(--cs-border)] text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-1">
              Risk Trajectory
            </p>
            {improving.length > needsAttention.length ? (
              <div className="flex items-center justify-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">
                  Improving
                </span>
              </div>
            ) : needsAttention.length > improving.length ? (
              <div className="flex items-center justify-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-red-700">
                  Needs Focus
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5">
                <Minus className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">
                  Stable
                </span>
              </div>
            )}
          </div>

          {/* Engagement */}
          <div className="rounded-xl bg-white/60 p-3 border border-[var(--cs-border)] text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-1">
              Engagement
            </p>
            <p className="text-sm font-bold text-[var(--cs-navy)]">
              {data.keyWorkingSessions.length} sessions
            </p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">
              last 30 days
            </p>
          </div>

          {/* Days in placement */}
          <div className="rounded-xl bg-white/60 p-3 border border-[var(--cs-border)] text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-gentle)] mb-1">
              Placement Stability
            </p>
            <p className="text-sm font-bold text-[var(--cs-navy)]">
              {data.placementDuration}
            </p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">
              since {formatDate(child.placement_start)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
