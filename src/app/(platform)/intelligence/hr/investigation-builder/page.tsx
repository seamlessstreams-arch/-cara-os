"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR — INVESTIGATION BUILDER (UI)
//
// Structured investigation tool for disciplinary, conduct, safeguarding, and
// capability investigations. Guides the investigating officer through:
//   1. Terms of Reference — scope, allegations, evidence to gather
//   2. Investigation Plan — witnesses, documents, timeline
//   3. Witness Interviews — structured questions, key points, notes
//   4. Evidence Log — documents, CCTV, records, statements
//   5. Findings — analysis against each allegation, on balance of probability
//   6. Report — Cara drafts the investigation report
//
// Cara supports at every stage but the investigating officer remains the
// decision-maker. All outputs are labelled as drafts requiring review.
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
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
  FileText,
  FileSearch,
  Scale,
  ScrollText,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Shield,
  Clock,
  BookOpen,
  Target,
  MessageSquare,
  Folder,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type InvestigationType =
  | "disciplinary"
  | "conduct"
  | "safeguarding_allegation"
  | "capability"
  | "grievance"
  | "whistleblowing"
  | "sickness_absence"
  | "probation";

type InvestigationStage = "terms_of_reference" | "plan" | "witnesses" | "evidence" | "findings" | "report";

interface Allegation {
  id: string;
  description: string;
  policyBreach?: string;
  finding?: "substantiated" | "not_substantiated" | "partially_substantiated" | "inconclusive";
  findingRationale?: string;
}

interface Witness {
  id: string;
  name: string;
  role: string;
  relevance: string;
  interviewed: boolean;
  keyPoints?: string;
  notes?: string;
}

interface EvidenceItem {
  id: string;
  type: "document" | "cctv" | "statement" | "record" | "email" | "photograph" | "other";
  description: string;
  source: string;
  dateObtained?: string;
  relevance: string;
  supports?: string;
}

const INVESTIGATION_TYPES: { value: InvestigationType; label: string }[] = [
  { value: "disciplinary", label: "Disciplinary investigation" },
  { value: "conduct", label: "Conduct investigation" },
  { value: "safeguarding_allegation", label: "Safeguarding allegation (LADO)" },
  { value: "capability", label: "Capability investigation" },
  { value: "grievance", label: "Grievance investigation" },
  { value: "whistleblowing", label: "Whistleblowing investigation" },
  { value: "sickness_absence", label: "Sickness absence investigation" },
  { value: "probation", label: "Probation concern investigation" },
];

const EVIDENCE_TYPES: { value: EvidenceItem["type"]; label: string }[] = [
  { value: "document", label: "Document" },
  { value: "cctv", label: "CCTV footage" },
  { value: "statement", label: "Written statement" },
  { value: "record", label: "System record" },
  { value: "email", label: "Email / correspondence" },
  { value: "photograph", label: "Photograph" },
  { value: "other", label: "Other" },
];

const STAGES: { key: InvestigationStage; label: string; icon: React.ElementType }[] = [
  { key: "terms_of_reference", label: "Terms of Reference", icon: Target },
  { key: "plan", label: "Investigation Plan", icon: ClipboardList },
  { key: "witnesses", label: "Witnesses", icon: Users },
  { key: "evidence", label: "Evidence Log", icon: Folder },
  { key: "findings", label: "Findings", icon: Scale },
  { key: "report", label: "Report", icon: ScrollText },
];

const FINDING_OPTIONS: { value: Allegation["finding"]; label: string; colour: string }[] = [
  { value: "substantiated", label: "Substantiated", colour: "bg-red-100 text-red-800" },
  { value: "partially_substantiated", label: "Partially substantiated", colour: "bg-amber-100 text-amber-800" },
  { value: "not_substantiated", label: "Not substantiated", colour: "bg-emerald-100 text-emerald-800" },
  { value: "inconclusive", label: "Inconclusive", colour: "bg-slate-100 text-[var(--cs-text-secondary)]" },
];

