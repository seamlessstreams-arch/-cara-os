"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Output Preview Component
//
// Renders the structured generation output with:
//   - Section-by-section display
//   - Markdown-like formatting
//   - Copy to clipboard
//   - Section type badges
//   - Metadata footer
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy, CheckCircle2, FileText, List, HelpCircle,
  BookOpen, Lightbulb, ClipboardCheck,
} from "lucide-react";
import type { GenerationOutput, GenerationSection } from "@/lib/aria-studio/types";

interface StudioOutputPreviewProps {
  output: GenerationOutput;
}

const SECTION_TYPE_ICONS: Record<string, React.ElementType> = {
  narrative: BookOpen,
  list: List,
  checklist: ClipboardCheck,
  prompt_questions: HelpCircle,
  activity: Lightbulb,
  guidance: FileText,
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  narrative: "Narrative",
  list: "Action List",
  checklist: "Checklist",
  prompt_questions: "Prompts / Questions",
  activity: "Activity",
  guidance: "Guidance",
};

export function StudioOutputPreview({ output }: StudioOutputPreviewProps) {
  const [copiedSection, setCopiedSection] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // ── Copy single section ───────────────────────────────────────────────────
  const copySection = async (section: GenerationSection, index: number) => {
    let text = `## ${section.heading}\n\n${section.content}`;
    if (section.items?.length) {
      text += "\n\n" + section.items.map((item) => `- ${item}`).join("\n");
    }
    await navigator.clipboard.writeText(text);
    setCopiedSection(index);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // ── Copy all content ──────────────────────────────────────────────────────
  const copyAll = async () => {
    const fullText = output.sections
      .map((s) => {
        let text = `## ${s.heading}\n\n${s.content}`;
        if (s.items?.length) {
          text += "\n\n" + (s.items ?? []).map((item) => `- ${item}`).join("\n");
        }
        return text;
      })
      .join("\n\n---\n\n");

    await navigator.clipboard.writeText(`# ${output.title}\n\n${fullText}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--cs-border)] px-5 py-3 bg-[var(--cs-surface)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--cs-navy)]">{output.title}</h3>
          {output.summary && (
            <p className="text-xs text-[var(--cs-text-muted)] mt-0.5 line-clamp-1">{output.summary}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAll}
          className="text-xs"
        >
          {copiedAll ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy All
            </>
          )}
        </Button>
      </div>

      {/* Sections */}
      <div className="divide-y divide-[var(--cs-border)]">
        {output.sections.map((section, i) => {
          const SectionIcon = SECTION_TYPE_ICONS[section.type] ?? FileText;
          return (
            <div key={i} className="p-5 group relative">
              {/* Section header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SectionIcon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                  <h4 className="text-sm font-semibold text-[var(--cs-navy)]">{section.heading}</h4>
                  <Badge className="text-[9px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
                    {SECTION_TYPE_LABELS[section.type] ?? section.type}
                  </Badge>
                </div>
                <button
                  onClick={() => copySection(section, i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]"
                  title="Copy section"
                >
                  {copiedSection === i ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Content */}
              {section.content && (
                <div className="text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {section.content.trim()}
                </div>
              )}

              {/* List items */}
              {section.items && section.items.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-sm text-[var(--cs-text-secondary)] flex items-start gap-2">
                      <span className="text-[var(--cs-aria-gold)] mt-1.5 shrink-0">&#8226;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Metadata footer */}
      {output.metadata && (
        <div className="border-t border-[var(--cs-border)] px-5 py-2.5 bg-[var(--cs-surface)] flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)]">
          <span>Model: {output.metadata.model}</span>
          <span>Type: {output.metadata.generationType}</span>
          <span>Generated: {new Date(output.metadata.generatedAt).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
