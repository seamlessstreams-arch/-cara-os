"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, ChevronDown, ChevronUp, Shield, Calendar,
  Clock, CheckCircle2, AlertTriangle, FileText, Users,
  ClipboardList, Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type RecommendationPriority = "low" | "medium" | "high";
type RecommendationStatus = "completed" | "in_progress" | "outstanding";

interface Recommendation {
  recommendation: string;
  priority: RecommendationPriority;
  rmResponse: string;
  status: RecommendationStatus;
}

interface Reg44Visit {
  id: string;
  visitDate: string;
  visitor: string;
  duration: string;
  childrenSpoken: string;
  staffSpoken: number;
  recordsReviewed: string[];
  overallJudgement: string;
  strengths: string[];
  areasForDevelopment: string[];
  recommendations: Recommendation[];
  previousActionsStatus: string;
  reportSentToOfsted: boolean;
  reportSentDate: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const fmt = (iso: string) => {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

const PRIORITY_CLR: Record<RecommendationPriority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
};

const STATUS_CLR: Record<RecommendationStatus, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  outstanding: "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  outstanding: "Outstanding",
};

const JUDGEMENT_CLR: Record<string, string> = {
  "Good — no immediate concerns.": "bg-green-100 text-green-800",
  "Good.": "bg-green-100 text-green-800",
  "Good with notable practice.": "bg-emerald-100 text-emerald-800",
  "Requires improvement in one area.": "bg-amber-100 text-amber-800",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: Reg44Visit[] = [
  {
    id: "v44_1",
    visitDate: d(-7),
    visitor: "Margaret Thompson (Independent)",
    duration: "4 hours",
    childrenSpoken: "3/3",
    staffSpoken: 4,
    recordsReviewed: ["daily logs", "medication", "incidents"],
    overallJudgement: "Good — no immediate concerns.",
    strengths: [
      "Warm, positive relationships observed between staff and young people throughout the visit",
      "Medication records are excellent — accurate, timely, and countersigned consistently",
      "All three children spoke positively about their care and relationships with key workers",
    ],
    areasForDevelopment: [
      "Sleep log completion is inconsistent — 3 gaps identified in the past month where entries were missed on night shifts",
      "One fire drill is overdue by 12 days — last drill was 14 weeks ago against a quarterly requirement",
    ],
    recommendations: [
      {
        recommendation: "Implement a nightly checklist to ensure sleep logs are completed before end of each night shift. Consider adding a prompt to the night staff handover template.",
        priority: "medium",
        rmResponse: "Accepted. Night shift checklist updated to include sleep log verification. Team briefed at handover. Will monitor compliance over next 4 weeks.",
        status: "in_progress",
      },
      {
        recommendation: "Conduct fire drill within 7 days and review the scheduling system to prevent future overruns. Evidence drill completion to the visitor.",
        priority: "high",
        rmResponse: "Fire drill completed on " + d(-5) + " (both day and evening scenarios). Calendar alerts set for 11-week intervals to provide a buffer before the quarterly deadline.",
        status: "completed",
      },
      {
        recommendation: "Consider involving young people in reviewing and updating the house rules display, which appears dated.",
        priority: "low",
        rmResponse: "Agreed — will add to next children's meeting agenda. Young people will co-design updated display.",
        status: "in_progress",
      },
    ],
    previousActionsStatus: "2 closed, 0 outstanding",
    reportSentToOfsted: true,
    reportSentDate: d(-5),
    notes: "Visitor had unrestricted access throughout. All children were relaxed and willing to speak. Staff were open and transparent.",
  },
  {
    id: "v44_2",
    visitDate: d(-37),
    visitor: "Margaret Thompson",
    duration: "3.5 hours",
    childrenSpoken: "2/3 (Casey absent — school trip)",
    staffSpoken: 3,
    recordsReviewed: ["daily logs", "supervision records", "key working sessions"],
    overallJudgement: "Good.",
    strengths: [
      "Home is clean, warm, and welcoming — presented to a high standard throughout",
      "Children's bedrooms are well-personalised reflecting their interests and identities",
      "Staff morale is notably positive — team appear well-supported and cohesive",
    ],
    areasForDevelopment: [
      "One staff supervision session was completed 3 days late — while content was thorough, the delay means it fell outside the 6-weekly frequency requirement",
    ],
    recommendations: [
      {
        recommendation: "Review supervision scheduling to build in buffer time. Consider a tracker that alerts the manager 1 week before supervision is due.",
        priority: "medium",
        rmResponse: "Cornerstone supervision tracker now set to alert 7 days before due date. Deputy to cover if RM unavailable. No supervisions will be more than 1 day late going forward.",
        status: "completed",
      },
      {
        recommendation: "Ensure Casey is spoken to at the next visit — visitor to consider scheduling an additional brief visit if Casey is unavailable again.",
        priority: "medium",
        rmResponse: "Noted. Casey's school schedule shared with visitor to support planning. Casey confirmed she is happy to speak at next visit.",
        status: "completed",
      },
    ],
    previousActionsStatus: "All previous actions closed",
    reportSentToOfsted: true,
    reportSentDate: d(-35),
    notes: "Casey was on a school residential trip — positive that the home supports these opportunities. Spoke with Casey's key worker about her progress.",
  },
  {
    id: "v44_3",
    visitDate: d(-67),
    visitor: "Margaret Thompson",
    duration: "4 hours",
    childrenSpoken: "3/3",
    staffSpoken: 4,
    recordsReviewed: ["key working records", "behaviour logs", "TCI records", "placement plans"],
    overallJudgement: "Good with notable practice.",
    strengths: [
      "Outstanding key work records — detailed, reflective, and clearly child-centred with the young person's voice evident throughout",
      "Casey's progress was explicitly noted — significant reduction in incidents and improved school attendance over the past 3 months",
      "TCI (Therapeutic Crisis Intervention) use was appropriate, proportionate, and well-documented with thorough debriefs",
    ],
    areasForDevelopment: [
      "Garden furniture (wooden bench and table) is weathered and one bench leg is split — this presents a minor trip hazard and should be replaced",
    ],
    recommendations: [
      {
        recommendation: "Replace or remove damaged garden furniture to eliminate trip hazard. Ensure replacement furniture is suitable for outdoor use year-round.",
        priority: "medium",
        rmResponse: "Damaged furniture removed immediately on day of visit. Replacement outdoor furniture ordered — weather-resistant composite material. Budget approved by RI. Expected delivery within 2 weeks.",
        status: "completed",
      },
    ],
    previousActionsStatus: "All previous actions closed",
    reportSentToOfsted: true,
    reportSentDate: d(-65),
    notes: "Visitor commended the quality of key working and therapeutic approach. Recommended the home's key work model as potential good practice example for the organisation.",
  },
  {
    id: "v44_4",
    visitDate: d(-97),
    visitor: "Margaret Thompson",
    duration: "3 hours",
    childrenSpoken: "3/3",
    staffSpoken: 3,
    recordsReviewed: ["notifications register", "staffing records", "complaints log", "activities programme"],
    overallJudgement: "Requires improvement in one area.",
    strengths: [
      "Strong, trusting relationships evident between young people and their key workers",
      "Activities programme is varied, inclusive, and reflects each child's individual interests and goals",
      "Complaint handling is thorough — young people confirmed they know how to complain and feel heard",
    ],
    areasForDevelopment: [
      "One Ofsted notification was submitted 2 days late — the notification related to a Schedule 5 event and should have been made within 24 hours without exception",
      "The staffing plan for the home is not displayed in a location accessible to staff — regulation requires the staffing plan to be available",
    ],
    recommendations: [
      {
        recommendation: "Review the notification process to identify why the delay occurred. Implement a checklist for notifiable events that includes immediate notification as step one, before any other actions.",
        priority: "high",
        rmResponse: "Root cause identified — RM was on leave and deputy was unsure of the classification. Notifiable events decision tree created and laminated for office. All senior staff briefed. Deputy completed notification training refresher.",
        status: "completed",
      },
      {
        recommendation: "Display the current staffing plan in the staff office and ensure it is updated whenever changes occur. All staff should know where to find it.",
        priority: "medium",
        rmResponse: "Staffing plan now displayed in staff office (laminated, on noticeboard). Updated version uploaded to Cornerstone. All staff informed at team meeting.",
        status: "completed",
      },
      {
        recommendation: "Consider adding notification timescales to the staff induction pack so all staff (including agency) understand the urgency requirements.",
        priority: "low",
        rmResponse: "Induction pack updated to include notification timescales and decision tree. Agency staff receive a summary card on arrival.",
        status: "completed",
      },
      {
        recommendation: "Review whether the activities programme is being consistently recorded in daily logs — two activity sessions were referenced by children but not recorded in the log.",
        priority: "low",
        rmResponse: "Acknowledged. Staff reminded to log all structured activities. Daily log template updated to include a specific activities section to prompt recording.",
        status: "completed",
      },
    ],
    previousActionsStatus: "1 outstanding from previous visit (garden furniture — subsequently addressed)",
    reportSentToOfsted: true,
    reportSentDate: d(-95),
    notes: "Visitor expressed concern about the notification delay and requested written confirmation that the process has been reviewed. This has been provided.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg44VisitorReportsPage() {
  const [data] = useState<Reg44Visit[]>(SEED);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((r) =>
      r.visitor.toLowerCase().includes(q) ||
      r.overallJudgement.toLowerCase().includes(q) ||
      r.strengths.some((s) => s.toLowerCase().includes(q)) ||
      r.areasForDevelopment.some((a) => a.toLowerCase().includes(q)) ||
      r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes(q))
    );
  }, [data, search]);

  /* summary stats */
  const visitsCompleted = data.length;
  const outstandingRecommendations = data.reduce(
    (sum, v) => sum + v.recommendations.filter((r) => r.status === "outstanding" || r.status === "in_progress").length,
    0
  );
  const avgInterval = useMemo(() => {
    if (data.length < 2) return 0;
    const sorted = [...data].sort((a, b) => a.visitDate.localeCompare(b.visitDate));
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].visitDate).getTime();
      const curr = new Date(sorted[i].visitDate).getTime();
      totalDays += (curr - prev) / (1000 * 60 * 60 * 24);
    }
    return Math.round(totalDays / (sorted.length - 1));
  }, [data]);

  const exportCols: ExportColumn<Reg44Visit>[] = [
    { header: "Visit Date", accessor: (r: Reg44Visit) => r.visitDate },
    { header: "Visitor", accessor: (r: Reg44Visit) => r.visitor },
    { header: "Duration", accessor: (r: Reg44Visit) => r.duration },
    { header: "Children Spoken To", accessor: (r: Reg44Visit) => r.childrenSpoken },
    { header: "Staff Spoken To", accessor: (r: Reg44Visit) => String(r.staffSpoken) },
    { header: "Records Reviewed", accessor: (r: Reg44Visit) => r.recordsReviewed.join(", ") },
    { header: "Overall Judgement", accessor: (r: Reg44Visit) => r.overallJudgement },
    { header: "Strengths", accessor: (r: Reg44Visit) => r.strengths.join("; ") },
    { header: "Areas for Development", accessor: (r: Reg44Visit) => r.areasForDevelopment.join("; ") },
    { header: "Recommendations", accessor: (r: Reg44Visit) => r.recommendations.map((rec) => rec.recommendation).join("; ") },
    { header: "Previous Actions", accessor: (r: Reg44Visit) => r.previousActionsStatus },
    { header: "Sent to Ofsted", accessor: (r: Reg44Visit) => r.reportSentToOfsted ? "Yes" : "No" },
    { header: "Sent Date", accessor: (r: Reg44Visit) => r.reportSentDate },
    { header: "Notes", accessor: (r: Reg44Visit) => r.notes },
  ];

  return (
    <PageShell
      title="Reg 44 Visitor Reports"
      subtitle="Independent Person monthly visit reports — Children's Homes Regulations 2015, Reg 44"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Reg 44 Visitor Reports" />
          <ExportButton data={filtered} columns={exportCols} filename="reg44-visitor-reports" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Visits Completed (12 months)", value: visitsCompleted, icon: Calendar, clr: "text-blue-600" },
            { label: "Outstanding Recommendations", value: outstandingRecommendations, icon: AlertTriangle, clr: outstandingRecommendations > 0 ? "text-amber-600" : "text-green-600" },
            { label: "Avg. Interval (days)", value: `${avgInterval}`, icon: Clock, clr: avgInterval > 35 ? "text-red-600" : "text-green-600" },
            { label: "Reports Sent to Ofsted", value: data.filter((v) => v.reportSentToOfsted).length + "/" + data.length, icon: FileText, clr: "text-indigo-600" },
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

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports, findings, recommendations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} visit report{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* ── Visit cards ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No reports match your search</p>
            </div>
          )}

          {filtered.map((visit) => {
            const isOpen = expandedId === visit.id;
            const judgementClr = JUDGEMENT_CLR[visit.overallJudgement] || "bg-gray-100 text-gray-800";
            const hasOutstanding = visit.recommendations.some((r) => r.status === "outstanding" || r.status === "in_progress");

            return (
              <Card key={visit.id} className={cn("border-l-4", hasOutstanding ? "border-l-amber-400" : "border-l-green-400")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(visit.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {fmt(visit.visitDate)}
                        <Badge variant="outline" className={judgementClr}>
                          {visit.overallJudgement}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {visit.visitor} · {visit.duration} · Children: {visit.childrenSpoken} · Staff: {visit.staffSpoken}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Records reviewed */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> Records Reviewed
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {visit.recordsReviewed.map((rec) => (
                          <Badge key={rec} variant="outline" className="text-xs bg-slate-50">
                            {rec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-green-800 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Strengths Identified
                      </p>
                      <ul className="space-y-1">
                        {visit.strengths.map((s, i) => (
                          <li key={i} className="text-green-700 text-xs flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for development */}
                    {visit.areasForDevelopment.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Areas for Development
                        </p>
                        <ul className="space-y-1">
                          {visit.areasForDevelopment.map((a, i) => (
                            <li key={i} className="text-amber-700 text-xs flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {visit.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium mb-2 flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> Recommendations ({visit.recommendations.length})
                        </p>
                        <div className="space-y-2">
                          {visit.recommendations.map((rec, i) => (
                            <div key={i} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-xs font-medium flex-1">{rec.recommendation}</p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge variant="outline" className={cn("text-xs", PRIORITY_CLR[rec.priority])}>
                                    {rec.priority}
                                  </Badge>
                                  <Badge variant="outline" className={cn("text-xs", STATUS_CLR[rec.status])}>
                                    {STATUS_LABEL[rec.status]}
                                  </Badge>
                                </div>
                              </div>
                              <div className="bg-indigo-50 rounded p-2 mt-1">
                                <p className="text-xs text-indigo-800">
                                  <span className="font-medium">RM Response:</span> {rec.rmResponse}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Previous actions & Ofsted */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Previous Actions</p>
                        <p className="text-xs">{visit.previousActionsStatus}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Sent to Ofsted</p>
                        <p className="text-xs flex items-center gap-1">
                          {visit.reportSentToOfsted ? (
                            <><CheckCircle2 className="h-3 w-3 text-green-600" /> Yes — {fmt(visit.reportSentDate)}</>
                          ) : (
                            <><AlertTriangle className="h-3 w-3 text-amber-600" /> Not yet sent</>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Children Spoken To</p>
                        <p className="text-xs flex items-center gap-1">
                          <Users className="h-3 w-3" /> {visit.childrenSpoken}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {visit.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Visitor Notes</p>
                        <p className="text-xs text-muted-foreground">{visit.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────── */}
        <div className="rounded-lg border border-dashed p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold">Regulatory Context — Regulation 44</p>
              <p>
                <strong>Regulation 44</strong> of the Children&apos;s Homes (England) Regulations 2015 requires that an
                independent person visits the home at least once per month, interviews children (with their consent) and
                staff, inspects records and the physical environment, and produces a written report for the registered
                provider. The visitor must be independent of the home&apos;s management and have no financial interest in
                the home&apos;s operation. Reports must be sent to Ofsted, the placing authority, and any other persons
                specified by the Secretary of State. Ofsted relies on these reports as a key source of intelligence between
                inspections. The Responsible Individual must ensure recommendations are actioned and progress is monitored
                as part of their Regulation 45 oversight duties. Persistent failure to conduct visits or respond to
                recommendations may result in enforcement action.
              </p>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
