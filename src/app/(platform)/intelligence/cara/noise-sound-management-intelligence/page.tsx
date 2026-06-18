"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeNoiseSoundManagementIntelligence } from "@/hooks/use-home-noise-sound-management-intelligence";
import type { NoiseSoundResult, NoiseSoundRating } from "@/lib/engines/home-noise-sound-management-intelligence-engine";

const RATING_META: Record<NoiseSoundRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function NoiseSoundManagementIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeNoiseSoundManagementIntelligence();
  const d = (raw as { data?: NoiseSoundResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Noise & Sound Management" description="Analysing noise and sound management data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Noise & Sound Management" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load noise and sound management data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.noise_rating];

  return (
    <PageShell
      title="Noise & Sound Management"
      description="Noise monitoring, quiet hours compliance, sensory environment management, sound insulation, child comfort and staff awareness — evidencing that the home manages the acoustic environment as part of a sensory-aware, trauma-informed approach to children's living spaces (CHR 2015 Reg 5; NMS 13; sensory processing and trauma research)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Volume2 className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Noise score: {d.noise_score}/100 · quiet hours compliance {Math.round(d.quiet_hours_compliance_rate)}% · sensory environment {Math.round(d.sensory_environment_rate)}% · child comfort {Math.round(d.child_comfort_rate)}% · staff awareness {Math.round(d.staff_awareness_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.noise_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.quiet_hours_compliance_rate < 80 || d.child_comfort_rate < 70 || d.staff_awareness_rate < 75) && (
          <div className="flex flex-col gap-2">
            {d.quiet_hours_compliance_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Quiet hours compliance {Math.round(d.quiet_hours_compliance_rate)}% — many children in care have hypervigilant threat-detection systems from early trauma; a noisy environment during quiet periods keeps their nervous systems in alarm and prevents the downregulation that is essential for sleep and learning
              </div>
            )}
            {d.child_comfort_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Child comfort rate {Math.round(d.child_comfort_rate)}% — if children are not comfortable with the noise levels in their home, this is a quality of life issue affecting their ability to regulate, concentrate and feel safe
              </div>
            )}
            {d.staff_awareness_rate < 75 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Staff awareness rate {Math.round(d.staff_awareness_rate)}% — staff who do not understand sensory sensitivities will not notice when noise is dysregulating a child until the child's behaviour escalates; sensory awareness is foundational to trauma-informed practice
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Monitoring records", value: d.total_monitoring_records },
            { label: "Quiet hours records", value: d.total_quiet_hours_records },
            { label: "Sensory environment records", value: d.total_sensory_environment_records },
            { label: "Insulation records", value: d.total_insulation_records },
            { label: "Comfort records", value: d.total_comfort_records },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Volume2 className="h-4 w-4 text-muted-foreground" /> Noise & Sound Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Noise monitoring rate" value={d.noise_monitoring_rate} warn={85} />
            <RateBar label="Quiet hours compliance rate" value={d.quiet_hours_compliance_rate} warn={95} />
            <RateBar label="Sensory environment rate" value={d.sensory_environment_rate} warn={80} />
            <RateBar label="Sound insulation rate" value={d.sound_insulation_rate} warn={80} />
            <RateBar label="Child comfort rate" value={d.child_comfort_rate} warn={80} />
            <RateBar label="Staff awareness rate" value={d.staff_awareness_rate} warn={90} />
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
          CHR 2015 Regulation 5 (welfare — the physical environment must promote children's wellbeing; acoustic environment is part of the physical environment and directly affects regulation, sleep quality and sense of safety). NMS Standard 13 (children's sleep — a quiet, calm environment at appropriate times is a prerequisite for restorative sleep; persistent noise during quiet periods is a barrier to the sleep quality that trauma-affected children especially need). Sensory processing research (Van der Kolk, 2014; Bessel van der Kolk's The Body Keeps the Score) — children who have experienced trauma often have heightened sensory sensitivities; loud, unpredictable sound can be a potent trigger for the threat-detection system and can rapidly escalate a child's state; trauma-informed environments are designed to be predictably calm and sensory-safe. Many children in residential care have undiagnosed sensory processing differences (including ASD and ADHD) that make acoustic sensitivity an equality as well as a wellbeing consideration.
        </p>
      </div>
    </PageShell>
  );
}
