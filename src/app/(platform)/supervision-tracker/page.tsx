"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertTriangle, CheckCircle2, Clock, Users, Calendar, Loader2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { useSupervisionTrackerRecords, useCreateSupervisionTrackerRecord } from "@/hooks/use-supervision-tracker-records";
import type { SupervisionTrackerRecord, SupervisionTrackerComplianceStatus } from "@/types/extended";
import { SUPERVISION_TRACKER_COMPLIANCE_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { toast } from "sonner";

/* ── local config ─────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<SupervisionTrackerComplianceStatus, string> = {
  compliant: "bg-green-100 text-green-800",
  due_soon: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  significantly_overdue: "bg-red-200 text-red-900",
};

const BORDER_ST: Record<SupervisionTrackerComplianceStatus, string> = {
  compliant: "border-l-green-400",
  due_soon: "border-l-amber-400",
  overdue: "border-l-red-500",
  significantly_overdue: "border-l-red-700",
};

function getStatus(nextDue: string): SupervisionTrackerComplianceStatus {
  const today = new Date();
  const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };
  const todayStr = d(0);
  const sevenDays = d(7);
  const thirtyDaysAgo = d(-30);
  if (nextDue < thirtyDaysAgo) return "significantly_overdue";
  if (nextDue < todayStr) return "overdue";
  if (nextDue <= sevenDays) return "due_soon";
  return "compliant";
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const THEME_OPTIONS = [
  "Safeguarding", "Wellbeing", "Professional development", "Case management",
  "Workload management", "Boundaries", "Team dynamics", "Medication", "Risk management",
];

export default function SupervisionTrackerPage() {
  const { data: records = [], isLoading } = useSupervisionTrackerRecords();
  const createRecord = useCreateSupervisionTrackerRecord();

  // ── "Log session" dialog state ──────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [lastDate, setLastDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState("Monthly");
  const [sessionsYear, setSessionsYear] = useState(1);
  const [sessionsExpected, setSessionsExpected] = useState(12);
  const [notes, setNotes] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  function toggleTheme(t: string) {
    setSelectedThemes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function nextDueFromLast(last: string, freq: string): string {
    const d = new Date(last);
    if (freq === "Fortnightly") d.setDate(d.getDate() + 14);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  async function handleCreate() {
    if (!staffId || !supervisorId || !lastDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createRecord.mutateAsync({
        staff_id: staffId,
        supervisor_id: supervisorId,
        last_supervision_date: lastDate,
        next_due_date: nextDueFromLast(lastDate, frequency),
        frequency,
        sessions_this_year: sessionsYear,
        sessions_expected_this_year: sessionsExpected,
        cancelled_by_staff: 0,
        cancelled_by_manager: 0,
        themes: selectedThemes,
        actions_pending: 0,
        notes,
      });
      toast.success("Supervision session logged.");
      setShowNew(false);
      setStaffId(""); setSupervisorId(""); setNotes(""); setSelectedThemes([]);
    } catch {
      toast.error("Failed to log session. Please try again.");
    }
  }

  const withCompliance = useMemo(() => {
    return records.map((r) => ({ ...r, compliance: getStatus(r.next_due_date) }));
  }, [records]);

  const compliant = withCompliance.filter((r) => r.compliance === "compliant").length;
  const dueSoon = withCompliance.filter((r) => r.compliance === "due_soon").length;
  const overdue = withCompliance.filter((r) => r.compliance === "overdue" || r.compliance === "significantly_overdue").length;
  const totalSessions = records.reduce((sum, r) => sum + r.sessions_this_year, 0);
  const totalExpected = records.reduce((sum, r) => sum + r.sessions_expected_this_year, 0);
  const overallRate = totalExpected > 0 ? Math.round((totalSessions / totalExpected) * 100) : 0;

  const exportCols: ExportColumn<SupervisionTrackerRecord>[] = [
    { header: "Staff", accessor: (r: SupervisionTrackerRecord) => getStaffName(r.staff_id) },
    { header: "Supervisor", accessor: (r: SupervisionTrackerRecord) => getStaffName(r.supervisor_id) },
    { header: "Frequency", accessor: (r: SupervisionTrackerRecord) => r.frequency },
    { header: "Last Session", accessor: (r: SupervisionTrackerRecord) => r.last_supervision_date },
    { header: "Next Due", accessor: (r: SupervisionTrackerRecord) => r.next_due_date },
    { header: "Sessions (Year)", accessor: (r: SupervisionTrackerRecord) => `${r.sessions_this_year} / ${r.sessions_expected_this_year}` },
    { header: "Actions Pending", accessor: (r: SupervisionTrackerRecord) => String(r.actions_pending) },
    { header: "Themes", accessor: (r: SupervisionTrackerRecord) => r.themes.join(", ") },
  ];

  if (isLoading) {
    return (
      <PageShell title="Supervision Compliance Tracker" subtitle="Reg 33 · Staff Supervision · Workforce Development">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Supervision Compliance Tracker" subtitle="Reg 33 · Staff Supervision · Workforce Development" 
      ariaContext={{ pageTitle: "Supervision Compliance Tracker", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Supervision Tracker" />
          <ExportButton data={records} columns={exportCols} filename="supervision-tracker" />
          <AriaStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Session
          </Button>
        </div>
      }>
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
          {withCompliance.map((r) => (
            <Card key={r.id} className={cn("border-l-4", BORDER_ST[r.compliance])}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStaffName(r.staff_id)}
                      <Badge variant="outline" className={STATUS_CLR[r.compliance]}>{SUPERVISION_TRACKER_COMPLIANCE_STATUS_LABEL[r.compliance]}</Badge>
                      {r.actions_pending > 0 && <Badge variant="outline" className="bg-amber-50">{r.actions_pending} action(s)</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Supervisor: {getStaffName(r.supervisor_id)} · {r.frequency} · Last: {r.last_supervision_date} · Next: {r.next_due_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{r.sessions_this_year}/{r.sessions_expected_this_year}</p>
                    <p className="text-xs text-muted-foreground">sessions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3 text-sm">
                {/* session stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Completed</p><p className="text-sm font-bold">{r.sessions_this_year}</p></div>
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Expected</p><p className="text-sm font-bold">{r.sessions_expected_this_year}</p></div>
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Cancelled (Staff)</p><p className="text-sm font-bold">{r.cancelled_by_staff}</p></div>
                  <div className="bg-muted/40 rounded p-2 text-center"><p className="font-medium text-xs">Cancelled (Mgr)</p><p className="text-sm font-bold">{r.cancelled_by_manager}</p></div>
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

        <div className="mt-4 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 33 — the registered person must ensure staff receive appropriate supervision. Minimum frequency: monthly for all care staff, fortnightly during probation. Supervision must include: safeguarding, professional development, wellbeing, and case discussion. Cancelled sessions must be rescheduled within 7 days. Supervision compliance is monitored by the Responsible Individual and inspected by Ofsted.</p>
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Supervision Compliance Tracker — Regulation 33, staff supervision records, overdue supervision, themes, compliance monitoring"
        recordType="supervision"
        userRole="registered_manager"
        className="mt-6"
      />
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />

      {/* ── Log Session Dialog ──────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Supervision Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Staff Member *</Label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Select staff…</option>
                  {STAFF.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Supervisor *</Label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Select supervisor…</option>
                  {STAFF.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Session Date *</Label>
                <Input type="date" value={lastDate} onChange={(e) => setLastDate(e.target.value)} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Frequency</Label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white"
                >
                  <option>Monthly</option>
                  <option>Fortnightly</option>
                  <option>Weekly</option>
                  <option>Quarterly</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sessions This Year</Label>
                <Input type="number" min={0} value={sessionsYear} onChange={(e) => setSessionsYear(Number(e.target.value))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Sessions Expected This Year</Label>
                <Input type="number" min={1} value={sessionsExpected} onChange={(e) => setSessionsExpected(Number(e.target.value))} className="mt-1 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Key Themes Discussed</Label>
              <div className="flex flex-wrap gap-1.5">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTheme(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs border transition-colors",
                      selectedThemes.includes(t)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Session Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key discussion points, actions agreed, any concerns raised…"
                className="mt-1 text-sm min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createRecord.isPending}>
              {createRecord.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Log Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
