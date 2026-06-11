"use client";

// CARA STUDIO — /cara-studio/incident/new  (incident → learning)
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextArea, TextInput } from "@/components/cara-studio/studio-bits";

export default function IncidentLearningPage() {
  const [childId, setChildId] = useState("");
  const [summary, setSummary] = useState("");
  const [staffResponse, setStaffResponse] = useState("");
  const [childResponse, setChildResponse] = useState("");
  const [desired, setDesired] = useState("");

  return (
    <GeneratorPage
      title="Turn an Incident into Learning"
      subtitle="A non-shaming reframe, the unmet need, a conversation plan and a 5-minute micro-session — without blame"
      endpoint="/api/cara/incident-learning"
      generateLabel="Turn this incident into learning"
      buildBody={() => {
        if (!childId) return "Pick a child first.";
        if (summary.trim().length < 5) return "Describe what happened in a sentence or two.";
        return { childId, incidentSummary: summary, staffResponse: staffResponse || undefined, childResponse: childResponse || undefined, desiredLearning: desired || undefined };
      }}
    >
      <Labelled label="Child"><ChildPicker value={childId} onChange={setChildId} /></Labelled>
      <Labelled label="What happened (factual, brief)"><TextArea value={summary} onChange={setSummary} rows={3} placeholder="e.g. Kicked the office door and smashed a plate after the family call was cancelled" /></Labelled>
      <Labelled label="What staff did (optional)"><TextArea value={staffResponse} onChange={setStaffResponse} rows={2} /></Labelled>
      <Labelled label="How the child responded (optional)"><TextArea value={childResponse} onChange={setChildResponse} rows={2} /></Labelled>
      <Labelled label="What you'd like them to take from it (optional)"><TextInput value={desired} onChange={setDesired} /></Labelled>
    </GeneratorPage>
  );
}
