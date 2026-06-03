"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — UNIFIED EVENT STREAM CARD
// One normalised timeline of everything that happens in the home — incidents,
// logs, missing episodes, medication, restraint, key-working, education,
// supervision — projected into the canonical CornerstoneEvent model.
// "Capture once, surface everywhere."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, ChevronRight, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventStream } from "@/hooks/use-event-stream";

const RISK_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: "bg-gray-100", text: "text-gray-600" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  critical: { bg: "bg-red-100", text: "text-red-700" },
};
const TYPE_LABEL: Record<string, string> = {
  daily_log: "Log", incident: "Incident", safeguarding: "Safeguarding", medication: "Medication",
  missing: "Missing", physical_intervention: "Restraint", keywork: "Key-work", education: "Education",
  health: "Health", staff_absence: "Absence", overtime: "Overtime", supervision: "Supervision",
  maintenance: "Maintenance", qa_check: "QA", reg44: "Reg 44", reg45: "Reg 45",
};

function timeAgo(iso: string): string {
  // Deterministic-ish relative label from the date portion only.
  return (iso ?? "").slice(0, 10);
}

export function EventStreamCard() {
  const { data, isLoading } = useEventStream();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand" />
            Unified Event Stream
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

  const o = intel.overview;
  const events = intel.events ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand" />
            Unified Event Stream
          </CardTitle>
          <Link href="/event-stream" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total}</p>
            <p className="text-[10px] text-muted-foreground">Events</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.pending_approvals > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.pending_approvals > 0 ? "text-amber-600" : "text-green-600")}>{o.pending_approvals}</p>
            <p className="text-[10px] text-muted-foreground">Approvals</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.high_or_critical > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.high_or_critical > 0 ? "text-red-600" : "text-green-600")}>{o.high_or_critical}</p>
            <p className="text-[10px] text-muted-foreground">High+</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.compliance_flags > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.compliance_flags > 0 ? "text-amber-600" : "text-green-600")}>{o.compliance_flags}</p>
            <p className="text-[10px] text-muted-foreground">Flags</p>
          </div>
        </div>

        {/* ── Recent timeline ──────────────────────────────────────────── */}
        {events.length > 0 && (
          <div className="space-y-1.5">
            {events.slice(0, 6).map((e) => {
              const risk = RISK_STYLES[e.riskLevel] ?? RISK_STYLES.low;
              return (
                <div key={e.id} className="rounded-lg border p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge className="text-[9px] bg-[var(--cs-bg)] text-[var(--cs-text-secondary)] border">{TYPE_LABEL[e.eventType] ?? e.eventType}</Badge>
                      <span className="truncate text-[var(--cs-text-secondary)]">{e.summary}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {e.requiresApproval && <ShieldCheck className="h-3 w-3 text-amber-500" />}
                      <Badge className={cn("text-[9px] capitalize", risk.bg, risk.text)}>{e.riskLevel}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{timeAgo(e.occurredAt)}</span>
                    {e.requiresApproval && e.approvalLevel && <span>· needs {e.approvalLevel.replace("_", " ")} sign-off</span>}
                    {(e.ariaAnalysis?.complianceFlags?.length ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-700"><AlertTriangle className="h-2.5 w-2.5" />{e.ariaAnalysis!.complianceFlags[0]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
