"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeParentPartnershipEngagementIntelligence } from "@/hooks/use-home-parent-partnership-engagement-intelligence";
import type { ParentPartnershipResult, ParentPartnershipRating } from "@/lib/engines/home-parent-partnership-engagement-intelligence-engine";

const RATING_META: Record<ParentPartnershipRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function ParentPartnershipEngagementIntelligencePage() {
  const { data, isLoading, error } = useHomeParentPartnershipEngagementIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Parent Partnership Engagement" description="Analysing parent partnership and engagement data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Parent Partnership Engagement" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load parent partnership data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.partnership_rating];

  return (
    <PageShell
      title="Parent Partnership Engagement"
      description="Volume and quality of parent contacts, positive engagement rate, children with active contact, social worker information-sharing, positive outcome rates, and relationship diversity — evidencing that the home works as a genuine partner with parents and families rather than as a gatekeeper (CHR 2015 Reg 5, 7; Children Act 1989 s.22; NMS 9)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Users className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Partnership score: {d.partnership_score}/100 · {d.total_contacts} contacts · positive engagement {Math.round(d.positive_engagement_rate)}% · children with contact {Math.round(d.children_with_contact_rate)}% · SW informed {Math.round(d.sw_informed_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.partnership_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.children_with_contact_rate < 70 || d.sw_informed_rate < 90) && (
          <div className="flex flex-col gap-2">
            {d.children_with_contact_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Only {Math.round(d.children_with_contact_rate)}% of children have parent contact recorded — the absence of parent contact is not neutral; it represents a gap in a child's relational world that requires active management, not passive acceptance
              </div>
            )}
            {d.sw_informed_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Social workers informed of only {Math.round(d.sw_informed_rate)}% of parent contacts — the home has a statutory duty to keep social workers informed of significant family contact; incomplete information sharing undermines the multi-agency care network
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total contacts", value: d.total_contacts, color: "text-blue-600" },
            { label: "Contact types", value: d.contact_type_variety, color: "text-foreground" },
            { label: "Relationship types", value: d.relationship_variety, color: "text-foreground" },
            { label: "Positive outcomes", value: `${Math.round(d.positive_outcome_rate)}%`, color: d.positive_outcome_rate >= 70 ? "text-emerald-600" : "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Partnership Quality Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Positive engagement rate" value={d.positive_engagement_rate} warn={70} />
            <RateBar label="Children with parent contact" value={d.children_with_contact_rate} warn={80} />
            <RateBar label="Social worker kept informed" value={d.sw_informed_rate} warn={95} />
            <RateBar label="Positive outcome rate" value={d.positive_outcome_rate} warn={70} />
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
          CHR 2015 Regulation 5 (welfare — the registered person must promote children's relationships with their family and significant others) and Regulation 7 (contact — the registered person must take all reasonable steps to promote and maintain contact between children and their parents and family, unless contrary to the child's welfare). Children Act 1989 section 22(4) — the local authority must, before making any decision about a child they are looking after, give due consideration to the views of the child's parents. NMS Standard 9 (Family and friends — the home actively promotes and facilitates contact between children and their family and friends where this is consistent with the child's care plan and welfare). Research consistently shows that children who maintain positive family connections during residential care have better outcomes post-placement — partnership with families is not simply a compliance requirement but a therapeutic and protective factor. Homes that position themselves as neutral facilitators of family contact rather than active partners in relationship building are missing a significant opportunity to improve children's long-term outcomes.
        </p>
      </div>
    </PageShell>
  );
}
