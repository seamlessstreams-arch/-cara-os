"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES TRACKER
// Ofsted ILACS primary focus: "Are children making progress?"
// Tracks outcomes across 8 domains for each young person, capturing
// voice of the child, progress reviews, barriers, and evidence.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useOutcomes, useCreateOutcomeReview, useCreateOutcomeTarget } from "@/hooks/use-outcomes";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName } from "@/lib/seed-data";
import { cn, formatDate, todayStr } from "@/lib/utils";
import type {
  OutcomeTarget, OutcomeReview, OutcomeDomain, OutcomeRating,
  OutcomeDirection,
} from "@/types/extended";
import { OUTCOME_DOMAIN_LABELS, OUTCOME_RATING_LABELS } from "@/types/extended";
import { toast } from "sonner";
import {
  Target, TrendingUp, TrendingDown, Minus, Star, ChevronDown, ChevronUp,
  MessageSquare, Plus, BarChart3, User, Activity, Brain, Heart, BookOpen,
  Shield, Lightbulb, Sparkles, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Loader2, Eye, Search, ArrowUpDown,
} from "lucide-react";

const OUTCOME_EXPORT_COLS: ExportColumn<OutcomeTarget>[] = [
  { header: "Young Person", accessor: (t) => getYPName(t.child_id) },
  { header: "Domain", accessor: (t) => OUTCOME_DOMAIN_LABELS[t.domain] ?? t.domain },
  { header: "Target", accessor: (t) => t.target_description },
  { header: "Baseline", accessor: (t) => String(t.baseline_rating) },
  { header: "Current", accessor: (t) => String(t.current_rating) },
  { header: "Target Rating", accessor: (t) => String(t.target_rating) },
  { header: "Direction", accessor: (t) => t.direction },
  { header: "Status", accessor: (t) => t.status },
  { header: "YP Voice", accessor: (t) => t.yp_voice ?? "" },
  { header: "Success Criteria", accessor: (t) => t.success_criteria },
  { header: "Review Date", accessor: (t) => t.review_date },
  { header: "Evidence", accessor: (t) => t.evidence_notes ?? "" },
];

// ── Config ───────────────────────────────────────────────────────────────────

const DOMAIN_ICONS: Record<OutcomeDomain, React.ElementType> = {
  health:              Heart,
  education:           BookOpen,
  emotional_wellbeing: Brain,
  identity:            Sparkles,
  family_social:       User,
  self_care:           Activity,
  independence:        Lightbulb,
  behaviour:           Shield,
};

