"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA STUDIO — ARTIFACT DETAIL
// View, edit, review and commit an ARIA-generated artifact.
// ARIA drafts. Humans decide. Nothing commits without approval.
// ══════════════════════════════════════════════════════════════════════════════

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Save, Send, CheckCircle, XCircle, RotateCcw, Lock,
  AlertTriangle, Cpu, Clock, FileText, History, ClipboardList, Wand2,
  RefreshCw, ShieldAlert, Eye,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  useAriaArtifact, useUpdateAriaArtifact, useAriaQualityCheck,
} from "@/hooks/use-aria-studio";
import { AriaStudioEvidencePanel } from "@/components/aria/studio-evidence-panel";
import { AriaStudioQualityPanel } from "@/components/aria/studio-quality-panel";
import type { AriaArtifactStatus } from "@/types/aria-studio";
import { ARIA_ARTIFACT_TYPE_LABELS, ARIA_STATUS_LABELS } from "@/types/aria-studio";

// ── Status badge colours ──────────────────────────────────────────────────────

const STATUS_COLOURS: Record<AriaArtifactStatus, string> = {
  draft: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_review: "bg-blue-50 text-blue-700 border-blue-200",
  changes_requested: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  committed: "bg-violet-50 text-violet-700 border-violet-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
  deleted_recoverable: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_ICONS: Record<AriaArtifactStatus, React.ComponentType<{ className?: string }>> = {
  draft: Clock,
  in_review: Eye,
  changes_requested: RotateCcw,
  approved: CheckCircle,
  rejected: XCircle,
  committed: Lock,
  archived: FileText,
  deleted_recoverable: XCircle,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AriaStudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useAriaArtifact(id);
  const updateMutation = useUpdateAriaArtifact();
  const qualityCheckMutation = useAriaQualityCheck();

  // Editing
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [activeTab, setActiveTab] = useState("evidence");

  // Dialog states
  const [approveDialog, setApproveDialog] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [changesDialog, setChangesDialog] = useState(false);
  const [requestedChanges, setRequestedChanges] = useState("");
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commitDialog, setCommitDialog] = useState(false);

  if (isLoading || !data?.data) {
    return (
      <PageShell title="Loading artifact…" subtitle="ARIA Studio">
        <div className="h-64 rounded-lg border bg-muted/30 animate-pulse" />
      </PageShell>
    );
  }

  const { artifact, versions, reviews, qualityChecks, auditLog, sources } = {
    artifact: data!.data,
    ...data!.related,
  };
  const latestQC = qualityChecks?.[0] ?? null;
  const status = artifact.status as AriaArtifactStatus;
  const isEditable = status === "draft" || status === "changes_requested";
  const isCommitted = status === "committed";
  const displayContent = editedContent ?? artifact.generated_content ?? "";
  const contentChanged = editedContent !== null && editedContent !== artifact.generated_content;
  const StatusIcon = STATUS_ICONS[status] ?? FileText;

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleSaveEdit() {
    if (!contentChanged) return;
    updateMutation.mutate({
      id,
      action: "edit",
      actor_id: "staff_anna",
      generated_content: editedContent!,
      change_summary: changeSummary || "Content edited",
    });
    setChangeSummary("");
    setEditedContent(null);
  }

  function handleSubmit() {
    updateMutation.mutate({ id, action: "submit", actor_id: "staff_anna" });
  }

  function handleApprove() {
    updateMutation.mutate({ id, action: "approve", actor_id: "staff_anna", comment: approveComment });
    setApproveDialog(false);
    setApproveComment("");
  }

  function handleRequestChanges() {
    updateMutation.mutate({ id, action: "request_changes", actor_id: "staff_anna", changes: requestedChanges });
    setChangesDialog(false);
    setRequestedChanges("");
  }

  function handleReject() {
    updateMutation.mutate({ id, action: "reject", actor_id: "staff_anna", reason: rejectReason });
    setRejectDialog(false);
    setRejectReason("");
  }

  function handleRunQC() {
    qualityCheckMutation.mutate(id);
    setActiveTab("quality");
  }

  function handleCommit() {
    updateMutation.mutate({ id, action: "commit", actor_id: "staff_anna" });
    setCommitDialog(false);
  }

  return (
    <PageShell
      title={artifact.title}
      subtitle={ARIA_ARTIFACT_TYPE_LABELS[artifact.artifact_type as keyof typeof ARIA_ARTIFACT_TYPE_LABELS] ?? artifact.artifact_type}
      ariaContext={{
        pageTitle: `ARIA Studio artifact — ${artifact.title} — status: ${status}`,
        suggestedAction: "Run quality check or approve artifact",
      }}
    >
      {/* ── Back + header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => router.push("/intelligence/aria/studio")}
        >
          <ArrowLeft className="h-4 w-4" />
          Studio
        </Button>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`gap-1.5 ${STATUS_COLOURS[status]}`}
          >
            <StatusIcon className="h-3 w-3" />
            {ARIA_STATUS_LABELS[status]}
          </Badge>
          {artifact.safeguarding_level && artifact.safeguarding_level !== "none" && (
            <Badge variant="outline" className="gap-1.5 text-amber-700 border-amber-200 bg-amber-50">
              <ShieldAlert className="h-3 w-3" />
              Safeguarding: {artifact.safeguarding_level}
            </Badge>
          )}
        </div>

        {/* ── Action buttons by status ──────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {status === "draft" && (
            <Button size="sm" onClick={handleSubmit} disabled={updateMutation.isPending} className="gap-1.5">
              <Send className="h-4 w-4" />
              Submit for review
            </Button>
          )}
          {status === "in_review" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setChangesDialog(true)} className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Request changes
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectDialog(true)} className="gap-1.5">
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button size="sm" onClick={() => setApproveDialog(true)} disabled={updateMutation.isPending} className="gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          {status === "approved" && (
            <>
              <Button size="sm" variant="outline" onClick={handleRunQC} disabled={qualityCheckMutation.isPending} className="gap-1.5">
                {qualityCheckMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="h-4 w-4" />
                )}
                Run quality check
              </Button>
              <Button size="sm" onClick={() => setCommitDialog(true)} className="gap-1.5">
                <Lock className="h-4 w-4" />
                Commit to record
              </Button>
            </>
          )}
          {isCommitted && (
            <div className="flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-md px-2.5 py-1.5">
              <Lock className="h-3.5 w-3.5" />
              Locked — committed record
            </div>
          )}
        </div>
      </div>

      {/* ── ARIA draft banner ─────────────────────────────────────────────── */}
      {(status === "draft" || status === "in_review") && (
        <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-md px-4 py-2.5 mb-4">
          <Cpu className="h-4 w-4 text-violet-600 shrink-0" />
          <p className="text-xs text-violet-700">
            <span className="font-semibold">ARIA DRAFT</span> — This is an AI-generated draft.
            It must be reviewed, edited if needed, and approved by an authorised member of staff
            before it becomes part of any official record.
          </p>
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: content editor */}
        <div className="lg:col-span-2 space-y-3">
          {/* Metadata bar */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>v{artifact.version_number}</span>
            <span>·</span>
            <span>Created {formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true })}</span>
            {artifact.child_id && (
              <>
                <span>·</span>
                <span>Child: {artifact.child_id}</span>
              </>
            )}
            {artifact.quality_score !== null && (
              <>
                <span>·</span>
                <span>Quality: {artifact.quality_score}/100</span>
              </>
            )}
          </div>

          {/* Content area */}
          {isEditable && !isCommitted ? (
            <div className="space-y-2">
              <Textarea
                value={displayContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[480px] font-mono text-sm leading-relaxed resize-none"
                placeholder="Generated content will appear here…"
              />
              {contentChanged && (
                <div className="space-y-2">
                  <Input
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="Brief description of changes (optional)"
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save changes
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[480px] rounded-md border bg-muted/20 p-4 text-sm whitespace-pre-wrap leading-relaxed font-mono">
              {displayContent || (
                <span className="text-muted-foreground italic">No content generated yet</span>
              )}
            </div>
          )}

          {/* Changes requested notes */}
          {status === "changes_requested" && reviews && reviews.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-1">
              <p className="text-xs font-semibold text-orange-700">Changes requested by reviewer:</p>
              {reviews
                .filter((r) => r.review_status === "changes_requested")
                .slice(0, 1)
                .map((r) => (
                  <p key={r.id} className="text-xs text-orange-700">{r.requested_changes}</p>
                ))}
            </div>
          )}
        </div>

        {/* Right: tabs panel */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 h-8 text-xs">
              <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
              <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
              <TabsTrigger value="versions" className="text-xs">History</TabsTrigger>
              <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
            </TabsList>

            {/* Evidence */}
            <TabsContent value="evidence" className="mt-3">
              <Card>
                <CardContent className="pt-4">
                  <AriaStudioEvidencePanel
                    sources={sources ?? []}
                    confidenceScore={artifact.evidence_confidence_score ?? null}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quality */}
            <TabsContent value="quality" className="mt-3">
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    Quality check
                    {!isCommitted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRunQC}
                        disabled={qualityCheckMutation.isPending}
                        className="h-6 px-2 text-xs gap-1"
                      >
                        {qualityCheckMutation.isPending ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Run
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  {latestQC ? (
                    <AriaStudioQualityPanel
                      qualityCheck={latestQC}
                      score={artifact.quality_score ?? null}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      No quality check run yet.
                      {status === "approved" && (
                        <p className="mt-1">Run a check before committing.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Version history */}
            <TabsContent value="versions" className="mt-3">
              <Card>
                <CardContent className="pt-4 space-y-2">
                  {versions && versions.length > 0 ? (
                    versions.map((v) => (
                      <div key={v.id} className="text-xs border rounded-md p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">v{v.version_number}</span>
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(v.changed_at), { addSuffix: true })}
                          </span>
                        </div>
                        {v.change_summary && (
                          <p className="text-muted-foreground">{v.change_summary}</p>
                        )}
                        <p className="text-muted-foreground">by {v.changed_by}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No version history yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit log */}
            <TabsContent value="audit" className="mt-3">
              <Card>
                <CardContent className="pt-4 space-y-2 max-h-96 overflow-y-auto">
                  {auditLog && auditLog.length > 0 ? (
                    auditLog.map((entry) => (
                      <div key={entry.id} className="text-xs border-b pb-2 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{entry.action_type.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(entry.created_at), "d MMM HH:mm")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{entry.actor_id}</p>
                        {entry.after_state && Object.keys(entry.after_state).length > 0 && (
                          <p className="text-muted-foreground truncate">
                            {JSON.stringify(entry.after_state)}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No audit log entries
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ── Safety footer ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
        <Wand2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
        <span>
          ARIA drafts. Humans decide. This artifact{" "}
          {isCommitted
            ? "has been committed to the official record and is locked."
            : "requires human review and manager approval before committing to the official record."}
        </span>
      </div>

      {/* ── Approve dialog ────────────────────────────────────────────────── */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approve artifact
            </DialogTitle>
            <DialogDescription>
              Confirm you have reviewed the content and it is accurate. Optional comment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Comment (optional)</Label>
              <Textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Any notes for the record…"
                className="resize-none h-20 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>Cancel</Button>
            <Button onClick={handleApprove} disabled={updateMutation.isPending} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Request changes dialog ────────────────────────────────────────── */}
      <Dialog open={changesDialog} onOpenChange={setChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              Request changes
            </DialogTitle>
            <DialogDescription>
              Describe the changes needed. The author will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Changes required *</Label>
              <Textarea
                value={requestedChanges}
                onChange={(e) => setRequestedChanges(e.target.value)}
                placeholder="Describe what needs to change and why…"
                className="resize-none h-24 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRequestChanges}
              disabled={!requestedChanges.trim() || updateMutation.isPending}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Request changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ─────────────────────────────────────────────────── */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject artifact
            </DialogTitle>
            <DialogDescription>
              State the reason for rejection. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why is this artifact being rejected?"
                className="resize-none h-20 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || updateMutation.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Commit dialog ─────────────────────────────────────────────────── */}
      <Dialog open={commitDialog} onOpenChange={setCommitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-violet-600" />
              Commit to official record
            </DialogTitle>
            <DialogDescription>
              This will lock the artifact and add it to the official record. This action cannot
              be undone — only formal amendments will be possible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {latestQC ? (
              <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${latestQC.overall_passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {latestQC.overall_passed ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {latestQC.overall_passed
                  ? "Quality check passed — ready to commit."
                  : "Quality check did not pass. Resolve all critical issues before committing."}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md p-3 text-sm bg-amber-50 text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                No quality check has been run. A quality check will be run automatically on commit.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCommit}
              disabled={updateMutation.isPending || (latestQC !== null && !latestQC.overall_passed)}
              className="gap-2"
            >
              <Lock className="h-4 w-4" />
              Commit to record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
