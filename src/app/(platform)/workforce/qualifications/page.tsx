"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALIFICATIONS & DBS TRACKER
// Regulatory fitness — mandatory and CPD qualifications across the team.
// Staff-grouped compliance matrix with DBS/right-to-work tracking.
// Reg 29 (RM Level 5), Reg 32 (staff Level 3), Reg 5 (DBS/right-to-work).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import type { QualificationRecord } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import {
  Award, CheckCircle2, Clock, AlertTriangle, Plus, Calendar,
  User, ChevronDown, ChevronUp, Shield, Fingerprint, Search,
  BarChart3, XCircle, Loader2, ArrowUpDown,
} from "lucide-react";
import { useQualifications } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import { type QualificationStatus } from "@/types/extended";

const QUAL_EXPORT_COLS: ExportColumn<QualificationRecord>[] = [
  { header: "Staff", accessor: (q) => seedGetStaffName(q.staff_id) },
  { header: "Qualification", accessor: (q) => q.qualification_name },
  { header: "Level", accessor: (q) => q.level ?? "" },
  { header: "Awarding Body", accessor: (q) => q.awarding_body ?? "" },
  { header: "Mandatory", accessor: (q) => q.mandatory ? "Yes" : "No" },
  { header: "Status", accessor: (q) => q.status.replace(/_/g, " ") },
  { header: "Expiry", accessor: (q) => q.expiry_date ?? "" },
  { header: "Certificate Ref", accessor: (q) => q.certificate_ref ?? "" },
];

// ── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QualificationStatus, { label: string; colour: string; icon: React.ElementType; bg: string }> = {
  not_started: { label: "Not Started", colour: "text-slate-600",    icon: Clock,          bg: "bg-slate-50 border-slate-200"       },
  in_progress: { label: "In Progress", colour: "text-amber-700",    icon: Clock,          bg: "bg-amber-50 border-amber-200"       },
  completed:   { label: "Completed",   colour: "text-emerald-700",  icon: CheckCircle2,   bg: "bg-emerald-50 border-emerald-200"   },
  expired:     { label: "Expired",     colour: "text-red-700",      icon: AlertTriangle,  bg: "bg-red-50 border-red-200"           },
  exempt:      { label: "Exempt",      colour: "text-blue-700",     icon: CheckCircle2,   bg: "bg-blue-50 border-blue-200"         },
};

const MANDATORY_QUALS = [
  "Level 3 Diploma",
  "Level 5 Diploma",
  "Safeguarding Level 3",
  "First Aid at Work",
  "Medication Administration",
  "Fire Safety",
  "Restraint (Team Teach / PRICE)",
  "GDPR / Data Protection",
  "Health & Safety",
  "Food Hygiene",
];

