"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEARNING STUDIO: WORKSHOP PLANNER
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
  useGeneratedResources, useCreateGeneratedResource,
} from "@/hooks/use-ri-learning";
import type { LearningPathway } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  Sparkles, Presentation, Clock, ChevronDown, ChevronUp, Save, FileText,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";


const PATHWAY_LABELS: Record<LearningPathway, string> = {
  child: "Children & Young People",
  staff: "Staff",
  mixed: "Mixed (Staff & Children)",
};

interface ContentSection {
  title?: string;
  duration?: string;
  content?: string;
  activity?: string;
}

interface WorkshopResult {
  workshop_title?: string;
  learning_objectives?: string[];
  facilitator_notes?: string;
  main_content_sections?: ContentSection[];
  group_activity?: string;
  reflection_exercise?: string;
  key_messages?: string[];
  evaluation_questions?: string[];
  [key: string]: unknown;
}

// ── Accordion section ──────────────────────────────────────────────────────────
function AccordionSection({ section, index }: { section: ContentSection; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border border-[var(--cs-border)] rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-50 hover:bg-[var(--cs-surface)] transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[var(--cs-text-muted)] tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-semibold text-[var(--cs-navy)]">
            {section.title ?? `Section ${index + 1}`}
          </span>
          {section.duration && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {section.duration}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-3">
          {section.content && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Content</p>
              <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </div>
          )}
          {section.activity && (
            <div>
              <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Activity</p>
              <div className="rounded-lg bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-3">
                <p className="text-sm text-[var(--cs-navy)] leading-relaxed">{section.activity}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Workshop result display ────────────────────────────────────────────────────
function WorkshopResult({
  result, onSave, saving, saved,
}: {
  result: WorkshopResult;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <Card className="border-[var(--cs-aria-gold-soft)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {result.workshop_title ?? "Workshop Plan"}
            </CardTitle>
          </div>
          <Button size="sm" onClick={onSave} disabled={saving || saved} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saved ? "Saved" : saving ? "Saving…" : "Save Workshop"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Learning objectives */}
        {Array.isArray(result.learning_objectives) && result.learning_objectives.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Learning Objectives</p>
            <ul className="space-y-1.5">
              {result.learning_objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                  <span className="text-[var(--cs-aria-gold)] font-bold shrink-0">{i + 1}.</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Facilitator notes */}
        {result.facilitator_notes && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Facilitator Notes</p>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{result.facilitator_notes}</p>
            </div>
          </div>
        )}

        {/* Main content sections */}
        {Array.isArray(result.main_content_sections) && result.main_content_sections.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Content Sections</p>
            <div className="space-y-2">
              {result.main_content_sections.map((section, i) => (
                <AccordionSection key={i} section={section} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Group activity */}
        {result.group_activity && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Group Activity</p>
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{result.group_activity}</p>
            </div>
          </div>
        )}

        {/* Reflection exercise */}
        {result.reflection_exercise && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Reflection Exercise</p>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap">{result.reflection_exercise}</p>
            </div>
          </div>
        )}

        {/* Key messages */}
        {Array.isArray(result.key_messages) && result.key_messages.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Key Messages</p>
            <ul className="space-y-1.5">
              {result.key_messages.map((msg, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                  <span className="text-[var(--cs-text-muted)] shrink-0">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evaluation questions */}
        {Array.isArray(result.evaluation_questions) && result.evaluation_questions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-2">Evaluation Questions</p>
            <ul className="space-y-1.5">
              {result.evaluation_questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-text-secondary)]">
                  <span className="text-[var(--cs-aria-gold)] font-semibold shrink-0">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Workshop list item ─────────────────────────────────────────────────────────
function WorkshopListItem({ resource }: { resource: { id: string; title: string; pathway?: LearningPathway; created_at: string; status: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--cs-border-subtle)] bg-white p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cs-aria-gold-bg)]">
        <Presentation className="h-4 w-4 text-[var(--cs-aria-gold)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--cs-navy)] truncate">{resource.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {resource.pathway && (
            <span className="text-[10px] text-[var(--cs-text-muted)]">{PATHWAY_LABELS[resource.pathway]}</span>
          )}
          <span className="text-[10px] text-[var(--cs-text-muted)]">{formatDate(resource.created_at)}</span>
        </div>
      </div>
      <Badge className={cn("text-[10px] h-4 px-1.5 shrink-0",
        resource.status === "approved" ? "bg-emerald-100 text-emerald-700"
        : resource.status === "draft" ? "bg-slate-100 text-[var(--cs-text-secondary)]"
        : "bg-blue-100 text-blue-700"
      )}>
        {resource.status}
      </Badge>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WorkshopPlannerPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [topic, setTopic] = useState("");
  const [pathway, setPathway] = useState<LearningPathway>("staff");
  const [audience, setAudience] = useState("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<WorkshopResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useGeneratedResources({ homeId: homeId });
  const createMutation = useCreateGeneratedResource();

  const workshops = (data?.data ?? []).filter((r) => r.resource_type === "workshop");

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await api.post<{ data: { parsed?: WorkshopResult } }>(
        "/aria",
        {
          mode: "learning_workshop_plan",
          style: pathway === "child" ? "child_friendly" : "professional_formal",
          source_content: `Topic: ${topic}\nAudience: ${audience}\n\nContext: ${context}`,
          page_context: "Learning Studio — Workshop Planner",
          record_type: "workshop",
          user_role: "manager",
        }
      );
      setResult(res.data?.parsed ?? null);
    } catch {
      setResult({ workshop_title: "Error", facilitator_notes: "Failed to generate workshop plan. Please try again." });
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const title = result.workshop_title ?? topic;
      await createMutation.mutateAsync({
        home_id: homeId,
        resource_type: "workshop",
        title,
        topic,
        pathway,
        content: result as Record<string, unknown>,
        status: "draft",
        aria_generated: true,
        created_by: currentUser?.id ?? "staff_darren",
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Workshop Planner"
      subtitle="Plan structured learning workshops with ARIA"
      ariaContext={{ pageTitle: "Learning Workshops", sourceType: "document" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Workshop Planner" subtitle="Chamberlain House — Learning Workshops" targetId="workshops-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning — Workshop Planner upload" />
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="workshops-content" className="space-y-6 animate-fade-in max-w-5xl">

        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cs-aria-gold-bg)]">
                <Presentation className="h-4 w-4 text-[var(--cs-aria-gold)]" />
              </div>
              Plan a Workshop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Topic</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Trauma-informed approaches to behaviour"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
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
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Audience Description</label>
              <Input
                className="mt-1"
                placeholder="e.g. Residential care staff, mixed experience levels"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Context / Focus Areas</label>
              <Textarea
                className="mt-1 text-sm"
                rows={3}
                placeholder="Any specific context, recent incidents, or areas to focus on…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
            <Button onClick={generate} disabled={generating || !topic.trim()} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Planning Workshop…" : "Plan Workshop"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <WorkshopResult result={result} onSave={save} saving={saving} saved={saved} />
        )}

        {/* Recent workshops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Recent Workshops</h3>
            <span className="text-xs text-[var(--cs-text-muted)]">{workshops.length} saved</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-[var(--cs-text-muted)] text-center py-8">Loading…</p>
          ) : workshops.length === 0 ? (
            <div className="text-center py-12 text-[var(--cs-text-muted)]">
              <Presentation className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
              <p className="text-sm font-medium">No workshops saved yet</p>
              <p className="text-xs mt-1">Plan and save your first workshop above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {workshops.map((w) => (
                <WorkshopListItem key={w.id} resource={w} />
              ))}
            </div>
          )}
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Learning Workshops — staff training workshops, group learning sessions, therapeutic skills workshops, safeguarding training days, practice development events, CPD evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
