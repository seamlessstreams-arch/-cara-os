"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeFoodStorageRefrigerationSafetyIntelligence } from "@/hooks/use-home-food-storage-refrigeration-safety-intelligence";
import type { FoodStorageRefrigerationSafetyResult, FoodStorageRating } from "@/lib/engines/home-food-storage-refrigeration-safety-intelligence-engine";

const RATING_META: Record<FoodStorageRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 90 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 60 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FoodStorageRefrigerationSafetyIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeFoodStorageRefrigerationSafetyIntelligence();
  const d = (raw as { data?: FoodStorageRefrigerationSafetyResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Food Storage & Refrigeration Safety" description="Analysing food storage and refrigeration safety data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Food Storage & Refrigeration Safety" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load food storage and refrigeration safety data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.food_storage_rating];

  return (
    <PageShell
      title="Food Storage & Refrigeration Safety"
      description="Temperature logging, storage compliance, date checking, hygiene ratings, cross-contamination controls and staff training — preventing food safety incidents through rigorous cold chain and storage governance (HACCP; Food Safety Act 1990; Food Standards Agency guidance)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Thermometer className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Food storage score: {d.food_storage_score}/100 · temp logging {Math.round(d.temperature_logging_rate)}% · storage compliance {Math.round(d.storage_compliance_rate)}% · cross-contamination {Math.round(d.cross_contamination_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.food_storage_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.temperature_logging_rate < 90 || d.storage_compliance_rate < 90 || d.cross_contamination_rate < 90) && (
          <div className="flex flex-col gap-2">
            {d.temperature_logging_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Temperature logging rate {Math.round(d.temperature_logging_rate)}% — cold chain monitoring gaps are a food safety risk
              </div>
            )}
            {d.storage_compliance_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Storage compliance rate {Math.round(d.storage_compliance_rate)}% — incorrect storage increases contamination and spoilage risk
              </div>
            )}
            {d.cross_contamination_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Cross-contamination control rate {Math.round(d.cross_contamination_rate)}% — allergen and microbiological risks must be actively managed
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Temperature logs", value: d.total_temperature_logs, color: "text-blue-600" },
            { label: "Storage checks", value: d.total_storage_checks, color: "" },
            { label: "Date checks", value: d.total_date_checks, color: "" },
            { label: "Hygiene assessments", value: d.total_hygiene_assessments, color: "" },
            { label: "X-contamination checks", value: d.total_cross_contamination_checks, color: "" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-muted-foreground" />
              Food Storage Compliance Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Temperature logging rate" value={d.temperature_logging_rate} warn={100} />
            <RateBar label="Storage compliance rate" value={d.storage_compliance_rate} warn={100} />
            <RateBar label="Date checking rate" value={d.date_checking_rate} warn={100} />
            <RateBar label="Hygiene rating rate" value={d.hygiene_rating_rate} warn={90} />
            <RateBar label="Cross-contamination control rate" value={d.cross_contamination_rate} warn={100} />
            <RateBar label="Staff training rate" value={d.staff_training_rate} warn={90} />
          </CardContent>
        </Card>

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
          HACCP (Hazard Analysis and Critical Control Points). Food Safety Act 1990. Food Standards Agency temperature guidance (0–5°C for refrigeration; -18°C or below for frozen). Cross-contamination controls are especially critical in homes caring for children with allergies or special dietary needs — one failure can be life-threatening.
        </p>
      </div>
    </PageShell>
  );
}
