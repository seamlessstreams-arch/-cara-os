"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF RECORDING PRACTICE CARD
// Whose recording is strong and whose needs coaching — record quality rolled up
// by staff member. Powered by the Staff Recording Practice engine (Reg 33/36/13).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersRound, ChevronRight, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffRecordingPractice } from "@/hooks/use-staff-recording-practice";

const BAND_STYLES: Record<string, { bg: string; text: string }> = {
  strong: { bg: "bg-green-100", text: "text-green-700" },
  good: { bg: "bg-blue-100", text: "text-blue-700" },
  needs_improvement: { bg: "bg-amber-100", text: "text-amber-700" },
  poor: { bg: "bg-red-100", text: "text-red-700" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const DIM_HUMAN: Record<string, string> = {
  completeness: "completeness", clarity: "clarity", professionalLanguage: "professional language",
  factuality: "factuality", childCentredness: "child's voice", riskRelevance: "risk relevance",
};

export function StaffRecordingPracticeCard() {
  const { data, isLoading } = useStaffRecordingPractice();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><UsersRound className="h-4 w-4 text-brand" /> Staff Recording Practice</CardTitle>
        </CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const profiles = intel.staff_profiles ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><UsersRound className="h-4 w-4 text-brand" /> Staff Recording Practice</CardTitle>
          <Link href="/staff-recording-practice" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-3 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.home_avg_overall >= 80 ? "bg-green-50" : o.home_avg_overall >= 65 ? "bg-blue-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.home_avg_overall >= 80 ? "text-green-600" : o.home_avg_overall >= 65 ? "text-blue-600" : "text-amber-600")}>{o.home_avg_overall}</p>
            <p className="text-[10px] text-muted-foreground">Team avg</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.staff_analysed}</p>
            <p className="text-[10px] text-muted-foreground">Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.needing_support > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.needing_support > 0 ? "text-amber-600" : "text-green-600")}>{o.needing_support}</p>
            <p className="text-[10px] text-muted-foreground">Need support</p>
          </div>
        </div>

        {profiles.length > 0 && (
          <div className="space-y-1.5">
            {profiles.slice(0, 5).map((p) => {
              const band = BAND_STYLES[p.band] ?? BAND_STYLES.good;
              return (
                <div key={p.staff_id} className="rounded-lg border p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{p.staff_name}</span>
                    <Badge className={cn("text-[10px] shrink-0", band.bg, band.text)}>{p.avg_overall}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {p.records_authored} record{p.records_authored === 1 ? "" : "s"} · weakest: {DIM_HUMAN[p.weakest_dimension] ?? p.weakest_dimension}
                    {p.top_suggestion ? ` · ${p.top_suggestion}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> ARIA Practice Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
