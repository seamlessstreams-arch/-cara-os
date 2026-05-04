"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, AlertTriangle, CheckCircle2, Clock, Users, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ComplianceStatus = "compliant" | "due_soon" | "overdue" | "significantly_overdue";

interface SupervisionRecord {
  staffId: string;
  lastSupervisionDate: string;
  nextDueDate: string;
  supervisorId: string;
  frequency: string;
  sessionsThisYear: number;
  sessionsExpectedThisYear: number;
  cancelledByStaff: number;
  cancelledByManager: number;
  themes: string[];
  actionsPending: number;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_LABEL: Record<ComplianceStatus, string> = { compliant: "Compliant", due_soon: "Due Soon (≤7d)", overdue: "Overdue", significantly_overdue: "Significantly Overdue (>30d)" };
const STATUS_CLR: Record<ComplianceStatus, string> = { compliant: "bg-green-100 text-green-800", due_soon: "bg-amber-100 text-amber-800", overdue: "bg-red-100 text-red-800", significantly_overdue: "bg-red-200 text-red-900" };
const BORDER_ST: Record<ComplianceStatus, string> = { compliant: "border-l-green-400", due_soon: "border-l-amber-400", overdue: "border-l-red-500", significantly_overdue: "border-l-red-700" };

function getStatus(nextDue: string): ComplianceStatus {
  const today = d(0);
  const sevenDays = d(7);
  const thirtyDaysAgo = d(-30);
  if (nextDue < thirtyDaysAgo) return "significantly_overdue";
  if (nextDue < today) return "overdue";
  if (nextDue <= sevenDays) return "due_soon";
  return "compliant";
}

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SupervisionRecord[] = [
  {
    staffId: "staff_ryan", lastSupervisionDate: d(-14), nextDueDate: d(14), supervisorId: "staff_darren",
    frequency: "Monthly", sessionsThisYear: 4, sessionsExpectedThisYear: 5, cancelledByStaff: 0, cancelledByManager: 1,
    themes: ["Casey's CSE screening", "Deputy leadership development", "PRICE refresher outcomes", "Staff team dynamics"],
    actionsPending: 1, notes: "Ryan consistently engages well in supervision. Current focus on leadership development as deputy. One session cancelled by Darren due to emergency (rescheduled within 5 days). Action pending: Ryan to draft night staff audit schedule.",
  },
  {
    staffId: "staff_anna", lastSupervisionDate: d(-21), nextDueDate: d(7), supervisorId: "staff_darren",
    frequency: "Monthly", sessionsThisYear: 5, sessionsExpectedThisYear: 5, cancelledByStaff: 0, cancelledByManager: 0,
    themes: ["Casey's direct work progress", "Art therapy approaches", "LADO referral impact", "Professional boundaries"],
    actionsPending: 0, notes: "Anna is up to date with supervision. No cancellations this year. Anna uses supervision reflectively and brings prepared agenda. Current focus on direct work with Casey and managing the emotional impact of the LADO referral regarding her practice.",
  },
  {
    staffId: "staff_edward", lastSupervisionDate: d(-35), nextDueDate: d(-7), supervisorId: "staff_darren",
    frequency: "Monthly", sessionsThisYear: 3, sessionsExpectedThisYear: 5, cancelledByStaff: 1, cancelledByManager: 1,
    themes: ["Medication competency development", "Jordan's key working", "Online safety awareness"],
    actionsPending: 2, notes: "Edward's supervision is 1 week overdue. Previous session was cancelled by Edward (sick day) and the one before by Darren (LADO strategy meeting). Edward needs additional support with medication competency re-sit. Actions pending: complete e-learning modules, prepare for Level 3 re-assessment.",
  },
  {
    staffId: "staff_chervelle", lastSupervisionDate: d(-10), nextDueDate: d(18), supervisorId: "staff_darren",
    frequency: "Monthly", sessionsThisYear: 5, sessionsExpectedThisYear: 5, cancelledByStaff: 0, cancelledByManager: 0,
    themes: ["Positive handling training", "Casey de-escalation approaches", "Career development — senior role interest", "Self-care and wellbeing"],
    actionsPending: 0, notes: "Chervelle is fully compliant. Excellent engagement. Expressed interest in progressing to Senior RCW — discussed development pathway. Currently supporting Casey's direct work alongside Anna.",
  },
  {
    staffId: "staff_lackson", lastSupervisionDate: d(-28), nextDueDate: d(0), supervisorId: "staff_ryan",
    frequency: "Monthly", sessionsThisYear: 4, sessionsExpectedThisYear: 5, cancelledByStaff: 0, cancelledByManager: 1,
    themes: ["Night shift procedures", "Casey's self-harm response", "Lone working confidence", "Medication competency renewal"],
    actionsPending: 1, notes: "Lackson's supervision is due today. Supervised by Ryan (deputy). One cancelled session this year (Ryan was on leave — rescheduled). Lackson works primarily waking nights — supervision scheduled during crossover shifts. Action: medication Level 3 renewal course on " + d(7) + ".",
  },
  {
    staffId: "staff_mirela", lastSupervisionDate: d(-7), nextDueDate: d(7), supervisorId: "staff_ryan",
    frequency: "Fortnightly (probationary)", sessionsThisYear: 6, sessionsExpectedThisYear: 6, cancelledByStaff: 0, cancelledByManager: 0,
    themes: ["Induction progress", "Shadowing completion", "Medication awareness", "Building relationships with YP", "Understanding policies"],
    actionsPending: 2, notes: "Mirela is in her probationary period — fortnightly supervision. Good progress. Supervisioned by Ryan. Currently shadowing for medication and working towards Level 3. Actions: complete safeguarding e-learning, read behaviour support plans for all YP.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function SupervisionTrackerPage() {
  const [data] = useState(SEED);

  const records = useMemo(() => {
    return data.map((r) => ({ ...r, compliance: getStatus(r.nextDueDate) }));
  }, [data]);

  const compliant = records.filter((r) => r.compliance === "compliant").length;
  const dueSoon = records.filter((r) => r.compliance === "due_soon").length;
  const overdue = records.filter((r) => r.compliance === "overdue" || r.compliance === "significantly_overdue").length;
  const totalSessions = data.reduce((sum, r) => sum + r.sessionsThisYear, 0);
  const totalExpected = data.reduce((sum, r) => sum + r.sessionsExpectedThisYear, 0);
  const overallRate = totalExpected > 0 ? Math.round((totalSessions / totalExpected) * 100) : 0;

  const exportCols: ExportColumn<SupervisionRecord>[] = [
    { header: "Staff", accessor: (r: SupervisionRecord) => getStaffName(r.staffId) },
    { header: "Supervisor", accessor: (r: SupervisionRecord) => getStaffName(r.supervisorId) },
    { header: "Frequency", accessor: (r: SupervisionRecord) => r.frequency },
    { header: "Last Session", accessor: (r: SupervisionRecord) => r.lastSupervisionDate },
    { header: "Next Due", accessor: (r: SupervisionRecord) => r.nextDueDate },
    { header: "Sessions (Year)", accessor: (r: SupervisionRecord) => `${r.sessionsThisYear} / ${r.sessionsExpectedThisYear}` },
    { header: "Actions Pending", accessor: (r: SupervisionRecord) => String(r.actionsPending) },
    { header: "Themes", accessor: (r: SupervisionRecord) => r.themes.join(", ") },
  ];

  return (
    <PageShell title="Supervision Compliance Tracker" subtitle="Reg 33 · Staff Supervision · Workforce Development" actions={<div className="flex items-center gap-2"><PrintButton title="Supervision Tracker" /><ExportButton data={data} columns={exportCols} filename="supervision-tracker" /></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Compliant", value: compliant, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Due Soon", value: dueSoon, icon: Clock, clr: "text-amber-600" },
            { label: "Overdue", value: overdue, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Sessions This Year", value: `${totalSessions}/${totalExpected}`, icon: Calendar, clr: "text-blue-600" },
            { label: "Compliance Rate", value: `${overallRate}%`, icon: Users, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {overdue > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-red-800">{overdue} staff member(s) with overdue supervision</p><p className="text-red-700">All staff must receive formal supervision at minimum monthly (Reg 33). Overdue supervision is a regulatory concern and may be identified in Reg 44 or Ofsted inspections.</p></div>
          </div>
        )}

        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.staffId} className={cn("border-l-4", BORDER_ST[r.compliance])}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStaffName(r.staffId)}
                      <Badge variant="outline" className={STATUS_CLR[r.compliance]}>{STATUS_LABEL[r.compliance]}</Badge>
                      {r.actionsPending > 0 && <Badge variant="outline" className="bg-amber-50">{r.actionsPending} action(s)</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Supervisor: {getStaffName(r.supervisorId)} · {r.frequency} · Last: {r.lastSupervisionDate} · Next: {r.nextDueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{r.sessionsThisYear}/{r.sessionsExpectedThisYear}</p>
                    <p className="text-xs text-muted-foreground">sessions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-sm">
                {/* session stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Completed</p><p className="text-sm font-bold">{r.sessionsThisYear}</p></div>
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Expected</p><p className="text-sm font-bold">{r.sessionsExpectedThisYear}</p></div>
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Cancelled (Staff)</p><p className="text-sm font-bold">{r.cancelledByStaff}</p></div>
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Cancelled (Mgr)</p><p className="text-sm font-bold">{r.cancelledByManager}</p></div>
                </div>

                {/* themes */}
                <div>
                  <p className="font-medium mb-1">Key Themes</p>
                  <div className="flex flex-wrap gap-1">{r.themes.map((t, i) => (<Badge key={i} variant="outline" className="bg-muted/30 text-xs">{t}</Badge>))}</div>
                </div>

                {/* notes */}
                <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 33 — the registered person must ensure staff receive appropriate supervision. Minimum frequency: monthly for all care staff, fortnightly during probation. Supervision must include: safeguarding, professional development, wellbeing, and case discussion. Cancelled sessions must be rescheduled within 7 days. Supervision compliance is monitored by the Responsible Individual and inspected by Ofsted.</p>
        </div>
      </div>
    </PageShell>
  );
}