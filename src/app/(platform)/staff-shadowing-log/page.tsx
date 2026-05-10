"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Lightbulb,
  Star,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStaffShadowingRecords } from "@/hooks/use-staff-shadowing-records";
import type { StaffShadowingRecord, StaffShadowingShiftType, StaffShadowingReadyStatus } from "@/types/extended";
import {
  STAFF_SHADOWING_SHIFT_TYPE_LABEL,
  STAFF_SHADOWING_READY_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config (colours not serializable) ─────────────────────────────── */

const READY_CLR: Record<StaffShadowingReadyStatus, string> = {
  yes: "bg-green-100 text-green-800",
  not_yet: "bg-amber-100 text-amber-800",
  additional_shadows_needed: "bg-blue-100 text-blue-800",
};

/* ── component ────────────────────────────────────────────────────────────── */

export default function StaffShadowingLogPage() {
  const { data: records = [], isLoading } = useStaffShadowingRecords();
  const [filterReady, setFilterReady] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterReady !== "all") items = items.filter((s) => s.ready_to_work_solo === filterReady);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "name":
          return a.new_staff.localeCompare(b.new_staff);
        case "progress":
          return (b.shadow_number / b.total_shadows_required) - (a.shadow_number / a.total_shadows_required);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterReady, sortBy]);

  const totalShifts = records.length;
  const signedOff = records.filter((s) => s.signed_off).length;
  const uniqueStaff = new Set(records.map((s) => s.new_staff)).size;
  const totalHours = records.reduce((sum, s) => sum + s.hours_shadowed, 0);

  const exportCols: ExportColumn<StaffShadowingRecord>[] = [
    { header: "New Staff", accessor: (r: StaffShadowingRecord) => r.new_staff },
    { header: "Role", accessor: (r: StaffShadowingRecord) => r.new_staff_role },
    { header: "Shadowed By", accessor: (r: StaffShadowingRecord) => getStaffName(r.shadowed_by) },
    { header: "Date", accessor: (r: StaffShadowingRecord) => r.date },
    { header: "Shift Type", accessor: (r: StaffShadowingRecord) => STAFF_SHADOWING_SHIFT_TYPE_LABEL[r.shift_type] },
    { header: "Hours", accessor: (r: StaffShadowingRecord) => String(r.hours_shadowed) },
    { header: "Shadow Number", accessor: (r: StaffShadowingRecord) => `${r.shadow_number}/${r.total_shadows_required}` },
    { header: "Ready Solo", accessor: (r: StaffShadowingRecord) => STAFF_SHADOWING_READY_STATUS_LABEL[r.ready_to_work_solo] },
    { header: "Signed Off", accessor: (r: StaffShadowingRecord) => r.signed_off ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Shadowing Log" subtitle="Records of new staff shadowing experienced colleagues during onboarding — supporting safe, supervised induction">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Shadowing Log"
      subtitle="Records of new staff shadowing experienced colleagues during onboarding — supporting safe, supervised induction"
      ariaContext={{ pageTitle: "Staff Shadowing Log", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="staff-shadowing-log" />
          <PrintButton title="Staff Shadowing Log" />
          <AriaStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalShifts}</p>
          <p className="text-xs text-muted-foreground">Total Shifts Logged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{signedOff}</p>
          <p className="text-xs text-muted-foreground">Sign-Offs Complete</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{uniqueStaff}</p>
          <p className="text-xs text-muted-foreground">New Staff in Process</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total Shadow Hours</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Eye className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          New staff complete a minimum of <strong>4 shadow shifts</strong> (6 for those new to children&apos;s homes
          sector) across different shift types before working solo. Sign-off requires demonstrated competency
          across all core areas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterReady} onValueChange={setFilterReady}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STAFF_SHADOWING_READY_STATUS_LABEL) as [StaffShadowingReadyStatus, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="name">By New Staff</SelectItem>
              <SelectItem value="progress">By Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((shift) => {
          const isExpanded = expandedId === shift.id;
          const pct = Math.round((shift.shadow_number / shift.total_shadows_required) * 100);

          return (
            <div key={shift.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : shift.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Eye className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{shift.new_staff} &middot; Shadow {shift.shadow_number}/{shift.total_shadows_required}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {shift.date} &middot; {STAFF_SHADOWING_SHIFT_TYPE_LABEL[shift.shift_type]} ({shift.hours_shadowed}h) &middot; with {getStaffName(shift.shadowed_by)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", READY_CLR[shift.ready_to_work_solo])}>
                    {STAFF_SHADOWING_READY_STATUS_LABEL[shift.ready_to_work_solo]}
                  </span>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {shift.signed_off && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Areas Observed</p>
                    <ul className="space-y-1">
                      {shift.areas_observed.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Eye className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Competencies Demonstrated
                      </p>
                      <ul className="space-y-1">
                        {shift.competencies_demonstrated.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Competencies Developing
                      </p>
                      <ul className="space-y-1">
                        {shift.competencies_developing.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Clock className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Lightbulb className="h-3 w-3 inline mr-1" />Observer Feedback
                    </p>
                    <p className="text-sm text-blue-900">{shift.observer_feedback}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">New Staff Reflection</p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{shift.new_staff_reflection}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                    <ul className="space-y-1">
                      {shift.follow_up_actions.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Clock className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Role: {shift.new_staff_role}</span>
                    <span>Recorded by: {getStaffName(shift.recorded_by)}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      shift.signed_off ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {shift.signed_off ? "Sign-Off Complete" : "Sign-Off Pending"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Shadow shifts support Regulation 32 (fitness of workers),
          Regulation 33 (induction), Quality Standard 13 (leadership and management), and KCSIE 2024 induction
          requirements. Shadow records form part of the staff member&apos;s induction file. New staff cannot
          work solo until competency sign-off is complete.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Staff Shadowing Log — new staff shadowing experienced staff, competency observation, induction, buddy system, practice assessment, probation, skill development, feedback"
        recordType="supervision"
        className="mt-6"
      />
    </PageShell>
  );
}
