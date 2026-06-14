"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RI CHALLENGE LOG
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useRiChallengeLogs, useCreateRiChallengeLog, useUpdateRiChallengeLog,
  useCreateTrainingNeed,
} from "@/hooks/use-ri-learning";
import type { RiChallengeLog, RiChallengeArea, RiEscalationLevel } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

const CHALLENGE_EXPORT_COLS: ExportColumn<RiChallengeLog>[] = [
  { header: "Title", accessor: (c) => c.title },
  { header: "Challenge Area", accessor: (c) => c.challenge_area },
  { header: "Escalation Level", accessor: (c) => c.escalation_level },
  { header: "Status", accessor: (c) => c.status },
  { header: "Evidence Summary", accessor: (c) => c.evidence_summary },
  { header: "Challenge", accessor: (c) => c.challenge_text },
  { header: "Manager Response", accessor: (c) => c.manager_response ?? "" },
  { header: "Action Required", accessor: (c) => c.action_required ?? "" },
  { header: "Action Due", accessor: (c) => c.action_due_date ?? "" },
  { header: "Cara Generated", accessor: (c) => c.aria_generated ? "Yes" : "No" },
  { header: "Created", accessor: (c) => c.created_at },
];
import {
  Plus, Gavel, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Sparkles,
  MessageSquare, Flag, Brain, Search, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/use-api";


const AREA_LABELS: Record<RiChallengeArea, string> = {
  safeguarding: "Safeguarding",
  oversight: "Oversight",
  compliance: "Compliance",
  practice: "Practice Quality",
  staffing: "Staffing",
  outcomes: "Outcomes",
  finance: "Finance",
};

const LEVEL_COLOURS: Record<RiEscalationLevel, string> = {
  standard: "bg-blue-100 text-blue-700",
  elevated: "bg-amber-100 text-amber-700",
  critical: "bg-orange-100 text-orange-700",
  formal: "bg-red-100 text-red-700",
};

const STATUS_COLOURS: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  responded: "bg-blue-100 text-blue-700",
  action_pending: "bg-orange-100 text-orange-700",
  resolved: "bg-emerald-100 text-emerald-700",
  escalated: "bg-red-100 text-red-700",
};

