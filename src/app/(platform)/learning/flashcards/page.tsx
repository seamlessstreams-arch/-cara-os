"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEARNING STUDIO: FLASHCARD SETS
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Sparkles, LayoutGrid, Save, RotateCw, ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";


const PATHWAY_LABELS: Record<LearningPathway, string> = {
  child: "Children & Young People",
  staff: "Staff",
  mixed: "Mixed (Staff & Children)",
};

const DIFFICULTY_COLOURS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
  mixed: "bg-blue-100 text-blue-700",
};

interface Flashcard {
  question: string;
  answer: string;
  difficulty?: "easy" | "medium" | "hard";
  hint?: string;
}

interface FlashcardSet {
  set_title?: string;
  introduction_note?: string;
  cards?: Flashcard[];
  [key: string]: unknown;
}

// ── Flip card ─────────────────────────────────────────────────────────────────
function FlipCard({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="cursor-pointer select-none"
      onClick={() => setFlipped((p) => !p)}
      title="Click to flip"
    >
      <div
        className={cn(
          "relative rounded-xl border p-4 min-h-[140px] flex flex-col justify-between transition-all",
          flipped
            ? "border-violet-200 bg-violet-50"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <Badge
            className={cn(
              "text-[10px] h-4 px-1.5 shrink-0",
              DIFFICULTY_COLOURS[card.difficulty ?? "medium"] ?? "bg-slate-100 text-slate-700"
            )}
          >
            {card.difficulty ?? "medium"}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <RotateCw className="h-2.5 w-2.5" />
            {flipped ? "Answer" : "Question"}
          </div>
        </div>
        <div className="mt-3 flex-1 flex items-center">
          <p className={cn("text-sm leading-relaxed", flipped ? "text-violet-900 font-medium" : "text-slate-800")}>
            {flipped ? card.answer : card.question}
          </p>
        </div>
        {!flipped && card.hint && (
          <p className="text-[10px] text-slate-400 mt-2 italic">Hint: {card.hint}</p>
        )}
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] text-slate-400">
            {flipped ? "Click to see question" : "Click to reveal answer"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Saved set item ─────────────────────────────────────────────────────────────
function SavedSetItem({ resource }: { resource: { id: string; title: string; pathway?: LearningPathway; created_at: string; status: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:shadow-sm transition-shadow">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
        <LayoutGrid className="h-4 w-4 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{resource.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {resource.pathway && (
            <span className="text-[10px] text-slate-400">{PATHWAY_LABELS[resource.pathway]}</span>
          )}
          <span className="text-[10px] text-slate-400">{formatDate(resource.created_at)}</span>
        </div>
      </div>
      <Badge className={cn("text-[10px] h-4 px-1.5 shrink-0",
        resource.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
      )}>
        {resource.status}
      </Badge>
      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [topic, setTopic] = useState("");
  const [pathway, setPathway] = useState<LearningPathway>("staff");
  const [difficulty, setDifficulty] = useState<"easy" | "mixed" | "hard">("mixed");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<FlashcardSet | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useGeneratedResources({ homeId: homeId });
  const createMutation = useCreateGeneratedResource();

  const flashcardSets = (data?.data ?? []).filter((r) => r.resource_type === "flashcard_set");

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await api.post<{ data: { parsed?: FlashcardSet } }>(
        "/aria",
        {
          mode: "learning_flashcards",
          style: pathway === "child" ? "child_friendly" : "professional_formal",
          source_content: `Topic: ${topic}\nDifficulty: ${difficulty}\nPathway: ${pathway}`,
          page_context: "Learning Studio — Flashcard Sets",
          record_type: "flashcard_set",
          user_role: "manager",
        }
      );
      setResult(res.data?.parsed ?? null);
    } catch {
      setResult({
        set_title: "Error",
        introduction_note: "Failed to generate flashcards. Please try again.",
        cards: [],
      });
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const title = result.set_title ?? topic;
      await createMutation.mutateAsync({
        home_id: homeId,
        resource_type: "flashcard_set",
        title,
        topic,
        pathway,
        content: result as Record<string, unknown>,
        status: "draft",
        aria_generated: true,
        created_by: currentUser?.id ?? "staff_darren",
        tags: [difficulty, pathway],
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Flashcard Sets"
      subtitle="Generate interactive flashcard sets for learning and revision"
      ariaContext={{ pageTitle: "Learning Flashcards", sourceType: "document" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Flashcard Sets" subtitle="Oak House — Learning Flashcards" targetId="flashcards-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning — Flashcard Sets upload" />
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="flashcards-content" className="space-y-6 animate-fade-in max-w-5xl">

        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100">
                <LayoutGrid className="h-4 w-4 text-teal-600" />
              </div>
              Generate Flashcard Set
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Topic</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Safeguarding thresholds"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pathway</label>
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
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Difficulty</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "mixed" | "hard")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="hard">Hard / Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generate} disabled={generating || !topic.trim()} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating Flashcards…" : "Generate Flashcards"}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-teal-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{result.set_title ?? "Flashcard Set"}</CardTitle>
                  {result.introduction_note && (
                    <p className="text-sm text-slate-500 mt-1">{result.introduction_note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {Array.isArray(result.cards) ? result.cards.length : 0} cards
                  </Badge>
                  <Button size="sm" onClick={save} disabled={saving || saved} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {saved ? "Saved" : saving ? "Saving…" : "Save Set"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {Array.isArray(result.cards) && result.cards.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {result.cards.map((card, i) => (
                    <FlipCard key={i} card={card} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">No cards generated</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Saved sets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Saved Flashcard Sets</h3>
            <span className="text-xs text-slate-400">{flashcardSets.length} sets</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
          ) : flashcardSets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <LayoutGrid className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium">No flashcard sets saved yet</p>
              <p className="text-xs mt-1">Generate and save your first set above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {flashcardSets.map((s) => (
                <SavedSetItem key={s.id} resource={s} />
              ))}
            </div>
          )}
        </div>
      </div>
      <AriaPanel
        mode="assist"
        pageContext="Learning Flashcards — knowledge retention, training revision, safeguarding flashcards, regulatory knowledge, children's rights, care practice flashcard sets"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
