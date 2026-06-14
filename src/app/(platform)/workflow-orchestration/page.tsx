"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFLOW ORCHESTRATION (detail page)
// The actions auto-generated from events by configurable workflow rules.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, Brain, Loader2, Info, AlertTriangle, Clock, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowOrchestration } from "@/hooks/use-workflow-orchestration";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800", low: "border-blue-200 bg-blue-50 text-blue-800",
};
const TYPE_LABEL: Record<string, string> = {
  create_approval_task: "Approval task", create_task: "Task", create_debrief_task: "Debrief",
  suggest_keywork: "Key-working follow-up", add_evidence: "Evidence", generate_aria_summary: "Cara summary",
  update_trend: "Trend update", create_notification_draft: "Notification draft",
};

export default function WorkflowOrchestrationPage() {
  const { data, isLoading } = useWorkflowOrchestration();
  const intel = data?.data;
  const [filter, setFilter] = useState<string>("all");

  const actions = useMemo(() => {
    const all = intel?.actions ?? [];
    if (filter === "all") return all;
    if (filter === "overdue") return all.filter((a) => a.overdue);
    if (filter === "approval") return all.filter((a) => a.requires_approval);
    if (filter === "notification") return all.filter((a) => a.notification_draft);
    return all.filter((a) => a.type === filter);
  }, [intel, filter]);

  return (
    <PageShell
      title="Workflow Orchestration"
      subtitle="The actions every significant event generates automatically — approvals, debriefs, follow-ups, evidence and gated notification drafts — with escalation"
      icon={<Workflow className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Workflow Orchestration", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              Configurable rules turn each event into the work that should follow it — so consistent process happens
              every time without anyone remembering each step. Notification drafts are prepared automatically but
              <strong> never sent without human approval</strong>, and anything left undone past its deadline escalates.
              Reg 13 (consistent, well-led process), Reg 12, Reg 40.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <OverviewStat label="Rules fired" value={intel.overview.rules_fired} />
            <OverviewStat label="Actions generated" value={intel.overview.actions_generated} tone="neutral" />
            <OverviewStat label="Approvals" value={intel.overview.approvals_required} tone={intel.overview.approvals_required > 0 ? "amber" : "green"} />
            <OverviewStat label="Notification drafts" value={intel.overview.notifications_drafted} tone={intel.overview.notifications_drafted > 0 ? "red" : "green"} />
            <OverviewStat label="Escalating" value={intel.overview.escalations_pending} tone={intel.overview.escalations_pending > 0 ? "red" : "green"} />
          </div>

          {(intel.insights ?? []).map((i, idx) => (
            <div key={`i${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}
          {(intel.alerts ?? []).map((a, idx) => (
            <div key={`a${idx}`} className={cn("rounded-xl border p-3 text-sm leading-relaxed flex items-start gap-2", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{a.message}</div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            {(["all", "overdue", "approval", "notification", "create_debrief_task", "suggest_keywork", "add_evidence"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("rounded-full px-2.5 py-1 text-[11px] border transition-colors",
                  filter === f ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]")}>
                {f === "all" ? "all" : (TYPE_LABEL[f] ?? f).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {actions.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No actions match this filter.</p>}
            {actions.slice(0, 80).map((a) => (
              <div key={a.id} className={cn("rounded-lg border p-3 text-xs", a.overdue ? "ring-1 ring-red-200" : "")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {a.notification_draft && <Send className="h-3 w-3 text-red-500 shrink-0" />}
                    {a.requires_approval && <ShieldCheck className="h-3 w-3 text-amber-500 shrink-0" />}
                    <span className="font-medium truncate">{a.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.overdue && <Clock className="h-3 w-3 text-red-500" />}
                    <Badge className="text-[9px] bg-gray-50 text-gray-600 border">{TYPE_LABEL[a.type] ?? a.type}</Badge>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {a.rule_name} · owner: {a.owner_role.replace("_", " ")}
                  {a.deadline ? ` · by ${a.deadline}${a.overdue ? " (overdue)" : ""}` : ""}
                  {a.escalation ? ` · escalates to ${a.escalation.to_role.replace("_", " ")} after ${a.escalation.after_days}d` : ""}
                </p>
                {a.notification_draft && <p className="text-[10px] text-red-700 mt-0.5">Drafts notification to {a.notification_draft.join(", ")} — awaiting approval, not sent</p>}
                {a.evidence_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {a.evidence_categories.map((c, i) => <Badge key={i} className="text-[9px] bg-green-50 text-green-700 border-green-200">{c}</Badge>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function OverviewStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "red" | "amber" | "green" | "gray" }) {
  const toneCls: Record<string, string> = { neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400" };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
