"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraConfidenceIndicator
//
// Visual indicator for Cara output confidence level. Shows low/medium/high
// with appropriate colour coding and tooltip text.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";

interface CaraConfidenceIndicatorProps {
  confidence: "low" | "medium" | "high";
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const CONFIDENCE_CONFIG = {
  low: {
    label: "Low confidence",
    description: "Limited information or unclear facts. Requires careful review.",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    bars: 1,
  },
  medium: {
    label: "Medium confidence",
    description: "Enough information to draft but needs review.",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    bars: 2,
  },
  high: {
    label: "High confidence",
    description: "Strong source information. Still requires human approval.",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
    bars: 3,
  },
};

export function CaraConfidenceIndicator({
  confidence,
  showLabel = true,
  size = "sm",
  className,
}: CaraConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[confidence];
  const barHeight = size === "sm" ? "h-2" : "h-3";
  const barWidth = size === "sm" ? "w-1" : "w-1.5";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      title={config.description}
    >
      {/* Signal bars */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              barWidth,
              "rounded-sm transition-colors",
              bar === 1 ? (size === "sm" ? "h-1" : "h-1.5") :
              bar === 2 ? (size === "sm" ? "h-1.5" : "h-2") :
              barHeight,
              bar <= config.bars ? config.dot : "bg-gray-200",
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn(
          config.color,
          size === "sm" ? "text-[9px]" : "text-[10px]",
          "font-medium",
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}
