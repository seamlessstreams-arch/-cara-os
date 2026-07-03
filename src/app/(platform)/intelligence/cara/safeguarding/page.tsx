"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara SAFEGUARDING FLAGS
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useCaraSafeguardingFlags,
  useCreateCaraSafeguardingFlag,
  useUpdateCaraSafeguardingFlag,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import type {
  CaraSafeguardingFlag, SafeguardingFlagType, SafeguardingFlagSeverity,
} from "@/types/extended";
import {
  Shield, AlertTriangle, Plus, Loader2, CheckCircle2, X,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { getYPName } from "@/lib/seed-data";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const FLAG_TYPES: SafeguardingFlagType[] = [
  "disclosure_of_harm", "self_harm", "exploitation", "missing_from_care",
  "grooming", "online_exploitation", "sexual_exploitation", "criminal_exploitation",
  "weapon_concern", "substance_concern", "medication_refusal", "allegation_against_staff",
  "bullying", "family_contact_risk", "radicalisation", "abuse_or_neglect",
  "immediate_safety_risk", "peer_on_peer_abuse",
];

function formatFlagType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const SEVERITY_CONFIG: Record<SafeguardingFlagSeverity, { badge: string; border: string; dot: string }> = {
  critical: { badge: "bg-red-100 text-red-800 border-red-200", border: "border-l-red-500", dot: "bg-red-500" },
  high: { badge: "bg-orange-100 text-orange-800 border-orange-200", border: "border-l-orange-400", dot: "bg-orange-500" },
  medium: { badge: "bg-amber-100 text-amber-800 border-amber-200", border: "border-l-amber-400", dot: "bg-amber-400" },
  low: { badge: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]", border: "border-l-slate-300", dot: "bg-slate-400" },
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "escalated", label: "Escalated" },
  { value: "closed", label: "Closed" },
];

// ── Flag card ─────────────────────────────────────────────────────────────────

