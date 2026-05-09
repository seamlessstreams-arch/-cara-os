"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  GraduationCap,
  CheckCircle,
  Clock,
  BookOpen,
  Star,
  Heart,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HomeworkSession } from "@/types/extended";
import { CHILD_INITIATION_LABEL, WORK_QUALITY_LABEL, CHILD_MOOD_DURING_LABEL } from "@/types/extended";
import { useHomeworkSessions } from "@/hooks/use-homework-sessions";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const moodColour: Record<string, string> = {
  engaged: "bg-green-100 text-green-800",
  frustrated_but_persisted: "bg-amber-100 text-amber-800",
  distracted: "bg-blue-100 text-blue-800",
  overwhelmed: "bg-red-100 text-red-800",
};

const initiationColour: Record<string, string> = {
  self_started: "bg-emerald-100 text-emerald-800",
  reminded: "bg-blue-100 text-blue-800",
  resisted_then_engaged: "bg-amber-100 text-amber-800",
  refused: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<HomeworkSession>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Date", accessor: (r) => r.date },
  { header: "Subject", accessor: (r) => r.subject },
  { header: "Topic", accessor: (r) => r.topic },
  { header: "Duration", accessor: (r) => `${r.duration_minutes}m` },
  { header: "Initiation", accessor: (r) => CHILD_INITIATION_LABEL[r.child_initiation] },
  { header: "Completed", accessor: (r) => r.work_completed ? "Yes" : "No" },
  { header: "Submitted", accessor: (r) => r.homework_submitted_to_school ? "Yes" : "No" },
  { header: "Quality", accessor: (r) => WORK_QUALITY_LABEL[r.quality_of_work] },
];

export default function HomeworkSupportLogPage() {
  const { data: raw, isLoading } = useHomeworkSessions();
  const data = useMemo(() => raw?.data ?? [], [raw]);
  const [filterYP, setFilterYP] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Homework Support Log" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((h) => h.child_id === filterYP);
    if (filterSubject !== "all") items = items.filter((h) => h.subject === filterSubject);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "duration":
          return b.duration_minutes - a.duration_minutes;
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, filterSubject, sortBy]);

  const total = data.length;
  const completed = data.filter((h) => h.work_completed).length;
  const submitted = data.filter((h) => h.homework_submitted_to_school).length;
  const totalMinutes = data.reduce((sum, h) => sum + h.duration_minutes, 0);

  const subjects = Array.from(new Set(data.map((h) => h.subject)));

  return (
    <PageShell
      title="Homework Support Log"
      subtitle="Per-child homework engagement, support strategies, school feedback, and PEP target progress"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="homework-support-log" />
          <PrintButton title="Homework Support Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Sessions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{total > 0 ? Math.round((completed / total) * 100) : 0}%</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{submitted}/{total}</p>
          <p className="text-xs text-muted-foreground">Submitted to School</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{Math.round(totalMinutes / 60)}h</p>
          <p className="text-xs text-muted-foreground">Total Time</p>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <BookOpen className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Homework is more than tasks — it&apos;s building learning habits, focus tolerance, and self-belief.
          We support without taking over. Frustration is okay; refusal is logged and addressed; effort is
          praised over outcome.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Subjects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((h) => {
          const isExpanded = expandedId === h.id;

          return (
            <div key={h.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : h.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GraduationCap className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(h.child_id)} &middot; {h.subject}: {h.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {h.date} &middot; {h.duration_minutes} mins &middot; Supported by {getStaffName(h.supporting_staff)}{h.external_tutor && ` + ${h.external_tutor.split(" (")[0]}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", initiationColour[h.child_initiation])}>
                    {CHILD_INITIATION_LABEL[h.child_initiation]}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", moodColour[h.child_mood_during])}>
                    {CHILD_MOOD_DURING_LABEL[h.child_mood_during]}
                  </span>
                  {h.work_completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Set By School</p>
                    <p className="text-sm">{h.set_by_school}</p>
                  </div>

                  {h.challenges_faced.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Challenges Faced</p>
                      <ul className="space-y-1">
                        {h.challenges_faced.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Strategies Used</p>
                    <ul className="space-y-1">
                      {h.strategies_used.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Star className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Child&apos;s Understanding</p>
                    <p className="text-sm">{h.child_understanding}</p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">
                      <Heart className="h-3 w-3 inline mr-1" />Parental-Like Support
                    </p>
                    <p className="text-sm">{h.parental_like_support}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Feedback to School</p>
                    <p className="text-sm">{h.feedback_to_school}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">PEP Goal Progress</p>
                    <p className="text-sm">{h.pep_goal_progress}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{h.duration_minutes} mins</span>
                    <span>Quality: {WORK_QUALITY_LABEL[h.quality_of_work]}</span>
                    <span>Submitted: {h.homework_submitted_to_school ? "Yes" : "No"}</span>
                    <span>Recorded: {getStaffName(h.recorded_by)}</span>
                  </div>

                  <SmartLinkPanel sourceType="homework-sessions" sourceId={h.id} childId={h.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Homework support records support Quality Standard 8 (education),
          Personal Education Plan (PEP) target tracking, and Virtual School Head oversight. Linked to
          Education Attendance, PEP Tracker, and Annual Outcomes Report.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
