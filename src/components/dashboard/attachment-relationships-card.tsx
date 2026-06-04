"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ATTACHMENT & RELATIONSHIPS INTELLIGENCE CARD
// Live data from usePlacementStability() — children profiles, wellbeing.
// CHR 2015 Reg 11. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacementStability } from "@/hooks/use-placement-stability";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function AttachmentRelationshipsCard() {
  const { data, isLoading } = usePlacementStability();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Attachment & Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { children, home_metrics } = intel;
  const improving = children.filter((c) => c.mood_trend === "improving").length;
  const declining = children.filter((c) => c.mood_trend === "declining").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Attachment & Relationships
          </CardTitle>
          <Link href="/placement-plan" className="text-xs text-brand hover:underline flex items-center gap-1">
            Placements <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{children.length}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", improving > 0 ? "bg-green-50" : "bg-blue-50")}>
            <p className={cn("text-lg font-bold tabular-nums", improving > 0 ? "text-green-600" : "text-blue-600")}>{improving}</p>
            <p className="text-[10px] text-muted-foreground">Improving</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", declining === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", declining === 0 ? "text-green-600" : "text-red-600")}>{declining}</p>
            <p className="text-[10px] text-muted-foreground">Declining</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{home_metrics.keywork_frequency_per_child_30d}</p>
            <p className="text-[10px] text-muted-foreground">Keywork/m</p>
          </div>
        </div>

        {/* ── Child attachment profiles ───────────────────────────────── */}

        {children.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Relationship Indicators</p>
            {children.slice(0, 4).map((c) => (
              <div key={c.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{c.child_name}</span>
                <div className="flex items-center gap-1">
                  <Badge className={cn("text-[9px]", c.mood_trend === "improving" ? "bg-green-100 text-green-700" : c.mood_trend === "declining" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}>
                    {c.mood_trend}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">{c.stability_score}%</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Attachment Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
