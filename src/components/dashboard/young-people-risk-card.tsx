"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — YOUNG PEOPLE RISK OVERVIEW CARD
// Dashboard widget showing each young person's current risk flags,
// key worker allocation, and last daily log date.
// Critical for RM oversight — "Where is each child at right now?"
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useYoungPeople } from "@/hooks/use-young-people";
import type { YPEnriched } from "@/hooks/use-young-people";
import { cn, formatRelative } from "@/lib/utils";
import {
  Heart, AlertTriangle, Shield, Loader2, ChevronRight,
  User, BookOpen, Pill, MapPin, Flame, CheckCircle2,
} from "lucide-react";

// ── Risk level colours ───────────────────────────────────────────────────────

function riskBadgeColour(flagCount: number): string {
  if (flagCount >= 3) return "bg-red-100 text-red-700 border-red-200";
  if (flagCount >= 1) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function riskLabel(flagCount: number): string {
  if (flagCount >= 3) return "High";
  if (flagCount >= 1) return "Medium";
  return "Low";
}

function logRecencyColour(lastLog: string | null): string {
  if (!lastLog) return "text-red-500";
  const days = Math.floor((Date.now() - new Date(lastLog).getTime()) / (1000 * 60 * 60 * 24));
  if (days > 2) return "text-red-500";
  if (days > 0) return "text-amber-500";
  return "text-emerald-500";
}

function logRecencyLabel(lastLog: string | null): string {
  if (!lastLog) return "No logs";
  const days = Math.floor((Date.now() - new Date(lastLog).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function YoungPeopleRiskCard() {
  const { data, isLoading } = useYoungPeople();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Heart className="h-4 w-4 text-rose-500" />
            Young People Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const allYP: YPEnriched[] = data?.data ?? [];
  const current = allYP.filter((yp) => yp.status === "current");

  if (current.length === 0) return null;

  const totalRiskFlags = current.reduce((sum, yp) => sum + yp.risk_flags_count, 0);
  const totalOpenIncidents = current.reduce((sum, yp) => sum + yp.open_incidents, 0);
  const totalMissingEpisodes = current.reduce((sum, yp) => sum + yp.missing_episodes_total, 0);
  const anyHighRisk = current.some((yp) => yp.risk_flags_count >= 3);

  return (
    <Card className={cn(anyHighRisk && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Heart className="h-4 w-4 text-rose-500" />
            Young People Overview
          </CardTitle>
          <Link href="/young-people">
            <Badge className="text-[9px] bg-rose-100 text-rose-700 border-0 rounded-full hover:bg-rose-200 cursor-pointer">
              {current.length} resident{current.length !== 1 ? "s" : ""}
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Summary row */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <AlertTriangle className={cn("h-3 w-3", totalRiskFlags > 0 ? "text-red-500" : "text-slate-300")} />
            <span className={cn("font-semibold", totalRiskFlags > 0 ? "text-red-700" : "text-slate-400")}>
              {totalRiskFlags} risk flag{totalRiskFlags !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className={cn("h-3 w-3", totalOpenIncidents > 0 ? "text-orange-500" : "text-slate-300")} />
            <span className={cn("font-semibold", totalOpenIncidents > 0 ? "text-orange-700" : "text-slate-400")}>
              {totalOpenIncidents} open incident{totalOpenIncidents !== 1 ? "s" : ""}
            </span>
          </div>
          {totalMissingEpisodes > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-red-500" />
              <span className="font-semibold text-red-700">{totalMissingEpisodes} missing</span>
            </div>
          )}
        </div>

        {/* Per-child rows */}
        {current.map((yp) => (
          <Link key={yp.id} href={`/young-people/${yp.id}`}>
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-slate-50 transition-colors -mx-1">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-rose-700">
                  {yp.first_name[0]}{yp.last_name[0]}
                </span>
              </div>

              {/* Name + key worker */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-800 truncate">
                    {yp.preferred_name || yp.first_name}
                  </span>
                  <span className="text-[10px] text-slate-400">{yp.age}y</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <User className="h-2.5 w-2.5" />
                  <span className="truncate">
                    {yp.key_worker ? yp.key_worker.first_name : "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Indicators */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Last log */}
                <div className="flex items-center gap-0.5">
                  <BookOpen className={cn("h-2.5 w-2.5", logRecencyColour(yp.last_log_date))} />
                  <span className={cn("text-[9px] font-medium", logRecencyColour(yp.last_log_date))}>
                    {logRecencyLabel(yp.last_log_date)}
                  </span>
                </div>

                {/* Active medications indicator */}
                {yp.active_medications > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Pill className="h-2.5 w-2.5 text-teal-500" />
                    <span className="text-[9px] font-medium text-teal-600">{yp.active_medications}</span>
                  </div>
                )}

                {/* Risk badge */}
                <Badge
                  variant="outline"
                  className={cn("text-[8px] px-1.5 py-0 border rounded-full", riskBadgeColour(yp.risk_flags_count))}
                >
                  {riskLabel(yp.risk_flags_count)}
                </Badge>
              </div>

              <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
            </div>
          </Link>
        ))}

        {/* Missing from care alert */}
        {current.some((yp) => yp.missing_episodes_total > 0) && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="h-3 w-3 text-red-500" />
              <p className="text-[10px] font-semibold text-red-700">Missing History</p>
            </div>
            {current.filter((yp) => yp.missing_episodes_total > 0).map((yp) => (
              <p key={yp.id} className="text-[10px] text-red-600 ml-4">
                {yp.preferred_name || yp.first_name} — {yp.missing_episodes_total} episode{yp.missing_episodes_total !== 1 ? "s" : ""}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
