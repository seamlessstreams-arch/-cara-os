"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MOBILE BOTTOM NAV
// Fixed bottom bar shown on mobile only (hidden md:). 5 destinations + More
// overlay for full navigation access.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useSidebarCounts } from "@/hooks/use-sidebar-counts";
import { useAuthContext } from "@/contexts/auth-context";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/permissions";
import {
  LayoutDashboard, Heart, CheckSquare, Users, Menu, X,
  ChevronRight,
  // Child icons used in the overlay
  ClipboardList, BookOpen, AlertTriangle, ShieldAlert, MessageCircle,
  MapPin, Shield, Pill, PhoneCall, ScrollText, FileText, FileCheck,
  // Team icons
  Calendar, MessageSquare, GraduationCap, UserCheck, Fingerprint, TrendingUp,
  Receipt, Clock, Briefcase,
  // Home icons
  Building2, Car, Wrench,
  // Compliance
  ShieldCheck, ClipboardCheck, Scale, Gavel,
  // Reports
  BarChart3, Target, BookMarked,
  // Intelligence
  Sparkles, Brain, Lightbulb,
  // Settings
  Settings,
  // Misc
  ArrowRightLeft, User, Moon,
} from "lucide-react";

// ── Icon map (mirrors sidebar) ────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Heart, HeartHandshake: Heart, CheckSquare, Users, Building2,
  ShieldCheck, BarChart3, Sparkles, Settings, ClipboardList, BookOpen,
  AlertTriangle, ShieldAlert, MessageCircle, MapPin, Shield, Pill, PhoneCall,
  ScrollText, FileText, FileCheck, Calendar, MessageSquare, GraduationCap,
  UserCheck, Fingerprint, TrendingUp, Receipt, Clock, Briefcase, Car, Wrench,
  ClipboardCheck, Scale, Gavel, Target, BookMarked, Brain, Lightbulb,
  ArrowRightLeft, User, Moon,
};

// ── Primary icons per group ───────────────────────────────────────────────────
const GROUP_ICON: Record<string, React.ElementType> = {
  today:      LayoutDashboard,
  children:   Heart,
  team:       Users,
  home:       Building2,
  compliance: ShieldCheck,
  reports:    BarChart3,
  intelligence: Sparkles,
  settings:   Settings,
};

// ── Bottom bar items (5 fixed destinations) ───────────────────────────────────
const BOTTOM_ITEMS = [
  { id: "today",    label: "Today",    href: "/dashboard",    icon: LayoutDashboard },
  { id: "children", label: "Children", href: "/young-people", icon: Heart           },
  { id: "tasks",    label: "Tasks",    href: "/tasks",        icon: CheckSquare,    badgeKey: "tasks" as const },
  { id: "team",     label: "Team",     href: "/staff",        icon: Users           },
];

// ── More overlay ──────────────────────────────────────────────────────────────
function MoreOverlay({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { canAccess } = usePermissions();
  const { currentUser, currentRole } = useAuthContext();

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet — slides up from bottom */}
      <div className="relative mt-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Handle + header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-slate-900">Navigation</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentUser?.full_name} · {APP_ROLE_LABELS[currentRole as AppRole] ?? currentRole}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-3 px-4 space-y-1">
          {NAV_GROUPS.map((group) => {
            const visibleChildren = group.children.filter(
              (c) => !c.module || canAccess(c.module)
            );
            if (!canAccess(group.module ?? "dashboard") && visibleChildren.length === 0) {
              return null;
            }
            const GroupIcon = GROUP_ICON[group.id] ?? LayoutDashboard;
            const isGroupActive = visibleChildren.some(
              (c) => pathname === c.href || pathname.startsWith(c.href + "/")
            );

            return (
              <div key={group.id}>
                {/* Group label */}
                <div className="flex items-center gap-2 px-3 py-2 mb-0.5">
                  <GroupIcon className={cn(
                    "h-4 w-4",
                    isGroupActive ? "text-indigo-600" : "text-slate-400"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    isGroupActive ? "text-indigo-700" : "text-slate-400"
                  )}>
                    {group.label}
                  </span>
                </div>

                {/* Children */}
                <div className="space-y-0.5 mb-3">
                  {visibleChildren.map((child) => {
                    const ChildIcon = (child.icon ? ICON_MAP[child.icon] : null) ?? ChevronRight;
                    const isActive =
                      pathname === child.href ||
                      (child.href !== "/dashboard" && pathname.startsWith(child.href + "/"));

                    return (
                      <Link
                        key={`${group.id}_${child.href}`}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <ChildIcon className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-indigo-600" : "text-slate-400"
                        )} />
                        <span className="flex-1">{child.label}</span>
                        {isActive && (
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom safe area */}
        <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function BottomNav() {
  const pathname = usePathname();
  const counts = useSidebarCounts();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-slate-200 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-[56px] px-2">
          {/* Fixed destination buttons */}
          {BOTTOM_ITEMS.map(({ id, label, href, icon: Icon, badgeKey }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href + "/"));
            const badge = badgeKey ? (counts[badgeKey] ?? 0) : 0;

            return (
              <Link
                key={id}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl mx-0.5 transition-all relative",
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-700"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold px-0.5">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-none",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-indigo-500" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl mx-0.5 transition-all",
              moreOpen ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none text-slate-400">More</span>
          </button>
        </div>

        {/* Safe area spacer for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* More overlay */}
      {moreOpen && <MoreOverlay onClose={() => setMoreOpen(false)} />}
    </>
  );
}
