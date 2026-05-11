"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR — SUSPENSION DECISION TOOL (UI)
//
// Manager-facing risk assessment for whether to suspend, with welfare plan,
// alternatives review, advice trail, and proposed decision. Produces an
// ARIA suggested draft of written reasons. Manager remains the decision-maker
// and is expected to also run the suspension letter itself through the
// HR Process Guardian (separate page).
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
  ShieldCheck,
  Heart,
  Calendar,
  ListChecks,
} from "lucide-react";

type RiskRating = "low" | "medium" | "high" | "very_high";

const RISK_OPTIONS: { value: RiskRating; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very high" },
];

const RISK_FACTORS: { key: string; label: string; help: string }[] = [
  {
    key: "risk_to_children",
    label: "Risk to children in the home",
    help: "What is the assessed risk to the children if the staff member remains on shift while the matter is investigated?",
  },
  {
    key: "risk_to_witnesses",
    label: "Risk to witnesses",
    help: "Could the staff member's presence influence what other staff or children say during the investigation?",
  },
  {
    key: "risk_to_evidence",
    label: "Risk to evidence",
    help: "Is there a risk of records, recordings or other evidence being affected?",
  },
  {
    key: "risk_to_staff_member",
    label: "Risk to the staff member",
    help: "What welfare or safety risks apply to the staff member if they remain in the workplace right now?",
  },
  {
    key: "risk_of_repeat_incident",
    label: "Risk of repeat incident",
    help: "Based on what is known so far, what is the assessed risk of a similar concern arising again?",
  },
];

const ALTERNATIVES = [
  { value: "adjusted_duties", label: "Adjusted duties" },
  { value: "increased_supervision", label: "Increased supervision" },
  { value: "redeployment_within_home", label: "Redeployment within the home" },
  { value: "redeployment_other_home", label: "Redeployment to another home" },
  { value: "remote_or_admin_only", label: "Remote or admin-only work" },
  { value: "training_or_mentoring_first", label: "Training or mentoring first" },
  { value: "no_change_required", label: "No change required" },
];

const HR_ROLES = [
  { value: "rm", label: "Registered Manager" },
  { value: "ri", label: "Responsible Individual" },
  { value: "deputy", label: "Deputy Manager" },
  { value: "hr_admin", label: "HR Admin" },
  { value: "hr_caseworker", label: "HR Caseworker" },
  { value: "safeguarding", label: "Designated Safeguarding Lead" },
];

type ProposedDecision = "suspend" | "do_not_suspend" | "alternative_arrangement";

interface Flag {
  category: string;
  severity: "info" | "advisory" | "warning" | "block";
  message: string;
  suggestion?: string;
}

interface Analysis {
  generatedAt: string;
  status: string;
  ariaLabel: string;
  overallRiskGrade: RiskRating;
  highestRiskFactor: string;
  rationaleSummary: string;
  proportionalityRating: "proportionate" | "borderline" | "disproportionate";
  proportionalityRationale: string;
  flags: Flag[];
  suggestedActions: {
    title: string;
    description: string;
    priority: "urgent" | "high" | "medium" | "low";
    dueDays: number;
    assignedRole: string;
  }[];
  writtenReasonsDraft: string;
  reviewSchedule: { reviewNumber: number; expectedDate: string }[];
  regulatoryLinks: string[];
  ariaConfidence: number;
  engineVersion: string;
}

const RISK_COLOUR: Record<RiskRating, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  very_high: "bg-red-100 text-red-800 border-red-200",
};

const PROPORTIONALITY_COLOUR: Record<Analysis["proportionalityRating"], string> = {
  proportionate: "bg-emerald-100 text-emerald-800 border-emerald-200",
  borderline: "bg-amber-100 text-amber-800 border-amber-200",
  disproportionate: "bg-red-100 text-red-800 border-red-200",
};

