"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Users, ChevronRight, ArrowUpRight, Search, Clock,
  AlertTriangle, CheckCircle2, GraduationCap, Briefcase,
  Shield, UserCheck, Calendar, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { useCompetencyProfiles } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import type { StaffEnriched } from "@/hooks/use-staff";
import { PATHWAY_STAGE_LABELS, type PathwayStage } from "@/types/extended";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

// ── Constants ────────────────────────────────────────────────────────────────

const STAFF_PROFILE_EXPORT_COLS: ExportColumn<StaffEnriched>[] = [
  { header: "Name", accessor: (s) => s.full_name },
  { header: "Job Title", accessor: (s) => s.job_title },
  { header: "Role", accessor: (s) => s.role },
  { header: "Start Date", accessor: (s) => s.start_date },
  { header: "On Shift Today", accessor: (s) => s.is_on_shift_today ? "Yes" : "No" },
  { header: "Training Expired", accessor: (s) => String(s.training_expired_count) },
  { header: "Supervision Overdue", accessor: (s) => s.supervision_overdue ? "Yes" : "No" },
  { header: "On Leave", accessor: (s) => s.is_on_leave_today ? "Yes" : "No" },
];

const STAGE_COLOURS: Record<PathwayStage, string> = {
  inductee:           "bg-slate-100 text-slate-700 border-slate-200",
  rsw:                "bg-blue-50 text-blue-700 border-blue-200",
  senior_rsw:         "bg-sky-50 text-sky-700 border-sky-200",
  team_leader:        "bg-violet-50 text-violet-700 border-violet-200",
  deputy_manager:     "bg-amber-50 text-amber-700 border-amber-200",
  registered_manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ri:                 "bg-rose-50 text-rose-700 border-rose-200",
};

const READINESS_COLOUR = (score: number) =>
  score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
const READINESS_BG = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

const ROLE_LABELS: Record<string, string> = {
  registered_manager: "Registered Manager",
  deputy_manager: "Deputy Manager",
  team_leader: "Team Leader",
  residential_care_worker: "Care Worker",
  bank_staff: "Bank Staff",
  responsible_individual: "Responsible Individual",
  hr_recruitment: "HR / Recruitment",
  finance_operations: "Finance / Operations",
};

const ROLE_ORDER = [
  "registered_manager", "deputy_manager", "team_leader",
  "residential_care_worker", "bank_staff", "hr_recruitment",
  "finance_operations",
];

