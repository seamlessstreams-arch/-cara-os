"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, Clock, Users, Calendar,
  ArrowDown, Shield, UserCheck, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type SupervisionStatus = "current" | "due_soon" | "overdue";

interface SupervisionRelationship {
  id: string;
  superviseeId: string;
  supervisorId: string;
  frequency: string;
  lastSupervisionDate: string;
  nextSupervisionDate: string;
  status: SupervisionStatus;
  sessionsThisYear: number;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_LABEL: Record<SupervisionStatus, string> = {
  current: "Current",
  due_soon: "Due Soon",
  overdue: "Overdue",
};

const STATUS_CLR: Record<SupervisionStatus, string> = {
  current: "bg-green-100 text-green-800",
  due_soon: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
};

const BORDER_CLR: Record<SupervisionStatus, string> = {
  current: "border-l-green-400",
  due_soon: "border-l-amber-400",
  overdue: "border-l-red-500",
};

const STATUS_DOT: Record<SupervisionStatus, string> = {
  current: "bg-green-500",
  due_soon: "bg-amber-500",
  overdue: "bg-red-500",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SupervisionRelationship[] = [
  {
    id: "sm_1",
    superviseeId: "staff_ryan",
    supervisorId: "staff_darren",
    frequency: "Monthly",
    lastSupervisionDate: d(-18),
    nextSupervisionDate: d(12),
    status: "current",
    sessionsThisYear: 5,
    notes: "",
  },
  {
    id: "sm_2",
    superviseeId: "staff_edward",
    supervisorId: "staff_ryan",
    frequency: "6-weekly",
    lastSupervisionDate: d(-50),
    nextSupervisionDate: d(-8),
    status: "overdue",
    sessionsThisYear: 3,
    notes: "Supervision overdue. Edward assigned to lone-working tasks restricted until supervision completed. Darren to schedule urgently.",
  },
  {
    id: "sm_3",
    superviseeId: "staff_anna",
    supervisorId: "staff_ryan",
    frequency: "6-weekly",
    lastSupervisionDate: d(-30),
    nextSupervisionDate: d(12),
    status: "current",
    sessionsThisYear: 4,
    notes: "Anna on restricted duties (LADO). Supervision includes LADO welfare check.",
  },
  {
    id: "sm_4",
    superviseeId: "staff_lackson",
    supervisorId: "staff_ryan",
    frequency: "6-weekly",
    lastSupervisionDate: d(-35),
    nextSupervisionDate: d(7),
    status: "due_soon",
    sessionsThisYear: 4,
    notes: "",
  },
  {
    id: "sm_5",
    superviseeId: "staff_chervelle",
    supervisorId: "staff_darren",
    frequency: "6-weekly",
    lastSupervisionDate: d(-20),
    nextSupervisionDate: d(22),
    status: "current",
    sessionsThisYear: 4,
    notes: "Discussed senior practitioner pathway. Chervelle excelling in direct work with Casey.",
  },
  {
    id: "sm_6",
    superviseeId: "staff_mirela",
    supervisorId: "staff_darren",
    frequency: "6-weekly",
    lastSupervisionDate: d(-40),
    nextSupervisionDate: d(2),
    status: "due_soon",
    sessionsThisYear: 3,
    notes: "Mirela settling in well. Good feedback from night shift.",
  },
  {
    id: "sm_7",
    superviseeId: "staff_darren",
    supervisorId: "external_ri",
    frequency: "Quarterly",
    lastSupervisionDate: d(-60),
    nextSupervisionDate: d(30),
    status: "current",
    sessionsThisYear: 2,
    notes: "",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function SupervisionMatrixPage() {
  const [data] = useState(SEED);

  /* summary stats */
  const stats = useMemo(() => {
    const internalRecords = data.filter((r) => r.supervisorId !== "external_ri");
    const totalStaff = internalRecords.length;
    const currentCount = internalRecords.filter((r) => r.status === "current").length;
    const dueSoonCount = internalRecords.filter((r) => r.status === "due_soon").length;
    const overdueCount = internalRecords.filter((r) => r.status === "overdue").length;
    const compliancePct = totalStaff > 0 ? Math.round((currentCount / totalStaff) * 100) : 0;

    const nextDueRecord = [...internalRecords].sort(
      (a, b) => a.nextSupervisionDate.localeCompare(b.nextSupervisionDate)
    )[0];

    return { totalStaff, currentCount, dueSoonCount, overdueCount, compliancePct, nextDueDate: nextDueRecord?.nextSupervisionDate ?? "—" };
  }, [data]);

  const overdueRecords = useMemo(
    () => data.filter((r) => r.status === "overdue"),
    [data]
  );

  /* RM supervised directly */
  const rmDirectReports = useMemo(
    () => data.filter((r) => r.supervisorId === "staff_darren" && r.superviseeId !== "staff_darren"),
    [data]
  );

  /* Deputy supervised */
  const deputyReports = useMemo(
    () => data.filter((r) => r.supervisorId === "staff_ryan"),
    [data]
  );

  /* RM external supervision */
  const rmExternal = useMemo(
    () => data.find((r) => r.superviseeId === "staff_darren" && r.supervisorId === "external_ri"),
    [data]
  );

  /* export columns */
  const exportCols: ExportColumn<SupervisionRelationship>[] = [
    { header: "Supervisee", accessor: (r: SupervisionRelationship) => r.superviseeId === "staff_darren" ? getStaffName(r.superviseeId) + " (RM)" : getStaffName(r.superviseeId) },
    { header: "Supervisor", accessor: (r: SupervisionRelationship) => r.supervisorId === "external_ri" ? "Responsible Individual" : getStaffName(r.supervisorId) },
    { header: "Frequency", accessor: (r: SupervisionRelationship) => r.frequency },
    { header: "Last Supervision", accessor: (r: SupervisionRelationship) => r.lastSupervisionDate },
    { header: "Next Due", accessor: (r: SupervisionRelationship) => r.nextSupervisionDate },
    { header: "Status", accessor: (r: SupervisionRelationship) => STATUS_LABEL[r.status] },
    { header: "Sessions (Year)", accessor: (r: SupervisionRelationship) => String(r.sessionsThisYear) },
    { header: "Notes", accessor: (r: SupervisionRelationship) => r.notes },
  ];

  return (
    <PageShell
      title="Supervision Matrix"
      subtitle="Staff supervision structure, reporting lines, and compliance status"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Supervision Matrix" />
          <ExportButton data={data} columns={exportCols} filename="supervision-matrix" />
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
                  <span className="font-medium">{getStaffName(r.superviseeId)}</span> &mdash; last supervised {r.lastSupervisionDate}, was due {r.nextSupervisionDate}.
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
                      {rmExternal.frequency} &middot; {STATUS_LABEL[rmExternal.status]}
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
                          <p className="text-sm font-medium">{getStaffName(r.superviseeId)}</p>
                          <p className="text-[10px] text-muted-foreground">{r.frequency}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full", STATUS_DOT[r.status])} />
                          <span className="text-[10px] text-muted-foreground">{STATUS_LABEL[r.status]}</span>
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
                            <p className="text-sm font-medium">{getStaffName(r.superviseeId)}</p>
                            <p className="text-[10px] text-muted-foreground">{r.frequency}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("h-2 w-2 rounded-full", STATUS_DOT[r.status])} />
                            <span className="text-[10px] text-muted-foreground">{STATUS_LABEL[r.status]}</span>
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
          {data.map((r) => {
            const isExternal = r.supervisorId === "external_ri";
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_CLR[r.status])}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {isExternal
                          ? `${getStaffName(r.superviseeId)} (RM)`
                          : getStaffName(r.superviseeId)}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>
                          {STATUS_LABEL[r.status]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Supervisor: {isExternal ? "Responsible Individual" : getStaffName(r.supervisorId)}
                        {" "}&middot; {r.frequency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{r.sessionsThisYear}</p>
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
                      <p className="text-sm font-bold">{r.lastSupervisionDate}</p>
                    </div>
                    <div className="bg-muted/40 rounded p-2 text-center">
                      <p className="font-medium text-xs">Next Due</p>
                      <p className={cn("text-sm font-bold", r.status === "overdue" && "text-red-600")}>
                        {r.nextSupervisionDate}
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
              {data.filter((r) => r.nextSupervisionDate === stats.nextDueDate).map((r) => getStaffName(r.superviseeId)).join(", ")}
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
