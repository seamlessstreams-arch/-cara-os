"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY DATES WIDGET
// Dashboard card showing upcoming important dates: birthdays, training expiry,
// supervision due dates, probation reviews, care plan reviews.
// Ensures nothing falls through the cracks — key Ofsted requirement.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useKeyDates, type KeyDate } from "@/hooks/use-key-dates";
import { cn, formatRelative } from "@/lib/utils";
import {
  Calendar, Cake, GraduationCap, Users, Clock,
  Award, FileText, Heart, Loader2, ChevronRight,
  AlertTriangle,
} from "lucide-react";

// ── Type icons and colours ──────────────────────────────────────────────────

const TYPE_CONFIG: Record<KeyDate["type"], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  birthday:         { icon: Cake,           color: "text-pink-600",    bgColor: "bg-pink-100",    label: "Birthday" },
  training_expiry:  { icon: GraduationCap,  color: "text-amber-600",   bgColor: "bg-amber-100",   label: "Training" },
  supervision:      { icon: Users,          color: "text-indigo-600",  bgColor: "bg-indigo-100",  label: "Supervision" },
  probation_end:    { icon: Award,          color: "text-emerald-600", bgColor: "bg-emerald-100", label: "Probation" },
  placement_review: { icon: Heart,          color: "text-violet-600",  bgColor: "bg-violet-100",  label: "Placement" },
  document_expiry:  { icon: FileText,       color: "text-slate-600",   bgColor: "bg-slate-100",   label: "Document" },
  care_review:      { icon: Heart,          color: "text-blue-600",    bgColor: "bg-blue-100",    label: "Care Plan" },
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-400",
  low:      "bg-blue-300",
  info:     "bg-slate-300",
};

// ── Row component ───────────────────────────────────────────────────────────

function KeyDateRow({ item }: { item: KeyDate }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config?.icon ?? Calendar;
  const isOverdue = item.notes === "Overdue" || item.notes === "Expired";

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors group"
    >
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl shrink-0",
        config?.bgColor ?? "bg-slate-100",
      )}>
        <Icon className={cn("h-4 w-4", config?.color ?? "text-slate-500")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[13px] font-medium truncate",
            isOverdue ? "text-red-700" : "text-slate-800",
          )}>
            {item.title}
          </span>
          {item.severity !== "info" && item.severity !== "low" && (
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", SEVERITY_DOT[item.severity])} />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400">{item.entity_name}</span>
          <span className={cn(
            "text-[10px]",
            isOverdue ? "text-red-600 font-semibold" : "text-slate-400",
          )}>
            {item.notes ? item.notes : formatRelative(item.date)}
          </span>
        </div>
      </div>

      {item.notes === "Today!" && (
        <Badge className="bg-pink-100 text-pink-700 border-0 text-[10px] rounded-full animate-bounce">
          Today!
        </Badge>
      )}
      {isOverdue && (
        <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full">
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          {item.notes}
        </Badge>
      )}

      <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function KeyDatesCard({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useKeyDates();
  const items = data?.data ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Calendar className="h-4 w-4 text-blue-500" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Calendar className="h-4 w-4 text-blue-500" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">No upcoming key dates</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All reviews and deadlines are clear</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = items.filter((i) => i.notes === "Overdue" || i.notes === "Expired").length;
  const thisWeekCount = items.filter((i) => {
    const diff = Math.round((new Date(i.date).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 7;
  }).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Calendar className="h-4 w-4 text-blue-500" />
            Key Dates
            {items.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] rounded-full">
                {items.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full">
                {overdueCount} overdue
              </Badge>
            )}
            {thisWeekCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] rounded-full">
                {thisWeekCount} this week
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {items.slice(0, limit).map((item) => (
            <KeyDateRow key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
