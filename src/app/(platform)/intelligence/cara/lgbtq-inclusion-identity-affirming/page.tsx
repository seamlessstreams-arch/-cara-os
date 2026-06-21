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

export default function LgbtqInclusionIdentityAffirmingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["lgbtq-inclusion-identity-affirming-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/lgbtq-inclusion-identity-affirming-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="LGBTQ+ Inclusion & Identity-Affirming Intelligence" description="Pronoun and preferred name consistency, identity-affirming actions, and child voice">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.total_children} children in placement · {d.lgbtq_records} LGBTQ+ records</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Pronouns Used Consistently", value: d.pronouns_consistent },
              { label: "Pronoun Consistency Rate", value: d.pronouns_consistent_rate_pct != null ? `${d.pronouns_consistent_rate_pct}%` : "—", highlight: d.pronouns_consistent_rate_pct != null && d.pronouns_consistent_rate_pct < 100 },
              { label: "Preferred Name Consistent", value: d.preferred_name_consistent },
              { label: "Name Consistency Rate", value: d.preferred_name_rate_pct != null ? `${d.preferred_name_rate_pct}%` : "—", highlight: d.preferred_name_rate_pct != null && d.preferred_name_rate_pct < 100 },
              { label: "With Affirming Actions", value: d.with_affirming_actions },
              { label: "Challenges Documented", value: d.challenges_documented },
              { label: "External Support Linked", value: d.external_support_linked },
              { label: "Child Voice Captured", value: d.child_voice_captured },
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
                LGBTQ+ children in care face disproportionate rates of rejection and mental health challenges. Consistently using a child&apos;s chosen name and pronouns is a basic act of safety and belonging — not optional. Identity-affirming care is a child protection issue.
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
