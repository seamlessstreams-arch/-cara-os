"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATION 45 EVIDENCE BANK
// Live-updating evidence queue from Care Event routing
// Managers review, edit and approve suggested evidence for Reg 45 reports
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Eye,
  Pencil,
  BookOpen,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  useReg45Evidence,
  useDecideReg45Evidence,
  type Reg45EvidenceEnriched,
} from "@/hooks/use-compliance-evidence";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { ManagerDecision } from "@/types/care-events";

// ── Decision colours ──────────────────────────────────────────────────────────

const DECISION_CLR: Record<ManagerDecision, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  deferred: "bg-slate-100 text-slate-600 border-slate-200",
};

const DECISION_LABEL: Record<ManagerDecision, string> = {
  pending: "Pending review",
  approved: "Approved",
  accepted: "Accepted",
  rejected: "Rejected",
  deferred: "Deferred",
};

const CATEGORY_CLR: Record<string, string> = {
  behaviour: "bg-amber-100 text-amber-800",
  safeguarding: "bg-red-100 text-red-800",
  health: "bg-blue-100 text-blue-800",
  missing_episode: "bg-purple-100 text-purple-800",
  physical_intervention: "bg-orange-100 text-orange-800",
  restraint: "bg-orange-100 text-orange-800",
  complaint: "bg-yellow-100 text-yellow-800",
  general: "bg-slate-100 text-slate-700",
};

// ── Evidence item card ────────────────────────────────────────────────────────

