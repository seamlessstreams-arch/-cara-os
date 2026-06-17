"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookHeart, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeCulturalIdentityIntelligence } from "@/hooks/use-home-cultural-identity-intelligence";
import type { HomeCulturalIdentityResult, CulturalIdentityRating } from "@/lib/engines/home-cultural-identity-intelligence-engine";

const RATING_META: Record<CulturalIdentityRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function CulturalIdentityIntelligencePage() {
  const { data, isLoading, error } = useHomeCulturalIdentityIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Cultural Identity" description="Analysing cultural identity support data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Cultural Identity" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load cultural identity data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.cultural_identity_rating];
  const ip = d.identity_plans;
  const cv = d.cultural_visits;
  const ro = d.religious_observance;
  const hl = d.heritage_language;
  const dc = d.diversity_calendar;

  return (
    <PageShell
      title="Cultural Identity"
      description="Identity plans, cultural visits, religious observance, heritage language support and diversity calendar — a deep look at how each child's individual cultural identity is understood, recorded and actively supported in daily life (CHR 2015 Reg 9; Equality Act 2010; UNCRC Article 30)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <BookHeart className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Identity score: {d.cultural_identity_score}/100 · {ip.total_plans} identity plans · {cv.total_visits_90d} cultural visits (90d) · diversity calendar {Math.round(dc.completed_rate)}% complete
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.cultural_identity_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identity Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs"><span>Total plans</span><span className="font-medium">{ip.total_plans}</span></div>
              <RateBar label="Child coverage" value={ip.child_coverage} warn={90} />
              <RateBar label="Child contribution rate" value={ip.child_contribution_rate} warn={80} />
              {ip.overdue_reviews > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-700 pt-1">
                  <AlertTriangle className="h-3 w-3" />{ip.overdue_reviews} overdue reviews
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cultural Visits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs"><span>Visits (90d)</span><span className="font-medium">{cv.total_visits_90d}</span></div>
              <RateBar label="Learning outcomes rate" value={cv.learning_outcomes_rate} warn={70} />
              <RateBar label="Repeat interest rate" value={cv.repeat_interest_rate} warn={60} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diversity Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs"><span>Total events</span><span className="font-medium">{dc.total_events}</span></div>
              <RateBar label="Completion rate" value={dc.completed_rate} warn={80} />
              <div className="flex justify-between text-xs text-muted-foreground pt-1"><span>Upcoming</span><span>{dc.upcoming_count}</span></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Religious Observance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs"><span>Total records</span><span className="font-medium">{ro.total_records}</span></div>
              <RateBar label="Child coverage" value={ro.child_coverage} warn={90} />
              <RateBar label="Child-authored rate" value={ro.child_authored_rate} warn={70} />
              {ro.overdue_reviews > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-700 pt-1">
                  <AlertTriangle className="h-3 w-3" />{ro.overdue_reviews} overdue reviews
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Heritage Language</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs"><span>Total records</span><span className="font-medium">{hl.total_records}</span></div>
              <RateBar label="Child coverage" value={hl.child_coverage} warn={90} />
              <RateBar label="Home support rate" value={hl.home_support_rate} warn={80} />
              <RateBar label="Child voice rate" value={hl.child_voice_rate} warn={80} />
              {hl.overdue_reviews > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-700 pt-1">
                  <AlertTriangle className="h-3 w-3" />{hl.overdue_reviews} overdue reviews
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {d.insights.length > 0 && (
          <div className="space-y-2">
            {d.insights.map((ins, i) => {
              const sev = ins.severity as string;
              const cls =
                sev === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                sev === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800";
              return (
                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                  {sev === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   sev === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
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
                const urg = rec.urgency as string;
                const urgencyColor =
                  urg === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  urg === "soon"      ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      {rec.regulatory_ref && <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{urg}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Regulation 9 (Supporting healthy development — culture, religion, identity). Equality Act 2010. UNCRC Article 30. Each child's identity plan must be a live document, not filed and forgotten — updated regularly with the child's active contribution.
        </p>
      </div>
    </PageShell>
  );
}
