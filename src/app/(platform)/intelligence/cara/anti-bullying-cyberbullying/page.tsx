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

const BULLYING_TYPE_LABELS: Record<string, string> = {
  verbal: "Verbal",
  physical: "Physical",
  social_exclusion: "Social exclusion",
  online_cyber: "Online / cyber",
  social_media: "Social media",
  racist: "Racist",
  homophobic: "Homophobic / transphobic",
  other: "Other",
};

export default function AntiBullyingCyberbullyingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["anti-bullying-cyberbullying-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/anti-bullying-cyberbullying-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="Anti-Bullying & Cyberbullying Intelligence" description="Incident type breakdown, resolution rate, restorative approach, and pattern indicators">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.bullying_incidents} incident{d.bullying_incidents !== 1 ? "s" : ""} recorded across {d.total_children} children</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Open Incidents",           value: d.open_incidents,          highlight: d.open_incidents > 0 },
              { label: "Resolved Incidents",        value: d.resolved_incidents                                        },
              { label: "Resolution Rate",           value: d.resolution_rate_pct != null ? `${d.resolution_rate_pct}%` : "—" },
              { label: "Cyberbullying",             value: d.cyberbullying_count,     highlight: d.cyberbullying_count > 0 },
              { label: "Restorative Attempted",     value: d.restorative_approach_attempted                             },
              { label: "Restorative Rate",          value: d.restorative_rate_pct != null ? `${d.restorative_rate_pct}%` : "—" },
              { label: "School Notified",           value: d.school_notified                                            },
              { label: "Pattern Indicators",        value: d.pattern_indicators_recorded                                },
              { label: "Child Voice Captured",      value: d.child_voice_captured                                       },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className={highlight ? "border-amber-200 bg-amber-50" : ""}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {d.type_breakdown && Object.keys(d.type_breakdown).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold">Incident Type Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(d.type_breakdown as Record<string, number>).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{BULLYING_TYPE_LABELS[key] ?? key}</span>
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
