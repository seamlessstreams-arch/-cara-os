"use client";

// CaraDraftAssistant — Cara helps write a stronger, child-centred draft. Pick a
// draft type, supply the source content, generate, then EDIT every section before
// saving. Deterministic scaffold always; AI narrative when a provider is set.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine, Loader2, Sparkles } from "lucide-react";
import { useCaraPracticeDraft, type DraftInput } from "@/hooks/use-cara-practice";
import type { CaraDraftType } from "@/lib/cara-practice/cara-draft";
import type { PracticeSourceType } from "@/lib/cara-practice/types";

const DRAFT_TYPES: { value: CaraDraftType; label: string }[] = [
  { value: "professional_record", label: "Professional record" },
  { value: "child_friendly_explanation", label: "Child-friendly explanation" },
  { value: "manager_threshold_summary", label: "Manager threshold summary" },
  { value: "supervision_reflection", label: "Supervision reflection" },
  { value: "care_plan_impact_statement", label: "Care plan — impact statement" },
  { value: "protective_factor_rewrite", label: "Protective factor rewrite" },
  { value: "livers_analysis", label: "L.I.V.E.R.S. analysis" },
];

export interface CaraDraftAssistantProps {
  sourceType?: PracticeSourceType;
  content?: string;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
}

export function CaraDraftAssistant(props: CaraDraftAssistantProps) {
  const [draftType, setDraftType] = useState<CaraDraftType>("professional_record");
  const [content, setContent] = useState(props.content ?? "");
  const [sections, setSections] = useState<{ heading: string; body: string }[] | null>(null);
  const [narrative, setNarrative] = useState<string>("");
  const draft = useCaraPracticeDraft();

  const generate = () => {
    const input: DraftInput = {
      draftType,
      sourceType: props.sourceType ?? "daily_record",
      content,
      childId: props.childId,
      staffId: props.staffId,
      homeId: props.homeId,
    };
    draft.mutate(input, {
      onSuccess: (res) => {
        setSections(res.data.sections.map((s) => ({ ...s })));
        setNarrative(res.data.aiNarrative ?? "");
      },
    });
  };

  const editSection = (i: number, body: string) =>
    setSections((prev) => (prev ? prev.map((s, idx) => (idx === i ? { ...s, body } : s)) : prev));

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-[var(--cs-cara-gold,#f6f1e6)]/40">
        <CardTitle className="text-sm flex items-center gap-2">
          <PenLine className="h-4 w-4 text-amber-600" /> Cara Draft Assistant
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{draft.data?.data.disclaimer ?? "Cara drafts; you review, edit and approve before saving."}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-slate-200 p-1.5 text-sm"
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as CaraDraftType)}
          >
            {DRAFT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button size="sm" onClick={generate} disabled={draft.isPending || content.trim().length === 0}>
            {draft.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate draft
          </Button>
          {draft.data?.data.generatedBy === "ai" && <span className="text-[11px] text-emerald-700">AI-enhanced</span>}
        </div>

        <textarea
          className="w-full min-h-[80px] rounded-md border border-slate-200 p-2 text-sm"
          placeholder="Paste the source record / notes to draft from…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {draft.isError && <p className="text-sm text-red-600">{(draft.error as Error)?.message ?? "Could not generate a draft."}</p>}

        {sections && (
          <div className="space-y-3">
            {narrative && (
              <div>
                <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Cara narrative (editable)</h4>
                <textarea className="w-full min-h-[120px] rounded-md border border-emerald-200 bg-emerald-50/40 p-2 text-sm" value={narrative} onChange={(e) => setNarrative(e.target.value)} />
              </div>
            )}
            {sections.map((s, i) => (
              <div key={i}>
                <h4 className="text-xs font-semibold text-slate-600 mb-1">{s.heading}</h4>
                <textarea className="w-full min-h-[56px] rounded-md border border-slate-200 p-2 text-sm" value={s.body} onChange={(e) => editSection(i, e.target.value)} />
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">Edit any section above before saving into the record. Cara advises; you decide.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
