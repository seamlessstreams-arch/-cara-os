"use client";

/**
 * CareEventsPanel — reusable panel for displaying care events in context.
 *
 * Drop this into any platform page to show recent care events routed to
 * that area. Connects the 250+ operational pages to the Care Events pipeline.
 *
 * Usage:
 *   <CareEventsPanel
 *     title="Related Care Events"
 *     category="safeguarding"
 *     childId="yp_123"
 *     days={28}
 *   />
 */

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Lock,
  RotateCcw,
  Eye,
  Shield,
} from "lucide-react";
import { useCareEvents } from "@/hooks/use-care-events";
import { cn, formatDate } from "@/lib/utils";
import type { CareEventCategory, CareEventStatus } from "@/types/care-events";
import { CARE_EVENT_STATUS_LABEL, CARE_EVENT_CATEGORY_LABEL } from "@/types/care-events";

// ── Status styling ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  draft:                   { bg: "bg-slate-100", text: "text-slate-700" },
  submitted:               { bg: "bg-blue-100", text: "text-blue-700" },
  routing:                 { bg: "bg-blue-100", text: "text-blue-700" },
  routed:                  { bg: "bg-indigo-100", text: "text-indigo-700" },
  manager_review_required: { bg: "bg-amber-100", text: "text-amber-700" },
  returned:                { bg: "bg-orange-100", text: "text-orange-700" },
  verified:                { bg: "bg-emerald-100", text: "text-emerald-700" },
  locked:                  { bg: "bg-purple-100", text: "text-purple-700" },
  routing_failed:          { bg: "bg-red-100", text: "text-red-700" },
};

const STATUS_ICON: Record<string, React.ElementType> = {
  draft: Clock,
  submitted: Clock,
  routing: Clock,
  routed: CheckCircle2,
  manager_review_required: Eye,
  returned: RotateCcw,
  verified: CheckCircle2,
  locked: Lock,
  routing_failed: AlertTriangle,
};

// ── Category styling ──────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  safeguarding: "bg-red-100 text-red-700",
  missing_episode: "bg-red-100 text-red-700",
  physical_intervention: "bg-orange-100 text-orange-700",
  restraint: "bg-orange-100 text-orange-700",
  behaviour: "bg-amber-100 text-amber-700",
  health: "bg-blue-100 text-blue-700",
  medication: "bg-blue-100 text-blue-700",
  complaint: "bg-purple-100 text-purple-700",
  general: "bg-slate-100 text-slate-700",
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CareEventsPanelProps {
  /** Panel heading */
  title?: string;
  /** Filter by one or more categories */
  category?: CareEventCategory | CareEventCategory[];
  /** Filter by child/young person ID */
  childId?: string;
  /** Only show events from the last N days (default: 28) */
  days?: number;
  /** Only show events with this status */
  status?: CareEventStatus;
  /** Default to collapsed */
  defaultCollapsed?: boolean;
  /** Max rows to show before truncating */
  maxRows?: number;
  /** Additional class on the card */
  className?: string;
}

export function CareEventsPanel({
  title = "Related Care Events",
  category,
  childId,
  days = 28,
  status,
  defaultCollapsed = false,
  maxRows = 5,
  className,
}: CareEventsPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  // Fetch with first category if array (API supports one at a time)
  const primaryCategory = Array.isArray(category) ? category[0] : category;

  const { data, isLoading, isError } = useCareEvents({
    category: primaryCategory,
    child_id: childId,
    days,
    status,
    limit: showAll ? 50 : maxRows + 1,
  });

  // Filter to requested categories client-side (when multiple given)
  const allEvents = data?.data ?? [];
  const filteredEvents =
    Array.isArray(category) && category.length > 1
      ? allEvents.filter((e) => (category as CareEventCategory[]).includes(e.category))
      : allEvents;

  const visibleEvents = showAll ? filteredEvents : filteredEvents.slice(0, maxRows);
  const hasMore = filteredEvents.length > maxRows;
  const total = data?.meta?.total ?? 0;

  // Build the "new care event" link — pre-select category in the care events UI
  const newEventHref = primaryCategory
    ? `/care-events?new=1&category=${primaryCategory}${childId ? `&child_id=${childId}` : ""}`
    : `/care-events?new=1${childId ? `&child_id=${childId}` : ""}`;

  return (
    <Card className={cn("border-slate-200", className)}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <CardTitle className="text-sm font-semibold text-slate-700 truncate">
              {title}
            </CardTitle>
            {!isLoading && total > 0 && (
              <Badge className="bg-slate-100 text-slate-600 text-xs shrink-0">
                {total}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={newEventHref}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" />
                Add
              </Button>
            </Link>
            <Link href="/care-events">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                View all
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="text-slate-400 hover:text-slate-600"
              aria-label={collapsed ? "Expand care events" : "Collapse care events"}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-4 pb-4 pt-0">
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading care events…
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-red-600 text-sm py-3">
              <AlertTriangle className="w-4 h-4" />
              Failed to load care events.
            </div>
          )}

          {!isLoading && !isError && visibleEvents.length === 0 && (
            <div className="text-slate-400 text-sm py-4 text-center">
              No care events in the last {days} days
              {category ? ` for category '${Array.isArray(category) ? category.join(", ") : category}'` : ""}
              .
            </div>
          )}

          {!isLoading && visibleEvents.length > 0 && (
            <div className="divide-y divide-slate-100">
              {visibleEvents.map((event) => {
                const statusStyle = STATUS_STYLE[event.status] ?? STATUS_STYLE.draft;
                const StatusIcon = STATUS_ICON[event.status] ?? Clock;
                const catStyle = CATEGORY_STYLE[event.category] ?? "bg-slate-100 text-slate-600";

                return (
                  <Link
                    key={event.id}
                    href={`/care-events/${event.id}`}
                    className="flex items-start gap-3 py-2.5 hover:bg-slate-50 rounded group -mx-1 px-1 transition-colors"
                  >
                    <StatusIcon
                      className={cn(
                        "w-3.5 h-3.5 mt-0.5 shrink-0",
                        statusStyle.text
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800 truncate leading-snug">
                          {event.title}
                        </span>
                        {event.is_significant && (
                          <Shield className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500">
                          {formatDate(event.event_date)}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs px-1.5 py-0 h-4",
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          {CARE_EVENT_STATUS_LABEL[event.status] ?? event.status}
                        </Badge>
                        <Badge className={cn("text-xs px-1.5 py-0 h-4", catStyle)}>
                          {CARE_EVENT_CATEGORY_LABEL[event.category] ?? event.category}
                        </Badge>
                        {event.requires_manager_review && event.status !== "verified" && event.status !== "locked" && (
                          <Badge className="text-xs px-1.5 py-0 h-4 bg-amber-100 text-amber-700">
                            Review needed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 w-full text-center"
            >
              Show all {filteredEvents.length} events
            </button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
