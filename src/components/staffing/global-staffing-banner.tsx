"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useSafeStaffing } from "@/hooks/use-safe-staffing";

/**
 * Platform-wide safe-staffing alert. Shows only when staffing is CRITICAL right now
 * (understaffed / no cover / no waking-night cover — Phase 7), so an unsafe staffing
 * level is surfaced everywhere, not just on the Safe Staffing page. Amber (distinct
 * from the coral emergency banner). Renders nothing otherwise. Polls + auto-refreshes
 * via useSafeStaffing.
 */
export function GlobalStaffingBanner() {
  const { data } = useSafeStaffing();
  const a = data?.assessment;
  if (!a || a.severity !== "critical") return null;

  const msg = a.alerts?.find((x) => x.severity === "critical")?.message ?? "Staffing is below the safe minimum.";

  return (
    <Link
      href="/safe-staffing"
      role="alert"
      className="flex items-center justify-center gap-2 bg-[var(--cs-avisaar-amber)] px-4 py-1.5 text-center text-sm font-semibold text-[var(--cs-navy)] hover:opacity-95"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Safe staffing — {msg} · Tap to review</span>
    </Link>
  );
}
