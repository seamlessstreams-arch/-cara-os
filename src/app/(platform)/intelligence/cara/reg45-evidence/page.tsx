"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara REG 45 LIVE EVIDENCE BANK
// Themed evidence chips drafted from verified records and approved Cara
// outputs. Managers decide what becomes part of the official Reg 45 report.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { ClipboardCheck, RefreshCw, CheckCircle2, XCircle, Clock, FilePlus2 } from "lucide-react";
import {
  useReg45Evidence,
  useRunReg45EvidenceBuild,
  useUpdateReg45EvidenceItem,
} from "@/hooks/use-cara-reg45-evidence";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import {
  CARA_REG45_THEME_LABELS,
  type CaraReg45EvidenceItem,
  type CaraReg45Theme,
} from "@/types/cara-studio";

const HOME_ID = "home_oak";

const SEVERITY_TONE: Record<CaraReg45EvidenceItem["severity"], string> = {
  critical: "bg-rose-50 text-rose-800 border-rose-300",
  high: "bg-orange-50 text-orange-800 border-orange-300",
  medium: "bg-amber-50 text-amber-800 border-amber-300",
  low: "bg-slate-50 text-slate-700 border-slate-300",
  positive: "bg-emerald-50 text-emerald-800 border-emerald-300",
};

const STATUS_TONE: Record<CaraReg45EvidenceItem["status"], string> = {
  ai_draft: "bg-slate-100 text-slate-700",
  accepted: "bg-emerald-100 text-emerald-800",
  deferred: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  included_in_report: "bg-indigo-100 text-indigo-800",
};

function EvidenceCard({
  item,
  onAction,
}: {
  item: CaraReg45EvidenceItem;
  onAction: (id: string, status: CaraReg45EvidenceItem["status"]) => void;
}) {
  const decided = item.status !== "ai_draft";
  return (
    <Card className={`border ${SEVERITY_TONE[item.severity]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm">{item.title}</CardTitle>
            <CardDescription className="text-xs">
              {item.occurred_at} · {item.source_table.replace(/_/g, " ")}
              {item.child_id ? ` · child ${item.child_id}` : ""}
            </CardDescription>
          </div>
          <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[item.status]}`}>
            {item.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">{item.summary}</div>

        {item.status !== "rejected" && item.status !== "included_in_report" && (
          <div className="flex flex-wrap gap-1.5">
            {!decided && (
              <Button size="sm" onClick={() => onAction(item.id, "accepted")}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Accept
              </Button>
            )}
            {item.status === "accepted" && (
              <Button
                size="sm"
                onClick={() => onAction(item.id, "included_in_report")}
              >
                <FilePlus2 className="mr-1 h-3 w-3" /> Include in report
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(item.id, "deferred")}
            >
              <Clock className="mr-1 h-3 w-3" /> Defer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(item.id, "rejected")}
            >
              <XCircle className="mr-1 h-3 w-3" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reg45EvidencePage() {
  const { currentUser } = useAuthContext();
  const caraRole = appRoleToCaraRole(currentUser?.role ?? "registered_manager");

  const query = useReg45Evidence(HOME_ID);
  const run = useRunReg45EvidenceBuild();
  const update = useUpdateReg45EvidenceItem();

  const snapshot = query.data?.data;

  const handleRun = () => {
    run.mutate({
      home_id: HOME_ID,
      actor_id: currentUser?.id,
      actor_role: caraRole,
    });
  };

  const handleAction = (id: string, status: CaraReg45EvidenceItem["status"]) => {
    update.mutate({
      id,
      status,
      actor_id: currentUser?.id,
      actor_role: caraRole,
    });
  };

  return (
    <PageShell
      title="Regulation 45 — Live Evidence Bank"
      subtitle="Continuously updated themed evidence drawn from verified records and approved Cara outputs. Cara suggests — managers decide what enters the official Reg 45 report."
      actions={
        <Button onClick={handleRun} disabled={run.isPending}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${run.isPending ? "animate-spin" : ""}`}
          />
          {run.isPending ? "Running…" : "Refresh evidence"}
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Period snapshot
            </CardTitle>
            <CardDescription>
              {snapshot
                ? `${snapshot.period_start} → ${snapshot.period_end} · ${snapshot.summary.total} item(s)`
                : "Loading…"}
            </CardDescription>
          </CardHeader>
          {snapshot && (
            <CardContent className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
              <div className="rounded border bg-slate-50 p-2 text-slate-700">
                <div className="font-medium">AI draft</div>
                <div className="text-lg">{snapshot.summary.ai_draft}</div>
              </div>
              <div className="rounded border bg-emerald-50 p-2 text-emerald-800">
                <div className="font-medium">Accepted</div>
                <div className="text-lg">{snapshot.summary.accepted}</div>
              </div>
              <div className="rounded border bg-amber-50 p-2 text-amber-800">
                <div className="font-medium">Deferred</div>
                <div className="text-lg">{snapshot.summary.deferred}</div>
              </div>
              <div className="rounded border bg-rose-50 p-2 text-rose-800">
                <div className="font-medium">Rejected</div>
                <div className="text-lg">{snapshot.summary.rejected}</div>
              </div>
              <div className="rounded border bg-indigo-50 p-2 text-indigo-800">
                <div className="font-medium">In report</div>
                <div className="text-lg">{snapshot.summary.included_in_report}</div>
              </div>
              <div className="rounded border bg-orange-50 p-2 text-orange-800">
                <div className="font-medium">Concerns</div>
                <div className="text-lg">{snapshot.summary.concerns}</div>
              </div>
            </CardContent>
          )}
        </Card>

        {snapshot &&
          (Object.keys(CARA_REG45_THEME_LABELS) as CaraReg45Theme[]).map((theme) => {
            const items = snapshot.themes[theme];
            if (!items || items.length === 0) return null;
            return (
              <section key={theme}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    {CARA_REG45_THEME_LABELS[theme]}
                  </h2>
                  <Badge variant="outline" className="text-[10px]">
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {items.map((item) => (
                    <EvidenceCard
                      key={item.id}
                      item={item}
                      onAction={handleAction}
                    />
                  ))}
                </div>
              </section>
            );
          })}

        {snapshot && snapshot.summary.total === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No evidence yet for this review period. Click "Refresh evidence"
              to draft from current verified records.
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
