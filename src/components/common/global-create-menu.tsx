"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — GLOBAL CREATE MENU
// One-click access to create any record from any page.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GLOBAL_CREATE_ITEMS } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Plus, BookOpen, AlertTriangle, MapPin, Pill, PhoneCall,
  CheckSquare, FileCheck, Upload, ShieldCheck, MessageCircle,
  MessageSquare, Wrench, Car, Sparkles, ListChecks, X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, AlertTriangle, MapPin, Pill, PhoneCall,
  CheckSquare, FileCheck, Upload, ShieldCheck, MessageCircle,
  MessageSquare, Wrench, Car, Sparkles, ListChecks,
};

export function GlobalCreateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { canAccess } = usePermissions();

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  const visible = GLOBAL_CREATE_ITEMS.filter(
    (item) => !item.module || canAccess(item.module)
  );

  // Group items
  const groups = visible.reduce<Record<string, typeof visible>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
          open
            ? "bg-slate-900 text-white"
            : "bg-slate-900 text-white hover:bg-slate-800",
        )}
      >
        {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Create</span>
      </button>

      {open && (
        <>
          {/* Backdrop (mobile) */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl py-3 animate-fade-in">
            <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Create new
            </p>

            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {group}
                </p>
                {items.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? Plus;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
