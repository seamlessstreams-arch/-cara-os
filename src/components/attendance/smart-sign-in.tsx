"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LogIn, LogOut, Clock, Users, AlertTriangle, CheckCircle2, MessageSquare, ClipboardCheck, Loader2, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/auth-context";
import { useSignInStatus, useClockInOut, type ClockActionResult } from "@/hooks/use-sign-in";

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function SmartSignIn() {
  const { currentUser } = useAuthContext();
  const firstName = currentUser?.first_name ?? "there";

  const { data: status, isLoading } = useSignInStatus();
  const clock = useClockInOut();
  const [lastAction, setLastAction] = useState<{ kind: "in" | "out"; result: ClockActionResult } | null>(null);

  const onClock = (action: "clock_in" | "clock_out") => {
    clock.mutate(
      { action },
      { onSuccess: (res) => setLastAction({ kind: action === "clock_in" ? "in" : "out", result: res.data }) },
    );
  };

  if (isLoading || !status) {
    return <div className="p-8 text-center text-sm text-[var(--cs-text-muted)]">Loading your shift…</div>;
  }

  const onShift = status.on_shift;
  const isNight = status.shift?.shift_type === "waking_night" || status.shift?.shift_type === "sleep_in";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* ── Primary status + action ─────────────────────────────────── */}
      <div
        className={cn(
          "rounded-2xl border p-6",
          onShift ? "border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)]" : "border-[var(--cs-border)] bg-white",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {onShift ? <CheckCircle2 className="h-5 w-5 text-[var(--cs-teal)]" /> : <Clock className="h-5 w-5 text-[var(--cs-text-muted)]" />}
              <p className="text-lg font-bold text-[var(--cs-navy)]">
                {onShift ? "You're on shift" : `Hi ${firstName}, you're off shift`}
              </p>
            </div>
            {onShift ? (
              <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                Clocked in at <strong>{fmtTime(status.clock_in_at)}</strong> · on shift {fmtMins(status.on_shift_minutes)}
                {isNight && <span className="inline-flex items-center gap-1 ml-1"><Moon className="h-3 w-3" />night</span>}
              </p>
            ) : status.has_shift_today && status.scheduled_start ? (
              <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                Today's shift: <strong>{status.scheduled_start}–{status.scheduled_end}</strong>
                {status.shift && <span className="capitalize"> · {status.shift.shift_type.replace(/_/g, " ")}</span>}
              </p>
            ) : (
              <p className="text-sm text-[var(--cs-text-secondary)] mt-1">
                No shift scheduled today — you can still sign in for cover.
              </p>
            )}
          </div>
          <div className="shrink-0">
            {onShift ? (
              <Button onClick={() => onClock("clock_out")} disabled={clock.isPending} variant="outline" className="gap-1.5 border-[var(--cs-avisaar-coral)] text-[var(--cs-avisaar-coral)] hover:bg-[var(--cs-avisaar-coral)]/10">
                {clock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}Clock out
              </Button>
            ) : (
              <Button onClick={() => onClock("clock_in")} disabled={clock.isPending} className="gap-1.5">
                {clock.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}Clock in
              </Button>
            )}
          </div>
        </div>

        {clock.isError && (
          <p className="text-xs text-red-600 mt-3">{(clock.error as Error)?.message ?? "Could not update your shift."}</p>
        )}
      </div>

      {/* ── Action feedback (lateness / duration / unlocked channels) ── */}
      {lastAction?.kind === "in" && (
        <div className="rounded-2xl border border-[var(--cs-teal-soft)] bg-white p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-navy)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--cs-teal)]" />Signed in{lastAction.result.created_adhoc ? " (ad-hoc cover shift)" : ""}
          </p>
          {!!lastAction.result.late_minutes && lastAction.result.late_minutes > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />Clocked in {fmtMins(lastAction.result.late_minutes)} after the scheduled start.
            </p>
          )}
          <Link href="/comms" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--cs-teal)] hover:underline">
            <MessageSquare className="h-3.5 w-3.5" />Operational channels are now unlocked — open the Comms Centre
          </Link>
        </div>
      )}
      {lastAction?.kind === "out" && (
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--cs-navy)]">
            <LogOut className="h-4 w-4 text-[var(--cs-text-muted)]" />Signed out — shift {fmtMins(lastAction.result.duration_minutes ?? 0)}
            {!!lastAction.result.overtime_minutes && lastAction.result.overtime_minutes > 0 && (
              <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">+{fmtMins(lastAction.result.overtime_minutes)} overtime</Badge>
            )}
          </p>
          <Link href="/end-of-shift-checklist" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--cs-teal)] hover:underline">
            <ClipboardCheck className="h-3.5 w-3.5" />Complete your end-of-shift checklist & handover
          </Link>
        </div>
      )}

      {/* ── Smart context: who else is on shift ───────────────────────── */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--cs-navy)]">
            <Users className="h-4 w-4 text-[var(--cs-teal)]" />On shift now
          </p>
          <Badge variant="outline" className="text-[11px]">{status.staffing_count} on duty</Badge>
        </div>
        {status.colleagues_on_shift.length === 0 ? (
          <p className="text-xs text-[var(--cs-text-muted)]">
            {onShift ? "You're the only one currently clocked in." : "No one is currently clocked in."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--cs-border-subtle)]">
            {status.colleagues_on_shift.map((c) => (
              <li key={c.staff_id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-[var(--cs-text-secondary)] flex items-center gap-1.5">
                  {c.shift_type === "waking_night" || c.shift_type === "sleep_in" ? <Moon className="h-3 w-3 text-[var(--cs-text-muted)]" /> : <Sun className="h-3 w-3 text-[var(--cs-avisaar-amber)]" />}
                  {c.name}
                </span>
                <span className="text-[11px] text-[var(--cs-text-muted)]">since {fmtTime(c.clock_in_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-[var(--cs-text-muted)] text-center px-4">
        Sign-in is an authenticated action — no location tracking, no biometrics. Clocking in/out updates your
        shift record and your on-shift access across the platform.
      </p>
    </div>
  );
}
