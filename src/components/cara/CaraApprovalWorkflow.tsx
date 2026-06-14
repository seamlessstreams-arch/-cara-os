"use client";

import { useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  PenLine,
  Loader2,
  ShieldAlert,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════════════════════
// CaraApprovalWorkflow — manager approval flow for high-risk drafts
//
// When requiresApproval=true, this component displays the draft content and
// provides Approve / Reject / Request Amendment controls with a notes field.
// Calls POST /api/cara/orchestrate/approve to persist the decision.
// ══════════════════════════════════════════════════════════════════════════════

type ApprovalStatus = "pending" | "approved" | "rejected" | "amended" | "submitting";

type CaraApprovalWorkflowProps = {
  draftContent: string;
  sessionId: string;
  draftId: string;
  userId: string;
  riskLevel: string;
  className?: string;
  onDecisionMade?: (decision: "approve" | "reject" | "amend") => void;
};

export function CaraApprovalWorkflow({
  draftContent,
  sessionId,
  draftId,
  userId,
  riskLevel,
  className,
  onDecisionMade,
}: CaraApprovalWorkflowProps) {
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submitDecision = useCallback(
    async (decision: "approve" | "reject" | "amend") => {
      setStatus("submitting");
      setError(null);

      try {
        const response = await fetch("/api/cara/orchestrate/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            sessionId,
            draftId,
            decision,
            notes: notes.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const json = await response.json();
          throw new Error(json.error ?? "Failed to submit decision.");
        }

        setStatus(decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "amended");
        onDecisionMade?.(decision);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit decision.");
        setStatus("pending");
      }
    },
    [sessionId, draftId, userId, notes, onDecisionMade],
  );

  // Completed state
  if (status === "approved" || status === "rejected" || status === "amended") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          {status === "approved" && (
            <>
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Approved</p>
                <p className="text-xs text-[var(--cs-text-gentle)]">
                  This content has been approved and will be saved to the child&#39;s record.
                </p>
              </div>
            </>
          )}
          {status === "rejected" && (
            <>
              <div className="flex size-8 items-center justify-center rounded-full bg-red-100">
                <XCircle className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Rejected</p>
                <p className="text-xs text-[var(--cs-text-gentle)]">
                  This content has been rejected and will not be saved.
                </p>
              </div>
            </>
          )}
          {status === "amended" && (
            <>
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-100">
                <PenLine className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Amendment Requested</p>
                <p className="text-xs text-[var(--cs-text-gentle)]">
                  An amendment has been requested. Cara will revise the draft.
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("space-y-4 p-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="size-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--cs-navy)]">
            Manager Approval Required
          </p>
          <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">
            This content requires manager approval before saving to the child&#39;s record.
          </p>
        </div>
        <Badge
          variant="warning"
          className="ml-auto shrink-0"
        >
          <Clock className="size-3" />
          Pending
        </Badge>
      </div>

      {/* Draft preview */}
      <div className="rounded-xl border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3">
        <p className="mb-1.5 text-xs font-medium text-[var(--cs-text-gentle)]">
          Draft Content Preview
        </p>
        <div className="max-h-48 overflow-y-auto text-sm leading-relaxed text-[var(--cs-navy)]">
          {draftContent.split("\n").map((line, i) => (
            <p key={i} className={line.trim() === "" ? "h-3" : ""}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Risk context */}
      {(riskLevel === "high" || riskLevel === "critical") && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-xs text-orange-800">
          <ShieldAlert className="size-3.5 shrink-0" />
          <span>
            {riskLevel === "critical"
              ? "This is a safeguarding-critical matter. Please review carefully before approving."
              : "This has been flagged as high-risk content requiring manager sign-off."}
          </span>
        </div>
      )}

      {/* Reviewer notes */}
      <div className="space-y-1.5">
        <label
          htmlFor="approval-notes"
          className="text-xs font-medium text-[var(--cs-text-secondary)]"
        >
          Reviewer Notes (optional)
        </label>
        <Textarea
          id="approval-notes"
          placeholder="Add notes about your decision..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px] text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => submitDecision("approve")}
          disabled={status === "submitting"}
          className="gap-1.5"
        >
          {status === "submitting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          Approve
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => submitDecision("reject")}
          disabled={status === "submitting"}
          className="gap-1.5"
        >
          {status === "submitting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <XCircle className="size-3.5" />
          )}
          Reject
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => submitDecision("amend")}
          disabled={status === "submitting"}
          className="gap-1.5"
        >
          {status === "submitting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <PenLine className="size-3.5" />
          )}
          Request Amendment
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Send to a different manager
            submitDecision("amend");
          }}
          disabled={status === "submitting"}
          className="ml-auto gap-1.5 text-[var(--cs-text-secondary)]"
        >
          <Send className="size-3.5" />
          Escalate
        </Button>
      </div>
    </Card>
  );
}
