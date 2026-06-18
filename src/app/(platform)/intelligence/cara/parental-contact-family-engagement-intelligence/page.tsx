"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeParentalContactFamilyEngagementIntelligence } from "@/hooks/use-home-parental-contact-family-engagement-intelligence";
import type { ParentalContactFamilyEngagementResult, FamilyEngagementRating } from "@/lib/engines/home-parental-contact-family-engagement-intelligence-engine";

const RATING_META: Record<FamilyEngagementRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function ParentalContactFamilyEngagementIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeParentalContactFamilyEngagementIntelligence();
  const d = (raw as { data?: ParentalContactFamilyEngagementResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Parental Contact & Family Engagement" description="Analysing parental contact and family engagement data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Parental Contact & Family Engagement" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load parental contact data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.engagement_rating];

  return (
    <PageShell
      title="Parental Contact & Family Engagement"
      description="Scheduled contact compliance, family visit quality, parental engagement, supervised contact adherence, family support coverage, child voice in contact planning, risk assessment, parent invitation rates and boundary adherence — evidencing that contact is managed safely and with the child's wellbeing at its centre (CHR 2015 Reg 7; Children Act 1989 s.34; NMS 9; contact order compliance)."
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
                  Engagement score: {d.engagement_score}/100 · {d.total_scheduled_contacts} scheduled contacts · compliance {Math.round(d.contact_compliance_rate)}% · child voice {Math.round(d.child_voice_in_contact_rate)}% · quality avg {d.contact_quality_avg.toFixed(1)}/5
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.engagement_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.contact_compliance_rate < 80 || d.supervised_boundary_adherence_rate < 100 || d.child_voice_in_contact_rate < 60) && (
          <div className="flex flex-col gap-2">
            {d.contact_compliance_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Contact compliance rate {Math.round(d.contact_compliance_rate)}% — missed or rescheduled contact has a direct impact on children's sense of security and their relationship with their family; non-compliance with contact plans may breach court orders or care plan requirements
              </div>
            )}
            {d.supervised_boundary_adherence_rate < 100 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Supervised contact boundary adherence {Math.round(d.supervised_boundary_adherence_rate)}% — any supervised contact session where boundaries were not maintained represents a potential safeguarding risk and may need to be reviewed with the social worker and IRO
              </div>
            )}
            {d.child_voice_in_contact_rate < 60 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Child voice recorded in {Math.round(d.child_voice_in_contact_rate)}% of contact — children have the right to be heard about their family relationships; contact planning without the child's voice risks perpetuating arrangements that do not serve their welfare
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Scheduled contacts", value: d.total_scheduled_contacts, color: "text-blue-600" },
            { label: "Family visits", value: d.total_family_visits, color: "text-foreground" },
            { label: "Supervised sessions", value: d.total_supervised_sessions, color: "text-foreground" },
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
              <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-muted-foreground" /> Contact Quality & Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Contact compliance rate" value={d.contact_compliance_rate} warn={95} />
              <RateBar label="Visit risk assessment rate" value={d.visit_risk_assessment_rate} warn={100} />
              <RateBar label="Supervised boundary adherence" value={d.supervised_boundary_adherence_rate} warn={100} />
              <RateBar label="Child voice in contact planning" value={d.child_voice_in_contact_rate} warn={80} />
              <div className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground">Average contact quality</span>
                <span className={`text-sm font-bold ${d.contact_quality_avg >= 4 ? "text-emerald-600" : d.contact_quality_avg >= 3 ? "text-amber-600" : "text-red-600"}`}>{d.contact_quality_avg.toFixed(1)}/5</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-muted-foreground" /> Family Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <RateBar label="Family visit quality rate" value={d.family_visit_quality_rate} warn={80} />
              <RateBar label="Parental engagement rate" value={d.parental_engagement_rate} warn={70} />
              <RateBar label="Parent invitation rate" value={d.parent_invitation_rate} warn={90} />
              <RateBar label="Parent views incorporated" value={d.parent_views_incorporation_rate} warn={80} />
              <RateBar label="Family support coverage" value={d.family_support_coverage_rate} warn={70} />
              <RateBar label="Family support attendance" value={d.family_support_attendance_rate} warn={70} />
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
          CHR 2015 Regulation 7 (Contact — the registered person must take all reasonable steps to promote and maintain contact between children and their parents and family members, unless this is contrary to the child's welfare). Children Act 1989 section 34 (Contact orders — a local authority looking after a child must allow the child reasonable contact with parents, guardians, and persons who had parental responsibility). NMS Standard 9 (Family and friends — the home actively facilitates safe, meaningful contact; children's views about contact are always sought and taken seriously; supervised contact is conducted in a child-centred way that supports the child's emotional experience). Supervised contact requires particular skill: the home's role is not simply to watch but to support the child's emotional experience before, during, and after contact, and to feed back observations about contact quality to the multi-agency network. Boundary adherence in supervised contact is a safeguarding responsibility — the home cannot abrogate it to the family.
        </p>
      </div>
    </PageShell>
  );
}
