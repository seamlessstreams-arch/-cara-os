"use client";

import { useState, useMemo } from "react";
import {
  Scale, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Users, Shield,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const STATUSES = ["draft", "in_progress", "completed", "approved", "declined"] as const;
type Status = typeof STATUSES[number];
const STATUS_COLORS: Record<Status, string> = {
  draft: "bg-slate-100 text-slate-800", in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", approved: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
};
const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft", in_progress: "In Progress", completed: "Completed",
  approved: "Approved", declined: "Declined",
};

interface ImpactArea {
  area: string;
  currentLevel: "positive" | "neutral" | "concern";
  projectedImpact: "positive" | "neutral" | "negative";
  detail: string;
  mitigation: string;
}

interface ImpactAssessment {
  id: string;
  referralName: string;
  referralAge: number;
  referralGender: string;
  referralAuthority: string;
  date: string;
  status: Status;
  assessor: string;
  impactOnExisting: ImpactArea[];
  impactOnReferral: ImpactArea[];
  overallRecommendation: "proceed" | "proceed_with_conditions" | "decline" | "further_info";
  conditions: string[];
  rationale: string;
  panelDate: string | null;
  panelOutcome: string | null;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: ImpactAssessment[] = [
  {
    id: "ia_1", referralName: "Child R", referralAge: 14, referralGender: "Male",
    referralAuthority: "Birmingham City Council",
    date: d(-21), status: "approved", assessor: "staff_darren",
    impactOnExisting: [
      { area: "Alex — emotional stability", currentLevel: "concern", projectedImpact: "neutral", detail: "Alex is currently managing social media-related anxiety. A new admission may add to feelings of insecurity initially.", mitigation: "Enhanced key work support for Alex. Clear introduction plan. Alex's views sought and considered." },
      { area: "Jordan — settling in", currentLevel: "positive", projectedImpact: "neutral", detail: "Jordan is well-settled and secure. May initially feel anxious about a new young person but has adapted well before.", mitigation: "Jordan prepared in advance. Choice in how to welcome new YP. Extra check-ins during settling period." },
      { area: "Casey — anxiety management", currentLevel: "concern", projectedImpact: "negative", detail: "Casey's anxiety could be triggered by disruption to routine. A new admission brings inevitable change.", mitigation: "CAMHS consulted and supportive. Extra session scheduled around admission. Casey involved in age-appropriate way." },
      { area: "Group dynamics", currentLevel: "positive", projectedImpact: "neutral", detail: "Current group is stable and positive. New young person's profile suggests potential compatibility.", mitigation: "Careful phased introduction. Supervised shared activities initially. Staff to monitor dynamics closely." },
    ],
    impactOnReferral: [
      { area: "Emotional needs", currentLevel: "concern", projectedImpact: "positive", detail: "Child R has experienced multiple placement breakdowns. Oak House's therapeutic approach is well-suited.", mitigation: "Detailed settling-in plan. Consistent key worker allocated. Trauma-informed approach from day one." },
      { area: "Education", currentLevel: "concern", projectedImpact: "positive", detail: "Currently not in education. Local provision identified and available to accept within 2 weeks.", mitigation: "Education placement confirmed. PEP meeting arranged within first week." },
      { area: "Peer relationships", currentLevel: "neutral", projectedImpact: "positive", detail: "Child R's age (14) fits within the current group (13-16). Interests overlap with existing young people.", mitigation: "Shared activities planned. Gradual integration into house routines." },
    ],
    overallRecommendation: "proceed_with_conditions",
    conditions: [
      "Enhanced staffing for first 2 weeks of placement",
      "CAMHS support confirmed for Casey prior to admission",
      "Education placement secured before admission date",
      "Phased introduction — visits before overnight stay",
    ],
    rationale: "Child R's profile is compatible with the current group. The therapeutic model at Oak House is well-suited to their needs. While there are manageable risks to existing placements, these can be mitigated with the conditions outlined. The benefit to Child R of a stable, therapeutic placement outweighs the temporary adjustment period for existing young people.",
    panelDate: d(-14), panelOutcome: "Approved with conditions — all conditions met as of admission date.",
    notes: "Strong referral. Good match for the home. All existing YP prepared and supportive. Conditions met before admission.",
  },
  {
    id: "ia_2", referralName: "Child S", referralAge: 11, referralGender: "Female",
    referralAuthority: "Solihull Council",
    date: d(-7), status: "declined", assessor: "staff_darren",
    impactOnExisting: [
      { area: "All current YP — age gap", currentLevel: "positive", projectedImpact: "negative", detail: "Current age range is 13-16. An 11-year-old would be significantly younger, creating potential vulnerability and safeguarding concerns.", mitigation: "Limited mitigation available — age gap is a structural issue." },
      { area: "Group dynamics", currentLevel: "positive", projectedImpact: "negative", detail: "Existing group has teenage dynamic. An 11-year-old would struggle to integrate at the same level.", mitigation: "Would require significant adaptation of routines and activities." },
    ],
    impactOnReferral: [
      { area: "Developmental needs", currentLevel: "concern", projectedImpact: "negative", detail: "Child S's developmental stage would mean they're isolated from peer group within the home. This is not in their best interest.", mitigation: "A home with younger age range would be more appropriate." },
    ],
    overallRecommendation: "decline",
    conditions: [],
    rationale: "While Child S clearly needs a stable placement, Oak House is not the right match. The age gap between Child S (11) and the current young people (13-16) would create safeguarding vulnerabilities and prevent appropriate peer relationships within the home. Child S would be better placed in a home with a younger age profile where they can develop age-appropriate friendships and be cared for alongside developmental peers.",
    panelDate: null, panelOutcome: null,
    notes: "Declined with full rationale shared with placing authority. Offered to share our assessment to support their matching process. No suitable home identified yet for Child S — concerning.",
  },
  {
    id: "ia_3", referralName: "Child T", referralAge: 15, referralGender: "Male",
    referralAuthority: "Coventry City Council",
    date: d(-2), status: "in_progress", assessor: "staff_darren",
    impactOnExisting: [
      { area: "Alex — peer relationship", currentLevel: "concern", projectedImpact: "neutral", detail: "Similar age and interests. Potential for positive friendship. However, Child T has a history of peer influence concerns that need consideration.", mitigation: "Supervised activities initially. Clear boundaries on peer influence risks. Key worker awareness." },
      { area: "Staff capacity", currentLevel: "neutral", projectedImpact: "negative", detail: "Current staffing is at capacity for 3 YP. A 4th would require additional recruitment or agency cover initially.", mitigation: "Recruitment already in progress. Agency staff identified as temporary cover." },
    ],
    impactOnReferral: [
      { area: "Stability", currentLevel: "concern", projectedImpact: "positive", detail: "Child T has had 3 placements in 2 years. Needs stability. Oak House's track record of placement stability is strong.", mitigation: "Detailed stability plan. RM-led settling-in process." },
    ],
    overallRecommendation: "further_info",
    conditions: [],
    rationale: "Promising referral but requires further information. Need clarity on: (1) nature and extent of peer influence concerns, (2) full details of previous placement breakdowns, (3) current CAMHS involvement and recommendations. Staffing capacity also needs resolving before proceeding to panel.",
    panelDate: null, panelOutcome: null,
    notes: "Requested additional information from placing authority. Awaiting response. Staffing solution being worked on in parallel.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function ImpactAssessmentsPage() {
  const [assessments] = useState<ImpactAssessment[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...assessments];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.referralName.toLowerCase().includes(q) ||
          a.referralAuthority.toLowerCase().includes(q) ||
          a.rationale.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "status": return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
        case "name": return a.referralName.localeCompare(b.referralName);
        default: return 0;
      }
    });
    return list;
  }, [assessments, search, filterStatus, sortBy]);

  const total = assessments.length;
  const approved = assessments.filter((a) => a.status === "approved").length;
  const declined = assessments.filter((a) => a.status === "declined").length;
  const inProgress = assessments.filter((a) => a.status === "in_progress" || a.status === "draft").length;

  const REC_LABELS: Record<string, string> = {
    proceed: "Proceed", proceed_with_conditions: "Proceed with Conditions",
    decline: "Decline", further_info: "Further Info Required",
  };
  const REC_COLORS: Record<string, string> = {
    proceed: "bg-green-100 text-green-800", proceed_with_conditions: "bg-blue-100 text-blue-800",
    decline: "bg-red-100 text-red-800", further_info: "bg-yellow-100 text-yellow-800",
  };

  const exportCols: ExportColumn<ImpactAssessment>[] = [
    { header: "ID", accessor: (r: ImpactAssessment) => r.id },
    { header: "Referral Name", accessor: (r: ImpactAssessment) => r.referralName },
    { header: "Age", accessor: (r: ImpactAssessment) => r.referralAge },
    { header: "Gender", accessor: (r: ImpactAssessment) => r.referralGender },
    { header: "Authority", accessor: (r: ImpactAssessment) => r.referralAuthority },
    { header: "Date", accessor: (r: ImpactAssessment) => r.date },
    { header: "Status", accessor: (r: ImpactAssessment) => STATUS_LABELS[r.status] },
    { header: "Assessor", accessor: (r: ImpactAssessment) => getStaffName(r.assessor) },
    { header: "Recommendation", accessor: (r: ImpactAssessment) => REC_LABELS[r.overallRecommendation] },
    { header: "Conditions", accessor: (r: ImpactAssessment) => r.conditions.join("; ") },
    { header: "Rationale", accessor: (r: ImpactAssessment) => r.rationale },
    { header: "Panel Date", accessor: (r: ImpactAssessment) => r.panelDate ?? "N/A" },
    { header: "Panel Outcome", accessor: (r: ImpactAssessment) => r.panelOutcome ?? "N/A" },
    { header: "Notes", accessor: (r: ImpactAssessment) => r.notes },
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
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
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
                      <p className="font-medium">{assessment.referralName} (Age {assessment.referralAge}, {assessment.referralGender})</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {assessment.date} · {assessment.referralAuthority} · {getStaffName(assessment.assessor)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", REC_COLORS[assessment.overallRecommendation])}>
                      {REC_LABELS[assessment.overallRecommendation]}
                    </Badge>
                    <Badge className={cn("text-xs", STATUS_COLORS[assessment.status])}>
                      {STATUS_LABELS[assessment.status]}
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
                        {assessment.impactOnExisting.map((area: ImpactArea, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                            area.projectedImpact === "positive" ? "bg-green-50 border-green-200" :
                            area.projectedImpact === "negative" ? "bg-red-50 border-red-200" :
                            "bg-white"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{area.area}</span>
                              <Badge variant="outline" className="text-xs">
                                Impact: {area.projectedImpact}
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
                        <p className="text-sm font-medium">Impact on Referral ({assessment.referralName})</p>
                      </div>
                      <div className="space-y-2">
                        {assessment.impactOnReferral.map((area: ImpactArea, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                            area.projectedImpact === "positive" ? "bg-green-50 border-green-200" :
                            area.projectedImpact === "negative" ? "bg-red-50 border-red-200" :
                            "bg-white"
                          )}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{area.area}</span>
                              <Badge variant="outline" className="text-xs">
                                Impact: {area.projectedImpact}
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
                    {(assessment.panelDate || assessment.panelOutcome) && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">Panel Decision</p>
                        {assessment.panelDate && <p className="text-sm">Date: {assessment.panelDate}</p>}
                        {assessment.panelOutcome && <p className="text-sm">{assessment.panelOutcome}</p>}
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
