"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — HR PROCESS GUARDIAN (UI)
// Manager-facing fairness gate for draft HR actions. Use before sending any
// formal letter, suspension decision, or disciplinary outcome.
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
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCw,
  Pencil,
  Shield,
  Scale,
  Gavel,
  ListChecks,
  History,
  ShieldCheck,
} from "lucide-react";

const ACTION_TYPES = [
  { value: "investigation_invite", label: "Investigation invite letter" },
  { value: "witness_invite", label: "Witness invite letter" },
  { value: "disciplinary_invite", label: "Disciplinary invite letter" },
  { value: "grievance_invite", label: "Grievance invite letter" },
  { value: "suspension", label: "Suspension letter" },
  { value: "suspension_review", label: "Suspension review" },
  { value: "written_warning", label: "Written warning" },
  { value: "final_written_warning", label: "Final written warning" },
  { value: "dismissal", label: "Dismissal" },
  { value: "appeal_outcome", label: "Appeal outcome" },
  { value: "probation_outcome", label: "Probation outcome" },
  { value: "sickness_meeting", label: "Sickness / welfare meeting" },
  { value: "capability_meeting", label: "Capability meeting" },
  { value: "no_further_action", label: "No further action" },
  { value: "safeguarding_allegation_response", label: "Safeguarding allegation response" },
  { value: "generic_hr_action", label: "Other HR action" },
];

const HR_ROLES = [
  { value: "rm", label: "Registered Manager" },
  { value: "ri", label: "Responsible Individual" },
  { value: "deputy", label: "Deputy Manager" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "hr_caseworker", label: "HR Caseworker" },
  { value: "safeguarding", label: "Designated Safeguarding Lead" },
];

interface GuardianFlag {
  category: string;
  severity: "info" | "advisory" | "warning" | "block";
  message: string;
  suggestion?: string;
}

interface GuardianReview {
  generatedAt: string;
  status: string;
  caraLabel: string;
  fairnessScore: number;
  fairnessJudgement: "safe_to_approve" | "review_recommended" | "do_not_approve_yet";
  acasAlignment: Record<string, boolean | string>;
  safeguardingAlignment: Record<string, boolean | string>;
  discriminationRisk: { score: number; signals: string[] };
  proportionality: { rating: string; rationale: string };
  rightsCheck: {
    rightToBeAccompanied: boolean;
    appealRightsCommunicated: boolean;
    representationOffered: boolean;
    rationale: string;
  };
  evidenceQuality: { rating: string; notes: string[] };
  wordingRisk: { rating: string; issues: string[] };
  prejudgmentSignals: string[];
  flags: GuardianFlag[];
  suggestedSaferWording?: string;
  suggestedActions: {
    title: string;
    description: string;
    priority: "urgent" | "high" | "medium" | "low";
    dueDays: number;
    assignedRole: string;
  }[];
  regulatoryLinks: string[];
  caraConfidence: number;
  llmUsed: boolean;
  engineVersion: string;
}

interface AnalysisResult {
  reviewId?: string;
  review: GuardianReview;
  persisted: boolean;
}

const JUDGEMENT_COLOUR: Record<GuardianReview["fairnessJudgement"], string> = {
  safe_to_approve: "bg-emerald-100 text-emerald-800 border-emerald-200",
  review_recommended: "bg-amber-100 text-amber-800 border-amber-200",
  do_not_approve_yet: "bg-red-100 text-red-800 border-red-200",
};

