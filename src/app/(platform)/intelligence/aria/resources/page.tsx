"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA CHILD RESOURCES
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useChildResources,
  useCreateChildResource,
  useUpdateChildResource,
} from "@/hooks/use-intelligence";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { getYPName } from "@/lib/seed-data";
import type {
  ChildResourceType, ResourceWritingStyle, ChildResource, ChildResourceContent,
} from "@/types/extended";
import {
  FileText, Plus, Sparkles, Loader2, AlertTriangle,
  CheckCircle2, X, Star, Printer,
} from "lucide-react";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Constants ─────────────────────────────────────────────────────────────────

const RESOURCE_TYPES: { value: ChildResourceType; label: string; icon: string }[] = [
  { value: "safety_plan", label: "Safety Plan", icon: "🛡️" },
  { value: "feelings_card", label: "Feelings Card", icon: "💙" },
  { value: "worksheet", label: "Worksheet", icon: "📝" },
  { value: "reflection_card", label: "Reflection Card", icon: "🪞" },
  { value: "visual_safety_map", label: "Visual Safety Map", icon: "🗺️" },
  { value: "scenario_card", label: "Scenario Card", icon: "🎭" },
  { value: "conversation_card", label: "Conversation Card", icon: "💬" },
  { value: "social_story", label: "Social Story", icon: "📖" },
  { value: "step_by_step_guide", label: "Step-by-step Guide", icon: "📋" },
  { value: "explainer_sheet", label: "Explainer Sheet", icon: "ℹ️" },
  { value: "rights_sheet", label: "Rights Sheet", icon: "⚖️" },
  { value: "quiz", label: "Quiz", icon: "❓" },
  { value: "matching_activity", label: "Matching Activity", icon: "🔗" },
  { value: "scaling_question", label: "Scaling Question", icon: "📊" },
  { value: "mood_tracker", label: "Mood Tracker", icon: "📈" },
  { value: "coping_menu", label: "Coping Menu", icon: "🌟" },
  { value: "relationship_circle", label: "Relationship Circle", icon: "⭕" },
  { value: "trusted_adult_map", label: "Trusted Adult Map", icon: "🤝" },
  { value: "online_safety_checklist", label: "Online Safety Checklist", icon: "💻" },
  { value: "return_home_reflection", label: "Return Home Reflection", icon: "🏠" },
  { value: "restorative_repair", label: "Restorative Repair", icon: "🔧" },
  { value: "overwhelm_plan", label: "Overwhelm Plan", icon: "🌬️" },
  { value: "safe_people_list", label: "Safe People List", icon: "👥" },
  { value: "goals_sheet", label: "Goals Sheet", icon: "🎯" },
  { value: "independence_plan", label: "Independence Plan", icon: "🦋" },
  { value: "education_confidence", label: "Education Confidence", icon: "🎓" },
];

const WRITING_STYLES: { value: ResourceWritingStyle; label: string; description: string }[] = [
  { value: "child_friendly", label: "Child Friendly", description: "Simple, warm language for younger children" },
  { value: "teenage_conversational", label: "Teenage Conversational", description: "Relatable tone for teenagers" },
  { value: "simple_english", label: "Simple English", description: "Clear, straightforward language" },
  { value: "visual_learner", label: "Visual Learner", description: "Supports visual processing" },
  { value: "neurodiversity_friendly", label: "Neurodiversity Friendly", description: "Accessible for neurodiverse young people" },
  { value: "reflective", label: "Reflective", description: "Encourages reflection and self-awareness" },
  { value: "strengths_based", label: "Strengths Based", description: "Focuses on strengths and achievements" },
  { value: "writing_to_child", label: "Writing to Child", description: "Written directly to the young person" },
  { value: "restorative", label: "Restorative", description: "Restorative approach to harm and repair" },
  { value: "rights_based", label: "Rights Based", description: "Framed around rights and entitlements" },
];

const READING_LEVELS = ["basic", "standard", "advanced"];

const STATUS_COLOURS: Record<string, string> = {
  draft: "bg-slate-100 text-[var(--cs-text-secondary)]",
  reviewed: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-50 text-[var(--cs-text-muted)]",
};

