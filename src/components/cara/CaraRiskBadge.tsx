"use client";

import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/cara/orchestrator/types";

// ══════════════════════════════════════════════════════════════════════════════
// CaraRiskBadge — colour-coded risk level badge
//
// Displays the orchestrator's risk classification as a clear, colour-coded
// badge so staff can immediately see whether manager review or safeguarding
// escalation is required.
//
// low:      green  — routine, no review required
// medium:   amber  — flagged, manager may want to review
// high:     orange — manager review required
// critical: red    — safeguarding escalation required
// ══════════════════════════════════════════════════════════════════════════════

const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    icon: typeof ShieldCheck;
    className: string;
    bannerClassName: string;
  }
> = {
  low: {
    label: "Low Risk",
    icon: ShieldCheck,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    bannerClassName:
      "border-emerald-200 bg-emerald-50/60 text-emerald-800",
  },
  medium: {
    label: "Medium Risk",
    icon: AlertTriangle,
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    bannerClassName:
      "border-amber-200 bg-amber-50/60 text-amber-800",
  },
  high: {
    label: "High Risk — Manager Review Required",
    icon: ShieldAlert,
    className:
      "border-orange-200 bg-orange-50 text-orange-700",
    bannerClassName:
      "border-orange-200 bg-orange-50/60 text-orange-800",
  },
  critical: {
    label: "Critical — Safeguarding Escalation Required",
    icon: AlertOctagon,
    className:
      "border-red-200 bg-red-50 text-red-700",
    bannerClassName:
      "border-red-200 bg-red-50/60 text-red-800",
  },
};

type CaraRiskBadgeProps = {
  riskLevel: RiskLevel;
  /** Render as a full-width banner instead of an inline badge */
  variant?: "badge" | "banner";
  className?: string;
};

export function CaraRiskBadge({
  riskLevel,
  variant = "badge",
  className,
}: CaraRiskBadgeProps) {
  const config = RISK_CONFIG[riskLevel];
  const Icon = config.icon;

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
          config.bannerClassName,
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <Icon className="size-4 shrink-0" />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <Badge className={cn("gap-1", config.className, className)}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
