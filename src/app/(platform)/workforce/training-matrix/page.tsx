"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRAINING COMPLIANCE MATRIX
// Team-wide mandatory and CPD training coverage at a glance. Shows compliance
// percentage per staff, per category, gap counts, expiry tracking, and
// colour-coded matrix with print support.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { cn } from "@/lib/utils";
import {
  GraduationCap, CheckCircle2, Clock, AlertTriangle,
  Search, BarChart3, ShieldAlert, Users, TrendingUp,
  Filter, CalendarClock, X,
} from "lucide-react";
import Link from "next/link";
import { useQualifications } from "@/hooks/use-workforce";
import { useStaff } from "@/hooks/use-staff";
import { type QualificationStatus } from "@/types/extended";

// ── Training category definitions ────────────────────────────────────────────

const TRAINING_CATEGORIES = [
  { key: "safeguarding", label: "Safeguarding", short: "SG", mandatory: true },
  { key: "medication",   label: "Medication",   short: "Med", mandatory: true },
  { key: "first_aid",    label: "First Aid",    short: "FA", mandatory: true },
  { key: "fire_safety",  label: "Fire Safety",  short: "Fire", mandatory: true },
  { key: "dbs",          label: "DBS Check",    short: "DBS", mandatory: true },
  { key: "level3",       label: "Level 3 Diploma", short: "L3", mandatory: true },
  { key: "moving_handling", label: "Moving & Handling", short: "M&H", mandatory: false },
  { key: "mental_health",  label: "Mental Health FA",  short: "MH", mandatory: false },
  { key: "trauma",         label: "Trauma-Informed",   short: "TIP", mandatory: false },
];

const STATUS_ICON: Record<QualificationStatus | "unknown", React.ElementType> = {
  completed:   CheckCircle2,
  in_progress: Clock,
  not_started: AlertTriangle,
  expired:     ShieldAlert,
  exempt:      CheckCircle2,
  unknown:     Clock,
};

const STATUS_COLOUR: Record<QualificationStatus | "unknown", string> = {
  completed:   "text-emerald-600",
  in_progress: "text-amber-600",
  not_started: "text-red-500",
  expired:     "text-red-600",
  exempt:      "text-blue-500",
  unknown:     "text-slate-400",
};

const STATUS_CELL: Record<QualificationStatus | "unknown", string> = {
  completed:   "bg-emerald-50 border-emerald-200",
  in_progress: "bg-amber-50 border-amber-200",
  not_started: "bg-red-50 border-red-200",
  expired:     "bg-red-100 border-red-300",
  exempt:      "bg-blue-50 border-blue-200",
  unknown:     "bg-slate-50 border-slate-200",
};

const STATUS_LABEL: Record<QualificationStatus | "unknown", string> = {
  completed: "Done", in_progress: "In Progress", not_started: "Not Started",
  expired: "Expired", exempt: "Exempt", unknown: "—",
};

type FilterMode = "all" | "gaps_only";

// ── Category Compliance Bars ─────────────────────────────────────────────────

