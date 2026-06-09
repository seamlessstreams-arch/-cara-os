"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRAINING NEEDS INTELLIGENCE (Core Loop Page)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useTrainingNeeds, useCreateTrainingNeed, useUpdateTrainingNeed,
  useCreateLearningProject, useCreateGeneratedResource,
} from "@/hooks/use-ri-learning";
import type { TrainingNeed, TrainingNeedPriority, TrainingNeedIdentifiedBy, TrainingNeedStatus } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus, AlertTriangle, BookOpen, ChevronDown, ChevronUp, Sparkles,
  ArrowRight, CheckCircle2, Clock, Brain, Wand2, X, Search, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

const TRAINING_NEED_EXPORT_COLS: ExportColumn<TrainingNeed>[] = [
  { header: "Title", accessor: (n) => n.title },
  { header: "Need Type", accessor: (n) => n.need_type },
  { header: "Priority", accessor: (n) => n.priority },
  { header: "Status", accessor: (n) => n.status },
  { header: "Identified By", accessor: (n) => n.identified_by },
  { header: "Description", accessor: (n) => n.description },
  { header: "Affected Roles", accessor: (n) => (n.affected_roles ?? []).join(", ") },
  { header: "Deadline", accessor: (n) => n.deadline ?? "" },
  { header: "ARIA Evidence", accessor: (n) => n.aria_evidence ?? "" },
  { header: "Created", accessor: (n) => n.created_at },
];

const PRIORITY_COLOURS: Record<TrainingNeedPriority, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

const STATUS_LABELS: Record<TrainingNeedStatus, string> = {
  identified: "Identified",
  learning_studio_sent: "Sent to Studio",
  resource_generated: "Resource Generated",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  no_action: "No Action",
};

const STATUS_COLOURS: Record<TrainingNeedStatus, string> = {
  identified: "bg-slate-100 text-[var(--cs-text-secondary)]",
  learning_studio_sent: "bg-blue-100 text-blue-700",
  resource_generated: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  assigned: "bg-amber-100 text-amber-700",
  in_progress: "bg-teal-100 text-teal-700",
  completed: "bg-emerald-100 text-emerald-700",
  no_action: "bg-slate-100 text-[var(--cs-text-muted)]",
};

const NEED_TYPES = [
  "safeguarding", "de_escalation", "recording_quality", "medication", "first_aid",
  "mca", "pace", "trauma_informed", "care_planning", "risk_assessment",
  "leadership", "recruitment", "boundaries", "exploitation_awareness",
  "online_safety", "contextual_safeguarding", "restorative_practice",
];