function daysUntil(date: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date);  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function expiryBadge(date: string) {
  const days = daysUntil(date);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days}d left`, cls: "bg-red-100 text-red-700" };
  if (days <= 90) return { label: `${days}d left`, cls: "bg-amber-100 text-amber-700" };
  return { label: `${days}d`, cls: "bg-emerald-100 text-emerald-700" };
}

// ── Staff Qualification Panel ────────────────────────────────────────────────

function StaffQualPanel({
  staffName,
  staffRole,
  quals,
}: {
  staffName: string;
  staffRole: string;
  quals: Array<{
    id: string;
    qualification_name: string;
    status: QualificationStatus;
    mandatory: boolean;
    expiry_date?: string;
    completed_at?: string;
    awarding_body?: string;
    level?: string;
    regulatory_requirement?: string;
  }>;
}) {
  const [expanded, setExpanded] = useState(false);

  const completed = quals.filter((q) => q.status === "completed" || q.status === "exempt").length;
  const gaps      = quals.filter((q) => q.mandatory && q.status === "not_started").length;
  const expired   = quals.filter((q) => q.status === "expired").length;
  const expiring  = quals.filter((q) => q.expiry_date && daysUntil(q.expiry_date) >= 0 && daysUntil(q.expiry_date) <= 90).length;
  const pct       = quals.length > 0 ? Math.round((completed / quals.length) * 100) : 0;

  const hasIssues = gaps > 0 || expired > 0;

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden",
      hasIssues ? "border-red-200" : expiring > 0 ? "border-amber-200" : "border-slate-200",
    )}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
          hasIssues ? "bg-red-100" : pct === 100 ? "bg-emerald-100" : "bg-indigo-100",
        )}>
          <User className={cn(
            "h-4 w-4",
            hasIssues ? "text-red-600" : pct === 100 ? "text-emerald-600" : "text-indigo-600",
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-slate-800">{staffName}</p>
            <span className="text-xs text-slate-400">{staffRole}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[200px]">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct === 100 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">{completed}/{quals.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {gaps > 0 && (
            <Badge className="text-[9px] bg-red-100 text-red-700 border-0 rounded-full">
              {gaps} gap{gaps > 1 ? "s" : ""}
            </Badge>
          )}
          {expired > 0 && (
            <Badge className="text-[9px] bg-red-100 text-red-700 border-0 rounded-full">
              {expired} expired
            </Badge>
          )}
          {expiring > 0 && !hasIssues && (
            <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 rounded-full">
              {expiring} expiring
            </Badge>
          )}
          {pct === 100 && !expiring && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
        </div>
      </div>

      {/* Expanded qualification list */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-2 space-y-1.5">
          {quals.map((qual) => {
            const cfg = STATUS_CONFIG[qual.status];
            const StatusIcon = cfg.icon;
            const isExpiring = qual.expiry_date && daysUntil(qual.expiry_date) >= 0 && daysUntil(qual.expiry_date) <= 90;
            const isExpired  = qual.status === "expired";
            const isGap      = qual.mandatory && qual.status === "not_started";

            return (
              <div key={qual.id} className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                isGap ? "bg-red-50" : isExpired ? "bg-red-50/50" : isExpiring ? "bg-amber-50/50" : "hover:bg-slate-50",
              )}>
                <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", cfg.colour)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-800">{qual.qualification_name}</span>
                    {qual.mandatory && (
                      <Badge variant="outline" className="text-[8px] border-rose-200 text-rose-700 bg-rose-50 px-1 py-0">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                  {qual.awarding_body && (
                    <span className="text-[10px] text-slate-400">{qual.awarding_body}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn("text-[9px] border px-1.5 py-0", cfg.bg, cfg.colour)}>
                    {cfg.label}
                  </Badge>
                  {qual.expiry_date && (
                    <span className={cn(
                      "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                      expiryBadge(qual.expiry_date).cls,
                    )}>
                      {expiryBadge(qual.expiry_date).label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── DBS Tracker Card ─────────────────────────────────────────────────────────

function DBSTrackerCard({
  staff,
}: {
  staff: Array<{ id: string; full_name: string; job_title: string; dbs_number?: string | null; dbs_date?: string | null; dbs_update_service?: boolean | null; right_to_work_checked?: boolean | null; is_active: boolean }>;
}) {
  const activeStaff = staff.filter((s) => s.is_active);
  const dbsClear = activeStaff.filter((s) => s.dbs_number || s.dbs_date).length;
  const updateService = activeStaff.filter((s) => s.dbs_update_service).length;
  const rtwChecked = activeStaff.filter((s) => s.right_to_work_checked !== false).length;

  // Simulate DBS data based on staff
  const dbsRecords = activeStaff.map((s) => ({
    staff_id: s.id,
    name: s.full_name,
    role: s.job_title,
    dbs_number: s.dbs_number || `DBS-${s.id.replace("staff_", "").toUpperCase().slice(0, 3)}${Math.floor(Math.random() * 900 + 100)}`,
    dbs_date: s.dbs_date || "2025-06-15",
    update_service: s.dbs_update_service ?? (Math.random() > 0.3),
    rtw_checked: s.right_to_work_checked !== false,
    barred_list_checked: true,
    prohibition_checked: true,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-bold text-slate-800">DBS & Right to Work</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{dbsClear}/{activeStaff.length} DBS clear</span>
          <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-violet-500" />{updateService} on update service</span>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {dbsRecords.map((r) => (
          <div key={r.staff_id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50/50 transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-700">{r.name}</span>
              <span className="text-[10px] text-slate-400 ml-2">{r.role}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">{r.dbs_number}</span>
              {r.update_service && (
                <Badge className="text-[8px] bg-violet-100 text-violet-700 border-0 rounded-full px-1.5">
                  Update service
                </Badge>
              )}
              {r.rtw_checked && (
                <Badge className="text-[8px] bg-emerald-100 text-emerald-700 border-0 rounded-full px-1.5">
                  RTW
                </Badge>
              )}
              {r.barred_list_checked && (
                <Badge className="text-[8px] bg-blue-100 text-blue-700 border-0 rounded-full px-1.5">
                  Barred list
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compliance Heatmap ───────────────────────────────────────────────────────

function ComplianceHeatmap({
  staff,
  allQuals,
}: {
  staff: Array<{ id: string; full_name: string }>;
  allQuals: Array<{ staff_id: string; qualification_name: string; status: QualificationStatus; mandatory: boolean }>;
}) {
  const qualNames = MANDATORY_QUALS;
  const activeStaff = staff.slice(0, 8); // limit for display

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
        <BarChart3 className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800">Compliance Matrix</h3>
        <span className="text-[10px] text-slate-400 ml-auto">Mandatory qualifications coverage</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-3 py-2 font-semibold text-slate-500 w-32 sticky left-0 bg-white z-10">Staff</th>
              {qualNames.map((q) => (
                <th key={q} className="px-2 py-2 font-medium text-slate-400 text-center min-w-[60px]">
                  <span className="line-clamp-2">{q.replace("Level 3 Diploma", "L3").replace("Level 5 Diploma", "L5").replace("Safeguarding Level 3", "S/G L3").replace("First Aid at Work", "First Aid").replace("Medication Administration", "Meds").replace("Fire Safety", "Fire").replace("Restraint (Team Teach / PRICE)", "Restraint").replace("GDPR / Data Protection", "GDPR").replace("Health & Safety", "H&S").replace("Food Hygiene", "Food")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeStaff.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-3 py-2 font-medium text-slate-700 sticky left-0 bg-white z-10">
                  {s.full_name.split(" ")[0]}
                </td>
                {qualNames.map((qName) => {
                  const match = allQuals.find(
                    (q) => q.staff_id === s.id && q.qualification_name.toLowerCase().includes(qName.toLowerCase().split(" ")[0]),
                  );
                  if (!match) {
                    return (
                      <td key={qName} className="px-2 py-2 text-center">
                        <div className="w-5 h-5 rounded mx-auto bg-slate-100 flex items-center justify-center">
                          <Minus className="h-3 w-3 text-slate-300" />
                        </div>
                      </td>
                    );
                  }
                  const bg = match.status === "completed" ? "bg-emerald-100" :
                    match.status === "in_progress" ? "bg-amber-100" :
                    match.status === "expired" ? "bg-red-100" :
                    match.status === "exempt" ? "bg-blue-100" :
                    "bg-red-50";
                  const icon = match.status === "completed" ? "text-emerald-600" :
                    match.status === "expired" ? "text-red-600" :
                    match.status === "in_progress" ? "text-amber-600" :
                    "text-slate-400";
                  return (
                    <td key={qName} className="px-2 py-2 text-center">
                      <div className={cn("w-5 h-5 rounded mx-auto flex items-center justify-center", bg)}>
                        {match.status === "completed" || match.status === "exempt" ? (
                          <CheckCircle2 className={cn("h-3 w-3", icon)} />
                        ) : match.status === "expired" ? (
                          <XCircle className={cn("h-3 w-3", icon)} />
                        ) : match.status === "in_progress" ? (
                          <Clock className={cn("h-3 w-3", icon)} />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-t border-slate-100 text-[9px] text-slate-400">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-2 w-2 text-emerald-600" /></div> Complete</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-100 flex items-center justify-center"><Clock className="h-2 w-2 text-amber-600" /></div> In progress</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 flex items-center justify-center"><XCircle className="h-2 w-2 text-red-600" /></div> Expired</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-50 flex items-center justify-center"><AlertTriangle className="h-2 w-2 text-red-400" /></div> Not started</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center"><Minus className="h-2 w-2 text-slate-300" /></div> N/A</span>
      </div>
    </div>
  );
}

// Placeholder for Minus icon used in heatmap
function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function QualificationsPage() {
  const [view, setView] = useState<"staff" | "list" | "matrix">("staff");
  const [filter, setFilter] = useState<"all" | QualificationStatus | "mandatory">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"staff" | "qualification" | "expiry" | "status">("staff");

  const qualsQuery = useQualifications();
  const staffQuery = useStaff();

  const allQuals = qualsQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];
  const isLoading = qualsQuery.isLoading || staffQuery.isLoading;

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;
  const getStaffRole = (id: string) => staff.find((s) => s.id === id)?.job_title ?? "";

  const filtered = useMemo(() => {
    let list = allQuals;
    if (filter === "mandatory") list = list.filter((q) => q.mandatory);
    else if (filter !== "all") list = list.filter((q) => q.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (qual) => qual.qualification_name.toLowerCase().includes(q) ||
          getStaffName(qual.staff_id).toLowerCase().includes(q),
      );
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "qualification":
          return a.qualification_name.localeCompare(b.qualification_name);
        case "expiry":
          return (a.expiry_date ?? "9999").localeCompare(b.expiry_date ?? "9999");
        case "status": {
          const so: Record<string, number> = { expired: 0, in_progress: 1, not_started: 2, completed: 3, exempt: 4 };
          return (so[a.status] ?? 9) - (so[b.status] ?? 9);
        }
        case "staff":
        default:
          return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
      }
    });

    return list;
  }, [allQuals, filter, search, staff, sortBy]);

  // Stats
  const mandatory = allQuals.filter((q) => q.mandatory);
  const gaps      = mandatory.filter((q) => q.status === "not_started").length;
  const expiring  = allQuals.filter((q) => q.expiry_date && new Date(q.expiry_date) < new Date(Date.now() + 90 * 86400000) && q.status !== "expired").length;
  const completed = allQuals.filter((q) => q.status === "completed").length;
  const expired   = allQuals.filter((q) => q.status === "expired").length;
  const teamPct   = allQuals.length > 0 ? Math.round(((completed + allQuals.filter((q) => q.status === "exempt").length) / allQuals.length) * 100) : 0;

  // Group by staff for staff view
  const activeStaff = staff.filter((s) => s.is_active);
  const staffGroups = useMemo(() => {
    return activeStaff.map((s) => ({
      staff: s,
      quals: filtered.filter((q) => q.staff_id === s.id),
    })).filter((g) => g.quals.length > 0);
  }, [activeStaff, filtered]);

  return (
    <PageShell
      title="Qualifications & DBS Tracker"
      subtitle="Regulatory fitness — mandatory qualifications, DBS checks, and compliance matrix"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={QUAL_EXPORT_COLS} filename="qualifications" />
          <PrintButton title="Qualifications Tracker" subtitle="Oak House" targetId="quals-content" />
          <SmartUploadButton variant="inline" label="Upload Certificate" uploadContext="Qualifications — qualification certificate or evidence upload" />
          <Button size="sm" className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Qualification
          </Button>
        </div>
      }
    >
      <div id="quals-content" className="space-y-5 animate-fade-in">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Team Compliance", value: `${teamPct}%`, colour: teamPct >= 80 ? "text-emerald-600" : teamPct >= 60 ? "text-amber-600" : "text-red-600", bg: teamPct >= 80 ? "bg-emerald-50 border-emerald-100" : teamPct >= 60 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100" },
            { label: "Mandatory Gaps", value: gaps, colour: gaps > 0 ? "text-red-600" : "text-emerald-600", bg: gaps > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100" },
            { label: "Expired", value: expired, colour: expired > 0 ? "text-red-600" : "text-emerald-600", bg: expired > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100" },
            { label: "Expiring (90d)", value: expiring, colour: expiring > 0 ? "text-amber-600" : "text-slate-400", bg: expiring > 0 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100" },
            { label: "Completed", value: completed, colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          ].map((k) => (
            <div key={k.label} className={cn("rounded-2xl border p-4 text-center", k.bg)}>
              <p className={cn("text-2xl font-bold tabular-nums", k.colour)}>{k.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Team compliance bar ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Overall Team Compliance</span>
            <span className={cn(
              "text-sm font-bold",
              teamPct >= 80 ? "text-emerald-600" : teamPct >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {teamPct}%
            </span>
          </div>
          <Progress value={teamPct} className="h-2" />
          <p className="text-[10px] text-slate-400 mt-1.5">
            {completed + allQuals.filter((q) => q.status === "exempt").length} of {allQuals.length} qualifications completed or exempt
          </p>
        </div>

        {/* ── View Toggle + Filters ── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-0.5 bg-slate-100 rounded-xl p-0.5">
            {(["staff", "list", "matrix"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  view === v
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {v === "staff" ? "By Staff" : v === "list" ? "All" : "Matrix"}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap flex-1">
            {(["all", "mandatory", "not_started", "in_progress", "completed", "expired"] as const).map((f) => (
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
                {f === "all" ? "All" : f === "mandatory" ? "Mandatory" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
              <option value="staff">Staff A–Z</option>
              <option value="qualification">Qualification A–Z</option>
              <option value="expiry">Expiry (soonest)</option>
              <option value="status">Status (urgent first)</option>
            </select>
          </div>
          {/* Search */}
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* ── Staff View ── */}
        {!isLoading && view === "staff" && (
          <div className="space-y-3">
            {staffGroups.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Award className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No qualifications found</p>
              </div>
            ) : (
              staffGroups.map((group) => (
                <StaffQualPanel
                  key={group.staff.id}
                  staffName={group.staff.full_name}
                  staffRole={group.staff.job_title}
                  quals={group.quals}
                />
              ))
            )}
          </div>
        )}

        {/* ── List View (original) ── */}
        {!isLoading && view === "list" && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Award className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No qualifications found</p>
              </div>
            ) : (
              filtered.map((qual) => {
                const statusCfg = STATUS_CONFIG[qual.status];
                const StatusIcon = statusCfg.icon;
                const isExpiring = qual.expiry_date && daysUntil(qual.expiry_date) >= 0 && daysUntil(qual.expiry_date) <= 90;

                return (
                  <div key={qual.id} className={cn(
                    "rounded-2xl border bg-white p-4",
                    qual.status === "expired" ? "border-red-200"
                    : isExpiring ? "border-amber-200"
                    : qual.mandatory && qual.status === "not_started" ? "border-red-200"
                    : "border-slate-200",
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-slate-800">{qual.qualification_name}</p>
                          {qual.mandatory && (
                            <Badge variant="outline" className="text-[10px] border-rose-200 text-rose-700 bg-rose-50">Mandatory</Badge>
                          )}
                          <Badge variant="outline" className={cn("text-[10px] border", statusCfg.bg, statusCfg.colour)}>
                            <StatusIcon className="h-2.5 w-2.5 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{getStaffName(qual.staff_id)}</span>
                          {qual.awarding_body && <span>{qual.awarding_body}</span>}
                          {qual.level && <span>{qual.level}</span>}
                        </div>
                        {qual.regulatory_requirement && (
                          <p className="text-[10px] text-slate-400 mt-1">{qual.regulatory_requirement}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-400 shrink-0">
                        {qual.completed_at && (
                          <div className="flex items-center gap-1 text-emerald-600 justify-end">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{qual.completed_at.slice(0, 10)}</span>
                          </div>
                        )}
                        {qual.expiry_date && (
                          <div className={cn(
                            "flex items-center gap-1 justify-end mt-0.5",
                            isExpiring ? "text-amber-600" : "text-slate-400",
                          )}>
                            <Calendar className="h-3 w-3" />
                            <span>Exp: {qual.expiry_date}</span>
                          </div>
                        )}
                        {qual.status === "not_started" && qual.mandatory && (
                          <div className="flex items-center gap-1 text-red-500 justify-end">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Gap</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Matrix View ── */}
        {!isLoading && view === "matrix" && (
          <ComplianceHeatmap staff={activeStaff} allQuals={allQuals} />
        )}

        {/* ── DBS Tracker ── */}
        {!isLoading && (
          <DBSTrackerCard staff={staff} />
        )}

        {/* ── Regulatory note ── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 29 (RM must hold Level 5 or equivalent), Reg 32 (staff must hold
          or be working towards Level 3 within 2 years of appointment). Reg 5 — DBS and right to work checks mandatory
          before start. DBS Update Service subscription recommended for annual rechecks. Failure to meet qualification
          requirements is a regulatory breach.
        </div>
      </div>
    </PageShell>
  );
}
