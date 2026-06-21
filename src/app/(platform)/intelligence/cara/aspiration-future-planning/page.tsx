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

const DOMAIN_LABELS: Record<string, string> = {
  career: "Career / employment",
  education: "Education / learning",
  relationships: "Relationships",
  health: "Health & wellbeing",
  housing: "Housing",
  travel: "Travel / experiences",
  creative: "Creative / arts",
  sport: "Sport / fitness",
  community: "Community",
  other: "Other",
};

export default function AspirationFuturePlanningPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["aspiration-future-planning-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/aspiration-future-planning-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="Aspiration & Future Planning Intelligence" description="Child-chosen aspirations, domain coverage, next steps, and review currency">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.aspiration_records} records across {d.total_children} children</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Child Chose Own",    value: d.child_chose_own                                             },
              { label: "Child-Chose Rate",   value: d.child_chose_rate_pct != null ? `${d.child_chose_rate_pct}%` : "—" },
              { label: "With Next Steps",    value: d.with_next_steps                                             },
              { label: "Next Steps Rate",    value: d.next_steps_rate_pct != null ? `${d.next_steps_rate_pct}%` : "—"   },
              { label: "Blockers Identified",value: d.blockers_identified                                         },
              { label: "Overdue Reviews",    value: d.overdue_reviews,  highlight: d.overdue_reviews > 0          },
              { label: "No Aspiration Record",value: d.no_aspiration_record, highlight: d.no_aspiration_record > 0 },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className={highlight ? "border-amber-200 bg-amber-50" : ""}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {d.domain_breakdown && Object.keys(d.domain_breakdown).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold">Aspiration Domain Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(d.domain_breakdown as Record<string, number>).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{DOMAIN_LABELS[key] ?? key}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Regulatory Reference</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{d.regulatory_ref}</p></CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
