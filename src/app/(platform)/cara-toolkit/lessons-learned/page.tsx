"use client";

import Link from "next/link";
import { useCaraToolkitLessonsLearned } from "@/hooks/use-cara-toolkit-lessons-learned";
import { formatRate } from "@/lib/metrics/rate";
import type {
  LessonRecord,
  LessonTheme,
  LessonSource,
  ActionStatus,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_BANNER: Record<SignalColour, { bg: string; border: string; text: string; label: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  label: "On track"      },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  label: "Needs attention" },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    label: "Action required" },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-700",  label: "No data"        },
};

const ACTION_STATUS_STYLES: Record<ActionStatus, { bg: string; text: string; label: string }> = {
  not_started: { bg: "bg-slate-100", text: "text-slate-600",  label: "Not started" },
  in_progress: { bg: "bg-blue-100",  text: "text-blue-700",   label: "In progress" },
  completed:   { bg: "bg-green-100", text: "text-green-700",  label: "Completed"   },
  overdue:     { bg: "bg-red-100",   text: "text-red-700",    label: "Overdue"     },
};

const THEME_COLOURS: Record<LessonTheme, string> = {
  safeguarding:         "bg-red-50 border-red-200 text-red-700",
  behaviour_support:    "bg-violet-50 border-violet-200 text-violet-700",
  medication_management:"bg-orange-50 border-orange-200 text-orange-700",
  staffing_oversight:   "bg-blue-50 border-blue-200 text-blue-700",
  communication:        "bg-sky-50 border-sky-200 text-sky-700",
  environment_safety:   "bg-amber-50 border-amber-200 text-amber-700",
  child_rights_voice:   "bg-teal-50 border-teal-200 text-teal-700",
  staff_practice:       "bg-indigo-50 border-indigo-200 text-indigo-700",
  other:                "bg-slate-50 border-slate-200 text-slate-600",
};

const SOURCE_COLOURS: Record<LessonSource, string> = {
  incident:             "bg-red-100 text-red-700",
  physical_intervention:"bg-orange-100 text-orange-700",
  safeguarding:         "bg-red-100 text-red-700",
  medication_error:     "bg-amber-100 text-amber-700",
  reg44_visit:          "bg-indigo-100 text-indigo-700",
  supervision:          "bg-blue-100 text-blue-700",
  debrief:              "bg-teal-100 text-teal-700",
  complaint:            "bg-rose-100 text-rose-700",
  other:                "bg-slate-100 text-slate-600",
};

function StatCard({
  value,
  label,
  highlight,
}: {
  value: number | string;
  label: string;
  highlight?: "red" | "amber" | "green";
}) {
  const colour =
    highlight === "red"   ? "text-red-700"   :
    highlight === "amber" ? "text-amber-700" :
    highlight === "green" ? "text-green-700" :
    "text-slate-800";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <p className={`text-2xl font-bold ${colour}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ThemeBar({
  label,
  count,
  total,
  theme,
}: {
  label: string;
  count: number;
  total: number;
  theme: LessonTheme;
}) {
  const width = total > 0 ? Math.max(4, Math.round((count / total) * 100)) : 4;
  const colour = THEME_COLOURS[theme];
  return (
    <div className="flex items-center gap-3">
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${colour}`}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-2 rounded-full bg-slate-400" style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-5 shrink-0">{count}</span>
    </div>
  );
}

