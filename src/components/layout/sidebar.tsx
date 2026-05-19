"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIDEBAR (redesigned)
// 8-section grouped navigation. Calm, premium, role-aware.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { useSidebarCounts } from "@/hooks/use-sidebar-counts";
import { useAuthContext } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/permissions";
import { useStaff } from "@/hooks/use-staff";
import type { StaffEnriched } from "@/hooks/use-staff";
import { Badge } from "@/components/ui/badge";
import { AriaStatusBadge } from "@/components/aria/aria-health-panel";
import { OnDutyBar } from "@/components/layout/on-duty-bar";
import {
  ChevronDown, ChevronRight, ChevronUp,
  PanelLeftClose, PanelLeft,
  // Primary nav icons
  LayoutDashboard, Heart, Users, Building2, ShieldCheck, BarChart3, Sparkles, Settings,
  // Child icons
  HeartHandshake, ClipboardList, BookOpen, AlertTriangle, ShieldAlert, MessageCircle,
  MapPin, Shield, Pill, PhoneCall, ScrollText, FileText, FileCheck, FileSignature,
  // Team icons
  Calendar, MessageSquare, GraduationCap, UserCheck, Fingerprint, TrendingUp,
  Network, Milestone, CalendarDays, Clock,
  // Home icons
  Car, Wrench, Receipt,
  // Compliance icons
  Gavel, Eye, Flag, ClipboardCheck, Award,
  // Reports icons
  BarChart2,
  // Aria icons
  Brain, Radar, ListChecks, Layers, Puzzle, PlayCircle, Lightbulb, Activity,
  Wand2,
  // Other
  Target, ArrowRightLeft, CheckSquare, User, Moon, Share2, FolderArchive, GitCompare, LineChart,
} from "lucide-react";

// ── Icon lookup ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Heart, Users, Building2, ShieldCheck, BarChart3, Sparkles, Settings,
  HeartHandshake, ClipboardList, BookOpen, AlertTriangle, ShieldAlert, MessageCircle,
  MapPin, Shield, Pill, PhoneCall, ScrollText, FileText, FileCheck, FileSignature,
  Calendar, MessageSquare, GraduationCap, UserCheck, Fingerprint, TrendingUp,
  Network, Milestone, CalendarDays, Clock,
  Car, Wrench, Receipt,
  Gavel, Eye, Flag, ClipboardCheck, Award,
  BarChart2,
  Brain, Radar, ListChecks, Layers, Puzzle, PlayCircle, Lightbulb, Activity,
  Wand2,
  Target, ArrowRightLeft, CheckSquare, User, Moon, Share2, FolderArchive, GitCompare, LineChart,
};

// ── Primary section icons ─────────────────────────────────────────────────────

const PRIMARY_ICONS: Record<string, React.ElementType> = {
  today:      LayoutDashboard,
  children:   HeartHandshake,
  team:       Users,
  home:       Building2,
  compliance: ShieldCheck,
  reports:    BarChart3,
  aria:       Sparkles,
  settings:   Settings,
};

// ── Role Switcher ─────────────────────────────────────────────────────────────

