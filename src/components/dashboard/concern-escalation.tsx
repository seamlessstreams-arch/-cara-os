"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONCERN ESCALATION TRACKER
// Dashboard widget that aggregates unresolved concerns from welfare checks,
// incidents, and safeguarding referrals. Gives RM instant visibility of
// open concerns requiring action.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIncidents } from "@/hooks/use-incidents";
import { useWelfareChecks } from "@/hooks/use-welfare-checks";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatRelative } from "@/lib/utils";
import {
  AlertTriangle, CheckCircle2, Loader2, Shield, Eye,
  ChevronRight, Clock, ArrowUpRight, Flame,
} from "lucide-react";

interface ConcernItem {
  id: string;
  type: "incident" | "welfare" | "safeguarding";
  title: string;
  child?: string;
  severity: "critical" | "high" | "medium" | "low";
  date: string;
  status: string;
  link: string;
}

const SEVERITY_CONFIG = {
  critical: { color: "text-red-700", bg: "bg-red-100", border: "border-red-200" },
  high:     { color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" },
  medium:   { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  low:      { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200" },
};

export function ConcernEscalation() {
  const { data: incidentsData, isLoading: incLoading } = useIncidents();
  const { data: welfareData, isLoading: wcLoading } = useWelfareChecks();

  const isLoading = incLoading || wcLoading;

  const incidents = incidentsData?.data ?? [];
  const welfareChecks = welfareData?.checks ?? [];

  // Build concern items
  const concerns: ConcernItem[] = [];

  // Open incidents needing oversight
  incidents
    .filter((i) => i.status === "open" || (i.requires_oversight && !i.oversight_by))
    .forEach((i) => {
      concerns.push({
        id: `inc_${i.id}`,
        type: "incident",
        title: `${i.reference} — ${i.type.replace(/_/g, " ")}`,
        child: i.child_id ? getYPName(i.child_id) : undefined,
        severity: i.severity as ConcernItem["severity"],
        date: i.date,
        status: i.requires_oversight && !i.oversight_by ? "Needs oversight" : "Open",
        link: "/incidents",
      });
    });

  // Welfare check concerns
  welfareChecks
    .filter((c) => c.status === "concern" || c.status === "not_in_room" || c.physical_marks_noted)
    .forEach((c) => {
      concerns.push({
        id: `wc_${c.id}`,
        type: "welfare",
        title: c.physical_marks_noted
          ? `Physical marks noted — ${c.marks_description || "See details"}`
          : c.status === "not_in_room"
          ? "Child not in room"
          : c.concern_details || "Welfare concern",
        child: getYPName(c.child_id),
        severity: c.physical_marks_noted ? "high" : c.status === "not_in_room" ? "critical" : "medium",
        date: c.check_date,
        status: c.concern_escalated ? "Escalated" : "Open",
        link: "/welfare-checks",
      });
    });

  // Sort by severity then date
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  concerns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.date.localeCompare(a.date));

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Flame className="h-4 w-4 text-red-500" />
            Open Concerns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(concerns.length > 0 && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Flame className="h-4 w-4 text-red-500" />
            Open Concerns
          </CardTitle>
          {concerns.length > 0 && (
            <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full animate-pulse">
              {concerns.length} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {concerns.length === 0 ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-emerald-700">No open concerns</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">All concerns resolved or escalated</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {concerns.slice(0, 5).map((concern) => {
              const sev = SEVERITY_CONFIG[concern.severity];
              return (
                <Link key={concern.id} href={concern.link}>
                  <div className={cn(
                    "flex items-start gap-2.5 rounded-xl px-3 py-2.5 hover:bg-[var(--cs-surface)] transition-colors cursor-pointer border",
                    concern.severity === "critical" ? "bg-red-50/50 border-red-100" : "bg-white border-[var(--cs-border-subtle)]",
                  )}>
                    <AlertTriangle className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", sev.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[var(--cs-navy)] line-clamp-1">
                        {concern.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {concern.child && (
                          <span className="text-[10px] text-[var(--cs-cara-gold)]">{concern.child}</span>
                        )}
                        <span className="text-[10px] text-[var(--cs-text-muted)]">{formatRelative(concern.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={cn("text-[9px] rounded-full border-0", sev.bg, sev.color)}>
                        {concern.severity}
                      </Badge>
                      <ChevronRight className="h-3 w-3 text-[var(--cs-text-gentle)]" />
                    </div>
                  </div>
                </Link>
              );
            })}
            {concerns.length > 5 && (
              <Link href="/incidents" className="block text-center text-[10px] text-blue-600 hover:underline py-1">
                + {concerns.length - 5} more concerns →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
