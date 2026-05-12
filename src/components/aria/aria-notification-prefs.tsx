"use client";

// ══════════════════════════════════════════════════════════════════════════════
// AriaNotificationPrefs
//
// Per-user notification preferences for ARIA alerts. Controls which types of
// ARIA insights, suggestions, and review requests generate notifications.
// Persisted via localStorage with API sync when available.
//
// Usage:
//   <AriaNotificationPrefs userId="staff_darren" />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellOff,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Brain,
  Users,
  Eye,
  Sparkles,
  Save,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  defaultEnabled: boolean;
}

interface NotificationPreferences {
  [categoryId: string]: boolean;
}

// ── Categories ─────────────────────────────────────────────────────────────

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: "critical_safeguarding",
    label: "Critical Safeguarding",
    description: "Immediate alerts when ARIA detects safeguarding concerns requiring urgent action.",
    icon: Shield,
    defaultEnabled: true,
  },
  {
    id: "management_oversight",
    label: "Management Oversight Required",
    description: "Notifications when incidents or records need management oversight or sign-off.",
    icon: Eye,
    defaultEnabled: true,
  },
  {
    id: "risk_escalation",
    label: "Risk Escalation",
    description: "Alerts when ARIA detects escalating risk patterns across incidents or behaviours.",
    icon: AlertTriangle,
    defaultEnabled: true,
  },
  {
    id: "pending_approvals",
    label: "Pending Approvals",
    description: "Reminders about ARIA outputs waiting for your review and approval.",
    icon: Clock,
    defaultEnabled: true,
  },
  {
    id: "compliance_gaps",
    label: "Compliance Gaps",
    description: "Alerts when supervision, training, or statutory requirements are overdue.",
    icon: CheckCircle2,
    defaultEnabled: true,
  },
  {
    id: "behaviour_patterns",
    label: "Behaviour Patterns",
    description: "Insights when ARIA detects recurring patterns in incident or daily log data.",
    icon: Brain,
    defaultEnabled: true,
  },
  {
    id: "staffing_concerns",
    label: "Staffing Concerns",
    description: "Alerts about staff wellbeing, training gaps, or workforce planning issues.",
    icon: Users,
    defaultEnabled: false,
  },
  {
    id: "positive_trends",
    label: "Positive Trends",
    description: "Notifications when ARIA identifies positive progress or improved outcomes.",
    icon: Sparkles,
    defaultEnabled: false,
  },
];

const STORAGE_KEY = "cs_aria_notification_prefs";

// ── Helpers ────────────────────────────────────────────────────────────────

export function getDefaultPrefs(): NotificationPreferences {
  const prefs: NotificationPreferences = {};
  for (const cat of NOTIFICATION_CATEGORIES) {
    prefs[cat.id] = cat.defaultEnabled;
  }
  return prefs;
}

export function countEnabled(prefs: NotificationPreferences): number {
  return Object.values(prefs).filter(Boolean).length;
}

// ── Component ──────────────────────────────────────────────────────────────

interface AriaNotificationPrefsProps {
  userId?: string;
  className?: string;
}

export function AriaNotificationPrefs({
  userId,
  className,
}: AriaNotificationPrefsProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getDefaultPrefs());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Use defaults
    }
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setPrefs((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
    setSaved(false);
  }, []);

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Silent fail
    }
  }

  const enabledCount = countEnabled(prefs);

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          <h3 className="text-sm font-bold text-[var(--cs-navy)]">
            ARIA Notification Preferences
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--cs-text-muted)]">
            {enabledCount}/{NOTIFICATION_CATEGORIES.length} active
          </span>
          <button
            onClick={handleSave}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors",
              saved
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[var(--cs-aria-gold)] text-white hover:bg-[var(--cs-navy)]",
            )}
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-3 w-3" /> Saved
              </>
            ) : (
              <>
                <Save className="h-3 w-3" /> Save
              </>
            )}
          </button>
        </div>
      </div>

      <p className="px-5 pb-3 text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
        Choose which ARIA alerts and insights you receive. Critical safeguarding
        and management oversight notifications cannot be fully disabled for
        Registered Managers.
      </p>

      {/* Categories */}
      <div className="divide-y divide-[var(--cs-border-subtle)]">
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const enabled = prefs[cat.id] ?? cat.defaultEnabled;
          const isMandatory =
            (cat.id === "critical_safeguarding" || cat.id === "management_oversight");

          return (
            <div
              key={cat.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3 transition-colors",
                enabled ? "bg-white" : "bg-slate-50/50",
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                enabled ? "bg-[var(--cs-aria-gold-bg)]" : "bg-slate-100",
              )}>
                <Icon className={cn(
                  "h-4 w-4",
                  enabled ? "text-[var(--cs-aria-gold)]" : "text-[var(--cs-text-gentle)]",
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-semibold",
                    enabled ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]",
                  )}>
                    {cat.label}
                  </span>
                  {isMandatory && (
                    <span className="text-[8px] rounded-full bg-red-100 text-red-700 px-1.5 py-0.5 font-semibold uppercase">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed mt-0.5">
                  {cat.description}
                </p>
              </div>
              <button
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                  enabled ? "bg-[var(--cs-aria-gold)]" : "bg-gray-300",
                )}
                aria-checked={enabled}
                role="switch"
                aria-label={`Toggle ${cat.label}`}
              >
                <span
                  className={cn(
                    "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                    enabled ? "translate-x-[18px]" : "translate-x-[3px]",
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Expose for testing
export const _testing = { NOTIFICATION_CATEGORIES, getDefaultPrefs, countEnabled };
