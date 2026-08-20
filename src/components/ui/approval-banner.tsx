"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

interface ApprovalBannerProps {
  status: ApprovalStatus;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
  canReview?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { icon: React.ElementType; label: string; bg: string; border: string; text: string }
> = {
  pending: {
    icon: Clock,
    label: "Awaiting Review",
    bg: "bg-amber-50/60",
    border: "border-amber-200/60",
    text: "text-amber-700",
  },
  approved: {
    icon: CheckCircle2,
    label: "Approved",
    bg: "bg-emerald-50/60",
    border: "border-emerald-200/60",
    text: "text-emerald-700",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    bg: "bg-red-50/60",
    border: "border-red-200/60",
    text: "text-red-700",
  },
  changes_requested: {
    icon: AlertTriangle,
    label: "Changes Requested",
    bg: "bg-orange-50/60",
    border: "border-orange-200/60",
    text: "text-orange-700",
  },
};

export function ApprovalBanner({
  status,
  submittedBy,
  submittedAt,
  reviewedBy,
  reviewedAt,
  comment,
  onApprove,
  onReject,
  onRequestChanges,
  canReview = false,
  className,
}: ApprovalBannerProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-200",
        config.bg, config.border,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <StatusIcon className={cn("h-5 w-5 mt-0.5 shrink-0", config.text)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-sm font-semibold", config.text)}>
              {config.label}
            </span>
            {submittedBy && (
              <span className="text-xs text-[var(--cs-text-muted)]">
                Submitted by {submittedBy}
                {submittedAt && ` on ${submittedAt}`}
              </span>
            )}
          </div>

          {reviewedBy && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
              <User className="h-3 w-3" />
              <span>
                Reviewed by {reviewedBy}
                {reviewedAt && ` on ${reviewedAt}`}
              </span>
            </div>
          )}

          {comment && (
            <div className="mt-2 rounded-xl bg-white/60 border border-[var(--cs-border-subtle)] p-3">
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed italic">
                &ldquo;{comment}&rdquo;
              </p>
            </div>
          )}

          {canReview && status === "pending" && (
            <div className="mt-3 flex items-center gap-2">
              {onApprove && (
                <button
                  onClick={onApprove}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approve
                </button>
              )}
              {onRequestChanges && (
                <button
                  onClick={onRequestChanges}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Request Changes
                </button>
              )}
              {onReject && (
                <button
                  onClick={onReject}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
