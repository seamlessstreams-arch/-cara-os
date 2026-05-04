"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ON-DUTY STATUS BAR
// Compact, always-visible strip at the bottom of the sidebar showing
// who is currently on shift. Essential safety feature — every staff member
// needs to know who is in the building at any time.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useDashboard } from "@/hooks/use-dashboard";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { Users, Circle } from "lucide-react";

const SHIFT_LABEL: Record<string, string> = {
  day: "Day",
  sleep_in: "Sleep-in",
  waking_night: "Night",
  early: "Early",
  late: "Late",
  short: "Short",
  handover: "H/O",
  on_call: "On-call",
  training_day: "Training",
};

export function OnDutyBar({ collapsed }: { collapsed: boolean }) {
  const { data } = useDashboard();
  const shifts = data?.data?.staffing.today_shifts ?? [];
  const onDuty = shifts.filter((s) => s.status === "in_progress");
  const scheduled = shifts.filter((s) => s.status === "scheduled");

  if (onDuty.length === 0 && scheduled.length === 0) return null;

  if (collapsed) {
    // Collapsed sidebar — just show count dot
    return (
      <div className="px-2 py-3 border-t border-slate-100">
        <Link
          href="/rota"
          className="flex flex-col items-center gap-1 rounded-xl p-2 hover:bg-slate-50 transition-colors"
          title={`${onDuty.length} on shift · ${scheduled.length} scheduled`}
        >
          <div className="relative">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="absolute -top-1 -right-1.5 h-3.5 min-w-3.5 flex items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white px-0.5">
              {onDuty.length}
            </span>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 px-3 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            On Duty
          </span>
        </div>
        <Link href="/rota" className="text-[10px] text-blue-500 hover:underline">
          Rota
        </Link>
      </div>

      {/* On duty now */}
      <div className="space-y-1">
        {onDuty.slice(0, 5).map((shift) => {
          const name = getStaffName(shift.staff_id);
          return (
            <div key={shift.id} className="flex items-center gap-2 rounded-lg px-2 py-1">
              <Avatar name={name} size="xs" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-slate-700 truncate block">
                  {name.split(" ")[0]}
                </span>
              </div>
              <span className="text-[9px] text-emerald-600 font-medium shrink-0">
                {SHIFT_LABEL[shift.shift_type] || shift.shift_type}
              </span>
            </div>
          );
        })}
      </div>

      {/* Coming up */}
      {scheduled.length > 0 && (
        <>
          <div className="mt-2 mb-1 px-2">
            <span className="text-[9px] text-slate-400 uppercase tracking-wider">
              Coming up
            </span>
          </div>
          <div className="space-y-1">
            {scheduled.slice(0, 3).map((shift) => {
              const name = getStaffName(shift.staff_id);
              return (
                <div key={shift.id} className="flex items-center gap-2 rounded-lg px-2 py-1 opacity-60">
                  <Avatar name={name} size="xs" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-slate-500 truncate block">
                      {name.split(" ")[0]}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0">
                    {shift.start_time}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