const SEVERITY_COLOUR: Record<GuardianFlag["severity"], string> = {
  info: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  advisory: "bg-blue-100 text-blue-800 border-blue-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  block: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_COLOUR: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

export default function HrProcessGuardianPage() {
  // Inputs
  const [draftSubject, setDraftSubject] = useState("");
  const [draftActionType, setDraftActionType] = useState<string>("disciplinary_invite");
  const [draftBody, setDraftBody] = useState("");
  const [staffId, setStaffId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [actorUserId, setActorUserId] = useState("manager_demo_user");
  const [actorRole, setActorRole] = useState<string>("rm");

  // Optional context flags — manager-supplied
  const [investigationCompleted, setInvestigationCompleted] = useState(false);
  const [evidenceShared, setEvidenceShared] = useState(false);
  const [representationOffered, setRepresentationOffered] = useState(false);
  const [appealRightsCommunicated, setAppealRightsCommunicated] = useState(false);
  const [mitigationConsidered, setMitigationConsidered] = useState(false);
  const [priorWarningsRaw, setPriorWarningsRaw] = useState("");
  const [safeguardingStatus, setSafeguardingStatus] = useState<string>("not_safeguarding");
  const [childImpactStatus, setChildImpactStatus] = useState<string>("unknown");

  // Engine state
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Decision state
  const [editing, setEditing] = useState(false);
  const [editedSafer, setEditedSafer] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rewriteInstructions, setRewriteInstructions] = useState("");
  const [decisionPending, setDecisionPending] = useState<null | string>(null);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => draftSubject.trim().length > 0 && draftBody.trim().length > 30,
    [draftSubject, draftBody],
  );

  async function handleAnalyse() {
    setAnalysing(true);
    setError(null);
    setResult(null);
    setDecisionMessage(null);
    try {
      const priorWarnings = priorWarningsRaw
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/hr/process-guardian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftSubject: draftSubject.trim(),
          draftActionType,
          draftBody,
          staffId: staffId.trim() || undefined,
          caseId: caseId.trim() || undefined,
          caseContext: {
            investigationCompleted,
            evidenceShared,
            representationOffered,
            appealRightsCommunicated,
            mitigationConsidered,
            priorWarnings,
            safeguardingStatus,
            childImpactStatus,
          },
          actorUserId,
          actorRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Engine error");
      } else {
        setResult(data.data);
        setEditedSafer(data.data.review.suggestedSaferWording ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalysing(false);
    }
  }

  async function decide(decision: "approve" | "edit" | "reject" | "request_rewrite") {
    if (!result?.reviewId) {
      setDecisionMessage(
        "Persistence is not active in this environment. Decisions cannot be audit-logged. Configure Supabase to enable.",
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
        actorRole,
      };
      if ((decision === "approve" || decision === "edit") && editing) {
        body.editedSaferWording = editedSafer;
      }
      if (decision === "reject") body.rejectionReason = rejectionReason.trim();
      if (decision === "request_rewrite") body.rewriteInstructions = rewriteInstructions.trim();
      const res = await fetch("/api/hr/process-guardian", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionMessage(data.error ?? "Decision failed");
      } else {
        setDecisionMessage(`Recorded: ${decision.replace(/_/g, " ")}.`);
      }
    } catch (e) {
      setDecisionMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setDecisionPending(null);
    }
  }

  const review = result?.review;

  return (
    <PageShell title="Cara — HR Process Guardian">
      {/* Cara draft banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <Sparkles className="h-5 w-5 mt-0.5 text-[var(--cs-cara-gold)]" />
        <div>
          <div className="font-semibold">Cara suggested draft, never final</div>
          <p className="text-[var(--cs-navy)]">
            Run a draft HR letter, suspension decision, or disciplinary outcome
            through the Process Guardian before sending. The Guardian checks
            fairness, ACAS alignment, safeguarding handling, proportionality,
            discrimination risk, evidence quality, representation rights, appeal
            rights, and the wording itself. The Registered Manager remains the
            decision-maker and the author. Every approval, edit, rejection or
            rewrite request is audit-logged.
          </p>
        </div>
      </div>

      {/* Input — context */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Draft to review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Action type</label>
              <Select value={draftActionType} onValueChange={setDraftActionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Subject line</label>
              <Input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} placeholder="e.g. Invitation to disciplinary meeting" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Staff ID</label>
              <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. staff_123" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Case ID (optional)</label>
              <Input value={caseId} onChange={(e) => setCaseId(e.target.value)} placeholder="e.g. hrc_2026_0007" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Acting as</label>
              <Select value={actorRole} onValueChange={setActorRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {HR_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Actor user ID (audit log)</label>
              <Input value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Draft body</label>
            <Textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder="Paste the draft letter or decision wording. The Guardian will analyse it as written."
              className="min-h-[180px]"
            />
          </div>

          {/* Case context grid */}
          <div className="rounded-md border border-[var(--cs-border)] p-3 space-y-3">
            <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase">Case context</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <Checkbox label="Investigation completed" checked={investigationCompleted} onChange={setInvestigationCompleted} />
              <Checkbox label="Evidence shared with employee" checked={evidenceShared} onChange={setEvidenceShared} />
              <Checkbox label="Right to be accompanied offered" checked={representationOffered} onChange={setRepresentationOffered} />
              <Checkbox label="Appeal rights communicated" checked={appealRightsCommunicated} onChange={setAppealRightsCommunicated} />
              <Checkbox label="Mitigation considered" checked={mitigationConsidered} onChange={setMitigationConsidered} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Safeguarding status</label>
                <Select value={safeguardingStatus} onValueChange={setSafeguardingStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_safeguarding">Not safeguarding</SelectItem>
                    <SelectItem value="possible_safeguarding">Possible safeguarding</SelectItem>
                    <SelectItem value="safeguarding_open">Safeguarding open</SelectItem>
                    <SelectItem value="lado_consulted">LADO consulted</SelectItem>
                    <SelectItem value="lado_substantiated">LADO substantiated</SelectItem>
                    <SelectItem value="lado_unsubstantiated">LADO unsubstantiated</SelectItem>
                    <SelectItem value="lado_unfounded">LADO unfounded</SelectItem>
                    <SelectItem value="lado_malicious">LADO malicious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Child impact status</label>
                <Select value={childImpactStatus} onValueChange={setChildImpactStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_impact">No impact</SelectItem>
                    <SelectItem value="possible_impact">Possible impact</SelectItem>
                    <SelectItem value="direct_impact">Direct impact</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Prior warnings on file (one per line)</label>
              <Textarea
                value={priorWarningsRaw}
                onChange={(e) => setPriorWarningsRaw(e.target.value)}
                placeholder="e.g. 12/01/2026 written warning re recording standards"
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleAnalyse} disabled={!canSubmit || analysing} className="gap-2">
              {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analysing ? "Reviewing..." : "Run Process Guardian"}
            </Button>
          </div>
          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {review ? (
        <>
          {/* Headline */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Fairness score</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">{review.fairnessScore}<span className="text-base text-[var(--cs-text-muted)]">/100</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Judgement</div>
                <Badge className={cn("border", JUDGEMENT_COLOUR[review.fairnessJudgement])}>
                  {review.fairnessJudgement.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Proportionality</div>
                <div className="text-sm text-[var(--cs-navy)]">{review.proportionality.rating}</div>
                <div className="text-xs text-[var(--cs-text-muted)] mt-0.5 line-clamp-2">{review.proportionality.rationale}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Cara confidence</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">{Math.round(review.caraConfidence * 100)}%</div>
                <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{review.llmUsed ? "LLM-enhanced" : "Deterministic only"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Flags */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Flags ({(review.flags?.length ?? 0)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(review.flags?.length ?? 0) === 0 ? (
                <p className="text-sm text-emerald-700">No issues flagged. The draft reads as safe to approve based on the context provided.</p>
              ) : (
                <ul className="space-y-3">
                  {(review.flags ?? []).map((f, i) => (
                    <li key={i} className="border-l-2 pl-3" style={{ borderColor: f.severity === "block" ? "#fecaca" : f.severity === "warning" ? "#fde68a" : "#bfdbfe" }}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={cn("border text-xs", SEVERITY_COLOUR[f.severity])}>{f.severity}</Badge>
                        <span className="text-xs text-[var(--cs-text-muted)]">{f.category.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm text-[var(--cs-navy)]">{f.message}</p>
                      {f.suggestion ? (
                        <p className="text-xs text-[var(--cs-text-secondary)] mt-1 italic">Suggestion: {f.suggestion}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <SmallCard title="ACAS alignment" icon={<Scale className="h-4 w-4 text-[var(--cs-text-muted)]" />}>
                <Kv obj={review.acasAlignment} />
              </SmallCard>
              <SmallCard title="Safeguarding alignment" icon={<Shield className="h-4 w-4 text-[var(--cs-text-muted)]" />}>
                <Kv obj={review.safeguardingAlignment} />
              </SmallCard>
              <SmallCard title="Discrimination risk" icon={<Gavel className="h-4 w-4 text-[var(--cs-text-muted)]" />}>
                <p className="text-sm text-[var(--cs-text-secondary)]">Score: {review.discriminationRisk.score}</p>
                {review.discriminationRisk.signals.length > 0 ? (
                  <ul className="text-sm text-[var(--cs-text-secondary)] mt-1 space-y-1">
                    {review.discriminationRisk.signals.map((s, i) => (
                      <li key={i}>· Reference to {s} detected</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--cs-text-muted)]">No protected-characteristic references detected.</p>
                )}
              </SmallCard>
              <SmallCard title="Evidence quality" icon={<ListChecks className="h-4 w-4 text-[var(--cs-text-muted)]" />}>
                <p className="text-sm text-[var(--cs-text-secondary)]">Rating: {review.evidenceQuality.rating}</p>
                <ul className="text-sm text-[var(--cs-text-secondary)] mt-1 space-y-1">
                  {review.evidenceQuality.notes.map((s, i) => <li key={i}>· {s}</li>)}
                </ul>
              </SmallCard>
              <SmallCard title="Wording risk" icon={<Pencil className="h-4 w-4 text-[var(--cs-text-muted)]" />}>
                <p className="text-sm text-[var(--cs-text-secondary)]">Rating: {review.wordingRisk.rating}</p>
                {review.prejudgmentSignals.length > 0 ? (
                  <p className="text-xs text-[var(--cs-text-secondary)] mt-1">Prejudgment phrases detected: {review.prejudgmentSignals.join(", ")}</p>
                ) : null}
              </SmallCard>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Suggested safer wording
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> {editing ? "Stop editing" : "Edit"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea value={editedSafer} onChange={(e) => setEditedSafer(e.target.value)} className="min-h-[260px] text-sm" />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-[var(--cs-navy)] font-sans">{editedSafer}</pre>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rights check</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1.5">
                    <RightsLine label="Right to be accompanied" ok={review.rightsCheck.rightToBeAccompanied} />
                    <RightsLine label="Appeal rights communicated" ok={review.rightsCheck.appealRightsCommunicated} />
                    <RightsLine label="Representation offered" ok={review.rightsCheck.representationOffered} />
                  </ul>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-2">{review.rightsCheck.rationale}</p>
                </CardContent>
              </Card>

              {review.suggestedActions.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Suggested actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {review.suggestedActions.map((a, i) => (
                        <li key={i} className="border-l-2 border-blue-200 pl-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{a.title}</span>
                            <Badge className={cn("border text-xs", PRIORITY_COLOUR[a.priority] ?? "")}>{a.priority}</Badge>
                            <span className="text-xs text-[var(--cs-text-muted)]">due {a.dueDays}d, {a.assignedRole}</span>
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
                  <CardTitle className="text-base">Regulatory framework</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-[var(--cs-text-secondary)] space-y-1">
                    {review.regulatoryLinks.map((s, i) => <li key={i}>· {s}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Decision panel */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-[var(--cs-text-muted)]" /> Manager decision
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-[var(--cs-text-muted)]">
                Acting as <span className="font-medium text-[var(--cs-text-secondary)]">{actorUserId}</span> ({actorRole}).
                {result?.reviewId ? ` Review ${result.reviewId}` : " Persistence not active in this environment."}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Rejection reason (required for Reject)</label>
                  <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="min-h-[60px] text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Rewrite instructions (required for Request rewrite)</label>
                  <Textarea value={rewriteInstructions} onChange={(e) => setRewriteInstructions(e.target.value)} className="min-h-[60px] text-sm" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => decide("approve")} disabled={decisionPending !== null} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  {decisionPending === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve{editing ? " with edits" : ""}
                </Button>
                <Button variant="outline" onClick={() => decide("edit")} disabled={decisionPending !== null || !editing} className="gap-1.5">
                  {decisionPending === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  Save edit (still draft)
                </Button>
                <Button variant="outline" onClick={() => decide("request_rewrite")} disabled={decisionPending !== null || rewriteInstructions.trim().length === 0} className="gap-1.5">
                  {decisionPending === "request_rewrite" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  Request rewrite
                </Button>
                <Button variant="outline" onClick={() => decide("reject")} disabled={decisionPending !== null || rejectionReason.trim().length === 0} className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50">
                  {decisionPending === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Reject
                </Button>
              </div>

              {decisionMessage ? (
                <div className="text-sm text-[var(--cs-text-secondary)] bg-slate-50 border border-[var(--cs-border)] rounded-md px-3 py-2">{decisionMessage}</div>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--cs-text-secondary)]">
            <p className="font-medium text-[var(--cs-navy)] mb-1">Empty state</p>
            <p>
              Paste a draft HR letter or decision wording above and run the
              Process Guardian. The Guardian will check fairness, ACAS
              alignment, safeguarding handling, proportionality, discrimination
              risk, evidence quality, representation rights, appeal rights, and
              the wording itself. The Registered Manager remains the
              decision-maker and the author.
            </p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

// ─── Local components ────────────────────────────────────────────────────────

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

function SmallCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Kv({ obj }: { obj: Record<string, boolean | string> }) {
  const entries = Object.entries(obj);
  if (entries.length === 0) return <p className="text-xs text-[var(--cs-text-muted)]">No data captured for this check.</p>;
  return (
    <ul className="text-sm space-y-1">
      {entries.map(([k, v]) => (
        <li key={k} className="flex items-center gap-2">
          <span className="text-[var(--cs-text-muted)] text-xs">{k.replace(/_/g, " ")}:</span>
          <span className="text-[var(--cs-navy)]">{typeof v === "boolean" ? (v ? "yes" : "no") : v}</span>
        </li>
      ))}
    </ul>
  );
}

function RightsLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-amber-500" />}
      <span className={cn("text-sm", ok ? "text-[var(--cs-navy)]" : "text-amber-800")}>{label}</span>
    </li>
  );
}
