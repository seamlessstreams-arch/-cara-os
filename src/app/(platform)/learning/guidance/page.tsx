"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — GUIDANCE NOTES GENERATOR
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
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  FileText, Sparkles, CheckCircle2, Clock, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";


type GuidanceResult = {
  title: string;
  pathway: string;
  purpose: string;
  key_definitions: { term: string; definition: string }[];
  main_content: string;
  practical_examples: string[];
  legal_regulatory_context: string;
  what_good_looks_like: string;
  common_mistakes: string[];
  reflection_questions: string[];
  further_reading: string[];
};

const TOPICS = [
  "Safeguarding procedures",
  "Physical intervention and restraint",
  "Medication administration",
  "Missing from care — return home interview",
  "Online safety and exploitation awareness",
  "County lines and criminal exploitation",
  "Contextual safeguarding",
  "Trauma-informed practice",
  "PACE approach",
  "Mental Capacity Act (MCA)",
  "Deprivation of Liberty (DoLS)",
  "Care planning and LAC reviews",
  "Recording standards and quality",
  "Whistle-blowing and allegations",
  "Health and safety duties",
  "Equality, diversity and inclusion",
  "Children's rights and complaints",
  "Working with families",
  "Risk assessment and risk management",
  "Supervision and reflective practice",
];

