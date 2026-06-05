"use client";

import Link from "next/link";
import { Siren } from "lucide-react";
import { useEmergencyAlerts } from "@/hooks/use-safe-staffing";
import { EMERGENCY_TYPE_LABEL } from "@/lib/staffing/emergency-types";

/**
 * Platform-wide emergency indicator. The moment an emergency is raised (Phase 7), a
 * prominent sticky bar appears on EVERY page so it can't be missed, linking to the
 * Safe Staffing page to respond/resolve. Renders nothing when there's no active
 * alert (zero footprint normally). Polls via useEmergencyAlerts.
 */
export function GlobalEmergencyBanner() {
  const { data: alerts = [] } = useEmergencyAlerts();
  if (alerts.length === 0) return null;

  const a = alerts[0];
  const more = alerts.length - 1;

  return (
    <Link
      href="/safe-staffing"
      role="alert"
      className="flex items-center justify-center gap-2 bg-[var(--cs-avisaar-coral)] px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-95"
    >
      <Siren className="h-4 w-4 shrink-0 animate-pulse" />
      <span>
        Emergency in progress — {EMERGENCY_TYPE_LABEL[a.type] ?? "assistance needed"}
        {a.location ? ` at ${a.location}` : ""}
        {more > 0 ? ` (+${more} more)` : ""} · Tap to respond
      </span>
    </Link>
  );
}
