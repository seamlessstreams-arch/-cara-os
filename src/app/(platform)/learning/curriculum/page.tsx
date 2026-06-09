"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CURRICULUM BUILDER
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
import { useGeneratedResources, useCreateGeneratedResource } from "@/hooks/use-ri-learning";
import { cn } from "@/lib/utils";
import { GraduationCap, Sparkles, CheckCircle2, ChevronDown, ChevronUp, Clock, BookOpen } from "lucide-react";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { useAuthContext } from "@/contexts/auth-context";


type CurriculumModule = {
  module_number: number;
  title: string;
  learning_objective: string;
  duration: string;
  content_type: string;
  description: string;
  resources_needed: string[];
  assessment_method: string;
};

type CurriculumResult = {
  curriculum_title: string;
  pathway: string;
  overview: string;
  duration: string;
  learning_outcomes: string[];
  modules: CurriculumModule[];
  assessment_framework: string;
  completion_criteria: string;
  staff_guidance: string;
};

const CONTENT_TYPE_COLOURS: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-700",
  self_study: "bg-slate-100 text-[var(--cs-text-secondary)]",
  discussion: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  activity: "bg-amber-100 text-amber-700",
  assessment: "bg-emerald-100 text-emerald-700",
};

function ModuleCard({ module }: { module: CurriculumModule }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-[var(--cs-border)] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
          {module.module_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--cs-navy)]">{module.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={cn("text-[10px] h-4 px-1.5", CONTENT_TYPE_COLOURS[module.content_type] ?? "bg-slate-100 text-[var(--cs-text-secondary)]")}>
              {module.content_type?.replace("_", " ")}
            </Badge>
            {module.duration && (
              <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {module.duration}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--cs-border-subtle)] pt-3">
          {module.learning_objective && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Learning Objective</p>
              <p className="text-sm text-[var(--cs-text-secondary)]">{module.learning_objective}</p>
            </div>
          )}
          {module.description && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Content</p>
              <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{module.description}</p>
            </div>
          )}
          {module.resources_needed?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Resources</p>
              <ul className="text-xs text-[var(--cs-text-secondary)] space-y-0.5 list-disc list-inside">
                {module.resources_needed.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
          {module.assessment_method && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Assessment</p>
              <p className="text-sm text-[var(--cs-text-secondary)]">{module.assessment_method}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CurriculumBuilderPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [topic, setTopic] = useState("");
  const [pathway, setPathway] = useState("staff");
  const [audience, setAudience] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [duration, setDuration] = useState("4 weeks");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CurriculumResult | null>(null);

  const { data: resourcesData } = useGeneratedResources({ homeId: homeId });
  const createMutation = useCreateGeneratedResource();

  const curricula = (resourcesData?.data ?? []).filter((r) => r.resource_type === "curriculum");

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post<{ data: { parsed?: CurriculumResult } }>(
        "/aria",
        {
          mode: "curriculum_builder",
          style: "professional_formal",
          source_content: `Topic: ${topic}. Pathway: ${pathway}. Target audience: ${audience || "residential care staff"}. Desired outcomes: ${outcomes || "not specified"}. Intended duration: ${duration}.`,
          page_context: "Curriculum Builder",
          record_type: "curriculum",
          user_role: "registered_manager",
        }
      );
      const parsed = res.data?.parsed;
      if (parsed) setResult(parsed);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const save = () => {
    if (!result) return;
    createMutation.mutate(
      {
        home_id: homeId,
        resource_type: "curriculum",
        title: result.curriculum_title || `${pathway} Curriculum — ${topic}`,
        topic,
        pathway: pathway as "staff" | "child" | "mixed",
        content: result as unknown as Record<string, unknown>,
        raw_text: result.overview,
        status: "draft",
        aria_generated: true,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => setResult(null) }
    );
  };

  return (
    <PageShell
      title="Curriculum Builder"
      subtitle="Design structured multi-module learning pathways with ARIA"
      ariaContext={{ pageTitle: "Learning Curriculum", sourceType: "document" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Curriculum Builder" subtitle="Chamberlain House — Learning Curriculum" targetId="curriculum-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning — Curriculum Builder upload" />
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="curriculum-content" className="space-y-5 animate-fade-in">
        {/* Form */}
        <Card className="border border-teal-100 bg-teal-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              Build a New Curriculum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Topic / Theme</label>
                <Input className="mt-1" placeholder="e.g. Trauma-Informed Practice" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Duration</label>
                <Input className="mt-1" placeholder="e.g. 6 weeks, 3 days, 1 month" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Pathway</label>
                <Select value={pathway} onValueChange={setPathway}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Target Audience</label>
                <Input className="mt-1" placeholder="e.g. All care staff, new starters, TLs" value={audience} onChange={(e) => setAudience(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Desired Learning Outcomes</label>
              <Textarea className="mt-1 text-sm" rows={2} placeholder="What should participants know or be able to do after completing this curriculum?" value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
            </div>
            <Button onClick={generate} disabled={!topic.trim() || generating} className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Building Curriculum…" : "Build Curriculum with ARIA"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
                  <GraduationCap className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{result.curriculum_title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-[10px] bg-teal-600/40 text-teal-200 capitalize">{result.pathway}</Badge>
                    {result.duration && <span className="text-xs text-[var(--cs-text-muted)]">{result.duration}</span>}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--cs-text-gentle)] leading-relaxed">{result.overview}</p>
            </div>

            {result.learning_outcomes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Learning Outcomes</p>
                <div className="space-y-1.5">
                  {result.learning_outcomes.map((o, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-900">{o}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.modules?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">
                  {result.modules.length} Module{result.modules.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {result.modules.map((m) => <ModuleCard key={m.module_number} module={m} />)}
                </div>
              </div>
            )}

            {result.assessment_framework && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Assessment Framework</p>
                <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4">
                  <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{result.assessment_framework}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={createMutation.isPending} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {createMutation.isPending ? "Saving…" : "Save Curriculum"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setResult(null)}>Discard</Button>
            </div>
          </div>
        )}

        {/* Saved curricula */}
        {curricula.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-3">Saved Curricula</h3>
            <div className="space-y-3">
              {curricula.map((c) => (
                <div key={c.id} className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                    <BookOpen className="h-4.5 w-4.5 text-teal-600" style={{ width: "1.125rem", height: "1.125rem" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--cs-navy)]">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.pathway && <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{c.pathway}</Badge>}
                      <Badge className={cn("text-[10px] h-4 px-1.5", c.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-[var(--cs-text-secondary)]")}>
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Learning Curriculum — training curriculum structure, mandatory training topics, care skills modules, safeguarding training, children's rights, therapeutic approaches, workforce development"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
