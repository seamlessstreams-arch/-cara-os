"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD DAILY SUMMARIES
// Auto-generated daily summaries per child from Care Event routing
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Smile,
  Star,
} from "lucide-react";
import { useChildDailySummaries, type ChildDailySummaryEnriched } from "@/hooks/use-daily-summaries";
import { CARE_EVENT_CATEGORY_LABEL } from "@/types/care-events";
import { formatDate } from "@/lib/utils";

// ── Mood indicator ────────────────────────────────────────────────────────────

function MoodDot({ score }: { score: number | null }) {
  if (score === null) return null;
  const colour =
    score >= 7 ? "bg-green-400" : score >= 4 ? "bg-amber-400" : "bg-red-400";
  return (
    <span
      title={`Mood: ${score}/10`}
      className={`inline-block h-2.5 w-2.5 rounded-full ${colour}`}
    />
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ summary }: { summary: ChildDailySummaryEnriched }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-slate-900 text-sm">
                {summary.child?.name ?? summary.child_id}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(summary.summary_date)}
              </span>
              <MoodDot score={summary.avg_mood_score} />
              {summary.avg_mood_score !== null && (
                <span className="text-xs text-slate-400">Mood {summary.avg_mood_score}/10</span>
              )}
              {summary.requires_followup && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Follow-up required
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
              <span>{summary.event_count} events</span>
              {summary.significant_count > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="h-3 w-3" /> {summary.significant_count} significant
                </span>
              )}
            </div>

            {/* Category pills */}
            {summary.categories.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {summary.categories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {CARE_EVENT_CATEGORY_LABEL[cat] ?? cat}
                  </Badge>
                ))}
              </div>
            )}

            {summary.summary_text && (
              <p className="text-sm text-slate-600 leading-relaxed">{summary.summary_text}</p>
            )}
          </div>

          {summary.care_events.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {summary.care_events.length} events
            </Button>
          )}
        </div>

        {/* Expanded care events list */}
        {expanded && summary.care_events.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
            {summary.care_events.map((ce) => (
              <div key={ce.id} className="flex items-center gap-2 text-xs text-slate-600">
                <MoodDot score={ce.mood_score} />
                {ce.is_significant && <Star className="h-3 w-3 text-amber-500" />}
                <span className="font-medium">{ce.title}</span>
                <Badge variant="outline" className="text-xs py-0">
                  {CARE_EVENT_CATEGORY_LABEL[ce.category as keyof typeof CARE_EVENT_CATEGORY_LABEL] ?? ce.category}
                </Badge>
                {ce.event_time && <span className="text-slate-400">{ce.event_time}</span>}
                <Badge
                  variant="outline"
                  className={`text-xs py-0 ${ce.status === "verified" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-600"}`}
                >
                  {ce.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChildDailySummariesPage() {
  const [selectedChild, setSelectedChild] = useState<string | undefined>(undefined);

  const { data, isLoading } = useChildDailySummaries({
    child_id: selectedChild,
  });

  const summaries = data?.summaries ?? [];
  const meta = data?.meta;

  // Unique children for filter
  const childOptions = [
    ...new Map(
      summaries.map((s) => [s.child_id, s.child?.name ?? s.child_id])
    ).entries(),
  ];

  return (
    <PageShell
      title="Child Daily Summaries"
      subtitle="Auto-generated per-child daily summaries from Care Event routing"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-2xl font-bold text-slate-900">{meta?.total ?? 0}</div>
                <div className="text-xs text-slate-500">Summaries</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{meta?.children_count ?? 0}</div>
                <div className="text-xs text-slate-500">Children</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-amber-700">{meta?.significant_events ?? 0}</div>
                <div className="text-xs text-slate-500">Significant Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-700">{meta?.require_followup ?? 0}</div>
                <div className="text-xs text-slate-500">Need Follow-up</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Child filter */}
      {childOptions.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-4">
          <button
            onClick={() => setSelectedChild(undefined)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              !selectedChild ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Children
          </button>
          {childOptions.map(([id, name]) => (
            <button
              key={id}
              onClick={() => setSelectedChild(id)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                selectedChild === id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Summaries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Smile className="h-5 w-5 animate-pulse mr-2" /> Loading summaries...
        </div>
      ) : summaries.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center text-slate-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No daily summaries yet.</p>
            <p className="text-xs mt-1">Summaries are generated automatically when Care Events are submitted.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <SummaryCard key={s.id} summary={s} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
