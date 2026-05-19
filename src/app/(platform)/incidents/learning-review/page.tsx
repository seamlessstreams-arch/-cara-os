"use client";

import React, { useState, useEffect } from "react";
import { useLearningReviews, useUpdateLearningReview } from "@/hooks/use-intelligence-layer";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Shield,
  UserCheck,
  Send,
  XCircle,
  MessageSquare,
  Search,
  Brain,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ReviewStatus = "required" | "in_progress" | "completed";

interface Incident {
  id: string;
  date: string;
  title: string;
  child: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  staffInvolved: string[];
  reviewStatus: ReviewStatus;
  managerNotes: string;
  learningSummary: string;
}

interface ReviewPrompt {
  id: string;
  label: string;
  checked: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-blue-100 text-blue-800" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800" },
};

const STATUS_META: Record<ReviewStatus, { label: string; color: string; icon: React.ReactNode }> = {
  required: { label: "Review Required", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: <Clock className="h-3.5 w-3.5" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

// ── Demo Data ────────────────────────────────────────────────────────────────


const DEFAULT_PROMPTS: ReviewPrompt[] = [
  { id: "risk", label: "Risk assessment needs updating?", checked: false },
  { id: "placement", label: "Placement plan needs updating?", checked: false },
  { id: "keywork", label: "Child needs key work?", checked: false },
  { id: "debrief", label: "Staff needs debrief?", checked: false },
  { id: "ri", label: "RI needs notification?", checked: false },
  { id: "external", label: "External notification required?", checked: false },
  { id: "safeguarding", label: "Safeguarding concern?", checked: false },
  { id: "pattern", label: "Pattern detected?", checked: false },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function IncidentLearningReviewPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Record<string, ReviewPrompt[]>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);

  /* ── API hook (live data via intelligence-layer fallback store) ─────────── */
  const { data: apiData } = useLearningReviews();
  const updateReview = useUpdateLearningReview();

  useEffect(() => {
    if (apiData?.persisted && Array.isArray(apiData.reviews)) {
      setIncidents((apiData.reviews as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        date: ((row.incident_date as string) ?? (row.created_at as string)) ?? "",
        title: ((row.incident_title as string) ?? (row.incident_id as string)) ?? "",
        child: (row.child_id as string) ?? "",
        category: (row.incident_category as string) ?? "",
        severity: ((row.severity as Incident["severity"]) ?? "medium"),
        summary: ((row.summary as string) ?? (row.trigger_analysis as string)) ?? "",
        staffInvolved: (row.staff_involved as string[]) ?? [],
        reviewStatus: (row.review_status as ReviewStatus) ?? "required",
        managerNotes: (row.manager_notes as string) ?? "",
        learningSummary: (row.learning_summary as string) ?? "",
      })));
    }
  }, [apiData]);
  const [managerNotes, setManagerNotes] = useState<Record<string, string>>({});
  const [learningSummaries, setLearningSummaries] = useState<Record<string, string>>({});
  const [ariaAnalysis, setAriaAnalysis] = useState<Record<string, boolean>>({});
  const [nfaRationale, setNfaRationale] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getPrompts = (incidentId: string): ReviewPrompt[] => {
    return prompts[incidentId] || DEFAULT_PROMPTS.map((p) => ({ ...p }));
  };

  const togglePrompt = (incidentId: string, promptId: string) => {
    const current = getPrompts(incidentId);
    const updated = current.map((p) =>
      p.id === promptId ? { ...p, checked: !p.checked } : p
    );
    setPrompts({ ...prompts, [incidentId]: updated });
  };

  const filteredIncidents =
    statusFilter === "all"
      ? incidents
      : incidents.filter((i) => i.reviewStatus === statusFilter);

  return (
    <PageShell
      title="Incident Learning Review"
      subtitle="Review incidents, identify patterns, and capture organisational learning"
      ariaContext={{ pageTitle: "Incident Learning Review", sourceType: "incident" }}
      actions={<AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />}
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Incidents</SelectItem>
              <SelectItem value="required">Review Required</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">
            {filteredIncidents.filter((i) => i.reviewStatus === "required").length} awaiting review
          </Badge>
        </div>

        {/* Incidents List */}
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const isExpanded = expandedId === incident.id;
            const currentPrompts = getPrompts(incident.id);
            const currentNotes = managerNotes[incident.id] ?? incident.managerNotes;
            const currentLearning = learningSummaries[incident.id] ?? incident.learningSummary;
            const currentNfa = nfaRationale[incident.id] ?? "";
            const showAria = ariaAnalysis[incident.id] ?? false;

            return (
              <Card key={incident.id} className={cn(isExpanded && "ring-2 ring-blue-200")}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-sm">{incident.title}</CardTitle>
                        <Badge className={cn("text-xs", SEVERITY_META[incident.severity].color)}>
                          {SEVERITY_META[incident.severity].label}
                        </Badge>
                        <Badge className={cn("text-xs flex items-center gap-1", STATUS_META[incident.reviewStatus].color)}>
                          {STATUS_META[incident.reviewStatus].icon}
                          {STATUS_META[incident.reviewStatus].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(incident.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span>{incident.child}</span>
                        <span>{incident.category}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6 border-t pt-4">
                    {/* Incident Summary */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Incident Summary
                      </h4>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                        {incident.summary}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Staff involved: {incident.staffInvolved.join(", ")}
                      </div>
                    </div>

                    {/* Manager Oversight */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-500" />
                        Manager Oversight
                      </h4>
                      <textarea
                        className="w-full min-h-[100px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Record your oversight notes, observations, and follow-up actions..."
                        value={currentNotes}
                        onChange={(e) =>
                          setManagerNotes({ ...managerNotes, [incident.id]: e.target.value })
                        }
                      />
                    </div>

                    {/* ARIA Analysis */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        ARIA Analysis
                      </h4>
                      {!showAria ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAriaAnalysis({ ...ariaAnalysis, [incident.id]: true })
                          }
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Request ARIA Analysis
                        </Button>
                      ) : (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3">
                          <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                            ARIA suggested analysis
                          </Badge>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-xs font-semibold text-indigo-900 mb-1">Trigger Analysis</h5>
                              <p className="text-sm text-indigo-800">
                                The incident appears to have been triggered by a boundary being enforced around screen time. Historical data shows 3 similar incidents in the past 6 weeks, all occurring during evening transition periods.
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-indigo-900 mb-1">What Worked</h5>
                              <p className="text-sm text-indigo-800">
                                Staff attempted verbal de-escalation for 8 minutes before intervening. The use of a calm, low tone and offering choices showed good practice. Post-incident recovery was swift.
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-indigo-900 mb-1">What Didn&apos;t Work</h5>
                              <p className="text-sm text-indigo-800">
                                The initial boundary delivery may have felt abrupt. Consider whether a 5-minute warning system could prevent the escalation trigger entirely.
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-indigo-900 mb-1">Impact on Child</h5>
                              <p className="text-sm text-indigo-800">
                                Child demonstrated ability to recover and reflect (apology next morning). However, repeated physical interventions may affect trust in staff relationships. Recommend key work session within 48 hours.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Smart Review Prompts */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-4 w-4 text-amber-500" />
                        Review Prompts
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {currentPrompts.map((prompt) => (
                          <label
                            key={prompt.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md border text-sm cursor-pointer transition-colors",
                              prompt.checked
                                ? "bg-amber-50 border-amber-200"
                                : "hover:bg-gray-50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={prompt.checked}
                              onChange={() => togglePrompt(incident.id, prompt.id)}
                              className="rounded border-gray-300"
                            />
                            <span>{prompt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Brain className="h-4 w-4 text-green-500" />
                        Actions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Create Key Work Task
                        </Button>
                        <Button variant="outline" size="sm">
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Create Debrief Task
                        </Button>
                        <Button variant="outline" size="sm">
                          <Shield className="h-3.5 w-3.5 mr-1" />
                          Review Risk Assessment
                        </Button>
                        <Button variant="outline" size="sm">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          Escalate to RI
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentNfa.length < 30}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              updateReview.mutate({
                                id: incident.id,
                                homeId: "home_oak",
                                reviewStatus: "completed",
                                learningSummary: `NFA: ${currentNfa}`,
                              });
                              setIncidents((prev) =>
                                prev.map((i) => i.id === incident.id ? { ...i, reviewStatus: "completed" } : i)
                              );
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Mark No Further Action
                          </Button>
                          {currentNfa.length < 30 && (
                            <span className="text-xs text-muted-foreground">
                              Requires 30+ character rationale ({currentNfa.length}/30)
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
                          placeholder="Rationale for no further action (minimum 30 characters)..."
                          value={currentNfa}
                          onChange={(e) =>
                            setNfaRationale({ ...nfaRationale, [incident.id]: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* Learning Summary */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Learning Summary
                      </h4>
                      <textarea
                        className="w-full min-h-[80px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-purple-200"
                        placeholder="Capture the key learning from this incident..."
                        value={currentLearning}
                        onChange={(e) =>
                          setLearningSummaries({
                            ...learningSummaries,
                            [incident.id]: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-2 border-t">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          updateReview.mutate({
                            id: incident.id,
                            homeId: "home_oak",
                            reviewStatus: "in_progress" as ReviewStatus,
                            learningSummary: currentLearning,
                          });
                          setIncidents((prev) =>
                            prev.map((i) => i.id === incident.id ? { ...i, reviewStatus: "in_progress" as ReviewStatus } : i)
                          );
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit for Approval
                      </Button>
                    </div>
                  </CardContent>
                )}

                {/* Smart Links for this incident */}
                {expandedId === incident.id && (
                  <div className="px-6 pb-4">
                    <SmartLinkPanel
                      sourceType="incident"
                      sourceId={incident.id}
                      homeId="oak-house"
                      childId={incident.child ? "child-a" : undefined}
                      severity={incident.severity}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Incident Learning Review — post-incident analysis, organisational learning, pattern recognition, preventative actions, staff debrief, quality improvement, Reg 45 evidence"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}