const STARTER_TEMPLATES = [
  {
    type: "safety_plan" as ChildResourceType,
    title: "My Safety Plan",
    description: "A personalised plan to help the young person stay safe",
    icon: "🛡️",
    colour: "border-blue-200 bg-blue-50",
  },
  {
    type: "feelings_card" as ChildResourceType,
    title: "Understanding Big Feelings",
    description: "Helping young people understand and name their emotions",
    icon: "💙",
    colour: "border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]",
  },
  {
    type: "trusted_adult_map" as ChildResourceType,
    title: "People I Can Trust",
    description: "Identifying trusted adults and how to reach them",
    icon: "🤝",
    colour: "border-emerald-200 bg-emerald-50",
  },
];

// ── Resource card ─────────────────────────────────────────────────────────────

function ResourceCard({ resource, onApprove }: { resource: ChildResource; onApprove: (id: string) => void }) {
  const childName = getYPName(resource.child_id) || resource.child_id;
  const typeInfo = RESOURCE_TYPES.find((t) => t.value === resource.resource_type);
  return (
    <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-white p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{typeInfo?.icon ?? "📄"}</span>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_COLOURS[resource.status])}>
              {resource.status}
            </span>
            <span className="rounded-full bg-pink-100 text-pink-700 px-2 py-0.5 text-[10px]">
              {typeInfo?.label ?? resource.resource_type}
            </span>
          </div>
          <p className="text-sm font-semibold text-[var(--cs-navy)]">{resource.title}</p>
          <p className="text-xs text-[var(--cs-text-muted)]">{childName} · {resource.theme} · {formatDate(resource.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1">
          <FileText className="h-3 w-3" />Preview
        </Button>
        {resource.status !== "approved" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => onApprove(resource.id)}
          >
            <CheckCircle2 className="h-3 w-3" />Approve
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1">
          <Printer className="h-3 w-3" />Print
        </Button>
      </div>
    </div>
  );
}

// ── Content preview ───────────────────────────────────────────────────────────

