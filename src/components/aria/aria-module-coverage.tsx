"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaModuleCoverage
//
// Widget showing ARIA adoption across Cornerstone modules. Helps managers
// see which areas of the platform are leveraging ARIA and where adoption
// could improve.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { useAriaActivity } from "@/hooks/use-aria-activity";
import {
  Sparkles,
  BookOpen,
  AlertTriangle,
  Heart,
  ClipboardCheck,
  Users,
  FileText,
  Shield,
  Calendar,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface AriaModuleCoverageProps {
  homeId?: string;
  days?: number;
  className?: string;
}

// Map command prefixes to modules
const MODULE_MAP: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  daily_log: {
    label: "Daily Log",
    icon: BookOpen,
    color: "text-blue-600",
  },
  incident: {
    label: "Incidents",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  key_work: {
    label: "Key Work",
    icon: Heart,
    color: "text-pink-500",
  },
  management: {
    label: "Oversight",
    icon: ClipboardCheck,
    color: "text-indigo-600",
  },
  supervision: {
    label: "Supervision",
    icon: Users,
    color: "text-purple-600",
  },
  care: {
    label: "Care Plans",
    icon: FileText,
    color: "text-teal-600",
  },
  safeguarding: {
    label: "Safeguarding",
    icon: Shield,
    color: "text-orange-600",
  },
  handover: {
    label: "Handover",
    icon: Calendar,
    color: "text-emerald-600",
  },
};

function commandToModule(commandId: string): string | null {
  if (commandId.startsWith("draft_daily_log") || commandId.includes("daily_log"))
    return "daily_log";
  if (commandId.includes("incident") || commandId.includes("risk"))
    return "incident";
  if (commandId.includes("key_work")) return "key_work";
  if (commandId.includes("management") || commandId.includes("oversight"))
    return "management";
  if (commandId.includes("supervision")) return "supervision";
  if (commandId.includes("care") || commandId.includes("plan"))
    return "care";
  if (commandId.includes("safeguard")) return "safeguarding";
  if (commandId.includes("handover")) return "handover";
  return null;
}

export function AriaModuleCoverage({
  homeId,
  days = 30,
  className,
}: AriaModuleCoverageProps) {
  const { data: stats, isLoading } = useAriaActivity({ homeId, days });

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--cs-border)] bg-white p-5",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-aria-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">
            Loading module coverage...
          </span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Count usage per module from top commands
  const moduleCounts = new Map<string, number>();
  for (const cmd of stats.topCommands) {
    const mod = commandToModule(cmd.commandId);
    if (mod) {
      moduleCounts.set(mod, (moduleCounts.get(mod) ?? 0) + cmd.count);
    }
  }

  // Build module list with coverage status
  const modules = Object.entries(MODULE_MAP).map(([key, config]) => ({
    key,
    ...config,
    count: moduleCounts.get(key) ?? 0,
    active: (moduleCounts.get(key) ?? 0) > 0,
  }));

  const activeCount = modules.filter((m) => m.active).length;
  const totalModules = modules.length;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          <span className="text-sm font-bold text-[var(--cs-navy)]">
            Module Coverage
          </span>
        </div>
        <span className="text-[10px] font-medium text-[var(--cs-text-muted)]">
          {activeCount}/{totalModules} active
        </span>
      </div>

      {/* Module grid */}
      <div className="p-4 grid grid-cols-2 gap-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 border transition-colors",
                mod.active
                  ? "border-[var(--cs-border)] bg-white"
                  : "border-dashed border-gray-200 bg-gray-50/50",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  mod.active ? mod.color : "text-gray-300",
                )}
              />
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-xs font-medium truncate",
                    mod.active
                      ? "text-[var(--cs-navy)]"
                      : "text-[var(--cs-text-gentle)]",
                  )}
                >
                  {mod.label}
                </div>
                {mod.active ? (
                  <div className="text-[10px] text-[var(--cs-text-muted)]">
                    {mod.count} command{mod.count !== 1 ? "s" : ""}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400">Not used</div>
                )}
              </div>
              {mod.active ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-[var(--cs-border)] bg-gray-50/50">
        <div className="text-[10px] text-[var(--cs-text-muted)]">
          {activeCount === totalModules ? (
            <span className="text-green-600 font-medium">
              Full coverage — all modules using ARIA
            </span>
          ) : (
            <>
              {totalModules - activeCount} module
              {totalModules - activeCount !== 1 ? "s" : ""} not yet using ARIA
              in the last {days} days
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Expose pure helpers for testing
export const _testing = { commandToModule, MODULE_MAP };
