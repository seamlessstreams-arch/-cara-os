"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeMobilePhoneScreenTimeIntelligence } from "@/hooks/use-home-mobile-phone-screen-time-intelligence";
import type { MobilePhoneScreenTimeResult, MobilePhoneScreenTimeRating } from "@/lib/engines/home-mobile-phone-screen-time-intelligence-engine";

const RATING_META: Record<MobilePhoneScreenTimeRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function MobilePhoneScreenTimeIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeMobilePhoneScreenTimeIntelligence();
  const d = (raw as { data?: MobilePhoneScreenTimeResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Mobile Phone & Screen Time" description="Analysing mobile phone and screen time management data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Mobile Phone & Screen Time" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load mobile phone screen time data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.screen_time_rating];

  return (
    <PageShell
      title="Mobile Phone & Screen Time"
      description="Screen time management, content monitoring, usage agreements, digital wellbeing, self-regulation support and child satisfaction — evidencing a balanced, rights-respecting approach to technology that promotes online safety without disproportionate restriction (CHR 2015 Reg 5; NMS 7; UNCRC Article 16; Online Safety Act 2023)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Smartphone className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Screen time score: {d.screen_time_score}/100 · {d.total_screen_time_records} records · content monitoring {Math.round(d.content_monitoring_rate)}% · digital wellbeing {Math.round(d.digital_wellbeing_rate)}% · child satisfaction {Math.round(d.child_satisfaction_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.screen_time_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.content_monitoring_rate < 80 || d.usage_agreement_rate < 80 || d.digital_wellbeing_rate < 70) && (
          <div className="flex flex-col gap-2">
            {d.content_monitoring_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Content monitoring rate {Math.round(d.content_monitoring_rate)}% — unmonitored internet access puts vulnerable children at risk of grooming, exploitation, radicalisation and harmful content; monitoring is a safeguarding duty, not a preference
              </div>
            )}
            {d.usage_agreement_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Usage agreement rate {Math.round(d.usage_agreement_rate)}% — children should be involved in setting agreed boundaries around technology use; without a shared agreement, boundaries are arbitrary restrictions rather than jointly owned safeguards
              </div>
            )}
            {d.digital_wellbeing_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Digital wellbeing rate {Math.round(d.digital_wellbeing_rate)}% — screen time directly affects sleep, mood, relationships and self-esteem; a home that is not actively supporting digital wellbeing is missing one of the most significant influences on a modern child's mental health
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Screen time records", value: d.total_screen_time_records, color: "text-blue-600" },
            { label: "Content checks", value: d.total_content_checks, color: d.total_content_checks === 0 ? "text-red-600" : "text-foreground" },
            { label: "Child satisfaction", value: `${Math.round(d.child_satisfaction_rate)}%`, color: d.child_satisfaction_rate < 60 ? "text-amber-600" : "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="h-4 w-4 text-muted-foreground" /> Digital Safety & Wellbeing Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Screen time management rate" value={d.screen_time_management_rate} warn={85} />
            <RateBar label="Content monitoring rate" value={d.content_monitoring_rate} warn={90} />
            <RateBar label="Usage agreement rate" value={d.usage_agreement_rate} warn={90} />
            <RateBar label="Digital wellbeing rate" value={d.digital_wellbeing_rate} warn={80} />
            <RateBar label="Self-regulation support rate" value={d.self_regulation_rate} warn={75} />
            <RateBar label="Child satisfaction rate" value={d.child_satisfaction_rate} warn={70} />
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
          CHR 2015 Regulation 5 (welfare — technology use that puts children at risk of harm online is a welfare failure; the home must have effective systems to manage online safety). NMS Standard 7 (personal care — children have access to technology that is appropriate to their age and needs; technology use is supervised and proportionate, not blanket banned). UNCRC Article 16 (privacy — children have a right to privacy; monitoring must be proportionate and rights-respecting, not surveillance for its own sake). Online Safety Act 2023 (platforms have obligations to protect children from harm; homes must complement platform-level protections with in-home digital literacy and wellbeing work). The key tension in this area is between safeguarding duty and children's right to a normal adolescence — outstanding homes manage this tension thoughtfully, with children involved in the process, rather than defaulting to restriction.
        </p>
      </div>
    </PageShell>
  );
}
