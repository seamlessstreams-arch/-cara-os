"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA — MANAGEMENT OVERSIGHT (UI)
// Manager-facing review screen for the ARIA Management Oversight Engine.
//
// Flow:
//   1. Paste / dictate a care record + select record type + child reference
//   2. Submit → POST /api/aria/management-oversight  (analyse + persist)
//   3. Review the suggested draft, scores, plan links, missing evidence,
//      suggested actions, regulatory links
//   4. Decide: Approve / Edit & Approve / Reject / Request Rewrite
//      → PATCH /api/aria/management-oversight  (audit-logged)
//   5. Watch the audit timeline update
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
import { AriaCompose } from "@/components/aria/aria-compose";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCw,
  Pencil,
  ShieldCheck,
  Eye,
  Link2,
  Scale,
  ListChecks,
  Quote,
  History,
} from "lucide-react";

const RECORD_TYPES = [
  { value: "daily_log", label: "Daily log" },
  { value: "shift_debrief", label: "Shift debrief" },
  { value: "incident_report", label: "Incident report" },
  { value: "missing_from_care", label: "Missing from care" },
  { value: "disclosure", label: "Disclosure" },
  { value: "safeguarding", label: "Safeguarding concern" },
  { value: "medication", label: "Medication record" },
  { value: "key_work", label: "Key work session" },
  { value: "education", label: "Education record" },
  { value: "health", label: "Health record" },
  { value: "complaint", label: "Complaint" },
  { value: "consequence_restorative", label: "Consequence / restorative" },
  { value: "room_search", label: "Room search" },
  { value: "family_time", label: "Family time / contact" },
] as const;

interface PlanLink {
  plan: string;
  detected: boolean;
  evidenceQuote?: string;
}

interface SuggestedAction {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDays: number;
  assignedRole: string;
}

interface OversightReview {
  recordId: string;
  recordType: string;
  generatedAt: string;
  status: string;
  ariaLabel: string;
  oversightDraft: string;
  ofstedSummary: string;
  qualityScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  practiceJudgement: "strong" | "adequate" | "unclear" | "requires_improvement";
  childVoiceVisible: boolean;
  planLinksVisible: boolean;
  planLinks: PlanLink[];
  requiresManagerEscalation: boolean;
  escalationReason?: string;
  missingEvidence: string[];
  strengths: string[];
  suggestedActions: SuggestedAction[];
  regulatoryLinks: string[];
  ariaConfidence: number;
  llmUsed: boolean;
  engineVersion: string;
}

interface AnalysisResult {
  reviewId?: string;
  review: OversightReview;
  persisted: boolean;
}

interface AuditEntry {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  actor_role: string | null;
  event_detail: Record<string, unknown>;
  created_at: string;
}

const RISK_COLOUR: Record<OversightReview["riskLevel"], string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const JUDGEMENT_COLOUR: Record<OversightReview["practiceJudgement"], string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  adequate: "bg-blue-100 text-blue-800 border-blue-200",
  unclear: "bg-amber-100 text-amber-800 border-amber-200",
  requires_improvement: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_COLOUR: Record<SuggestedAction["priority"], string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

const PLAN_LABEL: Record<string, string> = {
  care_plan: "Care Plan",
  placement_plan: "Placement Plan",
  risk_assessment: "Risk Assessment",
  keeping_me_safe_plan: "Keeping Me Safe Plan",
  behaviour_support_plan: "Behaviour Support Plan",
  education_plan: "Education Plan",
  health_plan: "Health Plan",
  reg_44: "Reg 44",
  reg_45: "Reg 45",
};

