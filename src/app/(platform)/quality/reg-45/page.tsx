"use client";

import { useState, useMemo, useEffect } from "react";
import { useReg45Reviews, useUpdateReg45Review, useReg45Evidence } from "@/hooks/use-intelligence-layer";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
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
  draft: "bg-slate-100 text-[var(--cs-text-secondary)]",
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
  not_started: "bg-slate-100 text-[var(--cs-text-muted)]",
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

/* ── demo data (now served by /api/intelligence/reg45 fallback store) ──────── */


/* ── evidence data (served by /api/intelligence/reg45-evidence) ───────────── */

interface EvidenceItem {
  category: string;
  count: number;
  examples: string[];
}


/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg45Page() {
  const [reviews, setReviews] = useState<Reg45Review[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<string>("r1");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useReg45Reviews();
  const { data: evidenceData } = useReg45Evidence({ homeId: "home_oak" });
  const updateReview = useUpdateReg45Review();

  useEffect(() => {
    if (apiData?.persisted && Array.isArray(apiData.reviews)) {
      setReviews((apiData.reviews as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        homeId: row.home_id as string,
        periodStart: row.period_start as string,
        periodEnd: row.period_end as string,
        status: row.status as Reg45Status,
        qualityOfCareSummary: (row.quality_of_care_summary as string) ?? undefined,
        childrenExperiencesSummary: (row.children_experiences_summary as string) ?? undefined,
        outcomesSummary: (row.outcomes_summary as string) ?? undefined,
        safeguardingSummary: (row.safeguarding_summary as string) ?? undefined,
        leadershipSummary: (row.leadership_summary as string) ?? undefined,
        strengths: (row.strengths as string) ?? undefined,
        weaknesses: (row.weaknesses as string) ?? undefined,
        improvementActions: (row.improvement_actions as string) ?? undefined,
        childrenViews: (row.children_views as string) ?? undefined,
        parentsViews: (row.parents_views as string) ?? undefined,
        placingAuthorityViews: (row.placing_authority_views as string) ?? undefined,
        staffViews: (row.staff_views as string) ?? undefined,
        generatedBy: (row.generated_by as string) ?? undefined,
        approvedBy: (row.approved_by as string) ?? undefined,
        approvedAt: (row.approved_at as string) ?? undefined,
        createdAt: (row.created_at as string) ?? "",
        updatedAt: ((row.updated_at as string) ?? (row.created_at as string)) ?? "",
      })));
    }
  }, [apiData]);

  useEffect(() => {
    if (evidenceData?.persisted && Array.isArray(evidenceData.evidence)) {
      setEvidence((evidenceData.evidence as Record<string, unknown>[]).map((row) => ({
        category: row.category as string,
        count: (row.count as number) ?? 0,
        examples: (row.examples as string[]) ?? [],
      })));
    }
  }, [evidenceData]);
  const [showEvidence, setShowEvidence] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["qualityOfCareSummary", "childrenExperiencesSummary"]));

  const selectedReview = useMemo(
    () => reviews.find((r) => r.id === selectedReviewId) ?? reviews[0],
    [reviews, selectedReviewId],
  );

  if (!selectedReview) {
    return (
      <PageShell
        title="Regulation 45 — Quality of Care Review"
        subtitle="Six-Monthly Quality Review  ·  Responsible Individual Oversight"
        caraContext={{ pageTitle: "Regulation 45 Reports", sourceType: "reg45" }}
      >
        <EmptyState
          icon={FileText}
          title="Loading reviews…"
          description="Fetching Reg 45 reviews from the intelligence layer."
        />
      </PageShell>
    );
  }

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
      caraContext={{ pageTitle: "Regulation 45 Reports", sourceType: "reg45" }}
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
          <CaraStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
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
            <p className="text-sm font-medium text-[var(--cs-text-secondary)]">Review Completion</p>
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
              <Circle className="h-3 w-3 text-[var(--cs-text-muted)]" />
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
              <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-3 flex items-center gap-2">
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
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--cs-surface)] transition-colors"
                        onClick={() => toggleSection(section.key)}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          <div>
                            <p className="text-sm font-medium text-[var(--cs-navy)]">{section.label}</p>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", SECTION_STATUS_CLR[status])}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status === "not_started" ? "Not Started" : status === "in_progress" ? "In Progress" : "Complete"}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 border-t border-[var(--cs-border-subtle)]">
                          {content ? (
                            <div className="mt-3">
                              <div className="bg-slate-50 rounded-lg p-3 text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">
                                {content}
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {isDraft && (
                                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                    <Sparkles className="h-3 w-3" />
                                    Request Cara Draft
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
                                  Request Cara Draft
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
              <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-3 flex items-center gap-2">
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
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--cs-surface)] transition-colors"
                        onClick={() => toggleSection(section.key)}
                      >
                        <div className="flex items-center gap-3">
                          <section.icon className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          <div>
                            <p className="text-sm font-medium text-[var(--cs-navy)]">{section.label}</p>
                            <p className="text-xs text-muted-foreground">{section.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", SECTION_STATUS_CLR[status])}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status === "not_started" ? "Not Started" : status === "in_progress" ? "In Progress" : "Complete"}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 border-t border-[var(--cs-border-subtle)]">
                          {content ? (
                            <div className="mt-3">
                              <div className="bg-slate-50 rounded-lg p-3 text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">
                                {content}
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                {isDraft && (
                                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                    <Sparkles className="h-3 w-3" />
                                    Request Cara Draft
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
                                  Request Cara Draft
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
                  <ArrowRight className="h-4 w-4 text-[var(--cs-text-muted)]" />
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
                      {i < 4 && <ArrowRight className="h-3 w-3 text-[var(--cs-text-gentle)]" />}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium">Draft:</span> Manager is building the review, adding content and evidence links.</p>
                  <p><span className="font-medium">In Progress:</span> Actively being written with Cara assistance and stakeholder input.</p>
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
                <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Evidence for This Period</h3>
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
                description="Click 'Pull Evidence' to see what evidence exists for this review period. Cara can link evidence items to review sections automatically."
                actions={[{ label: "Pull Evidence", icon: Link2, onClick: () => setShowEvidence(true) }]}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evidence.map((item) => (
                  <Card key={item.category}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[var(--cs-navy)]">{item.category}</p>
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
                      <p className="text-sm font-medium text-indigo-800">Cara Evidence Linking</p>
                      <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                        Cara can automatically suggest evidence links for each section of the review based on the records from this period. Evidence items are tagged to relevant judgement areas (Quality of Care, Help &amp; Protection, Leadership &amp; Management) and linked to specific review sections.
                      </p>
                      <Button size="sm" className="mt-3 gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white">
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
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-3">Previous Reviews</h3>
          <div className="space-y-2">
            {reviews.filter((r) => r.id !== "r1").map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setSelectedReviewId(r.id)}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />
                      <div>
                        <p className="text-sm font-medium text-[var(--cs-navy)]">
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
      <CaraPanel
        mode="assist"
        pageContext="Regulation 45 Reports — six-monthly quality reviews, responsible individual reports, evidence bank, children's views, outcomes evidence, improvement actions, Ofsted readiness, statutory compliance"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}