function LessonCard({ lesson }: { lesson: LessonRecord }) {
  const sourceStyle = SOURCE_COLOURS[lesson.source];
  const actionStyle = lesson.actionStatus ? ACTION_STATUS_STYLES[lesson.actionStatus] : null;
  const isOverdue = lesson.actionStatus === "overdue";

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        isOverdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceStyle}`}>
          {lesson.sourceLabel}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${THEME_COLOURS[lesson.theme]}`}>
          {lesson.themeLabel}
        </span>
        <span className="text-xs text-slate-400 ml-auto">{lesson.date}</span>
      </div>

      {/* Summary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
          What happened
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">{lesson.summary}</p>
      </div>

      {/* Lesson */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
          Lesson learned
        </p>
        <p className="text-sm text-slate-800 leading-relaxed">{lesson.lessonLearned}</p>
      </div>

      {/* Action */}
      {lesson.actionRequired && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Action
            </p>
            {actionStyle && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionStyle.bg} ${actionStyle.text}`}>
                {actionStyle.label}
              </span>
            )}
          </div>
          {lesson.actionDescription && (
            <p className={`text-sm leading-relaxed ${isOverdue ? "text-red-800" : "text-slate-700"}`}>
              {lesson.actionDescription}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {lesson.actionOwner && <span>Owner: <span className="font-medium">{lesson.actionOwner}</span></span>}
            {lesson.actionDueDate && <span>Due: <span className="font-medium">{lesson.actionDueDate}</span></span>}
          </div>
        </div>
      )}

      {/* Evidence of change */}
      {lesson.evidenceOfChange && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-0.5">
            Evidence of change
          </p>
          <p className="text-sm text-green-800 leading-relaxed">{lesson.evidenceOfChange}</p>
        </div>
      )}

      {/* Flags */}
      <div className="flex flex-wrap gap-2">
        {lesson.sharedWithTeam && (
          <span className="text-xs text-teal-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            Shared with team
          </span>
        )}
        {lesson.managerReviewed && (
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Manager reviewed
          </span>
        )}
        {lesson.childInitials && (
          <span className="text-xs text-slate-500">Child: {lesson.childInitials}</span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LessonsLearnedPage() {
  const { data, isLoading, error } = useCaraToolkitLessonsLearned();

  if (isLoading) {
    return <div className="p-8 text-slate-500 text-sm">Compiling lessons learned tracker…</div>;
  }
  if (error || !data) {
    return <div className="p-8 text-red-600 text-sm">Unable to load lessons learned data.</div>;
  }

  const signal = SIGNAL_BANNER[data.overallSignal];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Lessons Learned Tracker</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lessons Learned Tracker</h1>
        <p className="text-sm text-slate-600 mt-1">
          Did learning lead to change? Tracks lessons from incidents, Reg 44 visits, and supervision — and whether actions were completed.
        </p>
      </div>

      {/* Overall signal banner */}
      <div className={`rounded-2xl border-2 p-5 ${signal.bg} ${signal.border}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Overall learning signal
            </p>
            <p className={`text-xl font-bold ${signal.text}`}>{signal.label}</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${signal.text}`}>{formatRate(data.actionCompletionRate)}</p>
            <p className="text-xs text-slate-500">
              {data.actionCompletionRate === null ? "no actions to complete" : "action completion rate"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <StatCard value={data.totalLessons}          label="Lessons"            />
        <StatCard value={data.lessonsWithActions}    label="With actions"       />
        <StatCard value={data.completedActions}      label="Completed"          highlight="green" />
        <StatCard value={data.openActions}           label="Open"               highlight="amber" />
        <StatCard value={data.overdueActions}        label="Overdue"            highlight={data.overdueActions > 0 ? "red" : undefined} />
      </div>

      {/* Theme breakdown */}
      {data.themeBreakdown.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Lessons by theme
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
            {data.themeBreakdown.map((t) => (
              <ThemeBar
                key={t.theme}
                theme={t.theme}
                label={t.label}
                count={t.count}
                total={data.totalLessons}
              />
            ))}
          </div>
        </section>
      )}

      {/* Cara insights */}
      {data.insights.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Cara insights
          </h2>
          <div className="flex flex-col gap-3">
            {data.insights.map((insight, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 leading-relaxed"
              >
                <span className="font-semibold text-slate-900 mr-2">Cara:</span>
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Individual lessons */}
      {data.lessons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            All lessons ({data.totalLessons})
          </h2>
          <div className="flex flex-col gap-4">
            {data.lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      )}

      {data.lessons.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No lessons recorded yet. Lessons are derived from incidents with lessons noted, Reg 44 recommendations, and supervision training needs.
        </div>
      )}

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      {/* Professional reminder */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        Lessons and actions presented here are derived from existing records. Managers remain professionally accountable for reviewing learning, completing actions, and demonstrating evidence of change to Ofsted and the Reg 44 visitor.
      </div>
    </div>
  );
}
