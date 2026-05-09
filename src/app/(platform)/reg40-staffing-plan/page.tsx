"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  UserCheck,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ArrowUpDown,
  GraduationCap,
  Calendar,
  Briefcase,
  BarChart3,
  Info,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }        from "@/components/ui/badge";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useReg40StaffEntries } from "@/hooks/use-reg40-staff-entries";
import type { Reg40StaffEntry, Reg40QualStatus } from "@/types/extended";
import { REG40_QUAL_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────── */

const STATUS_META: Record<Reg40QualStatus, { colour: string; icon: typeof CheckCircle2 }> = {
  complete:     { colour: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  in_progress:  { colour: "bg-blue-100 text-blue-700",    icon: Clock },
  current:      { colour: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  due_renewal:  { colour: "bg-amber-100 text-amber-700",  icon: AlertTriangle },
};

const SEVERITY_META: Record<string, { colour: string }> = {
  high:   { colour: "bg-red-100 text-red-700 border-red-200" },
  medium: { colour: "bg-amber-100 text-amber-700 border-amber-200" },
  low:    { colour: "bg-green-100 text-green-700 border-green-200" },
};

/* ── reference data (kept local — not dynamic records) ─────────────── */

const MINIMUM_STAFFING = [
  { id: "ms1", shift: "Day (07:00–14:00)", minimum: 2, current: "2–3", adequate: true, note: null as string | null },
  { id: "ms2", shift: "Afternoon (14:00–22:00)", minimum: 3, current: "3", adequate: true, note: null as string | null },
  { id: "ms3", shift: "Waking Night (22:00–07:00)", minimum: 1, current: "1", adequate: true, note: "Lone working restricted until Lackson completes Level 3" },
  { id: "ms4", shift: "Weekend Day", minimum: 2, current: "2–3", adequate: true, note: null as string | null },
];

const GAP_ANALYSIS = [
  { id: "g1", area: "Level 3 Diploma", detail: "2 staff (Lackson, Mirela) working toward Level 3 — both within the 2-year statutory window", severity: "medium", action: "Progress reviews monthly; on track" },
  { id: "g2", area: "First Aid Coverage", detail: "Ryan's First Aid renewal due — currently 3 holders providing adequate coverage", severity: "low", action: "Renewal course booked" },
  { id: "g3", area: "Waking Night Lone Working", detail: "Lone working not permitted on waking nights until Lackson completes Level 3 — second staff required", severity: "high", action: "Schedule adjusted to pair Lackson with qualified staff" },
  { id: "g4", area: "Vacancies", detail: "No current vacancies — all posts filled", severity: "low", action: "N/A" },
];

const RECENT_CHANGES = [
  { id: "rc1", date: "2026-02-06", description: "Diane — dismissed (conduct)", type: "departure" },
  { id: "rc2", date: "2026-03-08", description: "Mirela Tshawa Kalongo — started (replacement for Diane)", type: "arrival" },
  { id: "rc3", date: "2026-03-08", description: "Staff:child ratio improved to 2.3:1", type: "ratio_change" },
];

/* ── page ─────────────────────────────────────────────────────────────── */

export default function Reg40StaffingPlanPage() {
  const { data: records = [], isLoading } = useReg40StaffEntries();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  /* ── stats ──────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const totalStaff = records.length;
    const totalFTE = records.reduce((s, e) => s + e.contract_hours, 0) / 37.5;
    const childCount = 3;
    const ratio = (totalStaff / childCount).toFixed(1);
    const level3 = records.filter((e) => e.qualifications.some((q) => q.name.includes("Level 3") && q.status === "complete"));
    const level3InProgress = records.filter((e) => e.qualifications.some((q) => q.name.includes("Level 3") && q.status === "in_progress"));
    const level3Pct = (level3.length + level3InProgress.length) > 0
      ? Math.round((level3.length / (level3.length + level3InProgress.length)) * 100)
      : 0;
    const tciCovered = records.filter((e) => e.qualifications.some((q) => q.name === "TCI Certified")).length;

    return { totalStaff, totalFTE: totalFTE.toFixed(1), ratio, childCount, level3Complete: level3.length, level3InProgress: level3InProgress.length, level3Pct, tciCovered };
  }, [records]);

  /* ── filter + sort ──────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") {
      if (filterStatus === "complete") {
        list = list.filter((s) => s.qualifications.every((q) => q.status === "complete" || q.status === "current"));
      } else {
        list = list.filter((s) => s.qualifications.some((q) => q.status === filterStatus));
      }
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        getStaffName(s.staff_id).toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.qualifications.some((qual) => qual.name.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "compliance": {
          const aPct = a.qualifications.filter((q) => q.status === "complete" || q.status === "current").length / a.qualifications.length;
          const bPct = b.qualifications.filter((q) => q.status === "complete" || q.status === "current").length / b.qualifications.length;
          return aPct - bPct;
        }
        default: return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
      }
    });
    return list;
  }, [records, filterStatus, search, sortBy]);

  /* ── export ─────────────────────────────────────────────────────────── */

  const exportData = useMemo(() => records.flatMap((s) => s.qualifications.map((q) => ({
    staffName: getStaffName(s.staff_id),
    role: s.role,
    contractHours: s.contract_hours,
    qualification: q.name,
    status: REG40_QUAL_STATUS_LABEL[q.status],
    dueDate: q.date || "",
    tcRefresherDue: s.tc_refresher_due,
    firstAidExpiry: s.first_aid_expiry || "",
    shiftPattern: s.shift_pattern,
    keyChild: s.key_child || "",
  }))), [records]);

  type ExportRow = typeof exportData[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Staff Name",       accessor: (r: ExportRow) => r.staffName },
    { header: "Role",             accessor: (r: ExportRow) => r.role },
    { header: "Contract Hours",   accessor: (r: ExportRow) => String(r.contractHours) },
    { header: "Qualification",    accessor: (r: ExportRow) => r.qualification },
    { header: "Status",           accessor: (r: ExportRow) => r.status },
    { header: "Due Date",         accessor: (r: ExportRow) => r.dueDate },
    { header: "TCI Refresher",    accessor: (r: ExportRow) => r.tcRefresherDue },
    { header: "First Aid Expiry", accessor: (r: ExportRow) => r.firstAidExpiry },
    { header: "Shift Pattern",    accessor: (r: ExportRow) => r.shiftPattern },
    { header: "Key Child",        accessor: (r: ExportRow) => r.keyChild },
  ];

  if (isLoading) {
    return (
      <PageShell title="Regulation 40 — Staffing Plan" subtitle="Staff deployment, qualifications coverage, minimum staffing levels, and adequacy assessment">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Regulation 40 — Staffing Plan"
      subtitle="Staff deployment, qualifications coverage, minimum staffing levels, and adequacy assessment"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="reg40-staffing-plan" />
          <PrintButton title="Regulation 40 — Staffing Plan" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── summary stats ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { l: "Total Staff",       v: stats.totalStaff, icon: Users, c: "text-blue-600" },
            { l: "Total FTE",         v: stats.totalFTE, icon: Briefcase, c: "text-blue-600" },
            { l: "Staff:Child",       v: `${stats.ratio}:1`, icon: UserCheck, c: "text-green-600" },
            { l: "Children",          v: stats.childCount, icon: Users, c: "text-purple-600" },
            { l: "Level 3 Complete",  v: stats.level3Complete, icon: GraduationCap, c: "text-green-600" },
            { l: "Level 3 In Progress", v: stats.level3InProgress, icon: Clock, c: "text-amber-600" },
            { l: "TCI Coverage",      v: `${stats.tciCovered}/${records.length || 7}`, icon: Shield, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── Level 3 compliance bar ─────────────────────────────────────── */}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Level 3 Diploma Compliance (RCWs)
            </span>
            <span className={cn(
              "font-bold tabular-nums",
              stats.level3Pct >= 80 ? "text-green-600" : stats.level3Pct >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {stats.level3Pct}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                stats.level3Pct >= 80 ? "bg-green-500" : stats.level3Pct >= 60 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${stats.level3Pct}%` }}
            />
          </div>
        </div>

        {/* ── establishment overview ─────────────────────────────────────── */}

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              Establishment — Oak House
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium mb-1">Staffing Structure</p>
                <ul className="space-y-0.5 text-xs">
                  <li>1 x Registered Manager</li>
                  <li>1 x Deputy Manager</li>
                  <li>5 x Residential Care Workers</li>
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium mb-1">Occupancy</p>
                <ul className="space-y-0.5 text-xs">
                  <li>3 children in placement (max 3)</li>
                  <li>Staff:child ratio — {stats.ratio}:1</li>
                  <li>Exceeds minimum requirement</li>
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium mb-1">Workforce Status</p>
                <ul className="space-y-0.5 text-xs">
                  <li>No current vacancies</li>
                  <li>0 agency staff in use</li>
                  <li>All DBS checks current</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── minimum staffing levels ────────────────────────────────────── */}

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand" />
              Minimum Staffing Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground">Shift</th>
                    <th className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground">Minimum</th>
                    <th className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground">Current</th>
                    <th className="py-2 px-4 text-center text-xs font-semibold text-muted-foreground">Adequate</th>
                    <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {MINIMUM_STAFFING.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 px-4 text-sm font-medium">{row.shift}</td>
                      <td className="py-2 px-4 text-center text-sm">{row.minimum}</td>
                      <td className="py-2 px-4 text-center text-sm font-medium">{row.current}</td>
                      <td className="py-2 px-4 text-center">
                        {row.adequate ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 px-4 text-xs text-muted-foreground">{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── gap analysis ───────────────────────────────────────────────── */}

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Gap Analysis &amp; Adequacy Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {GAP_ANALYSIS.map((gap) => (
              <div key={gap.id} className={cn("rounded border p-3", SEVERITY_META[gap.severity].colour)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{gap.area}</p>
                    <p className="text-xs mt-0.5">{gap.detail}</p>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", SEVERITY_META[gap.severity].colour)}>
                    {gap.severity}
                  </Badge>
                </div>
                <p className="text-xs mt-1.5 font-medium">Action: {gap.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── recent changes ─────────────────────────────────────────────── */}

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand" />
              Recent Staffing Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {RECENT_CHANGES.map((change) => (
              <div key={change.id} className="flex items-center gap-3 rounded border p-2.5">
                <Badge className={cn(
                  "text-[10px] shrink-0",
                  change.type === "departure" ? "bg-red-100 text-red-700" :
                  change.type === "arrival" ? "bg-green-100 text-green-700" :
                  "bg-blue-100 text-blue-700",
                )}>
                  {change.type === "departure" ? "Left" : change.type === "arrival" ? "Joined" : "Update"}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm">{change.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{change.date}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── filters ────────────────────────────────────────────────────── */}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff or qualification..." className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
            <option value="all">All Statuses</option>
            <option value="complete">Fully Qualified</option>
            <option value="in_progress">In Progress</option>
            <option value="due_renewal">Due Renewal</option>
          </select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="name">Name</option>
              <option value="compliance">Compliance (low first)</option>
            </select>
          </div>
        </div>

        {/* ── expandable staff cards ─────────────────────────────────────── */}

        {filtered.map((staff) => {
          const name = getStaffName(staff.staff_id);
          const completeCount = staff.qualifications.filter((q) => q.status === "complete" || q.status === "current").length;
          const totalQuals = staff.qualifications.length;
          const pct = totalQuals > 0 ? Math.round((completeCount / totalQuals) * 100) : 0;
          const hasIssues = staff.qualifications.some((q) => q.status === "in_progress" || q.status === "due_renewal");

          return (
            <div key={staff.id} className={cn(
              "rounded-lg border bg-white overflow-hidden",
              staff.qualifications.some((q) => q.status === "due_renewal") ? "border-amber-200" : "",
            )}>
              <button onClick={() => setExpandedId(expandedId === staff.id ? null : staff.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <GraduationCap className={cn("h-5 w-5", pct === 100 ? "text-green-600" : pct >= 75 ? "text-amber-500" : "text-red-500")} />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{name}</h3>
                      <span className="text-xs text-muted-foreground">{staff.role}</span>
                      {pct === 100 && <Badge className="text-[10px] h-5 bg-green-100 text-green-700">Fully Qualified</Badge>}
                      {hasIssues && pct < 100 && <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700">Gaps</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {completeCount}/{totalQuals} qualifications complete · {staff.contract_hours}h/week · {staff.shift_pattern}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                    <div className={cn("h-full rounded-full", pct === 100 ? "bg-green-400" : pct >= 75 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${pct}%` }} />
                  </div>
                  {expandedId === staff.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expandedId === staff.id && (
                <div className="border-t p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground font-medium">Contract</p>
                      <p className="font-semibold">{staff.contract_hours} hours/week</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground font-medium">TCI Refresher Due</p>
                      <p className="font-semibold">{staff.tc_refresher_due}</p>
                    </div>
                    <div className="rounded border p-2">
                      <p className="text-muted-foreground font-medium">Key Child</p>
                      <p className="font-semibold">{staff.key_child || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Qualifications</p>
                    {staff.qualifications.map((qual, i) => {
                      const meta = STATUS_META[qual.status];
                      const Icon = meta.icon;
                      return (
                        <div key={i} className={cn(
                          "flex items-center justify-between rounded border p-2.5",
                          qual.status === "due_renewal" ? "border-amber-200 bg-amber-50" : "",
                        )}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4",
                              qual.status === "complete" || qual.status === "current" ? "text-green-600" :
                              qual.status === "in_progress" ? "text-blue-600" :
                              "text-amber-600"
                            )} />
                            <span className="text-sm">{qual.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {qual.date && <span className="text-xs text-muted-foreground">{qual.status === "in_progress" ? "Due: " : "Expires: "}{qual.date}</span>}
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", meta.colour)}>{REG40_QUAL_STATUS_LABEL[qual.status]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {staff.first_aid_expiry && (
                    <div className="text-xs text-muted-foreground">
                      First Aid certificate expires: <span className="font-medium">{staff.first_aid_expiry}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ── regulatory note ────────────────────────────────────────────── */}

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1.5">
                <p className="font-semibold">Regulation 40 — Fitness of Workers</p>
                <p>
                  The registered person must ensure that the employment of staff is managed so that sufficient staff
                  are employed at all times, with appropriate experience, qualifications and skills to meet the needs of children.
                </p>
                <p>
                  Staff in children&apos;s homes must hold, or be working toward, the Level 3 Diploma for Residential Childcare
                  within 2 years of starting their role. Ofsted expects workforce stability to be demonstrated through low
                  vacancy rates, manageable turnover, and a clear plan for maintaining staffing adequacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
