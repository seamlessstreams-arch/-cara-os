"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER ACTION INBOX CARD
// One prioritised command centre — approvals, safeguarding, high-risk, missing
// info — composed from the canonical event stream. Powered by the Manager Inbox
// engine (Reg 13 — leadership oversight).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, ChevronRight, Loader2, Brain, ShieldAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { ManagerInboxResult } from "@/lib/manager-inbox/manager-inbox-engine";

// ── Data hook (inlined from the former use-manager-inbox hook) ───────────────
interface ManagerInboxResponse {
  data: ManagerInboxResult;
}

function useManagerInbox() {
  return useQuery({
    queryKey: ["manager-inbox"],
    queryFn: () => api.get<ManagerInboxResponse>("/manager-inbox"),
    refetchInterval: 60_000,
  });
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};
const CAT_LABEL: Record<string, string> = {
  safeguarding: "Safeguarding", approval: "Approval", high_risk: "High risk", missing_info: "Missing info", compliance: "Compliance",
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function ManagerInboxCard() {
  const { data, isLoading } = useManagerInbox();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4 text-brand" /> Manager Action Inbox</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const items = intel.items ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Inbox className="h-4 w-4 text-brand" /> Manager Action Inbox</CardTitle>
          <Link href="/manager-inbox" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5"><p className="text-lg font-bold tabular-nums">{o.total}</p><p className="text-[10px] text-muted-foreground">Actions</p></div>
          <div className={cn("text-center rounded-lg p-2.5", o.by_priority.critical > 0 ? "bg-red-50" : "bg-green-50")}><p className={cn("text-lg font-bold tabular-nums", o.by_priority.critical > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{o.by_priority.critical}</p><p className="text-[10px] text-muted-foreground">Critical</p></div>
          <div className={cn("text-center rounded-lg p-2.5", o.approvals_pending > 0 ? "bg-amber-50" : "bg-gray-50")}><p className={cn("text-lg font-bold tabular-nums", o.approvals_pending > 0 ? "text-[--cs-warning]" : "text-gray-500")}>{o.approvals_pending}</p><p className="text-[10px] text-muted-foreground">Approvals</p></div>
          <div className={cn("text-center rounded-lg p-2.5", o.overdue > 0 ? "bg-red-50" : "bg-green-50")}><p className={cn("text-lg font-bold tabular-nums", o.overdue > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{o.overdue}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
        </div>

        {items.length > 0 && (
          <div className="space-y-1.5">
            {items.slice(0, 5).map((it) => {
              const pr = PRIORITY_STYLES[it.priority] ?? PRIORITY_STYLES.low;
              return (
                <div key={it.id} className="rounded-lg border p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {it.category === "safeguarding" && <ShieldAlert className="h-3 w-3 text-red-600 shrink-0" />}
                      <span className="font-medium truncate">{it.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {it.overdue && <Clock className="h-3 w-3 text-red-500" />}
                      <Badge className={cn("text-[9px]", pr.bg, pr.text)}>{it.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{CAT_LABEL[it.category] ?? it.category} · {it.reason}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {it.available_actions.slice(0, 3).map((a, i) => (
                      <span key={i} className={cn("text-[9px] rounded px-1.5 py-0.5 border", i === 0 ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "text-[var(--cs-text-secondary)] border-[var(--cs-border)]")}>{a.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Inbox Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
