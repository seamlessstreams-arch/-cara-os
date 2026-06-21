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

export default function CamhsMentalHealthPathwayPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["camhs-mental-health-pathway-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/camhs-mental-health-pathway-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="CAMHS & Mental Health Pathway Intelligence" description="CAMHS referrals, crisis pathway, engagement strength, and unmet MH need">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.total_children} children · {d.camhs_appointments} CAMHS appointments recorded</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "CAMHS Referrals",             value: d.camhs_referrals                                                     },
              { label: "Active Referrals",            value: d.active_referrals                                                     },
              { label: "Crisis Referrals",            value: d.crisis_referrals,  highlight: d.crisis_referrals > 0                 },
              { label: "Strong Engagement",           value: d.strong_engagement                                                    },
              { label: "Children with Engagement",    value: d.children_with_camhs_engagement                                       },
              { label: "Psychiatric Medications",     value: d.psychiatric_medications                                               },
              { label: "MH Identified in History",    value: d.mh_identified_in_history                                             },
              { label: "MH without CAMHS",            value: d.mh_without_camhs_engagement, highlight: d.mh_without_camhs_engagement > 0 },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className={highlight ? "border-amber-200 bg-amber-50" : ""}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-blue-800">Practice note</p>
              <p className="text-sm text-blue-700 mt-1">
                Children in care are four times more likely to have a mental health problem. CAMHS waiting times are often long — parallel therapeutic support from staff (PACE, DDP-informed key work) should not wait for a referral to be accepted.
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