type FilterKey = "all" | "on_shift" | "training_issue" | "supervision_due" | "on_leave";

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StaffProfilesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<"role" | "name" | "start_date">("role");

  const profilesQuery = useCompetencyProfiles({ homeId: "home_oak" });
  const staffQuery    = useStaff();

  const profiles = profilesQuery.data?.data ?? [];
  const staff    = staffQuery.data?.data ?? [];

  const getStaffName = (id: string) => staff.find((s) => s.id === id)?.full_name ?? id;
  const getStaffJob  = (id: string) => staff.find((s) => s.id === id)?.job_title ?? "";

  const profileMap = useMemo(() => {
    const map = new Map<string, typeof profiles[0]>();
    for (const p of profiles) map.set(p.staff_id, p);
    return map;
  }, [profiles]);

  const activeStaff = useMemo(() =>
    staff.filter((s: StaffEnriched) => s.is_active && s.role !== "responsible_individual"),
    [staff]
  );

  // Stats
  const stats = useMemo(() => ({
    total: activeStaff.length,
    onShift: activeStaff.filter((s: StaffEnriched) => s.is_on_shift_today).length,
    trainingIssue: activeStaff.filter((s: StaffEnriched) => s.training_expired_count > 0).length,
    supervisionDue: activeStaff.filter((s: StaffEnriched) => s.supervision_overdue).length,
    onLeave: activeStaff.filter((s: StaffEnriched) => s.is_on_leave_today).length,
    withProfile: activeStaff.filter((s: StaffEnriched) => profileMap.has(s.id)).length,
  }), [activeStaff, profileMap]);

  // Filter + search
  const filtered = useMemo(() => {
    let list = activeStaff;

    if (filter === "on_shift") list = list.filter((s: StaffEnriched) => s.is_on_shift_today);
    else if (filter === "training_issue") list = list.filter((s: StaffEnriched) => s.training_expired_count > 0);
    else if (filter === "supervision_due") list = list.filter((s: StaffEnriched) => s.supervision_overdue);
    else if (filter === "on_leave") list = list.filter((s: StaffEnriched) => s.is_on_leave_today);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s: StaffEnriched) =>
        s.full_name.toLowerCase().includes(q) ||
        s.job_title.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "start_date":
          return (a.start_date ?? "").localeCompare(b.start_date ?? "");
        case "role":
        default: {
          const ai = ROLE_ORDER.indexOf(a.role);
          const bi = ROLE_ORDER.indexOf(b.role);
          const aIdx = ai >= 0 ? ai : 99;
          const bIdx = bi >= 0 ? bi : 99;
          if (aIdx !== bIdx) return aIdx - bIdx;
          return a.full_name.localeCompare(b.full_name);
        }
      }
    });
  }, [activeStaff, filter, search, sortBy]);

  // Group by role
  const grouped = useMemo(() => {
    const groups = new Map<string, StaffEnriched[]>();
    for (const s of filtered) {
      const list = groups.get(s.role) ?? [];
      list.push(s);
      groups.set(s.role, list);
    }
    return groups;
  }, [filtered]);

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",             label: "All",              count: stats.total },
    { key: "on_shift",        label: "On Shift",         count: stats.onShift },
    { key: "training_issue",  label: "Training Issues",  count: stats.trainingIssue },
    { key: "supervision_due", label: "Supervision Due",  count: stats.supervisionDue },
    { key: "on_leave",        label: "On Leave",         count: stats.onLeave },
  ];

  return (
    <PageShell
      title="Staff Competency Profiles"
      subtitle="Individual development profiles — click any staff member for a full deep-dive"
      ariaContext={{ pageTitle: "Staff Competency Profiles", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={STAFF_PROFILE_EXPORT_COLS} filename="staff-profiles" />
          <PrintButton title="Staff Competency Profiles" subtitle="Oak House — Competency Profiles" targetId="staff-profiles-content" />
          <SmartUploadButton variant="inline" label="Upload Staff Document" uploadContext="Workforce Intelligence — staff profile or HR document upload" />
          <Link href="/workforce">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Users className="h-3.5 w-3.5" />
              Workforce Hub
            </button>
          </Link>
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="staff-profiles-content" className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="h-4 w-4 text-slate-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-[10px] text-slate-500">Total Staff</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-emerald-600">{stats.onShift}</div>
              <div className="text-[10px] text-slate-500">On Shift</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4 text-center">
              <GraduationCap className={cn("h-4 w-4 mx-auto mb-1", stats.trainingIssue > 0 ? "text-red-500" : "text-emerald-500")} />
              <div className={cn("text-2xl font-bold", stats.trainingIssue > 0 ? "text-red-600" : "text-emerald-600")}>{stats.trainingIssue}</div>
              <div className="text-[10px] text-slate-500">Training Issues</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4 text-center">
              <Clock className={cn("h-4 w-4 mx-auto mb-1", stats.supervisionDue > 0 ? "text-amber-500" : "text-emerald-500")} />
              <div className={cn("text-2xl font-bold", stats.supervisionDue > 0 ? "text-amber-600" : "text-emerald-600")}>{stats.supervisionDue}</div>
              <div className="text-[10px] text-slate-500">Supervision Due</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4 text-center">
              <Calendar className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">{stats.onLeave}</div>
              <div className="text-[10px] text-slate-500">On Leave</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-4 text-center">
              <UserCheck className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-indigo-600">{stats.withProfile}</div>
              <div className="text-[10px] text-slate-500">With Profile</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters + search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={cn("ml-1.5", filter === f.key ? "text-slate-300" : "text-slate-400")}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
              <option value="role">Role hierarchy</option>
              <option value="name">Name A–Z</option>
              <option value="start_date">Start date (earliest)</option>
            </select>
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 w-56"
            />
          </div>
        </div>

        {/* Grouped staff list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <div className="text-sm font-medium">No staff match this filter</div>
            <div className="text-xs mt-1">Try changing the filter or search term</div>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([role, members]) => (
            <div key={role} className="space-y-2">
              <div className="flex items-center gap-2 pt-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {ROLE_LABELS[role] ?? role.replace(/_/g, " ")}
                </p>
                <Badge className="text-[9px] bg-slate-100 text-slate-500 border-0 rounded-full">{members.length}</Badge>
                <div className="flex-1 border-b border-slate-100" />
              </div>

              {members.map((member) => {
                const profile = profileMap.get(member.id);
                const hasProfile = !!profile;

                return (
                  <Link key={member.id} href={hasProfile ? `/workforce/staff/${member.id}` : "/workforce/aria-planner"}>
                    <div className={cn(
                      "rounded-2xl border bg-white p-4 hover:shadow-sm transition-all cursor-pointer",
                      hasProfile ? "border-slate-200 hover:border-indigo-200" : "border-dashed border-slate-200 bg-slate-50/50",
                    )}>
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          hasProfile ? "bg-indigo-100" : "bg-slate-200",
                        )}>
                          <span className={cn("text-sm font-bold", hasProfile ? "text-indigo-700" : "text-slate-500")}>
                            {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>

                        {/* Name, job, stage */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-bold text-slate-800">{member.full_name}</p>
                            {hasProfile && profile.current_stage && (
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STAGE_COLOURS[profile.current_stage])}>
                                {PATHWAY_STAGE_LABELS[profile.current_stage]}
                              </Badge>
                            )}
                            {hasProfile && profile.target_stage && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>→ {PATHWAY_STAGE_LABELS[profile.target_stage]}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{member.job_title}</p>
                        </div>

                        {/* Indicators */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          {/* Shift status */}
                          {member.is_on_shift_today && (
                            <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700 border-0">
                              On Shift
                            </Badge>
                          )}
                          {member.is_on_leave_today && (
                            <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700 border-0">
                              On Leave
                            </Badge>
                          )}

                          {/* Training status */}
                          {member.training_expired_count > 0 ? (
                            <Badge className="text-[9px] rounded-full bg-red-100 text-red-700 border-0 flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {member.training_expired_count} expired
                            </Badge>
                          ) : member.training_expiring_count > 0 ? (
                            <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700 border-0">
                              {member.training_expiring_count} expiring
                            </Badge>
                          ) : null}

                          {/* Supervision */}
                          {member.supervision_overdue && (
                            <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700 border-0 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              Supervision due
                            </Badge>
                          )}

                          {/* Readiness score */}
                          {hasProfile && (
                            <div className="w-16 hidden sm:block">
                              <div className="flex justify-between mb-0.5">
                                <span className="text-[9px] text-slate-400">Ready</span>
                                <span className={cn("text-[9px] font-bold", READINESS_COLOUR(profile.overall_readiness_score))}>
                                  {profile.overall_readiness_score}%
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", READINESS_BG(profile.overall_readiness_score))}
                                  style={{ width: `${profile.overall_readiness_score}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {!hasProfile && (
                            <span className="text-[10px] text-indigo-600 font-medium hidden sm:inline">
                              Generate profile →
                            </span>
                          )}

                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>

                      {/* Strengths preview (for profiled staff) */}
                      {hasProfile && profile.strengths.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-emerald-600 font-semibold mb-0.5">Top Strength</p>
                            <p className="text-xs text-slate-600 line-clamp-1">{profile.strengths[0]}</p>
                          </div>
                          {profile.development_areas.length > 0 && (
                            <div className="flex-1 min-w-0 hidden md:block">
                              <p className="text-[10px] text-amber-600 font-semibold mb-0.5">Development Area</p>
                              <p className="text-xs text-slate-600 line-clamp-1">{profile.development_areas[0]}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))
        )}

        {/* Regulatory note */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 32 (fitness of workers), Reg 33 (employment of staff
          — qualifications and experience), Reg 34 (staff supervision and development). The registered person must
          ensure that staff have the qualifications, skills, and knowledge necessary to safeguard and meet the needs
          of children in the home.
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Staff Competency Profiles — individual staff competency assessments, skills profiles, Reg 34 development needs, Reg 5 suitability evidence, ILACS workforce quality, Ofsted inspection evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
