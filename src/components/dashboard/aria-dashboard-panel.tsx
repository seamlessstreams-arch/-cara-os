"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA DASHBOARD PANEL
// Dashboard widget showing ARIA's current intelligence position: pending
// suggestions, incidents needing oversight, high-risk alerts, recently
// approved/rejected items, and a link to the full Review Queue.
//
// Visible to Registered Manager, Responsible Individual, and Deputy Manager.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  ArrowRight,
  CircleDot,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AriaSuggestionSummary {
  id: string;
  title: string;
  risk_level: "urgent" | "high" | "medium" | "low";
  status: string;
  suggestion_type: string;
  related_record_type: string;
  child_name?: string;
  created_at: string;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_SUGGESTIONS: AriaSuggestionSummary[] = [
  {
    id: "as_001",
    title: "Management oversight required — physical intervention incident",
    risk_level: "urgent",
    status: "awaiting_review",
    suggestion_type: "management_oversight",
    related_record_type: "incident",
    child_name: "Alex W",
    created_at: "2026-05-05T08:15:00Z",
  },
  {
    id: "as_002",
    title: "Risk assessment review — escalating behaviour pattern",
    risk_level: "high",
    status: "awaiting_review",
    suggestion_type: "risk_review",
    related_record_type: "incident",
    child_name: "Alex W",
    created_at: "2026-05-05T08:15:00Z",
  },
  {
    id: "as_003",
    title: "Staff debrief recommended — emotional incident",
    risk_level: "medium",
    status: "awaiting_review",
    suggestion_type: "staff_debrief",
    related_record_type: "incident",
    child_name: "Jordan M",
    created_at: "2026-05-04T16:30:00Z",
  },
  {
    id: "as_004",
    title: "Key work session — capture child's wishes and feelings",
    risk_level: "medium",
    status: "awaiting_review",
    suggestion_type: "key_work",
    related_record_type: "incident",
    child_name: "Casey T",
    created_at: "2026-05-04T14:00:00Z",
  },
  {
    id: "as_005",
    title: "Placement plan review — changed presentation",
    risk_level: "high",
    status: "approved",
    suggestion_type: "plan_review",
    related_record_type: "incident",
    child_name: "Alex W",
    created_at: "2026-05-03T10:00:00Z",
  },
  {
    id: "as_006",
    title: "Notification consideration — repeated incidents",
    risk_level: "high",
    status: "rejected",
    suggestion_type: "notification",
    related_record_type: "incident",
    child_name: "Jordan M",
    created_at: "2026-05-02T11:00:00Z",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { label: string; colour: string; bg: string; dot: string }> = {
  urgent:  { label: "Urgent",  colour: "text-red-700",    bg: "bg-red-100",    dot: "bg-red-500"    },
  high:    { label: "High",    colour: "text-orange-700", bg: "bg-orange-100", dot: "bg-orange-500" },
  medium:  { label: "Medium",  colour: "text-amber-700",  bg: "bg-amber-100",  dot: "bg-amber-500"  },
  low:     { label: "Low",     colour: "text-[var(--cs-text-secondary)]",  bg: "bg-[var(--cs-surface)]",  dot: "bg-[var(--cs-text-muted)]"  },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
  awaiting_review:     { label: "Awaiting review",   icon: Clock,        colour: "text-amber-600" },
  approved:            { label: "Approved",           icon: CheckCircle2, colour: "text-emerald-600" },
  amended_and_approved:{ label: "Amended & approved", icon: CheckCircle2, colour: "text-emerald-600" },
  rejected:            { label: "Rejected",           icon: XCircle,      colour: "text-red-600" },
  no_action_required:  { label: "No action required", icon: Eye,          colour: "text-[var(--cs-text-muted)]" },
  committed:           { label: "Committed",          icon: CheckCircle2, colour: "text-blue-600" },
  draft:               { label: "Draft",              icon: Clock,        colour: "text-[var(--cs-text-muted)]" },
};

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    management_oversight: "Oversight",
    risk_review: "Risk review",
    plan_review: "Plan review",
    behaviour_support_review: "BSP review",
    key_work: "Key work",
    safeguarding_review: "Safeguarding",
    staff_debrief: "Staff debrief",
    notification: "Notification",
    task: "Task",
    linked_record_review: "Linked record",
    handover_update: "Handover",
    incident_analysis: "Analysis",
  };
  return labels[type] ?? type;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AriaDashboardPanel() {
  const suggestions = DEMO_SUGGESTIONS;

  const counts = useMemo(() => {
    const pending = suggestions.filter((s) => s.status === "awaiting_review");
    const urgent = pending.filter((s) => s.risk_level === "urgent" || s.risk_level === "high");
    const approved = suggestions.filter((s) => s.status === "approved" || s.status === "amended_and_approved");
    const rejected = suggestions.filter((s) => s.status === "rejected");

    return {
      pending: pending.length,
      urgent: urgent.length,
      approved: approved.length,
      rejected: rejected.length,
      total: suggestions.length,
    };
  }, [suggestions]);

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === "awaiting_review"),
    [suggestions],
  );

  return (
    <Card className="border-[var(--cs-aria-gold-soft)] bg-gradient-to-b from-[var(--cs-aria-gold-bg)]/30 to-[var(--cs-surface-elevated)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-1.5">
              <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            </div>
            ARIA Intelligence
          </CardTitle>
          <Link
            href="/aria/review"
            className="text-xs font-medium text-[var(--cs-aria-gold)] hover:text-[var(--cs-aria-gold)]/80 flex items-center gap-1 transition-colors"
          >
            Review Queue
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-2">
          <StatPill
            label="Pending"
            value={counts.pending}
            colour="text-amber-700"
            bg="bg-amber-50"
            pulse={counts.urgent > 0}
          />
          <StatPill
            label="Urgent"
            value={counts.urgent}
            colour="text-red-700"
            bg="bg-red-50"
            pulse={counts.urgent > 0}
          />
          <StatPill
            label="Approved"
            value={counts.approved}
            colour="text-emerald-700"
            bg="bg-emerald-50"
          />
          <StatPill
            label="Rejected"
            value={counts.rejected}
            colour="text-[var(--cs-text-secondary)]"
            bg="bg-[var(--cs-surface)]"
          />
        </div>

        {/* Pending suggestions */}
        {pendingSuggestions.length > 0 ? (
          <div className="space-y-2">
            {pendingSuggestions.slice(0, 4).map((s) => {
              const risk = RISK_CONFIG[s.risk_level] ?? RISK_CONFIG.medium;
              return (
                <Link
                  key={s.id}
                  href={`/aria/review/${s.id}`}
                  className="flex items-start gap-3 rounded-xl bg-[var(--cs-surface-elevated)] border border-[var(--cs-border-subtle)] px-3 py-2.5 hover:bg-[var(--cs-surface)] transition-colors group"
                >
                  <div className={cn("mt-1 h-2 w-2 rounded-full shrink-0", risk.dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[var(--cs-navy)] line-clamp-1 group-hover:text-[var(--cs-aria-gold)] transition-colors">
                      {s.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={cn("text-[10px] px-1.5 py-0", risk.bg, risk.colour)}>
                        {risk.label}
                      </Badge>
                      <span className="text-[10px] text-[var(--cs-text-muted)]">
                        {typeLabel(s.suggestion_type)}
                      </span>
                      {s.child_name && (
                        <span className="text-[10px] text-[var(--cs-text-muted)]">
                          &middot; {s.child_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)] shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
                </Link>
              );
            })}
            {pendingSuggestions.length > 4 && (
              <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
                + {pendingSuggestions.length - 4} more pending
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 px-4 py-3 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-emerald-700 font-medium">All ARIA suggestions reviewed</p>
          </div>
        )}

        {/* CTA */}
        <Link href="/aria/review" className="block">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-[var(--cs-aria-gold-soft)] text-[var(--cs-aria-gold)] hover:bg-[var(--cs-aria-gold-bg)]">
            <Eye className="h-3.5 w-3.5" />
            Open ARIA Review Queue
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatPill({
  label, value, colour, bg, pulse,
}: {
  label: string;
  value: number;
  colour: string;
  bg: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn("rounded-lg px-2 py-1.5 text-center relative", bg)}>
      <div className={cn("text-lg font-bold tabular-nums", colour)}>{value}</div>
      <div className="text-[10px] text-[var(--cs-text-muted)] font-medium">{label}</div>
      {pulse && value > 0 && (
        <CircleDot className="absolute top-1 right-1 h-2.5 w-2.5 text-red-500 animate-pulse" />
      )}
    </div>
  );
}
