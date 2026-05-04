"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FAMILY CONTACT CARD
// Dashboard widget showing recent contact sessions, suspended arrangements,
// concerns flagged, and upcoming scheduled contact.
// Reg 7 — Contact between children & parents/family must be promoted.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContactArrangements, useContactLogs } from "@/hooks/use-contact";
import { cn } from "@/lib/utils";
import {
  Heart, Loader2, AlertTriangle, CheckCircle2,
  Clock, ShieldAlert, PhoneOff, Calendar,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function FamilyContactCard() {
  const arrangementsQuery = useContactArrangements({ homeId: "home_oak" });
  const logsQuery = useContactLogs({ homeId: "home_oak" });

  const arrangements = arrangementsQuery.data?.data ?? [];
  const logs = logsQuery.data?.data ?? [];
  const logMeta = logsQuery.data?.meta;
  const isPending = arrangementsQuery.isPending || logsQuery.isPending;

  const {
    activeArrangements, suspended, underReview,
    totalLogs, concernsCount, distressCount,
    hasAlert,
  } = useMemo(() => {
    const activeArrangements = arrangements.filter((a) => a.status === "active").length;
    const suspended = arrangements.filter((a) => a.status === "suspended").length;
    const underReview = arrangements.filter((a) => a.status === "under_review").length;
    const totalLogs = logMeta?.total ?? logs.length;
    const concernsCount = logMeta?.concerns ?? 0;
    const distressCount = logMeta?.distress ?? 0;

    return {
      activeArrangements,
      suspended,
      underReview,
      totalLogs,
      concernsCount,
      distressCount,
      hasAlert: suspended > 0 || concernsCount > 0,
    };
  }, [arrangements, logs, logMeta]);

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Heart className="h-4 w-4 text-pink-500" />
            Family Contact
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

  return (
    <Card className={cn(hasAlert && "border-pink-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Heart className="h-4 w-4 text-pink-500" />
            Family Contact
          </CardTitle>
          <Link href="/family-contact">
            <Badge className="text-[9px] bg-pink-100 text-pink-700 border-0 rounded-full hover:bg-pink-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-pink-50 p-2 text-center">
            <Calendar className="h-3 w-3 text-pink-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-pink-700 tabular-nums">{activeArrangements}</div>
            <div className="text-[9px] text-pink-500">Active</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", suspended > 0 ? "bg-red-50" : "bg-slate-50")}>
            <PhoneOff className={cn("h-3 w-3 mx-auto mb-0.5", suspended > 0 ? "text-red-500" : "text-slate-400")} />
            <div className={cn("text-sm font-bold tabular-nums", suspended > 0 ? "text-red-700" : "text-slate-400")}>{suspended}</div>
            <div className={cn("text-[9px]", suspended > 0 ? "text-red-500" : "text-slate-400")}>Suspended</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", concernsCount > 0 ? "bg-amber-50" : "bg-emerald-50")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", concernsCount > 0 ? "text-amber-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", concernsCount > 0 ? "text-amber-700" : "text-emerald-700")}>{concernsCount}</div>
            <div className={cn("text-[9px]", concernsCount > 0 ? "text-amber-500" : "text-emerald-500")}>Concerns</div>
          </div>
        </div>

        {/* Contact session count */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-slate-500">Total sessions logged</span>
          <span className="font-bold text-slate-700 tabular-nums">{totalLogs}</span>
        </div>

        {/* Suspended arrangement alert */}
        {suspended > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <PhoneOff className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {suspended} arrangement{suspended !== 1 ? "s" : ""} suspended
              </p>
              <p className="text-[10px] text-red-600">
                Suspension must be reviewed and documented with reasons
              </p>
            </div>
          </div>
        )}

        {/* Concerns alert */}
        {concernsCount > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <ShieldAlert className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-amber-700">
                {concernsCount} contact session{concernsCount !== 1 ? "s" : ""} with concerns
              </p>
              {distressCount > 0 && (
                <p className="text-[10px] text-amber-600">
                  {distressCount} involved post-contact distress
                </p>
              )}
            </div>
          </div>
        )}

        {/* Under review */}
        {underReview > 0 && (
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" /> Under review
            </span>
            <span className="font-bold text-amber-600 tabular-nums">{underReview}</span>
          </div>
        )}

        {/* All clear */}
        {suspended === 0 && concernsCount === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All contact arrangements on track
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
