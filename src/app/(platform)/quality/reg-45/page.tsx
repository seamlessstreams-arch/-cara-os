"use client";

import { useState, useMemo, useEffect } from "react";
import { useReg45Reviews, useUpdateReg45Review } from "@/hooks/use-intelligence-layer";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PageShell } from "@/components/layout/page-shell";
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
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Send,
  ThumbsUp,
  Globe,
  Link2,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Heart,
  Target,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reg45Review, Reg45Status } from "@/types/intelligence.layer";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const fmt = (iso: string) => {
  const dt = new Date(iso + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const periodLabel = (start: string, end: string) => {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("en-GB", { month: "short", year: "numeric" })} — ${e.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
};

/* ── status maps ───────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<Reg45Status, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  published: "bg-purple-100 text-purple-800",
};

const STATUS_LABEL: Record<Reg45Status, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  submitted: "Submitted for Approval",
  approved: "Approved",
  published: "Published",
};

type SectionStatus = "not_started" | "in_progress" | "complete";

const SECTION_STATUS_CLR: Record<SectionStatus, string> = {
  not_started: "bg-slate-100 text-slate-500",
  in_progress: "bg-amber-100 text-amber-700",
  complete: "bg-green-100 text-green-700",
};

const SECTION_STATUS_ICON: Record<SectionStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: Clock,
  complete: CheckCircle2,
};

/* ── section config ────────────────────────────────────────────────────────── */

interface ReviewSection {
  key: keyof Reg45Review;
  label: string;
  icon: typeof FileText;
  description: string;
}

const REVIEW_SECTIONS: ReviewSection[] = [
  { key: "qualityOfCareSummary", label: "Quality of Care", icon: Heart, description: "Overall quality of care provided during this review period" },
  { key: "childrenExperiencesSummary", label: "Children's Experiences", icon: MessageSquare, description: "Summary of children's lived experiences and views" },
  { key: "outcomesSummary", label: "Outcomes", icon: Target, description: "Progress against care plans, education, health, and wellbeing outcomes" },
  { key: "safeguardingSummary", label: "Safeguarding", icon: Shield, description: "Safeguarding practice, incidents, and protective factors" },
  { key: "leadershipSummary", label: "Leadership & Management", icon: Users, description: "Effectiveness of leadership, oversight, and governance" },
  { key: "strengths", label: "Strengths", icon: TrendingUp, description: "Key strengths identified during the review period" },
  { key: "weaknesses", label: "Areas for Improvement", icon: AlertTriangle, description: "Weaknesses and areas requiring development" },
  { key: "improvementActions", label: "Improvement Actions", icon: ArrowRight, description: "Planned actions to address identified weaknesses" },
];

const STAKEHOLDER_SECTIONS: ReviewSection[] = [
  { key: "childrenViews", label: "Children's Views", icon: MessageSquare, description: "Direct views and feedback from children and young people" },
  { key: "parentsViews", label: "Parents & Carers Views", icon: Heart, description: "Feedback from parents, family members, and advocates" },
  { key: "placingAuthorityViews", label: "Placing Authority Views", icon: BookOpen, description: "Feedback from social workers and placing local authorities" },
  { key: "staffViews", label: "Staff Views", icon: Users, description: "Views and feedback from the staff team" },
];

/* ── demo data ─────────────────────────────────────────────────────────────── */

const DEMO_REVIEWS: Reg45Review[] = [
  {
    id: "r1",
    homeId: "home_oak",
    periodStart: "2025-11-01",
    periodEnd: "2026-04-30",
    status: "draft",
    qualityOfCareSummary:
      "The quality of care during this period has been consistently good. The home has maintained a warm, nurturing environment where children feel safe and valued. Key-work sessions have been delivered regularly with detailed, child-centred records. Placement plans have been reviewed within timescales and reflect the individual needs of each young person. The home has successfully managed one new admission and one planned move-on during this period.",
    childrenExperiencesSummary:
      "Children report feeling listened to and cared for. The voice-of-the-child system has been embedded successfully with regular contributions from all young people. Children have participated in menu planning, activity choices, and house meetings. One young person raised concerns about contact arrangements which were promptly addressed. All children have expressed that they feel safe in the home.",
    outcomesSummary:
      "Educational outcomes have been positive with school attendance above 92% for all young people. Two children achieved academic milestones. Health assessments are up to date. SDQ scores show improvement for two out of three young people. Independence skills development is ongoing with age-appropriate targets being met.",
    safeguardingSummary: undefined,
    leadershipSummary: undefined,
    strengths:
      "Strong key-working relationships. Consistent staffing team. Excellent partnership working with education providers. Proactive approach to training and development. Children feel genuinely listened to and their views shape practice.",
    weaknesses: undefined,
    improvementActions: undefined,
    childrenViews:
      "All three young people contributed to this review. Key themes include: feeling safe and cared for, wanting more variety in evening activities, appreciation for the camping trip and outdoor activities, positive relationships with key workers. One young person asked for more weekend outings.",
    parentsViews:
      "Two parents contributed via telephone consultation. Both expressed satisfaction with the care provided. One parent praised the communication from the home. Another noted improvements in their child's behaviour since placement.",
    placingAuthorityViews: undefined,
    staffViews:
      "Staff completed anonymous feedback forms. Key themes: feeling well-supported by management, good team dynamics, appreciation for regular supervision, desire for additional training on adolescent mental health, positive about the new voice-of-the-child system.",
    generatedBy: undefined,
    approvedBy: undefined,
    approvedAt: undefined,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-03",
  },
  {
    id: "r2",
    homeId: "home_oak",
    periodStart: "2025-05-01",
    periodEnd: "2025-10-31",
    status: "approved",
    qualityOfCareSummary:
      "Care quality throughout this period was strong and consistent. The home maintained its child-centred ethos with individualised approaches to each young person. Risk assessments were reviewed promptly following incidents. The Statement of Purpose was updated to reflect the current cohort and staffing. All regulatory notifications were made within required timescales.",
    childrenExperiencesSummary:
      "Children reported positive experiences overall. The home introduced a new feedback mechanism which all children engaged with. House meetings were held monthly with actions followed through. One young person successfully transitioned to a semi-independence placement with planned support.",
    outcomesSummary:
      "Education attendance averaged 91%. Health assessments completed within timescales for all children. Two young people commenced therapeutic interventions. SDQ scores stable or improving for all young people. Pathway planning commenced for the eldest young person with good progress on independence skills.",
    safeguardingSummary:
      "Three safeguarding concerns were raised during the period — all were managed appropriately with timely notifications and multi-agency collaboration. LADO threshold was not met on any occasion. Missing episodes remained low (two instances, both under 30 minutes). Return home interviews completed within 72 hours.",
    leadershipSummary:
      "Management oversight has been robust throughout the period. Supervision compliance was 100% with no cancellations by management. The manager completed further development in therapeutic care approaches. The RI conducted regular visits with actions addressed promptly. Ofsted monitoring visit in August 2025 noted continued good practice.",
    strengths:
      "Consistent staff team with low turnover. Robust safeguarding practice. Strong educational outcomes. Effective multi-agency working. Children's voices genuinely influencing practice. Manager oversight visible and embedded.",
    weaknesses:
      "Medication competency training for one staff member delayed. Garden maintenance occasionally falling behind schedule. Evening activity planning could be more varied. Night-shift handover process needed strengthening.",
    improvementActions:
      "1. All staff to achieve medication competency by end of next period. 2. Implement structured evening activity planner. 3. Revise night-shift handover template and provide training. 4. Establish quarterly garden maintenance contract.",
    childrenViews:
      "Children reported feeling safe, cared for, and listened to. They appreciated the variety of activities offered and the support with education. One young person gave positive feedback about their move-on support.",
    parentsViews:
      "All contactable parents expressed satisfaction. Feedback highlighted good communication from the home and visible improvements in children's wellbeing and behaviour.",
    placingAuthorityViews:
      "Three placing authorities provided feedback. All rated the home positively. Key themes: good communication, prompt notification of issues, children making progress, effective partnership working. One authority praised the home's approach to a complex safeguarding concern.",
    staffViews:
      "Staff feedback was positive. Team morale is high. Staff feel supported and valued. Key requests included additional therapeutic training and team-building activities.",
    generatedBy: "Darren Laville",
    approvedBy: "Sarah Mitchell (RI)",
    approvedAt: "2025-11-15",
    createdAt: "2025-10-20",
    updatedAt: "2025-11-15",
  },
];

/* ── evidence data ─────────────────────────────────────────────────────────── */

interface EvidenceItem {
  category: string;
  count: number;
  examples: string[];
}

const DEMO_EVIDENCE: EvidenceItem[] = [
  { category: "Daily Logs", count: 547, examples: ["Positive interactions", "Activity records", "Bedtime routines"] },
  { category: "Key-Work Sessions", count: 36, examples: ["Individual targets", "Child voice recorded", "Progress noted"] },
  { category: "Incident Records", count: 8, examples: ["De-escalation successful", "Debrief completed", "Notification sent"] },
  { category: "Reg 44 Reports", count: 6, examples: ["Monthly visits", "Actions completed", "RI oversight evidenced"] },
  { category: "Supervision Records", count: 24, examples: ["Monthly for all staff", "Safeguarding discussed", "Wellbeing checks"] },
  { category: "Health Assessments", count: 6, examples: ["Initial health", "Review health", "Dental checks"] },
  { category: "Education Records", count: 12, examples: ["PEP reviews", "Attendance data", "Achievement records"] },
  { category: "Voice of the Child", count: 18, examples: ["House meetings", "Wishes & feelings", "Feedback forms"] },
  { category: "Training Records", count: 14, examples: ["Mandatory courses", "Specialist training", "Refreshers"] },
  { category: "Complaints & Compliments", count: 5, examples: ["1 complaint resolved", "4 compliments received"] },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg45Page() {
  const [reviews, setReviews] = useState<Reg45Review[]>(DEMO_REVIEWS);
  const [selectedReviewId, setSelectedReviewId] = useState<string>("r1");
  const [evidence, setEvidence] = useState<EvidenceItem[]>(DEMO_EVIDENCE);

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useReg45Reviews();
  const updateReview = useUpdateReg45Review();

  useEffect(() => {
    if (apiData?.persisted && apiData.reviews.length > 0) {
      setReviews((apiData.reviews as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        homeId: row.home_id as string,
        periodStart: row.period_start as string,
        periodEnd: row.period_end as string,
        status: row.status as Reg45Status,
        qualityOfCareSummary: (row.content as string) ?? undefined,
        childrenExperiencesSummary: undefined,
        outcomesSummary: undefined,
        safeguardingSummary: undefined,
        leadershipSummary: undefined,
        strengths: (row.findings as string) ?? undefined,
        weaknesses: undefined,
        improvementActions: (row.recommendations as string) ?? undefined,
        childrenViews: undefined,
        parentsViews: undefined,
        placingAuthorityViews: undefined,
        staffViews: undefined,
        generatedBy: (row.created_by as string) ?? undefined,
        approvedBy: (row.approved_by as string) ?? undefined,
        approvedAt: (row.approved_at as string) ?? undefined,
        createdAt: row.created_at as string,
        updatedAt: row.created_at as string,
      })));
    }
  }, [apiData]);
  const [showEvidence, setShowEvidence] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["qualityOfCareSummary", "childrenExperiencesSummary"]));

  const selectedReview = useMemo(
    () => reviews.find((r) => r.id === selectedReviewId) ?? reviews[0],
    [reviews, selectedReviewId],
  );

  const isDraft = selectedReview.status === "draft" || selectedReview.status === "in_progress";

  /* calculate section statuses */
  function getSectionStatus(key: keyof Reg45Review): SectionStatus {
    const val = selectedReview[key];
    if (!val || (typeof val === "string" && val.trim() === "")) return "not_started";
    if (typeof val === "string" && val.length < 100) return "in_progress";
    return "complete";
  }

  function getOverallProgress(): { complete: number; inProgress: number; notStarted: number; total: number } {
    const allSections = [...REVIEW_SECTIONS, ...STAKEHOLDER_SECTIONS];
    let complete = 0;
    let inProgress = 0;
    let notStarted = 0;
    for (const s of allSections) {
      const status = getSectionStatus(s.key);
      if (status === "complete") complete++;
      else if (status === "in_progress") inProgress++;
      else notStarted++;
    }
    return { complete, inProgress, notStarted, total: allSections.length };
  }

  const progress = getOverallProgress();

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <PageShell
      title="Regulation 45 — Quality of Care Review"
      subtitle="Six-Monthly Quality Review  ·  Responsible Individual Oversight"
      ariaContext={{ pageTitle: "Evidence not loaded", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          {isDraft && selectedReview.status === "draft" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={updateReview.isPending}
              onClick={() => updateReview.mutate({ id: selectedReview.id, homeId: "oak-house", status: "submitted" })}
            >
              <Send className="h-3.5 w-3.5" />
              {updateReview.isPending ? "Submitting..." : "Submit for Approval"}
            </Button>
          )}
          {selectedReview.status === "submitted" && (
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700"
              disabled={updateReview.isPending}
              onClick={() => updateReview.mutate({ id: selectedReview.id, homeId: "oak-house", status: "approved", approvedBy: "RI" })}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {updateReview.isPending ? "Approving..." : "Approve (RI)"}
            </Button>
          )}
          {selectedReview.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={updateReview.isPending}
              onClick={() => updateReview.mutate({ id: selectedReview.id, homeId: "oak-house", status: "published" })}
            >
              <Globe className="h-3.5 w-3.5" />
              {updateReview.isPending ? "Publishing..." : "Publish"}
            </Button>
          )}
        </div>
      }
    >
      {/* ── period selector ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={selectedReviewId} onValueChange={setSelectedReviewId}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Select review period" />
          </SelectTrigger>
          <SelectContent>
            {reviews.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {periodLabel(r.periodStart, r.periodEnd)} — {STATUS_LABEL[r.status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className={STATUS_CLR[selectedReview.status]}>
          {STATUS_LABEL[selectedReview.status]}
        </Badge>
        {selectedReview.approvedBy && (
          <p className="text-xs text-muted-foreground">
            Approved by {selectedReview.approvedBy} on {fmt(selectedReview.approvedAt!)}
          </p>
        )}
      </div>

      {/* ── progress bar ───────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Review Completion</p>
            <p className="text-sm text-muted-foreground">
              {progress.complete}/{progress.total} sections complete
            </p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.round((progress.complete / progress.total) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {progress.complete} complete
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-600" />
              {progress.inProgress} in progress
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-slate-400" />
              {progress.notStarted} not started
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── tabs for review sections vs evidence ──────────────────────── */}
      <Tabs defaultValue="builder">
        <TabsList className="mb-4">
          <TabsTrigger value="builder" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Review Builder
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Evidence ({evidence.reduce((s, e) => s + e.count, 0)})
          </TabsTrigger>
        </TabsList>

        {/* ── REVIEW BUILDER TAB ─────────────────────────────────────── */}
        <TabsContent value="builder">
          <div className="space-y-6">
            {/* main sections */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Review Sections
              </h3>
              <div className="space-y-3">
                {REVIEW_SECTIONS.map((section) => {
                  const status = getSectionStatus(section.key);
                  const StatusIcon = SECTION_STATUS_ICON[status];
                  const isExpanded = expandedSections.has(section.key);
                  const content = selectedReview[section.key] as string | null | undefined;

                  return (
                    <Card key={section.key} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleSection(section.key)}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{section.label}</p>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", SECTION_STATUS_CLR[status])}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status === "not_started" ? "Not Started" : status === "in_progress" ? "In Progress" : "Complete"}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 border-t border-slate-100">
                          {content ? (
                            <div className="mt-3">
                              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {content}
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {isDraft && (
                                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                    <Sparkles className="h-3 w-3" />
                                    Request Aria Draft
                                  </Button>
                                )}
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Link2 className="h-3 w-3" />
                                  {Math.floor(Math.random() * 12) + 3} evidence links
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-col items-center py-6">
                              <Circle className="h-8 w-8 text-slate-200 mb-2" />
                              <p className="text-xs text-muted-foreground mb-3">This section has not been started yet.</p>
                              {isDraft && (
                                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                  <Sparkles className="h-3 w-3" />
                                  Request Aria Draft
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* stakeholder sections */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Stakeholder Views
              </h3>
              <div className="space-y-3">
                {STAKEHOLDER_SECTIONS.map((section) => {
                  const status = getSectionStatus(section.key);
                  const StatusIcon = SECTION_STATUS_ICON[status];
                  const isExpanded = expandedSections.has(section.key);
                  const content = selectedReview[section.key] as string | null | undefined;

                  return (
                    <Card key={section.key} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => toggleSection(section.key)}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{section.label}</p>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", SECTION_STATUS_CLR[status])}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status === "not_started" ? "Not Started" : status === "in_progress" ? "In Progress" : "Complete"}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 border-t border-slate-100">
                          {content ? (
                            <div className="mt-3">
                              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {content}
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {isDraft && (
                                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                    <Sparkles className="h-3 w-3" />
                                    Request Aria Draft
                                  </Button>
                                )}
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Link2 className="h-3 w-3" />
                                  {Math.floor(Math.random() * 8) + 2} evidence links
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 flex flex-col items-center py-6">
                              <Circle className="h-8 w-8 text-slate-200 mb-2" />
                              <p className="text-xs text-muted-foreground mb-3">No stakeholder views captured yet.</p>
                              {isDraft && (
                                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                  <Sparkles className="h-3 w-3" />
                                  Request Aria Draft
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* status workflow info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                  Review Status Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["draft", "in_progress", "submitted", "approved", "published"] as Reg45Status[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          STATUS_CLR[s],
                          selectedReview.status === s && "ring-2 ring-offset-1 ring-blue-400",
                        )}
                      >
                        {STATUS_LABEL[s]}
                      </Badge>
                      {i < 4 && <ArrowRight className="h-3 w-3 text-slate-300" />}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium">Draft:</span> Manager is building the review, adding content and evidence links.</p>
                  <p><span className="font-medium">In Progress:</span> Actively being written with Aria assistance and stakeholder input.</p>
                  <p><span className="font-medium">Submitted:</span> Manager has completed the review and submitted for RI approval.</p>
                  <p><span className="font-medium">Approved:</span> Responsible Individual has reviewed and approved the document.</p>
                  <p><span className="font-medium">Published:</span> Made available to Ofsted, placing authorities, and stakeholders.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── EVIDENCE TAB ───────────────────────────────────────────────── */}
        <TabsContent value="evidence">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Evidence for This Period</h3>
                <p className="text-xs text-muted-foreground">
                  {periodLabel(selectedReview.periodStart, selectedReview.periodEnd)}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEvidence(!showEvidence)}>
                <Link2 className="h-3.5 w-3.5" />
                Pull Evidence
              </Button>
            </div>

            {!showEvidence ? (
              <EmptyState
                icon={Link2}
                title="Evidence not loaded"
                description="Click 'Pull Evidence' to see what evidence exists for this review period. Aria can link evidence items to review sections automatically."
                actions={[{ label: "Pull Evidence", icon: Link2, onClick: () => setShowEvidence(true) }]}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evidence.map((item) => (
                  <Card key={item.category}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-800">{item.category}</p>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px]">
                          {item.count} records
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.examples.map((ex, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-slate-50">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {showEvidence && (
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-indigo-800">Aria Evidence Linking</p>
                      <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                        Aria can automatically suggest evidence links for each section of the review based on the records from this period. Evidence items are tagged to relevant judgement areas (Quality of Care, Help &amp; Protection, Leadership &amp; Management) and linked to specific review sections.
                      </p>
                      <Button size="sm" className="mt-3 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Sparkles className="h-3 w-3" />
                        Auto-Link Evidence
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── previous reviews summary ───────────────────────────────────── */}
      {selectedReviewId === "r1" && reviews.length > 1 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Previous Reviews</h3>
          <div className="space-y-2">
            {reviews.filter((r) => r.id !== "r1").map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setSelectedReviewId(r.id)}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {periodLabel(r.periodStart, r.periodEnd)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.approvedBy ? `Approved by ${r.approvedBy}` : "Pending approval"}
                          {r.approvedAt && ` on ${fmt(r.approvedAt)}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={STATUS_CLR[r.status]}>
                      {STATUS_LABEL[r.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Smart Links ─────────────────────────────────────────────────── */}
      <div className="mt-6">
        <SmartLinkPanel
          sourceType="reg44_visit"
          sourceId={selectedReview.id}
          homeId="oak-house"
        />
      </div>

      {/* ── regulatory footer ──────────────────────────────────────────── */}
      <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Regulatory Framework</p>
        <p>
          The Children&apos;s Homes (England) Regulations 2015, Regulation 45 requires the Registered Person to review
          the quality of care provided at least every six months. The review must consider children&apos;s views, the
          quality of care against the Statement of Purpose, safeguarding, outcomes for children, leadership effectiveness,
          and any complaints or representations. A written report must be produced, improvements identified, and the report
          made available to Ofsted on request.
        </p>
      </div>
    </PageShell>
  );
}
