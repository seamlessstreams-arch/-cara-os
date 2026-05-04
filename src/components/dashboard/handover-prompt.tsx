"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHIFT HANDOVER PROMPT
// Contextual banner that appears when the logged-in user's shift is nearing
// its end, reminding them to complete the handover before leaving.
// Also shows a "shift started" greeting at the beginning of a shift.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuthContext } from "@/contexts/auth-context";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft, Clock, X, ChevronRight, Timer,
} from "lucide-react";

type PromptState = "not_on_shift" | "shift_started" | "mid_shift" | "approaching_end" | "past_end";

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatCountdown(minutes: number): string {
  if (minutes < 1) return "now";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function HandoverPrompt() {
  const { currentUser } = useAuthContext();
  const { data } = useDashboard();
  const [dismissed, setDismissed] = useState(false);

  const state = useMemo<{ prompt: PromptState; minutesLeft?: number; shiftEnd?: string }>(() => {
    if (!data?.data || !currentUser?.id) return { prompt: "not_on_shift" };

    const shifts = data.data.staffing.today_shifts ?? [];
    const myShift = shifts.find(
      (s) => s.staff_id === currentUser.id && (s.status === "in_progress" || s.status === "scheduled"),
    );

    if (!myShift) return { prompt: "not_on_shift" };

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTime(myShift.start_time);
    const endMinutes = parseTime(myShift.end_time);

    // Handle overnight shifts (end < start)
    const adjustedEnd = endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes;
    const adjustedNow = nowMinutes < startMinutes && endMinutes < startMinutes ? nowMinutes + 24 * 60 : nowMinutes;

    const minutesLeft = adjustedEnd - adjustedNow;

    if (minutesLeft < 0) {
      return { prompt: "past_end", minutesLeft: 0, shiftEnd: myShift.end_time };
    }
    if (minutesLeft <= 60) {
      return { prompt: "approaching_end", minutesLeft, shiftEnd: myShift.end_time };
    }
    if (adjustedNow - startMinutes <= 30) {
      return { prompt: "shift_started", minutesLeft, shiftEnd: myShift.end_time };
    }
    return { prompt: "mid_shift", minutesLeft, shiftEnd: myShift.end_time };
  }, [data, currentUser]);

  if (dismissed || state.prompt === "not_on_shift" || state.prompt === "mid_shift") {
    return null;
  }

  const configs: Record<Exclude<PromptState, "not_on_shift" | "mid_shift">, {
    bg: string;
    border: string;
    icon: React.ElementType;
    iconColor: string;
    title: string;
    message: string;
    actionLabel: string;
    urgent: boolean;
  }> = {
    shift_started: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: Clock,
      iconColor: "text-blue-500",
      title: "Shift started",
      message: `You're on shift until ${state.shiftEnd}. Check the handover notes from the previous shift.`,
      actionLabel: "View handover",
      urgent: false,
    },
    approaching_end: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      icon: Timer,
      iconColor: "text-amber-600",
      title: `Shift ends in ${formatCountdown(state.minutesLeft ?? 0)}`,
      message: "Complete your handover notes before the next team arrives. Include any key events, concerns, or follow-ups.",
      actionLabel: "Start handover",
      urgent: true,
    },
    past_end: {
      bg: "bg-red-50",
      border: "border-red-300",
      icon: ArrowRightLeft,
      iconColor: "text-red-600",
      title: "Shift has ended",
      message: "Your shift has passed its end time. Please complete and submit your handover before leaving.",
      actionLabel: "Complete handover now",
      urgent: true,
    },
  };

  const c = configs[state.prompt as keyof typeof configs];
  if (!c) return null;

  return (
    <div className={cn(
      "rounded-2xl border p-4 flex items-center gap-4 transition-all",
      c.bg, c.border,
      c.urgent && "animate-pulse-gentle",
    )}>
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", c.bg)}>
        <c.icon className={cn("h-5 w-5", c.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{c.title}</p>
        <p className="text-xs text-slate-600 mt-0.5">{c.message}</p>
      </div>
      <Link
        href="/handover"
        className={cn(
          "shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap",
          c.urgent
            ? "bg-amber-500 text-white hover:bg-amber-600"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200",
        )}
      >
        {c.actionLabel}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
