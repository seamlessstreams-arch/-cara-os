"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR — LETTER GENERATOR (UI)
//
// Pick a letter type, fill in the context, generate the draft, see the HR
// Process Guardian's review, edit if needed, and approve / send. The Guardian
// gate is enforced server-side: a letter cannot be approved or sent while the
// fairness judgement is do_not_approve_yet, unless an RI supplies a written
// senior risk acceptance.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
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
  Send,
  Pencil,
  XCircle,
  ShieldCheck,
  Mail,
  Scale,
} from "lucide-react";

const LETTER_TYPES = [
  { value: "investigation_invite", label: "Investigation invite" },
  { value: "witness_invite", label: "Witness invite" },
  { value: "disciplinary_invite", label: "Disciplinary invite" },
  { value: "grievance_invite", label: "Grievance invite" },
  { value: "suspension", label: "Suspension" },
  { value: "suspension_review", label: "Suspension review" },
  { value: "no_further_action", label: "No further action" },
  { value: "informal_concern", label: "Informal concern note" },
  { value: "written_warning", label: "Written warning" },
  { value: "final_written_warning", label: "Final written warning" },
  { value: "dismissal", label: "Dismissal" },
  { value: "appeal_invite", label: "Appeal invite" },
  { value: "appeal_outcome", label: "Appeal outcome" },
  { value: "probation_review", label: "Probation review" },
  { value: "probation_extension", label: "Probation extension" },
  { value: "probation_confirmation", label: "Probation confirmation" },
  { value: "failed_probation", label: "Failed probation" },
  { value: "sickness_meeting", label: "Sickness meeting" },
  { value: "welfare_meeting", label: "Welfare meeting" },
  { value: "occupational_health_referral", label: "Occupational health referral" },
  { value: "return_to_work_outcome", label: "Return to work outcome" },
  { value: "capability_meeting", label: "Capability meeting" },
  { value: "performance_improvement_plan", label: "Performance improvement plan" },
  { value: "mediation_invite", label: "Mediation invite" },
  { value: "whistleblowing_acknowledgement", label: "Whistleblowing acknowledgement" },
  { value: "safeguarding_allegation_holding", label: "Safeguarding allegation holding" },
];

const HR_ROLES = [
  { value: "rm", label: "Registered Manager" },
  { value: "ri", label: "Responsible Individual" },
  { value: "deputy", label: "Deputy Manager" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "hr_caseworker", label: "HR Caseworker" },
  { value: "safeguarding", label: "Designated Safeguarding Lead" },
];

interface Flag {
  category: string;
  severity: "info" | "advisory" | "warning" | "block";
  message: string;
  suggestion?: string;
}

interface GuardianReview {
  fairnessScore: number;
  fairnessJudgement: "safe_to_approve" | "review_recommended" | "do_not_approve_yet";
  flags: Flag[];
  proportionality: { rating: string; rationale: string };
  rightsCheck: {
    rightToBeAccompanied: boolean;
    appealRightsCommunicated: boolean;
    representationOffered: boolean;
    rationale: string;
  };
  suggestedSaferWording?: string;
  ariaConfidence: number;
  llmUsed: boolean;
}

interface Result {
  letterId?: string;
  letter: { id?: string; draftBody: string; status: string; letterType: string };
  guardianReviewId?: string | null;
  guardianReview?: GuardianReview;
  persisted: boolean;
}

const JUDGEMENT_COLOUR: Record<GuardianReview["fairnessJudgement"], string> = {
  safe_to_approve: "bg-emerald-100 text-emerald-800 border-emerald-200",
  review_recommended: "bg-amber-100 text-amber-800 border-amber-200",
  do_not_approve_yet: "bg-red-100 text-red-800 border-red-200",
};

const SEVERITY_COLOUR: Record<Flag["severity"], string> = {
  info: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  advisory: "bg-blue-100 text-blue-800 border-blue-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  block: "bg-red-100 text-red-800 border-red-200",
};

