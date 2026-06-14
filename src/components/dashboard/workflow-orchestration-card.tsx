"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFLOW ORCHESTRATION CARD
// Actions auto-generated from events by configurable workflow rules — tasks,
// approvals, debriefs, evidence, Cara summaries, gated notification drafts — with
// escalation. Powered by the Workflow Orchestration engine (Reg 13).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, ChevronRight, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowOrchestration } from "@/hooks/use-workflow-orchestration";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};
const TYPE_LABEL: Record<string, string> = {
  create_approval_task: "Approval", create_task: "Task", create_debrief_task: "Debrief", suggest_keywork: "Key-work",
  add_evidence: "Evidence", generate_cara_summary: "Cara summary", update_trend: "Trend", create_notification_draft: "Notification draft",
};

export function WorkflowOrchestrationCard() {
  const { data, isLoading } = useWorkflowOrchestration();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4 text-brand" /> Workflow Orchestration</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const insights = intel.insights ?? [];
  const types = Object.entries(o.by_action_type ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Workflow className="h-4 w-4 text-brand" /> Workflow Orchestration</CardTitle>
          <Link href="/workflow-orchestration" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5"><p className="text-lg font-bold tabular-nums">{o.rules_fired}</p><p className="text-[10px] text-muted-foreground">Fired</p></div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5"><p className="text-lg font-bold tabular-nums text-blue-600">{o.actions_generated}</p><p className="text-[10px] text-muted-foreground">Actions</p></div>
          <div className={cn("text-center rounded-lg p-2.5", o.notifications_drafted > 0 ? "bg-red-50" : "bg-gray-50")}><p className={cn("text-lg font-bold tabular-nums", o.notifications_drafted > 0 ? "text-red-600" : "text-gray-500")}>{o.notifications_drafted}</p><p className="text-[10px] text-muted-foreground">Notif drafts</p></div>
          <div className={cn("text-center rounded-lg p-2.5", o.escalations_pending > 0 ? "bg-red-50" : "bg-green-50")}><p className={cn("text-lg font-bold tabular-nums", o.escalations_pending > 0 ? "text-red-600" : "text-green-600")}>{o.escalations_pending}</p><p className="text-[10px] text-muted-foreground">Escalating</p></div>
        </div>

        {types.length > 0 && (
          <div className="space-y-1">
            {types.map(([t, count]) => (
              <div key={t} className="flex items-center gap-2 text-[11px]">
                <span className="w-28 truncate text-[var(--cs-text-secondary)]">{TYPE_LABEL[t] ?? t}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-brand/60" style={{ width: `${Math.min(100, (count / (o.actions_generated || 1)) * 100)}%` }} /></div>
                <span className="w-6 text-right tabular-nums text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Workflow Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
