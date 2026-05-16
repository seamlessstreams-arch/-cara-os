"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Safety Panel Component
//
// Displays the safety assessment for generated content:
//   - Overall score (0-100)
//   - Pass/fail status
//   - Flags with severity levels
//   - Warnings and blockers
//   - Recommendations for the user
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle,
  AlertCircle, Info, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SafetyAssessment } from "@/lib/aria-studio/types";

interface StudioSafetyPanelProps {
  safety: SafetyAssessment;
  compact?: boolean;
}

export function StudioSafetyPanel({ safety, compact = false }: StudioSafetyPanelProps) {
  const passed = safety.passed;
  const score = safety.score;

  // Determine overall status
  const statusConfig = passed
    ? score >= 90
      ? { icon: ShieldCheck, label: "Safe", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" }
      : { icon: Shield, label: "Passed with warnings", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" }
    : { icon: ShieldAlert, label: "Blocked", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };

  const StatusIcon = statusConfig.icon;

  // Compact mode — just a badge
  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1", statusConfig.bg, statusConfig.border)}>
        <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.color)} />
        <span className={cn("text-xs font-medium", statusConfig.color)}>
          {statusConfig.label} ({score}/100)
        </span>
      </div>
    );
  }

  // Full panel
  return (
    <div className={cn("rounded-xl border p-4", statusConfig.bg, statusConfig.border)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
          <span className={cn("text-sm font-semibold", statusConfig.color)}>
            Safety: {statusConfig.label}
          </span>
        </div>
        <Badge className={cn("text-xs", statusConfig.bg, statusConfig.color, statusConfig.border)}>
          Score: {score}/100
        </Badge>
      </div>

      {/* Blockers */}
      {safety.blockers.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {safety.blockers.map((blocker, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-red-100 p-2.5">
              <AlertCircle className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 font-medium">{blocker}</p>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {safety.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {safety.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-100/50 p-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Flags */}
      {safety.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {safety.flags.map((flag, i) => {
            const severityStyles = {
              critical: "bg-red-100 text-red-700 border-red-200",
              warning: "bg-amber-100 text-amber-700 border-amber-200",
              info: "bg-blue-100 text-blue-700 border-blue-200",
            };
            return (
              <Badge
                key={i}
                className={cn("text-[10px]", severityStyles[flag.severity] ?? severityStyles.info)}
                title={flag.message}
              >
                {flag.code}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {safety.recommendations.length > 0 && (
        <div className="mt-3 space-y-1">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">Recommendations</h4>
          {safety.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Info className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--cs-text-secondary)]">{rec}</p>
            </div>
          ))}
        </div>
      )}

      {/* All clear */}
      {passed && safety.flags.length === 0 && safety.warnings.length === 0 && (
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-xs text-emerald-700">All safety checks passed. Content is ready for review.</p>
        </div>
      )}
    </div>
  );
}
