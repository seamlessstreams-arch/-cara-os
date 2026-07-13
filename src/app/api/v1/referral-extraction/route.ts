// CARA — POST /api/v1/referral-extraction (Phase 6 · Module 1)
//
// Paste a referral document → structured fields for review. Pure, deterministic,
// STATELESS: it extracts and returns a prefill payload; it creates no referral
// (the human reviews the fields, then submits through the existing admission
// create-path). Mirrors the compliance-documents extraction route — deterministic
// floor, no AI call here (an invokeAiGateway enrich pass is a later slice that
// falls back to this).
import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { extractReferralDocument } from "@/lib/referral-extraction/referral-extraction-engine";
import { enhanceReferralExtraction } from "@/lib/referral-extraction/enhance-extraction";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = (parsed.data ?? {}) as { text?: string; fileName?: string; enhance?: boolean };

  const text = typeof body.text === "string" ? body.text : "";
  if (text.trim().length < 20) {
    return NextResponse.json(
      { error: "Paste at least a short paragraph of the referral (20+ characters) to extract from." },
      { status: 400 },
    );
  }

  const deterministic = extractReferralDocument({
    text,
    fileName: body.fileName,
    today: new Date().toISOString().slice(0, 10),
  });

  // Deterministic is the default. `enhance:true` opts into the governed AI layer,
  // which fills only non-PII gaps and falls back to the deterministic result on
  // refusal / no-credits / error (today's prod always falls back).
  if (body.enhance === true) {
    const enhanced = await enhanceReferralExtraction(deterministic, text);
    return NextResponse.json({
      data: enhanced.extraction,
      ai: { used: enhanced.ai_used, method: enhanced.method, filled: enhanced.ai_filled },
    });
  }

  return NextResponse.json({ data: deterministic, ai: { used: false, method: "deterministic", filled: [] } });
}