function CategoryCompliance({
  categories,
  staffList,
  getStatus,
}: {
  categories: typeof TRAINING_CATEGORIES;
  staffList: { id: string }[];
  getStatus: (staffId: string, catKey: string) => QualificationStatus | "unknown";
}) {
  const mandatoryOnly = categories.filter((c) => c.mandatory);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          Category Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {mandatoryOnly.map((cat) => {
          const compliant = staffList.filter((s) => {
            const st = getStatus(s.id, cat.key);
            return st === "completed" || st === "exempt";
          }).length;
          const pct = staffList.length > 0 ? Math.round((compliant / staffList.length) * 100) : 0;
          return (
            <div key={cat.key} className="flex items-center gap-2">
              <p className="text-[10px] text-slate-500 w-20 truncate shrink-0">{cat.label}</p>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct === 100 ? "bg-emerald-400" : pct >= 70 ? "bg-amber-400" : "bg-red-400",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={cn(
                "text-[11px] font-bold tabular-nums w-10 text-right",
                pct === 100 ? "text-emerald-600" : pct >= 70 ? "text-amber-600" : "text-red-600",
              )}>
                {pct}%
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Staff Compliance Ranking ─────────────────────────────────────────────────

function StaffCompliance({
  staffList,
  getStaffName,
  getStatus,
  categories,
}: {
  staffList: { id: string }[];
  getStaffName: (id: string) => string;
  getStatus: (staffId: string, catKey: string) => QualificationStatus | "unknown";
  categories: typeof TRAINING_CATEGORIES;
}) {
  const mandatory = categories.filter((c) => c.mandatory);
  const ranked = staffList.map((s) => {
    const compliant = mandatory.filter((cat) => {
      const st = getStatus(s.id, cat.key);
      return st === "completed" || st === "exempt";
    }).length;
    const pct = mandatory.length > 0 ? Math.round((compliant / mandatory.length) * 100) : 0;
    return { id: s.id, name: getStaffName(s.id), pct, compliant, total: mandatory.length };
  }).sort((a, b) => b.pct - a.pct);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[13px] flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          Staff Compliance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {ranked.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <p className="text-[10px] text-slate-600 w-16 truncate shrink-0 font-medium">
              {s.name.split(" ")[0]}
            </p>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  s.pct === 100 ? "bg-emerald-400" : s.pct >= 70 ? "bg-amber-400" : "bg-red-400",
                )}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <span className={cn(
              "text-[10px] font-bold tabular-nums w-12 text-right",
              s.pct === 100 ? "text-emerald-600" : s.pct >= 70 ? "text-amber-600" : "text-red-600",
            )}>
              {s.compliant}/{s.total}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function TrainingMatrixPage() {
  const [search, setSearch]       = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const qualsQuery = useQualifications();
  const staffQuery = useStaff();

  const quals = qualsQuery.data?.data ?? [];
  const staff = staffQuery.data?.data?.filter((s) => s.is_active && s.role !== "responsible_individual") ?? [];

  const getStaffName = (id: string) => staffQuery.data?.data?.find((s) => s.id === id)?.full_name ?? id;

  const getStatusForCategory = (staffId: string, categoryKey: string): QualificationStatus | "unknown" => {
    const keywords: Record<string, string[]> = {
      safeguarding:    ["safeguarding", "child protection"],
      medication:      ["medication", "mar", "medic"],
      first_aid:       ["first aid"],
      moving_handling: ["moving", "handling"],
      fire_safety:     ["fire"],
      mental_health:   ["mental health"],
      trauma:          ["trauma"],
      level3:          ["level 3", "diploma"],
      dbs:             ["dbs"],
    };
    const terms = keywords[categoryKey] ?? [categoryKey];
    const match = quals.find(
      (q) =>
        q.staff_id === staffId &&
        terms.some((t) => q.qualification_name.toLowerCase().includes(t)),
    );
    return match ? match.status : "unknown";
  };

  const getExpiryForCategory = (staffId: string, categoryKey: string): string | null => {
    const keywords: Record<string, string[]> = {
      safeguarding: ["safeguarding", "child protection"],
      medication: ["medication", "mar", "medic"],
      first_aid: ["first aid"],
      moving_handling: ["moving", "handling"],
      fire_safety: ["fire"],
      mental_health: ["mental health"],
      trauma: ["trauma"],
      level3: ["level 3", "diploma"],
      dbs: ["dbs"],
    };
    const terms = keywords[categoryKey] ?? [categoryKey];
    const match = quals.find(
      (q) => q.staff_id === staffId && terms.some((t) => q.qualification_name.toLowerCase().includes(t)),
    );
    return match?.expiry_date ?? null;
  };

  // ── Computed stats ───────────────────────────────────────────────────────
  const mandatoryCategories = TRAINING_CATEGORIES.filter((c) => c.mandatory);

  const teamGaps = staff.reduce((total, s) => {
    return total + mandatoryCategories.filter((cat) => {
      const status = getStatusForCategory(s.id, cat.key);
      return status === "not_started" || status === "expired" || status === "unknown";
    }).length;
  }, 0);

  const totalMandatorySlots = staff.length * mandatoryCategories.length;
  const compliantSlots = totalMandatorySlots - teamGaps;
  const teamCompliancePct = totalMandatorySlots > 0
    ? Math.round((compliantSlots / totalMandatorySlots) * 100)
    : 0;

  const expiringCount = staff.reduce((count, s) => {
    return count + TRAINING_CATEGORIES.filter((cat) => {
      const expiry = getExpiryForCategory(s.id, cat.key);
      if (!expiry) return false;
      const daysUntil = (new Date(expiry).getTime() - Date.now()) / 86400000;
      return daysUntil > 0 && daysUntil <= 90;
    }).length;
  }, 0);

  const fullyCompliantStaff = staff.filter((s) =>
    mandatoryCategories.every((cat) => {
      const st = getStatusForCategory(s.id, cat.key);
      return st === "completed" || st === "exempt";
    }),
  ).length;

  // ── Export data ───────────────────────────────────────────────────────────
  type MatrixRow = { name: string; job_title: string } & Record<string, string>;

  const matrixExportCols: ExportColumn<MatrixRow>[] = useMemo(() => [
    { header: "Staff", accessor: (r) => r.name },
    { header: "Job Title", accessor: (r) => r.job_title },
    ...TRAINING_CATEGORIES.map((cat) => ({
      header: cat.label,
      accessor: (r: MatrixRow) => r[cat.key] ?? "—",
    })),
    { header: "Compliance %", accessor: (r) => r._pct ?? "" },
  ], []);

  const matrixExportData = useMemo(() =>
    staff.map((s): MatrixRow => {
      const row: MatrixRow = { name: s.full_name, job_title: s.job_title };
      TRAINING_CATEGORIES.forEach((cat) => {
        row[cat.key] = STATUS_LABEL[getStatusForCategory(s.id, cat.key)];
      });
      const compliant = mandatoryCategories.filter((cat) => {
        const st = getStatusForCategory(s.id, cat.key);
        return st === "completed" || st === "exempt";
      }).length;
      row._pct = `${mandatoryCategories.length > 0 ? Math.round((compliant / mandatoryCategories.length) * 100) : 0}%`;
      return row;
    }),
  [staff, quals]);

  // ── Filtered staff list ──────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    let list = [...staff];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.full_name.toLowerCase().includes(q));
    }
    if (filterMode === "gaps_only") {
      list = list.filter((s) =>
        mandatoryCategories.some((cat) => {
          const st = getStatusForCategory(s.id, cat.key);
          return st === "not_started" || st === "expired" || st === "unknown";
        }),
      );
    }
    return list;
  }, [staff, search, filterMode, quals]);

  return (
    <PageShell
      title="Training Matrix"
      subtitle="Team-wide mandatory and CPD training coverage at a glance"
      ariaContext={{ pageTitle: "Training Compliance Matrix", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="training-matrix"
            columns={matrixExportCols}
            data={matrixExportData}
            label="Export"
          />
          <PrintButton title="Training Compliance Matrix" subtitle="Oak House Workforce" targetId="training-matrix-content" />
          <SmartUploadButton variant="inline" label="Upload Certificate" uploadContext="Workforce Intelligence — training certificate or compliance evidence upload" />
          <Link href="/workforce/qualifications">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <GraduationCap className="h-3.5 w-3.5" />
              Qualifications
            </button>
          </Link>
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="training-matrix-content" className="space-y-4 animate-fade-in">

        {/* ── KPI Banner ──────────────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          {[
            {
              label: "Team Compliance",
              value: `${teamCompliancePct}%`,
              colour: teamCompliancePct === 100 ? "text-emerald-700" : teamCompliancePct >= 80 ? "text-amber-700" : "text-red-700",
              bg: teamCompliancePct === 100 ? "border-emerald-200 bg-emerald-50" : teamCompliancePct >= 80 ? "" : "border-red-200 bg-red-50",
              icon: <BarChart3 className={cn("h-4 w-4", teamCompliancePct === 100 ? "text-emerald-500" : teamCompliancePct >= 80 ? "text-amber-500" : "text-red-500")} />,
            },
            {
              label: "Gaps",
              value: teamGaps,
              colour: teamGaps > 0 ? "text-red-700" : "text-emerald-700",
              bg: teamGaps > 0 ? "border-red-200 bg-red-50" : "",
              icon: <AlertTriangle className={cn("h-4 w-4", teamGaps > 0 ? "text-red-500" : "text-emerald-500")} />,
            },
            {
              label: "Expiring <90d",
              value: expiringCount,
              colour: expiringCount > 0 ? "text-amber-700" : "text-slate-400",
              bg: expiringCount > 0 ? "border-amber-200 bg-amber-50" : "",
              icon: <CalendarClock className={cn("h-4 w-4", expiringCount > 0 ? "text-amber-500" : "text-slate-300")} />,
            },
            {
              label: "Fully Compliant",
              value: `${fullyCompliantStaff}/${staff.length}`,
              colour: fullyCompliantStaff === staff.length ? "text-emerald-700" : "text-blue-700",
              icon: <CheckCircle2 className={cn("h-4 w-4", fullyCompliantStaff === staff.length ? "text-emerald-500" : "text-blue-500")} />,
            },
            {
              label: "Categories",
              value: `${mandatoryCategories.length} req`,
              colour: "text-indigo-700",
              icon: <GraduationCap className="h-4 w-4 text-indigo-500" />,
            },
          ].map(({ label, value, colour, bg, icon }) => (
            <div key={label} className={cn("rounded-xl border border-slate-100 bg-white p-3 text-center", bg)}>
              <div className="flex justify-center mb-1">{icon}</div>
              <div className={cn("text-xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Team Compliance Bar ──────────────────────────────────────────── */}
        <div className={cn(
          "rounded-xl border p-3",
          teamGaps > 0 ? "border-red-200 bg-red-50/40" : "border-emerald-200 bg-emerald-50/40",
        )}>
          <div className="flex items-center gap-3 mb-2">
            {teamGaps > 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <p className={cn("text-sm font-bold", teamGaps > 0 ? "text-red-700" : "text-emerald-700")}>
              {teamGaps > 0 ? `${teamGaps} mandatory training gaps across the team` : "All mandatory training compliant"}
            </p>
            <span className="text-[11px] text-slate-400 ml-auto">{compliantSlots}/{totalMandatorySlots} slots filled</span>
          </div>
          <div className="h-2 rounded-full bg-white/60 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", teamCompliancePct === 100 ? "bg-emerald-400" : teamCompliancePct >= 80 ? "bg-amber-400" : "bg-red-400")}
              style={{ width: `${teamCompliancePct}%` }}
            />
          </div>
        </div>

        {/* ── Analysis Row ────────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryCompliance
            categories={TRAINING_CATEGORIES}
            staffList={staff}
            getStatus={getStatusForCategory}
          />
          <StaffCompliance
            staffList={staff}
            getStaffName={getStaffName}
            getStatus={getStatusForCategory}
            categories={TRAINING_CATEGORIES}
          />
        </div>

        {/* ── Filter Bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="pl-8 h-8 text-sm"
            />
          </div>
          <button
            onClick={() => setFilterMode(filterMode === "gaps_only" ? "all" : "gaps_only")}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all",
              filterMode === "gaps_only"
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-white text-slate-500 border-slate-200 hover:border-red-200",
            )}
          >
            <Filter className="h-3 w-3" />
            {filterMode === "gaps_only" ? "Showing gaps only" : "Show gaps only"}
            {filterMode === "gaps_only" && <X className="h-3 w-3 ml-0.5" />}
          </button>
          <span className="text-[11px] text-slate-400 ml-auto">
            {filteredStaff.length} staff shown
          </span>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 text-xs">
          {(["completed", "in_progress", "not_started", "expired", "unknown"] as const).map((s) => {
            const Icon = STATUS_ICON[s];
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn("w-6 h-6 rounded-md border flex items-center justify-center", STATUS_CELL[s])}>
                  <Icon className={cn("h-3.5 w-3.5", STATUS_COLOUR[s])} />
                </div>
                <span className="text-slate-600">{STATUS_LABEL[s]}</span>
              </div>
            );
          })}
        </div>

        {/* ── Matrix Table ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-[160px] sticky left-0 bg-slate-50 z-10">
                    Staff Member
                  </th>
                  {TRAINING_CATEGORIES.map((cat) => (
                    <th key={cat.key} className="px-2 py-3 text-center min-w-[72px]">
                      <div className="text-[10px] font-semibold text-slate-500 leading-tight">{cat.short}</div>
                      {cat.mandatory && (
                        <div className="text-[8px] text-rose-500 font-semibold uppercase">Req</div>
                      )}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center min-w-[60px]">
                    <div className="text-[10px] font-semibold text-slate-500">Score</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaff.map((member) => {
                  const compliant = mandatoryCategories.filter((cat) => {
                    const st = getStatusForCategory(member.id, cat.key);
                    return st === "completed" || st === "exempt";
                  }).length;
                  const pct = mandatoryCategories.length > 0
                    ? Math.round((compliant / mandatoryCategories.length) * 100)
                    : 0;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                        <Link
                          href={`/workforce/staff/${member.id}`}
                          className="flex items-center gap-2 hover:text-indigo-600 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                            {member.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{member.full_name}</p>
                            <p className="text-[9px] text-slate-400">{member.job_title}</p>
                          </div>
                        </Link>
                      </td>
                      {TRAINING_CATEGORIES.map((cat) => {
                        const status = getStatusForCategory(member.id, cat.key);
                        const Icon = STATUS_ICON[status];
                        const expiry = getExpiryForCategory(member.id, cat.key);
                        const daysUntilExpiry = expiry ? Math.round((new Date(expiry).getTime() - Date.now()) / 86400000) : null;
                        const expiringsSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 90;
                        return (
                          <td key={cat.key} className="px-2 py-2.5 text-center">
                            <div
                              className={cn(
                                "inline-flex flex-col items-center justify-center w-10 h-10 rounded-lg border",
                                STATUS_CELL[status],
                                expiringsSoon && status === "completed" && "ring-1 ring-amber-300",
                              )}
                              title={`${STATUS_LABEL[status]}${expiry ? ` · Expires: ${expiry}` : ""}`}
                            >
                              <Icon className={cn("h-3.5 w-3.5", STATUS_COLOUR[status])} />
                              {expiringsSoon && (
                                <span className="text-[7px] text-amber-600 font-bold mt-0.5">{daysUntilExpiry}d</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn(
                          "text-xs font-bold tabular-nums",
                          pct === 100 ? "text-emerald-600" : pct >= 70 ? "text-amber-600" : "text-red-600",
                        )}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Regulatory Footer ───────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015: Reg 32 (staff qualifications), Reg 33 (induction training),
          Reg 34 (ongoing training). Training matrix is evidence for Reg 44/45 and ILACS inspection — mandatory
          training gaps are a regulatory risk.
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Training Compliance Matrix — mandatory training compliance, training gaps, Reg 32/33/34 training requirements, fire safety, safeguarding, medication, moving and handling training, Ofsted workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
