"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHIFT SUMMARY CARD
// Auto-generated summary of everything that happened during a shift.
// Used on the handover page to pre-populate handover notes.
// Saves staff 15-20 minutes per handover by collating all events.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShiftSummary, type ShiftSummaryEvent } from "@/hooks/use-shift-summary";
import { cn, todayStr } from "@/lib/utils";
import {
  ClipboardList, AlertTriangle, Pill, BookOpen, CheckSquare,
  MapPin, Loader2, Copy, CheckCircle2, Users, ChevronDown,
  ChevronUp, Sparkles, Heart,
} from "lucide-react";

// ── Event type config ───────────────────────────────────────────────────────

const EVENT_CONFIG: Record<ShiftSummaryEvent["type"], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  incident:       { icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-100" },
  medication:     { icon: Pill,          color: "text-teal-600",   bgColor: "bg-teal-100" },
  daily_log:      { icon: BookOpen,      color: "text-emerald-600", bgColor: "bg-emerald-100" },
  task:           { icon: CheckSquare,   color: "text-blue-600",   bgColor: "bg-blue-100" },
  missing:        { icon: MapPin,        color: "text-red-600",    bgColor: "bg-red-100" },
  handover_flag:  { icon: AlertTriangle, color: "text-amber-600",  bgColor: "bg-amber-100" },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-400",
  low:      "bg-blue-300",
  info:     "bg-slate-300",
};

// ── Event row ───────────────────────────────────────────────────────────────

function EventRow({ event }: { event: ShiftSummaryEvent }) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config?.icon || BookOpen;

  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5", config?.bgColor)}>
        <Icon className={cn("h-3.5 w-3.5", config?.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-slate-800 truncate">{event.title}</span>
          {event.severity !== "info" && (
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", SEVERITY_DOT[event.severity])} />
          )}
        </div>
        {event.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{event.description}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400 tabular-nums">{event.time}</span>
          {event.child_name && (
            <span className="text-[10px] text-violet-600 flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" /> {event.child_name}
            </span>
          )}
          {event.staff_name && (
            <span className="text-[10px] text-slate-400">{event.staff_name.split(" ")[0]}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function ShiftSummaryCard({
  date,
  shiftType = "day",
  onUseNotes,
}: {
  date?: string;
  shiftType?: string;
  onUseNotes?: (notes: string) => void;
}) {
  const targetDate = date || todayStr();
  const { data, isLoading } = useShiftSummary(targetDate, shiftType);
  const summary = data?.data;
  const [showEvents, setShowEvents] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary?.auto_notes) return;
    navigator.clipboard.writeText(summary.auto_notes).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleUseNotes = () => {
    if (summary?.auto_notes && onUseNotes) {
      onUseNotes(summary.auto_notes);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Shift Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const s = summary.stats;
  const hasIssues = s.incidents_logged > 0 || s.medications_missed > 0 || s.missing_episodes > 0;

  return (
    <Card className={cn(hasIssues && "border-amber-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Auto-Generated Shift Summary
            <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] rounded-full">
              {s.total_events} events
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-[11px] gap-1"
            >
              {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            {onUseNotes && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseNotes}
                className="h-7 text-[11px] gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <ClipboardList className="h-3 w-3" />
                Use in handover
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          <StatPill icon={Users} label="Staff" value={summary.staff_on_shift.length} />
          <StatPill icon={BookOpen} label="Logs" value={s.daily_log_entries} />
          <StatPill icon={Pill} label="Meds" value={s.medications_given} alert={s.medications_missed > 0} />
          <StatPill icon={AlertTriangle} label="Incidents" value={s.incidents_logged} alert={s.incidents_logged > 0} />
          <StatPill icon={CheckSquare} label="Tasks" value={s.tasks_completed} />
          <StatPill icon={MapPin} label="Missing" value={s.missing_episodes} alert={s.missing_episodes > 0} />
        </div>

        {/* Young people mood summary */}
        {summary.young_people.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {summary.young_people.map((yp) => (
              <div
                key={yp.id}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5"
              >
                <span className="text-[11px] font-medium text-slate-700">{yp.name}</span>
                {yp.mood_score !== undefined && (
                  <span className={cn(
                    "text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center",
                    yp.mood_score >= 7 ? "bg-emerald-100 text-emerald-700" :
                    yp.mood_score >= 4 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700",
                  )}>
                    {yp.mood_score}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">{yp.entries_count} entries</span>
              </div>
            ))}
          </div>
        )}

        {/* Auto-generated notes */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Auto-generated notes
          </p>
          <pre className="text-[12px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
            {summary.auto_notes}
          </pre>
        </div>

        {/* Expandable event timeline */}
        <button
          onClick={() => setShowEvents(!showEvents)}
          className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          {showEvents ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showEvents ? "Hide event timeline" : `Show all ${s.total_events} events`}
        </button>

        {showEvents && summary.events.length > 0 && (
          <div className="divide-y divide-slate-100 border-t border-slate-100 mt-1 max-h-[400px] overflow-y-auto">
            {summary.events.map((event, i) => (
              <EventRow key={`${event.type}_${event.time}_${i}`} event={event} />
            ))}
          </div>
        )}

        {showEvents && summary.events.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            No events recorded during this shift period
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stat pill ───────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl p-2 text-center",
      alert ? "bg-red-50" : "bg-slate-50",
    )}>
      <Icon className={cn("h-3 w-3 mx-auto mb-0.5", alert ? "text-red-500" : "text-slate-400")} />
      <div className={cn("text-sm font-bold tabular-nums", alert ? "text-red-600" : "text-slate-700")}>
        {value}
      </div>
      <div className="text-[9px] text-slate-400">{label}</div>
    </div>
  );
}
