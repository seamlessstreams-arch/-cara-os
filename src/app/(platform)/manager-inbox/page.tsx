"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER ACTION INBOX (detail page)
// One prioritised command centre for managers, deputies, team leaders and the RI.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Brain, Loader2, Info, ShieldAlert, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManagerInbox } from "@/hooks/use-manager-inbox";

const PRIORITY_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700", ring: "ring-[var(--cs-risk-soft)]" },
  high: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-[var(--cs-warning-soft)]" },
  medium: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  low: { bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
};
const CAT_LABEL: Record<string, string> = {
  safeguarding: "Safeguarding", approval: "Approval", high_risk: "High risk", missing_info: "Missing info", compliance: "Compliance",
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800",
};

export default function ManagerInboxPage() {
  const { data, isLoading } = useManagerInbox();
  const intel = data?.data;
  const [filter, setFilter] = useState<string>("all");

  const items = useMemo(() => {
    const all = intel?.items ?? [];
    if (filter === "all") return all;
    if (filter === "overdue") return all.filter((i) => i.overdue);
    return all.filter((i) => i.category === filter || i.priority === filter);
  }, [intel, filter]);

  return (
    <PageShell
      title="Manager Action Inbox"
      subtitle="Everything that needs a human decision — approvals, safeguarding, high-risk and compliance — in one prioritised list, built from the event stream"
      icon={<Inbox className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Manager Action Inbox", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" /></div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              This is assembled automatically from events across the home — it never decides or acts on its own. Each item
              shows <strong>why</strong> it's here, the <strong>deadline</strong>, the linked child/staff, the required
              action, an <strong>Cara-suggested response</strong> and the evidence it will contribute to. Approving,
              requesting changes or escalating remain your decision, with a full audit trail. Reg 13 (leadership oversight).
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Actions" value={intel.overview.total} />
            <OverviewStat label="Critical" value={intel.overview.by_priority.critical} tone={intel.overview.by_priority.critical > 0 ? "red" : "green"} />
            <OverviewStat label="Safeguarding" value={intel.overview.safeguarding_alerts} tone={intel.overview.safeguarding_alerts > 0 ? "red" : "green"} />
            <OverviewStat label="Approvals" value={intel.overview.approvals_pending} tone={intel.overview.approvals_pending > 0 ? "amber" : "green"} />
            <OverviewStat label="Overdue" value={intel.overview.overdue} tone={intel.overview.overdue > 0 ? "red" : "green"} />
            <OverviewStat label="High risk" value={intel.overview.by_category.high_risk} tone={intel.overview.by_category.high_risk > 0 ? "amber" : "green"} />
          </div>

          {(intel.insights ?? []).map((i, idx) => (
            <div key={idx} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            {(["all", "critical", "overdue", "safeguarding", "approval", "high_risk", "missing_info"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("rounded-full px-2.5 py-1 text-[11px] border transition-colors capitalize",
                  filter === f ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]")}>
                {f.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {items.length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">Nothing matches this filter — inbox clear.</p>}
            {items.map((it) => {
              const pr = PRIORITY_STYLES[it.priority] ?? PRIORITY_STYLES.low;
              return (
                <Card key={it.id} className={cn("overflow-hidden ring-1", pr.ring)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {it.category === "safeguarding" && <ShieldAlert className="h-4 w-4 text-red-600" />}
                        {it.title}
                      </CardTitle>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className={cn("text-[10px] capitalize", pr.bg, pr.text)}>{it.priority}</Badge>
                        <span className={cn("text-[10px] flex items-center gap-0.5", it.overdue ? "text-red-600 font-medium" : "text-[var(--cs-text-muted)]")}>
                          <Clock className="h-3 w-3" />{it.overdue ? "overdue" : `by ${it.deadline}`}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">
                      {CAT_LABEL[it.category] ?? it.category} · {it.event_type.replace(/_/g, " ")}
                      {it.child_id ? ` · ${it.child_id}` : ""}{it.staff_id ? ` · ${it.staff_id}` : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-[var(--cs-text-secondary)]"><span className="text-[var(--cs-text-muted)]">Why:</span> {it.reason}</p>
                    <p className="text-xs text-[var(--cs-text-secondary)] flex items-start gap-1"><ListChecks className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand" /> {it.required_action}{it.approval_level ? ` (${it.approval_level.replace("_", " ")})` : ""}</p>
                    {it.cara_suggested_response && (
                      <p className="text-[11px] text-purple-700 flex items-start gap-1"><Brain className="h-3.5 w-3.5 shrink-0 mt-0.5" /> Suggested: {it.cara_suggested_response}</p>
                    )}
                    {it.evidence_categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {it.evidence_categories.map((c, i) => <Badge key={i} className="text-[9px] bg-gray-50 text-gray-600 border">{c}</Badge>)}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      {it.available_actions.map((a, i) => (
                        <button key={i} className={cn("text-[10px] rounded-md px-2 py-1 border capitalize", i === 0 ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-bg)]")}>{a.replace(/_/g, " ")}</button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
      <p className={cn("text-2xl font-bold tabular-nums capitalize", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
