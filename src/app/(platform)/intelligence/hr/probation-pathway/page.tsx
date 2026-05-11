"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR — PROBATION PATHWAY TOOL
//
// Structured probation management tool for new starters. Guides the manager
// through:
//   1. Probation setup — objectives, support plan, review schedule
//   2. Review meetings — structured reviews at 1/3/6 months (or custom)
//   3. Concern management — early identification and support
//   4. Outcome decision — confirm, extend, or end employment
//
// Aria provides sector-specific guidance on children's home probation
// management, regulatory expectations, and safer recruitment compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Target,
  ClipboardCheck,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Calendar,
  Shield,
  Star,
  XCircle,
  Pause,
  Scale,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProbationStage = "setup" | "reviews" | "concerns" | "outcome";

type ProbationObjectiveStatus = "not_started" | "in_progress" | "met" | "not_met" | "partially_met";

type ProbationOutcome = "confirmed" | "extended" | "ended";

interface ProbationObjective {
  id: string;
  description: string;
  successCriteria: string;
  status: ProbationObjectiveStatus;
  evidence?: string;
}

interface ProbationReview {
  id: string;
  reviewDate: string;
  reviewType: string;
  overallRating: "on_track" | "concerns" | "at_risk";
  strengths: string;
  areasForDevelopment: string;
  supportProvided: string;
  objectiveProgress: string;
  managerNotes: string;
  staffComments: string;
  completed: boolean;
}

const STAGES: { key: ProbationStage; label: string; icon: React.ElementType }[] = [
  { key: "setup", label: "Setup", icon: Target },
  { key: "reviews", label: "Reviews", icon: ClipboardCheck },
  { key: "concerns", label: "Concerns", icon: AlertTriangle },
  { key: "outcome", label: "Outcome", icon: UserCheck },
];

const REVIEW_TYPES = [
  { value: "1_month", label: "1 month review" },
  { value: "3_month", label: "3 month review" },
  { value: "6_month", label: "6 month (final) review" },
  { value: "extension_review", label: "Extension review" },
  { value: "informal_check_in", label: "Informal check-in" },
];

