"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, Briefcase, Heart, Star, Wallet, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

interface YpJob {
  id: string;
  youngPerson: string;
  jobType: "Saturday job" | "Newspaper round" | "Babysitting (family)" | "Volunteering" | "Apprenticeship" | "Work experience placement" | "Internal home task (paid)" | "Sports coaching assistant";
  employer: string;
  jobTitle: string;
  startDate: string;
  ongoingStatus: "Active" | "Trial period" | "Ended" | "On hold";
  endDate: string;
  hoursPerWeek: number;
  payRate: number;
  payRateUnit: "per hour" | "per shift" | "per week" | "per task";
  legalChecks: { check: string; verified: boolean }[];
  workPermitObtained: boolean;
  workPermitNumber: string;
  schoolImpactAssessment: string;
  parentLAConsent: boolean;
  childAge: number;
  childMotivation: string;
  riskAssessmentCompleted: boolean;
  riskAssessmentDate: string;
  travelArrangements: string;
  emergencyContacts: string;
  childExperience: string;
  skillsBeingDeveloped: string[];
  earningsToDate: number;
  earningsManagement: string;
  reviewedDate: string;
  reviewedBy: string;
  notes: string;
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const data: YpJob[] = [
  {
    id: "yj-001", youngPerson: "yp_jordan", jobType: "Sports coaching assistant", employer: "Riverside FC junior section", jobTitle: "Junior coaching assistant",
    startDate: "2025-01-15", ongoingStatus: "Active", endDate: "", hoursPerWeek: 2, payRate: 5, payRateUnit: "per hour",
    legalChecks: [
      { check: "Age 13+ verified (school age permitted only out-of-school hours)", verified: true },
      { check: "Maximum hours per week within legal limit (12 max during term)", verified: true },
      { check: "Not before 7am or after 7pm", verified: true },
      { check: "Risk assessment completed", verified: true },
      { check: "Parental/LA consent", verified: true },
    ],
    workPermitObtained: true, workPermitNumber: "Riverside Council ChildEmp/2025/0142",
    schoolImpactAssessment: "School aware and supportive. Saturday morning only, no school-day impact. Designated teacher informed.",
    parentLAConsent: true, childAge: 13,
    childMotivation: "I want to give back to football. Coach Mike is brilliant. Maybe one day I could be him.",
    riskAssessmentCompleted: true, riskAssessmentDate: "2025-01-10",
    travelArrangements: "Walks to club (10 min) — same route as match days",
    emergencyContacts: "Coach Mike + RM on-call",
    childExperience: "Strong identity development. Younger players look up to Jordan. Team dynamic enhanced.",
    skillsBeingDeveloped: ["Leadership", "Communication", "Coaching basics", "Time management", "Working with younger children"],
    earningsToDate: 90, earningsManagement: "Money goes to Jordan's bank account. Saving for football boots upgrade.",
    reviewedDate: d(-30), reviewedBy: "staff_chervelle",
    notes: "First paid role. Significant identity-affirming step. Local council work permit obtained — model approach.",
  },
];

const statusColour: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  "Trial period": "bg-amber-100 text-amber-800",
  Ended: "bg-slate-100 text-slate-800",
  "On hold": "bg-blue-100 text-blue-800",
};

const exportCols: ExportColumn<YpJob>[] = [
  { header: "Young Person", accessor: (r: YpJob) => getYPName(r.youngPerson) },
  { header: "Job Title", accessor: (r: YpJob) => r.jobTitle },
  { header: "Employer", accessor: (r: YpJob) => r.employer },
  { header: "Type", accessor: (r: YpJob) => r.jobType },
  { header: "Status", accessor: (r: YpJob) => r.ongoingStatus },
  { header: "Hours/week", accessor: (r: YpJob) => String(r.hoursPerWeek) },
  { header: "Pay £", accessor: (r: YpJob) => `£${r.payRate} ${r.payRateUnit}` },
  { header: "Earnings to date", accessor: (r: YpJob) => `£${r.earningsToDate}` },
];

export default function YoungPersonJobTrackerPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((j) => j.youngPerson === filterYP);
    items.sort((a, b) => sortBy === "date" ? b.startDate.localeCompare(a.startDate) : 0);
    return items;
  }, [filterYP, sortBy]);

  const total = data.length;
  const active = data.filter((j) => j.ongoingStatus === "Active").length;
  const totalEarnings = data.reduce((sum, j) => sum + j.earningsToDate, 0);
  const allCompliant = data.every((j) => j.workPermitObtained && j.parentLAConsent && j.riskAssessmentCompleted);

  return (
    <PageShell title="Young Person Job Tracker" subtitle="Part-time work, volunteering, and apprenticeships — supporting independence, identity, and earnings"
      ariaContext={{ pageTitle: "Young Person Job Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="young-person-jobs" />
          <PrintButton title="Young Person Jobs" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Active Jobs</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-green-600">{active}</p><p className="text-xs text-muted-foreground">Currently Working</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">£{totalEarnings}</p><p className="text-xs text-muted-foreground">Total Earnings (Children)</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-purple-600">{allCompliant ? "100%" : "Action"}</p><p className="text-xs text-muted-foreground">Compliance</p></div>
      </div>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Briefcase className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">Children working under 16 require a Local Authority work permit. Hours capped per child employment regulations. Schoolwork prioritised. Earnings belong to the child. We support, never push, into work.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}><SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger><SelectContent><SelectItem value="all">All Children</SelectItem><SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem><SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem><SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem></SelectContent></Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date">Most Recent</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((j) => {
          const isExpanded = expandedId === j.id;
          return (
            <div key={j.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : j.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><Briefcase className="h-5 w-5 text-amber-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{getYPName(j.youngPerson)} — {j.jobTitle}</p><p className="text-xs text-muted-foreground mt-0.5">{j.employer} &middot; {j.hoursPerWeek}h/wk &middot; £{j.payRate} {j.payRateUnit}</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[j.ongoingStatus])}>{j.ongoingStatus}</span>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Why this matters to {getYPName(j.youngPerson)}</p><p className="italic">&ldquo;{j.childMotivation}&rdquo;</p></div>
                  <div className="bg-purple-50 rounded-lg p-3"><p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1"><Star className="h-3 w-3 inline mr-1" />Skills Developing</p><div className="flex flex-wrap gap-1">{j.skillsBeingDeveloped.map((s, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">{s}</span>)}</div></div>
                  <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Legal Checks</p><div className="space-y-1">{j.legalChecks.map((c, i) => <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">{c.check}<span className={cn("text-xs px-2 py-0.5 rounded-full", c.verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{c.verified ? "✓ Verified" : "✗ Pending"}</span></div>)}</div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="bg-white rounded-lg p-3 border"><p className="text-xs text-muted-foreground">Work Permit</p><p className="font-medium">{j.workPermitObtained ? j.workPermitNumber : "Not yet obtained"}</p></div><div className="bg-white rounded-lg p-3 border"><p className="text-xs text-muted-foreground">School Impact</p><p>{j.schoolImpactAssessment}</p></div></div>
                  <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1"><Heart className="h-3 w-3 inline mr-1" />Child&apos;s Experience</p><p>{j.childExperience}</p></div>
                  <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1"><Wallet className="h-3 w-3 inline mr-1" />Earnings</p><p>£{j.earningsToDate} to date. {j.earningsManagement}</p></div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t"><span><Clock className="h-3 w-3 inline mr-1" />Started {j.startDate}</span><span>Reviewed: {j.reviewedDate} by {getStaffName(j.reviewedBy)}</span><span>Travel: {j.travelArrangements}</span></div>
                  {j.notes && <div className="bg-slate-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p><p>{j.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Young person employment supports Quality Standard 12 (preparation for adulthood) and complies with Children and Young Persons Act 1933, Education Act 1996, and local authority work permit requirements. Linked to Independence Pathway and Pocket Money / Bank Account.</p></div>
      <CareEventsPanel
        title="Care Events — Education & Wellbeing"
        category={["education", "wellbeing", "activity"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Young Person Job Tracker — part-time work, volunteering, apprenticeships, legal checks, work permits, LA consent, earnings, school impact, independence development"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
