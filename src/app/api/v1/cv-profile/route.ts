// ══════════════════════════════════════════════════════════════════════════════
// CARA — CV-TO-PROFILE SCAFFOLD API
// POST /api/v1/cv-profile
//
// Accepts CV/application text and returns a candidate profile scaffold.
// Deterministic extraction first; optional AI enhancement when key available.
// All output is a DRAFT — must be verified with the candidate.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { buildCandidateProfileFromText } from "@/lib/engines/cv-profile-engine";
import { invokeAiGateway } from "@/lib/cara/ai-gateway";
import { readJsonBody } from "@/lib/http/read-json";

const MAX_CV_LENGTH = 8000;

export async function POST(req: Request) {
  let body: { text?: string; role?: string; enhance?: boolean };
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text || text.length < 30) {
    return NextResponse.json({ ok: false, error: "CV text too short (minimum 30 characters)" }, { status: 400 });
  }
  if (text.length > MAX_CV_LENGTH) {
    return NextResponse.json({ ok: false, error: `CV text too long (maximum ${MAX_CV_LENGTH} characters)` }, { status: 400 });
  }

  const draft = buildCandidateProfileFromText(text, body.role ?? undefined);

  if (!body.enhance) {
    return NextResponse.json({ ok: true, data: { draft, ai_enhanced: false } });
  }

  // Optional AI enhancement of work history notes and skills
  const prompt = `You are reviewing a CV for a children's residential care role in England. Extract:
1. A concise 2-sentence work history summary (UK English, factual only)
2. Up to 5 relevant skills (concise labels, 1-4 words each)
3. Any relevant qualifications not already extracted: ${draft.qualifications_noted.join(", ") || "none detected"}

CV text:
${text.slice(0, 4000)}

Respond in JSON: { "work_history_notes": "...", "skills": ["...", "..."], "additional_qualifications": ["..."] }
Do not invent information. If you are not sure, omit it. Never include personal opinions.`;

  const { output: aiText, llmUsed } = await invokeAiGateway({ purpose: "cv_profile", feature: "cv_profile",
    systemPrompt: "You extract factual information from CVs for safer recruitment. Never invent. Return JSON only.",
    userPrompt: prompt,
    maxOutputTokens: 400,
  });

  if (!llmUsed) {
    return NextResponse.json({ ok: true, data: { draft, ai_enhanced: false } });
  }

  try {
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const ai = JSON.parse(jsonMatch[0]);

    const enhanced = {
      ...draft,
      work_history_notes: ai.work_history_notes ?? draft.work_history_notes,
      skills_noted: [...new Set([...draft.skills_noted, ...(ai.skills ?? [])])].slice(0, 8),
      qualifications_noted: [...new Set([...draft.qualifications_noted, ...(ai.additional_qualifications ?? [])])],
    };

    return NextResponse.json({ ok: true, data: { draft: enhanced, ai_enhanced: true } });
  } catch {
    return NextResponse.json({ ok: true, data: { draft, ai_enhanced: false } });
  }
}