function ContentPreview({ content }: { content: ChildResourceContent }) {
  return (
    <div className="space-y-4">
      {[
        { label: "Purpose", value: content.purpose },
        { label: "Child-friendly Explanation", value: content.child_friendly_explanation },
        { label: "Activity", value: content.activity },
        { label: "Reflection Questions", value: content.reflection_questions },
        { label: "Child Voice Space", value: content.child_voice_space },
        { label: "Staff Guidance", value: content.staff_guidance },
        { label: "Recording Prompt", value: content.recording_prompt },
        { label: "Follow-up Prompt", value: content.follow_up_prompt },
      ].map(({ label, value }) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return null;
        return (
          <div key={label} className="space-y-1.5">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{label}</p>
            {Array.isArray(value) ? (
              <ul className="space-y-1">
                {value.map((v: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--cs-navy)]">
                    <span className="text-[var(--cs-text-muted)] shrink-0">{i + 1}.</span>{v}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--cs-navy)] leading-relaxed">{value}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({
  onClose,
  initialChildId = "",
  initialResourceType = "safety_plan",
}: {
  onClose: () => void;
  initialChildId?: string;
  initialResourceType?: ChildResourceType;
}) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = (ypQuery.data?.data ?? []).map(yp => ({ id: yp.id, name: yp.preferred_name ?? yp.first_name }));
  const [childId, setChildId] = useState(initialChildId);
  const [resourceType, setResourceType] = useState<ChildResourceType>(initialResourceType);
  const [theme, setTheme] = useState("");
  const [ageRange, setAgeRange] = useState("13-15");
  const [readingLevel, setReadingLevel] = useState("standard");
  const [tone, setTone] = useState<ResourceWritingStyle>("child_friendly");
  const [convertSourceText, setConvertSourceText] = useState<string | null>(null);
  const [prefilling, setPrefilling] = useState(false);

  // Handle "Convert to Child-Friendly Version" — fetch source record and pre-fill theme
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const sourceType = p.get("source_type");
    const sid = p.get("source_id");
    if (sourceType !== "convert" || !sid) return;

    setResourceType("explainer_sheet");
    setTone("child_friendly");

    async function fetchSource() {
      setPrefilling(true);
      try {
        // Try incident first, then daily log
        let url = `/api/v1/incidents/${sid}`;
        let res = await fetch(url);
        if (!res.ok) {
          url = `/api/v1/daily-log/${sid}`;
          res = await fetch(url);
        }
        if (!res.ok) return;
        const json = await res.json();
        const record = json?.data as Record<string, unknown> | undefined;
        if (!record) return;

        const text = record.description
          ? `${record.description}${record.immediate_action ? "\n\n" + record.immediate_action : ""}`
          : String(record.content ?? "");
        setConvertSourceText(text);
        setTheme(`Converting professional record to child-friendly language — ${String(record.type ?? record.entry_type ?? "record").replace(/_/g, " ")}`);
      } catch {
        // silent
      } finally {
        setPrefilling(false);
      }
    }
    void fetchSource();
  }, []);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<ChildResourceContent | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const createResource = useCreateChildResource();

  async function handleGenerate() {
    if (!childId || !theme.trim()) {
      setError("Please select a young person and enter a theme.");
      return;
    }
    setGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const typeInfo = RESOURCE_TYPES.find((t) => t.value === resourceType);
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "child_resource_create",
          stream: false,
          source_content: [
            `Resource type: ${typeInfo?.label ?? resourceType}`,
            `Theme: ${theme}`,
            `Age range: ${ageRange}`,
            `Reading level: ${readingLevel}`,
            `Tone: ${tone}`,
            convertSourceText ? `\nSOURCE CONTENT TO CONVERT:\n${convertSourceText}` : "",
          ].filter(Boolean).join("\n"),
          prompt: convertSourceText
            ? `Convert the source content into a ${typeInfo?.label ?? resourceType} for a ${ageRange} year old child. Instructions: ${theme}. Tone: ${tone}. Reading level: ${readingLevel}.`
            : `Create a ${typeInfo?.label ?? resourceType} for a ${ageRange} year old child on the theme of ${theme} in ${tone} style. Reading level: ${readingLevel}.`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `ARIA returned ${res.status}`);
      }

      const json = await res.json();
      const parsed = json?.data?.parsed;
      if (!parsed || typeof parsed !== "object") throw new Error("ARIA did not return valid content");

      setGeneratedTitle((parsed as { title?: string }).title ?? `${typeInfo?.label} — ${theme}`);
      setGeneratedContent(parsed as ChildResourceContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(approve = false) {
    if (!generatedContent) return;
    setSaving(true);
    try {
      await createResource.mutateAsync({
        home_id: homeId,
        child_id: childId,
        title: generatedTitle,
        resource_type: resourceType,
        theme,
        age_range: ageRange,
        reading_level: readingLevel,
        tone,
        content: generatedContent,
        status: approve ? "approved" : "draft",
        created_by: currentUser?.id ?? "staff_darren",
        ...(approve ? { approved_by: currentUser?.id ?? "staff_darren", approved_at: new Date().toISOString() } : {}),
      });
      setSavedOk(true);
      setTimeout(onClose, 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-pink-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-pink-500" />
            Create Resource
          </CardTitle>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Child + type */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Young Person</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              <option value="">Select young person</option>
              {youngPeople.map((yp) => (
                <option key={yp.id} value={yp.id}>{yp.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Age Range</label>
            <input
              type="text"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              placeholder="e.g. 13-15, 16+"
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </div>

        {/* Resource type grid */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Resource Type</label>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 max-h-56 overflow-y-auto pr-1">
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setResourceType(t.value)}
                className={cn(
                  "rounded-xl border p-2.5 text-left transition-all",
                  resourceType === t.value ? "border-pink-400 bg-pink-50" : "border-[var(--cs-border)] bg-white hover:border-slate-300"
                )}
              >
                <span className="text-xl">{t.icon}</span>
                <div className="text-[11px] font-medium text-[var(--cs-navy)] mt-1 leading-tight">{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Convert source banner — shown when navigated from ARIAQuickActions "Child-Friendly Version" */}
        {prefilling && (
          <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2.5 text-xs text-pink-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            Loading source record to convert…
          </div>
        )}
        {convertSourceText && !prefilling && (
          <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-pink-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3 w-3" />Source record to convert
            </p>
            <p className="text-xs text-[var(--cs-text-secondary)] line-clamp-4 leading-relaxed italic">{convertSourceText}</p>
            <p className="text-[10px] text-pink-600">
              ARIA will convert this into child-friendly language. You can edit the theme below to guide the style.
            </p>
          </div>
        )}

        {/* Theme + reading level */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
              {convertSourceText ? "Theme / Conversion Instructions" : "Theme"}
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={convertSourceText ? "e.g. explain what happened in simple words for a 14 year old" : "e.g. staying safe online, emotions"}
              className="w-full rounded-lg border border-[var(--cs-border)] bg-white px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Reading Level</label>
            <div className="flex gap-1.5">
              {READING_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setReadingLevel(l)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                    readingLevel === l ? "border-pink-400 bg-pink-100 text-pink-800" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Writing style */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--cs-text-secondary)]">Writing Style</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {WRITING_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setTone(s.value)}
                className={cn(
                  "rounded-xl border p-2.5 text-left transition-all",
                  tone === s.value ? "border-pink-400 bg-pink-50" : "border-[var(--cs-border)] bg-white hover:border-slate-300"
                )}
              >
                <div className="text-[11px] font-semibold text-[var(--cs-navy)]">{s.label}</div>
                <div className="text-[10px] text-[var(--cs-text-muted)]">{s.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white gap-2"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating Resource…</>
          ) : (
            <><Sparkles className="h-4 w-4" />Generate Resource</>
          )}
        </Button>

        {/* Preview */}
        {generatedContent && (
          <div className="border-t border-[var(--cs-border-subtle)] pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-semibold text-[var(--cs-navy)]">{generatedTitle}</span>
              <span className="rounded-full bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] px-2 py-0.5 text-[10px]">AI-generated</span>
            </div>
            <ContentPreview content={generatedContent} />
            <div className="flex items-center gap-3 pt-2">
              {savedOk ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="h-4 w-4" />Saved successfully
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve Resource
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChildResourcesPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [paramChildId, setParamChildId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [starterChild, setStarterChild] = useState<{ id: string; type: ChildResourceType } | null>(null);

  // Pre-fill from query params when navigated from a record's ARIA quick-actions
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get("child_id") ?? "";
    if (c) {
      setParamChildId(c);
      setShowForm(true);
    }
  }, []);
  const { data, isLoading } = useChildResources({ homeId });
  const updateResource = useUpdateChildResource();
  const resources: ChildResource[] = useMemo(() => data?.data ?? [], [data]);

  function handleApprove(id: string) {
    updateResource.mutate({
      id,
      status: "approved",
      approved_by: currentUser?.id ?? "staff_darren",
      approved_at: new Date().toISOString(),
    });
  }

  // Group by child
  const byChild = useMemo(() => {
    const groups: Record<string, ChildResource[]> = {};
    for (const r of resources) {
      if (!groups[r.child_id]) groups[r.child_id] = [];
      groups[r.child_id].push(r);
    }
    return groups;
  }, [resources]);

  return (
    <PageShell
      title="Child Resources"
      subtitle="Create child-friendly resources and worksheets"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <SmartUploadButton variant="inline" label="Upload Resource" uploadContext="ARIA Intelligence — child resource or worksheet document upload" />
          <Button onClick={() => setShowForm(true)} className="bg-pink-600 hover:bg-pink-700 text-white gap-2 h-9">
            <Plus className="h-4 w-4" />Create Resource
          </Button>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Create form */}
        {showForm && (
          <CreateForm
            onClose={() => { setShowForm(false); setStarterChild(null); }}
            initialChildId={starterChild?.id ?? paramChildId}
            initialResourceType={starterChild?.type ?? "safety_plan"}
          />
        )}

        {/* Starter templates */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />Starter Templates
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {STARTER_TEMPLATES.map((t) => (
              <div key={t.type} className={cn("rounded-2xl border p-4 space-y-3", t.colour)}>
                <span className="text-3xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--cs-navy)]">{t.title}</p>
                  <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">{t.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 text-xs gap-1"
                  onClick={() => setShowForm(true)}
                >
                  <Sparkles className="h-3 w-3" />Generate for Child
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Resource list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-pink-500" />
              All Resources
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-[var(--cs-text-secondary)]">{resources.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <FileText className="h-10 w-10 text-slate-200" />
                <p className="text-sm text-[var(--cs-text-muted)]">No resources created yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(byChild).map(([cid, childResources]) => {
                  const childName = getYPName(cid) || cid;
                  return (
                    <div key={cid} className="space-y-2">
                      <p className="text-xs font-semibold text-[var(--cs-text-secondary)] flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-pink-400 inline-block" />
                        {childName}
                      </p>
                      <div className="space-y-2">
                        {childResources.map((r) => (
                          <ResourceCard key={r.id} resource={r} onApprove={handleApprove} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
