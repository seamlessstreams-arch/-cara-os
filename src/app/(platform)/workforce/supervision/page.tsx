"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import {
  MessageSquare, Clock, CheckCircle2, AlertTriangle, Plus,
  ChevronRight, Calendar, Search, Users, ShieldAlert,
  TrendingUp, BarChart2, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { useStaff, type StaffEnriched } from "@/hooks/use-staff";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

const SUPERVISION_HUB_EXPORT_COLS: ExportColumn<StaffEnriched>[] = [
  { header: "Name", accessor: (s) => s.full_name },
  { header: "Job Title", accessor: (s) => s.job_title },
  { header: "Role", accessor: (s) => s.role },
  { header: "Days Until Due", accessor: (s) => s.supervision_days_until_due != null ? String(s.supervision_days_until_due) : "N/A" },
  { header: "Next Supervision Due", accessor: (s) => s.next_supervision_due ?? "" },
  { header: "Supervision Overdue", accessor: (s) => s.supervision_overdue ? "Yes" : "No" },
];

type StatusKey = "overdue" | "due_soon" | "on_track" | "unknown";
type FilterKey = "all" | StatusKey;

const STATUS_CONFIG: Record<StatusKey, { label: string; colour: string; icon: React.ElementType }> = {
  overdue:  { label: "Overdue",   colour: "text-red-700 bg-red-50 border-red-200",          icon: AlertTriangle },
  due_soon: { label: "Due Soon",  colour: "text-amber-700 bg-amber-50 border-amber-200",    icon: Clock         },
  on_track: { label: "On Track",  colour: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  unknown:  { label: "No Date",   colour: "text-[var(--cs-text-secondary)] bg-slate-50 border-[var(--cs-border)]",    icon: Clock         },
};

const SORT_ORDER: Record<StatusKey, number> = { overdue: 0, due_soon: 1, unknown: 2, on_track: 3 };

export default function WorkforceSupervisionPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<"status" | "name" | "next_due">("status");

  const staffQuery = useStaff();
  const allStaff = staffQuery.data?.data?.filter((s) => s.is_active && s.role !== "responsible_individual") ?? [];

  const today = new Date();

  const getSupervisionStatus = (nextDue: string | null | undefined): StatusKey => {
    if (!nextDue) return "unknown";
    const due = new Date(nextDue);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return "overdue";
    if (diffDays <= 3) return "due_soon";
    return "on_track";
  };

  const getDiffDays = (nextDue: string | null | undefined): number | null => {
    if (!nextDue) return null;
    return Math.ceil((new Date(nextDue).getTime() - today.getTime()) / 86400000);
  };

  // Stats
  const stats = useMemo(() => {
    const overdue = allStaff.filter((s) => getSupervisionStatus(s.next_supervision_due) === "overdue").length;
    const dueSoon = allStaff.filter((s) => getSupervisionStatus(s.next_supervision_due) === "due_soon").length;
    const onTrack = allStaff.filter((s) => getSupervisionStatus(s.next_supervision_due) === "on_track").length;
    const noDate  = allStaff.filter((s) => getSupervisionStatus(s.next_supervision_due) === "unknown").length;
    const compliant = allStaff.length > 0 ? Math.round(((onTrack + dueSoon) / allStaff.length) * 100) : 0;

    // Next upcoming supervision
    const upcoming = allStaff
      .filter((s) => s.next_supervision_due && getDiffDays(s.next_supervision_due)! >= 0)
      .sort((a, b) => new Date(a.next_supervision_due!).getTime() - new Date(b.next_supervision_due!).getTime());
    const nextUp = upcoming[0] ?? null;

    return { overdue, dueSoon, onTrack, noDate, compliant, total: allStaff.length, nextUp };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStaff]);

  // Filtered + searched
  const filteredStaff = useMemo(() => {
    let result = allStaff;

    if (filter !== "all") {
      result = result.filter((s) => getSupervisionStatus(s.next_supervision_due) === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.full_name.toLowerCase().includes(q) || s.job_title.toLowerCase().includes(q),
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "next_due":
          return (a.next_supervision_due ?? "9999").localeCompare(b.next_supervision_due ?? "9999");
        case "status":
        default:
          return SORT_ORDER[getSupervisionStatus(a.next_supervision_due)] - SORT_ORDER[getSupervisionStatus(b.next_supervision_due)];
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStaff, filter, search, sortBy]);

  return (
    <PageShell
      title="Supervision Hub"
      subtitle="Reflective supervision tracker — Reg 34 compliance at a glance"
      caraContext={{ pageTitle: "Supervision Hub", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredStaff} columns={SUPERVISION_HUB_EXPORT_COLS} filename="supervision-hub" />
          <PrintButton title="Supervision Hub" subtitle="Reg 34 Compliance" targetId="supervision-hub-content" />
          <SmartUploadButton variant="inline" label="Upload Notes" uploadContext="Workforce Supervision — supervision notes or agenda upload" />
          <Link href="/supervision">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Supervision
            </Button>
          </Link>
          <CaraStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="supervision-hub-content" className="space-y-0">

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Users className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-[var(--cs-navy)] tabular-nums">{stats.total}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Total Staff</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", stats.overdue > 0 ? "border-red-200 bg-red-50" : "border-[var(--cs-border)] bg-white")}>
          <AlertTriangle className={cn("h-4 w-4 mx-auto mb-1", stats.overdue > 0 ? "text-red-500" : "text-[var(--cs-text-gentle)]")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.overdue > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>{stats.overdue}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Overdue</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", stats.dueSoon > 0 ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white")}>
          <Clock className={cn("h-4 w-4 mx-auto mb-1", stats.dueSoon > 0 ? "text-amber-500" : "text-[var(--cs-text-gentle)]")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.dueSoon > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{stats.dueSoon}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Due Soon</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-emerald-700 tabular-nums">{stats.onTrack}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">On Track</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <TrendingUp className={cn("h-4 w-4 mx-auto mb-1", stats.compliant >= 80 ? "text-emerald-500" : stats.compliant >= 60 ? "text-amber-500" : "text-red-500")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.compliant >= 80 ? "text-emerald-700" : stats.compliant >= 60 ? "text-amber-700" : "text-red-700")}>
            {stats.compliant}%
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Compliance</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Calendar className={cn("h-4 w-4 mx-auto mb-1", stats.noDate > 0 ? "text-[var(--cs-text-muted)]" : "text-[var(--cs-text-gentle)]")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.noDate > 0 ? "text-[var(--cs-text-secondary)]" : "text-[var(--cs-text-muted)]")}>{stats.noDate}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">No Date Set</div>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-medium text-[var(--cs-text-muted)] shrink-0">Reg 34 Compliance</span>
        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full flex">
            {stats.onTrack > 0 && (
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(stats.onTrack / stats.total) * 100}%` }}
              />
            )}
            {stats.dueSoon > 0 && (
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${(stats.dueSoon / stats.total) * 100}%` }}
              />
            )}
            {stats.overdue > 0 && (
              <div
                className="bg-red-400 h-full"
                style={{ width: `${(stats.overdue / stats.total) * 100}%` }}
              />
            )}
            {stats.noDate > 0 && (
              <div
                className="bg-slate-300 h-full"
                style={{ width: `${(stats.noDate / stats.total) * 100}%` }}
              />
            )}
          </div>
        </div>
        <span className={cn(
          "text-[10px] font-bold tabular-nums",
          stats.compliant >= 80 ? "text-emerald-600" : stats.compliant >= 60 ? "text-amber-600" : "text-red-600",
        )}>
          {stats.onTrack + stats.dueSoon}/{stats.total}
        </span>
      </div>

      {/* Overdue alert */}
      {stats.overdue > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700">
              {stats.overdue} staff member{stats.overdue !== 1 ? "s" : ""} overdue for supervision
            </p>
            <p className="text-[11px] text-red-600">
              Reg 34 requires all staff to receive regular reflective supervision. Overdue supervisions are a common Ofsted shortfall finding.
            </p>
          </div>
        </div>
      )}

      {stats.overdue === 0 && stats.total > 0 && stats.noDate === 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-700">All supervisions up to date</p>
            <p className="text-[10px] text-emerald-600">No staff members overdue — full Reg 34 compliance</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white py-1.5 pl-9 pr-3 text-xs text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:border-[var(--cs-cara-gold)] focus:ring-1 focus:ring-[var(--cs-cara-gold)]/30 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="status">Status (overdue first)</option>
            <option value="name">Name A–Z</option>
            <option value="next_due">Next due (soonest)</option>
          </select>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "all" as FilterKey, label: "All", count: allStaff.length },
            { key: "overdue" as FilterKey, label: "Overdue", count: stats.overdue },
            { key: "due_soon" as FilterKey, label: "Due Soon", count: stats.dueSoon },
            { key: "on_track" as FilterKey, label: "On Track", count: stats.onTrack },
            { key: "unknown" as FilterKey, label: "No Date", count: stats.noDate },
          ]).filter((t) => t.key === "all" || t.count > 0).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                filter === tab.key
                  ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                  : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-indigo-300",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Staff supervision status */}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border-subtle)] bg-slate-50">
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">Staff Supervision Status</p>
          <span className="text-[10px] text-[var(--cs-text-muted)]">{filteredStaff.length} staff</span>
        </div>
        <div className="divide-y divide-slate-50">
          {filteredStaff.map((member) => {
            const statusKey = getSupervisionStatus(member.next_supervision_due);
            const statusCfg = STATUS_CONFIG[statusKey];
            const StatusIcon = statusCfg.icon;
            const diffDays = getDiffDays(member.next_supervision_due);

            return (
              <div key={member.id} className={cn(
                "flex items-center gap-4 px-4 py-3 hover:bg-[var(--cs-surface)] transition-colors",
                statusKey === "overdue" && "bg-red-50/30",
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  statusKey === "overdue" ? "bg-red-100 text-red-700"
                  : statusKey === "due_soon" ? "bg-amber-100 text-amber-700"
                  : "bg-indigo-100 text-indigo-700",
                )}>
                  {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--cs-navy)]">{member.full_name}</p>
                    {member.is_on_shift_today && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">On Shift</span>
                    )}
                    {member.is_on_leave_today && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-[var(--cs-text-secondary)] font-medium">On Leave</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--cs-text-muted)]">{member.job_title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Days until due indicator */}
                  {member.supervision_days_until_due !== null && (
                    <div className="hidden sm:block text-right">
                      <p className={cn(
                        "text-xs font-bold tabular-nums",
                        member.supervision_days_until_due < 0 ? "text-red-600"
                        : member.supervision_days_until_due <= 3 ? "text-amber-600"
                        : "text-[var(--cs-text-secondary)]",
                      )}>
                        {member.supervision_days_until_due < 0
                          ? `${Math.abs(member.supervision_days_until_due)}d overdue`
                          : member.supervision_days_until_due === 0
                            ? "Today"
                            : `${member.supervision_days_until_due}d`}
                      </p>
                    </div>
                  )}

                  <div className="text-right">
                    {member.next_supervision_due ? (
                      <p className="text-xs text-[var(--cs-text-muted)] flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.next_supervision_due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--cs-text-muted)]">No date set</p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] border", statusCfg.colour)}>
                    <StatusIcon className="h-2.5 w-2.5 mr-1" />
                    {statusCfg.label}
                  </Badge>
                  <Link href="/supervision">
                    <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)] transition-colors" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredStaff.length === 0 && allStaff.length > 0 && (
        <div className="text-center py-8 text-[var(--cs-text-muted)]">
          <Search className="h-6 w-6 mx-auto mb-2 text-[var(--cs-text-gentle)]" />
          <p className="text-sm">No staff match your search</p>
          <p className="text-xs mt-1">Try adjusting the search or filter</p>
        </div>
      )}

      {/* Next upcoming */}
      {stats.nextUp && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 flex items-center gap-3">
          <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-800">Next Supervision</p>
            <p className="text-[11px] text-blue-700">
              {stats.nextUp.full_name} — {new Date(stats.nextUp.next_supervision_due!).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Link href="/supervision">
            <ChevronRight className="h-4 w-4 text-blue-300 hover:text-blue-500 transition-colors" />
          </Link>
        </div>
      )}

      {/* Link to full supervision module */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-900">Full Supervision Records</p>
            <p className="text-xs text-indigo-700 mt-0.5">Detailed supervision logs, reflective notes, and Cara insights are in the People module</p>
          </div>
          <Link href="/supervision">
            <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-100">
              Open Supervision <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
        <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
        Children&apos;s Homes Regulations 2015: Reg 34 (all staff must receive regular supervision from their line
        manager). Monthly minimum for frontline staff; fortnightly for managers in complex homes. Supervision must be
        reflective and development-focused. Frequency and quality are assessed by Ofsted at inspection.
      </div>
      </div>{/* close #supervision-hub-content */}
      <CaraPanel
        mode="assist"
        pageContext="Supervision Hub — staff supervision schedule, Reg 34 supervision compliance, overdue supervision, reflective supervision records, management oversight, ILACS workforce quality, Ofsted inspection evidence"
        recordType="supervision"
        className="mt-6"
      />
    </PageShell>
  );
}
