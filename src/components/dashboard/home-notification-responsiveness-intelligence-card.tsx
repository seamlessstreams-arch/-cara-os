"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeNotificationResponsivenessIntelligence } from "@/hooks/use-home-notification-responsiveness-intelligence";
import type { NotificationResponsivenessRating } from "@/lib/engines/home-notification-responsiveness-intelligence-engine";

const RATING_STYLES: Record<NotificationResponsivenessRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  adequate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ADEQUATE" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-red-200 bg-red-50 text-red-800", soon: "border-amber-200 bg-amber-50 text-amber-800", planned: "border-blue-200 bg-blue-50 text-blue-800" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800" };

export function HomeNotificationResponsivenessIntelligenceCard() {
  const { data, isLoading } = useHomeNotificationResponsivenessIntelligence();
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  let d = data?.data ?? data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.responsiveness_rating === "inadequate" && (d.responsiveness_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      responsiveness_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }
  const ratingStyle = RATING_STYLES[d.responsiveness_rating as NotificationResponsivenessRating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.responsiveness_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-rose-500 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-rose-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BellRing className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-rose-600")} />
            <span className="text-slate-900 font-bold">Notification Response</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>{ratingStyle.label}</span>
            {d.responsiveness_rating !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.responsiveness_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.responsiveness_rating !== "insufficient_data" && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <div className={cn("text-center rounded-lg p-1.5", d.total_notifications > 0 ? "bg-blue-50" : "bg-slate-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.total_notifications > 0 ? "text-blue-600" : "text-slate-600")}>{d.total_notifications}</p>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.read_rate >= 90 ? "bg-green-50" : d.read_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.read_rate >= 90 ? "text-green-600" : d.read_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.read_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Read</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.urgent_read_rate >= 100 ? "bg-green-50" : d.urgent_read_rate >= 80 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.urgent_read_rate >= 100 ? "text-green-600" : d.urgent_read_rate >= 80 ? "text-amber-600" : "text-red-600")}>{d.urgent_read_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Urgent</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.average_response_hours <= 2 ? "bg-green-50" : d.average_response_hours <= 6 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.average_response_hours <= 2 ? "text-green-600" : d.average_response_hours <= 6 ? "text-amber-600" : "text-red-600")}>{d.average_response_hours}h</p>
              <p className="text-[9px] text-muted-foreground">Avg Resp</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.unread_count === 0 ? "bg-green-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.unread_count === 0 ? "text-green-600" : "text-red-600")}>{d.unread_count}</p>
              <p className="text-[9px] text-muted-foreground">Unread</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.urgent_unread_count === 0 ? "bg-green-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.urgent_unread_count === 0 ? "text-green-600" : "text-red-600")}>{d.urgent_unread_count}</p>
              <p className="text-[9px] text-muted-foreground">Urg Unrd</p>
            </div>
          </div>
        )}
        {d.strengths?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s: string, i: number) => (<div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">{s}</div>))}</div>)}
        {d.concerns?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c: string, i: number) => (<div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec: any) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Notification Intelligence</p>{d.insights.slice(0, 3).map((insight: any, i: number) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
