"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { getStore } from "@/lib/db/store";
import {
  X, FileText, AlertTriangle, Moon, ArrowRightLeft, Pill, Timer,
  Play, Square, Clock,
} from "lucide-react";

interface ShiftModeProps { onExit: () => void }

export function ShiftMode({ onExit }: ShiftModeProps) {
  const store = getStore();
  const children = (store.youngPeople as any[] || []).filter((yp: any) => yp.status === "current");
  const [selectedChild, setSelectedChild] = useState<string | null>(children[0]?.id ?? null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerChild, setTimerChild] = useState<string>("");
  const [now, setNow] = useState(new Date());
  // The clock (below) is minute-precision and rendered at the top of the page,
  // so an ungated `now` mismatches the build-frozen SSR HTML on hydration
  // (#418). Gate the displayed clock behind mount; the interval then keeps it
  // live. `now`'s day-precision use for the store counts is unaffected.
  const mounted = useMounted();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  const startTimer = useCallback(() => {
    const child = children.find((c: any) => c.id === selectedChild);
    setTimerChild(child?.first_name ?? "Child");
    setTimerSeconds(0);
    setTimerRunning(true);
  }, [selectedChild, children]);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timeStr = mounted ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const dateStr = mounted ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "";

  const overdueTasks = (store.tasks as any[] || []).filter((t: any) => t.status === "pending" && t.due_date && t.due_date < now.toISOString().slice(0, 10)).length;
  const todayLogs = (store.dailyLog as any[] || []).filter((l: any) => l.date === now.toISOString().slice(0, 10)).length;
  const missingLogs = children.length - todayLogs;

  const ACTIONS = [
    { label: "Daily Log", icon: FileText, href: "/daily-log", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Incident", icon: AlertTriangle, href: "/incidents", color: "bg-red-50 text-red-700 border-red-200" },
    { label: "Welfare Check", icon: Moon, href: "/welfare-checks", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "Handover", icon: ArrowRightLeft, href: "/handover", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Medication", icon: Pill, href: "/medication", color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Face-to-Face", icon: Timer, href: "#timer", color: "bg-teal-50 text-teal-700 border-teal-200", isTimer: true },
  ];

  return (
    <div className="fixed inset-0 z-45 bg-[var(--cs-bg)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--cs-navy)] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold">On Shift</span>
            <span className="text-xs bg-white/15 rounded-full px-2 py-0.5">Afternoon</span>
          </div>
          <p className="text-xs text-white/60 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tabular-nums">{timeStr}</span>
          <button onClick={onExit} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Timer bar */}
      {timerRunning && (
        <div className="bg-teal-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Face-to-face with {timerChild}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tabular-nums">{formatTime(timerSeconds)}</span>
            <button onClick={stopTimer} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30"><Square className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Children */}
        <div>
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] mb-2">CHILDREN ON SHIFT ({children.length})</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {children.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={cn(
                  "flex flex-col items-center gap-1 shrink-0 rounded-xl p-2 min-w-[72px] transition-all border-2",
                  selectedChild === child.id
                    ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)]"
                    : "border-transparent bg-white hover:border-[var(--cs-border)]",
                )}
              >
                <div className="h-10 w-10 rounded-full bg-[var(--cs-navy)] text-white flex items-center justify-center text-sm font-bold">
                  {(child.first_name?.[0] ?? "")}{(child.last_name?.[0] ?? "")}
                </div>
                <span className="text-[11px] font-medium text-[var(--cs-text)]">{child.first_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] mb-2">QUICK ACTIONS</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              if ((action as any).isTimer) {
                return (
                  <button
                    key={action.label}
                    onClick={timerRunning ? stopTimer : startTimer}
                    className={cn("flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 min-h-[80px] transition-all active:scale-95", action.color)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{timerRunning ? "Stop Timer" : action.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={action.label}
                  href={`${action.href}${selectedChild ? `?childId=${selectedChild}` : ""}`}
                  className={cn("flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 min-h-[80px] transition-all active:scale-95", action.color)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {(overdueTasks > 0 || missingLogs > 0) && (
          <div>
            <p className="text-xs font-semibold text-[var(--cs-text-muted)] mb-2">ALERTS</p>
            <div className="space-y-2">
              {missingLogs > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <span className="text-sm text-amber-800">{missingLogs} daily log{missingLogs > 1 ? "s" : ""} missing for today</span>
                </div>
              )}
              {overdueTasks > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <span className="text-sm text-red-800">{overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
