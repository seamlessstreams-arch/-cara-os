"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA SUGGESTED RECORDS (Commit Queue)
// ARIA proposes records. The manager edits, rejects or commits each one
// to the official record. Until commit, suggestions have no statutory
// weight. Committed records are immutable.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Inbox, CheckCircle2, XCircle, FileSignature, Save, Sparkles,
} from "lucide-react";
import {
  useSuggestedRecords,
  useCommittedRecords,
  useEditSuggestedRecord,
  useRejectSuggestedRecord,
  useCommitSuggestedRecord,
  useProposeSuggestedRecord,
} from "@/hooks/use-aria-suggested-records";
import { useBridgeCareEvents } from "@/hooks/use-aria-care-event-bridge";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToAriaRole } from "@/lib/aria/aria-permissions";
import {
  ARIA_SUGGESTED_RECORD_LABELS,
  type AriaSuggestedRecord,
} from "@/types/aria-studio";

const HOME_ID = "home_oak";

const STATUS_TONE: Record<AriaSuggestedRecord["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  committed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  superseded: "bg-slate-100 text-slate-700",
};

function PendingCard({
  rec,
  actorId,
  actorRole,
}: {
  rec: AriaSuggestedRecord;
  actorId: string | undefined;
  actorRole: string;
}) {
  const edit = useEditSuggestedRecord();
  const reject = useRejectSuggestedRecord();
  const commit = useCommitSuggestedRecord();
  const [title, setTitle] = useState(rec.suggested_title);
  const [body, setBody] = useState(rec.suggested_body);
  const [note, setNote] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">{rec.target_label}</CardTitle>
            <CardDescription className="text-xs">
              Proposed {new Date(rec.generated_at).toLocaleString()} by{" "}
              {rec.generated_by}
              {rec.child_id && <> · child {rec.child_id}</>}
              {rec.edits_count > 0 && <> · edited {rec.edits_count}×</>}
            </CardDescription>
          </div>
          <Badge variant="outline" className={STATUS_TONE[rec.status]}>
            {rec.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Body (manager may edit)
          </label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        </div>
        {rec.source_evidence.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Sources:{" "}
            {rec.source_evidence.map((s, i) => (
              <span key={i} className="mr-2 underline">
                {s.label}
              </span>
            ))}
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Decision note (optional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded border px-2 py-1 text-xs"
            placeholder="Why are you committing/rejecting?"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={edit.isPending}
            onClick={() =>
              edit.mutate({
                id: rec.id,
                suggested_title: title,
                suggested_body: body,
                actor_id: actorId,
                actor_role: actorRole,
              })
            }
          >
            <Save className="mr-1 h-4 w-4" />
            {edit.isPending ? "Saving…" : "Save edits"}
          </Button>
          <Button
            size="sm"
            disabled={commit.isPending}
            onClick={() =>
              commit.mutate({
                id: rec.id,
                note: note || undefined,
                actor_id: actorId,
                actor_role: actorRole,
              })
            }
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {commit.isPending ? "Committing…" : "Commit to record"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={reject.isPending}
            onClick={() =>
              reject.mutate({
                id: rec.id,
                note: note || undefined,
                actor_id: actorId,
                actor_role: actorRole,
              })
            }
          >
            <XCircle className="mr-1 h-4 w-4" />
            {reject.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuggestedRecordsPage() {
  const { currentUser } = useAuthContext();
  const ariaRole = appRoleToAriaRole(currentUser?.role ?? "registered_manager");

  const pending = useSuggestedRecords(HOME_ID, "pending");
  const decided = useSuggestedRecords(HOME_ID);
  const committed = useCommittedRecords(HOME_ID);
  const propose = useProposeSuggestedRecord();
  const bridge = useBridgeCareEvents();

  const pendingItems = pending.data?.data ?? [];
  const decidedItems = (decided.data?.data ?? []).filter(
    (r) => r.status !== "pending",
  );
  const committedItems = committed.data?.data ?? [];

  const seedDemo = () => {
    propose.mutate({
      home_id: HOME_ID,
      record_type: "daily_log_summary",
      suggested_title: "Daily summary — quiet evening",
      suggested_body:
        "Alex completed homework after school, helped prepare dinner and went to bed at 9.30pm without prompting. No incidents.",
      source_evidence: [
        { type: "daily_log", id: "demo-evidence", label: "Daily log – evening shift" },
      ],
      actor_id: currentUser?.id,
      actor_role: ariaRole,
    });
  };

  return (
    <PageShell
      title="ARIA — Suggested Records"
      subtitle="ARIA drafts. Humans decide. Only authorised humans approve and commit to the official record."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() =>
              bridge.mutate({
                home_id: HOME_ID,
                limit: 25,
                actor_id: currentUser?.id,
                actor_role: ariaRole,
              })
            }
            disabled={bridge.isPending}
            variant="outline"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {bridge.isPending
              ? "Drafting from care events\u2026"
              : "Draft from latest verified care events"}
          </Button>
          <Button onClick={seedDemo} disabled={propose.isPending} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            {propose.isPending ? "Drafting\u2026" : "Demo: draft a daily summary"}
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <Inbox className="mr-1 h-4 w-4" />
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="committed">
            <FileSignature className="mr-1 h-4 w-4" />
            Committed ({committedItems.length})
          </TabsTrigger>
          <TabsTrigger value="history">History ({decidedItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No pending suggestions. ARIA will surface drafts here as they are
                generated from care events, daily logs and pattern detection.
              </CardContent>
            </Card>
          ) : (
            pendingItems.map((rec) => (
              <PendingCard
                key={rec.id}
                rec={rec}
                actorId={currentUser?.id}
                actorRole={ariaRole}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="committed" className="space-y-3">
          {committedItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No committed records yet.
              </CardContent>
            </Card>
          ) : (
            committedItems.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm">{c.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {ARIA_SUGGESTED_RECORD_LABELS[c.record_type]} · committed{" "}
                        {new Date(c.committed_at).toLocaleString()} by{" "}
                        {c.committed_by}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                      committed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">{c.body}</div>
                  {c.commit_note && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Note: {c.commit_note}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {decidedItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No decisions yet.
              </CardContent>
            </Card>
          ) : (
            decidedItems.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm">{r.suggested_title}</CardTitle>
                      <CardDescription className="text-xs">
                        {r.target_label} · decided{" "}
                        {r.decided_at
                          ? new Date(r.decided_at).toLocaleString()
                          : "—"}{" "}
                        by {r.decided_by}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={STATUS_TONE[r.status]}>
                      {r.status}
                    </Badge>
                  </div>
                </CardHeader>
                {r.decision_note && (
                  <CardContent className="text-xs text-muted-foreground">
                    Note: {r.decision_note}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