const DOMAIN_COLOURS: Record<OutcomeDomain, { bg: string; text: string; border: string; light: string }> = {
  health:              { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200",    light: "bg-rose-100"    },
  education:           { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-200",    light: "bg-blue-100"    },
  emotional_wellbeing: { bg: "bg-[var(--cs-aria-gold-bg)]",  text: "text-[var(--cs-aria-gold)]",  border: "border-[var(--cs-aria-gold-soft)]",  light: "bg-[var(--cs-aria-gold-bg)]"  },
  identity:            { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200",   light: "bg-amber-100"   },
  family_social:       { bg: "bg-teal-50",    text: "text-teal-600",    border: "border-teal-200",    light: "bg-teal-100"    },
  self_care:           { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-100" },
  independence:        { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-200",  light: "bg-indigo-100"  },
  behaviour:           { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200",  light: "bg-orange-100"  },
};

const DIRECTION_CFG: Record<OutcomeDirection, { icon: React.ElementType; colour: string; label: string }> = {
  improving: { icon: TrendingUp,   colour: "text-emerald-600", label: "Improving" },
  stable:    { icon: Minus,        colour: "text-amber-600",   label: "Stable"    },
  declining: { icon: TrendingDown, colour: "text-red-600",     label: "Declining" },
};

function RatingStars({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "md" }) {
  const px = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={cn(px, i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
      ))}
    </div>
  );
}

function DirectionBadge({ direction }: { direction: OutcomeDirection }) {
  const cfg = DIRECTION_CFG[direction];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold", cfg.colour)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Review Dialog ────────────────────────────────────────────────────────────

function ReviewDialog({
  target,
  open,
  onClose,
}: {
  target: OutcomeTarget;
  open: boolean;
  onClose: () => void;
}) {
  const { currentUser } = useAuthContext();
  const createReview = useCreateOutcomeReview();
  const [newRating, setNewRating] = useState<OutcomeRating>(target.current_rating);
  const [notes, setNotes] = useState("");
  const [ypVoice, setYpVoice] = useState("");
  const [barriers, setBarriers] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [ypParticipated, setYpParticipated] = useState(false);

  const handleSubmit = () => {
    if (!notes.trim()) return;
    createReview.mutate(
      {
        target_id: target.id,
        new_rating: newRating,
        progress_notes: notes.trim(),
        yp_participated: ypParticipated,
        yp_voice: ypVoice.trim() || undefined,
        barriers: barriers.trim() || undefined,
        next_steps: nextSteps.trim() || undefined,
        reviewer_id: currentUser?.id ?? "staff_darren",
        reviewer_role: "Registered Manager",
      },
      {
        onSuccess: () => {
          toast.success("Progress review recorded");
          onClose();
        },
      },
    );
  };

  const domainCfg = DOMAIN_COLOURS[target.domain];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-indigo-600" />
            Record Progress Review
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Target context */}
          <div className={cn("rounded-xl border p-3", domainCfg.bg, domainCfg.border)}>
            <p className="text-xs font-semibold text-[var(--cs-text-secondary)]">{getYPName(target.child_id)} — {OUTCOME_DOMAIN_LABELS[target.domain]}</p>
            <p className="text-sm text-[var(--cs-navy)] mt-1">{target.target_description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-[var(--cs-text-muted)]">Current: <RatingStars rating={target.current_rating} /></span>
              <span className="text-[10px] text-[var(--cs-text-muted)]">Target: <RatingStars rating={target.target_rating} /></span>
            </div>
          </div>

          {/* New rating selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2 block">New Rating</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as OutcomeRating[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setNewRating(r)}
                  className={cn(
                    "flex-1 rounded-xl border-2 px-2 py-3 text-center transition-all",
                    newRating === r
                      ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] shadow-sm"
                      : "border-[var(--cs-border)] bg-white hover:border-indigo-200",
                  )}
                >
                  <RatingStars rating={r} size="md" />
                  <p className="text-[9px] text-[var(--cs-text-muted)] mt-1 leading-tight">{OUTCOME_RATING_LABELS[r]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Progress notes */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">
              Progress Notes <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm"
              placeholder="What progress has been made? What evidence supports this assessment?"
            />
          </div>

          {/* YP voice */}
          <div>
            <label className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={ypParticipated}
                onChange={(e) => setYpParticipated(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">Young person participated in review</span>
            </label>
            {ypParticipated && (
              <Textarea
                value={ypVoice}
                onChange={(e) => setYpVoice(e.target.value)}
                rows={2}
                className="text-sm mt-1"
                placeholder="What did the young person say about their progress?"
              />
            )}
          </div>

          {/* Barriers & next steps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">Barriers</label>
              <Textarea
                value={barriers}
                onChange={(e) => setBarriers(e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="What's holding progress back?"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">Next Steps</label>
              <Textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="What should happen next?"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!notes.trim() || createReview.isPending}
            className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
          >
            {createReview.isPending ? "Saving..." : "Record Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New Target Dialog ────────────────────────────────────────────────────────

function NewTargetDialog({
  open,
  onClose,
  childIds,
}: {
  open: boolean;
  onClose: () => void;
  childIds: string[];
}) {
  const { currentUser } = useAuthContext();
  const createTarget = useCreateOutcomeTarget();
  const [childId, setChildId] = useState(childIds[0] ?? "");
  const [domain, setDomain] = useState<OutcomeDomain>("health");
  const [description, setDescription] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [baselineRating, setBaselineRating] = useState<OutcomeRating>(2);
  const [targetRating, setTargetRating] = useState<OutcomeRating>(4);
  const [ypVoice, setYpVoice] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setChildId(childIds[0] ?? "");
    setDomain("health");
    setDescription("");
    setSuccessCriteria("");
    setBaselineRating(2);
    setTargetRating(4);
    setYpVoice("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!description.trim() || !childId) return;
    createTarget.mutate(
      {
        child_id: childId,
        domain,
        target_description: description.trim(),
        success_criteria: successCriteria.trim(),
        baseline_rating: baselineRating,
        target_rating: targetRating,
        yp_voice: ypVoice.trim() || undefined,
        notes: notes.trim() || undefined,
        set_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => {
          toast.success("Outcome target created");
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-indigo-600" />
            New Outcome Target
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Young person selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">
              Young Person <span className="text-red-500">*</span>
            </label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full h-9 rounded-xl border border-[var(--cs-border)] bg-white px-3 text-sm"
            >
              {childIds.map((cid) => (
                <option key={cid} value={cid}>{getYPName(cid)}</option>
              ))}
            </select>
          </div>

          {/* Domain selector */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2 block">
              Outcome Domain <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.entries(OUTCOME_DOMAIN_LABELS) as [OutcomeDomain, string][]).map(([key, label]) => {
                const dc = DOMAIN_COLOURS[key];
                const DIcon = DOMAIN_ICONS[key];
                return (
                  <button
                    key={key}
                    onClick={() => setDomain(key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all text-center",
                      domain === key
                        ? cn("shadow-sm", dc.bg, dc.border)
                        : "border-[var(--cs-border)] bg-white hover:border-slate-300",
                    )}
                  >
                    <DIcon className={cn("h-4 w-4", domain === key ? dc.text : "text-[var(--cs-text-muted)]")} />
                    <span className={cn("text-[9px] font-medium leading-tight", domain === key ? dc.text : "text-[var(--cs-text-muted)]")}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target description */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">
              Target Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-sm"
              placeholder="What specific outcome are we working towards?"
            />
          </div>

          {/* Success criteria */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">Success Criteria</label>
            <Textarea
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              rows={2}
              className="text-sm"
              placeholder="How will we know this target has been achieved?"
            />
          </div>

          {/* Rating selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2 block">Baseline Rating</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as OutcomeRating[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setBaselineRating(r)}
                    className={cn(
                      "flex-1 rounded-lg border-2 py-2 text-center transition-all",
                      baselineRating === r
                        ? "border-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)]"
                        : "border-[var(--cs-border)] hover:border-indigo-200",
                    )}
                  >
                    <Star className={cn("h-4 w-4 mx-auto", baselineRating >= r ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[var(--cs-text-muted)] mt-1 text-center">{OUTCOME_RATING_LABELS[baselineRating]}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2 block">Target Rating</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as OutcomeRating[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTargetRating(r)}
                    className={cn(
                      "flex-1 rounded-lg border-2 py-2 text-center transition-all",
                      targetRating === r
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-[var(--cs-border)] hover:border-emerald-200",
                    )}
                  >
                    <Star className={cn("h-4 w-4 mx-auto", targetRating >= r ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[var(--cs-text-muted)] mt-1 text-center">{OUTCOME_RATING_LABELS[targetRating]}</p>
            </div>
          </div>

          {/* YP voice */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">
              <MessageSquare className="h-3 w-3 inline mr-1" />Voice of the Child
            </label>
            <Textarea
              value={ypVoice}
              onChange={(e) => setYpVoice(e.target.value)}
              rows={2}
              className="text-sm"
              placeholder="What does the young person say about this target?"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1 block">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
              placeholder="Any additional context or observations..."
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!description.trim() || !childId || createTarget.isPending}
            className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
          >
            {createTarget.isPending ? "Creating..." : "Create Target"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Outcome Target Card ──────────────────────────────────────────────────────

function TargetCard({
  target,
  reviews,
}: {
  target: OutcomeTarget;
  reviews: OutcomeReview[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const domainCfg = DOMAIN_COLOURS[target.domain];
  const DomainIcon = DOMAIN_ICONS[target.domain];
  const dirCfg = DIRECTION_CFG[target.direction];
  const DirIcon = dirCfg.icon;
  const targetReviews = reviews.filter((r) => r.target_id === target.id)
    .sort((a, b) => b.review_date.localeCompare(a.review_date));

  const progressPct = Math.round(
    ((target.current_rating - target.baseline_rating) / Math.max(1, target.target_rating - target.baseline_rating)) * 100,
  );
  const clampedPct = Math.min(100, Math.max(0, progressPct));

  const reviewOverdue = new Date(target.review_date) < new Date();
  const isAchieved = target.status === "achieved";

  return (
    <>
      <div className={cn(
        "rounded-2xl border bg-white overflow-hidden transition-all",
        target.direction === "declining" && "border-red-200",
        reviewOverdue && !isAchieved && "border-amber-200",
        isAchieved && "border-emerald-200 opacity-70",
      )}>
        {/* Header row */}
        <div
          className="flex items-start gap-3 p-4 cursor-pointer hover:bg-[var(--cs-surface)]/50 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", domainCfg.bg)}>
            <DomainIcon className={cn("h-4 w-4", domainCfg.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-[var(--cs-navy)] line-clamp-1">
                {target.target_description}
              </span>
              {isAchieved && (
                <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-0 rounded-full">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Achieved
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("text-[9px] rounded-full border-0", domainCfg.light, domainCfg.text)}>
                {OUTCOME_DOMAIN_LABELS[target.domain]}
              </Badge>
              <DirectionBadge direction={target.direction} />
              <div className="flex items-center gap-1.5">
                <RatingStars rating={target.current_rating} />
                <span className="text-[10px] text-[var(--cs-text-muted)]">/ {target.target_rating}</span>
              </div>
              {reviewOverdue && !isAchieved && (
                <span className="text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                  <AlertTriangle className="h-3 w-3" />Review overdue
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    clampedPct >= 80 ? "bg-emerald-500" : clampedPct >= 40 ? "bg-amber-400" : "bg-red-400",
                  )}
                  style={{ width: `${clampedPct}%` }}
                />
              </div>
              <span className="text-[10px] text-[var(--cs-text-muted)] w-8 text-right">{clampedPct}%</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!isAchieved && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={(e) => { e.stopPropagation(); setShowReview(true); }}
              >
                <Plus className="h-3 w-3 mr-0.5" />Review
              </Button>
            )}
            {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-gentle)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-gentle)]" />}
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-3">
            {/* Success criteria */}
            {target.success_criteria && (
              <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-3">
                <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-1">Success Criteria</p>
                <p className="text-xs text-[var(--cs-text-secondary)]">{target.success_criteria}</p>
              </div>
            )}

            {/* YP Voice */}
            {target.yp_voice && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                <p className="text-[10px] font-semibold text-blue-600 mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Voice of the child
                </p>
                <p className="text-xs text-blue-900 italic">&ldquo;{target.yp_voice}&rdquo;</p>
              </div>
            )}

            {/* Notes & evidence */}
            {target.notes && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-1">Progress Notes</p>
                <p className="text-xs text-[var(--cs-text-secondary)]">{target.notes}</p>
              </div>
            )}
            {target.evidence_notes && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5">
                <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">Evidence</p>
                <p className="text-xs text-emerald-800">{target.evidence_notes}</p>
              </div>
            )}

            {/* Rating details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5 text-center">
                <p className="text-[10px] text-[var(--cs-text-muted)]">Baseline</p>
                <RatingStars rating={target.baseline_rating} />
              </div>
              <div className={cn("rounded-xl border p-2.5 text-center", domainCfg.bg, domainCfg.border)}>
                <p className={cn("text-[10px]", domainCfg.text)}>Current</p>
                <RatingStars rating={target.current_rating} />
              </div>
              <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-2.5 text-center">
                <p className="text-[10px] text-[var(--cs-text-muted)]">Target</p>
                <RatingStars rating={target.target_rating} />
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)]">
              <span>Set by: {target.set_by.replace("staff_", "")}</span>
              <span>Set: {formatDate(target.set_date)}</span>
              <span className={cn(reviewOverdue && "text-red-600 font-medium")}>
                Review: {formatDate(target.review_date)}
              </span>
            </div>

            {/* Review history */}
            {targetReviews.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Review History</p>
                <div className="space-y-2">
                  {targetReviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--cs-text-muted)]">{formatDate(review.review_date)}</span>
                          <DirectionBadge direction={review.direction} />
                          <span className="text-[10px] text-[var(--cs-text-muted)]">
                            {review.previous_rating} → {review.new_rating}
                          </span>
                        </div>
                        {review.yp_participated && (
                          <Badge className="text-[8px] bg-blue-100 text-blue-600 border-0 rounded-full">
                            YP present
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--cs-text-secondary)]">{review.progress_notes}</p>
                      {review.yp_voice && (
                        <div className="mt-1.5 rounded-lg bg-blue-50 border border-blue-100 p-2">
                          <p className="text-[10px] text-blue-700 italic">&ldquo;{review.yp_voice}&rdquo;</p>
                        </div>
                      )}
                      {review.barriers && (
                        <p className="text-[10px] text-red-600 mt-1">Barriers: {review.barriers}</p>
                      )}
                      {review.next_steps && (
                        <p className="text-[10px] text-indigo-600 mt-0.5">Next: {review.next_steps}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Links */}
            <SmartLinkPanel
              sourceType="outcome_target"
              sourceId={target.id}
              childId={target.child_id}
              homeId="home_oak"
              category={target.domain}
            />
          </div>
        )}
      </div>

      {showReview && (
        <ReviewDialog
          target={target}
          open={showReview}
          onClose={() => setShowReview(false)}
        />
      )}
    </>
  );
}

// ── Child Summary Card ───────────────────────────────────────────────────────

function ChildSummaryCard({
  childId,
  targets,
  reviews,
}: {
  childId: string;
  targets: OutcomeTarget[];
  reviews: OutcomeReview[];
}) {
  const active = targets.filter((t) => t.status === "active");
  const improving = active.filter((t) => t.direction === "improving").length;
  const declining = active.filter((t) => t.direction === "declining").length;
  const avgRating = active.length > 0
    ? Math.round((active.reduce((s, t) => s + t.current_rating, 0) / active.length) * 10) / 10
    : 0;

  return (
    <div className={cn(
      "rounded-2xl border p-4",
      declining > 0 ? "border-red-200 bg-red-50/30" : "border-[var(--cs-border)] bg-white",
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--cs-navy)]">{getYPName(childId)}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">{active.length} active targets</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-lg font-bold",
            avgRating >= 3.5 ? "text-emerald-600" : avgRating >= 2.5 ? "text-amber-600" : "text-red-600",
          )}>
            {avgRating}
          </p>
          <p className="text-[10px] text-[var(--cs-text-muted)]">avg rating</p>
        </div>
      </div>

      {/* Domain chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {active.map((t) => {
          const dc = DOMAIN_COLOURS[t.domain];
          const DIcon = DOMAIN_ICONS[t.domain];
          return (
            <div
              key={t.id}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium",
                dc.bg, dc.border, dc.text,
              )}
            >
              <DIcon className="h-3 w-3" />
              <RatingStars rating={t.current_rating} />
              <DirectionBadge direction={t.direction} />
            </div>
          );
        })}
      </div>

      {/* Direction summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
          <p className="text-sm font-bold text-emerald-600">{improving}</p>
          <p className="text-[9px] text-[var(--cs-text-muted)]">Improving</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
          <p className="text-sm font-bold text-amber-600">{active.length - improving - declining}</p>
          <p className="text-[9px] text-[var(--cs-text-muted)]">Stable</p>
        </div>
        <div className={cn(
          "rounded-lg border p-2 text-center",
          declining > 0 ? "bg-red-50 border-red-100" : "bg-slate-50 border-[var(--cs-border-subtle)]",
        )}>
          <p className={cn("text-sm font-bold", declining > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]")}>{declining}</p>
          <p className="text-[9px] text-[var(--cs-text-muted)]">Declining</p>
        </div>
      </div>
    </div>
  );
}

// ── Domain Radar ─────────────────────────────────────────────────────────────

function DomainRadar({
  perDomain,
}: {
  perDomain: { domain: OutcomeDomain; count: number; avg_rating: number; improving: number; declining: number }[];
}) {
  if (perDomain.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {perDomain.map((d) => {
        const dc = DOMAIN_COLOURS[d.domain as OutcomeDomain];
        const DIcon = DOMAIN_ICONS[d.domain as OutcomeDomain];
        return (
          <div key={d.domain} className={cn("rounded-xl border p-3", dc.bg, dc.border)}>
            <div className="flex items-center gap-2 mb-2">
              <DIcon className={cn("h-4 w-4", dc.text)} />
              <span className={cn("text-[11px] font-semibold", dc.text)}>
                {OUTCOME_DOMAIN_LABELS[d.domain as OutcomeDomain]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-lg font-bold", dc.text)}>{d.avg_rating}</p>
                <p className="text-[9px] text-[var(--cs-text-muted)]">{d.count} targets</p>
              </div>
              <div className="text-right text-[10px]">
                {d.improving > 0 && <p className="text-emerald-600">{d.improving} improving</p>}
                {d.declining > 0 && <p className="text-red-600">{d.declining} declining</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "child" | "domain" | "rating_asc" | "rating_desc" | "direction";

export default function OutcomesPage() {
  const { currentUser } = useAuthContext();
  const { data, isLoading } = useOutcomes();
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [showAchieved, setShowAchieved] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("child");
  const [showNewTarget, setShowNewTarget] = useState(false);

  const targets    = data?.data ?? [];
  const reviews    = data?.reviews ?? [];
  const meta       = data?.meta;
  const perChild   = data?.per_child ?? [];
  const perDomain  = data?.per_domain ?? [];

  // Filter targets
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = [...targets];
    if (filterChild !== "all") list = list.filter((t) => t.child_id === filterChild);
    if (filterDomain !== "all") list = list.filter((t) => t.domain === filterDomain);
    if (filterDirection !== "all") list = list.filter((t) => t.direction === filterDirection);
    if (!showAchieved) list = list.filter((t) => t.status !== "achieved");
    if (q) {
      list = list.filter((t) => {
        const ypName = getYPName(t.child_id);
        const domain = OUTCOME_DOMAIN_LABELS[t.domain] ?? "";
        const desc = t.target_description ?? "";
        const notes = t.notes ?? "";
        const evidence = t.evidence_notes ?? "";
        const voice = t.yp_voice ?? "";
        const criteria = t.success_criteria ?? "";
        const haystack = `${ypName} ${domain} ${desc} ${notes} ${evidence} ${voice} ${criteria}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort
    const DIR_ORDER: Record<string, number> = { declining: 0, stable: 1, improving: 2 };
    switch (sortKey) {
      case "rating_asc":
        list.sort((a, b) => a.current_rating - b.current_rating);
        break;
      case "rating_desc":
        list.sort((a, b) => b.current_rating - a.current_rating);
        break;
      case "domain":
        list.sort((a, b) => a.domain.localeCompare(b.domain));
        break;
      case "direction":
        list.sort((a, b) => (DIR_ORDER[a.direction] ?? 1) - (DIR_ORDER[b.direction] ?? 1));
        break;
      default: // "child"
        list.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
    }

    return list;
  }, [targets, filterChild, filterDomain, filterDirection, showAchieved, search, sortKey]);

  const isFiltered = search.trim() !== "" || filterChild !== "all" || filterDomain !== "all" || filterDirection !== "all";
  const childIds = [...new Set(targets.map((t) => t.child_id))];

  return (
    <PageShell
      title="Outcomes Tracker"
      subtitle="Are children making progress? — Care plan targets, reviews and voice of the child"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={OUTCOME_EXPORT_COLS} filename="outcomes" />
          <PrintButton title="Outcomes Tracker" subtitle="Oak House" targetId="outcomes-content" />
          <Button size="sm" className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white h-8 text-xs" onClick={() => setShowNewTarget(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Target
          </Button>
        </div>
      }
    >
      <div id="outcomes-content" className="space-y-6 animate-fade-in">

        {/* ── KPI Banner ── */}
        {meta && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Active Targets",   value: meta.active_targets,    colour: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100", icon: Target },
              { label: "Improving",        value: meta.improving,         colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: TrendingUp },
              { label: "Stable",           value: meta.stable,            colour: "text-amber-600", bg: "bg-amber-50 border-amber-100", icon: Minus },
              { label: "Declining",        value: meta.declining,         colour: meta.declining > 0 ? "text-red-600" : "text-emerald-600", bg: meta.declining > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100", icon: TrendingDown },
              { label: "Reviews Due",      value: meta.reviews_due_soon,  colour: meta.reviews_due_soon > 3 ? "text-amber-600" : "text-[var(--cs-text-secondary)]", bg: meta.reviews_due_soon > 3 ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-[var(--cs-border-subtle)]", icon: Clock },
            ].map(({ label, value, colour, bg, icon: Icon }) => (
              <div key={label} className={cn("rounded-2xl border p-4", bg)}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("h-4 w-4", colour)} />
                  <span className="text-[10px] text-[var(--cs-text-muted)] font-medium">{label}</span>
                </div>
                <p className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Average Rating Indicator ── */}
        {meta && meta.avg_rating > 0 && (
          <div className={cn(
            "rounded-2xl border p-4 flex items-center gap-4",
            meta.avg_rating >= 3.5 ? "bg-emerald-50 border-emerald-200" :
            meta.avg_rating >= 2.5 ? "bg-amber-50 border-amber-200" :
            "bg-red-50 border-red-200",
          )}>
            <BarChart3 className={cn(
              "h-6 w-6",
              meta.avg_rating >= 3.5 ? "text-emerald-600" : meta.avg_rating >= 2.5 ? "text-amber-600" : "text-red-600",
            )} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">
                Home Average: {meta.avg_rating} / 5
              </p>
              <p className="text-xs text-[var(--cs-text-muted)]">
                Across {meta.active_targets} active targets for {childIds.length} young {childIds.length === 1 ? "person" : "people"}
                {meta.declining > 0 && ` — ${meta.declining} area${meta.declining > 1 ? "s" : ""} declining`}
              </p>
            </div>
            <RatingStars rating={Math.round(meta.avg_rating)} size="md" />
          </div>
        )}

        {/* ── Domain Radar ── */}
        <DomainRadar perDomain={perDomain} />

        {/* ── Per-Child Summary ── */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-3">Per Child</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {childIds.map((cid) => (
              <ChildSummaryCard
                key={cid}
                childId={cid}
                targets={targets.filter((t) => t.child_id === cid)}
                reviews={reviews.filter((r) => r.child_id === cid)}
              />
            ))}
          </div>
        </div>

        {/* ── Search & Filters ── */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by young person, target, domain, notes…"
                className="pl-9 h-9 text-sm rounded-xl"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterChild}
                onChange={(e) => setFilterChild(e.target.value)}
                className="h-8 rounded-xl border border-[var(--cs-border)] bg-white px-2 text-xs"
              >
                <option value="all">All children</option>
                {childIds.map((cid) => (
                  <option key={cid} value={cid}>{getYPName(cid)}</option>
                ))}
              </select>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="h-8 rounded-xl border border-[var(--cs-border)] bg-white px-2 text-xs"
              >
                <option value="all">All domains</option>
                {Object.entries(OUTCOME_DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="h-8 rounded-xl border border-[var(--cs-border)] bg-white px-2 text-xs"
              >
                <option value="all">All trends</option>
                <option value="improving">Improving</option>
                <option value="stable">Stable</option>
                <option value="declining">Declining</option>
              </select>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-8 rounded-xl border border-[var(--cs-border)] bg-white px-2 text-xs"
              >
                <option value="child">Sort: By child</option>
                <option value="domain">Sort: By domain</option>
                <option value="rating_desc">Sort: Rating (high→low)</option>
                <option value="rating_asc">Sort: Rating (low→high)</option>
                <option value="direction">Sort: Declining first</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAchieved}
                  onChange={(e) => setShowAchieved(e.target.checked)}
                  className="rounded"
                />
                Show achieved
              </label>
            </div>
          </div>

          {/* Results count */}
          {isFiltered && (
            <div className="text-xs text-[var(--cs-text-muted)]">
              Showing {filtered.length} of {targets.filter((t) => showAchieved || t.status !== "achieved").length} target{targets.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        )}

        {/* ── Target List ── */}
        {!isLoading && (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Target className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">No outcomes match your filters</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">Try adjusting your filters or add a new target</p>
              </div>
            ) : (
              <>
                {/* Group by child */}
                {filterChild === "all" ? (
                  childIds.map((cid) => {
                    const childTargets = filtered.filter((t) => t.child_id === cid);
                    if (childTargets.length === 0) return null;
                    return (
                      <div key={cid}>
                        <h4 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          {getYPName(cid)}
                          <Badge className="text-[9px] bg-slate-100 text-[var(--cs-text-secondary)] border-0 rounded-full">
                            {childTargets.length} targets
                          </Badge>
                        </h4>
                        <div className="space-y-2 mb-4">
                          {childTargets.map((t) => (
                            <TargetCard key={t.id} target={t} reviews={reviews} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-2">
                    {filtered.map((t) => (
                      <TargetCard key={t.id} target={t} reviews={reviews} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Regulatory note ── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          Ofsted ILACS Framework: &ldquo;What is the experience and progress of children?&rdquo; is the
          primary judgement area. Quality Standards 2015 Standard 1 requires homes to demonstrate
          measurable progress across health, education, emotional wellbeing, and independence. Each
          young person must have outcomes recorded against their care plan, reviewed at least fortnightly,
          and must include the voice of the child.
        </div>
      </div>

      <NewTargetDialog
        open={showNewTarget}
        onClose={() => setShowNewTarget(false)}
        childIds={childIds}
      />
    </PageShell>
  );
}
