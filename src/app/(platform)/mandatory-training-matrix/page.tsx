"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, CheckCircle2, Clock, Users, Shield, GraduationCap,
  ChevronDown, ChevronUp, ArrowUpDown, FileCheck, Award, BookOpen, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useTrainingMatrixRows } from "@/hooks/use-training-matrix-rows";
import type {
  TrainingMatrixRow, TrainingCourseCategory, TrainingCourseStatus,
  TrainingOverallCompliance, TrainingStatusEntry,
} from "@/types/extended";
import {
  TRAINING_COURSE_CATEGORY_LABEL, TRAINING_COURSE_STATUS_LABEL,
  TRAINING_OVERALL_COMPLIANCE_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const STATUS_CLR: Record<TrainingCourseStatus, string> = {
  valid: "bg-green-100 text-green-800",
  expiring_soon: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
  not_completed: "bg-slate-100 text-slate-700",
};

const STATUS_DOT: Record<TrainingCourseStatus, string> = {
  valid: "bg-green-500",
  expiring_soon: "bg-amber-500",
  expired: "bg-red-500",
  not_completed: "bg-slate-400",
};

const COMPLIANCE_CLR: Record<TrainingOverallCompliance, string> = {
  fully_compliant: "bg-green-100 text-green-800",
  action_required: "bg-amber-100 text-amber-800",
  non_compliant: "bg-red-100 text-red-800",
};

const COMPLIANCE_BORDER: Record<TrainingOverallCompliance, string> = {
  fully_compliant: "border-l-green-400",
  action_required: "border-l-amber-400",
  non_compliant: "border-l-red-500",
};

const CATEGORY_CLR: Record<TrainingCourseCategory, string> = {
  mandatory: "bg-blue-50 text-blue-700 border-blue-200",
  role_specific: "bg-purple-50 text-purple-700 border-purple-200",
  best_practice: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function MandatoryTrainingMatrixPage() {
  const { data: res, isLoading } = useTrainingMatrixRows();
  const data: TrainingMatrixRow[] = res?.data ?? [];

  const [filterCompliance, setFilterCompliance] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "compliance" | "expiry">("compliance");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* summary stats */
  const stats = useMemo(() => {
    const totalStaff = data.length;
    const totalCourses = data.reduce((sum, r) => sum + r.total_courses, 0);
    const totalValid = data.reduce((sum, r) => sum + r.valid_count, 0);
    const totalExpiring = data.reduce((sum, r) => sum + r.expiring_count, 0);
    const totalExpired = data.reduce((sum, r) => sum + r.expired_count, 0);
    const fullyCompliant = data.filter((r) => r.overall_compliance === "fully_compliant").length;
    const compliancePct = totalCourses > 0 ? Math.round((totalValid / totalCourses) * 100) : 0;
    return { totalStaff, totalCourses, totalValid, totalExpiring, totalExpired, fullyCompliant, compliancePct };
  }, [data]);

  /* alerts */
  const alerts = useMemo(() => {
    const list: { staffId: string; course: string; status: TrainingCourseStatus; expiryDate: string }[] = [];
    data.forEach((r) => {
      r.training_statuses.forEach((t: TrainingStatusEntry) => {
        if (t.status === "expired" || t.status === "expiring_soon" || t.status === "not_completed") {
          list.push({ staffId: r.staff_id, course: t.course_name, status: t.status, expiryDate: t.expiry_date });
        }
      });
    });
    return list;
  }, [data]);

  /* filter + sort */
  const filtered = useMemo(() => {
    let rows = [...data];
    if (filterCompliance !== "all") {
      rows = rows.filter((r) => r.overall_compliance === filterCompliance);
    }
    if (sortBy === "name") {
      rows.sort((a, b) => getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id)));
    } else if (sortBy === "compliance") {
      const order: Record<TrainingOverallCompliance, number> = { non_compliant: 0, action_required: 1, fully_compliant: 2 };
      rows.sort((a, b) => order[a.overall_compliance] - order[b.overall_compliance]);
    } else if (sortBy === "expiry") {
      rows.sort((a, b) => a.next_refresher_due.localeCompare(b.next_refresher_due));
    }
    return rows;
  }, [data, filterCompliance, sortBy]);

  /* export columns */
  const exportCols: ExportColumn<TrainingMatrixRow>[] = [
    { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
    { header: "Role", accessor: (r) => r.role },
    { header: "Total Courses", accessor: (r) => String(r.total_courses) },
    { header: "Valid", accessor: (r) => String(r.valid_count) },
    { header: "Expiring Soon", accessor: (r) => String(r.expiring_count) },
    { header: "Expired", accessor: (r) => String(r.expired_count) },
    { header: "Overall Compliance", accessor: (r) => TRAINING_OVERALL_COMPLIANCE_LABEL[r.overall_compliance] },
    { header: "Next Refresher Due", accessor: (r) => r.next_refresher_due },
  ];

  if (isLoading) return <PageShell title="Mandatory Training Matrix" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Mandatory Training Matrix"
      subtitle="Cross-staff training currency · Reg 32 · KCSIE 2024 · Quality Standard 13"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Mandatory Training Matrix" />
          <ExportButton data={data} columns={exportCols} filename="mandatory-training-matrix" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Team Compliance", value: `${stats.compliancePct}%`, icon: Shield, clr: "text-purple-600" },
            { label: "Expiring (30 days)", value: stats.totalExpiring, icon: Clock, clr: "text-amber-600" },
            { label: "Expired Courses", value: stats.totalExpired, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Fully Compliant Staff", value: `${stats.fullyCompliant}/${stats.totalStaff}`, icon: CheckCircle2, clr: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-red-800 mb-1">
                {alerts.length} training {alerts.length === 1 ? "issue" : "issues"} requiring attention
              </p>
              <ul className="space-y-1 text-red-700">
                {alerts.map((a, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", STATUS_DOT[a.status])} />
                    <span>
                      <span className="font-medium">{getStaffName(a.staffId)}</span> — {a.course}
                      {" · "}
                      <span className="font-medium">{TRAINING_COURSE_STATUS_LABEL[a.status]}</span>
                      {a.status !== "not_completed" && <> (expiry {a.expiryDate})</>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* filters / sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterCompliance} onValueChange={setFilterCompliance}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Compliance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              {(Object.keys(TRAINING_OVERALL_COMPLIANCE_LABEL) as TrainingOverallCompliance[]).map((k) => (
                <SelectItem key={k} value={k}>{TRAINING_OVERALL_COMPLIANCE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "compliance" | "expiry")}>
            <SelectTrigger className="w-[200px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance (worst first)</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
              <SelectItem value="expiry">Next refresher due</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-xs text-muted-foreground">
            Showing {filtered.length} of {data.length} staff
          </div>
        </div>

        {/* matrix card list */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const compliancePct = r.total_courses > 0 ? Math.round((r.valid_count / r.total_courses) * 100) : 0;
            return (
              <Card key={r.id} className={cn("border-l-4", COMPLIANCE_BORDER[r.overall_compliance])}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {getStaffName(r.staff_id)}
                        <Badge variant="outline" className="bg-muted/50 text-xs">{r.role}</Badge>
                        <Badge variant="outline" className={COMPLIANCE_CLR[r.overall_compliance]}>
                          {TRAINING_OVERALL_COMPLIANCE_LABEL[r.overall_compliance]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.valid_count}/{r.total_courses} valid · {compliancePct}% compliance · Next refresher {r.next_refresher_due}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />{r.valid_count}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{r.expiring_count}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{r.expired_count}</span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* compliance bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Total Courses</p>
                        <p className="text-lg font-bold">{r.total_courses}</p>
                      </div>
                      <div className="bg-green-50 rounded p-2 text-center">
                        <p className="text-xs text-green-700">Valid</p>
                        <p className="text-lg font-bold text-green-700">{r.valid_count}</p>
                      </div>
                      <div className="bg-amber-50 rounded p-2 text-center">
                        <p className="text-xs text-amber-700">Expiring soon</p>
                        <p className="text-lg font-bold text-amber-700">{r.expiring_count}</p>
                      </div>
                      <div className="bg-red-50 rounded p-2 text-center">
                        <p className="text-xs text-red-700">Expired</p>
                        <p className="text-lg font-bold text-red-700">{r.expired_count}</p>
                      </div>
                    </div>

                    {/* course table */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Course Currency
                      </p>
                      <div className="space-y-1.5">
                        {r.training_statuses.map((t: TrainingStatusEntry, i: number) => (
                          <div
                            key={i}
                            className="grid grid-cols-12 gap-2 items-center bg-muted/30 rounded px-2 py-1.5 text-xs"
                          >
                            <div className="col-span-12 md:col-span-4 flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[t.status])} />
                              <span className="font-medium truncate">{t.course_name}</span>
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <Badge variant="outline" className={cn("text-[10px]", CATEGORY_CLR[t.category])}>
                                {TRAINING_COURSE_CATEGORY_LABEL[t.category]}
                              </Badge>
                            </div>
                            <div className="col-span-4 md:col-span-2 text-muted-foreground">
                              {t.status === "not_completed" ? "—" : t.completed_date}
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              {t.status === "not_completed" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : t.validity_months === 0 ? (
                                <span className="text-muted-foreground">No expiry</span>
                              ) : (
                                <span className={cn(
                                  t.status === "expired" && "text-red-600 font-medium",
                                  t.status === "expiring_soon" && "text-amber-700 font-medium",
                                )}>
                                  {t.expiry_date}
                                </span>
                              )}
                            </div>
                            <div className="col-span-12 md:col-span-2 flex items-center gap-2 justify-end">
                              <Badge variant="outline" className={cn("text-[10px]", STATUS_CLR[t.status])}>
                                {TRAINING_COURSE_STATUS_LABEL[t.status]}
                              </Badge>
                              {t.certificate_on_file ? (
                                <FileCheck className="h-3.5 w-3.5 text-green-600" aria-label="Certificate on file" />
                              ) : (
                                <FileCheck className="h-3.5 w-3.5 text-slate-300" aria-label="No certificate" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* providers summary */}
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      Providers: {Array.from(new Set(r.training_statuses.map((t: TrainingStatusEntry) => t.provider))).join(", ")}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <GraduationCap className="h-3.5 w-3.5 mr-1" />
                        Schedule refresher
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Reg 32 (Staffing of the children&apos;s home) requires the registered person
            to ensure that all staff receive appropriate training, supervision and appraisal to deliver care that meets the home&apos;s Statement of Purpose.
            Quality Standard 13 (Leadership and Management) requires staff to have the experience, qualifications and skills to meet children&apos;s needs.
            Keeping Children Safe in Education (KCSIE 2024) requires all staff working with children to receive Safeguarding Level 3 training every two years,
            with annual safeguarding briefings and online safety updates. Training currency must be evidenced through certificates retained in personnel files
            and reviewed at supervision. Out-of-date mandatory training is a regulatory shortfall and may be cited at Ofsted inspection or Reg 44 independent visits.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
