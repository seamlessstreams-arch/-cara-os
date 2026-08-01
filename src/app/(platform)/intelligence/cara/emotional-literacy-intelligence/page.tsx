"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { EmotionalLiteracyResult, EmotionalLiteracyRating } from "@/lib/engines/home-emotional-literacy-feelings-expression-intelligence-engine";

function useHomeEmotionalLiteracyFeelingsExpressionIntelligence() {
  return useQuery({
    queryKey: ["home-emotional-literacy-feelings-expression-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-emotional-literacy-feelings-expression-intelligence");
      if (!res.ok) throw new Error("Failed to fetch emotional literacy feelings expression intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

const RATING_META: Record<EmotionalLiteracyRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 75 }: { label: string; value: number | null; warn?: number }) {
  if (value === null) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-medium">—</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden" />
      </div>
    );
  }
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 45 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 45 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EmotionalLiteracyIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeEmotionalLiteracyFeelingsExpressionIntelligence();
  const d = (raw as { data?: EmotionalLiteracyResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Emotional Literacy & Feelings Expression" description="Analysing emotional literacy and feelings expression data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Emotional Literacy & Feelings Expression" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load emotional literacy data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.emotional_literacy_rating];

  return (
    <PageShell
      title="Emotional Literacy & Feelings Expression"
      description="Emotion identification, vocabulary breadth, expression tools, journalling, staff attunement and child progress — building the emotional intelligence children need to understand and communicate their inner world (DDP practice; Theraplay; PACE principles; CHR 2015 Reg 9 — Supporting Healthy Development)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Heart className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Emotional literacy score: {d.emotional_literacy_score}/100 · {d.children_assessed} children assessed · {d.total_journal_entries} journal entries
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.emotional_literacy_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                Core Emotional Literacy Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Emotion identification rate" value={d.emotion_identification_rate} warn={75} />
              <RateBar label="Vocabulary breadth rate" value={d.vocabulary_breadth_rate} warn={70} />
              <RateBar label="Expression tool rate" value={d.expression_tool_rate} warn={75} />
              <RateBar label="Journal engagement rate" value={d.journal_engagement_rate} warn={60} />
              <RateBar label="Staff attunement rate" value={d.staff_attunement_rate} warn={80} />
              <RateBar label="Child progress rate" value={d.child_progress_rate} warn={70} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                Depth & Nuance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Nuanced emotion recognition rate" value={d.nuanced_emotion_rate} warn={65} />
              <RateBar label="Self-recognition rate" value={d.self_recognition_rate} warn={70} />
              <RateBar label="Empathy rate" value={d.empathy_rate} warn={65} />
              <RateBar label="Creative expression rate" value={d.creative_expression_rate} warn={60} />
              <RateBar label="Vocabulary progress rate" value={d.vocabulary_progress_rate} warn={60} />
              <RateBar label="Co-regulation rate" value={d.co_regulation_rate} warn={70} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Assessments", value: d.total_assessments, color: "text-blue-600" },
            { label: "Children assessed", value: d.children_assessed, color: "" },
            { label: "Tools available", value: d.total_tools_available, color: "text-emerald-600" },
            { label: "Journal entries", value: d.total_journal_entries, color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {d.insights.length > 0 && (
          <div className="space-y-2">
            {d.insights.map((ins, i) => {
              const cls =
                ins.severity === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                ins.severity === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800";
              return (
                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                  {ins.severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   ins.severity === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
                  {ins.text}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.strengths.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2"><Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {d.concerns.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.concerns.map((c, i) => (
                    <li key={i} className="text-xs flex gap-2"><AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {d.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {d.recommendations.map((rec) => {
                const urgencyColor =
                  rec.urgency === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  rec.urgency === "soon"      ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      {rec.regulatory_ref && <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Regulation 9 (Supporting healthy development — emotional and social development). DDP (Dyadic Developmental Psychotherapy) — PACE creates emotional safety. Theraplay — connection-before-compliance. Children who cannot name their feelings cannot regulate them; emotional literacy is a prerequisite for therapeutic recovery, not an optional extra.
        </p>
      </div>
    </PageShell>
  );
}
