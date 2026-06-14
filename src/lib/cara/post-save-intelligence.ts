// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — POST-SAVE INTELLIGENCE HOOK
//
// Called after every major form submission (incident, daily log, key work,
// missing episode, restraint, complaint, safeguarding concern, management
// oversight). Creates golden thread entries and detects child voice.
//
// This is the "one-entry-multiple-output" integration point.
// ══════════════════════════════════════════════════════════════════════════════

import { createGoldenThreadEvent } from "./golden-thread";
import { detectChildVoice, createChildVoiceSegment } from "./child-voice";

export async function runPostSaveIntelligence(input: {
  homeId: string;
  childId?: string | null;
  sourceTable: string;
  sourceId: string;
  title: string;
  summary: string;
  eventType: string;
  createdBy: string;
  eventDate?: string;
}) {
  const voice = detectChildVoice(input.summary);

  await createGoldenThreadEvent({
    homeId: input.homeId,
    childId: input.childId,
    eventType: input.eventType,
    title: input.title,
    summary: input.summary,
    sourceTable: input.sourceTable,
    sourceId: input.sourceId,
    eventDate: input.eventDate,
    createdBy: input.createdBy,
    childVoicePresent: voice.hasDirectQuote,
    managementOversightPresent: input.sourceTable === "management_oversight",
  });

  if (input.childId && voice.possibleQuotes.length) {
    for (const quote of voice.possibleQuotes.slice(0, 3)) {
      await createChildVoiceSegment({
        homeId: input.homeId,
        childId: input.childId,
        sourceTable: input.sourceTable,
        sourceId: input.sourceId,
        directQuote: quote,
        staffObservation: input.summary,
        aiDetected: true,
      });
    }
  }

  return {
    goldenThreadCreated: true,
    childVoiceDetected: voice.hasDirectQuote,
    childVoiceWarning: voice.warning,
  };
}
