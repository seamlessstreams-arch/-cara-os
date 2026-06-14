"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara SUGGESTED RECORDS (Commit Queue)
// Cara proposes records. The manager edits, rejects or commits each one
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
  History, Pencil, ShieldAlert,
} from "lucide-react";
import {
  useSuggestedRecords,
  useCommittedRecords,
  useEditSuggestedRecord,
  useRejectSuggestedRecord,
  useCommitSuggestedRecord,
  useProposeSuggestedRecord,
} from "@/hooks/use-cara-suggested-records";
import { useBridgeCareEvents } from "@/hooks/use-cara-care-event-bridge";
import {
  useAmendCommittedRecord,
  useCommittedVersionHistory,
} from "@/hooks/use-cara-committed-amendments";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import {
  CARA_SUGGESTED_RECORD_LABELS,
  type CaraCommittedRecord,
  type CaraSuggestedRecord,
} from "@/types/cara-studio";

const HOME_ID = "home_oak";

const STATUS_TONE: Record<CaraSuggestedRecord["status"], string> = {
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
  rec: CaraSuggestedRecord;
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

function CommittedCard({
  rec,
  actorId,
  actorRole,
}: {
  rec: CaraCommittedRecord;
  actorId: string | undefined;
  actorRole: string;
}) {
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [title, setTitle] = useState(rec.title);
  const [body, setBody] = useState(rec.body);
  const [reason, setReason] = useState("");
  const amend = useAmendCommittedRecord();
  const history = useCommittedVersionHistory(showHistory ? rec.id : null);

  const onAmend = () => {
    if (!reason.trim()) return;
    amend.mutate(
      {
        record_id: rec.id,
        amendment_reason: reason.trim(),
        new_title: title !== rec.title ? title : undefined,
        new_body: body !== rec.body ? body : undefined,
        actor_id: actorId,
        actor_role: actorRole,
      },
      {
        onSuccess: () => {
          setEditing(false);
          setReason("");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{rec.title}</CardTitle>
            <CardDescription className="text-xs">
              {CARA_SUGGESTED_RECORD_LABELS[rec.record_type]} · v{rec.version}
              {" · committed "}
              {new Date(rec.committed_at).toLocaleString()} by {rec.committed_by}
              {rec.amended_at && (
                <>
                  {" · amended "}
                  {new Date(rec.amended_at).toLocaleString()} by {rec.amended_by}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
              v{rec.version}
            </Badge>
            {rec.amendment_requires_manager_review && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                <ShieldAlert className="mr-1 h-3 w-3" />
                manager review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Amendment reason (required)"
              className="w-full rounded border px-2 py-1 text-xs"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={onAmend}
                disabled={!reason.trim() || amend.isPending}
              >
                <Save className="mr-1 h-3 w-3" />
                {amend.isPending ? "Amending…" : "Save amendment"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setTitle(rec.title);
                  setBody(rec.body);
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
            {amend.isError && (
              <p className="text-xs text-rose-700">
                Amendment failed. The original is preserved.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="whitespace-pre-wrap text-sm">{rec.body}</div>
            {rec.commit_note && (
              <div className="text-xs text-muted-foreground">
                Note: {rec.commit_note}
              </div>
            )}
            {rec.amendment_reason && (
              <div className="text-xs text-amber-800">
                Amendment reason: {rec.amendment_reason}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-3 w-3" />
                Amend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowHistory((v) => !v)}
              >
                <History className="mr-1 h-3 w-3" />
                {showHistory ? "Hide history" : `History (v${rec.version})`}
              </Button>
            </div>
            {showHistory && (
              <div className="mt-2 space-y-2 rounded border bg-slate-50 p-2 text-xs">
                {history.isLoading ? (
                  <p className="text-muted-foreground">Loading…</p>
                ) : (
                  (history.data?.data ?? []).map((v) => (
                    <div
                      key={v.id}
                      className={`rounded border bg-white p-2 ${
                        v.is_current_version ? "border-emerald-400" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          v{v.version}
                          {v.is_current_version && " (current)"}
                        </span>
                        <span className="text-muted-foreground">
                          {v.amended_at
                            ? `amended ${new Date(v.amended_at).toLocaleString()}`
                            : `committed ${new Date(v.committed_at).toLocaleString()}`}
                        </span>
                      </div>
                      <div className="mt-1 font-medium">{v.title}</div>
                      <div className="mt-1 whitespace-pre-wrap text-xs">{v.body}</div>
                      {v.amendment_reason && (
                        <div className="mt-1 text-amber-800">
                          Reason: {v.amendment_reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SuggestedRecordsPage() {
  const { currentUser } = useAuthContext();
  const caraRole = appRoleToCaraRole(currentUser?.role ?? "registered_manager");

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
      actor_role: caraRole,
    });
  };

  return (
    <PageShell
      title="Cara — Suggested Records"
      subtitle="Cara drafts. Humans decide. Only authorised humans approve and commit to the official record."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() =>
              bridge.mutate({
                home_id: HOME_ID,
                limit: 25,
                actor_id: currentUser?.id,
                actor_role: caraRole,
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
                No pending suggestions. Cara will surface drafts here as they are
                generated from care events, daily logs and pattern detection.
              </CardContent>
            </Card>
          ) : (
            pendingItems.map((rec) => (
              <PendingCard
                key={rec.id}
                rec={rec}
                actorId={currentUser?.id}
                actorRole={caraRole}
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
              <CommittedCard
                key={c.id}
                rec={c}
                actorId={currentUser?.id}
                actorRole={caraRole}
              />
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
