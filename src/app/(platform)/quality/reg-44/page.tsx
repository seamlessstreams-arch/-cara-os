"use client";

import { useState, useMemo, useEffect } from "react";
import { useReg44Visits, useCreateReg44Visit } from "@/hooks/use-intelligence-layer";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Shield,
  Clock,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Reg44Visit,
  Reg44Action,
  Reg44ReportStatus,
  Reg44ActionStatus,
  Reg44ActionPriority,
} from "@/types/intelligence.layer";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const fmt = (iso: string) => {
  const dt = new Date(iso + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const monthLabel = (iso: string) => {
  const dt = new Date(iso + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
};

function daysOverdue(dueDate: string): number {
  const today = new Date(d(0));
  const due = new Date(dueDate);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/* ── status maps ───────────────────────────────────────────────────────────── */

const REPORT_STATUS_CLR: Record<Reg44ReportStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-800",
  reviewed: "bg-green-100 text-green-800",
  closed: "bg-purple-100 text-purple-800",
};

const ACTION_STATUS_CLR: Record<Reg44ActionStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-600",
};

const ACTION_STATUS_LABEL: Record<Reg44ActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const PRIORITY_CLR: Record<Reg44ActionPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-800",
  urgent: "bg-red-100 text-red-800",
};

/* ── demo data ─────────────────────────────────────────────────────────────── */

const DEMO_VISITS: Reg44Visit[] = [
  {
    id: "v1",
    homeId: "home_oak",
    visitDate: d(-12),
    visitorName: "Margaret Thornton",
    reportStatus: "submitted",
    summary:
      "Monthly unannounced visit conducted. Spoke with three young people and two members of staff. Reviewed daily logs, medication records, and the complaints register. The home presents as warm, personalised, and well-maintained. Young people appeared relaxed and engaged positively with staff.",
    strengths:
      "Excellent key-work sessions observed with detailed records. Young people spoke positively about recent activities including a camping trip. Medication administration records are thorough and up to date. Staff morale appeared high with good teamwork evident during the visit.",
    concerns:
      "One fire drill was missed in the previous month due to a staffing issue. The privacy lock on Bedroom 3 was reported as faulty by the young person. Wi-Fi filtering records had not been reviewed since last month.",
    childrenViewsSummary:
      "All three young people said they feel safe. One young person asked for more variety in evening meals. Another praised the new games room setup. The youngest child shared they enjoy their key-work sessions and feel listened to.",
    staffViewsSummary:
      "Staff reported feeling well-supported by the Registered Manager. One staff member raised a concern about the night-shift handover process being too brief. The deputy highlighted positive progress with a complex placement.",
    managerResponse: undefined,
    riResponse: undefined,
    createdBy: "system",
    createdAt: d(-12),
    updatedAt: d(-12),
  },
  {
    id: "v2",
    homeId: "home_oak",
    visitDate: d(-45),
    visitorName: "Margaret Thornton",
    reportStatus: "reviewed",
    summary:
      "Scheduled visit. Reviewed safeguarding records, supervision logs, and the Statement of Purpose. Met with all young people individually. The home continues to operate to a high standard with strong management oversight.",
    strengths:
      "Supervision records are fully up to date for all staff. The home has implemented a new voice-of-the-child feedback system that young people are engaging with well. Risk assessments have been reviewed following recent incidents and are comprehensive.",
    concerns:
      "Minor maintenance issue with the garden fence panel. One young person expressed frustration about contact arrangements with their social worker. Staff training matrix shows one member is overdue for PRICE refresher.",
    childrenViewsSummary:
      "Young people feel settled. Two expressed interest in having a say in menu planning. One young person was pleased their room had been redecorated.",
    staffViewsSummary:
      "Staff felt well-prepared for the recent Ofsted monitoring visit. The team requested additional training on online safety given emerging concerns across the sector.",
    managerResponse:
      "Thank you for the thorough visit. The fence panel has been repaired. I have escalated the contact concern to the placing authority. The overdue PRICE training is booked for next week.",
    riResponse:
      "Pleased with the overall quality of care. The manager response addresses all concerns appropriately. I note the proactive approach to online safety training. I will follow up on the contact issue at the next RI visit.",
    createdBy: "system",
    createdAt: d(-45),
    updatedAt: d(-30),
  },
  {
    id: "v3",
    homeId: "home_oak",
    visitDate: d(-75),
    visitorName: "David Henshaw",
    reportStatus: "closed",
    summary:
      "Unannounced visit during evening hours. Observed bedtime routines and evening activities. Reviewed incident logs and restraint records from the previous month.",
    strengths:
      "Bedtime routines were calm and well-structured. Staff used excellent de-escalation skills during a minor disagreement between two young people. Evening activities were age-appropriate and enjoyed by all.",
    concerns:
      "One restraint record lacked the required debrief notes from the young person. The kitchen deep-clean schedule was one week behind.",
    childrenViewsSummary:
      "Young people were relaxed during the visit. One child said evening routines were better since the new rota was introduced. Another asked if they could have later bedtimes at weekends.",
    staffViewsSummary:
      "Night staff felt the handover had improved following the manager implementing a structured template. One member asked about career progression opportunities.",
    managerResponse:
      "The restraint debrief has now been completed retrospectively. Kitchen deep-clean has been brought up to date. I have reviewed the weekend bedtime request and will discuss with the team.",
    riResponse:
      "All actions addressed promptly. Satisfied with the response to the restraint concern. Will monitor kitchen compliance at next visit.",
    createdBy: "system",
    createdAt: d(-75),
    updatedAt: d(-60),
  },
  {
    id: "v4",
    homeId: "home_oak",
    visitDate: d(-135),
    visitorName: "Margaret Thornton",
    reportStatus: "closed",
    summary:
      "Quarterly themed visit focusing on education and health outcomes. Reviewed PEPs, health assessments, and SDQ scores. Met with the designated education lead and health coordinator.",
    strengths:
      "All PEPs are up to date. School attendance is above 90% for all young people. Health assessments completed within timescales. One young person achieved a significant academic milestone.",
    concerns:
      "No concerns identified during this visit.",
    childrenViewsSummary:
      "Young people spoke positively about educational support. One child was proud of their recent school award.",
    staffViewsSummary:
      "Staff appreciated the themed approach. The education lead felt the home prioritises education well.",
    managerResponse:
      "Pleased with the positive findings. We will continue to prioritise educational attainment and health outcomes.",
    riResponse: undefined,
    createdBy: "system",
    createdAt: d(-135),
    updatedAt: d(-120),
  },
];

const DEMO_ACTIONS: Reg44Action[] = [
  {
    id: "a1",
    visitId: "v1",
    homeId: "home_oak",
    title: "Conduct missed fire drill",
    description:
      "A fire drill was missed in the previous month. Arrange and complete a fire drill within 7 days, ensuring all young people and staff participate. Record outcomes and any issues identified.",
    priority: "high",
    assignedTo: "Darren Laville (RM)",
    dueDate: d(-5),
    status: "overdue",
    managerResponse: undefined,
    completedAt: undefined,
    evidenceItemId: undefined,
    createdBy: "system",
    createdAt: d(-12),
    updatedAt: d(-12),
  },
  {
    id: "a2",
    visitId: "v1",
    homeId: "home_oak",
    title: "Repair privacy lock on Bedroom 3",
    description:
      "The privacy lock on Bedroom 3 has been reported as faulty by the young person. Arrange for repair or replacement to ensure the young person's right to privacy is upheld.",
    priority: "medium",
    assignedTo: "Darren Laville (RM)",
    dueDate: d(2),
    status: "in_progress",
    managerResponse: "Maintenance contractor booked for this week.",
    completedAt: undefined,
    evidenceItemId: undefined,
    createdBy: "system",
    createdAt: d(-12),
    updatedAt: d(-5),
  },
  {
    id: "a3",
    visitId: "v1",
    homeId: "home_oak",
    title: "Review Wi-Fi filtering records",
    description:
      "Wi-Fi filtering records have not been reviewed since last month. Review and update the filtering logs, ensuring all content restrictions are appropriate and documented.",
    priority: "medium",
    assignedTo: "Ryan Mitchell (Deputy)",
    dueDate: d(5),
    status: "open",
    managerResponse: undefined,
    completedAt: undefined,
    evidenceItemId: undefined,
    createdBy: "system",
    createdAt: d(-12),
    updatedAt: d(-12),
  },
  {
    id: "a4",
    visitId: "v2",
    homeId: "home_oak",
    title: "Repair garden fence panel",
    description: "Minor maintenance issue with the garden fence panel identified during visit. Repair or replace to maintain secure boundary.",
    priority: "low",
    assignedTo: "Darren Laville (RM)",
    dueDate: d(-30),
    status: "completed",
    managerResponse: "Fence panel repaired by contractor on the day following the visit.",
    completedAt: d(-40),
    evidenceItemId: undefined,
    createdBy: "system",
    createdAt: d(-45),
    updatedAt: d(-40),
  },
  {
    id: "a5",
    visitId: "v2",
    homeId: "home_oak",
    title: "Book PRICE refresher training",
    description:
      "One staff member is overdue for PRICE refresher training. Book onto the next available course and confirm date.",
    priority: "high",
    assignedTo: "Darren Laville (RM)",
    dueDate: d(-25),
    status: "completed",
    managerResponse: "Training booked and completed on target date.",
    completedAt: d(-28),
    evidenceItemId: undefined,
    createdBy: "system",
    createdAt: d(-45),
    updatedAt: d(-28),
  },
  {
    id: "a6",
    visitId: "v3",
    homeId: "home_oak",
    title: "Complete retrospective restraint debrief",
    description:
      "One restraint record lacked the required debrief notes from the young person. Complete the debrief and update the restraint record.",
    priority: "urgent",
    assignedTo: "Darren Laville (RM)",
    dueDate: d(-70),
    status: "completed",
    managerResponse: "Debrief completed with the young person. Record updated with their views and feelings about the incident.",
    completedAt: d(-72),
    evidenceItemId: undefined,
    createdBy: "system",
    createdAt: d(-75),
    updatedAt: d(-72),
  },
];

/* ── monthly visit timeline ────────────────────────────────────────────────── */

function buildMonthTimeline(visits: Reg44Visit[]) {
  const months: { key: string; label: string; hasVisit: boolean; visitDate?: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = dt.toISOString().slice(0, 7);
    const label = dt.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const match = visits.find((v) => v.visitDate.slice(0, 7) === key);
    months.push({ key, label, hasVisit: !!match, visitDate: match?.visitDate });
  }
  return months;
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg44Page() {
  const [visits, setVisits] = useState<Reg44Visit[]>(DEMO_VISITS);
  const [actions, setActions] = useState<Reg44Action[]>(DEMO_ACTIONS);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useReg44Visits();
  const createVisit = useCreateReg44Visit();

  useEffect(() => {
    if (apiData?.persisted && apiData.visits.length > 0) {
      setVisits((apiData.visits as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        homeId: row.home_id as string,
        visitDate: row.visit_date as string,
        visitorName: row.visitor_name as string,
        reportStatus: row.status as Reg44ReportStatus,
        summary: (row.findings as string) ?? undefined,
        strengths: undefined,
        concerns: undefined,
        childrenViewsSummary: undefined,
        staffViewsSummary: undefined,
        managerResponse: undefined,
        riResponse: undefined,
        createdBy: (row.created_by as string) ?? undefined,
        createdAt: row.created_at as string,
        updatedAt: row.created_at as string,
      })));
    }
  }, [apiData]);
  const [tab, setTab] = useState("visits");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const timeline = useMemo(() => buildMonthTimeline(visits), [visits]);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthHasVisit = visits.some((v) => v.visitDate.slice(0, 7) === currentMonthKey);

  /* action counts */
  const openActions = actions.filter((a) => a.status === "open" || a.status === "in_progress").length;
  const overdueActions = actions.filter((a) => a.status === "overdue").length;
  const completedActions = actions.filter((a) => a.status === "completed").length;

  /* filtered actions */
  const filteredActions = useMemo(() => {
    if (actionFilter === "all") return actions;
    return actions.filter((a) => a.status === actionFilter);
  }, [actions, actionFilter]);

  function actionsForVisit(visitId: string) {
    return actions.filter((a) => a.visitId === visitId);
  }

  return (
    <PageShell
      title="Regulation 44 — Independent Visits"
      subtitle="Quality Assurance  ·  Monthly Independent Visitor Reports & Actions"
      ariaContext={{ pageTitle: "Regulation 44 Reports", sourceType: "reg45" }}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Action
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={createVisit.isPending}
            onClick={() => createVisit.mutate({
              homeId: "oak-house",
              visitDate: new Date().toISOString().split("T")[0],
              visitorName: "Independent Visitor",
              visitType: "announced",
            })}
          >
            <Plus className="h-3.5 w-3.5" />
            {createVisit.isPending ? "Creating..." : "Add Visit"}
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── missing visit alert ──────────────────────────────────────────── */}
      {!currentMonthHasVisit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">
              No Regulation 44 visit recorded for {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>
            <p className="text-red-700">
              Regulation 44 requires an independent person to visit the home at least once per month. Schedule or record this month&apos;s visit as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* ── summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Visits", value: visits.length, icon: Calendar, clr: "text-blue-600" },
          { label: "Open Actions", value: openActions, icon: CircleDot, clr: "text-amber-600" },
          { label: "Overdue Actions", value: overdueActions, icon: AlertTriangle, clr: "text-red-600" },
          { label: "Completed Actions", value: completedActions, icon: CheckCircle2, clr: "text-green-600" },
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

      {/* ── month timeline ───────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            Monthly Visit Tracker — Last 12 Months
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {timeline.map((m) => (
              <div
                key={m.key}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border p-2 text-center",
                  m.hasVisit
                    ? "border-green-200 bg-green-50"
                    : m.key === currentMonthKey
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200 bg-slate-50",
                )}
              >
                <p className="text-[11px] font-medium text-slate-600 mb-1">{m.label}</p>
                {m.hasVisit ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className={cn("h-5 w-5", m.key === currentMonthKey ? "text-red-500" : "text-slate-300")} />
                )}
                {m.visitDate && (
                  <p className="text-[10px] text-green-700 mt-0.5">{fmt(m.visitDate).split(" ").slice(0, 2).join(" ")}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── tabs ─────────────────────────────────────────────────────────── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="visits" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Visits ({visits.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Actions ({actions.length})
          </TabsTrigger>
        </TabsList>

        {/* ── VISITS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="visits">
          {visits.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No visits recorded"
              description="Record the first Regulation 44 independent visit for this home."
              actions={[{ label: "Add Visit", icon: Plus }]}
            />
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => {
                const isExpanded = expandedVisit === visit.id;
                const visitActions = actionsForVisit(visit.id);

                return (
                  <Card key={visit.id} className="border-l-4 border-l-blue-400">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            {fmt(visit.visitDate)}
                            <Badge variant="outline" className={REPORT_STATUS_CLR[visit.reportStatus]}>
                              {visit.reportStatus.charAt(0).toUpperCase() + visit.reportStatus.slice(1)}
                            </Badge>
                            {visitActions.length > 0 && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800">
                                {visitActions.length} action{visitActions.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {visit.visitorName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                          className="shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 text-sm space-y-3">
                      {/* summary always visible */}
                      {visit.summary && (
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Summary</p>
                          <p className="text-muted-foreground text-xs leading-relaxed">{visit.summary}</p>
                        </div>
                      )}

                      {/* expanded detail */}
                      {isExpanded && (
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          {/* strengths */}
                          {visit.strengths && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="font-medium text-green-800 text-xs mb-1 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Strengths
                              </p>
                              <p className="text-green-700 text-xs leading-relaxed">{visit.strengths}</p>
                            </div>
                          )}

                          {/* concerns */}
                          {visit.concerns && (
                            <div className="bg-amber-50 rounded-lg p-3">
                              <p className="font-medium text-amber-800 text-xs mb-1 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Concerns
                              </p>
                              <p className="text-amber-700 text-xs leading-relaxed">{visit.concerns}</p>
                            </div>
                          )}

                          {/* children's views */}
                          {visit.childrenViewsSummary && (
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="font-medium text-blue-800 text-xs mb-1 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Children&apos;s Views
                              </p>
                              <p className="text-blue-700 text-xs leading-relaxed">{visit.childrenViewsSummary}</p>
                            </div>
                          )}

                          {/* staff views */}
                          {visit.staffViewsSummary && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="font-medium text-purple-800 text-xs mb-1 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                Staff Views
                              </p>
                              <p className="text-purple-700 text-xs leading-relaxed">{visit.staffViewsSummary}</p>
                            </div>
                          )}

                          {/* manager response */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium text-slate-700 text-xs mb-1 flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5" />
                              Manager Response
                            </p>
                            {visit.managerResponse ? (
                              <p className="text-slate-600 text-xs leading-relaxed">{visit.managerResponse}</p>
                            ) : (
                              <Button variant="outline" size="sm" className="mt-1 text-xs gap-1.5">
                                <Plus className="h-3 w-3" />
                                Add Manager Response
                              </Button>
                            )}
                          </div>

                          {/* RI response */}
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="font-medium text-slate-700 text-xs mb-1 flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5" />
                              Responsible Individual Response
                            </p>
                            {visit.riResponse ? (
                              <p className="text-slate-600 text-xs leading-relaxed">{visit.riResponse}</p>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No RI response recorded.</p>
                            )}
                          </div>

                          {/* Smart Links */}
                          <SmartLinkPanel
                            sourceType="reg44_visit"
                            sourceId={visit.id}
                            homeId="oak-house"
                          />

                          {/* actions for this visit */}
                          {visitActions.length > 0 && (
                            <div>
                              <p className="font-medium text-slate-700 text-xs mb-2 flex items-center gap-1.5">
                                <ClipboardList className="h-3.5 w-3.5" />
                                Actions from this Visit ({visitActions.length})
                              </p>
                              <div className="space-y-2">
                                {visitActions.map((action) => (
                                  <div
                                    key={action.id}
                                    className={cn(
                                      "rounded-lg border p-3 text-xs",
                                      action.status === "overdue" ? "border-red-200 bg-red-50/50" : "border-slate-200",
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="font-medium text-slate-800">{action.title}</p>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <Badge variant="outline" className={cn("text-[10px]", PRIORITY_CLR[action.priority])}>
                                          {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                                        </Badge>
                                        <Badge variant="outline" className={cn("text-[10px]", ACTION_STATUS_CLR[action.status])}>
                                          {ACTION_STATUS_LABEL[action.status]}
                                        </Badge>
                                      </div>
                                    </div>
                                    {action.assignedTo && (
                                      <p className="text-muted-foreground mt-1">Assigned to: {action.assignedTo}</p>
                                    )}
                                    {action.dueDate && (
                                      <p className={cn(
                                        "mt-0.5",
                                        action.status === "overdue" ? "text-red-600 font-medium" : "text-muted-foreground",
                                      )}>
                                        Due: {fmt(action.dueDate)}
                                        {action.status === "overdue" && ` (${daysOverdue(action.dueDate)} days overdue)`}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── ACTIONS TAB ────────────────────────────────────────────────── */}
        <TabsContent value="actions">
          {/* filter bar */}
          <div className="flex items-center gap-3 mb-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {filteredActions.length} action{filteredActions.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredActions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No actions found"
              description="No actions match the current filter. Try changing the status filter above."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-2 font-medium text-slate-600 text-xs">Title</th>
                    <th className="pb-2 font-medium text-slate-600 text-xs">Priority</th>
                    <th className="pb-2 font-medium text-slate-600 text-xs">Assigned To</th>
                    <th className="pb-2 font-medium text-slate-600 text-xs">Due Date</th>
                    <th className="pb-2 font-medium text-slate-600 text-xs">Status</th>
                    <th className="pb-2 font-medium text-slate-600 text-xs">Manager Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActions.map((action) => {
                    const overdueDays = daysOverdue(action.dueDate ?? "");
                    const isOverdue = action.status === "overdue";

                    return (
                      <tr
                        key={action.id}
                        className={cn(
                          "text-xs",
                          isOverdue && overdueDays > 14
                            ? "bg-red-50"
                            : isOverdue
                              ? "bg-amber-50"
                              : "",
                        )}
                      >
                        <td className="py-3 pr-3">
                          <p className="font-medium text-slate-800">{action.title}</p>
                          {action.description && (
                            <p className="text-muted-foreground mt-0.5 max-w-xs truncate">{action.description}</p>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant="outline" className={cn("text-[10px]", PRIORITY_CLR[action.priority])}>
                            {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">{action.assignedTo ?? "Unassigned"}</td>
                        <td className="py-3 pr-3">
                          <span className={cn(isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                            {action.dueDate ? fmt(action.dueDate) : "No date"}
                          </span>
                          {isOverdue && overdueDays > 0 && (
                            <span className="block text-red-500 text-[10px] font-medium">
                              {overdueDays} day{overdueDays !== 1 ? "s" : ""} overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <Badge variant="outline" className={cn("text-[10px]", ACTION_STATUS_CLR[action.status])}>
                            {ACTION_STATUS_LABEL[action.status]}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {action.managerResponse ? (
                            <p className="text-muted-foreground max-w-xs truncate">{action.managerResponse}</p>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 gap-1">
                              <Plus className="h-3 w-3" />
                              Add Response
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── regulatory footer ──────────────────────────────────────────── */}
      <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Regulatory Framework</p>
        <p>
          The Children&apos;s Homes (England) Regulations 2015, Regulation 44 requires that an independent person visits
          the home at least once per calendar month, speaks with children and staff, inspects records and the premises,
          and prepares a written report. Reports must be provided to Ofsted, the placing authority, and the Responsible
          Individual. The RI must ensure any actions arising are addressed promptly and documented.
        </p>
      </div>      <AriaPanel
        mode="assist"
        pageContext="Regulation 44 Reports — independent visitor reports, monthly visits, children's views, staff interviews, premises inspection, action plans, RI responses, statutory compliance, Ofsted evidence"
        recordType="reg45"
        className="mt-6"
      />    </PageShell>
  );
}
