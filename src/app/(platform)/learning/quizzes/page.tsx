"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEARNING STUDIO: KNOWLEDGE QUIZZES
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  Sparkles, HelpCircle, CheckCircle2, XCircle, Save, RotateCcw,
  ChevronRight, ChevronLeft, Trophy, AlertCircle,
} from "lucide-react";


const PATHWAY_LABELS: Record<LearningPathway, string> = {
  child: "Children & Young People",
  staff: "Staff",
  mixed: "Mixed (Staff & Children)",
};

interface QuizOption {
  label: string;
  text: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  correct_answer: string;
  explanation: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface QuizResult {
  quiz_title?: string;
  introduction?: string;
  questions?: QuizQuestion[];
  pass_mark?: number;
  pass_feedback?: string;
  fail_feedback?: string;
  [key: string]: unknown;
}

// ── Quiz player ────────────────────────────────────────────────────────────────
function QuizPlayer({
  quiz, onSave, saving, saved,
}: {
  quiz: QuizResult;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const questions = quiz.questions ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [complete, setComplete] = useState(false);

  const current = questions[currentIndex];
  const isAnswered = currentIndex in submitted;
  const selectedAnswer = selected[currentIndex];
  const isCorrect = selectedAnswer === current?.correct_answer;

  const handleSelect = (label: string) => {
    if (isAnswered) return;
    setSelected((p) => ({ ...p, [currentIndex]: label }));
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;
    setSubmitted((p) => ({ ...p, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setComplete(true);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelected({});
    setSubmitted({});
    setComplete(false);
  };

  const score = Object.keys(submitted).filter((k) => selected[parseInt(k)] === questions[parseInt(k)]?.correct_answer).length;
  const passMark = quiz.pass_mark ?? Math.ceil(questions.length * 0.7);
  const passed = score >= passMark;

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm">No questions generated</p>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="space-y-4">
        <div className={cn("rounded-xl p-6 text-center", passed ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200")}>
          {passed ? (
            <Trophy className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          ) : (
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          )}
          <p className={cn("text-xl font-bold", passed ? "text-emerald-700" : "text-red-700")}>
            {score} / {questions.length}
          </p>
          <p className={cn("text-sm mt-1", passed ? "text-emerald-600" : "text-red-600")}>
            {passed ? "Passed" : "Not yet passed"} — pass mark: {passMark}
          </p>
          {passed && quiz.pass_feedback && (
            <p className="text-sm text-emerald-700 mt-3 leading-relaxed">{quiz.pass_feedback}</p>
          )}
          {!passed && quiz.fail_feedback && (
            <p className="text-sm text-red-700 mt-3 leading-relaxed">{quiz.fail_feedback}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Try Again
          </Button>
          <Button onClick={onSave} disabled={saving || saved} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saved ? "Saved" : saving ? "Saving…" : "Save Quiz"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <div className="flex items-center gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn("h-1.5 w-6 rounded-full", {
                "bg-violet-500": i === currentIndex,
                "bg-emerald-400": i in submitted && selected[i] === questions[i].correct_answer,
                "bg-red-400": i in submitted && selected[i] !== questions[i].correct_answer,
                "bg-slate-200": !(i in submitted) && i !== currentIndex,
              })}
            />
          ))}
        </div>
        <span className="tabular-nums">{Object.keys(submitted).length} answered</span>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900 leading-relaxed">{current.question}</p>
          {current.difficulty && (
            <Badge className={cn("text-[10px] h-4 px-1.5 shrink-0",
              current.difficulty === "easy" ? "bg-emerald-100 text-emerald-700"
              : current.difficulty === "hard" ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
            )}>
              {current.difficulty}
            </Badge>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {(current.options ?? []).map((option) => {
          const isSelected = selectedAnswer === option.label;
          const isRight = option.label === current.correct_answer;
          const showResult = isAnswered;

          return (
            <button
              key={option.label}
              onClick={() => handleSelect(option.label)}
              disabled={isAnswered}
              className={cn(
                "w-full text-left rounded-xl border px-4 py-3 transition-all",
                !showResult && !isSelected && "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50",
                !showResult && isSelected && "border-violet-400 bg-violet-50",
                showResult && isRight && "border-emerald-400 bg-emerald-50",
                showResult && isSelected && !isRight && "border-red-400 bg-red-50",
                showResult && !isSelected && !isRight && "border-slate-200 bg-white opacity-60",
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border",
                  !showResult && isSelected ? "border-violet-500 bg-violet-500 text-white"
                  : showResult && isRight ? "border-emerald-500 bg-emerald-500 text-white"
                  : showResult && isSelected && !isRight ? "border-red-500 bg-red-500 text-white"
                  : "border-slate-300 text-slate-600"
                )}>
                  {option.label}
                </span>
                <span className="text-sm text-slate-800">{option.text}</span>
                {showResult && isRight && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto shrink-0" />}
                {showResult && isSelected && !isRight && <XCircle className="h-4 w-4 text-red-500 ml-auto shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation (after answer) */}
      {isAnswered && current.explanation && (
        <div className={cn("rounded-lg p-3 border", isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-1 text-slate-500">Explanation</p>
          <p className={cn("text-sm leading-relaxed", isCorrect ? "text-emerald-800" : "text-red-800")}>
            {current.explanation}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIndex === 0} className="gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <div className="flex gap-2">
          {!isAnswered ? (
            <Button size="sm" onClick={handleSubmitAnswer} disabled={!selectedAnswer} className="gap-1">
              Submit Answer
            </Button>
          ) : (
            <Button size="sm" onClick={handleNext} className="gap-1">
              {currentIndex < questions.length - 1 ? "Next" : "View Results"}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Saved quiz item ────────────────────────────────────────────────────────────
function SavedQuizItem({ resource }: { resource: { id: string; title: string; pathway?: LearningPathway; created_at: string; status: string } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:shadow-sm transition-shadow">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
        <HelpCircle className="h-4 w-4 text-amber-600" />
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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QuizzesPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [topic, setTopic] = useState("");
  const [pathway, setPathway] = useState<LearningPathway>("staff");
  const [numberOfQuestions, setNumberOfQuestions] = useState<"5" | "10" | "15">("10");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useGeneratedResources({ homeId: homeId });
  const createMutation = useCreateGeneratedResource();

  const quizzes = (data?.data ?? []).filter((r) => r.resource_type === "quiz");

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await api.post<{ data: { parsed?: QuizResult } }>(
        "/aria",
        {
          mode: "learning_quiz",
          style: pathway === "child" ? "child_friendly" : "professional_formal",
          source_content: `Topic: ${topic}\nNumber of questions: ${numberOfQuestions}\nPathway: ${pathway}`,
          page_context: "Learning Studio — Knowledge Quizzes",
          record_type: "quiz",
          user_role: "manager",
        }
      );
      setResult(res.data?.parsed ?? null);
    } catch {
      setResult({ quiz_title: "Error generating quiz", questions: [] });
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const title = result.quiz_title ?? topic;
      await createMutation.mutateAsync({
        home_id: homeId,
        resource_type: "quiz",
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
      title="Knowledge Quizzes"
      subtitle="Generate interactive knowledge quizzes with ARIA"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Knowledge Quizzes" subtitle="Oak House — Staff Knowledge Assessment" targetId="quizzes-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning — Knowledge Quizzes upload" />
        </div>
      }
    >
      <div id="quizzes-content" className="space-y-6 animate-fade-in max-w-3xl">

        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                <HelpCircle className="h-4 w-4 text-amber-600" />
              </div>
              Generate Quiz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Topic</label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Children's rights and legislation"
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
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Number of Questions</label>
                <Select value={numberOfQuestions} onValueChange={(v) => setNumberOfQuestions(v as "5" | "10" | "15")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={generate} disabled={generating || !topic.trim()} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "Generating Quiz…" : "Generate Quiz"}
            </Button>
          </CardContent>
        </Card>

        {/* Quiz player */}
        {result && (
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{result.quiz_title ?? "Knowledge Quiz"}</CardTitle>
                  {result.introduction && (
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{result.introduction}</p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {Array.isArray(result.questions) ? result.questions.length : 0} questions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <QuizPlayer quiz={result} onSave={save} saving={saving} saved={saved} />
            </CardContent>
          </Card>
        )}

        {/* Saved quizzes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Saved Quizzes</h3>
            <span className="text-xs text-slate-400">{quizzes.length} saved</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium">No quizzes saved yet</p>
              <p className="text-xs mt-1">Generate and save your first quiz above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quizzes.map((q) => (
                <SavedQuizItem key={q.id} resource={q} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
