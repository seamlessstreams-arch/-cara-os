"use client";

// CARA STUDIO — /cara-studio/adapt  (SEND & communication adaptation)
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextArea, Pills } from "@/components/cara-studio/studio-bits";
import { ADAPTATION_NEEDS } from "@/lib/cara-studio/cara-adaptation-engine";

const FORMATS = ["text", "visual", "audio", "low_writing"] as const;

export default function AdaptPage() {
  const [childId, setChildId] = useState("");
  const [content, setContent] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("text");

  function toggleNeed(n: string) {
    setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));
  }

  return (
    <GeneratorPage
      title="Make This Easier for This Child"
      subtitle="Paste anything — a worksheet, a plan, a letter — and Cara adapts it for ADHD, autism, low literacy, anxiety, low trust and more"
      endpoint="/api/cara/adapt"
      generateLabel="Make this easier"
      buildBody={() => {
        if (content.trim().length < 5) return "Paste the content to adapt.";
        if (needs.length === 0) return "Tick at least one adaptation need.";
        return { childId: childId || undefined, originalContent: content, adaptationNeeds: needs, format };
      }}
    >
      <Labelled label="Child (optional — pulls their profile)"><ChildPicker value={childId} onChange={setChildId} allowNone /></Labelled>
      <Labelled label="Content to adapt"><TextArea value={content} onChange={setContent} rows={5} placeholder="Paste the original content here…" /></Labelled>
      <Labelled label="Adaptation needs (tick all that apply)">
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {ADAPTATION_NEEDS.map((n) => (
            <button key={n} type="button" onClick={() => toggleNeed(n)} className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${needs.includes(n) ? "border-[var(--cs-teal-strong)] bg-[var(--cs-teal-bg)] text-[var(--cs-navy)]" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]"}`}>
              {n.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </Labelled>
      <Labelled label="Output format"><Pills options={FORMATS} value={format} onChange={setFormat} labels={{ low_writing: "no writing" }} /></Labelled>
    </GeneratorPage>
  );
}
