"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Practice Reasoning panel (the brain, made visible).
// Renders reasonOverChild() output: noticing / meaning / what the child may be
// communicating / risks / strengths / competing explanations / options / next
// steps / how we'll know — every finding with its confidence — plus the
// uncertainty register and the LLM gatekeeper status. Cara Calm styling.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Eye,
  Lightbulb,
  MessageCircleHeart,
  ShieldAlert,
  Sparkles,
  Scale,
  ListChecks,
  Target,
  Sparkle,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfidencePill } from "./confidence-pill";
import { UncertaintyRegisterPanel } from "./uncertainty-register-panel";
import type { PracticeReasoning, ReasoningFinding } from "@/lib/cara-reasoning/types";

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-[var(--cs-teal,#0d9488)]" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FindingList({ findings }: { findings: ReasoningFinding[] }) {
  if (!findings.length) return null;
  return (
    <div className="divide-y divide-[var(--cs-border-subtle)]">
      {findings.map((f, i) => (
        <div key={i} className="flex items-start justify-between gap-3 py-2">
          <div className="min-w-0">
            <p className="text-sm text-[var(--cs-text)]">{f.statement}</p>
            <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">{f.basis}</p>
          </div>
          <ConfidencePill level={f.confidence} short />
        </div>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="text-sm leading-relaxed text-[var(--cs-text)]">
          {t}
        </li>
      ))}
    </ul>
  );
}

export function PracticeReasoningPanel({ reasoning }: { reasoning: PracticeReasoning }) {
  const r = reasoning;
  return (
    <div className="space-y-4">
      {/* Header / confidence + LLM gate */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--cs-navy)]">Overall confidence in this reasoning</span>
            <ConfidencePill level={r.overallConfidence} />
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--cs-text-muted)]">
            <Cpu className="h-3.5 w-3.5 text-[var(--cs-teal,#0d9488)]" />
            {r.llmRecommended ? "Reflective formulation suggested" : "Deterministic — no model call needed"}
            <span className="text-[var(--cs-text-muted)]">·</span>
            <span>{r.llmGate.allowed ? "model call permitted" : "model call withheld"}</span>
          </div>
        </CardContent>
      </Card>

      {r.llmRecommended && (
        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
          <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <p className="text-sm text-sky-900">
            {r.llmRecommendedFor} <span className="text-sky-700">({r.llmGate.reason})</span>
          </p>
        </div>
      )}

      <SectionCard icon={Eye} title="What we're noticing" description="Observations drawn from the records, each with its confidence and basis.">
        <FindingList findings={r.noticing} />
      </SectionCard>

      <SectionCard icon={Lightbulb} title="What it might mean" description="Cautious interpretation — held lightly, tied to evidence.">
        <FindingList findings={r.meaning} />
      </SectionCard>

      <SectionCard icon={MessageCircleHeart} title="What the child may be communicating" description="Behaviour as communication — to explore with the child, not to assume.">
        <Bullets items={r.childMayBeCommunicating} />
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard icon={ShieldAlert} title="Risks">
          <FindingList findings={r.risks} />
        </SectionCard>
        <SectionCard icon={Sparkles} title="Strengths">
          <FindingList findings={r.strengths} />
        </SectionCard>
      </div>

      <SectionCard icon={Scale} title="Competing explanations" description="More than one explanation is usually possible — hold both until clearer.">
        <Bullets items={r.competingExplanations} />
      </SectionCard>

      <SectionCard icon={ListChecks} title="Options & next steps" description="What could happen, and the concrete next actions.">
        {r.options.length > 0 && (
          <div className="mb-3 divide-y divide-[var(--cs-border-subtle)]">
            {r.options.map((o, i) => (
              <div key={i} className="py-2">
                <p className="text-sm font-medium text-[var(--cs-navy)]">{o.option}</p>
                <p className="mt-0.5 text-xs text-[var(--cs-text-muted)]">{o.rationale}</p>
              </div>
            ))}
          </div>
        )}
        <ul className="space-y-2">
          {r.nextSteps.map((s, i) => (
            <li key={i} className="rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3">
              <p className="text-sm text-[var(--cs-text)]">{s.action}</p>
              <p className="mt-1 text-xs text-[var(--cs-text-muted)]">
                Responsible: {s.responsibleRole.replace(/_/g, " ")} · By: {s.timescale}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard icon={Target} title="How we'll know it worked" description="Measures of success — so we can monitor and adapt.">
        <Bullets items={r.howWeWillKnow} />
      </SectionCard>

      <SectionCard icon={Scale} title="Uncertainty register" description="The boundary of what we actually know — known, unknown and missing.">
        <UncertaintyRegisterPanel items={r.uncertaintyRegister} />
      </SectionCard>

      <p className="px-1 text-xs leading-relaxed text-[var(--cs-text-muted)]">{r.disclaimer}</p>
    </div>
  );
}
