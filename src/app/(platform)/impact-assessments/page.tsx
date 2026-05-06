"use client";

import { useState, useMemo } from "react";
import {
  Scale, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Users, Shield,
  ThumbsUp, ThumbsDown, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import type { ImpactAssessment, ImpactAssessmentStatus, ImpactRecommendation, ImpactArea } from "@/types/extended";
import { IMPACT_ASSESSMENT_STATUS_LABEL, IMPACT_RECOMMENDATION_LABEL } from "@/types/extended";
import { useImpactAssessments } from "@/hooks/use-impact-assessments";

/* ── helpers ─────────────────────────────────────────────────── */
const STATUSES: ImpactAssessmentStatus[] = ["draft", "in_progress", "completed", "approved", "declined"];

const STATUS_COLORS: Record<ImpactAssessmentStatus, string> = {
  draft: "bg-slate-100 text-slate-800", in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
};

const REC_COLORS: Record<ImpactRecommendation, string> = {
  proceed: "bg-green-100 text-green-800", proceed_with_conditions: "bg-blue-100 text-blue-800",
  decline: "bg-red-100 text-red-800", further_info: "bg-yellow-100 text-yellow-800",
};

/* ── component ───────────────────────────────────────────────── */
export default function ImpactAssessmentsPage() {
  const { data: raw, isLoading } = useImpactAssessments();
  const assessments = useMemo(() => raw?.data ?? [], [raw]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Impact Assessments" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  const filtered = useMemo(() => {
    let list = [...assessments];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.referral_name.toLowerCase().includes(q) ||
          a.referral_authority.toLowerCase().includes(q) ||
          a.rationale.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "status": return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
        case "name": return a.referral_name.localeCompare(b.referral_name);
        default: return 0;
      }
    });
    return list;
  }, [assessments, search, filterStatus, sortBy]);

  const total = assessments.length;
  const approved = assessments.filter((a) => a.status === "approved").length;
  const declined = assessments.filter((a) => a.status === "declined").length;
  const inProgress = assessments.filter((a) => a.status === "in_progress" || a.status === "draft").length;

  const exportCols: ExportColumn<ImpactAssessment>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Referral Name", accessor: (r) => r.referral_name },
    { header: "Age", accessor: (r) => String(r.referral_age) },
    { header: "Gender", accessor: (r) => r.referral_gender },
    { header: "Authority", accessor: (r) => r.referral_authority },
    { header: "Date", accessor: (r) => r.date },
    { header: "Status", accessor: (r) => IMPACT_ASSESSMENT_STATUS_LABEL[r.status] },
    { header: "Assessor", accessor: (r) => getStaffName(r.assessor) },
    { header: "Recommendation", accessor: (r) => IMPACT_RECOMMENDATION_LABEL[r.overall_recommendation] },
    { header: "Conditions", accessor: (r) => r.conditions.join("; ") },
    { header: "Rationale", accessor: (r) => r.rationale },
    { header: "Panel Date", accessor: (r) => r.panel_date ?? "N/A" },
    { header: "Panel Outcome", accessor: (r) => r.panel_outcome ?? "N/A" },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  return (
    <PageShell
      title="Impact Assessments"
      subtitle="Assessing the impact of new admissions on existing young people"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Impact Assessments" />
          <ExportButton data={filtered} columns={exportCols} filename="impact-assessments" />
          <Button onClick={() => {}}>
            <Plus className="h-4 w-4 mr-2" /> New Assessment
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Assessments", value: total, icon: Scale, colour: "text-blue-600" },
            { label: "Approved", value: approved, icon: ThumbsUp, colour: "text-green-600" },
            { label: "Declined", value: declined, icon: ThumbsDown, colour: "text-red-600" },
            { label: "In Progress", value: inProgress, icon: Clock, colour: inProgress > 0 ? "text-orange-600" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search referrals, authorities, rationale…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{IMPACT_ASSESSMENT_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="name">Referral Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No assessments match your filters.</div>
          )}
          {filtered.map((assessment) => {
            const isExpanded = expanded === assessment.id;

            return (
              <div key={assessment.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : assessment.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Scale className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{assessment.referral_name} (Age {assessment.referral_age}, {assessment.referral_gender})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {assessment.date} · {assessment.referral_authority} · {getStaffName(assessment.assessor)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", REC_COLORS[assessment.overall_recommendation])}>
                      {IMPACT_RECOMMENDATION_LABEL[assessment.overall_recommendation]}
                    </Badge>
                    <Badge className={cn("text-xs", STATUS_COLORS[assessment.status])}>
                      {IMPACT_ASSESSMENT_STATUS_LABEL[assessment.status]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* impact on existing */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium">Impact on Existing Young People</p>
                      </div>
                      <div className="space-y-2">
                        {assessment.impact_on_existing.map((area: ImpactArea, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                            area.projected_impact === "positive" ? "bg-green-50 border-green-200" :
                            area.projected_impact === "negative" ? "bg-red-50 border-red-200" :
                            "bg-white"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{area.area}</span>
                              <Badge variant="outline" className="text-xs">
                                Impact: {area.projected_impact}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{area.detail}</p>
                            <p className="text-xs mt-1"><strong>Mitigation:</strong> {area.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* impact on referral */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <p className="text-sm font-medium">Impact on Referral ({assessment.referral_name})</p>
                      </div>
                      <div className="space-y-2">
                        {assessment.impact_on_referral.map((area: ImpactArea, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                            area.projected_impact === "positive" ? "bg-green-50 border-green-200" :
                            area.projected_impact === "negative" ? "bg-red-50 border-red-200" :
                            "bg-white"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{area.area}</span>
                              <Badge variant="outline" className="text-xs">
                                Impact: {area.projected_impact}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{area.detail}</p>
                            <p className="text-xs mt-1"><strong>Mitigation:</strong> {area.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* conditions */}
                    {assessment.conditions.length > 0 && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2">Conditions</p>
                        <ul className="space-y-1">
                          {assessment.conditions.map((c: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* rationale */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Rationale</p>
                      <p className="text-sm">{assessment.rationale}</p>
                    </div>

                    {/* panel */}
                    {(assessment.panel_date || assessment.panel_outcome) && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">Panel Decision</p>
                        {assessment.panel_date && <p className="text-sm">Date: {assessment.panel_date}</p>}
                        {assessment.panel_outcome && <p className="text-sm">{assessment.panel_outcome}</p>}
                      </div>
                    )}

                    {assessment.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{assessment.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 14:</strong> Before admitting a child, the registered person must carry out
          an assessment of whether the child&apos;s placement is in the best interests of the child and each
          existing child. This must consider the impact on existing placements and the compatibility of
          the proposed admission with the home&apos;s Statement of Purpose.
        </div>
      </div>
    </PageShell>
  );
}
