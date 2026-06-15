"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Uncertainty register panel.
// Known / unknown / missing, grouped, each with confidence, clarification action
// and review date. Makes the boundary of what we actually know explicit.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, HelpCircle, AlertCircle } from "lucide-react";
import { ConfidencePill } from "./confidence-pill";
import type { UncertaintyItem, UncertaintyStatus } from "@/lib/cara-reasoning/types";

const GROUPS: Array<{ status: UncertaintyStatus; label: string; Icon: React.ComponentType<{ className?: string }>; tone: string }> = [
  { status: "known", label: "What we know", Icon: CheckCircle2, tone: "text-emerald-600" },
  { status: "unknown", label: "What we don't yet know", Icon: HelpCircle, tone: "text-amber-600" },
  { status: "missing", label: "What is missing", Icon: AlertCircle, tone: "text-red-600" },
];

export function UncertaintyRegisterPanel({ items }: { items: UncertaintyItem[] }) {
  if (!items.length) return <p className="text-sm text-[var(--cs-text-muted)]">No uncertainty items recorded.</p>;
  return (
    <div className="space-y-4">
      {GROUPS.map(({ status, label, Icon, tone }) => {
        const group = items.filter((i) => i.status === status);
        if (!group.length) return null;
        return (
          <div key={status}>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">
              <Icon className={cn("h-3.5 w-3.5", tone)} />
              {label}
            </p>
            <div className="divide-y divide-[var(--cs-border-subtle)]">
              {group.map((u, i) => (
                <div key={i} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--cs-navy)]">{u.area}</p>
                    <ConfidencePill level={u.confidence} short />
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--cs-text)]">{u.detail}</p>
                  {u.clarificationAction && (
                    <p className="mt-1 text-xs text-[var(--cs-text-muted)]">
                      Clarify: {u.clarificationAction}
                      {u.reviewBy ? ` · by ${u.reviewBy}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
