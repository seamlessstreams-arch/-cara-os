"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIVERSAL TIMELINE COMPONENT
//
// Vertical timeline that captures every action across the system.
// Date separators, colour-coded event cards, filter bar, search, pagination.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import type { TimelineEvent, TimelineEventType, TimelineRiskLevel, TimelineFilter } from "@/lib/timeline/types";
import {
  FileText, AlertTriangle, Shield, Heart, GraduationCap, Pill,
  Users, ClipboardCheck, Star, MessageSquare, Flame, Eye,
  UserCheck, BookOpen, Calendar, Search, ChevronDown, Clock,
  Activity, MapPin, FileWarning, Sparkles, CheckCircle2,
} from "lucide-react";

interface TimelineResponse {
  data: TimelineEvent[];
  total: number;
}

function buildQueryString(filter: TimelineFilter): string {
  const params = new URLSearchParams();

  if (filter.child_id) params.set("child_id", filter.child_id);
  if (filter.staff_id) params.set("staff_id", filter.staff_id);
  if (filter.home_id) params.set("home_id", filter.home_id);
  if (filter.date_from) params.set("date_from", filter.date_from);
  if (filter.date_to) params.set("date_to", filter.date_to);
  if (filter.search) params.set("search", filter.search);
  if (filter.limit) params.set("limit", String(filter.limit));
  if (filter.offset) params.set("offset", String(filter.offset));
  if (filter.event_types?.length) params.set("event_types", filter.event_types.join(","));
  if (filter.risk_levels?.length) params.set("risk_levels", filter.risk_levels.join(","));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function useTimeline(filter: TimelineFilter) {
  return useQuery({
    queryKey: ["timeline", filter],
    queryFn: () =>
      api.get<TimelineResponse>(`/timeline${buildQueryString(filter)}`),
    refetchInterval: 30_000,
  });
}

// ── Event category colours ───────────────────────────────────────────────────

type EventCategory = "care" | "safeguarding" | "health" | "education" | "compliance" | "staff" | "positive" | "admin";

const CATEGORY_MAP: Record<string, EventCategory> = {
  daily_log_created: "care",
  daily_log_updated: "care",
  incident_submitted: "safeguarding",
  incident_reviewed: "safeguarding",
  incident_closed: "safeguarding",
  risk_assessment_created: "safeguarding",
  risk_assessment_updated: "safeguarding",
  risk_level_changed: "safeguarding",
  care_plan_created: "care",
  care_plan_reviewed: "care",
  care_plan_goal_updated: "care",
  direct_work_completed: "care",
  key_work_session_completed: "care",
  safeguarding_concern_raised: "safeguarding",
  safeguarding_referral_made: "safeguarding",
  medication_administered: "health",
  medication_error_reported: "health",
  family_contact_recorded: "care",
  professional_contact_recorded: "admin",
  education_update_recorded: "education",
  health_update_recorded: "health",
  missing_from_care_reported: "safeguarding",
  missing_from_care_returned: "safeguarding",
  restraint_recorded: "safeguarding",
  body_map_completed: "safeguarding",
  task_created: "admin",
  task_completed: "admin",
  task_overdue: "admin",
  document_uploaded: "admin",
  report_generated: "admin",
  placement_started: "care",
  placement_ended: "care",
  review_scheduled: "compliance",
  review_completed: "compliance",
  welfare_check_completed: "care",
  night_check_completed: "care",
  achievement_recorded: "positive",
  complaint_received: "compliance",
  staff_supervision_completed: "staff",
  staff_training_completed: "staff",
  visitor_logged: "admin",
  fire_drill_completed: "compliance",
  custom_event: "admin",
};

const CATEGORY_COLOURS: Record<EventCategory, { bg: string; border: string; dot: string; text: string; iconBg: string }> = {
  care:         { bg: "bg-blue-50",   border: "border-blue-200",   dot: "bg-blue-500",   text: "text-blue-700",   iconBg: "bg-blue-100" },
  safeguarding: { bg: "bg-red-50",    border: "border-red-200",    dot: "bg-red-500",    text: "text-red-700",    iconBg: "bg-red-100" },
  health:       { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", iconBg: "bg-emerald-100" },
  education:    { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", text: "text-purple-700", iconBg: "bg-purple-100" },
  compliance:   { bg: "bg-amber-50",  border: "border-amber-200",  dot: "bg-amber-500",  text: "text-amber-700",  iconBg: "bg-amber-100" },
  staff:        { bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500", text: "text-indigo-700", iconBg: "bg-indigo-100" },
  positive:     { bg: "bg-green-50",  border: "border-green-200",  dot: "bg-green-500",  text: "text-green-700",  iconBg: "bg-green-100" },
  admin:        { bg: "bg-gray-50",   border: "border-gray-200",   dot: "bg-gray-400",   text: "text-gray-700",   iconBg: "bg-gray-100" },
};

const RISK_BADGES: Record<TimelineRiskLevel, { colour: string; label: string }> = {
  none:     { colour: "",                                      label: "" },
  low:      { colour: "bg-yellow-100 text-yellow-800",         label: "Low" },
  medium:   { colour: "bg-orange-100 text-orange-800",         label: "Medium" },
  high:     { colour: "bg-red-100 text-red-800",               label: "High" },
  critical: { colour: "bg-red-200 text-red-900 font-semibold", label: "Critical" },
};

// ── Event type icons ─────────────────────────────────────────────────────────

function EventIcon({ type, className }: { type: TimelineEventType; className?: string }) {
  const iconProps = { size: 16, className };

  switch (type) {
    case "daily_log_created":
    case "daily_log_updated":
      return <FileText {...iconProps} />;
    case "incident_submitted":
    case "incident_reviewed":
    case "incident_closed":
      return <AlertTriangle {...iconProps} />;
    case "risk_assessment_created":
    case "risk_assessment_updated":
    case "risk_level_changed":
      return <FileWarning {...iconProps} />;
    case "care_plan_created":
    case "care_plan_reviewed":
    case "care_plan_goal_updated":
      return <ClipboardCheck {...iconProps} />;
    case "direct_work_completed":
    case "key_work_session_completed":
      return <BookOpen {...iconProps} />;
    case "safeguarding_concern_raised":
    case "safeguarding_referral_made":
      return <Shield {...iconProps} />;
    case "medication_administered":
    case "medication_error_reported":
      return <Pill {...iconProps} />;
    case "family_contact_recorded":
    case "professional_contact_recorded":
      return <Users {...iconProps} />;
    case "education_update_recorded":
      return <GraduationCap {...iconProps} />;
    case "health_update_recorded":
      return <Heart {...iconProps} />;
    case "missing_from_care_reported":
    case "missing_from_care_returned":
      return <MapPin {...iconProps} />;
    case "restraint_recorded":
      return <Activity {...iconProps} />;
    case "body_map_completed":
      return <Eye {...iconProps} />;
    case "task_created":
    case "task_completed":
    case "task_overdue":
      return <CheckCircle2 {...iconProps} />;
    case "welfare_check_completed":
    case "night_check_completed":
      return <UserCheck {...iconProps} />;
    case "achievement_recorded":
      return <Sparkles {...iconProps} />;
    case "complaint_received":
      return <MessageSquare {...iconProps} />;
    case "staff_supervision_completed":
    case "staff_training_completed":
      return <UserCheck {...iconProps} />;
    case "visitor_logged":
      return <Users {...iconProps} />;
    case "fire_drill_completed":
      return <Flame {...iconProps} />;
    case "review_scheduled":
    case "review_completed":
      return <Calendar {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
}

// ── Filter chip options ──────────────────────────────────────────────────────

const CATEGORY_CHIPS: { label: string; category: EventCategory }[] = [
  { label: "Care", category: "care" },
  { label: "Safeguarding", category: "safeguarding" },
  { label: "Health", category: "health" },
  { label: "Education", category: "education" },
  { label: "Compliance", category: "compliance" },
  { label: "Staff", category: "staff" },
  { label: "Positive", category: "positive" },
  { label: "Admin", category: "admin" },
];

const EVENT_TYPES_BY_CATEGORY: Record<EventCategory, TimelineEventType[]> = {
  care: ["daily_log_created", "daily_log_updated", "care_plan_created", "care_plan_reviewed", "care_plan_goal_updated", "direct_work_completed", "key_work_session_completed", "family_contact_recorded", "placement_started", "placement_ended", "welfare_check_completed", "night_check_completed"],
  safeguarding: ["incident_submitted", "incident_reviewed", "incident_closed", "risk_assessment_created", "risk_assessment_updated", "risk_level_changed", "safeguarding_concern_raised", "safeguarding_referral_made", "missing_from_care_reported", "missing_from_care_returned", "restraint_recorded", "body_map_completed"],
  health: ["medication_administered", "medication_error_reported", "health_update_recorded"],
  education: ["education_update_recorded"],
  compliance: ["review_scheduled", "review_completed", "complaint_received", "fire_drill_completed"],
  staff: ["staff_supervision_completed", "staff_training_completed"],
  positive: ["achievement_recorded"],
  admin: ["professional_contact_recorded", "task_created", "task_completed", "task_overdue", "document_uploaded", "report_generated", "visitor_logged", "custom_event"],
};

const RISK_OPTIONS: TimelineRiskLevel[] = ["low", "medium", "high", "critical"];

// ── Date grouping ────────────────────────────────────────────────────────────

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today.getTime() - eventDate.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 6) return "This Week";
  if (diff <= 13) return "Last Week";
  if (diff <= 30) return "This Month";
  if (diff <= 60) return "Last Month";
  return "Older";
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Main component ───────────────────────────────────────────────────────────

interface UniversalTimelineProps {
  childId?: string;
  staffId?: string;
  homeId?: string;
  compact?: boolean;
}

export function UniversalTimeline({ childId, staffId, homeId, compact = false }: UniversalTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<EventCategory>>(new Set());
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<Set<TimelineRiskLevel>>(new Set());
  const [pageSize] = useState(compact ? 20 : 50);
  const [displayCount, setDisplayCount] = useState(pageSize);

  // Build filter from props + local state
  const filter: TimelineFilter = useMemo(() => {
    const f: TimelineFilter = { limit: 200 };
    if (childId) f.child_id = childId;
    if (staffId) f.staff_id = staffId;
    if (homeId) f.home_id = homeId;
    if (searchQuery.trim()) f.search = searchQuery.trim();

    // Resolve category chips into event_types
    if (selectedCategories.size > 0) {
      const types: TimelineEventType[] = [];
      selectedCategories.forEach((cat) => {
        types.push(...(EVENT_TYPES_BY_CATEGORY[cat] ?? []));
      });
      f.event_types = types;
    }
    if (selectedRiskLevels.size > 0) {
      f.risk_levels = Array.from(selectedRiskLevels);
    }

    return f;
  }, [childId, staffId, homeId, searchQuery, selectedCategories, selectedRiskLevels]);

  const { data, isLoading, error } = useTimeline(filter);

  const events = data?.data ?? [];
  const total = data?.total ?? 0;

  // Group events by date
  const groupedEvents = useMemo(() => {
    const visible = events.slice(0, displayCount);
    const groups: { label: string; events: TimelineEvent[] }[] = [];
    let currentLabel = "";

    for (const event of visible) {
      const label = getDateGroup(event.created_at);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, events: [] });
      }
      groups[groups.length - 1].events.push(event);
    }

    return groups;
  }, [events, displayCount]);

  const hasMore = displayCount < events.length;

  // ── Toggle helpers ──────────────────────────────────────────────────────────

  function toggleCategory(cat: EventCategory) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setDisplayCount(pageSize);
  }

  function toggleRisk(level: TimelineRiskLevel) {
    setSelectedRiskLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
    setDisplayCount(pageSize);
  }

  function clearFilters() {
    setSelectedCategories(new Set());
    setSelectedRiskLevels(new Set());
    setSearchQuery("");
    setDisplayCount(pageSize);
  }

  const hasActiveFilters = selectedCategories.size > 0 || selectedRiskLevels.size > 0 || searchQuery.trim() !== "";

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load timeline. Please try again.
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={cn("font-bold text-gray-900", compact ? "text-base" : "text-lg")}>
          Timeline
        </h2>
        {total > 0 && (
          <span className="text-xs text-gray-500">
            {total} event{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setDisplayCount(pageSize);
          }}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>

      {/* Filter chips — categories */}
      {!compact && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_CHIPS.map(({ label, category }) => {
              const active = selectedCategories.has(category);
              const colours = CATEGORY_COLOURS[category];
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? `${colours.bg} ${colours.text} ${colours.border} border`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Risk level chips */}
          <div className="flex flex-wrap gap-1.5">
            {RISK_OPTIONS.map((level) => {
              const active = selectedRiskLevels.has(level);
              const badge = RISK_BADGES[level];
              return (
                <button
                  key={level}
                  onClick={() => toggleRisk(level)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? `${badge.colour} border border-current/20`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {badge.label} Risk
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-gray-100 p-4 mb-3">
            <Clock size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">No events found</p>
          <p className="text-xs text-gray-500 mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters or search query."
              : "Events will appear here as they are recorded."}
          </p>
        </div>
      )}

      {/* Timeline */}
      {groupedEvents.length > 0 && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

          {groupedEvents.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              {/* Date separator */}
              <div className="relative flex items-center mb-3">
                <div className="absolute left-3 w-4 h-4 rounded-full bg-white border-2 border-gray-300 z-10" />
                <span className="ml-10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>

              {/* Event cards */}
              <div className="space-y-2">
                {group.events.map((event) => (
                  <TimelineCard key={event.id} event={event} compact={compact} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setDisplayCount((prev) => prev + pageSize)}
          className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronDown size={16} />
          Load more ({events.length - displayCount} remaining)
        </button>
      )}
    </div>
  );
}

// ── Individual event card ────────────────────────────────────────────────────

function TimelineCard({ event, compact }: { event: TimelineEvent; compact: boolean }) {
  const category = CATEGORY_MAP[event.event_type] ?? "admin";
  const colours = CATEGORY_COLOURS[category];
  const risk = RISK_BADGES[event.risk_level];

  return (
    <div className="relative flex gap-3 ml-0.5">
      {/* Timeline dot */}
      <div className={cn(
        "relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        colours.iconBg
      )}>
        <EventIcon type={event.event_type} className={colours.text} />
      </div>

      {/* Card */}
      <div className={cn(
        "flex-1 rounded-lg border p-3",
        colours.bg,
        colours.border,
        compact && "p-2"
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-sm font-medium", colours.text)}>
                {event.title}
              </span>
              {risk.label && (
                <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium", risk.colour)}>
                  {risk.label}
                </span>
              )}
            </div>
            {!compact && (
              <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                {event.summary}
              </p>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-gray-400 whitespace-nowrap">
            {formatTime(event.created_at)}
          </span>
        </div>

        {/* Tags + meta */}
        {!compact && event.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-gray-500 border border-gray-100"
              >
                {tag}
              </span>
            ))}
            {event.linked_record_type && (
              <span className="inline-block rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-blue-500 border border-blue-100 cursor-pointer hover:bg-blue-50">
                {formatEventType(event.linked_record_type)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UniversalTimeline;
