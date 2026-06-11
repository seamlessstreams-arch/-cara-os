"use client";

// CARA STUDIO — /cara-studio/session/new
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextInput, Pills } from "@/components/cara-studio/studio-bits";
import { CARA_SESSION_THEMES } from "@/lib/cara-studio/cara-prompt-library";

const LEVELS = ["low", "medium", "high"] as const;
const DURATIONS = [5, 10, 20, 45] as const;

export default function NewSessionPage() {
  const [childId, setChildId] = useState("");
  const [theme, setTheme] = useState("");
  const [aim, setAim] = useState("");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>(20);
  const [readiness, setReadiness] = useState<(typeof LEVELS)[number]>("medium");
  const [intensity, setIntensity] = useState<(typeof LEVELS)[number]>("low");
  const [confidence, setConfidence] = useState<(typeof LEVELS)[number]>("medium");
  const [activity, setActivity] = useState("");

  return (
    <GeneratorPage
      title="Session Planner"
      subtitle="A structured, emotionally safe session adapted to this child — ready to use on shift"
      endpoint="/api/cara/session-plan"
      generateLabel="Help me plan this session"
      buildBody={() => {
        if (!childId) return "Pick a child first.";
        if (!theme.trim()) return "Choose or type a theme.";
        if (!aim.trim()) return "Say in one line what you want this session to do.";
        return { childId, theme, aim, durationMinutes: duration, childReadiness: readiness, emotionalIntensity: intensity, staffConfidence: confidence, preferredActivityType: activity || undefined };
      }}
    >
      <Labelled label="Child"><ChildPicker value={childId} onChange={setChildId} /></Labelled>
      <Labelled label="Theme (pick or type your own)">
        <TextInput value={theme} onChange={setTheme} placeholder="e.g. Trusting adults" />
        <div className="mt-1.5 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          {CARA_SESSION_THEMES.slice(0, 16).map((t) => (
            <button key={t} type="button" onClick={() => setTheme(t)} className="rounded-full border border-[var(--cs-border)] bg-[var(--cs-bg)] px-2 py-0.5 text-[10px] text-[var(--cs-text-secondary)] hover:bg-white">{t}</button>
          ))}
        </div>
      </Labelled>
      <Labelled label="Aim (one line)"><TextInput value={aim} onChange={setAim} placeholder="What should this session do?" /></Labelled>
      <Labelled label="Duration"><Pills options={DURATIONS.map(String)} value={String(duration)} onChange={(v) => setDuration(Number(v) as (typeof DURATIONS)[number])} labels={{ "5": "5 min micro", "10": "10 min chat", "20": "20 min key work", "45": "45 min planned" }} /></Labelled>
      <Labelled label="Child readiness"><Pills options={LEVELS} value={readiness} onChange={setReadiness} /></Labelled>
      <Labelled label="Emotional intensity"><Pills options={LEVELS} value={intensity} onChange={setIntensity} /></Labelled>
      <Labelled label="Your confidence on this topic (honest!)"><Pills options={LEVELS} value={confidence} onChange={setConfidence} /></Labelled>
      <Labelled label="Preferred format (optional)"><TextInput value={activity} onChange={setActivity} placeholder="walk / draw / cards / audio / practical" /></Labelled>
    </GeneratorPage>
  );
}