function RoleSwitcher({ collapsed }: { collapsed: boolean }) {
  const { currentUser, currentRole, setCurrentUserId } = useAuthContext();
  const [open, setOpen] = useState(false);
  const staffQuery = useStaff();
  const staffByRole = (staffQuery.data?.data ?? [])
    .filter((s: StaffEnriched) => s.is_active)
    .reduce<Record<string, StaffEnriched[]>>((acc, s: StaffEnriched) => {
      if (!acc[s.role]) acc[s.role] = [];
      acc[s.role].push(s);
      return acc;
    }, {});

  const initials = `${currentUser?.first_name?.[0] ?? ""}${currentUser?.last_name?.[0] ?? ""}`;

  return (
    <div className="relative border-t border-slate-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition-colors",
          collapsed && "justify-center px-0 py-3",
        )}
        title={collapsed ? currentUser?.full_name : undefined}
      >
        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white shrink-0">
          {initials || "?"}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 truncate leading-tight">
                {currentUser?.full_name ?? "Unknown"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {APP_ROLE_LABELS[currentRole as AppRole] ?? currentRole}
              </p>
            </div>
            {open
              ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            }
          </>
        )}
      </button>

      {open && !collapsed && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 mx-3 rounded-2xl border border-slate-200 bg-white shadow-2xl py-2 max-h-[55vh] overflow-y-auto">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch demo user
              </p>
            </div>
            {Object.entries(staffByRole).map(([role, members]) => (
              <div key={role}>
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    {APP_ROLE_LABELS[role as AppRole] ?? role}
                  </p>
                </div>
                {members.map((member: StaffEnriched) => (
                  <button
                    key={member.id}
                    onClick={() => { setCurrentUserId(member.id); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 transition-colors",
                      currentUser?.id === member.id && "bg-indigo-50 text-indigo-700",
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
                      currentUser?.id === member.id
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-500",
                    )}>
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <span className="truncate">{member.full_name}</span>
                    {currentUser?.id === member.id && (
                      <span className="ml-auto text-[9px] text-indigo-500 font-medium">Active</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => {
    // Auto-expand the active section on first render — best effort (SSR safe)
    return null;
  });
  const { canAccess } = usePermissions();
  const counts = useSidebarCounts();
  const { currentRole, currentUser } = useAuthContext();

  // Determine active top-level group from pathname
  function getActiveGroup(): string | null {
    for (const group of NAV_GROUPS) {
      if (group.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
        return group.id;
      }
    }
    return null;
  }

  const activeGroup = getActiveGroup();

  function toggleGroup(id: string) {
    setExpandedGroup((prev) => (prev === id ? null : id));
  }

  // Which group is "open" for display
  const openGroup = expandedGroup ?? activeGroup;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col bg-white transition-all duration-300 ease-in-out",
        "border-r border-[#e5e7eb]",
        collapsed ? "w-[64px]" : "w-[256px]",
      )}
    >
      {/* ── Logo & Home ──────────────────────────────────────────────────── */}
      <div className={cn(
        "flex h-[60px] items-center border-b border-slate-100 shrink-0",
        collapsed ? "justify-center px-0" : "gap-3 px-4",
      )}>
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          {/* Logo mark */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <span className="text-sm font-bold tracking-tight">C</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">
                Cornerstone
              </p>
              <p className="text-[11px] text-slate-400 truncate">Oak House</p>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand toggle when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 mb-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {NAV_GROUPS.map((group) => {
          const PrimaryIcon = PRIMARY_ICONS[group.id] ?? LayoutDashboard;

          // Filter children by permission
          const visibleChildren = group.children.filter(
            (c) => !c.module || canAccess(c.module)
          );
          if (!canAccess(group.module ?? "dashboard") && visibleChildren.length === 0) {
            return null;
          }

          const isActive  = group.id === activeGroup;
          const isOpen    = group.id === openGroup && !collapsed;

          // Any child active?
          const childActive = visibleChildren.some(
            (c) => pathname === c.href || pathname.startsWith(c.href + "/")
          );

          if (collapsed) {
            // ── Collapsed: just icon ────────────────────────────────────
            return (
              <div key={group.id} className="px-2">
                <Link
                  href={group.href}
                  title={group.label}
                  className={cn(
                    "flex h-10 w-10 mx-auto items-center justify-center rounded-xl transition-all",
                    childActive
                      ? "bg-[#eef2ff] text-[#1e3a8a]"
                      : "text-[#6b7280] hover:bg-slate-100 hover:text-slate-800",
                  )}
                >
                  <PrimaryIcon className="h-5 w-5" />
                </Link>
              </div>
            );
          }

          // ── Expanded ─────────────────────────────────────────────────
          return (
            <div key={group.id} className="px-3">
              {/* Primary button */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  childActive
                    ? "bg-[#eef2ff] text-[#1e3a8a]"
                    : "text-[#374151] hover:bg-[#f9fafb] hover:text-slate-900",
                )}
              >
                <PrimaryIcon className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  childActive ? "text-[#1e3a8a]" : "text-[#9ca3af]",
                )} />
                <span className="flex-1 text-left truncate">{group.label}</span>
                {isOpen
                  ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                }
              </button>

              {/* Children */}
              {isOpen && visibleChildren.length > 0 && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-slate-100 space-y-0.5 pb-1">
                  {visibleChildren.map((child) => {
                    const ChildIcon: React.ElementType = (child.icon ? ICON_MAP[child.icon] : null) ?? ChevronRight;
                    const isChildActive =
                      pathname === child.href ||
                      (child.href !== "/dashboard" && pathname.startsWith(child.href + "/"));

                    // Badge count
                    const badgeCount = child.badgeKey
                      ? counts[child.badgeKey] ?? 0
                      : (child.badge ?? 0);

                    return (
                      <Link
                        key={`${group.id}_${child.href}`}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-all",
                          isChildActive
                            ? "bg-[#eef2ff] text-[#1e3a8a] font-medium"
                            : "text-[#6b7280] hover:bg-slate-50 hover:text-slate-800",
                        )}
                      >
                        <ChildIcon className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isChildActive ? "text-[#1e3a8a]" : "text-slate-400",
                        )} />
                        <span className="flex-1 truncate">{child.label}</span>
                        {badgeCount > 0 && (
                          <Badge
                            variant={isChildActive ? "secondary" : "destructive"}
                            className="h-4 min-w-4 justify-center rounded-full px-1 text-[9px] font-bold"
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── On-Duty Status Bar ───────────────────────────────────────────── */}
      <OnDutyBar collapsed={collapsed} />

      {/* ── ARIA Status Badge (managers only) ────────────────────────────── */}
      {!collapsed && (
        <AriaStatusBadge
          userRole={currentRole ?? ""}
          userId={currentUser?.id ?? "current_user"}
        />
      )}

      {/* ── User / Role Switcher ─────────────────────────────────────────── */}
      <RoleSwitcher collapsed={collapsed} />
    </aside>
  );
}