const RATING_CONFIG: Record<ProbationReview["overallRating"], { label: string; colour: string; icon: React.ElementType }> = {
  on_track: { label: "On track", colour: "bg-emerald-100 text-emerald-800", icon: TrendingUp },
  concerns: { label: "Some concerns", colour: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  at_risk: { label: "At risk", colour: "bg-red-100 text-red-800", icon: XCircle },
};

const STATUS_CONFIG: Record<ProbationObjectiveStatus, { label: string; colour: string }> = {
  not_started: { label: "Not started", colour: "bg-slate-100 text-[var(--cs-text-secondary)]" },
  in_progress: { label: "In progress", colour: "bg-blue-100 text-blue-800" },
  met: { label: "Met", colour: "bg-emerald-100 text-emerald-800" },
  partially_met: { label: "Partially met", colour: "bg-amber-100 text-amber-800" },
  not_met: { label: "Not met", colour: "bg-red-100 text-red-800" },
};

const OUTCOME_CONFIG: Record<ProbationOutcome, { label: string; colour: string; icon: React.ElementType; description: string }> = {
  confirmed: { label: "Confirmed in post", colour: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2, description: "The staff member has met their probation objectives and is confirmed in their role." },
  extended: { label: "Probation extended", colour: "bg-amber-100 text-amber-800 border-amber-200", icon: Pause, description: "The probation period is extended to allow additional time to meet objectives. A clear support plan and review date must be set." },
  ended: { label: "Employment ended", colour: "bg-red-100 text-red-800 border-red-200", icon: XCircle, description: "The staff member has not met their probation objectives and employment is ended during or at the end of the probation period." },
};

let nextId = 1;
function uid() { return `prob_${Date.now()}_${nextId++}`; }

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProbationPathwayPage() {
  const [stage, setStage] = useState<ProbationStage>("setup");

  // Setup
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [probationLength, setProbationLength] = useState("6");
  const [lineManager, setLineManager] = useState("");
  const [inductionComplete, setInductionComplete] = useState(false);
  const [dbsClearance, setDbsClearance] = useState(false);
  const [referencesReceived, setReferencesReceived] = useState(false);
  const [objectives, setObjectives] = useState<ProbationObjective[]>([
    { id: uid(), description: "", successCriteria: "", status: "not_started" },
  ]);

  // Reviews
  const [reviews, setReviews] = useState<ProbationReview[]>([]);

  // Concerns
  const [concernsDescription, setConcernsDescription] = useState("");
  const [supportPlan, setSupportPlan] = useState("");
  const [informalConversations, setInformalConversations] = useState("");

  // Outcome
  const [outcome, setOutcome] = useState<ProbationOutcome | "">("");
  const [outcomeRationale, setOutcomeRationale] = useState("");
  const [extensionLength, setExtensionLength] = useState("");
  const [extensionObjectives, setExtensionObjectives] = useState("");

  // ── Helpers ──────────────────────────────────────────────────────────────

  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const completionStatus = useMemo(() => ({
    setup: !!staffName && !!startDate && objectives.some((o) => o.description.trim()),
    reviews: reviews.some((r) => r.completed),
    concerns: !!concernsDescription || reviews.some((r) => r.overallRating === "concerns" || r.overallRating === "at_risk"),
    outcome: !!outcome,
  }), [staffName, startDate, objectives, reviews, concernsDescription, outcome]);

  const completedStages = Object.values(completionStatus).filter(Boolean).length;

  // Objective CRUD
  function addObjective() {
    setObjectives((prev) => [...prev, { id: uid(), description: "", successCriteria: "", status: "not_started" }]);
  }
  function removeObjective(id: string) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }
  function updateObjective(id: string, patch: Partial<ProbationObjective>) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  // Review CRUD
  function addReview() {
    setReviews((prev) => [...prev, {
      id: uid(), reviewDate: "", reviewType: "1_month", overallRating: "on_track",
      strengths: "", areasForDevelopment: "", supportProvided: "", objectiveProgress: "",
      managerNotes: "", staffComments: "", completed: false,
    }]);
  }
  function removeReview(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }
  function updateReview(id: string, patch: Partial<ProbationReview>) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  // ── Stage navigation ───────────────────────────────────────────────────

  function renderStageNav() {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.key === stage;
          const isDone = completionStatus[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : isDone
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200",
              )}
            >
              {isDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Stage 1: Setup ──────────────────────────────────────────────────────

  function renderSetup() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />Staff Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Staff member name</label>
                <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Role</label>
                <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} placeholder="e.g. Residential Support Worker" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Probation length (months)</label>
                <Select value={probationLength} onValueChange={setProbationLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="9">9 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Line manager</label>
                <Input value={lineManager} onChange={(e) => setLineManager(e.target.value)} placeholder="Manager name" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--cs-text-muted)]" />Safer Recruitment Checks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--cs-border)] hover:bg-[var(--cs-surface)] cursor-pointer">
              <input type="checkbox" checked={dbsClearance} onChange={(e) => setDbsClearance(e.target.checked)} className="rounded border-slate-300" />
              <div>
                <span className="text-sm font-medium text-[var(--cs-text-secondary)]">DBS clearance received</span>
                <p className="text-xs text-[var(--cs-text-muted)]">Enhanced DBS with barred list check for regulated activity</p>
              </div>
              {dbsClearance && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--cs-border)] hover:bg-[var(--cs-surface)] cursor-pointer">
              <input type="checkbox" checked={referencesReceived} onChange={(e) => setReferencesReceived(e.target.checked)} className="rounded border-slate-300" />
              <div>
                <span className="text-sm font-medium text-[var(--cs-text-secondary)]">References received and verified</span>
                <p className="text-xs text-[var(--cs-text-muted)]">Minimum two references including most recent employer</p>
              </div>
              {referencesReceived && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--cs-border)] hover:bg-[var(--cs-surface)] cursor-pointer">
              <input type="checkbox" checked={inductionComplete} onChange={(e) => setInductionComplete(e.target.checked)} className="rounded border-slate-300" />
              <div>
                <span className="text-sm font-medium text-[var(--cs-text-secondary)]">Induction programme completed</span>
                <p className="text-xs text-[var(--cs-text-muted)]">Home induction, safeguarding training, lone working, medication</p>
              </div>
              {inductionComplete && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />}
            </label>

            {(!dbsClearance || !referencesReceived) && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 flex items-start gap-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Safer recruitment checks must be completed before the staff member works unsupervised with children.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />Probation Objectives
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addObjective} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {objectives.map((o, i) => (
              <div key={o.id} className="rounded-xl border border-[var(--cs-border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--cs-text-muted)]">Objective {i + 1}</span>
                  {objectives.length > 1 && (
                    <button onClick={() => removeObjective(o.id)} className="text-[var(--cs-text-muted)] hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Textarea
                  value={o.description}
                  onChange={(e) => updateObjective(o.id, { description: e.target.value })}
                  placeholder="What does the staff member need to demonstrate? Be specific and measurable."
                  rows={2}
                />
                <Input
                  value={o.successCriteria}
                  onChange={(e) => updateObjective(o.id, { successCriteria: e.target.value })}
                  placeholder="Success criteria — how will you know this objective has been met?"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <strong>ARIA guidance.</strong> Probation objectives for residential children&apos;s home staff should
            cover: safeguarding practice, relationship-based care, record keeping, trauma-informed response,
            medication administration (where applicable), and teamwork. Objectives should be achievable but
            stretching, and the staff member should understand what &ldquo;good&rdquo; looks like.
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 2: Reviews ────────────────────────────────────────────────────

  function renderReviews() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Probation Reviews</h3>
          <Button size="sm" variant="outline" onClick={addReview} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Add Review
          </Button>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-[var(--cs-border)] p-8 text-center">
            <Calendar className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">No reviews recorded yet. Add reviews as they are conducted.</p>
          </div>
        ) : (
          reviews.map((r, i) => {
            const ratingConf = RATING_CONFIG[r.overallRating];
            const RatingIcon = ratingConf.icon;
            return (
              <Card key={r.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-[var(--cs-text-muted)]" />
                      {REVIEW_TYPES.find((t) => t.value === r.reviewType)?.label ?? `Review ${i + 1}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px]", ratingConf.colour)}>
                        <RatingIcon className="h-3 w-3 mr-1" />{ratingConf.label}
                      </Badge>
                      <label className="flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)]">
                        <input
                          type="checkbox"
                          checked={r.completed}
                          onChange={(e) => updateReview(r.id, { completed: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        Done
                      </label>
                      <button onClick={() => removeReview(r.id)} className="text-[var(--cs-text-muted)] hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Review date</label>
                      <Input type="date" value={r.reviewDate} onChange={(e) => updateReview(r.id, { reviewDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Review type</label>
                      <Select value={r.reviewType} onValueChange={(v) => updateReview(r.id, { reviewType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {REVIEW_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Overall rating</label>
                      <Select value={r.overallRating} onValueChange={(v) => updateReview(r.id, { overallRating: v as ProbationReview["overallRating"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(RATING_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Strengths demonstrated</label>
                    <Textarea value={r.strengths} onChange={(e) => updateReview(r.id, { strengths: e.target.value })} placeholder="What has the staff member done well?" rows={3} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Areas for development</label>
                    <Textarea value={r.areasForDevelopment} onChange={(e) => updateReview(r.id, { areasForDevelopment: e.target.value })} placeholder="Where does the staff member need to improve?" rows={3} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Support provided</label>
                    <Textarea value={r.supportProvided} onChange={(e) => updateReview(r.id, { supportProvided: e.target.value })} placeholder="What support, training, shadowing or mentoring has been provided?" rows={2} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Objective progress</label>
                    <Textarea value={r.objectiveProgress} onChange={(e) => updateReview(r.id, { objectiveProgress: e.target.value })} placeholder="Progress against each probation objective..." rows={3} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Manager notes</label>
                      <Textarea value={r.managerNotes} onChange={(e) => updateReview(r.id, { managerNotes: e.target.value })} placeholder="Manager's observations and notes" rows={3} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Staff member comments</label>
                      <Textarea value={r.staffComments} onChange={(e) => updateReview(r.id, { staffComments: e.target.value })} placeholder="The staff member's own comments and reflections" rows={3} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    );
  }

  // ── Stage 3: Concerns ───────────────────────────────────────────────────

  function renderConcerns() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />Probation Concerns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Concerns identified</label>
              <Textarea
                value={concernsDescription}
                onChange={(e) => setConcernsDescription(e.target.value)}
                placeholder="Describe any concerns — performance, conduct, safeguarding awareness, attitude, attendance, record keeping..."
                rows={5}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Support plan</label>
              <Textarea
                value={supportPlan}
                onChange={(e) => setSupportPlan(e.target.value)}
                placeholder="What additional support is being put in place? Additional supervision, training, buddying, adjusted duties..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Informal conversations / check-ins</label>
              <Textarea
                value={informalConversations}
                onChange={(e) => setInformalConversations(e.target.value)}
                placeholder="Record any informal conversations, coaching, or feedback given..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <strong>ARIA guidance.</strong> Address concerns early — do not wait until the final review.
            Document informal conversations and coaching. If concerns are serious enough to risk the
            probation not being confirmed, the staff member must be told clearly and given a reasonable
            opportunity to improve with support. In children&apos;s homes, any safeguarding-related concerns
            during probation require immediate escalation — do not wait for a review meeting.
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 4: Outcome ────────────────────────────────────────────────────

  function renderOutcomeStage() {
    return (
      <div className="space-y-5">
        {/* Objective status summary */}
        {objectives.some((o) => o.description.trim()) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-[var(--cs-text-muted)]" />Objective Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {objectives.filter((o) => o.description.trim()).map((o, i) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--cs-border)]">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-[var(--cs-text-muted)]">Objective {i + 1}</span>
                    <p className="text-sm text-[var(--cs-text-secondary)] truncate">{o.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Select value={o.status} onValueChange={(v) => updateObjective(o.id, { status: v as ProbationObjectiveStatus })}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Badge className={cn("text-[10px] shrink-0", STATUS_CONFIG[o.status].colour)}>
                      {STATUS_CONFIG[o.status].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-[var(--cs-text-muted)]" />Probation Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Outcome</label>
              <Select value={outcome} onValueChange={(v) => setOutcome(v as ProbationOutcome)}>
                <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OUTCOME_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {outcome && (
              <div className={cn("rounded-xl border p-4 flex items-start gap-3", OUTCOME_CONFIG[outcome].colour)}>
                {(() => { const Icon = OUTCOME_CONFIG[outcome].icon; return <Icon className="h-5 w-5 shrink-0 mt-0.5" />; })()}
                <div>
                  <p className="text-sm font-semibold">{OUTCOME_CONFIG[outcome].label}</p>
                  <p className="text-xs mt-1">{OUTCOME_CONFIG[outcome].description}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Rationale</label>
              <Textarea
                value={outcomeRationale}
                onChange={(e) => setOutcomeRationale(e.target.value)}
                placeholder="Record the rationale for this decision — evidence considered, objectives met or not met, support provided, and the basis for the decision..."
                rows={5}
              />
            </div>

            {outcome === "extended" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Extension length</label>
                  <Input value={extensionLength} onChange={(e) => setExtensionLength(e.target.value)} placeholder="e.g. 3 months" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Extension objectives</label>
                  <Textarea
                    value={extensionObjectives}
                    onChange={(e) => setExtensionObjectives(e.target.value)}
                    placeholder="What specific objectives must be met during the extension? What support will be provided? What does the staff member need to demonstrate?"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {outcome === "ended" && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <strong>Ending employment during probation.</strong> Ensure the staff member has been told
                  clearly that their probation is at risk and has been given a reasonable opportunity to improve.
                  Take HR advice before confirming termination. Consider whether a DBS referral is needed if the
                  reason relates to safeguarding concerns. Run the letter through the HR Process Guardian before sending.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Probation Pathway"
      subtitle="Structured probation management — guided by ARIA"
      actions={
        <Badge className="bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-aria-gold-soft)]">
          <Sparkles className="h-3 w-3 mr-1" />ARIA Guided
        </Badge>
      }
    >
      <div className="max-w-4xl space-y-5 animate-fade-in">
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Probation progress</span>
            <span className="text-xs text-[var(--cs-text-muted)]">{completedStages} of {STAGES.length} stages started</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--cs-aria-gold-bg)]0 transition-all duration-500"
              style={{ width: `${(completedStages / STAGES.length) * 100}%` }}
            />
          </div>
        </div>

        {renderStageNav()}

        {stage === "setup" && renderSetup()}
        {stage === "reviews" && renderReviews()}
        {stage === "concerns" && renderConcerns()}
        {stage === "outcome" && renderOutcomeStage()}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" disabled={stageIdx === 0} onClick={() => setStage(STAGES[stageIdx - 1].key)} className="gap-1.5">
            <ChevronLeft className="h-3.5 w-3.5" />Previous
          </Button>
          <Button size="sm" disabled={stageIdx >= STAGES.length - 1} onClick={() => setStage(STAGES[stageIdx + 1].key)} className="gap-1.5">
            Next<ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
