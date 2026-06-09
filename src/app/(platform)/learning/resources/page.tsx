"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEARNING STUDIO: RESOURCE GENERATOR
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useGeneratedResources, useCreateGeneratedResource, useUpdateGeneratedResource,
  useCreateResourceLibraryEntry,
} from "@/hooks/use-ri-learning";
import type { GeneratedResource, GeneratedResourceType, LearningPathway } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  Sparkles, BookOpen, CheckCircle2, Clock, FileText, Save, Plus,
} from "lucide-react";


const RESOURCE_TYPES: { value: GeneratedResourceType; label: string }[] = [
  { value: "workshop", label: "Workshop Plan" },
  { value: "flashcard_set", label: "Flashcard Set" },
  { value: "quiz", label: "Quiz" },
  { value: "guidance_note", label: "Guidance Note" },
  { value: "session_plan", label: "Session Plan" },
  { value: "worksheet", label: "Worksheet" },
  { value: "safety_plan", label: "Safety Plan" },
  { value: "micro_learning", label: "Micro Learning" },
];

const PATHWAY_LABELS: Record<LearningPathway, string> = {
  child: "Children & Young People",
  staff: "Staff",
  mixed: "Mixed (Staff & Children)",
};

const STATUS_COLOURS: Record<string, string> = {
  draft: "bg-slate-100 text-[var(--cs-text-secondary)]",
  reviewed: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  published: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  archived: "bg-slate-100 text-[var(--cs-text-muted)]",
};

function ariaMode(type: GeneratedResourceType): string {
  switch (type) {
    case "workshop": return "learning_workshop_plan";
    case "flashcard_set": return "learning_flashcards";
    case "quiz": return "learning_quiz";
    case "guidance_note": return "learning_guidance_note";
    case "session_plan": return "learning_session_plan";
    case "worksheet": return "learning_worksheet";
    case "safety_plan": return "learning_safety_plan";
    case "micro_learning": return "learning_micro_learning";
    case "curriculum": return "curriculum_builder";
    default: return "learning_guidance_note";
  }
}

function ariaStyle(pathway: LearningPathway, tone: string): string {
  if (tone === "child_friendly") return "child_friendly";
  if (tone === "warm") return "warm_professional";
  return "professional_formal";
}

// ── Result renderer ────────────────────────────────────────────────────────────
function ResultSection({ label, value }: { label: string; value: unknown }) {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">{label}</p>
        <ul className="space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-[var(--cs-text-secondary)] flex gap-2">
              <span className="text-[var(--cs-text-muted)] shrink-0">•</span>
              <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (typeof value === "string") {
    return (
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">{value}</p>
      </div>
    );
  }
  return null;
}

