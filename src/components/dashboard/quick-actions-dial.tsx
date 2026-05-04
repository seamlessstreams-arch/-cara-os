"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUICK ACTIONS SPEED DIAL
// Floating action button that expands into the most common daily actions.
// Positioned bottom-right on the dashboard for instant access.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Plus, X, BookOpen, AlertTriangle, CheckSquare,
  Pill, ArrowRightLeft, Shield, FileText,
} from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  description: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: "Daily Log",
    icon: BookOpen,
    href: "/daily-log",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 hover:bg-emerald-200",
    description: "Record a daily log entry",
  },
  {
    label: "Incident",
    icon: AlertTriangle,
    href: "/incidents",
    color: "text-orange-600",
    bgColor: "bg-orange-100 hover:bg-orange-200",
    description: "Log a new incident",
  },
  {
    label: "Task",
    icon: CheckSquare,
    href: "/tasks",
    color: "text-blue-600",
    bgColor: "bg-blue-100 hover:bg-blue-200",
    description: "Create a new task",
  },
  {
    label: "Medication",
    icon: Pill,
    href: "/medication",
    color: "text-teal-600",
    bgColor: "bg-teal-100 hover:bg-teal-200",
    description: "Record medication",
  },
  {
    label: "Handover",
    icon: ArrowRightLeft,
    href: "/handover",
    color: "text-amber-600",
    bgColor: "bg-amber-100 hover:bg-amber-200",
    description: "Start shift handover",
  },
  {
    label: "Safeguarding",
    icon: Shield,
    href: "/safeguarding",
    color: "text-red-600",
    bgColor: "bg-red-100 hover:bg-red-200",
    description: "Log safeguarding concern",
  },
];

export function QuickActionsDial() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200",
          open
            ? "bg-slate-800 text-white rotate-45 shadow-xl"
            : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl hover:scale-105",
        )}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
      >
        {open ? <X className="h-6 w-6 rotate-[-45deg]" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Action items */}
      {open && (
        <div className="flex flex-col-reverse gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {ACTIONS.map((action, i) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 shadow-md transition-all",
                "bg-white border border-slate-200 hover:shadow-lg hover:-translate-y-0.5",
              )}
              style={{
                animationDelay: `${i * 30}ms`,
                animationFillMode: "both",
              }}
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shrink-0", action.bgColor)}>
                <action.icon className={cn("h-4 w-4", action.color)} />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-slate-800 block">{action.label}</span>
                <span className="text-[10px] text-slate-400 block">{action.description}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Backdrop label */}
      {!open && (
        <span className="text-[10px] font-medium text-slate-400 pr-1 select-none pointer-events-none">
          Quick actions
        </span>
      )}
    </div>
  );
}
