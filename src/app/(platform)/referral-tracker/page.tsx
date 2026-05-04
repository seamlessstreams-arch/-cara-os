"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowUpDown,
  Search,
  FileText,
  CalendarCheck,
  AlertTriangle,
  Users,
  Percent,
  Timer,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── helpers ──────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ─────────────────────────────────────────────────────────────── */

type ReferralStatus =
  | "received"
  | "screening"
  | "under_assessment"
  | "matching_panel"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "waitlisted";

interface TimelineEvent {
  date: string;
  event: string;
  by: string;
}

interface Referral {
  id: string;
  childRef: string;
  age: number;
  gender: string;
  referringAuthority: string;
  socialWorkerName: string;
  referralDate: string;
  status: ReferralStatus;
  reasonForPlacement: string;
  referralDocumentsReceived: boolean;
  impactAssessmentCompleted: boolean;
  matchingPanelDate: string | null;
  matchingPanelOutcome: string | null;
  decisionDate: string | null;
  admissionDate: string | null;
  declineReason: string | null;
  notes: string;
  timeline: TimelineEvent[];
}

/* ── status config ────────────────────────────────────────────────────── */

const STATUS_META: Record<ReferralStatus, { label: string; colour: string }> = {
  received:         { label: "Received",         colour: "bg-gray-100 text-gray-700" },
  screening:        { label: "Screening",        colour: "bg-blue-100 text-blue-700" },
  under_assessment: { label: "Under Assessment", colour: "bg-purple-100 text-purple-700" },
  matching_panel:   { label: "Matching Panel",   colour: "bg-amber-100 text-amber-700" },
  accepted:         { label: "Accepted",         colour: "bg-green-100 text-green-700" },
  declined:         { label: "Declined",         colour: "bg-red-100 text-red-700" },
  withdrawn:        { label: "Withdrawn",        colour: "bg-gray-100 text-gray-500" },
  waitlisted:       { label: "Waitlisted",       colour: "bg-indigo-100 text-indigo-700" },
};

/* ── seed data ────────────────────────────────────────────────────────── */

