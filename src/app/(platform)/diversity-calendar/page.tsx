"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
  Heart,
  Star,
  BookOpen,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  Filter,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDiversityCalendarEvents } from "@/hooks/use-diversity-calendar-events";
import type {
  DiversityCalendarEvent,
  DiversityEventCategory,
  DiversityEventStatus,
} from "@/types/extended";
import {
  DIVERSITY_EVENT_CATEGORY_LABEL,
  DIVERSITY_EVENT_STATUS_LABEL,
} from "@/types/extended";

/* ── constants ───────────────────────────────────────────────────────── */
const CATEGORY_COLOURS: Record<DiversityEventCategory, string> = {
  religious: "bg-purple-100 text-purple-800",
  cultural: "bg-amber-100 text-amber-800",
  awareness: "bg-blue-100 text-blue-800",
  national: "bg-red-100 text-red-800",
  lgbtq_plus: "bg-pink-100 text-pink-800",
  disability: "bg-teal-100 text-teal-800",
};

const CATEGORY_ICONS: Record<DiversityEventCategory, typeof Globe> = {
  religious: Star,
  cultural: Globe,
  awareness: Heart,
  national: Users,
  lgbtq_plus: Sparkles,
  disability: BookOpen,
};

const STATUS_COLOURS: Record<DiversityEventStatus, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-orange-100 text-orange-800",
};

const STATUS_ICONS: Record<DiversityEventStatus, typeof Clock> = {
  upcoming: Clock,
  completed: CheckCircle2,
  in_progress: Loader2,
};

/* ── component ───────────────────────────────────────────────────────── */
export default function DiversityCalendarPage() {
  const { data: raw, isLoading } = useDiversityCalendarEvents();
  const events: DiversityCalendarEvent[] = raw?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  /* derived */
  const upcoming = events.filter((e) => e.status === "upcoming").length;
  const inProgress = events.filter((e) => e.status === "in_progress").length;
  const completed = events.filter((e) => e.status === "completed").length;
  const categories = [...new Set(events.map((e) => e.category))];

  const filtered = useMemo(() => {
    let list = events;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
    return list;
  }, [events, search, filterCategory, filterStatus]);

  return (
    <PageShell
      title="Diversity & Cultural Calendar"
      subtitle="Religious observances, awareness days, and cultural celebrations — and how we mark them in the home"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Diversity & Cultural Calendar" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Upcoming Events", value: upcoming, icon: Clock, colour: "text-blue-600" },
            { label: "In Progress", value: inProgress, icon: Loader2, colour: "text-orange-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Categories Covered", value: categories.length, icon: Globe, colour: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterCategory("all")}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  filterCategory === "all"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                All Categories
              </button>
              {(Object.entries(DIVERSITY_EVENT_CATEGORY_LABEL) as [DiversityEventCategory, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterCategory(filterCategory === key ? "all" : key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    filterCategory === key
                      ? CATEGORY_COLOURS[key]
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            {(Object.entries(DIVERSITY_EVENT_STATUS_LABEL) as [DiversityEventStatus, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  filterStatus === key
                    ? STATUS_COLOURS[key]
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── event cards ────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
              No events match the current filters.
            </div>
          )}

          {filtered.map((event) => {
            const isExpanded = expanded === event.id;
            const Icon = CATEGORY_ICONS[event.category];
            const StatusIcon = STATUS_ICONS[event.status];

            return (
              <div key={event.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("rounded-lg p-2 shrink-0", CATEGORY_COLOURS[event.category])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{event.name}</p>
                        <Badge className={cn("text-xs", CATEGORY_COLOURS[event.category])}>
                          {DIVERSITY_EVENT_CATEGORY_LABEL[event.category]}
                        </Badge>
                        <Badge className={cn("text-xs", STATUS_COLOURS[event.status])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {DIVERSITY_EVENT_STATUS_LABEL[event.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {event.date_range || event.date}
                        {event.relevant_to_children !== "All" && (
                          <span className="ml-2">
                            <Users className="inline h-3 w-3 mr-1" />
                            {event.relevant_to_children}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* description */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">What is it?</p>
                      <p className="text-sm">{event.description}</p>
                    </div>

                    {/* how we mark it */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">How We Mark It</p>
                      <p className="text-sm">{event.how_we_mark_it}</p>
                    </div>

                    {/* relevant to */}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Relevant to:</span>{" "}
                        <span className="font-medium">{event.relevant_to_children}</span>
                      </span>
                    </div>

                    {/* resources */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Resources & Activities</p>
                      <div className="flex flex-wrap gap-1">
                        {event.resources.map((r, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-blue-50">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* date info */}
                    <div className="text-xs text-muted-foreground">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Date: {event.date_range || event.date} · Status: {DIVERSITY_EVENT_STATUS_LABEL[event.status]}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Equality Act 2010 &amp; Cultural Identity:</strong> Children&apos;s homes must actively
          promote diversity and inclusion, ensuring that every child&apos;s cultural, religious, and
          linguistic background is understood, respected, and celebrated. The home must provide
          opportunities for children to learn about and engage with a range of cultures, faiths, and
          identities, supporting them to develop a positive sense of self. This calendar supports
          compliance with Regulation 5 (engaging with wider society) and Regulation 11 (providing
          an environment that promotes equality and diversity), ensuring that the home is a place
          where all children feel valued and represented.
        </div>
      </div>
      )}
    </PageShell>
  );
}
