"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POLICIES & PROCEDURES INTELLIGENCE CARD
// Dashboard card powered by the Policies Intelligence Engine.
// Reg 38 (policies and procedures), Reg 13 (leadership & management).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ChevronRight, AlertTriangle, Brain,
  CheckCircle, Clock, BookOpen, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePoliciesIntelligence } from "@/hooks/use-policies-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function PoliciesRegisterCard() {
  const { data, isLoading } = usePoliciesIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            Policies & Procedures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            Policies & Procedures
          </CardTitle>
          <Link href="/policies" className="text-xs text-brand hover:underline flex items-center gap-1">
            Register <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.active_policies}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.overdue_reviews === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.overdue_reviews === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.overdue_reviews}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.acknowledgement_rate >= 95 ? "bg-green-50" : o.acknowledgement_rate >= 80 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.acknowledgement_rate >= 95 ? "text-green-600" : o.acknowledgement_rate >= 80 ? "text-amber-600" : "text-red-600",
            )}>
              {o.acknowledgement_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Acknowledged</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.categories_covered >= o.total_categories_required ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.categories_covered >= o.total_categories_required ? "text-green-600" : "text-amber-600",
            )}>
              {o.categories_covered}/{o.total_categories_required}
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
        </div>

        {/* ── Coverage by category ────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Policy Coverage
            </p>
            <div className="grid grid-cols-2 gap-1">
              {intel.category_breakdown.map((c) => (
                <div key={c.category} className="flex items-center justify-between rounded border p-1.5 text-xs">
                  <span className="truncate flex-1 text-[11px]">{c.category_label}</span>
                  <div className="flex items-center gap-1 ml-1">
                    {c.overdue_count > 0 ? (
                      <Badge className="text-[9px] bg-red-100 text-red-700 px-1">{c.overdue_count} due</Badge>
                    ) : c.has_coverage ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Badge className="text-[9px] bg-red-100 text-red-700 px-1">Missing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Overdue reviews ─────────────────────────────────────────── */}

        {intel.overdue_policies.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Overdue Reviews
            </p>
            {intel.overdue_policies.slice(0, 3).map((p) => (
              <div key={p.policy_id} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-red-800">{p.title}</span>
                  <Badge className="text-[10px] bg-red-100 text-red-700">{p.days_overdue}d overdue</Badge>
                </div>
                <p className="text-red-700 text-[10px]">
                  Owner: {p.owner_name}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.total_policies}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.due_within_30_days > 0 ? "text-amber-600" : "text-green-600",
            )}>
              {o.due_within_30_days}
            </p>
            <p className="text-[10px] text-muted-foreground">Due 30d</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.draft_count}</p>
            <p className="text-[10px] text-muted-foreground">Drafts</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Policy Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Policy Intelligence ────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Policy Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
