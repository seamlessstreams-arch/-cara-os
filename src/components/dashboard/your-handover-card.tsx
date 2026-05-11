"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRightLeft, Clock, AlertTriangle, BookOpen,
  CheckSquare, Loader2, ChevronRight, Sparkles,
} from "lucide-react";
import { useHandoverContext } from "@/hooks/use-handover-context";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const DEPTH_BADGE = {
  brief: { label: "Up to date", color: "bg-emerald-100 text-emerald-700" },
  standard: { label: "Catch up", color: "bg-blue-100 text-blue-700" },
  comprehensive: { label: "Extended catch up", color: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]" },
};

export function YourHandoverCard() {
  const { currentUser } = useAuthContext();
  const staffId = currentUser?.id ?? "staff_darren";
  const { data, isLoading } = useHandoverContext([staffId]);
  const [expanded, setExpanded] = useState(false);

  const ctx = data?.data?.[0];

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="pt-4 pb-3 flex items-center justify-center gap-2 text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading your handover...</span>
        </CardContent>
      </Card>
    );
  }

  if (!ctx) return null;

  const badge = DEPTH_BADGE[ctx.context_depth];

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Your Handover
          </div>
          <Badge className={cn("text-[9px] rounded-full", badge.color)}>{badge.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick stats row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1 text-[11px] text-[var(--cs-text-muted)]">
            <Clock className="h-3 w-3" />
            {ctx.days_since_last_shift === null
              ? "No recent shift"
              : ctx.days_since_last_shift === 0
                ? "On shift today"
                : `${ctx.days_since_last_shift}d since last shift`}
          </div>
          {ctx.missed_events.incidents > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {ctx.missed_events.incidents} incident{ctx.missed_events.incidents > 1 ? "s" : ""}
            </div>
          )}
          {ctx.missed_events.daily_logs > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-[var(--cs-text-muted)]">
              <BookOpen className="h-3 w-3" />
              {ctx.missed_events.daily_logs} logs
            </div>
          )}
        </div>

        {/* Summary preview */}
        {ctx.context_depth !== "brief" && (
          <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] px-3 py-2.5 mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3 w-3 text-[var(--cs-aria-gold)]" />
              <span className="text-[10px] font-semibold text-[var(--cs-aria-gold)]">ARIA catch-up</span>
            </div>
            <pre className={cn(
              "text-[10px] text-[var(--cs-text-secondary)] whitespace-pre-wrap font-sans leading-relaxed",
              !expanded && "line-clamp-4"
            )}>
              {ctx.aria_summary}
            </pre>
            {ctx.aria_summary.split("\n").length > 4 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] text-[var(--cs-aria-gold)] hover:text-[var(--cs-aria-gold)] mt-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {ctx.context_depth === "brief" && (
          <p className="text-xs text-[var(--cs-text-muted)] mb-3">
            You&apos;re up to date — no major changes since your last shift.
          </p>
        )}

        <Link href="/handover">
          <Button size="sm" variant="outline" className="w-full text-xs">
            View Full Handover
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