// ── Challenge card ─────────────────────────────────────────────────────────────
function ChallengeCard({ log, onRespond }: { log: RiChallengeLog; onRespond: (log: RiChallengeLog) => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [expanded, setExpanded] = useState(false);
  const [needCreated, setNeedCreated] = useState(false);
  const updateMutation = useUpdateRiChallengeLog();
  const createNeed = useCreateTrainingNeed();

  const markResolved = () => {
    updateMutation.mutate({ id: log.id, status: "resolved", action_completed_at: new Date().toISOString() });
  };

  // Map challenge area → training need type
  const AREA_TO_NEED_TYPE: Record<string, string> = {
    safeguarding: "safeguarding",
    oversight: "risk_assessment",
    compliance: "recording_quality",
    practice: "trauma_informed",
    staffing: "leadership",
    outcomes: "care_planning",
    finance: "leadership",
  };

  const createTrainingNeed = () => {
    const priority = log.escalation_level === "formal" || log.escalation_level === "critical" ? "urgent"
      : log.escalation_level === "elevated" ? "high" : "medium";
    createNeed.mutate(
      {
        home_id: homeId,
        identified_by: "ri_challenge",
        need_type: AREA_TO_NEED_TYPE[log.challenge_area] ?? "safeguarding",
        title: `Training need from RI challenge: ${log.title}`,
        description: `Identified from RI challenge log. ${log.evidence_summary ?? ""} ${log.action_required ? `Action required: ${log.action_required}` : ""}`.trim(),
        priority,
        status: "identified",
        aria_evidence: `Escalated from RI Challenge Log entry dated ${formatDate(log.created_at)}. Level: ${log.escalation_level}. Area: ${log.challenge_area}.`,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => setNeedCreated(true) }
    );
  };

  return (
    <Card className={cn("border", log.escalation_level === "critical" || log.escalation_level === "formal" ? "border-red-200" : "border-[var(--cs-border-subtle)]")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", log.escalation_level === "critical" ? "bg-red-100" : log.escalation_level === "formal" ? "bg-red-100" : "bg-amber-100")}>
            <Gavel className={cn("h-4 w-4", log.escalation_level === "critical" || log.escalation_level === "formal" ? "text-red-600" : "text-amber-600")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">{log.title}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={cn("text-[10px] h-4 px-1.5", STATUS_COLOURS[log.status] ?? "")}>
                  {log.status.replace("_", " ")}
                </Badge>
                <Badge className={cn("text-[10px] h-4 px-1.5", LEVEL_COLOURS[log.escalation_level])}>
                  {log.escalation_level}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{AREA_LABELS[log.challenge_area]}</Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(log.created_at)}</span>
              {log.action_due_date && (
                <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  Due {formatDate(log.action_due_date)}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setExpanded((p) => !p)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-[var(--cs-border-subtle)]">
            <div>
              <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Evidence Summary</p>
              <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{log.evidence_summary}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Challenge to Manager</p>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{log.challenge_text}</p>
              </div>
            </div>
            {log.manager_response && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Manager Response</p>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{log.manager_response}</p>
                </div>
                {log.manager_responded_at && (
                  <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">Responded {formatDate(log.manager_responded_at)}</p>
                )}
              </div>
            )}
            {log.action_required && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Action Required</p>
                <p className="text-sm text-[var(--cs-text-secondary)]">{log.action_required}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap pt-1 items-center">
              {log.status === "open" && (
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onRespond(log)}>
                  <MessageSquare className="h-3 w-3" />
                  Record Response
                </Button>
              )}
              {["responded", "action_pending"].includes(log.status) && (
                <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-700 border-emerald-200 gap-1" onClick={markResolved}>
                  <CheckCircle2 className="h-3 w-3" />
                  Mark Resolved
                </Button>
              )}
              {/* Cross-system: push to Learning Studio */}
              {!needCreated ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 gap-1 text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-bg)]"
                  onClick={createTrainingNeed}
                  disabled={createNeed.isPending}
                >
                  <Brain className="h-3 w-3" />
                  {createNeed.isPending ? "Creating…" : "Create Training Need"}
                </Button>
              ) : (
                <Link href="/learning/training-needs">
                  <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-[var(--cs-cara-gold)]">
                    <CheckCircle2 className="h-3 w-3" />
                    Training need created →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── New challenge form ─────────────────────────────────────────────────────────
function NewChallengeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<RiChallengeArea>("oversight");
  const [escalation, setEscalation] = useState<RiEscalationLevel>("standard");
  const [evidence, setEvidence] = useState("");
  const [challenge, setChallenge] = useState("");
  const [actionRequired, setActionRequired] = useState("");
  const [caraDrafting, setCaraDrafting] = useState(false);
  const createMutation = useCreateRiChallengeLog();

  const draftWithCara = async () => {
    if (!evidence.trim()) return;
    setCaraDrafting(true);
    try {
      const res = await api.post<{ data: { text?: string; parsed?: { challenge_text?: string; action_required?: string } } }>(
        "/cara",
        {
          mode: "ri_challenge_question",
          style: "professional_formal",
          source_content: evidence,
          page_context: "RI Challenge Log",
          record_type: area,
          user_role: "responsible_individual",
        }
      );
      const parsed = res.data?.parsed;
      if (parsed?.challenge_text) setChallenge(parsed.challenge_text);
      if (parsed?.action_required) setActionRequired(parsed.action_required);
    } catch {
      // ignore — user can type manually
    } finally {
      setCaraDrafting(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !challenge.trim()) return;
    createMutation.mutate(
      {
        home_id: homeId,
        title,
        challenge_area: area,
        evidence_summary: evidence,
        challenge_text: challenge,
        escalation_level: escalation,
        action_required: actionRequired || undefined,
        status: "open",
        aria_generated: false,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => { onClose(); setTitle(""); setEvidence(""); setChallenge(""); setActionRequired(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-amber-600" />
            New RI Challenge
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Challenge Title</label>
            <Input className="mt-1" placeholder="e.g. Inadequate oversight of medication refusals" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Area</label>
              <Select value={area} onValueChange={(v) => setArea(v as RiChallengeArea)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AREA_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Escalation</label>
              <Select value={escalation} onValueChange={(v) => setEscalation(v as RiEscalationLevel)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Evidence Summary</label>
            <Textarea className="mt-1 text-sm" rows={3} placeholder="Summarise the evidence or data that underpins this challenge…" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Challenge to Manager</label>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-[var(--cs-cara-gold)] gap-1 px-2" onClick={draftWithCara} disabled={caraDrafting || !evidence.trim()}>
                <Sparkles className="h-3 w-3" />
                {caraDrafting ? "Drafting…" : "Cara Draft"}
              </Button>
            </div>
            <Textarea className="mt-0 text-sm" rows={5} placeholder="Write the formal challenge question or statement for the manager…" value={challenge} onChange={(e) => setChallenge(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Action Required</label>
            <Input className="mt-1" placeholder="e.g. Provide written action plan within 7 days" value={actionRequired} onChange={(e) => setActionRequired(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !challenge.trim() || createMutation.isPending} className="gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            {createMutation.isPending ? "Creating…" : "Create Challenge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Response dialog ───────────────────────────────────────────────────────────
function ResponseDialog({ log, onClose }: { log: RiChallengeLog; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [response, setResponse] = useState("");
  const [action, setAction] = useState("");
  const updateMutation = useUpdateRiChallengeLog();

  const handleSubmit = () => {
    if (!response.trim()) return;
    updateMutation.mutate(
      {
        id: log.id,
        manager_response: response,
        manager_responded_at: new Date().toISOString(),
        manager_responded_by: currentUser?.id ?? "staff_darren",
        action_required: action || log.action_required,
        status: action ? "action_pending" : "responded",
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Manager Response</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">Challenge</p>
            <p className="text-sm text-amber-900 line-clamp-3">{log.challenge_text}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Manager Response</label>
            <Textarea className="mt-1 text-sm" rows={4} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Record what the manager said or provided in response…" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Action Agreed</label>
            <Input className="mt-1" value={action} onChange={(e) => setAction(e.target.value)} placeholder="What action did the manager commit to?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!response.trim() || updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ChallengeLogPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [showNew, setShowNew] = useState(false);
  const [responding, setResponding] = useState<RiChallengeLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "escalation" | "area" | "status">("date");

  const { data, isLoading } = useRiChallengeLogs({ homeId: homeId });
  const logs = data?.data ?? [];

  const filtered = useMemo(() => {
    let list = logs;
    if (statusFilter === "open") list = list.filter((l) => !["resolved"].includes(l.status));
    if (statusFilter === "resolved") list = list.filter((l) => l.status === "resolved");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => {
        const hay = [
          l.title,
          l.challenge_text,
          l.evidence_summary || "",
          l.action_required || "",
          l.manager_response || "",
          AREA_LABELS[l.challenge_area] || l.challenge_area,
          l.escalation_level,
          l.status,
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "escalation": {
          const esc: Record<string, number> = { critical: 0, formal: 1, elevated: 2, standard: 3 };
          return (esc[a.escalation_level] ?? 9) - (esc[b.escalation_level] ?? 9);
        }
        case "area":
          return (AREA_LABELS[a.challenge_area] ?? "").localeCompare(AREA_LABELS[b.challenge_area] ?? "");
        case "status": {
          const st: Record<string, number> = { open: 0, action_pending: 1, responded: 2, resolved: 3 };
          return (st[a.status] ?? 9) - (st[b.status] ?? 9);
        }
        case "date":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [logs, statusFilter, search, sortBy]);

  const openCount = logs.filter((l) => l.status === "open" || l.status === "action_pending").length;

  return (
    <PageShell
      title="Challenge Log"
      subtitle="RI governance challenges to the management team"
      caraContext={{ pageTitle: "Challenge Log", sourceType: "general" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={CHALLENGE_EXPORT_COLS} filename="challenge-log" />
          <PrintButton
            title="Challenge Log"
            subtitle="Chamberlain House — RI Challenge & Oversight Log"
            targetId="challenge-log-content"
          />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="RI Challenge Log — supporting evidence upload" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Challenge
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="challenge-log-content" className="space-y-4 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Open / Pending", value: openCount, colour: openCount > 0 ? "text-amber-700" : "text-emerald-700" },
            { label: "Total Challenges", value: logs.length, colour: "text-[var(--cs-text-secondary)]" },
            { label: "Resolved", value: logs.filter((l) => l.status === "resolved").length, colour: "text-emerald-700" },
          ].map(({ label, value, colour }) => (
            <div key={label} className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4 text-center">
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              placeholder="Search challenges, evidence, responses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
              <option value="date">Newest first</option>
              <option value="escalation">Escalation level</option>
              <option value="area">Area A–Z</option>
              <option value="status">Status (open → resolved)</option>
            </select>
          </div>
          <div className="flex gap-2">
            {(["all", "open", "resolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", statusFilter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200")}
              >
                {f === "all" ? "All" : f === "open" ? "Open / Active" : "Resolved"}
              </button>
            ))}
          </div>
          {(search || statusFilter !== "all") && (
            <span className="text-xs text-[var(--cs-text-muted)]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center text-sm text-[var(--cs-text-muted)] py-12">Loading challenges…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <Gavel className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">{statusFilter === "all" ? "No challenges recorded yet" : `No ${statusFilter} challenges`}</p>
            <p className="text-xs mt-1">RI challenges provide a formal evidence trail of governance oversight</p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create First Challenge
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((log) => (
              <ChallengeCard key={log.id} log={log} onRespond={setResponding} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewChallengeDialog open onClose={() => setShowNew(false)} />}
      {responding && <ResponseDialog log={responding} onClose={() => setResponding(null)} />}
      <CaraPanel
        mode="assist"
        pageContext="RI Challenge Log — responsible individual challenge records, management responses, governance oversight, escalation evidence, scrutiny of practice, Reg 45 governance evidence, Ofsted readiness"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