export default function HrLettersPage() {
  // Identity
  const [actorUserId, setActorUserId] = useState("manager_demo_user");
  const [actorRole, setActorRole] = useState("rm");

  // Letter selection
  const [letterType, setLetterType] = useState("disciplinary_invite");
  const [staffId, setStaffId] = useState("");
  const [caseId, setCaseId] = useState("");

  // Letter context
  const [recipientName, setRecipientName] = useState("");
  const [homeName, setHomeName] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerRole, setManagerRole] = useState("Registered Manager");
  const [contactName, setContactName] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [effectiveFromDate, setEffectiveFromDate] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [appealDeadlineDays, setAppealDeadlineDays] = useState(5);
  const [concernNarrative, setConcernNarrative] = useState("");
  const [outcomeNarrative, setOutcomeNarrative] = useState("");
  const [basisNarrative, setBasisNarrative] = useState("");
  const [improvementsExpected, setImprovementsExpected] = useState("");
  const [supportProvided, setSupportProvided] = useState("");

  // Engine state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Decision state
  const [editedBody, setEditedBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [seniorRiskAcceptance, setSeniorRiskAcceptance] = useState("");
  const [decisionPending, setDecisionPending] = useState<null | string>(null);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);

  const canGenerate = useMemo(() => staffId.trim().length > 0 && recipientName.trim().length > 0, [staffId, recipientName]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    setDecisionMessage(null);
    try {
      const res = await fetch("/api/hr/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId,
          actorRole,
          letterType,
          staffId: staffId.trim(),
          caseId: caseId.trim() || undefined,
          letterContext: {
            recipientName: recipientName.trim(),
            homeName: homeName.trim() || undefined,
            caseRefDisplay: caseId.trim() || undefined,
            meetingDate: meetingDate || undefined,
            meetingTime: meetingTime || undefined,
            meetingLocation: meetingLocation || undefined,
            managerName: managerName.trim() || undefined,
            managerRole: managerRole.trim() || undefined,
            contactName: contactName.trim() || undefined,
            contactDetails: contactDetails.trim() || undefined,
            effectiveFromDate: effectiveFromDate || undefined,
            reviewDate: reviewDate || undefined,
            appealDeadlineDays: Number.isFinite(appealDeadlineDays) ? appealDeadlineDays : 5,
            concernNarrative: concernNarrative.trim() || undefined,
            outcomeNarrative: outcomeNarrative.trim() || undefined,
            basisNarrative: basisNarrative.trim() || undefined,
            improvementsExpected: improvementsExpected.trim() || undefined,
            supportProvided: supportProvided.trim() || undefined,
          },
          runGuardian: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Engine error");
      } else {
        setResult(data.data);
        setEditedBody(data.data.letter.draftBody);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function decide(decision: "edit" | "approve" | "send" | "withdraw") {
    if (!result?.letterId) {
      setDecisionMessage("Persistence is not active in this environment. Decisions cannot be audit-logged.");
      return;
    }
    setDecisionPending(decision);
    setDecisionMessage(null);
    try {
      const res = await fetch("/api/hr/letters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterId: result.letterId,
          decision,
          actorUserId,
          actorRole,
          editedBody: decision === "edit" || (decision === "approve" && editing) ? editedBody : undefined,
          seniorRiskAcceptance: seniorRiskAcceptance.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionMessage(data.error ?? "Decision failed");
      } else {
        setDecisionMessage(`Recorded: ${decision}.`);
      }
    } catch (e) {
      setDecisionMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setDecisionPending(null);
    }
  }

  const guardian = result?.guardianReview;
  const blocking = guardian?.fairnessJudgement === "do_not_approve_yet";

  return (
    <PageShell title="HR — Letter Generator">
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <Sparkles className="h-5 w-5 mt-0.5 text-[var(--cs-aria-gold)]" />
        <div>
          <div className="font-semibold">ARIA suggested draft, never final</div>
          <p className="text-[var(--cs-navy)]">
            Pick a letter type, fill in the context, and ARIA will produce a starting-point draft and run it through
            the HR Process Guardian. The Guardian checks fairness, ACAS alignment, safeguarding handling,
            proportionality, discrimination risk, evidence quality, representation rights, appeal rights, and the
            wording itself. Letters cannot be approved or sent while the fairness judgement is
            do_not_approve_yet, unless an RI supplies a written senior risk acceptance.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Letter setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Letter type</label>
              <Select value={letterType} onValueChange={setLetterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LETTER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Staff id</label>
              <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. staff_123" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Case id (optional)</label>
              <Input value={caseId} onChange={(e) => setCaseId(e.target.value)} />
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Actor user id (audit log)</label>
              <Input value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient name" />
            <Input value={homeName} onChange={(e) => setHomeName(e.target.value)} placeholder="Home name" />
            <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Manager name" />
            <Input value={managerRole} onChange={(e) => setManagerRole(e.target.value)} placeholder="Manager role" />
            <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Welfare / point of contact name" />
            <Input value={contactDetails} onChange={(e) => setContactDetails(e.target.value)} placeholder="Welfare / point of contact details" />
            <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} placeholder="Meeting date" />
            <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} placeholder="Meeting time" />
            <Input value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} placeholder="Meeting location" />
            <Input type="date" value={effectiveFromDate} onChange={(e) => setEffectiveFromDate(e.target.value)} placeholder="Effective from" />
            <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} placeholder="Review date" />
            <Input
              type="number"
              min={1}
              max={28}
              value={appealDeadlineDays}
              onChange={(e) => setAppealDeadlineDays(Math.max(1, parseInt(e.target.value || "5", 10)))}
              placeholder="Appeal deadline (days)"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Concern narrative</label>
              <Textarea value={concernNarrative} onChange={(e) => setConcernNarrative(e.target.value)} className="min-h-[80px] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Outcome narrative</label>
              <Textarea value={outcomeNarrative} onChange={(e) => setOutcomeNarrative(e.target.value)} className="min-h-[80px] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Basis narrative</label>
              <Textarea value={basisNarrative} onChange={(e) => setBasisNarrative(e.target.value)} className="min-h-[80px] text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Improvements expected</label>
              <Textarea value={improvementsExpected} onChange={(e) => setImprovementsExpected(e.target.value)} className="min-h-[80px] text-sm" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Support that will be provided</label>
              <Textarea value={supportProvided} onChange={(e) => setSupportProvided(e.target.value)} className="min-h-[80px] text-sm" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleGenerate} disabled={!canGenerate || generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Generating..." : "Generate draft and run Guardian"}
            </Button>
          </div>
          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <>
          {/* Guardian summary tiles */}
          {guardian ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Fairness score</div>
                  <div className="text-3xl font-semibold text-[var(--cs-navy)]">{guardian.fairnessScore}<span className="text-base text-[var(--cs-text-muted)]">/100</span></div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Judgement</div>
                  <Badge className={cn("border", JUDGEMENT_COLOUR[guardian.fairnessJudgement])}>
                    {guardian.fairnessJudgement.replace(/_/g, " ")}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Proportionality</div>
                  <div className="text-sm text-[var(--cs-navy)]">{guardian.proportionality.rating}</div>
                  <div className="text-xs text-[var(--cs-text-muted)] mt-0.5 line-clamp-2">{guardian.proportionality.rationale}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">ARIA confidence</div>
                  <div className="text-3xl font-semibold text-[var(--cs-navy)]">{Math.round(guardian.ariaConfidence * 100)}%</div>
                  <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{guardian.llmUsed ? "LLM-enhanced" : "Deterministic only"}</div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Draft letter
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> {editing ? "Stop editing" : "Edit"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea value={editedBody} onChange={(e) => setEditedBody(e.target.value)} className="min-h-[360px] text-sm" />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-[var(--cs-navy)] font-sans">{editedBody}</pre>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4 w-4 text-[var(--cs-text-muted)]" /> Rights check
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {guardian ? (
                    <ul className="text-sm space-y-1.5">
                      <RightsLine label="Right to be accompanied" ok={guardian.rightsCheck.rightToBeAccompanied} />
                      <RightsLine label="Appeal rights communicated" ok={guardian.rightsCheck.appealRightsCommunicated} />
                      <RightsLine label="Representation offered" ok={guardian.rightsCheck.representationOffered} />
                    </ul>
                  ) : (
                    <p className="text-xs text-[var(--cs-text-muted)]">Guardian was not run.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!guardian ? (
                    <p className="text-xs text-[var(--cs-text-muted)]">Guardian was not run.</p>
                  ) : guardian.flags.length === 0 ? (
                    <p className="text-sm text-emerald-700">No issues flagged.</p>
                  ) : (
                    <ul className="space-y-3">
                      {guardian.flags.map((f, i) => (
                        <li key={i} className="border-l-2 pl-3" style={{ borderColor: f.severity === "block" ? "#fecaca" : f.severity === "warning" ? "#fde68a" : "#bfdbfe" }}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={cn("border text-xs", SEVERITY_COLOUR[f.severity])}>{f.severity}</Badge>
                            <span className="text-xs text-[var(--cs-text-muted)]">{f.category}</span>
                          </div>
                          <p className="text-sm text-[var(--cs-navy)]">{f.message}</p>
                          {f.suggestion ? <p className="text-xs text-[var(--cs-text-secondary)] mt-1 italic">Suggestion: {f.suggestion}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {guardian?.suggestedSaferWording ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Scale className="h-4 w-4 text-[var(--cs-text-muted)]" /> Suggested safer wording
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm text-[var(--cs-navy)] font-sans">{guardian.suggestedSaferWording}</pre>
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setEditedBody(guardian.suggestedSaferWording ?? editedBody)}>
                      <Pencil className="h-3.5 w-3.5" /> Use as draft
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-[var(--cs-text-muted)]">
                Acting as <span className="font-medium text-[var(--cs-text-secondary)]">{actorUserId}</span> ({actorRole}).
                {result.letterId ? ` Letter ${result.letterId}.` : " Persistence not active."}
              </div>

              {blocking ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-sm text-red-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div>
                      <div className="font-semibold">Process Guardian gate active</div>
                      <p>The fairness judgement is do_not_approve_yet. Approval and sending are blocked. An RI may override by supplying a written senior risk acceptance below.</p>
                    </div>
                  </div>
                  {actorRole === "ri" ? (
                    <Textarea
                      value={seniorRiskAcceptance}
                      onChange={(e) => setSeniorRiskAcceptance(e.target.value)}
                      placeholder="As Responsible Individual, I have considered the Guardian's findings and accept the following residual risk because..."
                      className="min-h-[80px] text-sm"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => decide("edit")} disabled={decisionPending !== null || !editing} className="gap-1.5">
                  {decisionPending === "edit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                  Save edit
                </Button>
                <Button onClick={() => decide("approve")} disabled={decisionPending !== null} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                  {decisionPending === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </Button>
                <Button onClick={() => decide("send")} disabled={decisionPending !== null} className="gap-1.5">
                  {decisionPending === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
                <Button variant="outline" onClick={() => decide("withdraw")} disabled={decisionPending !== null} className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50">
                  {decisionPending === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Withdraw
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
            <p>Pick a letter type and fill in the context. ARIA generates a starting-point draft and runs it through the Process Guardian.</p>
          </CardContent>
        </Card>
      )}
    </PageShell>
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
