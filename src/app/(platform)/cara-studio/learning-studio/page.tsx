"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — LEARNING STUDIO
//
// Generate, browse, and manage learning resources across 21+ formats: training,
// quizzes, flashcards, questionnaires, role-play scenarios, PACE language cards,
// quick reference cards, supervision packs, induction guides, and more.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BookOpen, Sparkles, FileText, HelpCircle, CreditCard,
  ClipboardCheck, Users, Brain, Eye, Mic, Video, Layout,
  Lightbulb, Search,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Demo resources ─────────────────────────────────────────────────────────

interface DemoResource {
  id: string; title: string; resource_type: string; type_label: string;
  target_audience: string; framework: string | null; status: string;
  use_count: number; created_at: string; description: string;
}

const DEMO_RESOURCES: DemoResource[] = [
  { id: "lr-1", title: "De-escalation Techniques — Trauma-Informed Approach", resource_type: "staff_training", type_label: "Staff Training", target_audience: "staff", framework: "Trauma-Informed", status: "published", use_count: 4, created_at: "2026-05-05T09:00:00Z", description: "Training session generated from recent incident patterns." },
  { id: "lr-2", title: "PACE Language — Quick Reference", resource_type: "quick_reference_card", type_label: "Quick Reference Card", target_audience: "staff", framework: "PACE", status: "published", use_count: 12, created_at: "2026-04-20T10:00:00Z", description: "Pocket card with PACE language alternatives for daily use." },
  { id: "lr-3", title: "Safeguarding Level 3 — Knowledge Check", resource_type: "quiz", type_label: "Knowledge Quiz", target_audience: "staff", framework: null, status: "published", use_count: 8, created_at: "2026-04-25T14:00:00Z", description: "Quick quiz on safeguarding responsibilities." },
  { id: "lr-4", title: "Recording Practice — What Good Looks Like", resource_type: "infographic", type_label: "Infographic", target_audience: "staff", framework: null, status: "draft", use_count: 0, created_at: "2026-05-10T11:00:00Z", description: "Visual guide to recording standards." },
  { id: "lr-5", title: "Handling Disclosures — Role Play", resource_type: "role_play_scenario", type_label: "Role-Play Scenario", target_audience: "staff", framework: "Safeguarding-Led", status: "published", use_count: 3, created_at: "2026-05-01T09:00:00Z", description: "Scenario-based training on receiving and responding to disclosures." },
  { id: "lr-6", title: "ARC Framework — Formulation Cards", resource_type: "arc_formulation_cards", type_label: "ARC Formulation Cards", target_audience: "staff", framework: "ARC", status: "published", use_count: 6, created_at: "2026-04-15T12:00:00Z", description: "Portable reference cards covering Attachment, Regulation, and Competency." },
  { id: "lr-7", title: "New Staff Induction — Therapeutic Approach", resource_type: "induction_guide", type_label: "Induction Guide", target_audience: "staff", framework: "Therapeutic Parenting", status: "published", use_count: 2, created_at: "2026-03-01T08:00:00Z", description: "Induction guide covering the home's therapeutic approach for new staff." },
  { id: "lr-8", title: "My Feelings Workbook", resource_type: "reflective_workbook", type_label: "Reflective Workbook", target_audience: "child", framework: "PACE", status: "published", use_count: 5, created_at: "2026-04-10T10:00:00Z", description: "Child-friendly workbook for exploring feelings." },
];

const RESOURCE_TYPE_GROUPS = [
  { group: "Training Sessions", types: ["staff_training", "role_play_scenario", "case_study_exercise"] },
  { group: "Knowledge Checks", types: ["quiz", "flashcards", "questionnaire", "competency_checklist"] },
  { group: "Therapeutic Tools", types: ["pace_language_alternatives", "arc_formulation_cards", "reflective_workbook"] },
  { group: "Quick Reference", types: ["quick_reference_card", "infographic", "poster", "policy_summary"] },
  { group: "Briefings & Packs", types: ["micro_learning", "video_briefing_script", "audio_briefing_script", "slide_deck", "supervision_prompt_pack", "team_meeting_pack", "induction_guide"] },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  staff_training: BookOpen, quiz: HelpCircle, flashcards: CreditCard, questionnaire: ClipboardCheck,
  infographic: Layout, competency_checklist: ClipboardCheck, role_play_scenario: Users,
  case_study_exercise: FileText, pace_language_alternatives: Brain, arc_formulation_cards: Brain,
  reflective_workbook: BookOpen, micro_learning: Lightbulb, video_briefing_script: Video,
  audio_briefing_script: Mic, slide_deck: Layout, poster: Layout, quick_reference_card: CreditCard,
  policy_summary: FileText, supervision_prompt_pack: ClipboardCheck, team_meeting_pack: Users,
  induction_guide: BookOpen,
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
};

