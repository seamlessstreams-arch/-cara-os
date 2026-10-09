"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — LEARNING PROFILE EDITOR
// Edit how a child learns: needs, styles, triggers, calming strategies, risk
// themes. Saves via PUT /api/cara/profile/[childId] (attributed + audited);
// every generator picks the changes up on the next generation.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Brain, AlertTriangle, Sparkles } from "lucide-react";
import type { CaraChildLearningProfile, CaraLearningStyle } from "@/lib/cara-studio/cara-types";
import { Labelled, TextInput, TextArea } from "@/components/cara-studio/studio-bits";

const STYLE_KEYS: (keyof CaraLearningStyle)[] = [
  "visual", "audio", "practical", "movement_based", "conversation_based", "creative", "low_literacy", "short_bursts",
];

const EMPTY_STYLE: CaraLearningStyle = {
  visual: false, audio: false, practical: false, movement_based: false,
  conversation_based: false, creative: false, low_literacy: false, short_bursts: false,
};

type Draft = {
  age: string;
  communication_needs: string; send_needs: string; attention_profile: string;
  sensory_profile: string; emotional_triggers: string; calming_strategies: string;
  trauma_considerations: string; cultural_identity_notes: string; literacy_level: string;
  preferred_activities: string; avoided_topics: string; trusted_adults: string;
  known_strengths: string; current_goals: string; developmental_age_notes: string;
  risk_themes: string; learning_style: CaraLearningStyle;
};

function toDraft(p: CaraChildLearningProfile | null): Draft {
  return {
    age: p?.age != null ? String(p.age) : "",
    communication_needs: p?.communication_needs ?? "",
    send_needs: p?.send_needs ?? "",
    attention_profile: p?.attention_profile ?? "",
    sensory_profile: p?.sensory_profile ?? "",
    emotional_triggers: p?.emotional_triggers ?? "",
    calming_strategies: p?.calming_strategies ?? "",
    trauma_considerations: p?.trauma_considerations ?? "",
    cultural_identity_notes: p?.cultural_identity_notes ?? "",
    literacy_level: p?.literacy_level ?? "",
    preferred_activities: p?.preferred_activities ?? "",
    avoided_topics: p?.avoided_topics ?? "",
    trusted_adults: p?.trusted_adults ?? "",
    known_strengths: p?.known_strengths ?? "",
    current_goals: p?.current_goals ?? "",
    developmental_age_notes: p?.developmental_age_notes ?? "",
    risk_themes: (p?.risk_themes ?? []).join(", "),
    learning_style: p?.learning_style ?? { ...EMPTY_STYLE },
  };
}