const SEVERITY_COLOUR: Record<Flag["severity"], string> = {
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

export default function SuspensionDecisionPage() {
  // Identity
  const [actorUserId, setActorUserId] = useState("manager_demo_user");
  const [actorRole, setActorRole] = useState<string>("rm");
  const [staffId, setStaffId] = useState("");
  const [caseId, setCaseId] = useState("");

  // Concern
  const [concernSummary, setConcernSummary] = useState("");

  // Risk factors
  const [riskFactors, setRiskFactors] = useState<Record<string, { rating: RiskRating; rationale: string }>>(
    Object.fromEntries(RISK_FACTORS.map((f) => [f.key, { rating: "low" as RiskRating, rationale: "" }])),
  );

  // Alternatives
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [alternativeRejectionRationale, setAlternativeRejectionRationale] = useState("");

  // Advice
  const [hrAdviceSought, setHrAdviceSought] = useState(false);
  const [hrAdviceSummary, setHrAdviceSummary] = useState("");
  const [riAdviceSought, setRiAdviceSought] = useState(false);
  const [riAdviceSummary, setRiAdviceSummary] = useState("");
  const [ladoAdviceSought, setLadoAdviceSought] = useState(false);
  const [ladoAdviceSummary, setLadoAdviceSummary] = useState("");
  const [ladoAdviceDate, setLadoAdviceDate] = useState("");
  const [policeOrSwInvolved, setPoliceOrSwInvolved] = useState(false);
  const [policeOrSwNotes, setPoliceOrSwNotes] = useState("");

  // Welfare plan
  const [welfareSinglePointOfContact, setWelfareSinglePointOfContact] = useState("");
  const [welfareSupportRaw, setWelfareSupportRaw] = useState("");
  const [welfareReviewIntervalDays, setWelfareReviewIntervalDays] = useState(14);
  const [firstReviewDate, setFirstReviewDate] = useState("");

  // Decision
  const [proposedDecision, setProposedDecision] = useState<ProposedDecision>("suspend");
  const [alternativeArrangementDescription, setAlternativeArrangementDescription] = useState("");
  const [effectiveFromDate, setEffectiveFromDate] = useState("");

  // Engine state
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => staffId.trim().length > 0 && concernSummary.trim().length >= 10,
    [staffId, concernSummary],
  );

  function toggleAlternative(value: string) {
    setAlternatives((curr) => (curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value]));
  }

  async function handleAnalyse() {
    setAnalysing(true);
    setError(null);
    setAnalysis(null);
    try {
      const welfareSupportOffered = welfareSupportRaw
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/hr/suspension-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId,
          actorRole,
          staffId: staffId.trim(),
          caseId: caseId.trim() || undefined,
          concernSummary: concernSummary.trim(),
          riskFactors,
          alternativesConsidered: alternatives,
          alternativeRejectionRationale,
          hrAdviceSought,
          hrAdviceSummary: hrAdviceSummary.trim() || undefined,
          riAdviceSought,
          riAdviceSummary: riAdviceSummary.trim() || undefined,
          ladoAdviceSought,
          ladoAdviceSummary: ladoAdviceSummary.trim() || undefined,
          ladoAdviceDate: ladoAdviceDate || undefined,
          policeOrSocialWorkerInvolved: policeOrSwInvolved,
          policeOrSocialWorkerNotes: policeOrSwNotes.trim() || undefined,
          welfareSinglePointOfContact: welfareSinglePointOfContact.trim(),
          welfareSupportOffered,
          welfareReviewIntervalDays,
          firstReviewDate,
          proposedDecision,
          alternativeArrangementDescription: alternativeArrangementDescription.trim() || undefined,
          effectiveFromDate: effectiveFromDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Engine error");
      } else {
        setAnalysis(data.data.analysis);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalysing(false);
    }
  }

  return (
    <PageShell title="HR — Suspension Decision Tool">
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <Sparkles className="h-5 w-5 mt-0.5 text-[var(--cs-aria-gold)]" />
        <div>
          <div className="font-semibold">ARIA suggested draft, never final</div>
          <p className="text-[var(--cs-navy)]">
            Use this tool to think through whether suspension is the proportionate response. Suspension is a neutral
            act pending investigation. The output is a structured risk assessment, a welfare plan, and an ARIA
            suggested draft of written reasons. The Registered Manager remains the decision-maker. The suspension
            letter itself should be drafted separately and run through the HR Process Guardian before sending.
          </p>
        </div>
      </div>

      {/* Identity + concern */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-[var(--cs-aria-gold)]" /> Identity and concern
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Actor user id</label>
              <Input value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Staff id</label>
              <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. staff_123" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Case id (optional)</label>
              <Input value={caseId} onChange={(e) => setCaseId(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Concern summary</label>
            <Textarea
              value={concernSummary}
              onChange={(e) => setConcernSummary(e.target.value)}
              placeholder="What concern has been raised? Stick to the facts. The Process Guardian will review the language of any letter separately."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk factors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {RISK_FACTORS.map((f) => (
            <div key={f.key} className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start border-b border-[var(--cs-border-subtle)] pb-3 last:border-0 last:pb-0">
              <div>
                <div className="text-sm font-medium text-[var(--cs-navy)]">{f.label}</div>
                <div className="text-xs text-[var(--cs-text-muted)]">{f.help}</div>
              </div>
              <Select
                value={riskFactors[f.key].rating}
                onValueChange={(v) =>
                  setRiskFactors((curr) => ({ ...curr, [f.key]: { ...curr[f.key], rating: v as RiskRating } }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={riskFactors[f.key].rationale}
                onChange={(e) =>
                  setRiskFactors((curr) => ({ ...curr, [f.key]: { ...curr[f.key], rationale: e.target.value } }))
                }
                placeholder="Rationale (what evidence supports this rating)"
                className="min-h-[60px] text-sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alternatives */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Alternatives considered</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALTERNATIVES.map((a) => (
              <label key={a.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={alternatives.includes(a.value)}
                  onChange={() => toggleAlternative(a.value)}
                />
                <span>{a.label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">
              Rationale for not proceeding with an alternative
            </label>
            <Textarea
              value={alternativeRejectionRationale}
              onChange={(e) => setAlternativeRejectionRationale(e.target.value)}
              placeholder="Explain why each alternative considered was not adequate to manage the assessed risks."
              className="min-h-[80px] text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advice */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Advice sought</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AdviceRow
            label="HR advice"
            sought={hrAdviceSought}
            onSoughtChange={setHrAdviceSought}
            summary={hrAdviceSummary}
            onSummaryChange={setHrAdviceSummary}
          />
          <AdviceRow
            label="RI advice"
            sought={riAdviceSought}
            onSoughtChange={setRiAdviceSought}
            summary={riAdviceSummary}
            onSummaryChange={setRiAdviceSummary}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="h-4 w-4" checked={ladoAdviceSought} onChange={(e) => setLadoAdviceSought(e.target.checked)} />
              <span>LADO consulted</span>
            </label>
            <Input type="date" value={ladoAdviceDate} onChange={(e) => setLadoAdviceDate(e.target.value)} placeholder="LADO advice date" />
            <Textarea
              value={ladoAdviceSummary}
              onChange={(e) => setLadoAdviceSummary(e.target.value)}
              placeholder="LADO advice summary"
              className="min-h-[60px] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="h-4 w-4" checked={policeOrSwInvolved} onChange={(e) => setPoliceOrSwInvolved(e.target.checked)} />
              <span>Police or social worker involved</span>
            </label>
            <Textarea
              value={policeOrSwNotes}
              onChange={(e) => setPoliceOrSwNotes(e.target.value)}
              placeholder="Notes on police / social worker involvement"
              className="min-h-[60px] text-sm lg:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Welfare plan */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-rose-500" /> Welfare plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Input
              value={welfareSinglePointOfContact}
              onChange={(e) => setWelfareSinglePointOfContact(e.target.value)}
              placeholder="Single point of contact (name, role)"
            />
            <Input
              type="number"
              min={1}
              max={90}
              value={welfareReviewIntervalDays}
              onChange={(e) => setWelfareReviewIntervalDays(Math.max(1, parseInt(e.target.value || "14", 10)))}
              placeholder="Review interval (days)"
            />
            <Input type="date" value={firstReviewDate} onChange={(e) => setFirstReviewDate(e.target.value)} placeholder="First review date" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Welfare support offered (one per line)</label>
            <Textarea
              value={welfareSupportRaw}
              onChange={(e) => setWelfareSupportRaw(e.target.value)}
              placeholder={
                "Occupational health referral\nEmployee assistance programme\nTrade union or external support such as ACAS"
              }
              className="min-h-[80px] text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Decision */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Proposed decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={proposedDecision} onValueChange={(v) => setProposedDecision(v as ProposedDecision)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="suspend">Suspend (neutral act)</SelectItem>
                <SelectItem value="alternative_arrangement">Alternative arrangement</SelectItem>
                <SelectItem value="do_not_suspend">Do not suspend</SelectItem>
              </SelectContent>
            </Select>
            {proposedDecision === "suspend" ? (
              <Input type="date" value={effectiveFromDate} onChange={(e) => setEffectiveFromDate(e.target.value)} placeholder="Effective from" />
            ) : null}
          </div>
          {proposedDecision === "alternative_arrangement" ? (
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Alternative arrangement description</label>
              <Textarea
                value={alternativeArrangementDescription}
                onChange={(e) => setAlternativeArrangementDescription(e.target.value)}
                placeholder="Describe the duties, hours, supervision, contact with children, and review interval."
                className="min-h-[80px] text-sm"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleAnalyse} disabled={!canSubmit || analysing} className="gap-2">
              {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analysing ? "Analysing..." : "Run suspension decision tool"}
            </Button>
          </div>
          {error ? (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {analysis ? (
        <>
          {/* Headline */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Aggregate risk</div>
                <Badge className={cn("border", RISK_COLOUR[analysis.overallRiskGrade])}>
                  {analysis.overallRiskGrade.replace(/_/g, " ")}
                </Badge>
                <div className="text-xs text-[var(--cs-text-muted)] mt-1">
                  Driven by {analysis.highestRiskFactor.replace(/_/g, " ")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Proportionality</div>
                <Badge className={cn("border", PROPORTIONALITY_COLOUR[analysis.proportionalityRating])}>
                  {analysis.proportionalityRating}
                </Badge>
                <div className="text-xs text-[var(--cs-text-muted)] mt-1 line-clamp-2">{analysis.proportionalityRationale}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Flags</div>
                <div className="flex gap-2 text-sm">
                  <span className="text-red-700">{analysis.flags.filter((f) => f.severity === "block").length} block</span>
                  <span className="text-amber-700">{analysis.flags.filter((f) => f.severity === "warning").length} warn</span>
                  <span className="text-blue-700">{analysis.flags.filter((f) => f.severity === "advisory").length} advisory</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">ARIA confidence</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">{Math.round(analysis.ariaConfidence * 100)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.flags.length === 0 ? (
                    <p className="text-sm text-emerald-700">
                      No issues flagged on the context provided. The decision can move ahead.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {analysis.flags.map((f, i) => (
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

              {analysis.suggestedActions.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ListChecks className="h-4 w-4 text-blue-500" /> Suggested actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.suggestedActions.map((a, i) => (
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
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" /> ARIA suggested draft of written reasons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-[var(--cs-navy)] font-sans">{analysis.writtenReasonsDraft}</pre>
                </CardContent>
              </Card>

              {analysis.reviewSchedule.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-[var(--cs-text-muted)]" /> Suggested review schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {analysis.reviewSchedule.map((r) => (
                        <li key={r.reviewNumber} className="flex justify-between">
                          <span>Review {r.reviewNumber}</span>
                          <span className="text-[var(--cs-text-secondary)]">{r.expectedDate}</span>
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
                    {analysis.regulatoryLinks.map((s, i) => <li key={i}>· {s}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

function AdviceRow({
  label,
  sought,
  onSoughtChange,
  summary,
  onSummaryChange,
}: {
  label: string;
  sought: boolean;
  onSoughtChange: (v: boolean) => void;
  summary: string;
  onSummaryChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input type="checkbox" className="h-4 w-4" checked={sought} onChange={(e) => onSoughtChange(e.target.checked)} />
        <span>{label} sought</span>
      </label>
      <Textarea
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
        placeholder={`${label} summary`}
        className="min-h-[60px] text-sm lg:col-span-2"
      />
    </div>
  );
}
