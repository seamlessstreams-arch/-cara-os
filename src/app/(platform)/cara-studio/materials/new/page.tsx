"use client";

// CARA STUDIO — /cara-studio/materials/new
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextInput, Pills } from "@/components/cara-studio/studio-bits";
import { CARA_MATERIAL_TYPES, type CaraMaterialType } from "@/lib/cara-studio/cara-types";

const DIFFICULTY = ["gentle", "standard", "stretch"] as const;

export default function NewMaterialPage() {
  const [childId, setChildId] = useState("");
  const [materialType, setMaterialType] = useState<CaraMaterialType>("visual_card");
  const [theme, setTheme] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY)[number]>("gentle");
  const [format, setFormat] = useState("");

  return (
    <GeneratorPage
      title="Interactive Materials"
      subtitle="Visual cards, social stories, scenario cards, decision trees, audio scripts and more — adapted to this child, with a no-writing version every time"
      endpoint="/api/cara/materials"
      generateLabel="Create this material"
      buildBody={() => {
        if (!childId) return "Pick a child first.";
        if (!theme.trim()) return "What's the material about?";
        return { childId, materialType, theme, difficulty, formatPreference: format || undefined };
      }}
    >
      <Labelled label="Child"><ChildPicker value={childId} onChange={setChildId} /></Labelled>
      <Labelled label="Material type"><Pills options={CARA_MATERIAL_TYPES} value={materialType} onChange={setMaterialType} /></Labelled>
      <Labelled label="Theme"><TextInput value={theme} onChange={setTheme} placeholder="e.g. Online safety" /></Labelled>
      <Labelled label="Difficulty"><Pills options={DIFFICULTY} value={difficulty} onChange={setDifficulty} /></Labelled>
      <Labelled label="Format preference (optional)"><TextInput value={format} onChange={setFormat} placeholder="visual / audio / no-writing" /></Labelled>
    </GeneratorPage>
  );
}
