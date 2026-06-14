// ══════════════════════════════════════════════════════════════════════════════
// CaraHumanApprovalBanner — Shows when AI output requires human approval
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraApprovalStatus, CaraRiskLevel } from "@/lib/cara/core/types";

interface Props {
  approvalId: string;
  taskType: string;
  riskLevel: CaraRiskLevel;
  status: CaraApprovalStatus;
  generatedAt: string;
  onApprove?: (notes: string) => void;
  onReject?: (reason: string) => void;
  onAmend?: () => void;
  canApprove?: boolean;
}

export function CaraHumanApprovalBanner({
  approvalId,
  taskType,
  riskLevel,
  status,
  generatedAt,
  onApprove,
  onReject,
  onAmend,
  canApprove: userCanApprove = false,
}: Props) {
  const [notes, setNotes] = useState("");
  const [showActions, setShowActions] = useState(false);

  if (status === "approved") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Approved for official use
          </span>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-red-800 dark:text-red-300">
            Rejected — requires regeneration or manual creation
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Human approval required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              This AI-generated content must be reviewed and approved before official use.
              AI does not make final decisions — professional judgement is required.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-amber-700 dark:text-amber-400">
        <span>Task: {taskType.replace(/_/g, " ")}</span>
        <span>Risk: {riskLevel}</span>
        <span>Generated: {new Date(generatedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
      </div>

      {userCanApprove && (
        <>
          {!showActions ? (
            <button
              onClick={() => setShowActions(true)}
              className="text-sm font-medium text-amber-800 dark:text-amber-300 hover:underline"
            >
              Review and decide...
            </button>
          ) : (
            <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-700">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add review notes (optional for approval, required for rejection)..."
                className="w-full rounded-md border border-amber-300 bg-white dark:bg-gray-900 p-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove?.(notes)}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => onAmend?.()}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Amend
                </button>
                <button
                  onClick={() => {
                    if (!notes.trim()) {
                      alert("Please provide a reason for rejection.");
                      return;
                    }
                    onReject?.(notes);
                  }}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowActions(false)}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