function FlagCard({ flag }: { flag: CaraSafeguardingFlag }) {
  const { currentUser } = useAuthContext();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState(flag.review_outcome ?? "");
  const [confirmClose, setConfirmClose] = useState(false);
  const updateFlag = useUpdateCaraSafeguardingFlag();
  const [updating, setUpdating] = useState(false);

  const childName = getYPName(flag.child_id) || flag.child_id;
  const sev = SEVERITY_CONFIG[flag.severity];

  async function handleUpdate(data: Partial<CaraSafeguardingFlag>) {
    setUpdating(true);
    try {
      await updateFlag.mutateAsync({ id: flag.id, ...data });
    } finally {
      setUpdating(false);
      setReviewOpen(false);
      setConfirmClose(false);
    }
  }

  const statusColours: Record<string, string> = {
    open: "bg-red-100 text-red-800",
    reviewed: "bg-blue-100 text-blue-800",
    escalated: "bg-orange-100 text-orange-800",
    closed: "bg-slate-100 text-[var(--cs-text-muted)]",
  };

  return (
    <div className={cn(
      "rounded-xl border-l-4 border border-[var(--cs-border-subtle)] bg-white p-4 space-y-3",
      sev.border
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase", sev.badge)}>
              {flag.severity}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColours[flag.status])}>
              {flag.status}
            </span>
          </div>
          {/* Flag type */}
          <p className="text-base font-bold text-[var(--cs-navy)]">{formatFlagType(flag.flag_type)}</p>
          {/* Child + date */}
          <p className="text-xs text-[var(--cs-text-muted)]">{childName} · {formatDate(flag.created_at)}</p>
          {/* Description */}
          <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{flag.description}</p>
          {/* Recommended action */}
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <p className="text-[10px] font-semibold text-amber-700 uppercase mb-0.5">Recommended Action</p>
            <p className="text-xs text-amber-800">{flag.recommended_action}</p>
          </div>
          {/* Source */}
          {flag.source_type && (
            <p className="text-[10px] text-[var(--cs-text-muted)]">Source: {flag.source_type}</p>
          )}
          {/* Review outcome */}
          {flag.review_outcome && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase mb-0.5">Review Outcome</p>
              <p className="text-xs text-blue-800">{flag.review_outcome}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {flag.status !== "closed" && (
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[var(--cs-border-subtle)]">
          {flag.status === "open" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setReviewOpen((v) => !v)}
              >
                <CheckCircle2 className="h-3 w-3" />Review
                {reviewOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => handleUpdate({ status: "escalated" })}
                disabled={updating}
              >
                <AlertTriangle className="h-3 w-3" />Escalate
              </Button>
            </>
          )}
          {!confirmClose ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs gap-1 text-[var(--cs-text-muted)]"
              onClick={() => setConfirmClose(true)}
            >
              <X className="h-3 w-3" />Close
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--cs-text-secondary)]">Confirm close?</span>
              <Button
                size="sm"
                className="h-7 px-2.5 text-xs bg-slate-700 hover:bg-slate-900 text-white"
                onClick={() => handleUpdate({ status: "closed" })}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Close"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmClose(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Review form */}
      {reviewOpen && (
        <div className="border-t border-[var(--cs-border-subtle)] pt-3 space-y-2">
          <textarea
            value={reviewOutcome}
            onChange={(e) => setReviewOutcome(e.target.value)}
            rows={3}
            placeholder="Describe the review outcome — actions taken, decisions made, referrals…"
            className="w-full rounded-lg border border-[var(--cs-border)] px-3 py-2 text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={updating || !reviewOutcome.trim()}
              onClick={() => handleUpdate({
                status: "reviewed",
                review_outcome: reviewOutcome,
                reviewed_by: currentUser?.id ?? "staff_darren",
                reviewed_at: new Date().toISOString(),
              })}
            >
              {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Reviewed"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Raise flag form ───────────────────────────────────────────────────────────

function RaiseFlagForm({ onClose }: { onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId] = useState("");
  const [flagType, setFlagType] = useState<SafeguardingFlagType>("disclosure_of_harm");
  const [severity, setSeverity] = useState<SafeguardingFlagSeverity>("medium");
  const [description, setDescription] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const createFlag = useCreateCaraSafeguardingFlag();

  async function handleRaise() {
    if (!childId || !description.trim() || !recommendedAction.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createFlag.mutateAsync({
        home_id: homeId,
        child_id: childId,
        flag_type: flagType,
        severity,
        description,
        recommended_action: recommendedAction,
        status: "open",
        created_at: new Date().toISOString(),
      });
      setSavedOk(true);
      setTimeout(onClose, 1200);
    } catch {
      setError("Failed to raise flag. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />Raise Safeguarding Flag
          </CardTitle>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Young Person *</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-risk-soft)]"
            >
              <option value="">Select young person</option>
              {youngPeople.map((yp) => (
                <option key={yp.id} value={yp.id}>{yp.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Severity *</label>
            <div className="flex gap-2">
              {(["low", "medium", "high", "critical"] as SafeguardingFlagSeverity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold capitalize transition-colors",
                    severity === s
                      ? s === "critical" ? "bg-red-600 text-white border-red-600"
                        : s === "high" ? "bg-orange-500 text-white border-orange-500"
                        : s === "medium" ? "bg-amber-400 text-white border-amber-400"
                        : "bg-slate-700 text-white border-slate-700"
                      : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Flag Type *</label>
          <select
            value={flagType}
            onChange={(e) => setFlagType(e.target.value as SafeguardingFlagType)}
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-risk-soft)]"
          >
            {FLAG_TYPES.map((t) => (
              <option key={t} value={t}>{formatFlagType(t)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the concern in detail — what was observed, said, or identified…"
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-risk-soft)] resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Recommended Action *</label>
          <textarea
            value={recommendedAction}
            onChange={(e) => setRecommendedAction(e.target.value)}
            rows={3}
            placeholder="What action should be taken in response to this flag?"
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-risk-soft)] resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {savedOk ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />Flag raised successfully
          </div>
        ) : (
          <Button
            onClick={handleRaise}
            disabled={saving}
            className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Raise Safeguarding Flag
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SafeguardingFlagsPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useCaraSafeguardingFlags({ homeId });
  const flags: CaraSafeguardingFlag[] = useMemo(() => data?.data ?? [], [data]);

  const openFlags = useMemo(() => flags.filter((f) => f.status === "open"), [flags]);
  const criticalFlags = useMemo(() => openFlags.filter((f) => f.severity === "critical"), [openFlags]);
  const highFlags = useMemo(() => openFlags.filter((f) => f.severity === "high"), [openFlags]);
  const mediumFlags = useMemo(() => openFlags.filter((f) => f.severity === "medium"), [openFlags]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return flags;
    return flags.filter((f) => f.status === statusFilter);
  }, [flags, statusFilter]);

  return (
    <PageShell
      title="Safeguarding Flags"
      subtitle="AI-detected and manually raised safeguarding concerns"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <SmartUploadButton variant="inline" label="Upload Safeguarding Document" uploadContext="Cara Intelligence — safeguarding concern supporting document upload" />
          <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white gap-2 h-9">
            <Plus className="h-4 w-4" />Raise Flag
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Critical banner */}
        {criticalFlags.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-400 bg-red-600 p-4">
            <AlertTriangle className="h-6 w-6 text-white shrink-0" />
            <p className="text-sm font-bold text-white uppercase tracking-wide">
              Critical safeguarding flags require immediate attention — {criticalFlags.length} critical flag{criticalFlags.length !== 1 ? "s" : ""} open
            </p>
          </div>
        )}

        {/* Raise form */}
        {showForm && <RaiseFlagForm onClose={() => setShowForm(false)} />}

        {/* Stat bar */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Open Flags", value: openFlags.length, colour: "text-[var(--cs-navy)]" },
            { label: "Critical", value: criticalFlags.length, colour: "text-red-600" },
            { label: "High", value: highFlags.length, colour: "text-orange-600" },
            { label: "Medium", value: mediumFlags.length, colour: "text-amber-600" },
          ].map(({ label, value, colour }) => (
            <div key={label} className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-3">
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === tab.value ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Flags list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Shield className="h-12 w-12 text-slate-200" />
            <p className="text-sm font-semibold text-[var(--cs-text-secondary)]">No flags to display</p>
            <p className="text-xs text-[var(--cs-text-muted)]">
              {statusFilter === "all" ? "No safeguarding flags have been raised" : `No ${statusFilter} flags`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((flag) => (
              <FlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-4 flex items-start gap-3">
          <Shield className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
            Cara identifies potential concerns but cannot make safeguarding decisions. All flags must be reviewed
            by a trained designated safeguarding lead. This tool does not replace your organisation&apos;s safeguarding
            procedures.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