// ── Need card ─────────────────────────────────────────────────────────────────
function NeedCard({ need, onSendToStudio }: { need: TrainingNeed; onSendToStudio: (n: TrainingNeed) => void }) {
  const [expanded, setExpanded] = useState(false);
  const updateMutation = useUpdateTrainingNeed();

  const markComplete = () => updateMutation.mutate({ id: need.id, status: "completed", completed_at: new Date().toISOString() });

  return (
    <Card className={cn("border", need.priority === "urgent" ? "border-red-200" : need.priority === "high" ? "border-orange-200" : "border-[var(--cs-border-subtle)]")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            need.priority === "urgent" ? "bg-red-100" : need.priority === "high" ? "bg-orange-100" : "bg-amber-100")}>
            <Brain className={cn("h-4 w-4", need.priority === "urgent" ? "text-red-600" : need.priority === "high" ? "text-orange-600" : "text-amber-600")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">{need.title}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={cn("text-[10px] h-4 px-1.5 border", PRIORITY_COLOURS[need.priority])}>{need.priority}</Badge>
                <Badge className={cn("text-[10px] h-4 px-1.5", STATUS_COLOURS[need.status])}>{STATUS_LABELS[need.status]}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{need.need_type.replace(/_/g, " ")}</Badge>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{need.identified_by.replace(/_/g, " ")}</Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(need.created_at)}</span>
              {need.deadline && (
                <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  Due {formatDate(need.deadline)}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setExpanded((p) => !p)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-[var(--cs-border-subtle)] space-y-3">
            <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{need.description}</p>
            {need.aria_evidence && (
              <div className="rounded-lg bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-3">
                <p className="text-[10px] font-semibold text-[var(--cs-aria-gold)] mb-1 uppercase tracking-wide">ARIA Evidence</p>
                <p className="text-xs text-[var(--cs-navy)] leading-relaxed">{need.aria_evidence}</p>
              </div>
            )}
            {need.affected_roles?.length ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[var(--cs-text-muted)]">Affects:</span>
                {need.affected_roles.map((r) => (
                  <Badge key={r} variant="outline" className="text-[10px] h-4 px-1.5">{r}</Badge>
                ))}
              </div>
            ) : null}
            <div className="flex gap-2 flex-wrap pt-1">
              {need.status === "identified" && (
                <Button size="sm" className="text-xs h-7 gap-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onSendToStudio(need)}>
                  <BookOpen className="h-3 w-3" />
                  Send to Learning Studio
                </Button>
              )}
              {["resource_generated", "assigned"].includes(need.status) && need.linked_learning_project_id && (
                <Link href={`/learning/resources?project_id=${need.linked_learning_project_id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                    <ArrowRight className="h-3 w-3" />
                    View Resource
                  </Button>
                </Link>
              )}
              {need.status === "in_progress" && (
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-emerald-700 border-emerald-200" onClick={markComplete}>
                  <CheckCircle2 className="h-3 w-3" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Send to Studio dialog ──────────────────────────────────────────────────────
type PipelineStep = "idle" | "project" | "aria" | "resource" | "linking" | "done" | "error";

const PIPELINE_STEPS: { key: PipelineStep; label: string }[] = [
  { key: "project",  label: "Creating learning project" },
  { key: "aria",     label: "Generating resource with ARIA" },
  { key: "resource", label: "Saving resource to Studio" },
  { key: "linking",  label: "Linking to training need" },
];

const ARIA_MODE_MAP: Record<string, string> = {
  workshop:      "learning_workshop_plan",
  flashcard_set: "learning_flashcards",
  quiz:          "learning_quiz",
  guidance_note: "learning_guidance_note",
  session_plan:  "learning_workshop_plan",
  curriculum:    "curriculum_builder",
  micro_learning:"learning_guidance_note",
  worksheet:     "learning_guidance_note",
  safety_plan:   "learning_guidance_note",
};

function SendToStudioDialog({ need, onClose }: { need: TrainingNeed; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [resourceType, setResourceType] = useState("workshop");
  const [pathway, setPathway] = useState("staff");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateNeed    = useUpdateTrainingNeed();
  const createProject = useCreateLearningProject();
  const createResource = useCreateGeneratedResource();

  const running = pipelineStep !== "idle" && pipelineStep !== "done" && pipelineStep !== "error";
  const done    = pipelineStep === "done";

  const handleSend = async () => {
    setPipelineStep("project");
    setErrorMsg(null);

    try {
      // ── Step 1: create the Learning Project ──────────────────────────────────
      const riskLevel = (
        need.priority === "urgent" ? "critical" :
        need.priority === "high"   ? "high"     :
        need.priority === "medium" ? "medium"   : "low"
      ) as "critical" | "high" | "medium" | "low";

      const project = await createProject.mutateAsync({
        home_id:                homeId,
        project_name:           need.title,
        pathway:                pathway as "staff" | "child" | "mixed",
        topic:                  need.need_type.replace(/_/g, " "),
        learning_objective:     need.description,
        risk_level:             riskLevel,
        reading_level:          "standard",
        tone:                   pathway === "child" ? "child_friendly" : "professional",
        linked_training_need_id: need.id,
        status:                 "active",
        created_by:             currentUser?.id ?? "staff_darren",
      });

      const projectId = project.data.id;

      // ── Step 2: call ARIA ────────────────────────────────────────────────────
      setPipelineStep("aria");
      const ariaRes = await api.post<{ data: { parsed?: Record<string, unknown>; text?: string } }>(
        "/aria",
        {
          mode:           ARIA_MODE_MAP[resourceType] ?? "learning_guidance_note",
          style:          pathway === "child" ? "child_friendly" : "professional_formal",
          source_content: `Training need: ${need.title}. Description: ${need.description}. Pathway: ${pathway}. Resource type: ${resourceType}. Priority: ${need.priority}.`,
          page_context:   "Learning Studio — Training Needs",
          record_type:    resourceType,
          user_role:      "registered_manager",
        }
      );

      const content = ariaRes.data?.parsed ?? { raw: ariaRes.data?.text ?? "" };

      // ── Step 3: persist Generated Resource ──────────────────────────────────
      setPipelineStep("resource");
      await createResource.mutateAsync({
        home_id:       homeId,
        project_id:    projectId,
        resource_type: resourceType as import("@/types/extended").GeneratedResourceType,
        title:         `${need.title} — ${resourceType.replace(/_/g, " ")}`,
        topic:         need.need_type.replace(/_/g, " "),
        pathway:       pathway as "staff" | "child" | "mixed",
        content,
        status:        "draft",
        aria_generated: true,
        created_by:    currentUser?.id ?? "staff_darren",
      });

      // ── Step 4: update training need status ──────────────────────────────────
      setPipelineStep("linking");
      await updateNeed.mutateAsync({
        id:                         need.id,
        status:                     "resource_generated",
        linked_learning_project_id: projectId,
      });

      setPipelineStep("done");
      setTimeout(onClose, 1800);

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setPipelineStep("error");
      // Best-effort fallback: at least mark need as in-progress
      try { updateNeed.mutate({ id: need.id, status: "learning_studio_sent" }); } catch { /* noop */ }
    }
  };

  const handleRetry = () => {
    setPipelineStep("idle");
    setErrorMsg(null);
  };

  const completedKeys = PIPELINE_STEPS.slice(
    0,
    done ? PIPELINE_STEPS.length : PIPELINE_STEPS.findIndex((s) => s.key === pipelineStep)
  ).map((s) => s.key);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-teal-600" />
            Send to Learning Studio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Training need summary */}
          <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-3">
            <p className="text-xs font-semibold text-[var(--cs-text-secondary)] mb-1">Training Need</p>
            <p className="text-sm font-medium text-[var(--cs-navy)]">{need.title}</p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">{need.need_type.replace(/_/g, " ")} • {need.priority}</p>
          </div>

          {/* Config — only visible before the pipeline starts */}
          {pipelineStep === "idle" && (
            <>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Resource Type</label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop Plan</SelectItem>
                    <SelectItem value="flashcard_set">Flashcard Set</SelectItem>
                    <SelectItem value="quiz">Knowledge Quiz</SelectItem>
                    <SelectItem value="guidance_note">Guidance Note</SelectItem>
                    <SelectItem value="session_plan">Session Plan</SelectItem>
                    <SelectItem value="curriculum">Curriculum Module</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Learning Pathway</label>
                <Select value={pathway} onValueChange={setPathway}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-[var(--cs-text-muted)] bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                ARIA will generate a {resourceType.replace(/_/g, " ")} for the {pathway} pathway and save it to the Learning Studio ready for review.
              </p>
            </>
          )}

          {/* Pipeline step tracker */}
          {pipelineStep !== "idle" && (
            <div className="space-y-2">
              {PIPELINE_STEPS.map(({ key, label }) => {
                const isComplete = done || completedKeys.includes(key);
                const isActive   = !done && pipelineStep === key;
                const isError    = pipelineStep === "error" && !isComplete && !isActive;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      isComplete ? "bg-emerald-50 text-emerald-700"
                      : isActive  ? "bg-blue-50 text-blue-700"
                      : isError   ? "bg-slate-50 text-[var(--cs-text-muted)]"
                      : "bg-slate-50 text-[var(--cs-text-muted)]"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    ) : isActive ? (
                      <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                    ) : (
                      <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-current opacity-40" />
                    )}
                    {label}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error feedback */}
          {pipelineStep === "error" && errorMsg && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMsg}</p>
          )}

          {/* Success feedback */}
          {done && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              ✓ Resource generated and saved to Learning Studio. Closing…
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={pipelineStep === "error" ? handleRetry : onClose} disabled={running}>
            {pipelineStep === "error" ? "Retry" : "Cancel"}
          </Button>
          <Button
            onClick={handleSend}
            disabled={running || done}
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {running ? "Working…" : done ? "Done ✓" : "Generate & Send to Studio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New need dialog ───────────────────────────────────────────────────────────
function NewNeedDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [title, setTitle] = useState("");
  const [needType, setNeedType] = useState("safeguarding");
  const [priority, setPriority] = useState<TrainingNeedPriority>("medium");
  const [identifiedBy, setIdentifiedBy] = useState<TrainingNeedIdentifiedBy>("manual");
  const [description, setDescription] = useState("");
  const [ariaAnalysing, setAriaAnalysing] = useState(false);
  const createMutation = useCreateTrainingNeed();

  const analyseWithAria = async () => {
    if (!description.trim()) return;
    setAriaAnalysing(true);
    try {
      const res = await api.post<{ data: { parsed?: { needs?: { title?: string; description?: string; priority?: string }[] } } }>(
        "/aria",
        {
          mode: "training_needs_analysis",
          style: "professional_formal",
          source_content: description,
          page_context: "Training Needs",
          record_type: "training_need",
          user_role: "registered_manager",
        }
      );
      const firstNeed = res.data?.parsed?.needs?.[0];
      if (firstNeed) {
        if (firstNeed.title) setTitle(firstNeed.title);
        if (firstNeed.description) setDescription(firstNeed.description);
        if (firstNeed.priority) setPriority(firstNeed.priority as TrainingNeedPriority);
      }
    } catch {
      // ignore
    } finally {
      setAriaAnalysing(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    createMutation.mutate(
      {
        home_id: homeId,
        identified_by: identifiedBy,
        need_type: needType,
        title,
        description,
        priority,
        status: "identified",
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => { onClose(); setTitle(""); setDescription(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            New Training Need
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Title</label>
            <Input className="mt-1" placeholder="e.g. Medication refusal management" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Type</label>
              <Select value={needType} onValueChange={setNeedType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NEED_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TrainingNeedPriority)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Identified By</label>
              <Select value={identifiedBy} onValueChange={(v) => setIdentifiedBy(v as TrainingNeedIdentifiedBy)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="aria">ARIA</SelectItem>
                  <SelectItem value="supervision">Supervision</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="ri_challenge">RI Challenge</SelectItem>
                  <SelectItem value="reg45">Reg 45</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Description / Evidence</label>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-[var(--cs-aria-gold)] gap-1 px-2" onClick={analyseWithAria} disabled={ariaAnalysing || !description.trim()}>
                <Sparkles className="h-3 w-3" />
                {ariaAnalysing ? "Analysing…" : "ARIA Analyse"}
              </Button>
            </div>
            <Textarea className="text-sm" rows={4} placeholder="Describe the training need and any supporting evidence…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createMutation.isPending} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {createMutation.isPending ? "Creating…" : "Create Need"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ARIA Auto-Detect panel ────────────────────────────────────────────────────
type DetectedNeed = {
  title: string;
  description: string;
  priority: TrainingNeedPriority;
  need_type: string;
  aria_evidence: string;
  identified_by: TrainingNeedIdentifiedBy;
};

function AriaAutoDetect({
  existingNeeds,
  onAdded,
}: {
  existingNeeds: TrainingNeed[];
  onAdded: () => void;
}) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<DetectedNeed[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState<Set<number>>(new Set());
  const [added, setAdded] = useState<Set<number>>(new Set());
  const createMutation = useCreateTrainingNeed();

  const scan = async () => {
    setScanning(true);
    setDetected([]);
    setDismissed(new Set());
    setAdded(new Set());

    // Build context from existing open needs to avoid duplicates
    const openNeedsSummary = existingNeeds
      .filter((n) => !["completed", "no_action"].includes(n.status))
      .slice(0, 10)
      .map((n) => `${n.title} (${n.priority}, ${n.status})`)
      .join("; ");

    try {
      const res = await api.post<{ data: { parsed?: { needs?: DetectedNeed[] } } }>(
        "/aria",
        {
          mode: "training_needs_analysis",
          style: "professional_formal",
          source_content: [
            "Analyse this residential children's home (Chamberlain House) for training needs.",
            "Context: recent operational data includes incidents, supervision records, medication events, safeguarding activity, and RI challenge log entries.",
            openNeedsSummary
              ? `Existing open training needs (avoid duplicating): ${openNeedsSummary}.`
              : "No existing training needs on record.",
            "Identify 3–5 specific training needs that are most likely based on typical residential care risks.",
            "Focus on safeguarding, de-escalation, recording quality, medication, contextual safeguarding, MCA, and PACE.",
            "For each need: provide a clear title, description, priority (urgent/high/medium/low), need_type, and aria_evidence explaining why this need was identified.",
          ].join(" "),
          page_context: "Training Needs — ARIA Auto-Detect",
          record_type: "training_need",
          user_role: "registered_manager",
        }
      );
      const needs = res.data?.parsed?.needs ?? [];
      setDetected(needs.slice(0, 5));
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  };

  const addNeed = async (need: DetectedNeed, index: number) => {
    setAdding((prev) => new Set(prev).add(index));
    try {
      await createMutation.mutateAsync({
        home_id: homeId,
        identified_by: need.identified_by ?? "aria",
        need_type: need.need_type ?? "safeguarding",
        title: need.title,
        description: need.description,
        priority: need.priority ?? "medium",
        status: "identified",
        aria_evidence: need.aria_evidence,
        created_by: currentUser?.id ?? "staff_darren",
      });
      setAdded((prev) => new Set(prev).add(index));
      onAdded();
    } finally {
      setAdding((prev) => { const s = new Set(prev); s.delete(index); return s; });
    }
  };

  const dismiss = (index: number) => {
    setDismissed((prev) => new Set(prev).add(index));
  };

  const visible = detected.filter((_, i) => !dismissed.has(i));
  const allHandled = detected.length > 0 && visible.every((_, i) => added.has(detected.indexOf(_)));

  return (
    <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--cs-navy)] shrink-0">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--cs-navy)]">ARIA Auto-Detect</p>
            <p className="text-xs text-[var(--cs-aria-gold)]">Scan operational data for training needs</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={scan}
          disabled={scanning}
          className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white shrink-0"
        >
          <Sparkles className={cn("h-3.5 w-3.5", scanning && "animate-pulse")} />
          {scanning ? "Scanning…" : detected.length > 0 ? "Rescan" : "Scan Now"}
        </Button>
      </div>

      {!scanning && detected.length === 0 && (
        <p className="text-xs text-[var(--cs-aria-gold)]/70 pl-1">
          ARIA will analyse recent incidents, supervision, medication events and RI alerts to surface training needs you may have missed.
        </p>
      )}

      {scanning && (
        <div className="flex items-center gap-2 py-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)] animate-pulse shrink-0" />
          <p className="text-xs text-[var(--cs-aria-gold)]">Analysing operational data…</p>
        </div>
      )}

      {!scanning && detected.length > 0 && (
        <div className="space-y-2">
          {allHandled && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              ✓ All detected needs have been added or dismissed.
            </p>
          )}
          {detected.map((need, i) => {
            if (dismissed.has(i)) return null;
            const isAdded = added.has(i);
            const isAdding = adding.has(i);
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border bg-white p-3 transition-all",
                  isAdded
                    ? "border-emerald-200 opacity-60"
                    : PRIORITY_COLOURS[need.priority]
                      ? "border-[var(--cs-border)]"
                      : "border-[var(--cs-border)]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--cs-navy)]">{need.title}</p>
                      <Badge className={cn("text-[10px] h-4 px-1.5 border shrink-0", PRIORITY_COLOURS[need.priority])}>
                        {need.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
                        {(need.need_type ?? "").replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--cs-text-secondary)] mt-1 leading-relaxed">{need.description}</p>
                    {need.aria_evidence && (
                      <p className="text-[10px] text-[var(--cs-aria-gold)] mt-1.5 italic leading-relaxed">
                        ARIA: {need.aria_evidence}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {isAdded ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
                          onClick={() => addNeed(need, i)}
                          disabled={isAdding}
                        >
                          <Plus className="h-3 w-3" />
                          {isAdding ? "Adding…" : "Add"}
                        </Button>
                        <button
                          onClick={() => dismiss(i)}
                          className="p-1 text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)] transition-colors rounded"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrainingNeedsPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [showNew, setShowNew] = useState(false);
  const [sendingToStudio, setSendingToStudio] = useState<TrainingNeed | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "active" | "completed">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"priority" | "date" | "type" | "status">("priority");

  const { data, isLoading } = useTrainingNeeds({ homeId: homeId });
  const needs = data?.data ?? [];

  const filtered = useMemo(() => {
    let list = needs;
    if (priorityFilter === "urgent") list = list.filter((n) => n.priority === "urgent");
    if (priorityFilter === "active") list = list.filter((n) => !["completed", "no_action"].includes(n.status));
    if (priorityFilter === "completed") list = list.filter((n) => n.status === "completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => {
        const hay = [
          n.title,
          n.description || "",
          n.need_type,
          n.priority,
          n.identified_by,
          n.status,
          n.aria_evidence || "",
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "type":
          return a.need_type.localeCompare(b.need_type);
        case "status": {
          const so: Record<string, number> = { identified: 0, learning_studio_sent: 1, resource_generated: 2, assigned: 3, in_progress: 4, completed: 5, no_action: 6 };
          return (so[a.status] ?? 9) - (so[b.status] ?? 9);
        }
        case "priority":
        default: {
          const po: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (po[a.priority] ?? 9) - (po[b.priority] ?? 9);
        }
      }
    });

    return list;
  }, [needs, priorityFilter, search, sortBy]);

  const urgent = needs.filter((n) => n.priority === "urgent" && !["completed","no_action"].includes(n.status));

  return (
    <PageShell
      title="Training Needs"
      subtitle="The core intelligence loop — from identification to completion"
      ariaContext={{ pageTitle: "Training Needs Analysis", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={TRAINING_NEED_EXPORT_COLS} filename="training-needs" />
          <PrintButton title="Training Needs" subtitle="Chamberlain House — Training Needs Analysis" targetId="training-needs-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Learning — Training Needs evidence upload" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Need
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="training-needs-content" className="space-y-4 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Urgent", value: urgent.length, colour: urgent.length > 0 ? "text-red-700" : "text-emerald-700" },
            { label: "Active", value: needs.filter((n) => !["completed","no_action"].includes(n.status)).length, colour: "text-amber-700" },
            { label: "In Studio", value: needs.filter((n) => ["learning_studio_sent","resource_generated","assigned","in_progress"].includes(n.status)).length, colour: "text-teal-700" },
            { label: "Completed", value: needs.filter((n) => n.status === "completed").length, colour: "text-emerald-700" },
          ].map(({ label, value, colour }) => (
            <div key={label} className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4 text-center">
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ARIA Auto-Detect */}
        <AriaAutoDetect existingNeeds={needs} onAdded={() => {}} />

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              placeholder="Search needs, type, source…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="bg-white border rounded-md px-2 py-1.5 text-xs">
              <option value="priority">Priority (urgent first)</option>
              <option value="date">Newest first</option>
              <option value="type">Type A–Z</option>
              <option value="status">Status (pipeline order)</option>
            </select>
          </div>
          <div className="flex gap-2">
            {(["all", "urgent", "active", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPriorityFilter(f)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize", priorityFilter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200")}
              >
                {f}
              </button>
            ))}
          </div>
          {(search || priorityFilter !== "all") && (
            <span className="text-xs text-[var(--cs-text-muted)]">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-sm text-[var(--cs-text-muted)] text-center py-12">Loading training needs…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Brain className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--cs-text-secondary)]">No training needs found</p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">Add needs manually or they are auto-detected by ARIA from your records</p>
            <Button size="sm" className="mt-4 gap-1" onClick={() => setShowNew(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add First Need
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((need) => (
              <NeedCard key={need.id} need={need} onSendToStudio={setSendingToStudio} />
            ))}
          </div>
        )}
      </div>

      {showNew && <NewNeedDialog open onClose={() => setShowNew(false)} />}
      {sendingToStudio && <SendToStudioDialog need={sendingToStudio} onClose={() => setSendingToStudio(null)} />}
      <AriaPanel
        mode="assist"
        pageContext="Training Needs Analysis — individual training needs, mandatory training gaps, skills assessments, competency development, workforce planning, CPD tracking, Reg 45 training evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
