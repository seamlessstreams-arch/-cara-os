"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIVE ACTIVITY FEED
// Real-time stream of events across the home. Shows on the dashboard as a
// scrollable timeline of what's been happening — incidents, tasks, meds, logs.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActivityFeed, type FeedItem } from "@/hooks/use-activity-feed";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, formatRelative } from "@/lib/utils";
import {
  Activity, AlertTriangle, CheckCircle2, BookOpen, Pill,
  ArrowRightLeft, MapPin, Users, FileText, Shield, Clock,
  ChevronRight, Heart, Loader2,
} from "lucide-react";

// ── Type icons ───────────────────────────────────────────────────────────────

const TYPE_ICON: Record<FeedItem["type"], React.ElementType> = {
  incident:     AlertTriangle,
  task:         CheckCircle2,
  daily_log:    BookOpen,
  medication:   Pill,
  handover:     ArrowRightLeft,
  safeguarding: Shield,
  training:     Users,
  document:     FileText,
  shift:        Clock,
  form:         FileText,
};

const TYPE_COLOR: Record<FeedItem["type"], string> = {
  incident:     "bg-orange-100 text-orange-600",
  task:         "bg-blue-100 text-blue-600",
  daily_log:    "bg-emerald-100 text-emerald-600",
  medication:   "bg-teal-100 text-teal-600",
  handover:     "bg-amber-100 text-amber-600",
  safeguarding: "bg-red-100 text-red-600",
  training:     "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  document:     "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
  shift:        "bg-indigo-100 text-indigo-600",
  form:         "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-400",
  low:      "bg-[var(--cs-text-gentle)]",
  info:     "bg-blue-300",
};

// ── Feed item component ──────────────────────────────────────────────────────

function FeedItemRow({ item }: { item: FeedItem }) {
  const Icon = TYPE_ICON[item.type] || Activity;

  // Format time from timestamp
  const time = (() => {
    try {
      const d = new Date(item.timestamp);
      return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  })();

  const dateLabel = (() => {
    try {
      return formatRelative(item.timestamp.slice(0, 10));
    } catch {
      return "";
    }
  })();

  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--cs-surface)] transition-colors group"
    >
      {/* Icon */}
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5",
        TYPE_COLOR[item.type],
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">
            {item.action}
          </span>
          {item.severity && item.severity !== "info" && (
            <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[item.severity])} />
          )}
        </div>
        <p className="text-[13px] font-medium text-[var(--cs-navy)] mt-0.5 leading-snug line-clamp-1">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.actor_id && (
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              {getStaffName(item.actor_id).split(" ")[0]}
            </span>
          )}
          {item.child_id && (
            <span className="text-[10px] text-[var(--cs-aria-gold)] flex items-center gap-0.5 font-medium">
              <Heart className="h-2.5 w-2.5" />
              {getYPName(item.child_id)}
            </span>
          )}
          <span className="text-[10px] text-[var(--cs-text-muted)]">
            {time}{dateLabel ? ` · ${dateLabel}` : ""}
          </span>
        </div>
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-gentle)] shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const { data, isLoading } = useActivityFeed();
  const items = (data?.data ?? []).slice(0, limit);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Activity className="h-4 w-4 text-indigo-500" />
            Live Activity
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
          </CardTitle>
          <span className="text-[10px] text-[var(--cs-text-muted)]">Auto-refreshes every 30s</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
            <p className="text-sm font-medium text-[var(--cs-text-muted)]">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--cs-border-subtle)] max-h-[480px] overflow-y-auto">
            {items.map((item) => (
              <FeedItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
