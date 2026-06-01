"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SWITCHER (TopBar dropdown)
//
// Compact control that shows the current home name and lets the user
// switch between all active homes in the organisation.
// Designed to sit in the TopBar next to the Building2 icon.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Users, BedDouble, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeContext } from "@/contexts/home-context";

export function HomeSwitcher() {
  const { currentHome, availableHomes, setCurrentHome } = useHomeContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
          "hover:bg-slate-100 active:bg-slate-200",
          open && "bg-slate-100",
        )}
      >
        <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
          {currentHome.name}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-slate-200",
            "bg-white shadow-lg shadow-slate-200/80 py-1",
          )}
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Switch Home
            </p>
          </div>

          {availableHomes.map((home) => {
            const isActive = home.id === currentHome.id;
            return (
              <button
                key={home.id}
                onClick={() => {
                  setCurrentHome(home.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
                  "hover:bg-slate-50",
                  isActive && "bg-blue-50/60",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Building2 className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-blue-700" : "text-slate-800",
                      )}
                    >
                      {home.name}
                    </span>
                    {isActive && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {home.current_occupancy}/{home.capacity} beds
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      RM: {home.registered_manager.split(" ")[0]}
                    </span>
                  </div>
                </div>

                {home.last_inspection_rating && (
                  <RatingBadge rating={home.last_inspection_rating} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Small rating badge ─────────────────────────────────────────────────────

function RatingBadge({
  rating,
}: {
  rating: "outstanding" | "good" | "adequate" | "inadequate";
}) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    outstanding: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Outstanding" },
    good: { bg: "bg-blue-100", text: "text-blue-700", label: "Good" },
    adequate: { bg: "bg-amber-100", text: "text-amber-700", label: "Adequate" },
    inadequate: { bg: "bg-red-100", text: "text-red-700", label: "Inadequate" },
  };
  const c = config[rating] ?? config.adequate;

  return (
    <span
      className={cn(
        "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        c.bg,
        c.text,
      )}
    >
      {c.label}
    </span>
  );
}
