"use client";

import React, { useState, useEffect } from "react";
import { useProgressGoals, useProgressEntries, useProgressSnapshots, useCreateProgressRecord } from "@/hooks/use-intelligence-layer";
import { SmartLinkBadge } from "@/components/intelligence/smart-link-panel";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
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
  Target,
  TrendingUp,
  Calendar,
  Plus,
  BookOpen,
  Heart,
  Users,
  Star,
  Shield,
  Activity,
  Brain,
  Sparkles,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ProgressArea =
  | "education"
  | "health"
  | "emotional_wellbeing"
  | "safety"
  | "relationships"
  | "family_time"
  | "independence"
  | "behaviour_support"
  | "identity"
  | "wishes_and_feelings"
  | "community"
  | "placement_stability";

type GoalStatus = "on_track" | "at_risk" | "achieved" | "not_started";

interface Goal {
  id: string;
  title: string;
  area: ProgressArea;
  status: GoalStatus;
  targetDate: string;
  description: string;
  progress: number;
}

interface ProgressEntry {
  id: string;
  date: string;
  area: ProgressArea;
  description: string;
  impactNote: string;
  staffMember: string;
}

interface OutcomeScore {
  domain: string;
  score: number;
  previousScore: number;
  trend: "up" | "down" | "stable";
}

// ── Constants ────────────────────────────────────────────────────────────────

