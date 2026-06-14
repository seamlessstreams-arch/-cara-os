// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Generator
//
// Orchestrates the full generation pipeline:
//   1. Build/fetch child profile (if applicable)
//   2. Pre-generation safety check
//   3. Build prompts
//   4. Call LLM
//   5. Parse response into structured output
//   6. Post-generation safety check
//   7. Persist to database
//   8. Audit trail
//
// Supports OpenAI-compatible API (configurable via env).
// ══════════════════════════════════════════════════════════════════════════════

import { buildChildProfile } from "./profile-builder";
import { buildPrompt } from "./prompt-builder";
import { preGenerationCheck, postGenerationCheck } from "./safety";
import type {
  GenerationRequest,
  GenerationOutput,
  GenerationSection,
  SafetyAssessment,
  CaraChildProfile,
} from "./types";

// ── Configuration ────────────────────────────────────────────────────────────

// Claude (Anthropic) only — OpenAI was removed platform-wide.
const LLM_API_URL = (process.env.CARA_STUDIO_LLM_URL ?? process.env.CARA_STUDIO_LLM_URL) ?? "https://api.anthropic.com/v1/messages";
const LLM_API_KEY = (process.env.CARA_STUDIO_LLM_KEY ?? process.env.CARA_STUDIO_LLM_KEY) ?? process.env.ANTHROPIC_API_KEY ?? "";
const LLM_MODEL = (process.env.CARA_STUDIO_MODEL ?? process.env.CARA_STUDIO_MODEL) ?? (process.env.CARA_MODEL ?? process.env.CARA_MODEL) ?? "claude-sonnet-4-20250514";

// ── Result Type ──────────────────────────────────────────────────────────────

export interface GenerationResult {
  success: boolean;
  output?: GenerationOutput;
  safety: SafetyAssessment;
  profile?: CaraChildProfile;
  model: string;
  error?: string;
}

// ── Main Generator ───────────────────────────────────────────────────────────

