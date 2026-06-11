"use client";

// CARA STUDIO — /cara-studio/conversation/new
import { useState } from "react";
import { GeneratorPage, ChildPicker, Labelled, TextInput, TextArea, Pills } from "@/components/cara-studio/studio-bits";

const LEVELS = ["low", "medium", "high"] as const;

export default function NewConversationPage() {
  const [childId, setChildId] = useState("");
  const [topic, setTopic] = useState("");
  const [reason, setReason] = useState("");
  const [risk, setRisk] = useState<(typeof LEVELS)[number]>("medium");
  const [outcome, setOutcome] = useState("");
  const [concern, setConcern] = useState("");
  const [context, setContext] = useState("");

  return (
    <GeneratorPage
      title="Conversation Coach"
      subtitle="PACE-informed openers, validations and curiosity questions — with branch plans for when it gets hard"
      endpoint="/api/cara/conversation"
      generateLabel="Help me plan this conversation"
      buildBody={() => {
        if (!childId) return "Pick a child first.";
        if (!topic.trim()) return "What's the conversation about?";
        if (!reason.trim()) return "Why now? One line.";
        return { childId, conversationTopic: topic, reasonForConversation: reason, emotionalRisk: risk, desiredOutcome: outcome || undefined, staffConcern: concern || undefined, recentContext: context || undefined };
      }}
    >
      <Labelled label="Child"><ChildPicker value={childId} onChange={setChildId} /></Labelled>
      <Labelled label="Topic"><TextInput value={topic} onChange={setTopic} placeholder="e.g. staying out late" /></Labelled>
      <Labelled label="Why now"><TextInput value={reason} onChange={setReason} placeholder="e.g. missing episode on Monday" /></Labelled>
      <Labelled label="Emotional risk"><Pills options={LEVELS} value={risk} onChange={setRisk} /></Labelled>
      <Labelled label="What would a good outcome look like? (optional)"><TextInput value={outcome} onChange={setOutcome} /></Labelled>
      <Labelled label="What are you worried about? (optional)"><TextArea value={concern} onChange={setConcern} rows={2} /></Labelled>
      <Labelled label="Recent context (optional)"><TextArea value={context} onChange={setContext} rows={2} /></Labelled>
    </GeneratorPage>
  );
}
