"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA Oversight Queue (Milestone 14)
//
// Live unified queue of every item across the system that needs an
// authorised human's attention right now: pending suggested records
// (weighted by safeguarding sensitivity), amendment reviews, recent
// returned items.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Clock, ShieldAlert, CheckCircle2, ArrowUpRight,
  Inbox, History, RefreshCw,
} from "lucide-react";
import {
  useManagementOversight,
  useAcknowledgeAmendment,
} from "@/hooks/use-management-oversight";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToAriaRole } from "@/lib/aria/aria-permissions";
import type { ManagerOversightItem } from "@/types/aria-studio";

const HOME_ID = "home_oak";

const SEVERITY_TONE: Record<ManagerOversightItem["severity"], string> = {
  high: "bg-rose-100 text-rose-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

const KIND_LABEL: Record<ManagerOversightItem["kind"], string> = {
  pending_suggestion: "Pending suggestion",
  amendment_review: "Amendment review",
  returned_record: "Returned record",
};

const KIND_ICON: Record<ManagerOversightItem["kind"], ReactNode> = {
  pending_suggestion: <Inbox className="h-4 w-4" />,
  amendment_review: <History className="h-4 w-4" />,
  returned_record: <RefreshCw className="h-4 w-4" />,
};

export default function OversightQueuePage() {
  const { currentUser } = useAuthContext();
  const ariaRole = appRoleToAriaRole(currentUser?.role ?? "registered_manager");
  const { data, isLoading, refetch, isFetching } = useManagementOversight(HOME_ID);
  const acknowledge = useAcknowledgeAmendment();

  const queue = data?.data;

  return (
    <PageShell
      title="Oversight Queue"
      subtitle="Live queue of every item that needs an authorised human's attention. Refreshes every 30 seconds."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard label="Total" value={queue?.total ?? 0} icon={<AlertTriangle className="h-4 w-4" />} tone="bg-slate-50" />
        <SummaryCard label="High" value={queue?.high ?? 0} icon={<ShieldAlert className="h-4 w-4 text-rose-700" />} tone="bg-rose-50" />
        <SummaryCard label="Medium" value={queue?.medium ?? 0} icon={<Clock className="h-4 w-4 text-amber-700" />} tone="bg-amber-50" />
        <SummaryCard label="Low" value={queue?.low ?? 0} icon={<CheckCircle2 className="h-4 w-4 text-slate-600" />} tone="bg-slate-50" />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading oversight queue…
            </CardContent>
          </Card>
        ) : !queue || queue.items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nothing waiting on a manager. Inbox zero.
            </CardContent>
          </Card>
        ) : (
          queue.items.map((it) => (
            <Card key={it.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-1">{KIND_ICON[it.kind]}</div>
                    <div>
                      <CardTitle className="text-sm">{it.title}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {KIND_LABEL[it.kind]} · {it.source_label} · {it.age_hours}h ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {it.is_safeguarding_sensitive && (
                      <Badge variant="outline" className="bg-rose-50 text-rose-800">
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        safeguarding
                      </Badge>
                    )}
                    <Badge variant="outline" className={SEVERITY_TONE[it.severity]}>
                      {it.severity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-slate-700">{it.summary}</p>
                <div className="mt-2 flex gap-2">
                  <Link href={it.link_href} className="inline-block">
                    <Button size="sm" variant="outline">
                      Open
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                  {it.kind === "amendment_review" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        acknowledge.mutate({
                          record_id: it.source_id,
                          actor_id: currentUser?.id,
                          actor_role: ariaRole,
                        })
                      }
                      disabled={acknowledge.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {acknowledge.isPending ? "Acknowledging…" : "Acknowledge review"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <Card className={tone}>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
