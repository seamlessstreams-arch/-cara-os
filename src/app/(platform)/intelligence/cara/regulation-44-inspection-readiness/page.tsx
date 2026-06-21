"use client";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RATING: Record<string, { label: string; cls: string }> = {
  outstanding: { label: "Outstanding", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  good:        { label: "Good",        cls: "text-blue-700 bg-blue-50 border-blue-200" },
  adequate:    { label: "Adequate",    cls: "text-amber-700 bg-amber-50 border-amber-200" },
  inadequate:  { label: "Inadequate",  cls: "text-red-700 bg-red-50 border-red-200" },
};

export default function Regulation44InspectionReadinessPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["regulation-44-inspection-readiness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/regulation-44-inspection-readiness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="Regulation 44 & Inspection Readiness Intelligence" description="Independent visitor reports, recommendations, Ofsted submission, and monthly visit compliance">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              {d.latest_judgement && (
                <p className="text-sm text-muted-foreground mt-1">Latest: &ldquo;{d.latest_judgement}&rdquo;</p>
              )}
              {d.latest_visit_date && (
                <p className="text-sm text-muted-foreground">
                  Last visit: {d.latest_visit_date}
                  {d.days_since_last_visit != null && ` (${d.days_since_last_visit} days ago)`}
                  {d.visit_overdue && <span className="ml-2 text-red-600 font-medium">⚠ OVERDUE</span>}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Reg 44 Reports",         value: d.reg44_reports                                                       },
              { label: "Good or Better",          value: d.good_or_better_judgements                                           },
              { label: "Open Recommendations",    value: d.open_recommendations, highlight: d.open_recommendations > 0        },
              { label: "High Priority Open",      value: d.high_priority_open,   highlight: d.high_priority_open > 0          },
              { label: "Completed Recs",          value: d.completed_recommendations                                           },
              { label: "Total Recommendations",   value: d.total_recommendations                                               },
              { label: "Sent to Ofsted",          value: d.sent_to_ofsted                                                      },
              { label: "Sent to Ofsted Rate",     value: d.sent_to_ofsted_rate_pct != null ? `${d.sent_to_ofsted_rate_pct}%` : "—", highlight: d.sent_to_ofsted_rate_pct != null && d.sent_to_ofsted_rate_pct < 100 },
              { label: "Children Spoken To",      value: d.latest_children_spoken ?? "—"                                      },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className={highlight ? "border-red-200 bg-red-50" : ""}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-slate-100 bg-slate-50">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-slate-700">Compliance reminder</p>
              <p className="text-sm text-slate-600 mt-1">
                Regulation 44 requires an independent person to visit at least once every month (no more than 28 days between visits). Reports must be submitted to Ofsted within 5 working days of each visit. High-priority recommendations must be actioned before the next visit.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Regulatory Reference</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{d.regulatory_ref}</p></CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