const SEED: Referral[] = [
  {
    id: "ref_1",
    childRef: "Child R",
    age: 13,
    gender: "Female",
    referringAuthority: "Birmingham City Council",
    socialWorkerName: "Hannah Osei",
    referralDate: d(-28),
    status: "accepted",
    reasonForPlacement: "Placement breakdown",
    referralDocumentsReceived: true,
    impactAssessmentCompleted: true,
    matchingPanelDate: d(-7),
    matchingPanelOutcome: "Accepted unanimously. Age-appropriate, good peer match with Alex, female dynamic positive for home balance.",
    decisionDate: d(-7),
    admissionDate: d(14),
    declineReason: null,
    notes: "Full referral pack received. Impact assessment completed. Matches Oak House admission criteria.",
    timeline: [
      { date: d(-28), event: "Referral received from Birmingham City Council", by: "staff_darren" },
      { date: d(-26), event: "Initial screening completed — meets age range and registration criteria", by: "staff_darren" },
      { date: d(-21), event: "Full referral documents received from placing authority", by: "staff_ryan" },
      { date: d(-18), event: "Impact assessment commenced", by: "staff_darren" },
      { date: d(-12), event: "Impact assessment completed — positive outcome, conditions noted", by: "staff_darren" },
      { date: d(-9), event: "Matching panel convened", by: "staff_darren" },
      { date: d(-7), event: "Matching panel decision: accepted unanimously", by: "staff_darren" },
      { date: d(-5), event: "Admission date agreed with placing authority — introductory visit planned", by: "staff_ryan" },
    ],
  },
  {
    id: "ref_2",
    childRef: "Child S",
    age: 8,
    gender: "Male",
    referringAuthority: "Wolverhampton CC",
    socialWorkerName: "Marcus Bennett",
    referralDate: d(-14),
    status: "declined",
    reasonForPlacement: "Family breakdown",
    referralDocumentsReceived: true,
    impactAssessmentCompleted: false,
    matchingPanelDate: null,
    matchingPanelOutcome: null,
    decisionDate: d(-13),
    admissionDate: null,
    declineReason: "Outside age range. Oak House is registered for children aged 11-17. Child S is 8 years old.",
    notes: "Outside age range. Signposted to appropriate homes via placing authority.",
    timeline: [
      { date: d(-14), event: "Referral received from Wolverhampton CC", by: "staff_darren" },
      { date: d(-13), event: "Declined at initial screening — child aged 8, below registered age range (11-17)", by: "staff_darren" },
      { date: d(-13), event: "Placing authority notified and signposted to age-appropriate provision", by: "staff_darren" },
    ],
  },
  {
    id: "ref_3",
    childRef: "Child T",
    age: 15,
    gender: "Male",
    referringAuthority: "Coventry City Council",
    socialWorkerName: "Priya Sharma",
    referralDate: d(-10),
    status: "under_assessment",
    reasonForPlacement: "Safeguarding",
    referralDocumentsReceived: true,
    impactAssessmentCompleted: false,
    matchingPanelDate: null,
    matchingPanelOutcome: null,
    decisionDate: null,
    admissionDate: null,
    declineReason: null,
    notes: "Promising referral but complexities need careful assessment.",
    timeline: [
      { date: d(-10), event: "Referral received from Coventry City Council", by: "staff_darren" },
      { date: d(-9), event: "Initial screening completed — positive, meets registration criteria", by: "staff_darren" },
      { date: d(-7), event: "Referral documents received in full", by: "staff_ryan" },
      { date: d(-5), event: "Impact assessment commenced — concerns noted around peer influence and CSE risk", by: "staff_darren" },
      { date: d(-2), event: "CAMHS records requested from placing authority — awaiting response", by: "staff_ryan" },
    ],
  },
  {
    id: "ref_4",
    childRef: "Child U",
    age: 14,
    gender: "Female",
    referringAuthority: "Solihull MBC",
    socialWorkerName: "James Whitmore",
    referralDate: d(-21),
    status: "withdrawn",
    reasonForPlacement: "Placement breakdown",
    referralDocumentsReceived: true,
    impactAssessmentCompleted: false,
    matchingPanelDate: null,
    matchingPanelOutcome: null,
    decisionDate: d(-10),
    admissionDate: null,
    declineReason: null,
    notes: "Positive outcome. Kinship assessment succeeded.",
    timeline: [
      { date: d(-21), event: "Referral received from Solihull MBC", by: "staff_darren" },
      { date: d(-19), event: "Initial screening completed — suitable, progressing to assessment", by: "staff_darren" },
      { date: d(-15), event: "Referral documents received", by: "staff_ryan" },
      { date: d(-10), event: "Referral withdrawn by placing authority — child placed with extended family (kinship care)", by: "staff_darren" },
    ],
  },
  {
    id: "ref_5",
    childRef: "Child V",
    age: 12,
    gender: "Male",
    referringAuthority: "Sandwell MBC",
    socialWorkerName: "Laura McKenzie",
    referralDate: d(-5),
    status: "waitlisted",
    reasonForPlacement: "Family breakdown",
    referralDocumentsReceived: true,
    impactAssessmentCompleted: false,
    matchingPanelDate: null,
    matchingPanelOutcome: null,
    decisionDate: null,
    admissionDate: null,
    declineReason: null,
    notes: "Good potential match. On waiting list pending vacancy.",
    timeline: [
      { date: d(-5), event: "Referral received from Sandwell MBC", by: "staff_ryan" },
      { date: d(-4), event: "Initial screening completed — positive match profile", by: "staff_darren" },
      { date: d(-3), event: "Oak House currently at full capacity (3/3). Placed on waiting list — first consideration when vacancy arises", by: "staff_darren" },
      { date: d(-2), event: "Placing authority informed of waitlist position and expected timescales", by: "staff_ryan" },
    ],
  },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function ReferralTrackerPage() {
  const [data] = useState<Referral[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  /* ── summary stats ──────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = data.length;
    const accepted = data.filter((r) => r.status === "accepted").length;
    const declined = data.filter((r) => r.status === "declined").length;
    const acceptedPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const declinedPct = total > 0 ? Math.round((declined / total) * 100) : 0;

    // average decision time (days) for referrals with a decision date
    const withDecision = data.filter((r) => r.decisionDate && r.referralDate);
    const avgDays =
      withDecision.length > 0
        ? Math.round(
            withDecision.reduce((sum, r) => {
              const start = new Date(r.referralDate).getTime();
              const end = new Date(r.decisionDate!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / withDecision.length
          )
        : 0;

    return { total, accepted, declined, acceptedPct, declinedPct, avgDays };
  }, [data]);

  /* ── filtered / sorted ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.childRef.toLowerCase().includes(q) ||
          r.referringAuthority.toLowerCase().includes(q) ||
          r.socialWorkerName.toLowerCase().includes(q) ||
          r.reasonForPlacement.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.childRef.localeCompare(b.childRef);
        case "age":
          return a.age - b.age;
        case "status":
          return (
            Object.keys(STATUS_META).indexOf(a.status) -
            Object.keys(STATUS_META).indexOf(b.status)
          );
        default:
          return b.referralDate.localeCompare(a.referralDate);
      }
    });
    return list;
  }, [data, filterStatus, search, sortBy]);

  /* ── export ─────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<Referral>[] = [
    { header: "Child Ref", accessor: (r: Referral) => r.childRef },
    { header: "Age", accessor: (r: Referral) => String(r.age) },
    { header: "Gender", accessor: (r: Referral) => r.gender },
    { header: "Referring Authority", accessor: (r: Referral) => r.referringAuthority },
    { header: "Social Worker", accessor: (r: Referral) => r.socialWorkerName },
    { header: "Referral Date", accessor: (r: Referral) => r.referralDate },
    { header: "Status", accessor: (r: Referral) => STATUS_META[r.status].label },
    { header: "Reason for Placement", accessor: (r: Referral) => r.reasonForPlacement },
    { header: "Docs Received", accessor: (r: Referral) => r.referralDocumentsReceived ? "Yes" : "No" },
    { header: "Impact Assessment", accessor: (r: Referral) => r.impactAssessmentCompleted ? "Completed" : "Pending" },
    { header: "Panel Date", accessor: (r: Referral) => r.matchingPanelDate ?? "N/A" },
    { header: "Panel Outcome", accessor: (r: Referral) => r.matchingPanelOutcome ?? "N/A" },
    { header: "Decision Date", accessor: (r: Referral) => r.decisionDate ?? "N/A" },
    { header: "Admission Date", accessor: (r: Referral) => r.admissionDate ?? "N/A" },
    { header: "Decline Reason", accessor: (r: Referral) => r.declineReason ?? "N/A" },
    { header: "Notes", accessor: (r: Referral) => r.notes },
  ];

  return (
    <PageShell
      title="Referral Tracker"
      subtitle="Tracking incoming placement referrals from initial contact through to matching panel decision and outcome"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="referral-tracker" />
          <PrintButton title="Referral Tracker" />
          <Button onClick={() => {}}>
            <Plus className="h-4 w-4 mr-1" /> New Referral
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals (12 mo)", v: stats.total, icon: UserPlus, c: "text-blue-600" },
            { l: "Accepted", v: `${stats.accepted} (${stats.acceptedPct}%)`, icon: CheckCircle2, c: "text-green-600" },
            { l: "Declined", v: `${stats.declined} (${stats.declinedPct}%)`, icon: XCircle, c: "text-red-600" },
            { l: "Avg Decision Time", v: `${stats.avgDays} days`, icon: Timer, c: "text-amber-600" },
            { l: "Active / In Progress", v: data.filter((r) => ["received", "screening", "under_assessment", "matching_panel", "waitlisted"].includes(r.status)).length, icon: Clock, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border bg-white p-4 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search referrals..."
              className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Referral Date</option>
              <option value="name">Child Ref</option>
              <option value="age">Age</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* ── referral cards ─────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No referrals match your filters.</div>
        )}

        {filtered.map((ref) => {
          const isExpanded = expandedId === ref.id;

          return (
            <div key={ref.id} className="rounded-xl border bg-white overflow-hidden">
              {/* collapsed header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : ref.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{ref.childRef}</h3>
                      <span className="text-xs text-muted-foreground">
                        Age {ref.age} · {ref.gender}
                      </span>
                      <Badge className={cn("text-xs", STATUS_META[ref.status].colour)}>
                        {STATUS_META[ref.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ref.referringAuthority} · {ref.reasonForPlacement} · Referred {ref.referralDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ref.referralDocumentsReceived && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      Docs
                    </Badge>
                  )}
                  {ref.impactAssessmentCompleted && (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      IA Done
                    </Badge>
                  )}
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {/* expanded detail */}
              {isExpanded && (
                <div className="border-t bg-slate-50 p-4 space-y-4">
                  {/* key info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Social Worker:</span>{" "}
                      {ref.socialWorkerName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      {ref.reasonForPlacement}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documents:</span>{" "}
                      <span className={ref.referralDocumentsReceived ? "text-green-700" : "text-amber-600"}>
                        {ref.referralDocumentsReceived ? "Received" : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impact Assessment:</span>{" "}
                      <span className={ref.impactAssessmentCompleted ? "text-green-700" : "text-amber-600"}>
                        {ref.impactAssessmentCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* matching panel details */}
                  {(ref.matchingPanelDate || ref.matchingPanelOutcome) && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-green-700" />
                        <p className="text-sm font-medium text-green-800">Matching Panel</p>
                      </div>
                      {ref.matchingPanelDate && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Date:</span> {ref.matchingPanelDate}
                        </p>
                      )}
                      {ref.matchingPanelOutcome && (
                        <p className="text-sm mt-1">{ref.matchingPanelOutcome}</p>
                      )}
                    </div>
                  )}

                  {/* decision / admission */}
                  {(ref.decisionDate || ref.admissionDate) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ref.decisionDate && (
                        <div className="rounded-lg bg-white border p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Decision Date</p>
                          <p className="text-sm font-medium">{ref.decisionDate}</p>
                        </div>
                      )}
                      {ref.admissionDate && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarCheck className="h-4 w-4 text-blue-700" />
                            <p className="text-xs text-blue-800 font-medium">Planned Admission</p>
                          </div>
                          <p className="text-sm font-medium">{ref.admissionDate}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* decline reason */}
                  {ref.declineReason && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-700" />
                        <p className="text-sm font-medium text-red-800">Reason for Decline</p>
                      </div>
                      <p className="text-sm text-red-900">{ref.declineReason}</p>
                    </div>
                  )}

                  {/* notes */}
                  {ref.notes && (
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{ref.notes}</p>
                    </div>
                  )}

                  {/* timeline */}
                  <div>
                    <p className="text-sm font-semibold mb-2">Referral Timeline</p>
                    <div className="space-y-2">
                      {ref.timeline.map((evt, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                            {idx < ref.timeline.length - 1 && (
                              <div className="w-px flex-1 bg-blue-200" />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className="text-xs text-muted-foreground">{evt.date}</p>
                            <p className="text-sm">{evt.event}</p>
                            <p className="text-xs text-muted-foreground">
                              By: {getStaffName(evt.by)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── regulatory note ────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <p>
            <strong>Regulation 14 (Admissions):</strong> Before admitting a child, the registered person
            must assess whether the child&apos;s placement in the home is in the best interests of the
            child and each child already living there. All referrals must be subject to a thorough
            matching and impact assessment process before any admission decision is made.
          </p>
          <p>
            <strong>Quality Standards (Standard 5 — Enjoying and Achieving):</strong> Matching decisions
            must consider the child&apos;s education, health, emotional and social needs alongside the
            impact on existing placements and the home&apos;s Statement of Purpose.
          </p>
          <p>
            <strong>Ofsted Expectation:</strong> Inspectors will examine the home&apos;s referral and
            matching process, including evidence of impact assessments, panel decisions, and the rationale
            for accepting or declining referrals. Homes should demonstrate that admissions are carefully
            planned and that children are only placed where their needs can be met.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
