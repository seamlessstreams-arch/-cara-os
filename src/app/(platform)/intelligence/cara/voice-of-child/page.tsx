"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — VOICE OF THE CHILD (UI)
// Manager-facing screen for the Cara Voice of the Child Summariser.
//
// Flow:
//   1. Identify the child + period; add 1+ records (recordType, date, text)
//   2. Submit → POST /api/cara/voice-of-child  (analyse + persist)
//   3. Review themes / quotes / wants / needs / fears / unmet-rights / per-
//      record voice-capture grades
//   4. Decide: Approve / Edit & Save / Reject / Request rewrite
//      → PATCH /api/cara/voice-of-child  (audit-logged)
//   5. Mark "Shared with child" once delivered in age-appropriate form
//      (UNCRC Art 12 in practice — bespoke audit event type)
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
  Quote,
  History,
  Plus,
  Trash2,
  Heart,
  MessageCircle,
  HandHeart,
  Share2,
  Scale,
} from "lucide-react";

const RECORD_TYPES = [
  { value: "daily_log", label: "Daily log" },
  { value: "key_work", label: "Key work session" },
  { value: "one_to_one", label: "1:1 session" },
  { value: "complaint", label: "Complaint" },
  { value: "missing_return_interview", label: "Return Home Interview" },
  { value: "family_time", label: "Family time" },
  { value: "incident_report", label: "Incident report" },
  { value: "lac_review", label: "LAC review" },
  { value: "advocate_meeting", label: "Advocate meeting" },
  { value: "child_correspondence", label: "Child correspondence" },
  { value: "other", label: "Other" },
] as const;

const THEME_LABEL: Record<string, string> = {
  safety: "Safety",
  belonging: "Belonging",
  identity: "Identity",
  family_relationships: "Family relationships",
  friendships: "Friendships",
  education: "Education",
  health_wellbeing: "Health & wellbeing",
  loss_grief: "Loss & grief",
  rights_advocacy: "Rights & advocacy",
  future_aspirations: "Future aspirations",
  fears_concerns: "Fears & concerns",
  things_they_love: "Things they love",
  things_they_resist: "Things they resist",
  feedback_about_staff_or_home: "Feedback about staff / home",
};

interface SourceRecordInput {
  recordId: string;
  recordType: string;
  recordDate: string;
  recordText: string;
  authorRole?: string;
}

interface VoiceQuote {
  recordId: string;
  recordDate: string;
  recordType: string;
  kind: "direct" | "paraphrased";
  text: string;
  themeTags: string[];
}

type VoiceCaptureQuality = "strong" | "adequate" | "weak" | "absent";

interface PerRecordContribution {
  recordId: string;
  recordType: string;
  recordDate: string;
  quoteCount: number;
  paraphrasedCount: number;
  voiceCaptureQuality: VoiceCaptureQuality;
  notes: string[];
}

interface SuggestedAction {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDays: number;
  assignedRole: string;
}

interface VoiceSummary {
  childId: string;
  childPseudonym?: string;
  generatedAt: string;
  status: string;
  caraLabel: string;
  recordsConsidered: number;
  periodStart?: string;
  periodEnd?: string;
  narrativeDraft: string;
  ofstedSummary: string;
  themesPresent: string[];
  themesAbsent: string[];
  directQuotes: VoiceQuote[];
  paraphrasedExpressions: VoiceQuote[];
  whatChildAppearsToWant: string[];
  whatChildAppearsToNeed: string[];
  whatChildAppearsToFear: string[];
  rightsOrWishesUnmet: string[];
  perRecordContributions: PerRecordContribution[];
  overallVoiceCaptureQuality: VoiceCaptureQuality;
  suggestedActionsToStrengthenVoice: SuggestedAction[];
  regulatoryLinks: string[];
  caraConfidence: number;
  llmUsed: boolean;
  engineVersion: string;
}

