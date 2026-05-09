"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA LEARNING STUDIO HUB
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useLearningProjects, useGeneratedResources, useTrainingNeeds,
  useKnowledgeGaps, useResourceLibrary,
} from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import {
  BookOpen, Layers, BrainCircuit, HelpCircle, ClipboardList,
  Library, Sparkles, ChevronRight, AlertTriangle, Users, GraduationCap,
  FileText, Zap,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";


const FEATURES = [
  {
    href: "/learning/training-needs",
    title: "Training Needs",
    description: "Core intelligence loop — ARIA-identified and manual training needs",
    icon: AlertTriangle,
    colour: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    badgeKey: "urgent",
  },
  {
    href: "/learning/resources",
    title: "Resource Generator",
    description: "Generate workshops, guidance notes, flashcards, and session plans",
    icon: Sparkles,
    colour: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    href: "/learning/workshops",
    title: "Workshop Planner",
    description: "Full workshop plans with activities, facilitator notes, and resources",
    icon: Users,
    colour: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    href: "/learning/flashcards",
    title: "Flashcard Sets",
    description: "Knowledge reinforcement flashcard sets for staff and children",
    icon: Zap,
    colour: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    href: "/learning/quizzes",
    title: "Knowledge Quizzes",
    description: "Assessment quizzes with scoring and explanations",
    icon: HelpCircle,
    colour: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    href: "/learning/curriculum",
    title: "Curriculum Builder",
    description: "Structured multi-module learning pathways for staff or children",
    icon: GraduationCap,
    colour: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    href: "/learning/knowledge-gaps",
    title: "Knowledge Gaps",
    description: "Track and address identified gaps in staff knowledge",
    icon: BrainCircuit,
    colour: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    href: "/learning/guidance",
    title: "Guidance Notes",
    description: "ARIA-generated professional practice guidance for staff or children",
    icon: FileText,
    colour: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    href: "/learning/library",
    title: "Resource Library",
    description: "Browse, search and manage all approved learning resources",
    icon: Library,
    colour: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-100",
  },
];

function StatChip({ label, value, colour }: { label: string; value: number; colour: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 text-center">
      <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function LearningHubPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { data: projectsData } = useLearningProjects({ homeId: homeId });
  const { data: resourcesData } = useGeneratedResources({ homeId: homeId });
  const { data: trainingData } = useTrainingNeeds({ homeId: homeId });
  const { data: gapsData } = useKnowledgeGaps({ homeId: homeId });
  const { data: libraryData } = useResourceLibrary({ homeId: homeId });

  const activeProjects = (projectsData?.data ?? []).filter((p) => p.status === "active").length;
  const urgentNeeds = (trainingData?.data ?? []).filter((n) => n.priority === "urgent" && !["completed","no_action"].includes(n.status)).length;
  const totalResources = (resourcesData?.data ?? []).length;
  const openGaps = (gapsData?.data ?? []).filter((g) => g.status === "open").length;
  const libraryCount = (libraryData?.data ?? []).length;

  return (
    <PageShell
      title="Learning Studio"
      subtitle="AI-powered learning and development for staff and children"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Learning Hub" subtitle="Oak House — Staff Learning & Development" targetId="learning-content" />
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="Learning Studio — training resource or certificate upload" />
        </div>
      }
    >
      <div id="learning-content" className="space-y-6 animate-fade-in">

        {urgentNeeds > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              {urgentNeeds} urgent training need{urgentNeeds !== 1 ? "s" : ""} require action.
            </p>
            <Link href="/learning/training-needs" className="ml-auto shrink-0 text-xs font-semibold text-red-700 underline hover:text-red-900">
              Review Now →
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ARIA Learning Studio</h2>
              <p className="text-sm text-slate-300">Intelligent learning design for residential care</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Generate professional learning resources for staff and children — from workshops and flashcards to full curricula.
            ARIA identifies training needs from your operational data and closes the loop from governance to learning.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full bg-teal-600/40 px-3 py-1 text-xs font-medium text-teal-200">Staff Pathway</span>
            <span className="rounded-full bg-blue-600/30 px-3 py-1 text-xs font-medium text-blue-200">Child Pathway</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">Mixed Pathway</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-5">
          <StatChip label="Active Projects" value={activeProjects} colour="text-teal-700" />
          <StatChip label="Urgent Needs" value={urgentNeeds} colour={urgentNeeds > 0 ? "text-red-700" : "text-emerald-700"} />
          <StatChip label="Resources" value={totalResources} colour="text-violet-700" />
          <StatChip label="Knowledge Gaps" value={openGaps} colour={openGaps > 0 ? "text-orange-700" : "text-emerald-700"} />
          <StatChip label="Library" value={libraryCount} colour="text-slate-700" />
        </div>

        {/* The loop explanation */}
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <p className="text-sm font-semibold text-teal-900">The Training Intelligence Loop</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-teal-800">
            {[
              "RI identifies risk",
              "→ Training Need created",
              "→ ARIA generates resource",
              "→ Manager assigns to staff",
              "→ Completion recorded",
              "→ Evidence feeds Reg 45",
              "→ Loop closes",
            ].map((step, i) => (
              <span key={i} className={cn("rounded-full px-2 py-0.5", step.startsWith("→") ? "text-teal-600" : "bg-white border border-teal-200 font-medium")}>
                {step}
              </span>
            ))}
          </div>
          <p className="text-xs text-teal-700">
            Training needs can be identified automatically by ARIA from incidents, supervision records, and RI alerts — or added manually.
          </p>
        </div>

        {/* Feature grid */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-4">All Learning Studio Tools</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.href} href={feature.href} className="group">
                  <Card className={cn("border transition-all hover:shadow-md hover:-translate-y-0.5 h-full", feature.border)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", feature.bg)}>
                          <Icon className={cn("h-4.5 w-4.5", feature.colour)} style={{ width: "1.125rem", height: "1.125rem" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-900">{feature.title}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {feature.badgeKey === "urgent" && urgentNeeds > 0 && (
                                <Badge variant="destructive" className="text-[10px] h-4 px-1.5">{urgentNeeds}</Badge>
                              )}
                              <ChevronRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
