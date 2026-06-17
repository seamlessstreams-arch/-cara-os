"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeFurnitureRoomPersonalisationIntelligence } from "@/hooks/use-home-furniture-room-personalisation-intelligence";
import type { FurnitureRoomResult, FurnitureRoomRating } from "@/lib/engines/home-furniture-room-personalisation-intelligence-engine";

const RATING_META: Record<FurnitureRoomRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 80 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 50 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FurnitureRoomPersonalisationIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeFurnitureRoomPersonalisationIntelligence();
  const d = (raw as { data?: FurnitureRoomResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Furniture & Room Personalisation" description="Analysing furniture and room personalisation data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Furniture & Room Personalisation" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load furniture and room personalisation data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.room_rating];

  return (
    <PageShell
      title="Furniture & Room Personalisation"
      description="Furniture adequacy, personalisation, child choice, comfort, dignity and satisfaction — ensuring every child has a bedroom that is genuinely their own space, reflecting their identity and meeting their needs (CHR 2015 Reg 13; NMS 3; UN CRC Article 16)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Home className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Room score: {d.room_score}/100 · furniture adequacy {Math.round(d.furniture_adequacy_rate)}% · personalisation {Math.round(d.personalisation_rate)}% · child choice {Math.round(d.child_choice_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.room_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.furniture_adequacy_rate < 80 || d.dignity_rate < 90 || d.personalisation_rate < 60) && (
          <div className="flex flex-col gap-2">
            {d.furniture_adequacy_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Furniture adequacy rate {Math.round(d.furniture_adequacy_rate)}% — children are entitled to adequate, well-maintained furniture (CHR 2015 Reg 13)
              </div>
            )}
            {d.dignity_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Dignity rate {Math.round(d.dignity_rate)}% — every child's space must preserve their dignity and privacy without exception
              </div>
            )}
            {d.personalisation_rate < 60 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Personalisation rate only {Math.round(d.personalisation_rate)}% — a bedroom that reflects a child's identity is fundamental to their sense of belonging
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Furniture assessments", value: d.total_furniture_assessments, color: "text-blue-600" },
            { label: "Personalisation assessments", value: d.total_personalisation_assessments, color: "" },
            { label: "Choice records", value: d.total_choice_records, color: "" },
            { label: "Comfort assessments", value: d.total_comfort_assessments, color: "" },
            { label: "Dignity assessments", value: d.total_dignity_assessments, color: "" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                Room Quality Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Furniture adequacy rate" value={d.furniture_adequacy_rate} warn={90} />
              <RateBar label="Personalisation rate" value={d.personalisation_rate} warn={80} />
              <RateBar label="Child choice rate" value={d.child_choice_rate} warn={75} />
              <RateBar label="Comfort rate" value={d.comfort_rate} warn={85} />
              <RateBar label="Dignity rate" value={d.dignity_rate} warn={95} />
              <RateBar label="Child satisfaction rate" value={d.child_satisfaction_rate} warn={75} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quality Averages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <p className={`text-2xl font-bold ${d.furniture_condition_avg >= 7 ? "text-emerald-600" : d.furniture_condition_avg >= 5 ? "text-amber-600" : "text-red-600"}`}>{d.furniture_condition_avg.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Furniture condition avg /10</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <p className={`text-2xl font-bold ${d.comfort_rating_avg >= 7 ? "text-emerald-600" : d.comfort_rating_avg >= 5 ? "text-amber-600" : "text-red-600"}`}>{d.comfort_rating_avg.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Comfort rating avg /10</p>
                </div>
              </div>
              <RateBar label="Personalisation budget utilisation" value={d.personalisation_budget_utilisation_rate} warn={70} />
              <RateBar label="Choice fulfilment rate" value={d.choice_fulfilment_rate} warn={80} />
            </CardContent>
          </Card>
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
          CHR 2015 Regulation 13 (Children's bedroom — must be adequate, personalised and meet the child's needs). NMS 3 (Quality of Care — physical environment). UN CRC Article 16 (right to privacy — a bedroom is a child's private space). A child who has no say in how their room looks, or who sleeps in a room that feels institutional, receives a clear message about their status in the home. Personalisation is not decoration — it is belonging.
        </p>
      </div>
    </PageShell>
  );
}
