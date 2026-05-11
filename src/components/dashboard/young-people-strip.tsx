"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — YOUNG PEOPLE AT-A-GLANCE STRIP
// Dashboard widget showing each child's current status at a glance.
// Key worker, risk flags, last log, active meds, open incidents.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useYoungPeople, type YPEnriched } from "@/hooks/use-young-people";
import { cn, formatRelative } from "@/lib/utils";
import {
  Heart, AlertTriangle, Pill, BookOpen, Shield,
  MapPin, Loader2, ChevronRight, Clock, User,
} from "lucide-react";

// ── Risk flag colours ───────────────────────────────────────────────────────

const RISK_FLAG_COLORS: Record<string, string> = {
  "missing from care":    "bg-red-100 text-red-700 border-red-200",
  "self-harm":            "bg-orange-100 text-orange-700 border-orange-200",
  "exploitation concern": "bg-purple-100 text-purple-700 border-purple-200",
  "medication refusal":   "bg-amber-100 text-amber-700 border-amber-200",
  "sleep disturbance":    "bg-indigo-100 text-indigo-700 border-indigo-200",
};

function getRiskFlagColor(flag: string): string {
  return RISK_FLAG_COLORS[flag.toLowerCase()] ?? "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)] border-[var(--cs-border)]";
}

// ── Single young person card ────────────────────────────────────────────────

function YPCard({ yp }: { yp: YPEnriched }) {
  const hasRisk = yp.risk_flags_count > 0;
  const hasMissing = yp.risk_flags.some((f) => f.toLowerCase().includes("missing"));

  return (
    <Link
      href={`/young-people/${yp.id}`}
      className={cn(
        "flex flex-col rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 group",
        hasMissing
          ? "border-red-200 bg-red-50/50"
          : hasRisk
            ? "border-amber-200 bg-amber-50/30"
            : "border-[var(--cs-border)] bg-white",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={`${yp.first_name} ${yp.last_name}`} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--cs-navy)] truncate">
              {yp.preferred_name || yp.first_name}
            </span>
            <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums">
              {yp.age}y
            </span>
            {hasMissing && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 animate-pulse">
                <MapPin className="h-3 w-3" />
                MFC
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <User className="h-3 w-3 text-[var(--cs-text-muted)]" />
            <span className="text-[10px] text-[var(--cs-text-muted)] truncate">
              {yp.key_worker ? `${yp.key_worker.first_name} ${yp.key_worker.last_name}` : "No key worker"}
            </span>
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Risk flags */}
      {yp.risk_flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {yp.risk_flags.map((flag) => (
            <Badge
              key={flag}
              className={cn("text-[9px] rounded-full border px-1.5 py-0 font-medium", getRiskFlagColor(flag))}
            >
              {flag}
            </Badge>
          ))}
        </div>
      )}

      {/* Status indicators */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[var(--cs-border-subtle)]">
        <StatusIndicator
          icon={Shield}
          label="Incidents"
          value={yp.open_incidents}
          alert={yp.open_incidents > 0}
          alertColor="text-red-600"
        />
        <StatusIndicator
          icon={Pill}
          label="Meds"
          value={yp.active_medications}
          alert={false}
          alertColor=""
        />
        <StatusIndicator
          icon={BookOpen}
          label="Last log"
          value={yp.last_log_date ? formatRelative(yp.last_log_date) : "None"}
          alert={!yp.last_log_date}
          alertColor="text-amber-600"
          isText
        />
      </div>
    </Link>
  );
}

function StatusIndicator({
  icon: Icon,
  label,
  value,
  alert,
  alertColor,
  isText,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  alert: boolean;
  alertColor: string;
  isText?: boolean;
}) {
  return (
    <div className="text-center">
      <Icon className={cn("h-3 w-3 mx-auto mb-0.5", alert ? alertColor : "text-[var(--cs-text-muted)]")} />
      <div className={cn(
        "text-xs font-semibold tabular-nums",
        alert ? alertColor : "text-[var(--cs-text-secondary)]",
      )}>
        {value}
      </div>
      <div className="text-[9px] text-[var(--cs-text-muted)]">{label}</div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function YoungPeopleStrip() {
  const { data, isLoading } = useYoungPeople("current");
  const children = data?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Heart className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Young People
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

  if (children.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Heart className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Young People — At a Glance
            <Badge className="bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-0 text-[10px] rounded-full">
              {children.length}
            </Badge>
          </CardTitle>
          <Link href="/young-people" className="text-[11px] text-blue-600 hover:underline">
            All profiles →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((yp) => (
            <YPCard key={yp.id} yp={yp} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
