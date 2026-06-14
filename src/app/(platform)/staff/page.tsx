"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, Plus, Users, Clock, Shield, GraduationCap,
  Mail, Phone, ChevronRight, AlertTriangle, CheckCircle2,
  Loader2, Calendar, ArrowUpDown, Filter,
} from "lucide-react";

type StatusFilter = "all" | "on_shift" | "on_leave" | "supervision_due" | "training_expired";
type SortKey = "name" | "tasks" | "training" | "hours";
import { useStaff, type StaffEnriched } from "@/hooks/use-staff";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { PageGuidance } from "@/components/ui/page-guidance";
import { cn, todayStr, formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const STAFF_EXPORT_COLS: ExportColumn<StaffEnriched>[] = [
  { header: "Name", accessor: (s) => s.full_name },
  { header: "Role", accessor: (s) => ROLE_LABELS[s.role] ?? s.role },
  { header: "Email", accessor: (s) => s.email },
  { header: "Phone", accessor: (s) => s.phone },
  { header: "Start Date", accessor: (s) => s.start_date },
  { header: "Employment Type", accessor: (s) => s.employment_type },
  { header: "DBS Number", accessor: (s) => s.dbs_number },
  { header: "DBS Issue Date", accessor: (s) => s.dbs_issue_date },
  { header: "Active", accessor: (s) => s.is_active ? "Yes" : "No" },
];

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selectedStaff, setSelectedStaff] = useState<StaffEnriched | null>(null);
  const router = useRouter();
  const today = todayStr();

  const { data, isLoading, isError } = useStaff();
  const staffList: StaffEnriched[] = data?.data ?? [];
  const meta = data?.meta;

  const roles = useMemo(() => [...new Set(staffList.map((s) => s.role))], [staffList]);

  // Computed stats
  const complianceStats = useMemo(() => {
    const withExpiredTraining = staffList.filter((s) => s.training_expired_count > 0).length;
    const withOverdueTasks = staffList.filter((s) => s.overdue_tasks > 0).length;
    const supervisionDue = staffList.filter((s) => s.supervision_overdue).length;
    const totalContractedHours = staffList.reduce((sum, s) => sum + s.contracted_hours, 0);
    return { withExpiredTraining, withOverdueTasks, supervisionDue, totalContractedHours };
  }, [staffList]);

  const filtered = useMemo(() => {
    let list = staffList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q) || s.job_title.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q));
    }
    if (filterRole) list = list.filter((s) => s.role === filterRole);

    // Status filter
    switch (statusFilter) {
      case "on_shift": list = list.filter((s) => s.is_on_shift_today); break;
      case "on_leave": list = list.filter((s) => s.is_on_leave_today); break;
      case "supervision_due": list = list.filter((s) => s.supervision_overdue); break;
      case "training_expired": list = list.filter((s) => s.training_expired_count > 0); break;
    }

    // Sort
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "tasks": return b.active_tasks - a.active_tasks;
        case "training": return b.training_expired_count - a.training_expired_count;
        case "hours": return b.contracted_hours - a.contracted_hours;
        default: return a.full_name.localeCompare(b.full_name);
      }
    });
  }, [staffList, search, filterRole, statusFilter, sortKey]);

  return (
    <PageShell
      title="Staff"
      subtitle={meta ? `${meta.total} active team members · ${meta.on_shift} on shift today` : "Loading…"}
      caraContext={{ pageTitle: "Staff", sourceType: "staff" }}
      quickCreateContext={{ module: "staff", defaultTaskCategory: "admin" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton<StaffEnriched> filename="staff-export" data={filtered} columns={STAFF_EXPORT_COLS} label="Export" />
          <PrintButton title="Staff" subtitle="Chamberlain House — Staff Directory" targetId="staff-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Staff — HR document upload" />
          <Button size="sm" disabled title="Staff records are managed in your HR system.">
            <Plus className="h-3.5 w-3.5" /> Add Staff Member
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="staff-content" className="space-y-6 animate-fade-in">

        <PageGuidance
          title="Team management"
          description="Staff directory, supervision tracking, training compliance, and shift management. Click any team member to see their full profile and compliance status."
          evidenceTip="Reg 44 visitors check that staff have up-to-date DBS, training, and regular supervision. Keep profiles current to demonstrate compliance."
          caraTip="Cara tracks supervision frequency and training expiry across your team, alerting you before deadlines are missed."
          regulationRef="Children's Homes Regulations 2015, Reg 33 — Employment of staff"
          variant="compliance"
        />

        {/* Stats bar */}
        {meta && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Active Staff", value: meta.total, icon: Users, color: "text-[var(--cs-navy)]", bg: "bg-slate-50" },
              { label: "On Shift Today", value: meta.on_shift, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "On Leave", value: meta.on_leave, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Bank Staff", value: meta.bank, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Supervision Overdue", value: meta.supervision_overdue, icon: AlertTriangle, color: meta.supervision_overdue > 0 ? "text-red-600" : "text-emerald-600", bg: meta.supervision_overdue > 0 ? "bg-red-50" : "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl border border-[var(--cs-border-subtle)] bg-white p-4 flex items-center gap-3">
                <div className={cn("rounded-xl p-2", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div>
                  <div className={cn("text-xl font-bold tabular-nums", color)}>{value}</div>
                  <div className="text-[10px] text-[var(--cs-text-muted)] leading-tight">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compliance alerts */}
        {complianceStats.withExpiredTraining > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {complianceStats.withExpiredTraining} staff member{complianceStats.withExpiredTraining !== 1 ? "s have" : " has"} expired training
              </p>
              <p className="text-xs text-red-600 mt-0.5">Expired mandatory training must be addressed to maintain Ofsted compliance (Reg 33)</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--cs-text-muted)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff by name, title, or email…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button variant={!filterRole ? "default" : "outline"} size="sm" onClick={() => setFilterRole(null)}>All</Button>
            {roles.map((role) => (
              <Button key={role} variant={filterRole === role ? "default" : "outline"} size="sm" onClick={() => setFilterRole(filterRole === role ? null : role)}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
              </Button>
            ))}
          </div>
        </div>

        {/* Status filter + sort */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            {([
              { key: "all" as StatusFilter, label: "All Status" },
              { key: "on_shift" as StatusFilter, label: "On Shift" },
              { key: "on_leave" as StatusFilter, label: "On Leave" },
              { key: "supervision_due" as StatusFilter, label: "Supervision Due" },
              { key: "training_expired" as StatusFilter, label: "Training Expired" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                  statusFilter === key
                    ? key === "training_expired" || key === "supervision_due" ? "bg-red-600 text-white" : "bg-slate-900 text-white"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-[var(--cs-cara-gold)] focus:ring-1 focus:ring-[var(--cs-cara-gold)]/30 outline-none"
            >
              <option value="name">Name A-Z</option>
              <option value="tasks">Most tasks</option>
              <option value="training">Training issues</option>
              <option value="hours">Hours (high to low)</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {(search || filterRole || statusFilter !== "all") && (
          <p className="text-xs text-[var(--cs-text-muted)]">
            Showing {filtered.length} of {staffList.length} staff
            {search && <span className="text-[var(--cs-text-muted)]"> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 inline mr-2" />Failed to load staff. Please refresh.
          </div>
        )}

        {/* Staff Grid */}
        {!isLoading && !isError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((staff) => (
              <Card
                key={staff.id}
                className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group"
                onClick={() => setSelectedStaff(staff)}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar name={staff.full_name} size="lg" />
                      {staff.is_on_shift_today && staff.today_shift_status === "in_progress" && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" title="On shift" />
                      )}
                      {staff.is_on_leave_today && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-500 border-2 border-white" title="On leave" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--cs-navy)] truncate">{staff.full_name}</div>
                      <div className="text-xs text-[var(--cs-text-muted)]">{staff.job_title}</div>
                      {staff.probation_end_date && staff.probation_end_date > today && (
                        <Badge variant="warning" className="text-[9px] mt-1 rounded-full">Probation</Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className={cn("text-lg font-bold", staff.overdue_tasks > 0 ? "text-red-600" : "text-[var(--cs-navy)]")}>
                        {staff.active_tasks}
                      </div>
                      <div className="text-[10px] text-[var(--cs-text-muted)]">Tasks</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className={cn("text-lg font-bold", staff.training_expired_count > 0 ? "text-red-600" : "text-emerald-600")}>
                        {staff.training_total_count - staff.training_expired_count}/{staff.training_total_count}
                      </div>
                      <div className="text-[10px] text-[var(--cs-text-muted)]">Training</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <div className="text-lg font-bold text-[var(--cs-navy)]">{staff.contracted_hours}h</div>
                      <div className="text-[10px] text-[var(--cs-text-muted)]">Contracted</div>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {staff.is_on_shift_today && (
                      <Badge variant="success" className="text-[9px] rounded-full gap-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse-dot" />
                        {staff.today_shift_type === "day" ? "Day shift" : staff.today_shift_type === "sleep_in" ? "Sleep-in" : staff.today_shift_type ?? "On shift"}
                      </Badge>
                    )}
                    {staff.is_on_leave_today && <Badge variant="warning" className="text-[9px] rounded-full">On leave</Badge>}
                    {staff.overdue_tasks > 0 && <Badge variant="destructive" className="text-[9px] rounded-full">{staff.overdue_tasks} overdue</Badge>}
                    {staff.training_expired_count > 0 && <Badge variant="destructive" className="text-[9px] rounded-full">{staff.training_expired_count} training expired</Badge>}
                    {staff.supervision_overdue && <Badge variant="warning" className="text-[9px] rounded-full">Supervision due</Badge>}
                  </div>

                  {/* Contact */}
                  <div className="mt-3 pt-3 border-t border-[var(--cs-border-subtle)] flex items-center gap-3 text-[10px] text-[var(--cs-text-muted)]">
                    {staff.email && <span className="flex items-center gap-0.5 truncate"><Mail className="h-3 w-3" />{staff.email}</span>}
                    {staff.phone && <span className="flex items-center gap-0.5 shrink-0"><Phone className="h-3 w-3" />{staff.phone}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && !isLoading && (
              <div className="col-span-4 flex flex-col items-center justify-center py-20 text-center">
                <Users className="h-10 w-10 text-slate-200 mb-3" />
                <div className="text-[var(--cs-text-muted)] font-medium">No staff members match your search</div>
                <div className="text-xs text-[var(--cs-text-muted)] mt-1">Try adjusting your filters</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Detail Panel */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setSelectedStaff(null)}>
          <div className="w-full max-w-lg bg-white shadow-[var(--cs-shadow-elevated)] overflow-y-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedStaff.full_name} size="lg" />
                <div>
                  <div className="text-lg font-bold text-[var(--cs-navy)]">{selectedStaff.full_name}</div>
                  <div className="text-sm text-[var(--cs-text-muted)]">{selectedStaff.job_title}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelectedStaff(null)}>
                <span className="sr-only">Close</span>&times;
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                {selectedStaff.is_on_shift_today && (
                  <Badge variant="success" className="rounded-full gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse-dot" />
                    {selectedStaff.today_shift_type === "day" ? "On day shift" : selectedStaff.today_shift_type === "sleep_in" ? "Sleep-in tonight" : "On shift"}
                  </Badge>
                )}
                {selectedStaff.is_on_leave_today && <Badge variant="warning" className="rounded-full">On leave today</Badge>}
                {selectedStaff.supervision_overdue && <Badge variant="destructive" className="rounded-full">Supervision overdue</Badge>}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className={cn("text-2xl font-bold", selectedStaff.overdue_tasks > 0 ? "text-red-600" : "text-[var(--cs-navy)]")}>{selectedStaff.active_tasks}</div>
                  <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">Active Tasks</div>
                  {selectedStaff.overdue_tasks > 0 && <div className="text-[9px] text-red-500 mt-0.5">{selectedStaff.overdue_tasks} overdue</div>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className={cn("text-2xl font-bold", selectedStaff.training_expired_count > 0 ? "text-red-600" : "text-emerald-600")}>
                    {selectedStaff.training_total_count - selectedStaff.training_expired_count}/{selectedStaff.training_total_count}
                  </div>
                  <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">Training</div>
                  {selectedStaff.training_expiring_count > 0 && <div className="text-[9px] text-amber-500 mt-0.5">{selectedStaff.training_expiring_count} expiring</div>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-2xl font-bold text-[var(--cs-navy)]">{selectedStaff.contracted_hours}h</div>
                  <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">Contracted</div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--cs-navy)] mb-3">Employment Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Start Date</div><div className="text-sm font-medium">{formatDate(selectedStaff.start_date)}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Employment</div><div className="text-sm font-medium capitalize">{selectedStaff.employment_type}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Contracted Hours</div><div className="text-sm font-medium">{selectedStaff.contracted_hours}h/week</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Payroll ID</div><div className="text-sm font-medium">{selectedStaff.payroll_id || "N/A"}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">DBS Number</div><div className="text-sm font-medium">{selectedStaff.dbs_number || "N/A"}</div></div>
                  <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Next Supervision</div><div className={cn("text-sm font-medium", selectedStaff.supervision_overdue ? "text-red-600" : "text-[var(--cs-navy)]")}>{selectedStaff.next_supervision_due ? formatDate(selectedStaff.next_supervision_due) : "Not set"}</div></div>
                </div>
              </div>

              {/* Training summary */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--cs-navy)] mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[var(--cs-text-muted)]" />
                  Training &amp; Compliance
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                    <div className="text-xl font-bold text-emerald-700">{selectedStaff.training_total_count - selectedStaff.training_expired_count - selectedStaff.training_expiring_count}</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">Compliant</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <div className="text-xl font-bold text-amber-700">{selectedStaff.training_expiring_count}</div>
                    <div className="text-[10px] text-amber-600 mt-0.5">Expiring soon</div>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
                    <div className="text-xl font-bold text-red-700">{selectedStaff.training_expired_count}</div>
                    <div className="text-[10px] text-red-600 mt-0.5">Expired</div>
                  </div>
                </div>
                <p className="text-xs text-[var(--cs-text-muted)] mt-2 text-center">Full training matrix available in the Training module</p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--cs-navy)] mb-3">Contact</h3>
                <div className="space-y-2">
                  {selectedStaff.email && (
                    <a href={`mailto:${selectedStaff.email}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-[var(--cs-surface)] transition-colors">
                      <Mail className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
                      <span className="text-sm text-[var(--cs-text-secondary)]">{selectedStaff.email}</span>
                    </a>
                  )}
                  {selectedStaff.phone && (
                    <a href={`tel:${selectedStaff.phone}`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-[var(--cs-surface)] transition-colors">
                      <Phone className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
                      <span className="text-sm text-[var(--cs-text-secondary)]">{selectedStaff.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedStaff.emergency_contact_name && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--cs-navy)] mb-3">Emergency Contact</h3>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-sm font-medium">{selectedStaff.emergency_contact_name}</div>
                    <div className="text-xs text-[var(--cs-text-muted)]">{selectedStaff.emergency_contact_phone}</div>
                  </div>
                </div>
              )}

              {/* Quick navigation */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setSelectedStaff(null); router.push("/supervision"); }}>
                  <Shield className="h-3.5 w-3.5" />View Supervision
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => { setSelectedStaff(null); router.push("/training"); }}>
                  <GraduationCap className="h-3.5 w-3.5" />View Training
                </Button>
                <Button size="sm" className="col-span-2 gap-2 bg-slate-900 hover:bg-slate-800 text-white justify-center" onClick={() => { setSelectedStaff(null); router.push(`/staff/${selectedStaff.id}`); }}>
                  <ChevronRight className="h-3.5 w-3.5" />View Full Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={14}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Staff Register — staff records, roles, qualifications, DBS status, training compliance, supervision records, Reg 40 workforce evidence, Ofsted staffing inspection evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
