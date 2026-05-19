"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, Heart, Shield, AlertCircle, CheckCircle, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import type { YoungCarerRecord } from "@/types/extended";
import { useYoungCarerRecords } from "@/hooks/use-young-carer-records";

const statusColour: Record<string, string> = {
  "Identified young carer": "bg-amber-100 text-amber-800",
  "Previous young carer (pre-care)": "bg-purple-100 text-purple-800",
  "Risk of young carer role on family contact": "bg-blue-100 text-blue-800",
  "Not a young carer": "bg-slate-100 text-slate-800",
};

const exportCols: ExportColumn<YoungCarerRecord>[] = [
  { header: "Young Person", accessor: (r: YoungCarerRecord) => getYPName(r.child_id) },
  { header: "Carer Status", accessor: (r: YoungCarerRecord) => r.carerStatus },
  { header: "Recipient", accessor: (r: YoungCarerRecord) => r.caringRecipient },
  { header: "Age Started", accessor: (r: YoungCarerRecord) => String(r.ageWhenCaringStarted) },
  { header: "Formal Assessment", accessor: (r: YoungCarerRecord) => r.formalYoungCarerAssessment ? "Yes" : "No" },
  { header: "Child Accepts Status", accessor: (r: YoungCarerRecord) => r.childAcceptsCarerStatus ? "Yes" : "No" },
  { header: "Reviewed", accessor: (r: YoungCarerRecord) => r.reviewedDate },
];

export default function YoungCarerStatusPage() {
  const { data: result, isLoading } = useYoungCarerRecords(undefined, "home_oak");
  const data = result?.data ?? [];

  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterStatus !== "all") items = items.filter((r) => r.carerStatus === filterStatus);
    items.sort((a, b) => sortBy === "name" ? a.child_id.localeCompare(b.child_id) : 0);
    return items;
  }, [filterStatus, sortBy, data]);

  const total = data.length;
  const identified = data.filter((r) => r.carerStatus !== "Not a young carer").length;
  const formallyAssessed = data.filter((r) => r.formalYoungCarerAssessment).length;

  return (
    <PageShell
      title="Young Carer Status"
      subtitle="Identifying and supporting children with caring responsibilities — past, present, or risk-of"
      ariaContext={{ pageTitle: "Young Carer Status", sourceType: "child_record" }}
      actions={<div className="flex items-center gap-2"><ExportButton data={data} columns={exportCols} filename="young-carer-status" /><PrintButton title="Young Carer Status" /><AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} /></div>}>
      {isLoading ? <div className="p-8 text-center text-muted-foreground">Loading...</div> : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Records</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-amber-600">{identified}/{total}</p><p className="text-xs text-muted-foreground">Carer Status Identified</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{formallyAssessed}</p><p className="text-xs text-muted-foreground">Formal LA Assessment</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-green-600">100%</p><p className="text-xs text-muted-foreground">Child Voice Captured</p></div>
      </div>
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Many children entering care have been young carers — caring for siblings, parents with mental health
          difficulties, parental substance use. The role doesn&apos;t end at placement; identity and worry persist.
          We name it carefully, support what the child wants, and protect against over-responsibility.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[260px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Identified young carer">Identified Young Carer</SelectItem>
            <SelectItem value="Previous young carer (pre-care)">Previous (Pre-care)</SelectItem>
            <SelectItem value="Risk of young carer role on family contact">Risk on Contact</SelectItem>
            <SelectItem value="Not a young carer">Not a Young Carer</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">By Child</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><Heart className="h-5 w-5 text-purple-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{getYPName(r.child_id)}</p><p className="text-xs text-muted-foreground mt-0.5">{r.carerStatus} {r.caringRecipient && `· caring for ${r.caringRecipient}`}</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[r.carerStatus])}>{r.carerStatus.split(" ")[0]}</span>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  {r.caringResponsibilities.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Caring Responsibilities</p><ul className="space-y-1">{r.caringResponsibilities.map((c, i) => <li key={i} className="flex items-start gap-1"><Users className="h-3 w-3 text-purple-500 mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>}
                  {r.emotionalImpactObserved.length > 0 && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Emotional Impact</p><ul className="space-y-1">{r.emotionalImpactObserved.map((c, i) => <li key={i} className="flex items-start gap-1"><AlertCircle className="h-3 w-3 text-amber-500 mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>}
                  {r.childWishesAroundCaring && <div className="bg-pink-50 rounded-lg p-3"><p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1"><Heart className="h-3 w-3 inline mr-1" />Child&apos;s Wishes</p><p className="italic">{r.childWishesAroundCaring}</p></div>}
                  {r.supportInPlace.length > 0 && <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1"><Shield className="h-3 w-3 inline mr-1" />Support In Place</p><ul className="space-y-1">{r.supportInPlace.map((c, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" /><span>{c}</span></li>)}</ul></div>}
                  {r.educationImpactProtections.length > 0 && <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Education Protections</p><ul className="space-y-1">{r.educationImpactProtections.map((c, i) => <li key={i} className="text-sm">• {c}</li>)}</ul></div>}
                  {r.contactSupportArrangements && <div className="bg-purple-50 rounded-lg p-3"><p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Contact Support</p><p>{r.contactSupportArrangements}</p></div>}
                  {r.childRefusesIdentification && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Note on Identification</p><p>{r.childRefusesIdentification}</p></div>}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t"><span>Reviewed: {r.reviewedDate} by {getStaffName(r.reviewedBy)}</span><span>Schedule: {r.reviewSchedule}</span>{r.formalYoungCarerAssessment && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">LA Assessed</span>}</div>
                  {r.notes && <div className="bg-slate-50 rounded-lg p-3 border"><p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p><p>{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Young carer identification supports Children and Families Act 2014 s.96 (young carer assessments), Care Act 2014, Quality Standard 7 (health and wellbeing), and Quality Standard 9 (family relationships). Linked to Family Time Supervision and Trauma-Informed Timeline.</p></div>
      <CareEventsPanel
        title="Care Events — Wellbeing & Education"
        category={["wellbeing", "education", "health"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Young Carer Status — children with caring responsibilities for a parent or sibling, carer support, school impact, LA assessment, respite, plan, wellbeing"
        recordType="care_plan"
        className="mt-6"
      />
      </>)}
    </PageShell>
  );
}
