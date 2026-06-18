"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeMenstruationPubertySupportIntelligence } from "@/hooks/use-home-menstruation-puberty-support-intelligence";
import type { MenstruationPubertyResult, MenstruationPubertyRating } from "@/lib/engines/home-menstruation-puberty-support-intelligence-engine";

const RATING_META: Record<MenstruationPubertyRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function MenstruationPubertySupportIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeMenstruationPubertySupportIntelligence();
  const d = (raw as { data?: MenstruationPubertyResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Menstruation & Puberty Support" description="Analysing puberty support and menstruation care data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Menstruation & Puberty Support" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load menstruation puberty support data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.puberty_rating];

  return (
    <PageShell
      title="Menstruation & Puberty Support"
      description="Puberty education coverage, menstruation support, product availability, dignity care, body confidence and child comfort — evidencing that the home supports every child's physical development with sensitivity, dignity and adequate provision (CHR 2015 Reg 5, 13; PSHE statutory guidance; UNCRC Article 24)."
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
                  Puberty support score: {d.puberty_score}/100 · education {Math.round(d.puberty_education_rate)}% · product availability {Math.round(d.product_availability_rate)}% · dignity care {Math.round(d.dignity_care_rate)}% · child comfort {Math.round(d.child_comfort_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.puberty_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.product_availability_rate < 95 || d.dignity_care_rate < 80 || d.child_comfort_rate < 70) && (
          <div className="flex flex-col gap-2">
            {d.product_availability_rate < 95 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Product availability rate {Math.round(d.product_availability_rate)}% — children must always have immediate access to menstrual products without having to ask; having to request products or go without is undignified and reflects a failure to meet basic individual needs
              </div>
            )}
            {d.dignity_care_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Dignity care rate {Math.round(d.dignity_care_rate)}% — puberty and menstruation are deeply personal; care that does not centre dignity, privacy and the child's own preferences can cause lasting shame and embarrassment
              </div>
            )}
            {d.child_comfort_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Child comfort rate {Math.round(d.child_comfort_rate)}% — children who do not feel comfortable discussing puberty with staff are navigating one of the most significant life events without support; this is a relationship quality issue as much as a provision issue
              </div>
            )}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              Puberty & Menstruation Support Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Puberty education rate" value={d.puberty_education_rate} warn={90} />
            <RateBar label="Menstruation support rate" value={d.menstruation_support_rate} warn={90} />
            <RateBar label="Product availability rate" value={d.product_availability_rate} warn={100} />
            <RateBar label="Dignity care rate" value={d.dignity_care_rate} warn={95} />
            <RateBar label="Body confidence rate" value={d.body_confidence_rate} warn={75} />
            <RateBar label="Child comfort rate" value={d.child_comfort_rate} warn={80} />
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
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Regulation 5 (the registered person must ensure each child's welfare and development is promoted; physical health and bodily autonomy during puberty are integral to this). Regulation 13 (the home must ensure children have access to appropriate personal items — this includes menstrual products as a basic provision, not a special request). PSHE Association statutory guidance (2019 — relationships and sex education, including puberty, is mandatory for all young people in educational settings; children's homes must complement this with appropriate in-home support). UNCRC Article 24 (children have the right to the highest attainable standard of health; puberty support is fundamental health care). Period poverty is a documented risk for young people in care; the home must ensure no child is without products or feels shame about their body's natural development.
        </p>
      </div>
    </PageShell>
  );
}