function EvidenceItemCard({
  item,
  onDecide,
}: {
  item: Reg45EvidenceEnriched;
  onDecide: (item: Reg45EvidenceEnriched) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "border transition-all",
        item.manager_decision === "pending" && "border-amber-200 bg-amber-50/10",
        item.manager_decision === "approved" || item.manager_decision === "accepted"
          ? "border-emerald-200 bg-emerald-50/10"
          : "",
        item.manager_decision === "rejected" && "opacity-60 border-slate-200",
        item.manager_decision === "deferred" && "border-slate-200 opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge
                className={cn(
                  "text-xs border",
                  DECISION_CLR[item.manager_decision] ?? DECISION_CLR.pending
                )}
              >
                {DECISION_LABEL[item.manager_decision]}
              </Badge>
              {item.suggested_theme && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    CATEGORY_CLR[item.care_event?.category ?? "general"] ?? "bg-slate-100 text-slate-700"
                  )}
                >
                  {item.suggested_theme}
                </Badge>
              )}
            </div>

            {/* Suggested text (truncated) */}
            <p className="text-sm text-slate-800 line-clamp-2">{item.suggested_text}</p>

            {item.care_event && (
              <p className="text-xs text-slate-500 mt-1.5">
                Source: {item.care_event.title} — {formatDate(item.care_event.event_date)}
              </p>
            )}

            {item.reviewed_at && (
              <p className="text-xs text-slate-400 mt-0.5">
                Reviewed {formatDate(item.reviewed_at)} by {item.reviewed_by}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            {item.manager_decision === "pending" && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onDecide(item)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Review
              </Button>
            )}
            {(item.manager_decision === "approved" || item.manager_decision === "accepted") && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onDecide(item)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">AI-suggested text</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded p-2">{item.suggested_text}</p>
            </div>
            {item.manager_approved_text && (
              <div>
                <p className="text-xs font-medium text-emerald-700 mb-1">Manager-approved text</p>
                <p className="text-sm text-slate-700 bg-emerald-50 rounded p-2">{item.manager_approved_text}</p>
              </div>
            )}
            {item.review_notes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Review notes</p>
                <p className="text-sm text-slate-700">{item.review_notes}</p>
              </div>
            )}
            {item.care_event && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-xs font-medium text-blue-700 mb-0.5">Source care event</p>
                <p className="text-sm text-slate-900">{item.care_event.title}</p>
                <p className="text-xs text-slate-500">
                  {item.care_event.category.replace(/_/g, " ")} — Status: {item.care_event.status.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Review dialog ─────────────────────────────────────────────────────────────

function ReviewDialog({
  item,
  onClose,
}: {
  item: Reg45EvidenceEnriched;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const decideMutation = useDecideReg45Evidence();
  const [approvedText, setApprovedText] = useState(
    item.manager_approved_text ?? item.suggested_text
  );
  const [reviewNotes, setReviewNotes] = useState(item.review_notes ?? "");
  const [decision, setDecision] = useState<ManagerDecision>(
    item.manager_decision === "pending" ? "approved" : item.manager_decision
  );

  const handleSubmit = () => {
    decideMutation.mutate(
      {
        id: item.id,
        manager_decision: decision,
        manager_approved_text: decision === "approved" || decision === "accepted" ? approvedText : undefined,
        review_notes: reviewNotes || undefined,
        reviewed_by: currentUser?.id ?? "manager_default",
      },
      {
        onSuccess: () => {
          const messages: Record<string, string> = {
            approved: "Evidence approved for Regulation 45 report",
            accepted: "Evidence accepted for Regulation 45 report",
            rejected: "Evidence rejected",
            deferred: "Evidence deferred — will remain in queue",
          };
          toast.success(messages[decision] ?? "Decision saved");
          onClose();
        },
        onError: () => {
          toast.error("Failed to save decision");
        },
      }
    );
  };

  const DECISION_OPTIONS: Array<{
    value: ManagerDecision;
    label: string;
    description: string;
    colour: string;
  }> = [
    {
      value: "approved",
      label: "Approve",
      description: "Include in Regulation 45 report",
      colour: "border-emerald-500 bg-emerald-50",
    },
    {
      value: "rejected",
      label: "Reject",
      description: "Do not include in report",
      colour: "border-red-400 bg-red-50",
    },
    {
      value: "deferred",
      label: "Defer",
      description: "Review later",
      colour: "border-slate-300 bg-slate-50",
    },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Regulation 45 Evidence</DialogTitle>
          <DialogDescription>
            Review the AI-suggested evidence below. Edit the approved text if needed, then make your decision.
            Only approved evidence will appear in the Regulation 45 report builder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Source care event */}
          {item.care_event && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Source Care Event
              </p>
              <p className="text-sm font-medium text-slate-900">{item.care_event.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.care_event.category.replace(/_/g, " ")} —{" "}
                {formatDate(item.care_event.event_date)} — Status:{" "}
                {item.care_event.status.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* AI suggested text (read-only reference) */}
          <div>
            <Label className="text-sm text-slate-500">AI-suggested text (for reference)</Label>
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 mt-1">
              {item.suggested_text}
            </p>
          </div>

          {/* Manager-approved text (editable) */}
          <div>
            <Label htmlFor="approved_text" className="text-sm font-medium">
              Approved text for Regulation 45 report{" "}
              <span className="text-slate-400 font-normal">(edit as required)</span>
            </Label>
            <Textarea
              id="approved_text"
              value={approvedText}
              onChange={(e) => setApprovedText(e.target.value)}
              rows={4}
              className="mt-1 text-sm"
            />
          </div>

          {/* Decision buttons */}
          <div>
            <Label className="text-sm font-medium">Decision</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {DECISION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-sm transition-all",
                    decision === opt.value ? opt.colour + " border-opacity-100" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {opt.value === "approved" && (
                    <CheckCircle2 className={cn("h-4 w-4", decision === "approved" ? "text-emerald-600" : "text-slate-400")} />
                  )}
                  {opt.value === "rejected" && (
                    <XCircle className={cn("h-4 w-4", decision === "rejected" ? "text-red-500" : "text-slate-400")} />
                  )}
                  {opt.value === "deferred" && (
                    <Pause className={cn("h-4 w-4", decision === "deferred" ? "text-slate-600" : "text-slate-400")} />
                  )}
                  <span className="font-medium text-xs">{opt.label}</span>
                  <span className="text-xs text-slate-500 text-center">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Review notes */}
          <div>
            <Label htmlFor="review_notes" className="text-sm">
              Review notes <span className="text-slate-400">(optional)</span>
            </Label>
            <Textarea
              id="review_notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional notes about this decision..."
              rows={2}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={decideMutation.isPending}
            className={cn(
              decision === "approved" && "bg-emerald-600 hover:bg-emerald-700",
              decision === "rejected" && "bg-red-600 hover:bg-red-700"
            )}
          >
            {decideMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Regulation45EvidencePage() {
  const [filter, setFilter] = useState<ManagerDecision | "all">("pending");
  const [reviewingItem, setReviewingItem] = useState<Reg45EvidenceEnriched | null>(null);

  const decisionParam = filter === "all" ? undefined : filter;
  const { data, isLoading } = useReg45Evidence({ decision: decisionParam });

  const items = data?.data ?? [];
  const counts = data?.meta?.counts;

  const FILTERS: Array<{ key: ManagerDecision | "all"; label: string; count?: number }> = [
    { key: "pending", label: "Pending", count: counts?.pending },
    { key: "approved", label: "Approved", count: counts?.approved },
    { key: "rejected", label: "Rejected", count: counts?.rejected },
    { key: "deferred", label: "Deferred", count: counts?.deferred },
    { key: "all", label: "All", count: counts?.total },
  ];

  return (
    <PageShell
      title="Regulation 45 Evidence Bank"
      subtitle="AI-suggested evidence from Care Events — review and approve for the Regulation 45 report builder"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Pending review",
            value: counts?.pending ?? 0,
            icon: <Clock className="h-4 w-4 text-amber-600" />,
            colour: "bg-amber-50 border-amber-100",
          },
          {
            label: "Approved",
            value: counts?.approved ?? 0,
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
            colour: "bg-emerald-50 border-emerald-100",
          },
          {
            label: "Rejected",
            value: counts?.rejected ?? 0,
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            colour: "bg-red-50 border-red-100",
          },
          {
            label: "Total evidence",
            value: counts?.total ?? 0,
            icon: <FileText className="h-4 w-4 text-slate-500" />,
            colour: "bg-slate-50 border-slate-100",
          },
        ].map((stat) => (
          <Card key={stat.label} className={cn("border", stat.colour)}>
            <CardContent className="p-3 flex items-center gap-2">
              {stat.icon}
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Safety note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-sm text-blue-800">
        <span className="font-semibold">AI safety notice:</span> All evidence below was suggested by ARIA
        based on submitted Care Events. It must not enter the Regulation 45 report without manager approval.
        Review each item and approve, edit, or reject.
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-slate-100 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
              filter === f.key
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span
                className={cn(
                  "text-xs rounded-full px-1.5 py-0.5",
                  filter === f.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Evidence list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading evidence bank...
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No evidence items</p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === "pending"
                ? "No pending evidence — submit Care Events flagged for Regulation 45 to populate this bank."
                : "No items for the selected filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <EvidenceItemCard key={item.id} item={item} onDecide={setReviewingItem} />
          ))}
        </div>
      )}

      {reviewingItem && (
        <ReviewDialog item={reviewingItem} onClose={() => setReviewingItem(null)} />
      )}
    </PageShell>
  );
}
