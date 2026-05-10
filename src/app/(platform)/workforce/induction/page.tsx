"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDUCTION TRACKER
// Structured induction from Day 1 to probation completion.
// Compliance: Reg 33 — all staff must complete a structured induction before
// working unsupervised. Tracks milestones, phases, and sign-off.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import type { InductionRecord } from "@/types/extended";
import { cn, formatRelative } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import {
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, User,
  ChevronRight, ChevronDown, ChevronUp, Plus, Calendar,
  Rocket, Flag, Award, BookOpen, Pill, Shield, Users,
  Heart, Flame, Loader2, FileCheck, Briefcase, Star, Search, ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useInductionRecords } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import { type InductionCheckStatus } from "@/types/extended";

const INDUCTION_EXPORT_COLS: ExportColumn<InductionRecord>[] = [
  { header: "Staff", accessor: (r) => seedGetStaffName(r.staff_id) },
  { header: "Start Date", accessor: (r) => r.start_date },
  { header: "Target Completion", accessor: (r) => r.target_completion_date },
  { header: "Status", accessor: (r) => r.overall_status.replace(/_/g, " ") },
  { header: "Items Total", accessor: (r) => String(r.items.length) },
  { header: "Items Completed", accessor: (r) => String(r.items.filter((i) => i.status === "completed" || i.status === "signed_off").length) },
  { header: "Probation Passed", accessor: (r) => r.probation_passed ? "Yes" : "No" },
  { header: "Line Manager", accessor: (r) => seedGetStaffName(r.line_manager_id) },
];

// ── Induction phases ────────────────────────────────────────────────────────