export default function ManagementOversightPage() {
  // ─── Input form state ──────────────────────────────────────────────────────
  const [recordId, setRecordId] = useState("");
  const [recordType, setRecordType] = useState<string>("incident_report");
  const [recordText, setRecordText] = useState("");
  const [childPseudonym, setChildPseudonym] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [authorRole, setAuthorRole] = useState("");

  // ─── Engine state ──────────────────────────────────────────────────────────
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Manager decision state ────────────────────────────────────────────────
  const [editedDraft, setEditedDraft] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editing, setEditing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rewriteInstructions, setRewriteInstructions] = useState("");
  const [decisionPending, setDecisionPending] = useState<null | string>(null);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [actorUserId, setActorUserId] = useState("manager_demo_user");

  const canSubmit = useMemo(
    () => recordId.trim().length > 0 && recordText.trim().length > 30,
    [recordId, recordText],
  );

  // ─── Submit for analysis ────────────────────────────────────────────────────
  async function handleAnalyse() {
    setAnalysing(true);
    setError(null);
    setResult(null);
    setDecisionMessage(null);
    setAuditTrail([]);
    try {
      const res = await fetch("/api/aria/management-oversight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: recordId.trim(),
          recordType,
          recordText: recordText.trim(),
          childPseudonym: childPseudonym.trim() || undefined,
          recordDate: recordDate || undefined,
          authorRole: authorRole.trim() || undefined,
          actorUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Engine error");
      } else {
        setResult(data.data);
        setEditedDraft(data.data.review.oversightDraft);
        setEditedSummary(data.data.review.ofstedSummary);
        if (data.data.persisted && data.data.reviewId) {
          await loadAudit(data.data.reviewId);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalysing(false);
    }
  }

  async function loadAudit(reviewId: string) {
    try {
      const res = await fetch(`/api/aria/management-oversight?id=${reviewId}`);
      if (!res.ok) return;
      const data = await res.json();
      const entries: AuditEntry[] | undefined = data.data?.oversight_audit_log;
      if (Array.isArray(entries)) setAuditTrail(entries);
    } catch {
      // Audit fetch failures are non-fatal.
    }
  }

  // ─── Manager decision ──────────────────────────────────────────────────────
  async function decide(decision: "approve" | "edit" | "reject" | "request_rewrite") {
    if (!result?.reviewId) {
      setDecisionMessage(
        "Persistence is not active in this environment — decisions cannot be audit-logged. Configure Supabase to enable.",
      );
      return;
    }
    setDecisionPending(decision);
    setDecisionMessage(null);
    try {
      const body: Record<string, unknown> = {
        reviewId: result.reviewId,
        decision,
        actorUserId,
        actorRole: "registered_manager",
      };
      if (decision === "approve" && editing) body.editedOversight = editedDraft;
      if (decision === "approve" && editing) body.editedSummary = editedSummary;
      if (decision === "edit") {
        body.editedOversight = editedDraft;
        body.editedSummary = editedSummary;
      }
      if (decision === "reject") body.rejectionReason = rejectionReason.trim();
      if (decision === "request_rewrite")
        body.rewriteInstructions = rewriteInstructions.trim();

      const res = await fetch("/api/aria/management-oversight", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionMessage(data.error ?? "Decision failed");
      } else {
        setDecisionMessage(`Recorded: ${decision.replace(/_/g, " ")}.`);
        if (result.reviewId) await loadAudit(result.reviewId);
      }
    } catch (e) {
      setDecisionMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setDecisionPending(null);
    }
  }

  const review = result?.review;

  return (
    <PageShell title="ARIA — Management Oversight">
      {/* ── ARIA draft banner ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <Sparkles className="h-5 w-5 mt-0.5 text-[var(--cs-aria-gold)]" />
        <div>
          <div className="font-semibold">ARIA suggested draft — never final</div>
          <p className="text-[var(--cs-navy)]">
            Output below is generated by the ARIA Management Oversight Engine. It
            stays in draft until a Registered Manager (or delegate) approves,
            edits, rejects, or requests a rewrite. Every decision is audit-logged.
          </p>
        </div>
      </div>

      {/* ── Input panel ───────────────────────────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--cs-aria-gold)]" />
            Record under review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Record ID</label>
              <Input
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                placeholder="e.g. inc_2026_0142"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Record type</label>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Child reference (pseudonym / ID)</label>
              <Input
                value={childPseudonym}
                onChange={(e) => setChildPseudonym(e.target.value)}
                placeholder="e.g. Casey"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Record date</label>
              <Input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Author role (optional)</label>
              <Input
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="e.g. Senior RCW"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Actor user ID (your sign-in for audit log)</label>
              <Input
                value={actorUserId}
                onChange={(e) => setActorUserId(e.target.value)}
              />
            </div>
          </div>
          <div>
            <AriaCompose
              value={recordText}
              onChange={setRecordText}
              actorUserId={actorUserId}
              actorRole="registered_manager"
              sourceModule="management_oversight"
              sourceRecordType={recordType}
              sourceRecordId={recordId || undefined}
              sourceField="record_narrative"
              defaultCommand="professionalise_record"
              commands={[
                { id: "professionalise_record", label: "Professionalise record", permission: "aria.rewrite" },
                { id: "improve_writing", label: "Improve writing", permission: "aria.rewrite" },
                { id: "summarise_text", label: "Summarise", permission: "aria.summarise" },
                { id: "check_missing_information", label: "Check missing information", permission: "aria.summarise" },
                { id: "check_tone", label: "Check tone", permission: "aria.summarise" },
                { id: "check_factuality", label: "Check factuality", permission: "aria.summarise" },
                { id: "draft_child_voice_summary", label: "Surface child voice", permission: "aria.summarise" },
              ]}
              label="Record narrative"
              placeholder="Paste the full record narrative (incident, daily log, complaint, etc.) here for Aria to analyse. Use the mic button to dictate, or run an ARIA command to clean up the wording before submitting."
              rows={8}
            />
            <div className="text-xs text-[var(--cs-text-muted)] mt-1">
              Submit will run the specialised oversight engine: it detects child voice, plan linkage, risk indicators, missing evidence, and vague closure phrases.
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={handleAnalyse}
              disabled={!canSubmit || analysing}
              className="gap-2"
            >
              {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analysing ? "Analysing..." : "Generate ARIA suggested draft"}
            </Button>
          </div>
          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {review ? (
        <>
          {/* ── Headline scores ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Quality score</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">{review.qualityScore}<span className="text-base text-[var(--cs-text-muted)]">/100</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Risk level</div>
                <Badge className={cn("border", RISK_COLOUR[review.riskLevel])}>{review.riskLevel}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Practice judgement</div>
                <Badge className={cn("border", JUDGEMENT_COLOUR[review.practiceJudgement])}>
                  {review.practiceJudgement.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">ARIA confidence</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">{Math.round(review.ariaConfidence * 100)}%</div>
                <div className="text-xs text-[var(--cs-text-muted)] mt-1">
                  {review.llmUsed ? "LLM-enhanced narrative" : "Deterministic only"}
                </div>
              </CardContent>
            </Card>
          </div>

          {review.requiresManagerEscalation ? (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600" />
              <div>
                <div className="font-semibold">Manager escalation flagged</div>
                <p>{review.escalationReason ?? "ARIA has flagged this record for manager attention."}</p>
              </div>
            </div>
          ) : null}

          {/* ── Two-column body ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left column — voice / plans / strengths / gaps */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Quote className="h-4 w-4 text-rose-500" /> Child voice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {review.childVoiceVisible ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Child&apos;s voice detected in the record.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <XCircle className="h-4 w-4" />
                      Child&apos;s voice not detected — ARIA has flagged this for follow-up.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="h-4 w-4 text-blue-500" /> Plan linkage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5">
                    {review.planLinks.map((p) => (
                      <li key={p.plan} className="flex items-start gap-2">
                        {p.detected ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[var(--cs-text-gentle)] mt-0.5 shrink-0" />
                        )}
                        <div>
                          <div className={cn(p.detected ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-muted)]")}>
                            {PLAN_LABEL[p.plan] ?? p.plan}
                          </div>
                          {p.detected && p.evidenceQuote ? (
                            <div className="text-xs text-[var(--cs-text-muted)] italic">…{p.evidenceQuote}…</div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {review.strengths.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {review.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-emerald-500">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              {review.missingEvidence.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4 text-amber-500" /> Missing evidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {review.missingEvidence.map((s, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-amber-500">!</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Right column — draft + summary + actions + regs */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" /> ARIA suggested draft
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> {editing ? "Stop editing" : "Edit"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea
                      value={editedDraft}
                      onChange={(e) => setEditedDraft(e.target.value)}
                      className="min-h-[220px] text-sm"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-[var(--cs-navy)] font-sans">
                      {editedDraft}
                    </pre>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ofsted-ready summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  ) : (
                    <p className="text-sm text-[var(--cs-text-secondary)]">{editedSummary}</p>
                  )}
                </CardContent>
              </Card>

              {review.suggestedActions.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ListChecks className="h-4 w-4 text-blue-500" /> Suggested follow-up actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {review.suggestedActions.map((a, i) => (
                        <li key={i} className="border-l-2 border-blue-200 pl-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{a.title}</span>
                            <Badge className={cn("border text-xs", PRIORITY_COLOUR[a.priority])}>
                              {a.priority}
                            </Badge>
                            <span className="text-xs text-[var(--cs-text-muted)]">due {a.dueDays}d · {a.assignedRole}</span>
                          </div>
                          <p className="text-sm text-[var(--cs-text-secondary)]">{a.description}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Scale className="h-4 w-4 text-[var(--cs-text-muted)]" /> Regulatory links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-[var(--cs-text-secondary)] space-y-1">
                    {review.regulatoryLinks.map((s, i) => (
                      <li key={i}>· {s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ── Decision panel ────────────────────────────────────────────── */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Manager decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-[var(--cs-text-muted)]">
                Acting as <span className="font-medium text-[var(--cs-text-secondary)]">{actorUserId}</span> ·
                {result?.reviewId
                  ? ` review ${result.reviewId}`
                  : " persistence not active — decisions cannot be audit-logged in this environment"}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Rejection reason (required for Reject)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="e.g. The risk grading is too low — this needs to be reviewed against the missing-from-care threshold."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Rewrite instructions (required for Request rewrite)</label>
                  <Textarea
                    value={rewriteInstructions}
                    onChange={(e) => setRewriteInstructions(e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="e.g. Strengthen the link to the BSP and remove vague closure language."
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => decide("approve")}
                  disabled={decisionPending !== null}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  {decisionPending === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve{editing ? " with edits" : ""}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("edit")}
                  disabled={decisionPending !== null || !editing}
                  className="gap-1.5"
                  title={!editing ? "Toggle Edit on the draft first" : undefined}
                >
                  {decisionPending === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  Save edit (still draft)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("request_rewrite")}
                  disabled={decisionPending !== null || rewriteInstructions.trim().length === 0}
                  className="gap-1.5"
                >
                  {decisionPending === "request_rewrite" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  Request rewrite
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("reject")}
                  disabled={decisionPending !== null || rejectionReason.trim().length === 0}
                  className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                >
                  {decisionPending === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </Button>
              </div>

              {decisionMessage ? (
                <div className="text-sm text-[var(--cs-text-secondary)] bg-slate-50 border border-[var(--cs-border)] rounded-md px-3 py-2">
                  {decisionMessage}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* ── Audit timeline ────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-[var(--cs-text-muted)]" /> Audit trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditTrail.length === 0 ? (
                <p className="text-xs text-[var(--cs-text-muted)]">
                  No audit entries — either persistence is not configured, or no events have been logged yet.
                </p>
              ) : (
                <ol className="space-y-3">
                  {auditTrail.map((e) => (
                    <li key={e.id} className="border-l-2 border-[var(--cs-border)] pl-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className="bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)] border text-xs">
                          {e.event_type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-[var(--cs-text-muted)]">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--cs-text-secondary)]">
                        {e.actor_user_id ? `by ${e.actor_user_id}` : "system"}
                        {e.actor_role ? ` · ${e.actor_role}` : ""}
                      </div>
                      {Object.keys(e.event_detail).length > 0 ? (
                        <pre className="mt-1 text-xs text-[var(--cs-text-muted)] bg-slate-50 rounded p-2 overflow-x-auto">
                          {JSON.stringify(e.event_detail, null, 2)}
                        </pre>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  );
}
