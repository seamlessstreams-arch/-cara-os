// ══════════════════════════════════════════════════════════════════════════════
// Cara HUMANISED OVERSIGHT SERVICE
//
// Generates draft management oversight in a warm, professional, evidence-based
// tone. Works with or without an AI API key — falls back to structured
// templates when no provider is configured.
//
// Every output is marked "Cara suggested draft" and requires manager approval.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  HumanisedOversightInput,
  HumanisedOversightOutput,
} from "@/types/intelligence.layer";
import {
  generateText,
  getCaraProviderConfig,
} from "@/lib/cara/cara-provider";
import { applyCaraPostprocessor } from "@/lib/cara/writingStyleRules";

const SYSTEM_PROMPT = `You are Cara, the intelligent professional assistant built into Cara, the operating system for UK residential children's homes.

You are drafting management oversight for a Registered Manager. Your output must:

1. Be warm, professional, evidence-based and child-centred.
2. Use UK children's home language — not corporate, not robotic, not AI-generic.
3. Separate fact from analysis. Never conflate what happened with what it means.
4. Never make decisions. Never declare something safe or unsafe. Never make legal determinations.
5. Always recommend manager review.
6. Structure output as:
   Fact: [What happened, grounded in the record]
   Analysis: [What this might mean, proportionate, not alarmist]
   Impact on the child: [How the child experienced this, using their voice where available]
   Management oversight: [What the manager has considered, decided, or needs to decide]
   Actions required: [Specific next steps with owners where possible]
   Review date: [When this should be looked at again]

7. Flag missing information clearly.
8. Flag risk proportionately — not everything is a safeguarding concern.
9. Avoid: blame language, judgemental language about children, unsupported claims, AI giveaway phrases.
10. Keep it concise. Managers read dozens of these.`;

export async function generateHumanisedOversight(
  input: HumanisedOversightInput,
): Promise<HumanisedOversightOutput> {
  const config = getCaraProviderConfig();

  if (!config.configured) {
    return generateFallbackOversight(input);
  }

  const userPrompt = buildUserPrompt(input);

  try {
    const result = await generateText({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.35,
      maxOutputTokens: 1200,
    });

    if (!result.llmUsed) {
      return generateFallbackOversight(input);
    }

    const cleanedText = applyCaraPostprocessor(result.text);

    return {
      draftText: cleanedText,
      confidence: "medium",
      suggestedActions: extractActions(cleanedText),
      missingInformation: extractMissing(cleanedText),
      riskFlags: extractRisks(cleanedText),
      evidenceLinks: [],
      requiresManagerApproval: true,
    };
  } catch {
    return generateFallbackOversight(input);
  }
}

function buildUserPrompt(input: HumanisedOversightInput): string {
  const lines: string[] = [];
  lines.push(`RECORD TYPE: ${input.recordType}`);
  lines.push(`RECORD ID: ${input.recordId}`);
  if (input.childName) lines.push(`CHILD: ${input.childName}`);
  lines.push("");
  lines.push("RECORD SUMMARY:");
  lines.push(input.recordSummary);
  if (input.context && Object.keys(input.context).length > 0) {
    lines.push("");
    lines.push("ADDITIONAL CONTEXT:");
    lines.push(JSON.stringify(input.context, null, 2));
  }
  return lines.join("\n");
}

function generateFallbackOversight(
  input: HumanisedOversightInput,
): HumanisedOversightOutput {
  const childRef = input.childName ? ` regarding ${input.childName}` : "";
  const draftText = [
    `Fact:`,
    `This ${input.recordType.replace(/_/g, " ")}${childRef} has been reviewed. The record describes the following: ${input.recordSummary.slice(0, 200)}${input.recordSummary.length > 200 ? "..." : ""}`,
    ``,
    `Analysis:`,
    `[Manager to add their professional analysis of what this record tells them, what patterns they notice, and what it means for the child's care.]`,
    ``,
    `Impact on the child:`,
    `[Manager to consider and record how the child experienced this, including any direct words from the child.]`,
    ``,
    `Management oversight:`,
    `[Manager to record what they have considered, any decisions taken, and the rationale.]`,
    ``,
    `Actions required:`,
    `[Manager to list specific actions, who is responsible, and by when.]`,
    ``,
    `Review date:`,
    `[Manager to set an appropriate review date based on the level of concern.]`,
  ].join("\n");

  return {
    draftText,
    confidence: "low",
    suggestedActions: [
      "Review the record and add professional analysis",
      "Consider whether the child's voice is captured",
      "Determine if any plans need updating",
      "Set a review date",
    ],
    missingInformation: [
      "Manager analysis not yet added",
      "Child's voice may need capturing",
      "Impact assessment pending",
    ],
    riskFlags: [],
    evidenceLinks: [],
    requiresManagerApproval: true,
  };
}

function extractActions(text: string): string[] {
  const actions: string[] = [];
  const actionSection = text.split(/actions required:/i)[1];
  if (actionSection) {
    const lines = actionSection.split("\n").filter((l) => l.trim().startsWith("-") || l.trim().match(/^\d+\./));
    for (const line of lines.slice(0, 6)) {
      const cleaned = line.replace(/^[-\d.)\s]+/, "").trim();
      if (cleaned.length > 5) actions.push(cleaned);
    }
  }
  return actions;
}

function extractMissing(text: string): string[] {
  const missing: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("missing") || lower.includes("not yet captured") || lower.includes("not recorded")) {
    missing.push("Some information may be missing from the record — review flagged items");
  }
  if (!lower.includes("child") || !lower.includes("voice")) {
    missing.push("Child's voice may not be fully captured");
  }
  return missing;
}

function extractRisks(text: string): string[] {
  const risks: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("safeguarding")) risks.push("Safeguarding consideration flagged");
  if (lower.includes("escalat")) risks.push("Escalation may be needed");
  if (lower.includes("risk") && lower.includes("review")) risks.push("Risk assessment review recommended");
  return risks;
}
