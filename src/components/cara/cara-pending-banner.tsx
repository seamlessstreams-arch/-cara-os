"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraPendingBanner
//
// Notification banner shown on dashboards when there are Cara outputs awaiting
// human review. Links to the Cara review queue. Only visible to users with
// approval permissions.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCaraPending } from "@/hooks/use-cara-pending";
import { Sparkles, ChevronRight, AlertTriangle, Shield } from "lucide-react";

interface CaraPendingBannerProps {
  actorUserId: string;
  actorRole: string;
  homeId?: string;
  className?: string;
}

export function CaraPendingBanner({
  actorUserId,
  actorRole,
  homeId,
  className,
}: CaraPendingBannerProps) {
  const { data: pending } = useCaraPending({
    actorUserId,
    actorRole,
    homeId,
    limit: 50,
  });

  if (!pending || pending.length === 0) return null;

  const flaggedCount = pending.filter((p) => p.guardrailFlagged).length;

  return (
    <Link
      href="/cara/review"
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm",
        flaggedCount > 0
          ? "border-amber-200 bg-amber-50 hover:bg-amber-100/60"
          : "border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] hover:bg-[var(--cs-cara-gold-soft)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          flaggedCount > 0 ? "bg-amber-200" : "bg-[var(--cs-navy)]",
        )}
      >
        {flaggedCount > 0 ? (
          <AlertTriangle className="h-4 w-4 text-amber-700" />
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[var(--cs-navy)]">
          {pending.length} Cara output{pending.length !== 1 ? "s" : ""}{" "}
          awaiting review
        </div>
        <div className="text-[10px] text-[var(--cs-text-muted)]">
          {flaggedCount > 0 && (
            <span className="text-amber-700 font-medium">
              {flaggedCount} flagged by guardrails ·{" "}
            </span>
          )}
          Click to review and approve
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] shrink-0" />
    </Link>
  );
}
