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
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronRight, AlertTriangle } from "lucide-react";

// ─── Inlined from the former use-cara-pending hook ───────────────────────────
// Fetches Cara outputs awaiting human review. Powers the approval queue.

interface PendingOutput {
  id: string;
  requestId: string;
  commandId: string;
  generatedText: string;
  confidence: string;
  status: string;
  userId: string;
  createdAt: string;
  guardrailFlagged: boolean;
  guardrailSummary: string | null;
}

function useCaraPending(params?: {
  actorUserId?: string;
  actorRole?: string;
  homeId?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.actorUserId) query.set("actorUserId", params.actorUserId);
  if (params?.actorRole) query.set("actorRole", params.actorRole);
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["cara-pending", params],
    queryFn: async () => {
      const res = await fetch(`/api/cara/pending?${query}`);
      if (!res.ok) throw new Error("Failed to fetch pending Cara outputs");
      const data = await res.json();
      return data.data as PendingOutput[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — approval queue should be fresh
    enabled: !!params?.actorUserId,
  });
}

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
  const { data: pending, isError } = useCaraPending({
    actorUserId,
    actorRole,
    homeId,
    limit: 50,
  });

  // Returning null on a failed read would make approvals awaiting a manager
  // simply not appear — indistinguishable from having none waiting.
  if (isError) {
    return (
      <div className={cn("rounded-xl border border-[var(--cs-risk)]/30 p-3 text-xs text-[var(--cs-risk)]", className)}>
        Pending Cara approvals could not be loaded — this is not the same as there being none.
      </div>
    );
  }

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
