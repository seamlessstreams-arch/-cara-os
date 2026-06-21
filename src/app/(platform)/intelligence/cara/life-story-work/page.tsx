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

const ENTRY_TYPE_LABELS: Record<string, string> = {
  memory: "Memory",
  milestone: "Milestone",
  heritage: "Heritage",
  identity: "Identity",
  wish: "Wish / Dream",
  achievement: "Achievement",
  photo_story: "Photo story",
  creative: "Creative work",
};

export default function LifeStoryWorkPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["life-story-work-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home/life-story-work-intelligence");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;
  const rating = d ? (RATING[d.overall_status] ?? RATING.good) : null;

  return (
    <PageShell title="Life Story Work Intelligence" description="Entry completion, child voice, life story book links, and type coverage">
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {error && <p className="text-red-600 text-sm">Failed to load data.</p>}
      {d && (
        <div className="space-y-6">
          <Card className={`border ${rating!.cls}`}>
            <CardHeader><CardTitle className="text-base">Overall Assessment</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${rating!.cls.split(" ")[0]}`}>{rating!.label}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {d.life_story_entries} entries · {d.children_with_life_story} of {d.total_children} children engaged
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Completed Entries",       value: d.completed_entries                                           },
              { label: "In Progress",             value: d.in_progress_entries                                         },
              { label: "Completion Rate",         value: d.completion_rate_pct != null ? `${d.completion_rate_pct}%` : "—" },
              { label: "Linked to Life Story Book",value: d.linked_to_book                                             },
              { label: "Child Voice Captured",    value: d.with_child_voice                                            },
              { label: "Child Voice Rate",        value: d.child_voice_rate_pct != null ? `${d.child_voice_rate_pct}%` : "—" },
              { label: "No Life Story Work",      value: d.no_life_story_work, highlight: d.no_life_story_work > 0     },
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
              <CardHeader><CardTitle className="text-sm font-semibold">Entry Type Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(d.type_breakdown as Record<string, number>).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{ENTRY_TYPE_LABELS[key] ?? key}</span>
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
