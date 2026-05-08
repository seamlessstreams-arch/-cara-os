"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, Clock, Users, Calendar,
  ArrowDown, Shield, UserCheck, GitBranch, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useSupervisionMatrixRecords } from "@/hooks/use-supervision-matrix-records";
import type { SupervisionMatrixRecord, SupervisionMatrixStatus } from "@/types/extended";
import { SUPERVISION_MATRIX_STATUS_LABEL } from "@/types/extended";

/* ── local config ─────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<SupervisionMatrixStatus, string> = {
  current: "bg-green-100 text-green-800",
  due_soon: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
};

const BORDER_CLR: Record<SupervisionMatrixStatus, string> = {
  current: "border-l-green-400",
  due_soon: "border-l-amber-400",
  overdue: "border-l-red-500",
};

const STATUS_DOT: Record<SupervisionMatrixStatus, string> = {
  current: "bg-green-500",
  due_soon: "bg-amber-500",
  overdue: "bg-red-500",
};

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function SupervisionMatrixPage() {
  const { data: records = [], isLoading } = useSupervisionMatrixRecords();

  /* summary stats */
  const stats = useMemo(() => {
    const internalRecords = records.filter((r) => r.supervisor_id !== "external_ri");
    const totalStaff = internalRecords.length;
    const currentCount = internalRecords.filter((r) => r.status === "current").length;
    const dueSoonCount = internalRecords.filter((r) => r.status === "due_soon").length;
    const overdueCount = internalRecords.filter((r) => r.status === "overdue").length;
    const compliancePct = totalStaff > 0 ? Math.round((currentCount / totalStaff) * 100) : 0;

    const nextDueRecord = [...internalRecords].sort(
      (a, b) => a.next_supervision_date.localeCompare(b.next_supervision_date)
    )[0];

    return { totalStaff, currentCount, dueSoonCount, overdueCount, compliancePct, nextDueDate: nextDueRecord?.next_supervision_date ?? "—" };
  }, [records]);

  const overdueRecords = useMemo(
    () => records.filter((r) => r.status === "overdue"),
    [records]
  );

  /* RM supervised directly */
  const rmDirectReports = useMemo(
    () => records.filter((r) => r.supervisor_id === "staff_darren" && r.supervisee_id !== "staff_darren"),
    [records]
  );

  /* Deputy supervised */
  const deputyReports = useMemo(
    () => records.filter((r) => r.supervisor_id === "staff_ryan"),
    [records]
  );

  /* RM external supervision */
  const rmExternal = useMemo(
    () => records.find((r) => r.supervisee_id === "staff_darren" && r.supervisor_id === "external_ri"),
    [records]
  );

  /* export columns */
  const exportCols: ExportColumn<SupervisionMatrixRecord>[] = [
    { header: "Supervisee", accessor: (r: SupervisionMatrixRecord) => r.supervisee_id === "staff_darren" ? getStaffName(r.supervisee_id) + " (RM)" : getStaffName(r.supervisee_id) },
    { header: "Supervisor", accessor: (r: SupervisionMatrixRecord) => r.supervisor_id === "external_ri" ? "Responsible Individual" : getStaffName(r.supervisor_id) },
    { header: "Frequency", accessor: (r: SupervisionMatrixRecord) => r.frequency },
    { header: "Last Supervision", accessor: (r: SupervisionMatrixRecord) => r.last_supervision_date },
    { header: "Next Due", accessor: (r: SupervisionMatrixRecord) => r.next_supervision_date },
    { header: "Status", accessor: (r: SupervisionMatrixRecord) => SUPERVISION_MATRIX_STATUS_LABEL[r.status] },
    { header: "Sessions (Year)", accessor: (r: SupervisionMatrixRecord) => String(r.sessions_this_year) },
    { header: "Notes", accessor: (r: SupervisionMatrixRecord) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Supervision Matrix" subtitle="Staff supervision structure, reporting lines, and compliance status">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Supervision Matrix"
      subtitle="Staff supervision structure, reporting lines, and compliance status"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Supervision Matrix" />
          <ExportButton data={records} columns={exportCols} filename="supervision-matrix" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── summary stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Staff", value: stats.totalStaff, icon: Users, clr: "text-blue-600" },
            { label: "Current", value: stats.currentCount, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Due Soon", value: stats.dueSoonCount, icon: Clock, clr: "text-amber-600" },
            { label: "Overdue", value: stats.overdueCount, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Compliance", value: `${stats.compliancePct}%`, icon: Shield, clr: "text-purple-600" },
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

        {/* ── overdue alert ──────────────────────────────────────────────── */}
        {overdueRecords.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">
                {overdueRecords.length} overdue supervision{overdueRecords.length > 1 ? "s" : ""}
              </p>
              {overdueRecords.map((r) => (
                <p key={r.id} className="text-red-700 mt-1">
                  <span className="font-medium">{getStaffName(r.supervisee_id)}</span> &mdash; last supervised {r.last_supervision_date}, was due {r.next_supervision_date}.
                  {r.notes && <> {r.notes}</>}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ── visual org-chart matrix ────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Supervision Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* RI level */}
              <div className="flex flex-col items-center">
                <div className="rounded-lg border-2 border-slate-300 bg-slate-50 px-5 py-3 text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsible Individual</p>
                  <p className="text-sm text-slate-600 mt-0.5">External (RI)</p>
                  {rmExternal && (
                    <Badge variant="outline" className={cn("mt-1 text-[10px]", STATUS_CLR[rmExternal.status])}>
                      {rmExternal.frequency} &middot; {SUPERVISION_MATRIX_STATUS_LABEL[rmExternal.status]}
                    </Badge>
                  )}
                </div>
                <div className="w-px h-6 bg-slate-300" />
                <ArrowDown className="h-3 w-3 text-slate-400 -mt-1 -mb-1" />
                <div className="w-px h-4 bg-slate-300" />
              </div>

              {/* RM level */}
              <div className="flex flex-col items-center">
                <div className="rounded-lg border-2 border-blue-400 bg-blue-50 px-5 py-3 text-center min-w-[200px]">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Registered Manager</p>
                  <p className="text-sm font-bold text-blue-900 mt-0.5">{getStaffName("staff_darren")}</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Supervises {rmDirectReports.length + deputyReports.length > 0 ? rmDirectReports.length : 0} staff directly + Deputy</p>
                </div>
                <div className="w-px h-6 bg-slate-300" />
              </div>

              {/* branching lines */}
              <div className="flex items-start gap-0 w-full max-w-4xl">
                {/* left branch — RM direct reports */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-1/2 border-t-2 border-r-2 border-slate-300 h-4 self-end" />
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Direct Reports (RM)</p>
                  <div className="space-y-2 w-full max-w-xs">
                    {rmDirectReports.map((r) => (
                      <div
                        key={r.id}
                        className={cn(
                          "rounded-lg border-l-4 bg-white border border-slate-200 px-3 py-2 flex items-center justify-between",
                          BORDER_CLR[r.status]
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium">{getStaffName(r.supervisee_id)}</p>
                          <p className="text-[10px] text-muted-foreground">{r.frequency}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full", STATUS_DOT[r.status])} />
                          <span className="text-[10px] text-muted-foreground">{SUPERVISION_MATRIX_STATUS_LABEL[r.status]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* right branch — Deputy */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-1/2 border-t-2 border-l-2 border-slate-300 h-4 self-start" />
                  <div className="flex flex-col items-center w-full">
                    <div className="rounded-lg border-2 border-indigo-300 bg-indigo-50 px-4 py-2 text-center mb-2">
                      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Deputy Manager</p>
                      <p className="text-sm font-bold text-indigo-900">{getStaffName("staff_ryan")}</p>
                      <p className="text-[10px] text-indigo-600">Supervises {deputyReports.length} staff</p>
                    </div>
                    <div className="w-px h-4 bg-slate-300" />
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Deputy&apos;s Reports</p>
                    <div className="space-y-2 w-full max-w-xs">
                      {deputyReports.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "rounded-lg border-l-4 bg-white border border-slate-200 px-3 py-2 flex items-center justify-between",
                            BORDER_CLR[r.status]
                          )}
                        >
                          <div>
                            <p className="text-sm font-medium">{getStaffName(r.supervisee_id)}</p>
                            <p className="text-[10px] text-muted-foreground">{r.frequency}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("h-2 w-2 rounded-full", STATUS_DOT[r.status])} />
                            <span className="text-[10px] text-muted-foreground">{SUPERVISION_MATRIX_STATUS_LABEL[r.status]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── detail cards ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {records.map((r) => {
            const isExternal = r.supervisor_id === "external_ri";
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_CLR[r.status])}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {isExternal
                          ? `${getStaffName(r.supervisee_id)} (RM)`
                          : getStaffName(r.supervisee_id)}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>
                          {SUPERVISION_MATRIX_STATUS_LABEL[r.status]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Supervisor: {isExternal ? "Responsible Individual" : getStaffName(r.supervisor_id)}
                        {" "}&middot; {r.frequency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{r.sessions_this_year}</p>
                      <p className="text-xs text-muted-foreground">sessions this year</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-muted/40 rounded p-2 text-center">
                      <p className="font-medium text-xs">Frequency</p>
                      <p className="text-sm font-bold">{r.frequency}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-2 text-center">
                      <p className="font-medium text-xs">Last Supervision</p>
                      <p className="text-sm font-bold">{r.last_supervision_date}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-2 text-center">
                      <p className="font-medium text-xs">Next Due</p>
                      <p className={cn("text-sm font-bold", r.status === "overdue" && "text-red-600")}>
                        {r.next_supervision_date}
                      </p>
                    </div>
                  </div>

                  {r.notes && (
                    <div>
                      <p className="font-medium mb-1">Notes</p>
                      <p className="text-muted-foreground text-xs">{r.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── next due summary ───────────────────────────────────────────── */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm flex items-start gap-2">
          <Calendar className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-800">Next supervision due: {stats.nextDueDate}</p>
            <p className="text-blue-700 text-xs mt-0.5">
              {records.filter((r) => r.next_supervision_date === stats.nextDueDate).map((r) => getStaffName(r.supervisee_id)).join(", ")}
            </p>
          </div>
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-4 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Reg 33 requires the registered person to ensure all staff receive appropriate supervision.
            The Quality Standards (Guide to the Children&apos;s Homes Regulations, Standard 7 &mdash; Workforce) state that all staff must have regular,
            recorded supervision with their line manager, covering safeguarding, professional development, wellbeing, and case discussion.
            Supervision frequency must be proportionate to role and experience &mdash; a minimum of monthly for care staff and fortnightly during probation.
            The Registered Manager must also receive supervision from the Responsible Individual at least quarterly (Reg 33(4)(a)).
            Overdue supervisions represent a regulatory shortfall that may be identified during Reg 44 independent visits or Ofsted inspections.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
