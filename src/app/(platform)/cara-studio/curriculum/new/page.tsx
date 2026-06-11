"use client";

// CARA STUDIO — /cara-studio/curriculum/new
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextInput, TextArea, Pills } from "@/components/cara-studio/studio-bits";

const WEEKS = ["4", "6", "8", "12"] as const;

export default function NewCurriculumPage() {
  const [childId, setChildId] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [concerns, setConcerns] = useState("");
  const [weeks, setWeeks] = useState<(typeof WEEKS)[number]>("8");

  return (
    <GeneratorPage
      title="Curriculum Builder"
      subtitle="A modular weekly pathway built from this child's needs, risks, strengths and goals — trust first, independence last"
      endpoint="/api/cara/curriculum"
      generateLabel="Build the learning pathway"
      buildBody={() => {
        if (!childId) return "Pick a child first.";
        return {
          childId,
          desiredOutcomes: outcomes.split("\n").map((s) => s.trim()).filter(Boolean),
          staffConcerns: concerns || undefined,
          timeframeWeeks: Number(weeks),
        };
      }}
    >
      <Labelled label="Child"><ChildPicker value={childId} onChange={setChildId} /></Labelled>
      <Labelled label="Desired outcomes (one per line, optional)"><TextArea value={outcomes} onChange={setOutcomes} rows={3} placeholder={"Safer free time\nOne trusted adult they'd actually go to"} /></Labelled>
      <Labelled label="Staff concerns (optional)"><TextInput value={concerns} onChange={setConcerns} placeholder="What's worrying the team?" /></Labelled>
      <Labelled label="Timeframe (weeks)"><Pills options={WEEKS} value={weeks} onChange={setWeeks} /></Labelled>
    </GeneratorPage>
  );
}
