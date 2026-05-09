"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, CheckCircle2, AlertCircle,
  Search, Heart, Stethoscope, ShieldCheck, CalendarClock, Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { AnnualHealthAssessment, AHAHealthDomain } from "@/types/extended";
import { useAnnualHealthAssessments } from "@/hooks/use-annual-health-assessments";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AnnualHealthAssessmentPage() {
  const { data: res, isLoading } = useAnnualHealthAssessments();
  const data = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDeadline, setFilterDeadline] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.assessor.toLowerCase().includes(q),
      );
    }
    if (filterDeadline === "within") rows = rows.filter((r) => r.completed_within_deadline);
    if (filterDeadline === "outside") rows = rows.filter((r) => !r.completed_within_deadline);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.assessment_date.localeCompare(a.assessment_date)
        : a.assessment_date.localeCompare(b.assessment_date),
    );
    return rows;
  }, [data, search, filterDeadline, sortBy]);

  const total = data.length;
  const withinDeadlinePct = total > 0
    ? Math.round((data.filter((r) => r.completed_within_deadline).length / total) * 100)
    : 0;
  const fullHealthPack = data.filter((r) =>
    r.immunisations_up_to_date && r.dental_check_up_to_date && r.optical_check_up_to_date,
  ).length;
  const today = d(0);
  const sixtyDays = d(60);
  const reviewsDue60 = data.filter((r) =>
    r.next_assessment_date >= today && r.next_assessment_date <= sixtyDays,
  ).length;

  if (isLoading) {
    return (
      <PageShell title="Annual Health Assessment" subtitle="Statutory AHA · Care Planning Regulations 2010 · Quality Standard 7">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const exportCols: ExportColumn<AnnualHealthAssessment>[] = [
    { header: "Young Person", accessor: (r: AnnualHealthAssessment) => getYPName(r.child_id) },
    { header: "Assessment Date", accessor: (r: AnnualHealthAssessment) => r.assessment_date },
    { header: "Due Date", accessor: (r: AnnualHealthAssessment) => r.assessment_due_date },
    { header: "Assessor", accessor: (r: AnnualHealthAssessment) => r.assessor },
    { header: "Location", accessor: (r: AnnualHealthAssessment) => r.location },
    { header: "Within Deadline", accessor: (r: AnnualHealthAssessment) => r.completed_within_deadline ? "Yes" : "No" },
    { header: "Height", accessor: (r: AnnualHealthAssessment) => r.height },
    { header: "Weight", accessor: (r: AnnualHealthAssessment) => r.weight },
    { header: "BMI Centile", accessor: (r: AnnualHealthAssessment) => r.bmi_centile },
    { header: "Growth On Track", accessor: (r: AnnualHealthAssessment) => r.growth_on_track ? "Yes" : "No" },
    { header: "Immunisations", accessor: (r: AnnualHealthAssessment) => r.immunisations_up_to_date ? "Up to date" : "Outstanding" },
    { header: "Dental", accessor: (r: AnnualHealthAssessment) => r.dental_check_up_to_date ? "Up to date" : "Outstanding" },
    { header: "Optical", accessor: (r: AnnualHealthAssessment) => r.optical_check_up_to_date ? "Up to date" : "Outstanding" },
    { header: "Report Shared", accessor: (r: AnnualHealthAssessment) => r.report_shared ? "Yes" : "No" },
    { header: "Signed Off (LA)", accessor: (r: AnnualHealthAssessment) => r.signed_off_by_la ? "Yes" : "No" },
    { header: "Next Assessment", accessor: (r: AnnualHealthAssessment) => r.next_assessment_date },
  ];

  return (
    <PageShell
      title="Annual Health Assessment"
      subtitle="Statutory AHA · Care Planning Regulations 2010 · Quality Standard 7"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Annual Health Assessment" />
          <ExportButton data={data} columns={exportCols} filename="annual-health-assessment" />
        </div>
      }
    >
      <div id="print-area">
        <AriaPanel mode="assist" pageContext="Annual Health Assessment — statutory AHA, Care Planning Regulations 2010, Quality Standard 7, health action plans, immunisations, dental" recordType="annual_health_assessment" userRole="registered_manager" className="mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Assessments", value: total, icon: Heart, clr: "text-rose-600" },
            { label: "Within Deadline %", value: `${withinDeadlinePct}%`, icon: CalendarClock, clr: "text-blue-600" },
            { label: "Full Health Pack", value: `${fullHealthPack}/${total}`, icon: ShieldCheck, clr: "text-green-600" },
            { label: "Reviews Due 60d", value: reviewsDue60, icon: Activity, clr: "text-amber-600" },
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

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search young person or assessor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterDeadline} onValueChange={setFilterDeadline}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Deadline" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assessments</SelectItem>
              <SelectItem value="within">Within Deadline</SelectItem>
              <SelectItem value="outside">Outside Deadline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const borderClr = r.completed_within_deadline
              ? "border-l-green-400"
              : new Date(r.assessment_date) > new Date()
                ? "border-l-amber-400"
                : "border-l-red-500";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={r.completed_within_deadline ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                          {r.completed_within_deadline ? "Within Deadline" : "Outside Deadline"}
                        </Badge>
                        {r.signed_off_by_la && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">LA Signed Off</Badge>
                        )}
                        {r.immunisations_up_to_date && r.dental_check_up_to_date && r.optical_check_up_to_date && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">Full Health Pack</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Assessment: {r.assessment_date} · Due: {r.assessment_due_date} · Assessor: {r.assessor.split(",")[0]} · Next: {r.next_assessment_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-muted/50">{r.domains.length} domains</Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="text-xs font-medium">{r.height}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="text-xs font-medium">{r.weight}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-xs text-muted-foreground">BMI Centile</p>
                        <p className="text-xs font-medium">{r.bmi_centile}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-xs text-muted-foreground">Growth</p>
                        <p className="text-xs font-medium">{r.growth_on_track ? "On track" : "Concerns"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className={cn("rounded p-2 border", r.immunisations_up_to_date ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                        <p className="text-xs font-medium flex items-center gap-1">
                          {r.immunisations_up_to_date ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-red-600" />}
                          Immunisations
                        </p>
                        <p className="text-xs text-muted-foreground">{r.immunisations_up_to_date ? "Up to date" : "Outstanding"}</p>
                      </div>
                      <div className={cn("rounded p-2 border", r.dental_check_up_to_date ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                        <p className="text-xs font-medium flex items-center gap-1">
                          {r.dental_check_up_to_date ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-red-600" />}
                          Dental
                        </p>
                        <p className="text-xs text-muted-foreground">{r.dental_check_up_to_date ? "Up to date" : "Outstanding"}</p>
                      </div>
                      <div className={cn("rounded p-2 border", r.optical_check_up_to_date ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                        <p className="text-xs font-medium flex items-center gap-1">
                          {r.optical_check_up_to_date ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <AlertCircle className="h-3 w-3 text-red-600" />}
                          Optical
                        </p>
                        <p className="text-xs text-muted-foreground">{r.optical_check_up_to_date ? "Up to date" : "Outstanding"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5" /> Assessment Domains
                      </p>
                      <div className="space-y-2">
                        {r.domains.map((dom, i) => (
                          <div key={i} className="border rounded p-2">
                            <p className="text-xs font-semibold">{dom.domain}</p>
                            <p className="text-xs mt-1"><span className="text-muted-foreground">Findings: </span>{dom.findings}</p>
                            <p className="text-xs mt-1"><span className="text-muted-foreground">Actions: </span>{dom.actions}</p>
                            <p className="text-xs mt-1"><span className="text-muted-foreground">Follow-up: </span>{dom.follow_up}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Contribution</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.child_contribution}&rdquo;</p>
                    </div>

                    {r.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Recommendations</p>
                        <ul className="space-y-1">{r.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}</ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">Report Shared</p>
                        <p className="text-xs text-muted-foreground">{r.report_shared ? "Yes" : "Not yet shared"}</p>
                        {r.report_shared_with.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.report_shared_with.map((p, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">LA Sign-Off</p>
                        <p className="text-xs text-muted-foreground">{r.signed_off_by_la ? "Signed off by Local Authority" : "Awaiting LA sign-off"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Logged by {getStaffName("staff_darren")}</p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Location: {r.location} · Assessor: {r.assessor}
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel
                      sourceType="annual-health-assessment"
                      sourceId={r.id}
                      childId={r.child_id}
                      compact
                    />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Statutory Framework — Annual Health Assessment</p>
          <p>
            Looked-after children must receive an Annual Health Assessment (AHA) under the Care Planning, Placement and Case Review (England) Regulations 2010, regulation 7, and Quality Standard 7 of the Children&apos;s Homes Regulations 2015 (Health and wellbeing). For children aged 5 and over, the AHA must take place at least once every 12 months and be carried out by a registered medical practitioner or appropriately qualified nurse (typically the LAC nurse or paediatrician). The assessment must address physical, emotional and mental health needs, and inform the child&apos;s Health Plan, which feeds into the overall Care Plan. The young person&apos;s wishes and feelings must be sought and recorded. The completed assessment is shared with the responsible Local Authority, GP, school nurse and (with consent where appropriate) parents/carers. Outside-deadline completions, missing immunisations, dental or optical checks must be tracked and escalated. Reviews are monitored through Reg 44/45 reporting and Ofsted inspection of health outcomes.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        category="health"
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}