// ── Resource card ──────────────────────────────────────────────────────────────
function ResourceCard({ resource }: { resource: GeneratedResource }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const updateMutation = useUpdateGeneratedResource();
  const addToLibrary = useCreateResourceLibraryEntry();

  const handleApprove = () => {
    // Approve the resource
    updateMutation.mutate(
      { id: resource.id, status: "approved", approved_by: currentUser?.id ?? "staff_darren", approved_at: new Date().toISOString() },
      {
        onSuccess: () => {
          // Auto-add to Resource Library
          addToLibrary.mutate({
            home_id: resource.home_id,
            resource_id: resource.id,
            resource_type: resource.resource_type,
            title: resource.title,
            topic: resource.topic,
            pathway: resource.pathway,
            tags: resource.tags ?? [],
            is_approved: true,
            is_pinned: false,
            usage_count: 0,
            created_by: currentUser?.id ?? "staff_darren",
          });
        },
      }
    );
  };

  return (
    <Card className="border border-[var(--cs-border-subtle)]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cs-aria-gold-bg)]">
            <FileText className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cs-navy)] truncate">{resource.title}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={cn("text-[10px] h-4 px-1.5", STATUS_COLOURS[resource.status] ?? "")}>
                  {resource.status}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {RESOURCE_TYPES.find((r) => r.value === resource.resource_type)?.label ?? resource.resource_type}
              </Badge>
              {resource.pathway && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {PATHWAY_LABELS[resource.pathway]}
                </Badge>
              )}
              <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(resource.created_at)}
              </span>
            </div>
          </div>
          {resource.status !== "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 gap-1 text-emerald-700 border-emerald-200 shrink-0"
              onClick={handleApprove}
              disabled={updateMutation.isPending || addToLibrary.isPending}
            >
              <CheckCircle2 className="h-3 w-3" />
              Approve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResourceGeneratorPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [topic, setTopic] = useState("");
  const [pathway, setPathway] = useState<LearningPathway>("staff");
  const [resourceType, setResourceType] = useState<GeneratedResourceType>("guidance_note");
  const [context, setContext] = useState("");
  const [readingLevel, setReadingLevel] = useState<"standard" | "accessible" | "simple">("standard");
  const [tone, setTone] = useState<"professional" | "warm" | "child_friendly">("professional");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useGeneratedResources({ homeId: homeId });
  const createMutation = useCreateGeneratedResource();
  const resources = data?.data ?? [];

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await api.post<{ data: { parsed?: Record<string, unknown> } }>(
        "/aria",
        {
          mode: ariaMode(resourceType),
          style: ariaStyle(pathway, tone),
          source_content: `Topic: ${topic}\n\nContext: ${context}`,
          page_context: "Learning Studio — Resource Generator",
          record_type: resourceType,
          user_role: "manager",
        }
      );
      setResult(res.data?.parsed ?? null);
    } catch {
      setResult({ error: "Failed to generate resource. Please try again." });
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const title =
        (result.title as string) ||
        (result.workshop_title as string) ||
        (result.set_title as string) ||
        (result.quiz_title as string) ||
        topic;
      await createMutation.mutateAsync({
        home_id: homeId,
        resource_type: resourceType,
        title,
        topic,
        pathway,
        content: result,
        status: "draft",
        aria_generated: true,
        created_by: currentUser?.id ?? "staff_darren",
        tags: [pathway, readingLevel],
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const RESULT_LABEL_MAP: Record<string, string> = {
    title: "Title",
    workshop_title: "Workshop Title",
    session_title: "Session Title",
    worksheet_title: "Worksheet Title",
    plan_title: "Plan Title",
    set_title: "Set Title",
    quiz_title: "Quiz Title",
    introduction: "Introduction",
    introduction_note: "Introduction",
    overview: "Overview",
    purpose: "Purpose",
    session_purpose: "Session Purpose",
    learning_objectives: "Learning Objectives",
    learning_outcomes: "Learning Outcomes",
    key_messages: "Key Messages",
    main_content: "Main Content",
    facilitator_notes: "Facilitator Notes",
    staff_preparation: "Staff Preparation",
    staff_guidance: "Staff Guidance",
    staff_notes: "Staff Notes",
    opening_activity: "Opening Activity",
    closing_activity: "Closing Activity",
    reflection_prompts: "Reflection Prompts",
    reflection_questions: "Reflection Questions",
    follow_up_actions: "Follow-Up Actions",
    safeguarding_considerations: "Safeguarding Considerations",
    instructions: "Instructions",
    warning_signs: "Warning Signs",
    safe_places: "Safe Places",
    what_to_do_in_crisis: "What To Do In Crisis",
    things_to_remember: "Things To Remember",
    hook: "Hook",
    key_point_1: "Key Point 1",
    key_point_2: "Key Point 2",
    key_point_3: "Key Point 3",
    quick_activity: "Quick Activity",
    one_thing_to_do: "One Thing To Do",
    further_learning: "Further Learning",
    guidance: "Guidance",
    notes: "Notes",
    evaluation_questions: "Evaluation Questions",
    further_reading: "Further Reading",
    common_mistakes: "Common Mistakes",
    practical_examples: "Practical Examples",
    legal_regulatory_context: "Legal & Regulatory Context",
    what_good_looks_like: "What Good Looks Like",
  };

  return (
    <PageShell
      title="Resource Generator"
      subtitle="Generate learning resources with ARIA for staff and young people"
      ariaContext={{ pageTitle: "Learning Resources", sourceType: "document" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Resource Generator" subtitle="Chamberlain House — Learning Resources" targetId="resources-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning — Resource Generator upload" />
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="resources-content" className="space-y-6 animate-fade-in max-w-5xl">

        {/* Generator form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cs-aria-gold-bg)]">
                <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
              </div>
              Generate with ARIA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Topic</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. County Lines awareness for staff"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Resource Type</label>
                <Select value={resourceType} onValueChange={(v) => setResourceType(v as GeneratedResourceType)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Pathway</label>
                <Select value={pathway} onValueChange={(v) => setPathway(v as LearningPathway)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PATHWAY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Reading Level</label>
                <Select value={readingLevel} onValueChange={(v) => setReadingLevel(v as "standard" | "accessible" | "simple")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="accessible">Accessible</SelectItem>
                    <SelectItem value="simple">Simple / Plain English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Tone</label>
                <Select value={tone} onValueChange={(v) => setTone(v as "professional" | "warm" | "child_friendly")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="warm">Warm / Relational</SelectItem>
                    <SelectItem value="child_friendly">Child Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Additional Context</label>
              <Textarea
                className="mt-1 text-sm"
                rows={3}
                placeholder="Any specific context, audience details, or focus areas for ARIA…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <Button
              onClick={generate}
              disabled={generating || !topic.trim()}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating…" : "Generate with ARIA"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-[var(--cs-aria-gold-soft)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Generated Resource</CardTitle>
                <Button
                  size="sm"
                  onClick={save}
                  disabled={saving || saved}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saved ? "Saved" : saving ? "Saving…" : "Save Resource"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(result.error as string | undefined) ? (
                <p className="text-sm text-red-600">{result.error as string}</p>
              ) : (
                Object.entries(result).map(([key, value]) => {
                  const label = RESULT_LABEL_MAP[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return <ResultSection key={key} label={label} value={value} />;
                })
              )}
            </CardContent>
          </Card>
        )}

        {/* Existing resources */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Saved Resources</h3>
            <span className="text-xs text-[var(--cs-text-muted)]">{resources.length} resource{resources.length !== 1 ? "s" : ""}</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-[var(--cs-text-muted)] text-center py-8">Loading resources…</p>
          ) : resources.length === 0 ? (
            <div className="text-center py-12 text-[var(--cs-text-muted)]">
              <BookOpen className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
              <p className="text-sm font-medium">No resources saved yet</p>
              <p className="text-xs mt-1">Generate and save your first resource above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </div>
          )}
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Learning Resources — training resource generation, care practice documents, policy templates, safeguarding resources, regulatory guidance, CPD materials, workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
