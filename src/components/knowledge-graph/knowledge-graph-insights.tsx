"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Knowledge Graph insights (Layer 5 at the point of work).
// Compact, home-level cross-child patterns (shared locations, shared risks,
// shared professionals…). Renders only when there are patterns to show, so it
// doesn't clutter a surface when there's nothing cross-cutting.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeGraph } from "@/hooks/use-knowledge-graph";
import type { InsightSeverity } from "@/lib/knowledge-graph/types";

const SEVERITY: Record<InsightSeverity, { label: string; cls: string }> = {
  priority: { label: "Priority", cls: "bg-red-50 text-red-700 border-red-200" },
  watch: { label: "Watch", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  info: { label: "Info", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

export function KnowledgeGraphInsights({ max = 4, title = "Wider home patterns" }: { max?: number; title?: string }) {
  const { data, isLoading } = useKnowledgeGraph();
  const insights = data?.data.graph.insights ?? [];

  // Stay quiet until we actually have cross-cutting patterns to surface.
  if (isLoading || insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          {title}
        </CardTitle>
        <CardDescription>Cross-child patterns across the home — worth a contextual-safeguarding lens.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-[var(--cs-border-subtle)]">
          {insights.slice(0, max).map((ins, i) => {
            const s = SEVERITY[ins.severity];
            return (
              <div key={i} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--cs-navy)]">{ins.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--cs-text)]">{ins.detail}</p>
                </div>
                <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium", s.cls)}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