export async function generate(request: GenerationRequest): Promise<GenerationResult> {
  const model = LLM_MODEL;

  // Step 1: Build child profile if applicable
  let profile: CaraChildProfile | undefined;
  if (request.childId) {
    try {
      profile = await buildChildProfile(
        request.childId,
        request.organisationId,
        request.homeId,
        request.userId,
      );
    } catch (err) {
      console.error("[cara-studio/generator] Profile build failed:", err);
      // Continue without profile — safety layer will warn
    }
  }

  // Step 2: Pre-generation safety check
  const preSafety = preGenerationCheck({
    generationType: request.generationType,
    brief: request.brief,
    tone: request.tone,
    audience: request.audience,
    hasProfile: !!profile,
  });

  if (!preSafety.passed) {
    return {
      success: false,
      safety: preSafety,
      model,
      error: `Generation blocked: ${preSafety.blockers.join("; ")}`,
    };
  }

  // Step 3: Build prompts
  const { system, user } = buildPrompt({
    generationType: request.generationType,
    profile,
    title: request.title,
    brief: request.brief,
    tone: request.tone,
    audience: request.audience,
    additionalContext: request.additionalContext,
  });

  // Step 4: Call LLM
  let rawContent: string;
  try {
    rawContent = await callLLM(system, user);
  } catch (err) {
    console.error("[cara-studio/generator] LLM call failed:", err);
    return {
      success: false,
      safety: preSafety,
      profile,
      model,
      error: `LLM generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  // Step 5: Parse response into structured output
  const output = parseOutput(rawContent, request);

  // Step 6: Post-generation safety check
  const postSafety = postGenerationCheck(output, request.generationType);

  // Merge pre and post safety
  const combinedSafety: SafetyAssessment = {
    passed: preSafety.passed && postSafety.passed,
    score: Math.min(preSafety.score, postSafety.score),
    flags: [...preSafety.flags, ...postSafety.flags],
    warnings: [...preSafety.warnings, ...postSafety.warnings],
    blockers: [...preSafety.blockers, ...postSafety.blockers],
    recommendations: [...preSafety.recommendations, ...postSafety.recommendations],
  };

  if (!postSafety.passed) {
    return {
      success: false,
      output,
      safety: combinedSafety,
      profile,
      model,
      error: `Post-generation safety check failed: ${postSafety.blockers.join("; ")}`,
    };
  }

  return {
    success: true,
    output,
    safety: combinedSafety,
    profile,
    model,
  };
}

// ── LLM Call ─────────────────────────────────────────────────────────────────

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!LLM_API_KEY) {
    // Return demo content when no API key configured
    return generateDemoContent(userPrompt);
  }

  const response = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": LLM_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`LLM API returned ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const content = json.content?.[0]?.text;

  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return content;
}

// ── Parse Output ─────────────────────────────────────────────────────────────

function parseOutput(raw: string, request: GenerationRequest): GenerationOutput {
  // Parse markdown sections into structured format
  const sections: GenerationSection[] = [];
  const lines = raw.split("\n");
  let currentSection: GenerationSection | null = null;
  let currentItems: string[] = [];

  for (const line of lines) {
    // Detect section headings (## heading)
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (currentSection) {
        if (currentItems.length > 0) currentSection.items = currentItems;
        sections.push(currentSection);
      }
      currentSection = {
        heading: headingMatch[1].trim(),
        content: "",
        type: inferSectionType(headingMatch[1]),
      };
      currentItems = [];
      continue;
    }

    // Detect list items
    const listMatch = line.match(/^[-*]\s+(.+)/);
    if (listMatch && currentSection) {
      currentItems.push(listMatch[1].trim());
      continue;
    }

    // Regular content
    if (currentSection) {
      currentSection.content += (currentSection.content ? "\n" : "") + line;
    }
  }

  // Push final section
  if (currentSection) {
    if (currentItems.length > 0) currentSection.items = currentItems;
    sections.push(currentSection);
  }

  // If no sections parsed, create one big section
  if (sections.length === 0) {
    sections.push({
      heading: request.title,
      content: raw,
      type: "narrative",
    });
  }

  // Extract summary (first ~150 chars of first section)
  const summary = sections[0]?.content?.slice(0, 150)?.trim() ?? request.brief;

  return {
    title: request.title,
    summary,
    sections,
    metadata: {
      generationType: request.generationType,
      model: LLM_MODEL,
      generatedAt: new Date().toISOString(),
    },
  };
}

function inferSectionType(heading: string): GenerationSection["type"] {
  const h = heading.toLowerCase();
  if (h.includes("checklist") || h.includes("check list")) return "checklist";
  if (h.includes("question") || h.includes("prompt") || h.includes("reflection")) return "prompt_questions";
  if (h.includes("activity") || h.includes("exercise")) return "activity";
  if (h.includes("material") || h.includes("resource")) return "guidance";
  if (h.includes("step") || h.includes("action") || h.includes("task")) return "list";
  return "narrative";
}

// ── Demo Content (when no LLM key) ──────────────────────────────────────────

function generateDemoContent(userPrompt: string): string {
  const hasJordan = userPrompt.toLowerCase().includes("jordan");
  const childName = hasJordan ? "Jordan" : "the young person";

  return `## Session Overview

This session is designed to be personalised for ${childName}, building on their identified strengths and interests while gently working toward care plan objectives.

**Duration**: 25-35 minutes
**Setting**: Comfortable, private space (${childName}'s preferred location)

## Warm-Up (5 minutes)

Begin with a low-pressure check-in. Use open questions:
- "How's your week been on a scale of 1-10?"
- "Anything good happened since we last met?"
- "Is there anything on your mind you'd like to talk about first?"

## Main Activity (15-20 minutes)

### Approach
- Start from ${childName}'s interests to build engagement
- Use strengths-based language throughout
- Allow silences — don't fill every gap
- Follow the young person's lead where possible

### Key Discussion Points
- Progress toward identified objectives
- Any barriers or challenges experienced
- What support would be helpful
- Celebrating small wins

### Prompts to Use
- "What are you most proud of this week?"
- "If you could change one thing, what would it be?"
- "How can we help you with that?"

## Wind-Down (5 minutes)

- Summarise what was discussed (check understanding)
- Agree 1-2 small, achievable actions
- Confirm next session date
- End on a positive note — reference a strength or progress

## Follow-Up Actions

- Record session notes within 24 hours
- Update daily log with any disclosures
- Progress actions agreed
- Share relevant information with team (within confidentiality boundaries)

## Staff Guidance

- If ${childName} becomes dysregulated, pause and offer a break
- This is not an interrogation — if they don't want to talk, that's OK
- Document the child's own words wherever possible
- Link observations back to care plan objectives in your recording`;
}
