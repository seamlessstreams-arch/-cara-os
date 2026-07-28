"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVENT CAPTURE (write-path) CARD
// "Capture once, validate once, route everywhere" — the pre-submission preview:
// validation, duplicate check, routing and evidence for a draft event. Powered by
// the Event Capture orchestrator.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilePlus2, ChevronRight, Loader2, Brain, CheckCircle2, XCircle, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { EventCaptureResult } from "@/lib/event-capture/event-capture-engine";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── useEventCapture (inlined from deleted src/hooks/use-event-capture.ts) ────
// Also used, byte-identical, in app/(platform)/event-capture/page.tsx.

interface EventCaptureResponse {
  data: EventCaptureResult;
}

function useEventCapture() {
  return useQuery({
    queryKey: ["event-capture"],
    queryFn: () => api.get<EventCaptureResponse>("/event-capture"),
    refetchInterval: 60_000,
  });
}

export function EventCaptureCard() {
  const { data, isLoading } = useEventCapture();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FilePlus2 className="h-4 w-4 text-brand" /> Event Capture (write path)</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><FilePlus2 className="h-4 w-4 text-brand" /> Event Capture (write path)</CardTitle>
          <Link href="/event-capture" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[11px] text-[var(--cs-text-muted)]">Preview of a draft submission — validated, de-duplicated and routed before saving.</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={cn("rounded-lg border p-2.5 flex items-center gap-2", intel.validation.passed ? "text-green-700" : "text-red-700")}>
            {intel.validation.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <span>{intel.validation.passed ? "Validation passed" : `${intel.validation.issues.length} validation issue(s)`}</span>
          </div>
          <div className={cn("rounded-lg border p-2.5 flex items-center gap-2", intel.duplicates.suspected ? "text-amber-700" : "text-green-700")}>
            <Copy className="h-4 w-4" />
            <span>{intel.duplicates.suspected ? `${intel.duplicates.matches.length} possible duplicate(s)` : "No duplicates"}</span>
          </div>
        </div>

        <div className="rounded-lg border p-2.5 text-[11px] space-y-1">
          <p className="text-[var(--cs-text-muted)]">Will route to <span className="font-medium text-[var(--cs-text-secondary)]">{intel.routing.destinations.length}</span> surface(s){intel.routing.external_apis.length > 0 ? `, ${intel.routing.external_apis.length} external (gated)` : ""}; builds <span className="font-medium text-[var(--cs-text-secondary)]">{intel.evidence_categories.length}</span> evidence categor{intel.evidence_categories.length === 1 ? "y" : "ies"}.</p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Badge className={cn("text-[10px]", intel.ready_to_submit ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-warning-bg] text-[--cs-warning]")}>
              {intel.ready_to_submit ? "Ready to submit" : "Held — review needed"}
            </Badge>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Capture Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