export function ProfileEditor({ childId, profile, childName }: { childId: string; profile: CaraChildLearningProfile | null; childName: string }) {
  const qc = useQueryClient();
  const [d, setD] = useState<Draft>(() => toDraft(profile));
  const set = (k: keyof Draft) => (v: string) => setD((cur) => ({ ...cur, [k]: v }));
  const [draftNote, setDraftNote] = useState<string[] | null>(null);

  // Draft from records: Cara proposes values for the fields it can evidence,
  // filling ONLY empty fields (never overwriting what staff have typed). Each
  // applied field is listed with its source; clinical fields are never drafted.
  type DraftField = { value: unknown; source: string };
  const autodraft = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cara/profile/${childId}/draft`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't draft from records");
      return (json.data?.draft ?? {}) as Record<string, DraftField | undefined>;
    },
    onSuccess: (draft) => {
      const applied: string[] = [];
      const next = { ...d };
      type StrKey = "age" | "risk_themes" | "emotional_triggers" | "calming_strategies";
      const put = (key: StrKey, value: string, label: string, source: string) => {
        if (value && !d[key].trim()) {
          next[key] = value;
          applied.push(`${label} — ${source.toLowerCase()}`);
        }
      };
      if (draft.age) put("age", String(draft.age.value), "Age", draft.age.source);
      if (draft.risk_themes) put("risk_themes", (draft.risk_themes.value as string[]).join(", "), "Risk themes", draft.risk_themes.source);
      if (draft.emotional_triggers) put("emotional_triggers", String(draft.emotional_triggers.value), "Known triggers", draft.emotional_triggers.source);
      if (draft.calming_strategies) put("calming_strategies", String(draft.calming_strategies.value), "What calms", draft.calming_strategies.source);
      setD(next);
      setDraftNote(applied);
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        age: d.age.trim() ? Number(d.age) : null,
        developmental_age_notes: d.developmental_age_notes || null,
        communication_needs: d.communication_needs || null,
        send_needs: d.send_needs || null,
        learning_style: d.learning_style,
        attention_profile: d.attention_profile || null,
        sensory_profile: d.sensory_profile || null,
        emotional_triggers: d.emotional_triggers || null,
        calming_strategies: d.calming_strategies || null,
        trauma_considerations: d.trauma_considerations || null,
        cultural_identity_notes: d.cultural_identity_notes || null,
        literacy_level: d.literacy_level || null,
        preferred_activities: d.preferred_activities || null,
        avoided_topics: d.avoided_topics || null,
        trusted_adults: d.trusted_adults || null,
        known_strengths: d.known_strengths || null,
        current_goals: d.current_goals || null,
        risk_themes: d.risk_themes.split(",").map((s) => s.trim()).filter(Boolean),
        review_notes: null,
      };
      const res = await fetch(`/api/cara/profile/${childId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't save the profile");
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cara-child", childId] }),
  });

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 shadow-[var(--cs-shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--cs-navy)]"><Brain className="h-4 w-4 text-[var(--cs-teal-strong)]" /> How {childName} learns — editable, audited</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => autodraft.mutate()} disabled={autodraft.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-teal-strong)] bg-[var(--cs-teal-bg)] px-3.5 py-2 text-xs font-bold text-[var(--cs-navy)] hover:bg-[var(--cs-teal-bg)]/70 disabled:opacity-60">
            <Sparkles className="h-3.5 w-3.5" /> {autodraft.isPending ? "Reading records…" : "Draft from records"}
          </button>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cs-navy)] px-3.5 py-2 text-xs font-bold text-white hover:bg-[var(--cs-navy-soft)] disabled:opacity-60">
            <Save className="h-3.5 w-3.5" /> {save.isPending ? "Saving…" : save.isSuccess ? "Saved" : "Save profile"}
          </button>
        </div>
      </div>
      {save.isError && <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {save.error.message}</p>}
      {autodraft.isError && <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600"><AlertTriangle className="h-3.5 w-3.5" /> {autodraft.error.message}</p>}
      {draftNote && (
        <div className="mt-3 rounded-xl border border-[var(--cs-teal-strong)]/40 bg-[var(--cs-teal-bg)] p-3 text-xs text-[var(--cs-navy)]">
          {draftNote.length ? (
            <>
              <p className="font-bold">Drafted from {childName}&apos;s records — please review, then Save:</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                {draftNote.map((line) => <li key={line}>{line}</li>)}
              </ul>
              <p className="mt-2 text-[11px] text-[var(--cs-text-muted)]">Only empty fields were filled. SEND, learning style, literacy, sensory and communication needs are left for your professional judgement — Cara won&apos;t infer those.</p>
            </>
          ) : (
            <p>Cara found nothing in the records to add that the profile doesn&apos;t already have. The clinical fields are yours to complete.</p>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Labelled label="Age"><TextInput value={d.age} onChange={set("age")} placeholder="e.g. 14" /></Labelled>
        <Labelled label="Developmental notes"><TextInput value={d.developmental_age_notes} onChange={set("developmental_age_notes")} /></Labelled>
        <Labelled label="Communication needs"><TextArea rows={2} value={d.communication_needs} onChange={set("communication_needs")} /></Labelled>
        <Labelled label="SEND needs"><TextArea rows={2} value={d.send_needs} onChange={set("send_needs")} /></Labelled>
        <Labelled label="Attention profile"><TextInput value={d.attention_profile} onChange={set("attention_profile")} placeholder="e.g. 5–10 minute bursts" /></Labelled>
        <Labelled label="Sensory profile"><TextInput value={d.sensory_profile} onChange={set("sensory_profile")} /></Labelled>
        <Labelled label="Known triggers"><TextArea rows={2} value={d.emotional_triggers} onChange={set("emotional_triggers")} /></Labelled>
        <Labelled label="What calms"><TextArea rows={2} value={d.calming_strategies} onChange={set("calming_strategies")} /></Labelled>
        <Labelled label="Trauma considerations"><TextArea rows={2} value={d.trauma_considerations} onChange={set("trauma_considerations")} /></Labelled>
        <Labelled label="Culture & identity"><TextInput value={d.cultural_identity_notes} onChange={set("cultural_identity_notes")} /></Labelled>
        <Labelled label="Literacy"><TextInput value={d.literacy_level} onChange={set("literacy_level")} /></Labelled>
        <Labelled label="Enjoys"><TextInput value={d.preferred_activities} onChange={set("preferred_activities")} /></Labelled>
        <Labelled label="Avoid (for now)"><TextInput value={d.avoided_topics} onChange={set("avoided_topics")} /></Labelled>
        <Labelled label="Trusted adults"><TextInput value={d.trusted_adults} onChange={set("trusted_adults")} /></Labelled>
        <Labelled label="Strengths"><TextArea rows={2} value={d.known_strengths} onChange={set("known_strengths")} /></Labelled>
        <Labelled label="Current goals"><TextArea rows={2} value={d.current_goals} onChange={set("current_goals")} /></Labelled>
        <Labelled label="Risk themes (comma-separated)"><TextInput value={d.risk_themes} onChange={set("risk_themes")} placeholder="e.g. missing, online" /></Labelled>
      </div>

      <p className="mt-4 text-xs font-semibold text-[var(--cs-text-secondary)]">Learning style</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {STYLE_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setD((cur) => ({ ...cur, learning_style: { ...cur.learning_style, [k]: !cur.learning_style[k] } }))}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${d.learning_style[k] ? "border-[var(--cs-teal-strong)] bg-[var(--cs-teal-bg)] text-[var(--cs-navy)]" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"}`}
          >
            {k.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[var(--cs-text-muted)]">
        Changes are attributed to you and audit-logged. Every Cara generation for {childName} uses this profile from the moment you save.
      </p>
    </div>
  );
}
