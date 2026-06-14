"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara Reg 40 Triage Queue (Milestone 15)
//
// Care events that may require an Ofsted notification under Reg 40.
// Cara drafts the suggested category and reasoning. The manager
// decides: notify (with reference), dismiss (with reason) or escalate.
// Notification to Ofsted itself is NEVER auto-sent.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ShieldAlert, RefreshCw, Send, XCircle, ArrowUpRight, FileWarning,
} from "lucide-react";
import {
  useReg40Queue,
  useScanReg40,
  useDecideReg40,
} from "@/hooks/use-cara-reg40-triage";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import { reg40Label } from "@/lib/cara/cara-reg40-triage";
import type { CaraReg40Triage, Reg40TriageStatus } from "@/types/cara-studio";

const HOME_ID = "home_oak";

const STATUS_TONE: Record<Reg40TriageStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  notified: "bg-emerald-100 text-emerald-800",
  dismissed: "bg-slate-100 text-slate-700",
  escalated: "bg-rose-100 text-rose-800",
};

function PendingTriageCard({
  rec,
  actorId,
  actorRole,
}: {
  rec: CaraReg40Triage;
  actorId: string | undefined;
  actorRole: string;
}) {
  const [notifyRef, setNotifyRef] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"notify" | "dismiss" | "escalate" | null>(null);
  const decide = useDecideReg40();

  const submit = () => {
    if (mode === "notify" && !notifyRef.trim()) return;
    if (mode === "dismiss" && !note.trim()) return;
    if (!mode) return;
    decide.mutate(
      {
        triage_id: rec.id,
        action: mode,
        notification_ref: mode === "notify" ? notifyRef.trim() : undefined,
        note: note.trim() || undefined,
        actor_id: actorId,
        actor_role: actorRole,
      },
      {
        onSuccess: () => {
          setMode(null);
          setNotifyRef("");
          setNote("");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{rec.source_title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Source category: {rec.source_category} · event {rec.source_event_date}
            </p>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-800">
            <FileWarning className="mr-1 h-3 w-3" />
            {reg40Label(rec.suggested_category)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-xs text-slate-700">{rec.reasoning}</p>
        {mode === null ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setMode("notify")}>
              <Send className="mr-1 h-3 w-3" />
              Notify Ofsted
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode("dismiss")}>
              <XCircle className="mr-1 h-3 w-3" />
              Dismiss
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMode("escalate")}>
              <ShieldAlert className="mr-1 h-3 w-3" />
              Escalate
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded border bg-slate-50 p-2">
            {mode === "notify" && (
              <input
                value={notifyRef}
                onChange={(e) => setNotifyRef(e.target.value)}
                placeholder="Ofsted notification reference (required)"
                className="w-full rounded border px-2 py-1 text-xs"
              />
            )}
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === "dismiss"
                  ? "Reason for dismissing (required)"
                  : "Optional note"
              }
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={submit}
                disabled={
                  decide.isPending ||
                  (mode === "notify" && !notifyRef.trim()) ||
                  (mode === "dismiss" && !note.trim())
                }
              >
                Confirm {mode}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setMode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DecidedCard({ rec }: { rec: CaraReg40Triage }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{rec.source_title}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {reg40Label(rec.suggested_category)} · decided{" "}
              {rec.decided_at ? new Date(rec.decided_at).toLocaleString() : "—"}
            </p>
          </div>
          <Badge variant="outline" className={STATUS_TONE[rec.status]}>
            {rec.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-xs">
        {rec.notification_ref && (
          <p>
            <span className="font-medium">Ofsted ref:</span> {rec.notification_ref}
          </p>
        )}
        {rec.decision_note && (
          <p className="text-muted-foreground">Note: {rec.decision_note}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reg40TriagePage() {
  const { currentUser } = useAuthContext();
  const caraRole = appRoleToCaraRole(currentUser?.role ?? "registered_manager");
  const pending = useReg40Queue(HOME_ID, "pending");
  const all = useReg40Queue(HOME_ID);
  const scan = useScanReg40();

  const decided = (all.data?.data ?? []).filter((r) => r.status !== "pending");

  return (
    <PageShell
      title="Reg 40 Triage"
      subtitle="Care events that may require an Ofsted notification under Regulation 40. Cara drafts the suggested category — humans decide. Notification is never auto-sent."
      actions={
        <Button
          size="sm"
          onClick={() =>
            scan.mutate({
              home_id: HOME_ID,
              actor_id: currentUser?.id,
              actor_role: caraRole,
            })
          }
          disabled={scan.isPending}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${scan.isPending ? "animate-spin" : ""}`} />
          {scan.isPending ? "Scanning…" : "Scan candidates"}
        </Button>
      }
    >
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            <ShieldAlert className="mr-1 h-4 w-4" />
            Pending ({pending.data?.data.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            <ArrowUpRight className="mr-1 h-4 w-4" />
            History ({decided.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-3 space-y-3">
          {(pending.data?.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No pending Reg 40 triage. Click "Scan candidates" to refresh from
                the latest care events.
              </CardContent>
            </Card>
          ) : (
            pending.data!.data.map((rec) => (
              <PendingTriageCard
                key={rec.id}
                rec={rec}
                actorId={currentUser?.id}
                actorRole={caraRole}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-3">
          {decided.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No decisions yet.
              </CardContent>
            </Card>
          ) : (
            decided.map((r) => <DecidedCard key={r.id} rec={r} />)
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