interface AuditEntry {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  actor_role: string | null;
  event_detail: Record<string, unknown>;
  created_at: string;
}

interface AnalysisResult {
  summaryId?: string;
  summary: VoiceSummary;
  persisted: boolean;
}

const QUALITY_COLOUR: Record<VoiceCaptureQuality, string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  adequate: "bg-blue-100 text-blue-800 border-blue-200",
  weak: "bg-amber-100 text-amber-800 border-amber-200",
  absent: "bg-rose-100 text-rose-800 border-rose-200",
};

const PRIORITY_COLOUR: Record<SuggestedAction["priority"], string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

function emptyRecord(): SourceRecordInput {
  return {
    recordId: `rec_${Math.random().toString(36).slice(2, 8)}`,
    recordType: "daily_log",
    recordDate: new Date().toISOString().slice(0, 10),
    recordText: "",
  };
}

export default function VoiceOfChildPage() {
  // ─── Input state ───────────────────────────────────────────────────────────
  const [childId, setChildId] = useState("");
  const [childPseudonym, setChildPseudonym] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [actorUserId, setActorUserId] = useState("manager_demo_user");
  const [records, setRecords] = useState<SourceRecordInput[]>([emptyRecord()]);

  // ─── Engine state ──────────────────────────────────────────────────────────
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Manager decision state ────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState("");
  const [editedOfsted, setEditedOfsted] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rewriteInstructions, setRewriteInstructions] = useState("");
  const [decisionPending, setDecisionPending] = useState<null | string>(null);
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);

  const validRecords = useMemo(
    () =>
      records.filter(
        (r) => r.recordId.trim() && r.recordDate.trim() && r.recordText.trim().length > 10,
      ),
    [records],
  );

  const canSubmit = useMemo(
    () => childId.trim().length > 0 && validRecords.length > 0,
    [childId, validRecords],
  );

  function updateRecord(index: number, patch: Partial<SourceRecordInput>) {
    setRecords((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function addRecord() {
    setRecords((rs) => [...rs, emptyRecord()]);
  }
  function removeRecord(index: number) {
    setRecords((rs) => rs.filter((_, i) => i !== index));
  }

  async function handleAnalyse() {
    setAnalysing(true);
    setError(null);
    setResult(null);
    setDecisionMessage(null);
    setAuditTrail([]);
    try {
      const res = await fetch("/api/cara/voice-of-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: childId.trim(),
          childPseudonym: childPseudonym.trim() || undefined,
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          records: validRecords,
          actorUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Engine error");
      } else {
        setResult(data.data);
        setEditedNarrative(data.data.summary.narrativeDraft);
        setEditedOfsted(data.data.summary.ofstedSummary);
        if (data.data.persisted && data.data.summaryId) {
          await loadAudit(data.data.summaryId);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalysing(false);
    }
  }

  async function loadAudit(summaryId: string) {
    try {
      const res = await fetch(`/api/cara/voice-of-child?id=${summaryId}`);
      if (!res.ok) return;
      const data = await res.json();
      const entries: AuditEntry[] | undefined = data.data?.voice_summary_audit_log;
      if (Array.isArray(entries)) setAuditTrail(entries);
    } catch {
      // non-fatal
    }
  }

  async function decide(decision: "approve" | "edit" | "reject" | "request_rewrite") {
    if (!result?.summaryId) {
      setDecisionMessage(
        "Persistence is not active in this environment — decisions cannot be audit-logged. Configure Supabase to enable.",
      );
      return;
    }
    setDecisionPending(decision);
    setDecisionMessage(null);
    try {
      const body: Record<string, unknown> = {
        summaryId: result.summaryId,
        decision,
        actorUserId,
        actorRole: "registered_manager",
      };
      if ((decision === "approve" || decision === "edit") && editing) {
        body.editedNarrative = editedNarrative;
        body.editedOfstedSummary = editedOfsted;
      }
      if (decision === "reject") body.rejectionReason = rejectionReason.trim();
      if (decision === "request_rewrite")
        body.rewriteInstructions = rewriteInstructions.trim();
      const res = await fetch("/api/cara/voice-of-child", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionMessage(data.error ?? "Decision failed");
      } else {
        setDecisionMessage(`Recorded: ${decision.replace(/_/g, " ")}.`);
        if (result.summaryId) await loadAudit(result.summaryId);
      }
    } catch (e) {
      setDecisionMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setDecisionPending(null);
    }
  }

  async function markSharedWithChild() {
    // Special event — uses the same PATCH route conceptually but is just an
    // audit event, not a state change. We post directly to GET-then-write
    // pattern via a synthetic edit (no body changes). For now we surface a
    // hint — the canonical path is for the manager to log it via the audit
    // system once we wire a dedicated /share endpoint.
    setDecisionMessage(
      "To formally log 'Shared with child', record the date on the child's file and add an event to the audit log (event_type: 'shared_with_child'). Action item is included in the suggested actions list.",
    );
  }

  const summary = result?.summary;

  return (
    <PageShell title="Cara — Voice of the Child">
      {/* Cara draft banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4 text-sm text-[var(--cs-navy)]">
        <Sparkles className="h-5 w-5 mt-0.5 text-[var(--cs-cara-gold)]" />
        <div>
          <div className="font-semibold">Cara suggested draft — never final</div>
          <p className="text-[var(--cs-navy)]">
            Aggregates the child&apos;s voice across multiple records. The output
            stays in draft until a Registered Manager (or delegate) approves,
            edits, rejects, or requests a rewrite. Once approved, share it back
            with the child in age-appropriate form — UNCRC Article 12 in practice.
          </p>
        </div>
      </div>

      {/* Input — child + period */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" /> Child &amp; period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Child ID *</label>
              <Input value={childId} onChange={(e) => setChildId(e.target.value)} placeholder="e.g. yp_casey" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Child reference (pseudonym)</label>
              <Input value={childPseudonym} onChange={(e) => setChildPseudonym(e.target.value)} placeholder="e.g. Casey" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Period start</label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Period end</label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">
                Actor user ID (your sign-in for audit log)
              </label>
              <Input value={actorUserId} onChange={(e) => setActorUserId(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records repeater */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" /> Records to consider
            </span>
            <Button variant="outline" size="sm" onClick={addRecord} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add record
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.map((r, i) => (
            <div key={i} className="rounded-md border border-[var(--cs-border)] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase">Record {i + 1}</span>
                {records.length > 1 ? (
                  <Button variant="ghost" size="sm" onClick={() => removeRecord(i)} className="gap-1 text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={r.recordId}
                  onChange={(e) => updateRecord(i, { recordId: e.target.value })}
                  placeholder="Record ID"
                />
                <Select value={r.recordType} onValueChange={(v) => updateRecord(i, { recordType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORD_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={r.recordDate}
                  onChange={(e) => updateRecord(i, { recordDate: e.target.value })}
                />
              </div>
              <Textarea
                value={r.recordText}
                onChange={(e) => updateRecord(i, { recordText: e.target.value })}
                placeholder="Paste the record narrative — Cara will extract direct quotes, paraphrased expressions, themes, wants/needs/fears, and unmet-rights signals."
                className="min-h-[100px] text-sm"
              />
            </div>
          ))}
          <div className="flex items-center justify-end gap-2 pt-2">
            <span className="text-xs text-[var(--cs-text-muted)] mr-auto">
              {validRecords.length} of {records.length} records ready
            </span>
            <Button onClick={handleAnalyse} disabled={!canSubmit || analysing} className="gap-2">
              {analysing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analysing ? "Analysing..." : "Generate Cara voice summary"}
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

      {summary ? (
        <>
          {/* Headline tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Voice capture</div>
                <Badge className={cn("border", QUALITY_COLOUR[summary.overallVoiceCaptureQuality])}>
                  {summary.overallVoiceCaptureQuality}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Records considered</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">{summary.recordsConsidered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Direct quotes / paraphrased</div>
                <div className="text-2xl font-semibold text-[var(--cs-navy)]">
                  {summary.directQuotes.length} / {summary.paraphrasedExpressions.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-[var(--cs-text-muted)] mb-1">Cara confidence</div>
                <div className="text-3xl font-semibold text-[var(--cs-navy)]">
                  {Math.round(summary.caraConfidence * 100)}%
                </div>
                <div className="text-xs text-[var(--cs-text-muted)] mt-1">
                  {summary.llmUsed ? "LLM-enhanced narrative" : "Deterministic only"}
                </div>
              </CardContent>
            </Card>
          </div>

          {summary.rightsOrWishesUnmet.length > 0 ? (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600" />
              <div>
                <div className="font-semibold">Unmet-rights signals detected</div>
                <p>
                  The child has expressed feeling unheard. Triangulate with the advocate / IRO and consider
                  raising at the next LAC review.
                </p>
              </div>
            </div>
          ) : null}

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="h-4 w-4 text-blue-500" /> Themes present
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.themesPresent.length === 0 ? (
                    <p className="text-sm text-[var(--cs-text-muted)]">No themes detected.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {summary.themesPresent.map((t) => (
                        <Badge key={t} className="border bg-blue-50 text-blue-800 border-blue-200">
                          {THEME_LABEL[t] ?? t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <XCircle className="h-4 w-4 text-[var(--cs-text-muted)]" /> Themes absent (worth checking)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.themesAbsent.length === 0 ? (
                    <p className="text-sm text-[var(--cs-text-muted)]">All themes evidenced.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {summary.themesAbsent.map((t) => (
                        <Badge key={t} className="border bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]">
                          {THEME_LABEL[t] ?? t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Quote className="h-4 w-4 text-rose-500" /> Direct quotes ({summary.directQuotes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.directQuotes.length === 0 ? (
                    <p className="text-sm text-amber-700">
                      No direct quotes captured. Records relied on staff paraphrase only.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {summary.directQuotes.map((q, i) => (
                        <li key={i} className="border-l-2 border-rose-200 pl-3">
                          <div className="italic text-[var(--cs-navy)]">&ldquo;{q.text}&rdquo;</div>
                          <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                            {q.recordType} · {q.recordDate} · {q.recordId}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paraphrased expressions ({summary.paraphrasedExpressions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.paraphrasedExpressions.length === 0 ? (
                    <p className="text-sm text-[var(--cs-text-muted)]">None detected.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {summary.paraphrasedExpressions.slice(0, 8).map((q, i) => (
                        <li key={i} className="border-l-2 border-blue-200 pl-3">
                          <div className="text-[var(--cs-navy)]">{q.text}</div>
                          <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                            {q.recordType} · {q.recordDate} · {q.recordId}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Per-record voice capture</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm">
                    {summary.perRecordContributions.map((c) => (
                      <li key={c.recordId} className="flex items-center justify-between gap-2">
                        <span className="text-[var(--cs-text-secondary)]">
                          {c.recordType} · {c.recordDate}
                          <span className="text-xs text-[var(--cs-text-muted)]"> · {c.recordId}</span>
                        </span>
                        <Badge className={cn("border text-xs", QUALITY_COLOUR[c.voiceCaptureQuality])}>
                          {c.voiceCaptureQuality}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" /> Cara narrative draft
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> {editing ? "Stop editing" : "Edit"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea
                      value={editedNarrative}
                      onChange={(e) => setEditedNarrative(e.target.value)}
                      className="min-h-[260px] text-sm"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-[var(--cs-navy)] font-sans">{editedNarrative}</pre>
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
                      value={editedOfsted}
                      onChange={(e) => setEditedOfsted(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  ) : (
                    <p className="text-sm text-[var(--cs-text-secondary)]">{editedOfsted}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HandHeart className="h-4 w-4 text-emerald-500" /> What the child appears to want / need / fear
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ChipList label="Wants" items={summary.whatChildAppearsToWant} colour="emerald" />
                  <ChipList label="Needs" items={summary.whatChildAppearsToNeed} colour="blue" />
                  <ChipList label="Fears" items={summary.whatChildAppearsToFear} colour="amber" />
                  {summary.rightsOrWishesUnmet.length > 0 ? (
                    <div>
                      <div className="text-xs font-semibold text-rose-700 uppercase mb-1">
                        Unmet-rights signals
                      </div>
                      <ul className="text-sm text-rose-900 space-y-1">
                        {summary.rightsOrWishesUnmet.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span>!</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {summary.suggestedActionsToStrengthenVoice.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Suggested actions to strengthen voice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {summary.suggestedActionsToStrengthenVoice.map((a, i) => (
                        <li key={i} className="border-l-2 border-blue-200 pl-3">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm">{a.title}</span>
                            <Badge className={cn("border text-xs", PRIORITY_COLOUR[a.priority])}>
                              {a.priority}
                            </Badge>
                            <span className="text-xs text-[var(--cs-text-muted)]">
                              due {a.dueDays}d · {a.assignedRole}
                            </span>
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
                    {summary.regulatoryLinks.map((s, i) => (
                      <li key={i}>· {s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Decision panel */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Manager decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-[var(--cs-text-muted)]">
                Acting as <span className="font-medium text-[var(--cs-text-secondary)]">{actorUserId}</span> ·
                {result?.summaryId
                  ? ` summary ${result.summaryId}`
                  : " persistence not active — decisions cannot be audit-logged in this environment"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">
                    Rejection reason (required for Reject)
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="e.g. Themes are inferred without sufficient evidence — re-run with the LAC review notes included."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">
                    Rewrite instructions (required for Request rewrite)
                  </label>
                  <Textarea
                    value={rewriteInstructions}
                    onChange={(e) => setRewriteInstructions(e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="e.g. Foreground the unmet-rights signals; reduce restating staff observations."
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => decide("approve")}
                  disabled={decisionPending !== null}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  {decisionPending === "approve" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve{editing ? " with edits" : ""}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("edit")}
                  disabled={decisionPending !== null || !editing}
                  className="gap-1.5"
                  title={!editing ? "Toggle Edit on the narrative first" : undefined}
                >
                  {decisionPending === "edit" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                  Save edit (still draft)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("request_rewrite")}
                  disabled={decisionPending !== null || rewriteInstructions.trim().length === 0}
                  className="gap-1.5"
                >
                  {decisionPending === "request_rewrite" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                  Request rewrite
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide("reject")}
                  disabled={decisionPending !== null || rejectionReason.trim().length === 0}
                  className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                >
                  {decisionPending === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={markSharedWithChild}
                  className="gap-1.5 ml-auto border-[var(--cs-cara-gold-soft)] text-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)]"
                >
                  <Share2 className="h-4 w-4" />
                  Mark shared with child
                </Button>
              </div>
              {decisionMessage ? (
                <div className="text-sm text-[var(--cs-text-secondary)] bg-slate-50 border border-[var(--cs-border)] rounded-md px-3 py-2">
                  {decisionMessage}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Audit timeline */}
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

// ─── Local helpers ───────────────────────────────────────────────────────────

function ChipList({
  label,
  items,
  colour,
}: {
  label: string;
  items: string[];
  colour: "emerald" | "blue" | "amber";
}) {
  if (items.length === 0) return null;
  const colourClass: Record<typeof colour, string> = {
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return (
    <div>
      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, i) => (
          <span key={i} className={cn("text-xs px-2 py-0.5 rounded-full border", colourClass[colour])}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