let nextId = 1;
function uid() { return `inv_${Date.now()}_${nextId++}`; }

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvestigationBuilderPage() {
  // ── Core state ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState<InvestigationStage>("terms_of_reference");
  const [investigationType, setInvestigationType] = useState<InvestigationType>("disciplinary");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [investigatingOfficer, setInvestigatingOfficer] = useState("");
  const [dateCommissioned, setDateCommissioned] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");

  // Terms of reference
  const [background, setBackground] = useState("");
  const [scopeNotes, setScopeNotes] = useState("");
  const [allegations, setAllegations] = useState<Allegation[]>([
    { id: uid(), description: "", policyBreach: "" },
  ]);

  // Plan
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [documentsToReview, setDocumentsToReview] = useState("");
  const [timelineNotes, setTimelineNotes] = useState("");

  // Evidence
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  // Findings
  const [overallSummary, setOverallSummary] = useState("");
  const [mitigatingFactors, setMitigatingFactors] = useState("");
  const [aggravatingFactors, setAggravatingFactors] = useState("");
  const [recommendedOutcome, setRecommendedOutcome] = useState("");

  // Report
  const [reportDraft, setReportDraft] = useState("");
  const [generating, setGenerating] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const canProceed = stageIdx < STAGES.length - 1;
  const canGoBack = stageIdx > 0;

  const completionStatus = useMemo(() => {
    const checks: Record<InvestigationStage, boolean> = {
      terms_of_reference: !!staffName && !!investigatingOfficer && allegations.some((a) => a.description.trim()),
      plan: witnesses.length > 0,
      witnesses: witnesses.some((w) => w.interviewed),
      evidence: evidenceItems.length > 0,
      findings: allegations.some((a) => a.finding),
      report: !!reportDraft,
    };
    return checks;
  }, [staffName, investigatingOfficer, allegations, witnesses, evidenceItems, reportDraft]);

  const completedStages = Object.values(completionStatus).filter(Boolean).length;

  // ── Allegation CRUD ─────────────────────────────────────────────────────

  function addAllegation() {
    setAllegations((prev) => [...prev, { id: uid(), description: "", policyBreach: "" }]);
  }
  function removeAllegation(id: string) {
    setAllegations((prev) => prev.filter((a) => a.id !== id));
  }
  function updateAllegation(id: string, patch: Partial<Allegation>) {
    setAllegations((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  // ── Witness CRUD ────────────────────────────────────────────────────────

  function addWitness() {
    setWitnesses((prev) => [...prev, { id: uid(), name: "", role: "", relevance: "", interviewed: false }]);
  }
  function removeWitness(id: string) {
    setWitnesses((prev) => prev.filter((w) => w.id !== id));
  }
  function updateWitness(id: string, patch: Partial<Witness>) {
    setWitnesses((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  // ── Evidence CRUD ───────────────────────────────────────────────────────

  function addEvidence() {
    setEvidenceItems((prev) => [...prev, { id: uid(), type: "document", description: "", source: "", relevance: "" }]);
  }
  function removeEvidence(id: string) {
    setEvidenceItems((prev) => prev.filter((e) => e.id !== id));
  }
  function updateEvidence(id: string, patch: Partial<EvidenceItem>) {
    setEvidenceItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  // ── Generate report ─────────────────────────────────────────────────────

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const res = await fetch("/api/cara/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId: "manager_demo_user",
          actorRole: "registered_manager",
          commandId: "write_investigation_report",
          inputText: JSON.stringify({
            investigationType,
            staffName,
            staffRole,
            investigatingOfficer,
            dateCommissioned,
            targetCompletionDate,
            background,
            scopeNotes,
            allegations: allegations.map((a) => ({
              description: a.description,
              policyBreach: a.policyBreach,
              finding: a.finding,
              findingRationale: a.findingRationale,
            })),
            witnesses: witnesses.map((w) => ({
              name: w.name,
              role: w.role,
              relevance: w.relevance,
              interviewed: w.interviewed,
              keyPoints: w.keyPoints,
            })),
            evidenceItems: evidenceItems.map((e) => ({
              type: e.type,
              description: e.description,
              source: e.source,
              relevance: e.relevance,
            })),
            overallSummary,
            mitigatingFactors,
            aggravatingFactors,
            recommendedOutcome,
          }),
        }),
      });
      const result = await res.json();
      if (result.data?.draft_text) {
        setReportDraft(result.data.draft_text);
      } else if (result.data?.outputText) {
        setReportDraft(result.data.outputText);
      } else {
        setReportDraft(buildDeterministicReport());
      }
    } catch {
      setReportDraft(buildDeterministicReport());
    } finally {
      setGenerating(false);
    }
  }

  function buildDeterministicReport(): string {
    const typeLabel = INVESTIGATION_TYPES.find((t) => t.value === investigationType)?.label ?? investigationType;
    const allegationLines = allegations
      .filter((a) => a.description.trim())
      .map((a, i) => {
        const findingLabel = FINDING_OPTIONS.find((f) => f.value === a.finding)?.label ?? "Not yet determined";
        return `Allegation ${i + 1}: ${a.description}\nPolicy reference: ${a.policyBreach || "Not specified"}\nFinding: ${findingLabel}\nRationale: ${a.findingRationale || "[To be completed by the investigating officer]"}`;
      })
      .join("\n\n");

    const witnessLines = witnesses
      .filter((w) => w.name.trim())
      .map((w) => `- ${w.name} (${w.role}) — ${w.interviewed ? "Interviewed" : "Not yet interviewed"}${w.keyPoints ? `. Key points: ${w.keyPoints}` : ""}`)
      .join("\n");

    const evidenceLines = evidenceItems
      .filter((e) => e.description.trim())
      .map((e) => `- [${EVIDENCE_TYPES.find((t) => t.value === e.type)?.label ?? e.type}] ${e.description} — Source: ${e.source}. Relevance: ${e.relevance}`)
      .join("\n");

    return `Cara suggested draft — requires investigating officer review before finalising.

═══════════════════════════════════════════════════════════════
INVESTIGATION REPORT
═══════════════════════════════════════════════════════════════

Type: ${typeLabel}
Staff member: ${staffName || "[Name]"}
Role: ${staffRole || "[Role]"}
Investigating officer: ${investigatingOfficer || "[Name]"}
Date commissioned: ${dateCommissioned || "[Date]"}
Target completion: ${targetCompletionDate || "[Date]"}

─── 1. Background ──────────────────────────────────────────

${background || "[The investigating officer should set out the background to the investigation, including how the concern came to light and what preceded the commissioning of the investigation.]"}

─── 2. Scope and Terms of Reference ───────────────────────

${scopeNotes || "[The investigating officer should set out the scope of the investigation — what was within scope and what was excluded.]"}

The following allegations were investigated:

${allegationLines || "[No allegations entered]"}

─── 3. Investigation Process ──────────────────────────────

The following witnesses were identified and interviewed:

${witnessLines || "[No witnesses recorded]"}

The following evidence was gathered and reviewed:

${evidenceLines || "[No evidence recorded]"}

─── 4. Findings ───────────────────────────────────────────

${overallSummary || "[The investigating officer should summarise the evidence considered, the weight given to each piece of evidence, and any credibility assessments. Findings should be made on the balance of probability.]"}

Mitigating factors:
${mitigatingFactors || "[The investigating officer should record any mitigating factors — length of service, previous disciplinary record, personal circumstances, remorse, training history, level of support provided.]"}

Aggravating factors:
${aggravatingFactors || "[The investigating officer should record any aggravating factors — breach of trust, impact on children, failure to follow training, pattern of behaviour, lack of insight.]"}

─── 5. Conclusion and Recommendation ─────────────────────

${recommendedOutcome || "[The investigating officer should state their recommendation. Note: the investigating officer makes a recommendation only — the decision-maker is the person chairing the disciplinary hearing.]"}

─── 6. Regulatory Considerations ─────────────────────────

${investigationType === "safeguarding_allegation"
  ? "This investigation relates to a safeguarding allegation. The LADO has been consulted and their guidance should be recorded separately. The outcome of this investigation should be shared with the LADO before any formal action is taken.\n\nThe investigating officer should confirm whether a DBS referral is required, whether the matter meets the threshold for referral to the Disclosure and Barring Service, and whether notification to Ofsted under Regulation 40 is needed."
  : "The investigating officer should consider whether any regulatory notifications are required:\n- Ofsted: Regulation 40 notification if the matter is a significant event\n- DBS: Referral if the staff member has been removed from regulated activity (or would have been removed) due to safeguarding concerns\n- LADO: Consultation if the matter involves allegations against staff relating to children\n- Professional bodies: Notification if the staff member holds a professional registration"}

─── 7. Appendices ─────────────────────────────────────────

The following should be appended to the final report:
- Terms of reference
- Witness interview notes (signed and dated)
- Copies of evidence reviewed
- Chronology of events
- Any correspondence with the staff member

═══════════════════════════════════════════════════════════════
This report was drafted with support from Cara. The investigating
officer is responsible for the accuracy and completeness of the
content and for ensuring that findings are based on the evidence
gathered during the investigation.
═══════════════════════════════════════════════════════════════`;
  }

  // ── Render helpers ──────────────────────────────────────────────────────

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
              {isDone && !isActive ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── STAGE 1: Terms of Reference ─────────────────────────────────────────

  function renderTermsOfReference() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--cs-text-muted)]" />Investigation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Investigation type</label>
                <Select value={investigationType} onValueChange={(v) => setInvestigationType(v as InvestigationType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVESTIGATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Staff member name</label>
                <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Staff member role</label>
                <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} placeholder="e.g. Residential Support Worker" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Investigating officer</label>
                <Input value={investigatingOfficer} onChange={(e) => setInvestigatingOfficer(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Date commissioned</label>
                <Input type="date" value={dateCommissioned} onChange={(e) => setDateCommissioned(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Target completion date</label>
                <Input type="date" value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[var(--cs-text-muted)]" />Background
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Set out the background — how the concern came to light, when it was reported, any immediate actions taken..."
              rows={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-[var(--cs-text-muted)]" />Scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={scopeNotes}
              onChange={(e) => setScopeNotes(e.target.value)}
              placeholder="What is within scope of this investigation? What is excluded? Any boundaries set by the commissioning manager..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />Allegations
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addAllegation} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {allegations.map((a, i) => (
              <div key={a.id} className="rounded-xl border border-[var(--cs-border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--cs-text-muted)]">Allegation {i + 1}</span>
                  {allegations.length > 1 && (
                    <button onClick={() => removeAllegation(a.id)} className="text-[var(--cs-text-muted)] hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Textarea
                  value={a.description}
                  onChange={(e) => updateAllegation(a.id, { description: e.target.value })}
                  placeholder="Describe the allegation — what is the staff member alleged to have done or failed to do?"
                  rows={3}
                />
                <Input
                  value={a.policyBreach ?? ""}
                  onChange={(e) => updateAllegation(a.id, { policyBreach: e.target.value })}
                  placeholder="Policy or procedure breached (if applicable)"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {investigationType === "safeguarding_allegation" && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 text-sm text-red-800">
            <Shield className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <strong>Safeguarding allegation.</strong> The LADO must be consulted before proceeding with the investigation.
              Record the LADO consultation separately. Do not interview the subject or witnesses until the LADO has
              confirmed the investigation can proceed. Consider whether a criminal investigation is running in parallel.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── STAGE 2: Investigation Plan ─────────────────────────────────────────

  function renderPlan() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--cs-text-muted)]" />Witnesses to Interview
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addWitness} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />Add Witness
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {witnesses.length === 0 && (
              <p className="text-sm text-[var(--cs-text-muted)] text-center py-4">No witnesses added yet. Add the people you need to interview.</p>
            )}
            {witnesses.map((w, i) => (
              <div key={w.id} className="rounded-xl border border-[var(--cs-border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--cs-text-muted)]">Witness {i + 1}</span>
                  <button onClick={() => removeWitness(w.id)} className="text-[var(--cs-text-muted)] hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={w.name} onChange={(e) => updateWitness(w.id, { name: e.target.value })} placeholder="Witness name" />
                  <Input value={w.role} onChange={(e) => updateWitness(w.id, { role: e.target.value })} placeholder="Role / relationship" />
                </div>
                <Input value={w.relevance} onChange={(e) => updateWitness(w.id, { relevance: e.target.value })} placeholder="Why is this witness relevant?" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--cs-text-muted)]" />Documents to Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={documentsToReview}
              onChange={(e) => setDocumentsToReview(e.target.value)}
              placeholder="List the documents, records, CCTV footage, and other evidence you plan to review..."
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--cs-text-muted)]" />Timeline and Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={timelineNotes}
              onChange={(e) => setTimelineNotes(e.target.value)}
              placeholder="Note key dates — when interviews will take place, when evidence will be gathered, interim updates to the commissioning manager..."
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <strong>Cara guidance.</strong> Consider whether you need to interview the subject of the investigation.
            Best practice is to interview the subject last, after all other evidence has been gathered, so that
            you can put specific points to them. Ensure the subject is offered the right to be accompanied.
          </div>
        </div>
      </div>
    );
  }

  // ── STAGE 3: Witness Interviews ─────────────────────────────────────────

  function renderWitnesses() {
    return (
      <div className="space-y-5">
        {witnesses.length === 0 ? (
          <div className="rounded-2xl border border-[var(--cs-border)] p-8 text-center">
            <Users className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">No witnesses added. Go back to the Investigation Plan to add witnesses.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setStage("plan")}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />Back to Plan
            </Button>
          </div>
        ) : (
          witnesses.map((w, i) => (
            <Card key={w.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[var(--cs-text-muted)]" />
                    {w.name || `Witness ${i + 1}`}
                    <Badge variant="outline" className="text-[10px]">{w.role || "Role not set"}</Badge>
                  </CardTitle>
                  <label className="flex items-center gap-2 text-xs text-[var(--cs-text-secondary)]">
                    <input
                      type="checkbox"
                      checked={w.interviewed}
                      onChange={(e) => updateWitness(w.id, { interviewed: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    Interviewed
                  </label>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Key points from interview</label>
                  <Textarea
                    value={w.keyPoints ?? ""}
                    onChange={(e) => updateWitness(w.id, { keyPoints: e.target.value })}
                    placeholder="Summarise the key points — what did the witness say about the allegation(s)? What did they observe?"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Investigator notes</label>
                  <Textarea
                    value={w.notes ?? ""}
                    onChange={(e) => updateWitness(w.id, { notes: e.target.value })}
                    placeholder="Your observations — credibility assessment, body language, consistency with other evidence..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  // ── STAGE 4: Evidence Log ───────────────────────────────────────────────

  function renderEvidence() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Evidence Log</h3>
          <Button size="sm" variant="outline" onClick={addEvidence} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Add Evidence
          </Button>
        </div>

        {evidenceItems.length === 0 ? (
          <div className="rounded-2xl border border-[var(--cs-border)] p-8 text-center">
            <Folder className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">No evidence logged yet. Add documents, statements, CCTV footage, and other evidence.</p>
          </div>
        ) : (
          evidenceItems.map((e, i) => (
            <Card key={e.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--cs-text-muted)]">Evidence item {i + 1}</span>
                  <button onClick={() => removeEvidence(e.id)} className="text-[var(--cs-text-muted)] hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select value={e.type} onValueChange={(v) => updateEvidence(e.id, { type: v as EvidenceItem["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVIDENCE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={e.source} onChange={(ev) => updateEvidence(e.id, { source: ev.target.value })} placeholder="Source (who provided it / where found)" />
                </div>
                <Input value={e.description} onChange={(ev) => updateEvidence(e.id, { description: ev.target.value })} placeholder="Description of the evidence" />
                <Input value={e.relevance} onChange={(ev) => updateEvidence(e.id, { relevance: ev.target.value })} placeholder="Relevance to the allegations" />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  // ── STAGE 5: Findings ───────────────────────────────────────────────────

  function renderFindings() {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
          <Scale className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <strong>Standard of proof.</strong> Findings should be made on the balance of probability —
            is it more likely than not that the allegation is true? This is not the criminal standard
            of beyond reasonable doubt.
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Findings per Allegation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allegations.filter((a) => a.description.trim()).map((a, i) => (
              <div key={a.id} className="rounded-xl border border-[var(--cs-border)] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--cs-text-secondary)]">Allegation {i + 1}</span>
                  {a.finding && (
                    <Badge className={cn("text-[10px]", FINDING_OPTIONS.find((f) => f.value === a.finding)?.colour)}>
                      {FINDING_OPTIONS.find((f) => f.value === a.finding)?.label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--cs-text-secondary)]">{a.description}</p>

                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Finding</label>
                  <Select value={a.finding ?? ""} onValueChange={(v) => updateAllegation(a.id, { finding: v as Allegation["finding"] })}>
                    <SelectTrigger><SelectValue placeholder="Select finding" /></SelectTrigger>
                    <SelectContent>
                      {FINDING_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value!}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Rationale</label>
                  <Textarea
                    value={a.findingRationale ?? ""}
                    onChange={(e) => updateAllegation(a.id, { findingRationale: e.target.value })}
                    placeholder="Explain the basis for this finding — what evidence supports it, what evidence contradicts it, and how you weighed conflicting evidence..."
                    rows={4}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Overall Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Summary of findings</label>
              <Textarea
                value={overallSummary}
                onChange={(e) => setOverallSummary(e.target.value)}
                placeholder="Summarise the overall findings — the weight of evidence, credibility of witnesses, and your conclusions..."
                rows={5}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Mitigating factors</label>
                <Textarea
                  value={mitigatingFactors}
                  onChange={(e) => setMitigatingFactors(e.target.value)}
                  placeholder="Length of service, disciplinary record, personal circumstances, remorse, training gaps..."
                  rows={4}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Aggravating factors</label>
                <Textarea
                  value={aggravatingFactors}
                  onChange={(e) => setAggravatingFactors(e.target.value)}
                  placeholder="Breach of trust, impact on children, pattern of behaviour, lack of insight, previous warnings..."
                  rows={4}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--cs-text-secondary)] mb-1 block">Recommended outcome</label>
              <Textarea
                value={recommendedOutcome}
                onChange={(e) => setRecommendedOutcome(e.target.value)}
                placeholder="What is your recommendation? Note: the investigating officer recommends — the decision-maker at the hearing decides."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── STAGE 6: Report ─────────────────────────────────────────────────────

  function renderReport() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Investigation Report</h3>
          <Button
            size="sm"
            onClick={handleGenerateReport}
            disabled={generating}
            className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generating ? "Generating..." : reportDraft ? "Regenerate with Cara" : "Generate Report with Cara"}
          </Button>
        </div>

        {!reportDraft && !generating && (
          <div className="rounded-2xl border border-[var(--cs-border)] p-8 text-center">
            <ScrollText className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">
              Complete the previous stages, then click &ldquo;Generate Report with Cara&rdquo; to produce a structured
              investigation report draft. You can edit the draft before finalising.
            </p>
          </div>
        )}

        {reportDraft && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] text-[10px]">Cara suggested draft</Badge>
                <span className="text-xs text-[var(--cs-text-muted)]">Requires investigating officer review before finalising</span>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={reportDraft}
                onChange={(e) => setReportDraft(e.target.value)}
                rows={30}
                className="font-mono text-xs leading-relaxed"
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Investigation Builder"
      subtitle="Structured HR investigation tool — guided by Cara"
      actions={
        <Badge className="bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">
          <Sparkles className="h-3 w-3 mr-1" />Cara Guided
        </Badge>
      }
    >
      <div className="max-w-4xl space-y-5 animate-fade-in">

        {/* Progress bar */}
        <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Investigation progress</span>
            <span className="text-xs text-[var(--cs-text-muted)]">{completedStages} of {STAGES.length} stages started</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--cs-cara-gold-bg)]0 transition-all duration-500"
              style={{ width: `${(completedStages / STAGES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Stage navigation */}
        {renderStageNav()}

        {/* Stage content */}
        {stage === "terms_of_reference" && renderTermsOfReference()}
        {stage === "plan" && renderPlan()}
        {stage === "witnesses" && renderWitnesses()}
        {stage === "evidence" && renderEvidence()}
        {stage === "findings" && renderFindings()}
        {stage === "report" && renderReport()}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoBack}
            onClick={() => setStage(STAGES[stageIdx - 1].key)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />Previous
          </Button>
          <Button
            size="sm"
            disabled={!canProceed}
            onClick={() => setStage(STAGES[stageIdx + 1].key)}
            className="gap-1.5"
          >
            Next<ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
