"use client";

// CARA STUDIO — /cara-studio/debrief/new  (staff reflection)
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextArea, TextInput } from "@/components/cara-studio/studio-bits";

export default function NewDebriefPage() {
  const [childId, setChildId] = useState("");
  const [summary, setSummary] = useState("");
  const [actions, setActions] = useState("");
  const [presentation, setPresentation] = useState("");
  const [outcome, setOutcome] = useState("");
  const [feelings, setFeelings] = useState("");
  const [worked, setWorked] = useState("");
  const [didnt, setDidnt] = useState("");

  return (
    <GeneratorPage
      title="Staff Debrief & Reflection"
      subtitle="A no-blame reflection after a hard moment — what the child may have been communicating, what to keep, what to refine, and how to repair"
      endpoint="/api/cara/reflect"
      generateLabel="Build my debrief"
      buildBody={() => {
        if (summary.trim().length < 5) return "Describe the incident in a sentence or two.";
        return {
          childId: childId || undefined,
          incidentSummary: summary,
          staffActions: actions || undefined,
          childPresentation: presentation || undefined,
          outcome: outcome || undefined,
          staffFeelings: feelings || undefined,
          whatWorked: worked || undefined,
          whatDidNotWork: didnt || undefined,
        };
      }}
    >
      <Labelled label="Child involved (optional)"><ChildPicker value={childId} onChange={setChildId} allowNone /></Labelled>
      <Labelled label="What happened"><TextArea value={summary} onChange={setSummary} rows={3} /></Labelled>
      <Labelled label="What you did (optional)"><TextArea value={actions} onChange={setActions} rows={2} /></Labelled>
      <Labelled label="How the child presented (optional)"><TextInput value={presentation} onChange={setPresentation} /></Labelled>
      <Labelled label="How it ended (optional)"><TextInput value={outcome} onChange={setOutcome} /></Labelled>
      <Labelled label="How YOU are feeling (honest — this stays supportive)"><TextInput value={feelings} onChange={setFeelings} /></Labelled>
      <Labelled label="What worked (optional)"><TextInput value={worked} onChange={setWorked} /></Labelled>
      <Labelled label="What didn't (optional)"><TextInput value={didnt} onChange={setDidnt} /></Labelled>
    </GeneratorPage>
  );
}