function GuidanceCard({ resource }: { resource: { id: string; title: string; status: string; created_at: string; pathway?: string | null; resource_type: string; home_id: string; topic?: string | null; tags?: string[] | null } }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [expanded, setExpanded] = useState(false);
  const updateMutation = useUpdateGeneratedResource();
  const addToLibrary = useCreateResourceLibraryEntry();

  const handleApprove = () => {
    updateMutation.mutate(
      { id: resource.id, status: "approved", approved_by: currentUser?.id ?? "staff_darren", approved_at: new Date().toISOString() },
      {
        onSuccess: () => {
          addToLibrary.mutate({
            home_id: resource.home_id,
            resource_id: resource.id,
            resource_type: resource.resource_type,
            title: resource.title,
            topic: resource.topic ?? undefined,
            pathway: (resource.pathway as "child" | "staff" | "mixed") ?? undefined,
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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">{resource.title}</p>
              <Badge className={cn("text-[10px] h-4 px-1.5 shrink-0", resource.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-[var(--cs-text-secondary)]")}>
                {resource.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {resource.pathway && <Badge variant="outline" className="text-[10px] h-4 px-1.5 capitalize">{resource.pathway}</Badge>}
              <span className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(resource.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {resource.status !== "approved" && (
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-emerald-700 border-emerald-200" onClick={handleApprove} disabled={updateMutation.isPending}>
                <CheckCircle2 className="h-3 w-3" />
                Approve
              </Button>
            )}
            <button onClick={() => setExpanded((p) => !p)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GuidanceNotesPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [topic, setTopic] = useState("");
  const [pathway, setPathway] = useState("staff");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GuidanceResult | null>(null);

  const { data: resourcesData } = useGeneratedResources({ homeId: homeId });
  const createMutation = useCreateGeneratedResource();
  const addToLibrary = useCreateResourceLibraryEntry();

  const guidanceResources = (resourcesData?.data ?? []).filter(
    (r) => r.resource_type === "guidance_note"
  );

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post<{ data: { parsed?: GuidanceResult } }>(
        "/aria",
        {
          mode: "learning_guidance_note",
          style: "professional_formal",
          source_content: `Topic: ${topic}. Pathway: ${pathway}. Additional context: ${context || "Standard residential children's home context. Chamberlain House."}`,
          page_context: "Guidance Notes Generator",
          record_type: "guidance_note",
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
        resource_type: "guidance_note",
        title: result.title || `Guidance Note — ${topic}`,
        topic,
        pathway: pathway as "staff" | "child" | "mixed",
        content: result as unknown as Record<string, unknown>,
        raw_text: result.main_content,
        status: "draft",
        aria_generated: true,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => setResult(null) }
    );
  };

  return (
    <PageShell
      title="Guidance Notes"
      subtitle="Generate professional practice guidance for staff or children"
      ariaContext={{ pageTitle: "Practice Guidance", sourceType: "document" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Guidance Notes" subtitle="Chamberlain House — Practice Guidance" targetId="guidance-content" />
          <SmartUploadButton variant="inline" label="Upload Guidance" uploadContext="Learning — Guidance Notes upload" />
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="guidance-content" className="space-y-5 animate-fade-in">
        {/* Generator */}
        <Card className="border border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Generate Guidance Note with ARIA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Topic</label>
                <div className="relative mt-1">
                  <Input
                    list="guidance-topics"
                    placeholder="e.g. Safeguarding procedures"
                    value={topic}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                  />
                  <datalist id="guidance-topics">
                    {TOPICS.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Pathway</label>
                <Select value={pathway} onValueChange={setPathway}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="child">Child / Young Person</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Additional Context (optional)</label>
              <Textarea
                className="mt-1 text-sm"
                rows={2}
                placeholder="Any specific context, recent incidents, or areas to emphasise…"
                value={context}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
              />
            </div>
            <Button
              onClick={generate}
              disabled={!topic.trim() || generating}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating…" : "Generate Guidance Note"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 text-white p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                  <FileText className="h-4.5 w-4.5 text-white" style={{ width: "1.125rem", height: "1.125rem" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold">{result.title}</h3>
                  <Badge className="text-[10px] bg-blue-600/30 text-blue-200 capitalize mt-0.5">{result.pathway} pathway</Badge>
                </div>
              </div>
              <p className="text-sm text-[var(--cs-text-gentle)] leading-relaxed">{result.purpose}</p>
            </div>

            {result.key_definitions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Key Definitions</p>
                <div className="space-y-2">
                  {result.key_definitions.map((d, i) => (
                    <div key={i} className="rounded-lg border border-[var(--cs-border-subtle)] bg-white px-4 py-2.5">
                      <span className="text-xs font-bold text-[var(--cs-navy)]">{d.term}: </span>
                      <span className="text-xs text-[var(--cs-text-secondary)]">{d.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.main_content && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Main Content</p>
                <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4">
                  <p className="text-sm text-[var(--cs-navy)] leading-relaxed whitespace-pre-wrap">{result.main_content}</p>
                </div>
              </div>
            )}

            {result.practical_examples?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Practical Examples</p>
                <div className="space-y-2">
                  {result.practical_examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                      <span className="text-blue-500 font-bold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                      <p className="text-xs text-blue-900">{ex}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.what_good_looks_like && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">What Good Looks Like</p>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-900 leading-relaxed">{result.what_good_looks_like}</p>
                </div>
              </div>
            )}

            {result.common_mistakes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Common Mistakes to Avoid</p>
                <div className="space-y-1.5">
                  {result.common_mistakes.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                      <span className="text-amber-500 font-bold text-xs shrink-0 mt-0.5">✗</span>
                      <p className="text-xs text-amber-900">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.reflection_questions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Reflection Questions</p>
                <div className="space-y-1.5">
                  {result.reflection_questions.map((q, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 border border-[var(--cs-border)] px-3 py-2">
                      <p className="text-xs text-[var(--cs-text-secondary)] italic">"{q}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.legal_regulatory_context && (
              <div>
                <p className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-2">Legal & Regulatory Context</p>
                <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4">
                  <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{result.legal_regulatory_context}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={createMutation.isPending} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {createMutation.isPending ? "Saving…" : "Save Guidance Note"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setResult(null)}>Discard</Button>
            </div>
          </div>
        )}

        {/* Saved notes */}
        {guidanceResources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-3">Saved Guidance Notes ({guidanceResources.length})</h3>
            <div className="space-y-3">
              {guidanceResources.map((r) => (
                <GuidanceCard key={r.id} resource={r} />
              ))}
            </div>
          </div>
        )}
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Practice Guidance — care practice notes, procedure guidance, regulatory guidance, safeguarding guidance, therapeutic approaches, PACE, DDP, legislation summaries, Reg 45 practice"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