// ══════════════════════════════════════════════════════════════════════════════

export default function LearningStudioPage() {
  const [resources] = useState(demoSeed(DEMO_RESOURCES));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = resources.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && r.resource_type !== typeFilter) return false;
    if (audienceFilter && r.target_audience !== audienceFilter) return false;
    return true;
  });

  const selected = resources.find((r) => r.id === selectedId);

  return (
    <PageShell title="Learning Studio" subtitle="Generate and manage learning resources">
      <div className="space-y-6 pb-12">

        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <BookOpen className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Learning Studio</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Generate training, quizzes, flashcards, role-play scenarios, reference cards, and 15+ other resource types — all built from practice evidence and shaped by therapeutic frameworks.
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--cs-navy)] hover:bg-[var(--cs-surface)] transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
              Generate New
            </button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{resources.length}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Total Resources</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-2xl font-bold text-emerald-700">{resources.filter((r) => r.status === "published").length}</p>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mt-1">Published</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{resources.reduce((sum, r) => sum + r.use_count, 0)}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Total Uses</p>
          </div>
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-4">
            <p className="text-2xl font-bold text-[var(--cs-navy)]">{new Set(resources.map((r) => r.resource_type)).size}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)] uppercase tracking-wide mt-1">Resource Types</p>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources..."
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white pl-9 pr-3 py-2 text-xs text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]" />
          </div>
          <select value={typeFilter ?? ""} onChange={(e) => setTypeFilter(e.target.value || null)}
            className="rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-xs text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]">
            <option value="">All Types</option>
            {RESOURCE_TYPE_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.types.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </optgroup>
            ))}
          </select>
          <div className="flex gap-1">
            {["staff", "child"].map((a) => (
              <button key={a} onClick={() => setAudienceFilter(audienceFilter === a ? null : a)}
                className={cn("rounded-full border px-3 py-1.5 text-[10px] font-medium transition-all",
                  audienceFilter === a ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]" : "bg-white text-[var(--cs-text-muted)] border-[var(--cs-border)] hover:border-[var(--cs-cara-gold-soft)]")}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Resource grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const Icon = TYPE_ICONS[r.resource_type] ?? FileText;
            return (
              <button key={r.id} onClick={() => setSelectedId(selectedId === r.id ? null : r.id)}
                className={cn("rounded-xl border bg-white p-4 text-left transition-all space-y-2",
                  selectedId === r.id ? "border-[var(--cs-cara-gold)] ring-1 ring-[var(--cs-cara-gold-soft)]" : "border-[var(--cs-border)] hover:border-[var(--cs-cara-gold-soft)]")}>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--cs-surface)]">
                    <Icon className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--cs-navy)] truncate">{r.title}</p>
                    <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{r.type_label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-[9px] border", STATUS_STYLES[r.status])}>{r.status}</Badge>
                  {r.framework && <Badge className="text-[9px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]">{r.framework}</Badge>}
                  <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">{r.use_count} uses</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Detail panel ───────────────────────────────────────────────── */}
        {selected && (
          <div className="rounded-xl border border-[var(--cs-border)] bg-white p-6 space-y-3">
            <h3 className="text-base font-bold text-[var(--cs-navy)]">{selected.title}</h3>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{selected.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={cn("text-[10px] border", STATUS_STYLES[selected.status])}>{selected.status}</Badge>
              <span className="text-[10px] text-[var(--cs-text-muted)]">Type: {selected.type_label}</span>
              <span className="text-[10px] text-[var(--cs-text-muted)]">Audience: {selected.target_audience}</span>
              {selected.framework && <span className="text-[10px] text-[var(--cs-text-muted)]">Framework: {selected.framework}</span>}
              <span className="text-[10px] text-[var(--cs-text-muted)]">Created: {new Date(selected.created_at).toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
