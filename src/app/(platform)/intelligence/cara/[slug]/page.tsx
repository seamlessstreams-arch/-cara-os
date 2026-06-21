"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const RATING_META = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
} as const;

function slugToTitle(slug: string): string {
  return slug
    .replace(/-intelligence$/, " Intelligence")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function RateBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round(value));
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 60 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function IntelligenceCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const title = slugToTitle(slug);

  const { data, isLoading, error } = useQuery({
    queryKey: ["home-intelligence", slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/home/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 60_000,
  });

  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title={title} description="Analysing data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Loading…
        </div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title={title} description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">
          Failed to load {title.toLowerCase()} data.
        </div>
      </PageShell>
    );
  }

  const ratingKey = Object.keys(d).find((k) => k.endsWith("_rating"));
  const ratingValue = ratingKey ? (d[ratingKey] as keyof typeof RATING_META) : null;
  const rating = ratingValue && ratingValue in RATING_META ? RATING_META[ratingValue] : null;
  const scoreKey = Object.keys(d).find((k) => k.endsWith("_score"));
  const score = scoreKey ? (d[scoreKey] as number) : null;

  const rateFields = Object.entries(d).filter(
    ([k, v]) =>
      !k.endsWith("_rating") &&
      !k.endsWith("_score") &&
      k !== "headline" &&
      typeof v === "number" &&
      (k.endsWith("_rate") || k.includes("_rate_") || k.endsWith("_pct") || k.endsWith("_percent") || k.includes("compliance") || k.includes("coverage")),
  );

  const countFields = Object.entries(d).filter(
    ([k, v]) =>
      !k.endsWith("_rating") &&
      !k.endsWith("_score") &&
      k !== "headline" &&
      typeof v === "number" &&
      !rateFields.find(([rk]) => rk === k),
  );

  return (
    <PageShell title={title} description={d.headline ?? `${title} performance analysis.`}>
      <div className="space-y-6">
        {rating && (
          <Card className={`border-2 ${rating.border}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}
                >
                  <BarChart3 className={`h-5 w-5 ${rating.color}`} />
                  <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
                </div>
                {d.headline && (
                  <div className="flex-1">
                    <p className="text-sm font-medium">{d.headline}</p>
                  </div>
                )}
                {score !== null && (
                  <div className="text-right">
                    <p className="text-2xl font-bold">{score}</p>
                    <p className="text-xs text-muted-foreground">/100</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {rateFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rateFields.map(([k, v]) => (
                <RateBar key={k} label={formatLabel(k)} value={v as number} />
              ))}
            </CardContent>
          </Card>
        )}

        {countFields.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {countFields.map(([k, v]) => (
              <Card key={k}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-2xl font-bold">
                    {typeof v === "number" ? v.toLocaleString() : String(v)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{formatLabel(k)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
