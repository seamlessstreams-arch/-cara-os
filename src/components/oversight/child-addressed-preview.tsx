"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Child-addressed oversight preview.
// Shows the warm, plain-English version written TO the child — OR a clear
// suppression notice when a child-facing version would be unsafe. A client-side
// banned-phrase scan is a final safety net before anything is shared.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Heart, ShieldAlert, AlertTriangle } from "lucide-react";
import { scanForBannedPhrases } from "@/lib/oversight/templates/child-addressed-templates";

export function ChildAddressedPreview({
  text,
  suppressed,
  suppressionReason,
}: {
  text?: string;
  suppressed: boolean;
  suppressionReason?: string;
}) {
  if (suppressed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900">Child-addressed version withheld for manager approval</p>
          <p className="text-sm text-amber-800">
            {suppressionReason ??
              "A child-facing version has been withheld because this is a sensitive matter. Please craft any wording sensitively with the child's key worker."}
          </p>
        </div>
      </div>
    );
  }

  if (!text) {
    return <p className="text-sm text-[var(--cs-text-muted)]">No child-addressed version was requested.</p>;
  }

  const banned = scanForBannedPhrases(text);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-4">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--cs-text)]">{text}</p>
      </div>
      {banned.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <p className="text-xs text-red-800">
            This wording contains terms that should not appear in a child-facing note ({banned.join(", ")}). Please
            revise before sharing.
          </p>
        </div>
      )}
    </div>
  );
}