const AREA_META: Record<ProgressArea, { label: string; color: string; icon: React.ReactNode }> = {
  education: { label: "Education", color: "bg-blue-100 text-blue-800", icon: <BookOpen className="h-3.5 w-3.5" /> },
  health: { label: "Health", color: "bg-green-100 text-green-800", icon: <Activity className="h-3.5 w-3.5" /> },
  emotional_wellbeing: { label: "Emotional Wellbeing", color: "bg-purple-100 text-purple-800", icon: <Heart className="h-3.5 w-3.5" /> },
  safety: { label: "Safety", color: "bg-red-100 text-red-800", icon: <Shield className="h-3.5 w-3.5" /> },
  relationships: { label: "Relationships", color: "bg-pink-100 text-pink-800", icon: <Users className="h-3.5 w-3.5" /> },
  family_time: { label: "Family Time", color: "bg-orange-100 text-orange-800", icon: <Users className="h-3.5 w-3.5" /> },
  independence: { label: "Independence", color: "bg-amber-100 text-amber-800", icon: <Star className="h-3.5 w-3.5" /> },
  behaviour_support: { label: "Behaviour Support", color: "bg-rose-100 text-rose-800", icon: <Brain className="h-3.5 w-3.5" /> },
  identity: { label: "Identity", color: "bg-indigo-100 text-indigo-800", icon: <Sparkles className="h-3.5 w-3.5" /> },
  wishes_and_feelings: { label: "Wishes & Feelings", color: "bg-sky-100 text-sky-800", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  community: { label: "Community", color: "bg-teal-100 text-teal-800", icon: <Users className="h-3.5 w-3.5" /> },
  placement_stability: { label: "Placement Stability", color: "bg-slate-100 text-[var(--cs-navy)]", icon: <Shield className="h-3.5 w-3.5" /> },
};

const STATUS_META: Record<GoalStatus, { label: string; color: string }> = {
  on_track: { label: "On Track", color: "bg-green-100 text-green-800" },
  at_risk: { label: "At Risk", color: "bg-amber-100 text-amber-800" },
  achieved: { label: "Achieved", color: "bg-blue-100 text-blue-800" },
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800" },
};

const CHILDREN = [
  { id: "child-a", name: "Child A" },
  { id: "child-b", name: "Child B" },
  { id: "child-c", name: "Child C" },
];

// ── Demo Data ────────────────────────────────────────────────────────────────
// Seed data now lives in src/lib/intelligence/fallback-store.ts and is served
// via /api/intelligence/progress. The page renders an empty state until the
// API responds.

// ── Component ────────────────────────────────────────────────────────────────

export default function ChildProgressPage() {
  const [selectedChild, setSelectedChild] = useState("child-a");
  const [showCaraDraft, setShowCaraDraft] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeScore[]>([]);

  /* ── API hooks (live data via intelligence-layer fallback store) ───────── */
  const { data: goalsData } = useProgressGoals(selectedChild);
  const { data: entriesData } = useProgressEntries(selectedChild);
  const { data: snapshotsData } = useProgressSnapshots(selectedChild);
  const createRecord = useCreateProgressRecord();

  useEffect(() => {
    if (goalsData?.persisted && Array.isArray(goalsData.data)) {
      setGoals((goalsData.data as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        title: (row.title as string) ?? "",
        area: (row.goal_area as ProgressArea) ?? "education",
        status: ((row.status as GoalStatus) ?? "on_track"),
        targetDate: (row.target_date as string) ?? "",
        description: (row.description as string) ?? "",
        progress: (row.progress as number) ?? 0,
      })));
    }
  }, [goalsData]);

  useEffect(() => {
    if (entriesData?.persisted && Array.isArray(entriesData.data)) {
      setProgressEntries((entriesData.data as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        date: (row.entry_date as string) ?? "",
        area: (row.area as ProgressArea) ?? "education",
        description: (row.what_happened as string) ?? "",
        impactNote: (row.impact_on_child as string) ?? "",
        staffMember: ((row.staff_member as string) ?? (row.created_by as string)) ?? "",
      })));
    }
  }, [entriesData]);

  useEffect(() => {
    if (snapshotsData?.persisted && Array.isArray(snapshotsData.data) && snapshotsData.data.length > 0) {
      const row = snapshotsData.data[0] as Record<string, unknown>;
      const trend = (key: string): "up" | "down" | "stable" => {
        const v = row[key];
        return v === "up" || v === "down" ? v : "stable";
      };
      setOutcomes([
        { domain: "Education", score: (row.education_score as number) ?? 0, previousScore: (row.education_previous_score as number) ?? 0, trend: trend("education_trend") },
        { domain: "Health", score: (row.health_score as number) ?? 0, previousScore: (row.health_previous_score as number) ?? 0, trend: trend("health_trend") },
        { domain: "Emotional Wellbeing", score: (row.emotional_wellbeing_score as number) ?? 0, previousScore: (row.emotional_wellbeing_previous_score as number) ?? 0, trend: trend("emotional_wellbeing_trend") },
        { domain: "Safety", score: (row.safety_score as number) ?? 0, previousScore: (row.safety_previous_score as number) ?? 0, trend: trend("safety_trend") },
        { domain: "Relationships", score: (row.relationships_score as number) ?? 0, previousScore: (row.relationships_previous_score as number) ?? 0, trend: trend("relationships_trend") },
        { domain: "Independence", score: (row.independence_score as number) ?? 0, previousScore: (row.independence_previous_score as number) ?? 0, trend: trend("independence_trend") },
        { domain: "Engagement", score: (row.engagement_score as number) ?? 0, previousScore: (row.engagement_previous_score as number) ?? 0, trend: trend("engagement_trend") },
      ]);
    }
  }, [snapshotsData]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-blue-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <ChevronRight className="h-4 w-4 text-gray-400" />;
  };

  return (
    <PageShell
      title="Progress & Outcomes"
      subtitle="Track goals, milestones, and outcome scores over time"
      caraContext={{ pageTitle: "Progress & Outcomes", sourceType: "care_plan" }}
      actions={<CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />}
    >
      <div className="space-y-6">
        {/* Child Selector & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {CHILDREN.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={createRecord.isPending}
              onClick={() => createRecord.mutate({
                childId: selectedChild,
                homeId: "oak-house",
                recordType: "goal",
                title: "New Goal",
                goalArea: "general",
              })}
            >
              <Plus className="h-4 w-4 mr-1" />
              {createRecord.isPending ? "Creating..." : "Add Goal"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={createRecord.isPending}
              onClick={() => createRecord.mutate({
                childId: selectedChild,
                homeId: "oak-house",
                recordType: "entry",
                title: "New Progress Entry",
              })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Progress Entry
            </Button>
          </div>
        </div>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="border rounded-lg p-4 space-y-3 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm leading-tight">{goal.title}</h4>
                    <Badge className={cn("text-xs shrink-0", STATUS_META[goal.status].color)}>
                      {STATUS_META[goal.status].label}
                    </Badge>
                  </div>
                  <Badge className={cn("text-xs", AREA_META[goal.area].color)}>
                    {AREA_META[goal.area].label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          goal.status === "achieved"
                            ? "bg-blue-500"
                            : goal.status === "at_risk"
                            ? "bg-amber-500"
                            : "bg-green-500"
                        )}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Target: {new Date(goal.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <SmartLinkBadge sourceType="child_progress" sourceId={goal.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outcome Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Outcome Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {outcomes.map((outcome) => (
                <div key={outcome.domain} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{outcome.domain}</span>
                    {getTrendIcon(outcome.trend)}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{outcome.score}</span>
                    <span className="text-xs text-muted-foreground mb-1">/10</span>
                    {outcome.previousScore !== outcome.score && (
                      <span className="text-xs text-muted-foreground mb-1">
                        (was {outcome.previousScore})
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getScoreColor(outcome.score))}
                      style={{ width: `${outcome.score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Progress Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={cn(
                    "relative pl-6 pb-4",
                    idx < progressEntries.length - 1 && "border-l-2 border-gray-200 ml-2"
                  )}
                >
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-400 -translate-x-[7px]" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <Badge className={cn("text-xs", AREA_META[entry.area].color)}>
                        {AREA_META[entry.area].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">by {entry.staffMember}</span>
                    </div>
                    <p className="text-sm">{entry.description}</p>
                    <div className="bg-green-50 border border-green-100 rounded-md p-2">
                      <p className="text-xs text-green-800">
                        <span className="font-medium">Impact: </span>
                        {entry.impactNote}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cara Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Cara Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showCaraDraft ? (
              <Button
                variant="outline"
                onClick={() => setShowCaraDraft(true)}
                className="w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Request Cara Progress Summary
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                    Cara suggested draft
                  </Badge>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-indigo-900">
                    Over the past month, Child A has demonstrated meaningful progress across several
                    domains. Education outcomes have improved significantly, with predicted grades
                    rising from 4 to 5 following consistent tutor engagement. Emotional regulation
                    continues to develop — the independent use of breathing techniques marks a notable
                    shift from reactive to reflective behaviour.
                  </p>
                  <p className="text-sm text-indigo-900">
                    The relationship with maternal grandmother has strengthened through consistent
                    weekly contact, now meeting the established goal. Community engagement has
                    re-emerged through football club participation, providing positive peer interaction
                    outside the home.
                  </p>
                  <p className="text-sm text-indigo-900">
                    Areas for continued focus include independence (morning routine remains staff-prompted)
                    and sustaining the anger management progress beyond the current 5-week period.
                    Overall trajectory is positive with outcome scores improving in 5 of 7 domains.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Copy to Clipboard
                  </Button>
                  <Button size="sm" variant="outline">
                    Add to Report
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <CaraPanel
        mode="assist"
        pageContext="Progress & Outcomes — goals, milestones, outcome scores, SDQ scores, wellbeing measures, educational progress, Reg 45 outcomes evidence, ILACS quality of care evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
