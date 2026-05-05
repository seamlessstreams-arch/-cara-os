"use client";

import React, { useState, useEffect } from "react";
import { useProgressGoals, useProgressEntries, useProgressSnapshots, useCreateProgressRecord } from "@/hooks/use-intelligence-layer";
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
  placement_stability: { label: "Placement Stability", color: "bg-slate-100 text-slate-800", icon: <Shield className="h-3.5 w-3.5" /> },
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

const DEMO_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Achieve Grade 5 in English GCSE",
    area: "education",
    status: "on_track",
    targetDate: "2026-08-20",
    description: "Working with tutor twice weekly. Mock results showing steady improvement from Grade 3 to predicted Grade 5.",
    progress: 72,
  },
  {
    id: "g2",
    title: "Manage anger without physical outbursts for 8 weeks",
    area: "emotional_wellbeing",
    status: "at_risk",
    targetDate: "2026-06-15",
    description: "Using breathing techniques and safe space. Had one incident in week 5 but recovered quickly with support.",
    progress: 55,
  },
  {
    id: "g3",
    title: "Maintain weekly contact with maternal grandmother",
    area: "relationships",
    status: "achieved",
    targetDate: "2026-04-01",
    description: "Video calls every Wednesday established. Two face-to-face visits completed. Grandmother very positive about consistency.",
    progress: 100,
  },
  {
    id: "g4",
    title: "Independently manage morning routine by July",
    area: "independence",
    status: "not_started",
    targetDate: "2026-07-30",
    description: "Wake up, shower, dress, breakfast, pack bag without staff prompts. Currently requires 2-3 prompts each morning.",
    progress: 15,
  },
];

const DEMO_PROGRESS: ProgressEntry[] = [
  {
    id: "p1",
    date: "2026-05-04",
    area: "education",
    description: "Completed English mock exam independently. Showed real focus and determination throughout the paper.",
    impactNote: "Predicted grade moved from 4 to 5. Teacher noted significant improvement in essay structure.",
    staffMember: "Sarah Mitchell",
  },
  {
    id: "p2",
    date: "2026-05-02",
    area: "emotional_wellbeing",
    description: "Used breathing techniques when frustrated with homework. Chose to go to quiet room rather than escalate.",
    impactNote: "First time choosing de-escalation independently without staff prompt. Major milestone.",
    staffMember: "James Cooper",
  },
  {
    id: "p3",
    date: "2026-04-28",
    area: "relationships",
    description: "Video called grandmother. Talked for 35 minutes about school and upcoming birthday plans.",
    impactNote: "Grandmother reported feeling much closer. Child asked if she could visit during half term.",
    staffMember: "Sarah Mitchell",
  },
  {
    id: "p4",
    date: "2026-04-25",
    area: "independence",
    description: "Made own breakfast for the first time without being asked. Set alarm and got up 10 minutes early.",
    impactNote: "Small but significant step. Staff praised effort without overdoing it. Child seemed proud.",
    staffMember: "Tom Richards",
  },
  {
    id: "p5",
    date: "2026-04-22",
    area: "health",
    description: "Attended dental appointment without anxiety. Previously refused all medical appointments.",
    impactNote: "Dentist gave positive feedback. No treatment needed. Agreed to 6-month check-up.",
    staffMember: "James Cooper",
  },
  {
    id: "p6",
    date: "2026-04-18",
    area: "community",
    description: "Joined local football club training session. Engaged well with peers and followed coach instructions.",
    impactNote: "Coach invited back next week. First sustained community activity in 8 months.",
    staffMember: "Tom Richards",
  },
  {
    id: "p7",
    date: "2026-04-15",
    area: "behaviour_support",
    description: "Apologised unprompted to another young person after disagreement over TV remote.",
    impactNote: "Relationship repair happened naturally. Other YP accepted apology. No staff mediation needed.",
    staffMember: "Sarah Mitchell",
  },
  {
    id: "p8",
    date: "2026-04-10",
    area: "wishes_and_feelings",
    description: "Shared in key work session that they would like to try cooking a meal for the house.",
    impactNote: "Activity scheduled for next week. Links to independence goal and building confidence.",
    staffMember: "Sarah Mitchell",
  },
];

const DEMO_OUTCOMES: OutcomeScore[] = [
  { domain: "Education", score: 7, previousScore: 5, trend: "up" },
  { domain: "Health", score: 6, previousScore: 6, trend: "stable" },
  { domain: "Emotional Wellbeing", score: 5, previousScore: 4, trend: "up" },
  { domain: "Safety", score: 8, previousScore: 7, trend: "up" },
  { domain: "Relationships", score: 7, previousScore: 5, trend: "up" },
  { domain: "Independence", score: 4, previousScore: 4, trend: "stable" },
  { domain: "Engagement", score: 6, previousScore: 3, trend: "up" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ChildProgressPage() {
  const [selectedChild, setSelectedChild] = useState("child-a");
  const [showAriaDraft, setShowAriaDraft] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(DEMO_GOALS);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>(DEMO_PROGRESS);
  const [outcomes, setOutcomes] = useState<OutcomeScore[]>(DEMO_OUTCOMES);

  /* ── API hooks (soft-wire for live data) ────────────────────────────────── */
  const { data: goalsData } = useProgressGoals(selectedChild);
  const { data: entriesData } = useProgressEntries(selectedChild);
  const { data: snapshotsData } = useProgressSnapshots(selectedChild);
  const createRecord = useCreateProgressRecord();

  useEffect(() => {
    if (goalsData?.persisted && goalsData.data.length > 0) {
      setGoals((goalsData.data as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        title: (row.title as string) ?? "",
        area: (row.goal_area as ProgressArea) ?? "education",
        status: "on_track" as GoalStatus,
        targetDate: (row.target_date as string) ?? "",
        description: (row.description as string) ?? "",
        progress: 0,
      })));
    }
  }, [goalsData]);

  useEffect(() => {
    if (entriesData?.persisted && entriesData.data.length > 0) {
      setProgressEntries((entriesData.data as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        date: (row.entry_date as string) ?? "",
        area: (row.area as ProgressArea) ?? "education",
        description: (row.what_happened as string) ?? "",
        impactNote: (row.impact_on_child as string) ?? "",
        staffMember: "",
      })));
    }
  }, [entriesData]);

  useEffect(() => {
    if (snapshotsData?.persisted && snapshotsData.data.length > 0) {
      const row = snapshotsData.data[0] as Record<string, unknown>;
      setOutcomes([
        { domain: "Education", score: (row.education_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
        { domain: "Health", score: (row.health_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
        { domain: "Emotional Wellbeing", score: (row.emotional_wellbeing_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
        { domain: "Safety", score: (row.safety_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
        { domain: "Relationships", score: (row.relationships_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
        { domain: "Independence", score: (row.independence_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
        { domain: "Engagement", score: (row.engagement_score as number) ?? 0, previousScore: 0, trend: "stable" as const },
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Target: {new Date(goal.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
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

        {/* ARIA Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              ARIA Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showAriaDraft ? (
              <Button
                variant="outline"
                onClick={() => setShowAriaDraft(true)}
                className="w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Request ARIA Progress Summary
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                    Aria suggested draft
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
    </PageShell>
  );
}
