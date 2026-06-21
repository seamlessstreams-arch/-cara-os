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

const SEVERITY_LABELS: Record<string, string> = {
  no_harm: "No harm",
  low: "Low harm",
  moderate: "Moderate harm",
  severe: "Severe harm",
  critical: "Critical",
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  wrong_dose: "Wrong dose",
  wrong_time: "Wrong time",
  omission: "Omission",
  wrong_drug: "Wrong drug",
  wrong_route: "Wrong route",
  expired_medication: "Expired medication",
  other: "Other",
};

export default function MedicationErrorPreventionPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["medication-error-prevention-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/medication-error-prevention-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="Medication Error Prevention Intelligence" description="Error severity, duty of candour, lessons learned, and open actions">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{d.total_errors} total error{d.total_errors !== 1 ? "s" : ""} · {d.recent_errors_90d} in last 90 days</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "High Severity Errors",     value: d.high_severity,     highlight: d.high_severity > 0           },
              { label: "Open / Action Required",   value: d.open_errors,       highlight: d.open_errors > 0             },
              { label: "Duty of Candour Required", value: d.duty_of_candour_required                                    },
              { label: "DoC Completed",            value: d.duty_of_candour_complete                                    },
              { label: "DoC Completion Rate",      value: d.duty_of_candour_rate_pct != null ? `${d.duty_of_candour_rate_pct}%` : "—", highlight: d.duty_of_candour_rate_pct != null && d.duty_of_candour_rate_pct < 100 },
              { label: "Lessons Learned",          value: d.lessons_learned_documented                                  },
              { label: "Remedial Actions Complete",value: d.remedial_actions_all_complete                               },
            ].map(({ label, value, highlight }) => (
              <Card key={label} className={highlight ? "border-red-200 bg-red-50" : ""}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d.severity_breakdown && Object.keys(d.severity_breakdown).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Severity Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(d.severity_breakdown as Record<string, number>).map(([key, count]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span>{SEVERITY_LABELS[key] ?? key}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {d.type_breakdown && Object.keys(d.type_breakdown).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold">Error Type Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(d.type_breakdown as Record<string, number>).map(([key, count]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span>{ERROR_TYPE_LABELS[key] ?? key}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Regulatory Reference</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{d.regulatory_ref}</p></CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