const PHASES = [
  { key: "day1",    label: "Day 1",     maxDay: 1,   icon: Rocket,   color: "text-blue-600",    bgColor: "bg-blue-100" },
  { key: "week1",   label: "Week 1",    maxDay: 7,   icon: Flag,     color: "text-indigo-600",  bgColor: "bg-indigo-100" },
  { key: "month1",  label: "Month 1",   maxDay: 30,  icon: BookOpen, color: "text-violet-600",  bgColor: "bg-violet-100" },
  { key: "month3",  label: "Month 3",   maxDay: 90,  icon: Shield,   color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { key: "month6",  label: "Month 6",   maxDay: 180, icon: Award,    color: "text-amber-600",   bgColor: "bg-amber-100" },
  { key: "ongoing", label: "Ongoing",   maxDay: 999, icon: Star,     color: "text-pink-600",    bgColor: "bg-pink-100" },
];

const STATUS_CONFIG: Record<InductionCheckStatus, { label: string; colour: string; icon: React.ElementType }> = {
  not_started: { label: "Not Started", colour: "text-slate-600 bg-slate-50 border-slate-200",       icon: Clock       },
  in_progress: { label: "In Progress", colour: "text-amber-600 bg-amber-50 border-amber-200",       icon: Clock       },
  completed:   { label: "Completed",   colour: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  signed_off:  { label: "Signed Off",  colour: "text-blue-600 bg-blue-50 border-blue-200",           icon: ShieldCheck },
};

// ── Phase timeline component ────────────────────────────────────────────────

function PhaseTimeline({ items, startDate }: {
  items: Array<{ id: string; title: string; required_by_day: number; status: InductionCheckStatus; completed_at?: string }>;
  startDate: string;
}) {
  const grouped = useMemo(() => {
    return PHASES.map((phase) => {
      const prevMaxDay = PHASES[PHASES.indexOf(phase) - 1]?.maxDay ?? 0;
      const phaseItems = items.filter((i) => i.required_by_day > prevMaxDay && i.required_by_day <= phase.maxDay);
      const completed = phaseItems.filter((i) => i.status === "completed" || i.status === "signed_off").length;
      return { ...phase, items: phaseItems, completed, total: phaseItems.length };
    }).filter((p) => p.total > 0);
  }, [items]);

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200" />

      <div className="space-y-6">
        {grouped.map((phase) => {
          const PhaseIcon = phase.icon;
          const pct = phase.total > 0 ? Math.round((phase.completed / phase.total) * 100) : 0;
          const isComplete = pct === 100;

          return (
            <div key={phase.key} className="relative pl-12">
              {/* Phase dot */}
              <div className={cn(
                "absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl z-10",
                isComplete ? "bg-emerald-100" : phase.bgColor,
              )}>
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <PhaseIcon className={cn("h-5 w-5", phase.color)} />
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Phase header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{phase.label}</span>
                    <Badge className={cn(
                      "text-[10px] rounded-full border-0",
                      isComplete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
                    )}>
                      {phase.completed}/{phase.total}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 w-24">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className={cn(
                      "text-[10px] font-bold tabular-nums",
                      isComplete ? "text-emerald-600" : "text-slate-500",
                    )}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-50">
                  {phase.items.map((item) => {
                    const done = item.status === "completed" || item.status === "signed_off";
                    return (
                      <div key={item.id} className={cn(
                        "flex items-center gap-3 px-4 py-2.5 text-xs",
                        done ? "bg-emerald-50/30" : "",
                      )}>
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : item.status === "in_progress" ? (
                          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        <span className={cn(
                          "flex-1",
                          done ? "text-emerald-700 line-through decoration-emerald-300" : "text-slate-700",
                        )}>
                          {item.title}
                        </span>
                        <span className="text-slate-400 tabular-nums shrink-0">
                          Day {item.required_by_day}
                        </span>
                        {done && item.completed_at && (
                          <span className="text-emerald-500 tabular-nums shrink-0">
                            ✓ {item.completed_at.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Induction card ──────────────────────────────────────────────────────────

function InductionCard({
  record,
  getStaffName,
}: {
  record: ReturnType<typeof useInductionRecords>["data"] extends { data: (infer R)[] } | undefined ? R : never;
  getStaffName: (id: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[record.overall_status];
  const StatusIcon = statusCfg.icon;

  const completedItems = record.items.filter((i) => i.status === "completed" || i.status === "signed_off").length;
  const totalItems = record.items.length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Days since start
  const daysSinceStart = Math.ceil((Date.now() - new Date(record.start_date).getTime()) / 86400000);
  const daysToTarget = Math.ceil((new Date(record.target_completion_date).getTime() - Date.now()) / 86400000);
  const isOverdue = daysToTarget < 0;

  // Current phase
  const currentPhase = PHASES.find((p) => daysSinceStart <= p.maxDay) ?? PHASES[PHASES.length - 1];

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      record.overall_status === "signed_off" ? "border-blue-200" :
      isOverdue ? "border-red-200" :
      "border-slate-200",
    )}>
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={getStaffName(record.staff_id)} size="md" />
            <div>
              <p className="text-base font-bold text-slate-800">{getStaffName(record.staff_id)}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className={cn("text-[10px] border", statusCfg.colour)}>
                  <StatusIcon className="h-2.5 w-2.5 mr-1" />
                  {statusCfg.label}
                </Badge>
                {record.probation_passed && (
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                    <Award className="h-2.5 w-2.5 mr-1" />
                    Probation Passed
                  </Badge>
                )}
                {isOverdue && !record.probation_passed && (
                  <Badge className="text-[10px] bg-red-100 text-red-700 border-0">
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    Overdue
                  </Badge>
                )}
                <Badge className={cn("text-[10px] rounded-full border-0", currentPhase.bgColor, currentPhase.color)}>
                  {currentPhase.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Day {daysSinceStart}</p>
            <p className={cn(
              "text-[10px]",
              isOverdue ? "text-red-600 font-semibold" : "text-slate-400",
            )}>
              {isOverdue ? `${Math.abs(daysToTarget)} days overdue` : `${daysToTarget} days remaining`}
            </p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Overall Progress</span>
            <span className={cn(
              "text-xs font-bold",
              pct === 100 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : "text-amber-600",
            )}>
              {completedItems}/{totalItems} ({pct}%)
            </span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>

        {/* Phase indicators */}
        <div className="flex gap-1 mt-3">
          {PHASES.filter((p) => {
            const prevMaxDay = PHASES[PHASES.indexOf(p) - 1]?.maxDay ?? 0;
            return record.items.some((i) => i.required_by_day > prevMaxDay && i.required_by_day <= p.maxDay);
          }).map((phase) => {
            const prevMaxDay = PHASES[PHASES.indexOf(phase) - 1]?.maxDay ?? 0;
            const phaseItems = record.items.filter((i) => i.required_by_day > prevMaxDay && i.required_by_day <= phase.maxDay);
            const phaseCompleted = phaseItems.filter((i) => i.status === "completed" || i.status === "signed_off").length;
            const phasePct = phaseItems.length > 0 ? Math.round((phaseCompleted / phaseItems.length) * 100) : 0;
            const PhaseIcon = phase.icon;

            return (
              <div key={phase.key} className={cn(
                "flex-1 rounded-lg p-2 text-center border",
                phasePct === 100 ? "bg-emerald-50 border-emerald-200" :
                daysSinceStart >= (PHASES[PHASES.indexOf(phase) - 1]?.maxDay ?? 0) ? "bg-blue-50 border-blue-200" :
                "bg-slate-50 border-slate-200",
              )}>
                <PhaseIcon className={cn("h-3 w-3 mx-auto mb-0.5", phasePct === 100 ? "text-emerald-500" : phase.color)} />
                <div className="text-[9px] font-medium text-slate-600">{phase.label}</div>
                <div className={cn(
                  "text-[10px] font-bold",
                  phasePct === 100 ? "text-emerald-600" : "text-slate-500",
                )}>
                  {phasePct}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Buddy & manager */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Manager: <strong className="text-slate-700">{getStaffName(record.line_manager_id)}</strong>
          </span>
          {record.buddy_id && (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Buddy: <strong className="text-slate-700">{getStaffName(record.buddy_id)}</strong>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {record.start_date} → {record.target_completion_date}
          </span>
        </div>
      </div>

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide checklist timeline" : `Show all ${totalItems} checklist items`}
      </button>

      {/* Timeline */}
      {expanded && (
        <div className="px-5 pb-5 pt-2">
          <PhaseTimeline items={record.items} startDate={record.start_date} />
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function InductionTrackerPage() {
  const [filter, setFilter] = useState<"all" | InductionCheckStatus>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"progress" | "name" | "date" | "status">("progress");
  const inductionQuery = useInductionRecords();
  const staffQuery = useStaff();

  const records = inductionQuery.data?.data ?? [];
  const staff = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;

  const inProgress = records.filter((r) => r.overall_status === "in_progress").length;
  const completed = records.filter((r) => r.overall_status === "completed" || r.overall_status === "signed_off").length;
  const notStarted = records.filter((r) => r.overall_status === "not_started").length;

  // Overdue count
  const overdue = records.filter((r) => {
    if (r.overall_status === "completed" || r.overall_status === "signed_off") return false;
    return new Date(r.target_completion_date) < new Date();
  }).length;

  const filtered = useMemo(() => {
    let list = filter === "all" ? records : records.filter((r) => r.overall_status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const name = getStaffName(r.staff_id).toLowerCase();
        const items = r.items.map((i) => i.title).join(" ").toLowerCase();
        return name.includes(q) || items.includes(q) || r.overall_status.includes(q);
      });
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "date":
          return a.target_completion_date.localeCompare(b.target_completion_date);
        case "status": {
          const so: Record<string, number> = { not_started: 0, in_progress: 1, completed: 2, signed_off: 3 };
          return (so[a.overall_status] ?? 9) - (so[b.overall_status] ?? 9);
        }
        case "progress":
        default: {
          const pctA = a.items.length ? a.items.filter((i) => i.status === "completed" || i.status === "signed_off").length / a.items.length : 0;
          const pctB = b.items.length ? b.items.filter((i) => i.status === "completed" || i.status === "signed_off").length / b.items.length : 0;
          return pctA - pctB;
        }
      }
    });

    return list;
  }, [records, filter, search, staff, sortBy]);

  const isLoading = inductionQuery.isPending || staffQuery.isPending;

  if (isLoading) {
    return (
      <PageShell title="Induction Tracker" subtitle="Loading…">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Induction Tracker"
      subtitle="From Day 1 to probation completion — structured staff onboarding"
      ariaContext={{ pageTitle: "Staff Induction Tracker", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={INDUCTION_EXPORT_COLS} filename="induction-records" />
          <PrintButton
            title="Induction Records"
            subtitle="Oak House — Staff Induction Tracker"
            targetId="induction-content"
          />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Induction — staff induction evidence or certificate upload" />
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Induction
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="induction-content" className="space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "In Progress", value: inProgress, colour: "text-amber-600", bg: "border-amber-200 bg-amber-50", icon: Clock },
            { label: "Completed", value: completed, colour: "text-emerald-600", bg: "border-emerald-200 bg-emerald-50", icon: CheckCircle2 },
            { label: "Not Started", value: notStarted, colour: "text-slate-600", bg: "border-slate-200 bg-slate-50", icon: Briefcase },
            { label: "Overdue", value: overdue, colour: overdue > 0 ? "text-red-600" : "text-slate-400", bg: overdue > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50", icon: AlertTriangle },
          ].map((k) => {
            const KIcon = k.icon;
            return (
              <div key={k.label} className={cn("rounded-2xl border p-4 text-center", k.bg)}>
                <KIcon className={cn("h-4 w-4 mx-auto mb-1", k.colour)} />
                <p className={cn("text-2xl font-bold", k.colour)}>{k.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
              </div>
            );
          })}
        </div>

        {/* Team compliance summary */}
        {records.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCheck className="h-4 w-4 text-blue-500" />
                Team Induction Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {records.map((record) => {
                  const completedItems = record.items.filter((i) => i.status === "completed" || i.status === "signed_off").length;
                  const pct = record.items.length > 0 ? Math.round((completedItems / record.items.length) * 100) : 0;
                  const daysSinceStart = Math.ceil((Date.now() - new Date(record.start_date).getTime()) / 86400000);

                  return (
                    <div key={record.id} className="flex items-center gap-3 py-1.5">
                      <div className="w-24 text-xs font-medium text-slate-700 truncate">
                        {getStaffName(record.staff_id).split(" ")[0]}
                      </div>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold tabular-nums w-10 text-right",
                        pct === 100 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : "text-amber-600",
                      )}>
                        {pct}%
                      </span>
                      <span className="text-[10px] text-slate-400 w-12 text-right">
                        Day {daysSinceStart}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filter tabs */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search staff name, induction items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs rounded-lg"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
            <option value="progress">Progress (least first)</option>
            <option value="name">Name A–Z</option>
            <option value="date">Target date (soonest)</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "in_progress", "not_started", "completed", "signed_off"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                filter === f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300",
              )}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f]?.label ?? f}
              {f !== "all" && (
                <span className="ml-1 opacity-60">
                  ({records.filter((r) => r.overall_status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {(search || filter !== "all") && (
          <p className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
        )}

        {/* Induction records */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              {search || filter !== "all" ? "No records match your filters" : "No induction records found"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Create a new induction to begin tracking staff onboarding</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((record) => (
              <InductionCard
                key={record.id}
                record={record}
                getStaffName={getStaffName}
              />
            ))}
          </div>
        )}

        {/* Regulatory note */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 33 (induction — all staff must complete a structured induction
          before working unsupervised). The registered person must ensure induction covers safeguarding, medication,
          and the home&apos;s statement of purpose. Induction evidence is routinely checked at Ofsted inspection
          and during Reg 44 visits. A clear timeline with signed-off milestones demonstrates compliance.
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Staff Induction Tracker — new staff induction records, induction milestones, safeguarding training, medication training, Reg 33 induction compliance, Reg 40 safer recruitment, Ofsted workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
