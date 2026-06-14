// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — MOCK INSPECTION SIMULATOR
//
// Generates realistic mock Ofsted inspection questions based on focus areas.
// Uses the AI provider to create challenging questions, then stores them
// in a session for the registered manager to practise against.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { generateCaraJson } from "./provider";
import { CARA_CORE_GUARDRAILS, buildHumanWritingInstruction } from "./guardrails";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export async function startMockInspection(input: {
  homeId: string;
  startedBy: string;
  focus?: string[];
}) {
  const focus = input.focus?.length ? input.focus : [
    "leadership and management",
    "safeguarding",
    "child voice",
    "quality of care",
    "staff supervision",
    "risk assessment",
  ];

  const raw = await generateCaraJson({
    model: (process.env.CARA_REVIEW_MODEL ?? process.env.CARA_REVIEW_MODEL) ?? (process.env.CARA_MODEL ?? process.env.CARA_MODEL),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `${CARA_CORE_GUARDRAILS}\n${buildHumanWritingInstruction()}\nReturn JSON only. Create realistic mock inspection questions for a children's home.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "Generate 12 challenging mock inspection questions.",
          focus,
          outputShape: {
            questions: [
              {
                question: "string",
                expectedEvidence: ["string"],
              },
            ],
          },
        }),
      },
    ],
  }) as { questions?: Array<{ question: string; expectedEvidence?: string[] }> };

  if (!isSupabaseEnabled()) {
    return {
      session: { id: "demo-session-id", home_id: input.homeId, status: "active" },
      questions: raw.questions ?? [],
    };
  }

  const sb = createServerClient();
  if (!sb) {
    return {
      session: { id: "demo-session-id", home_id: input.homeId, status: "active" },
      questions: raw.questions ?? [],
    };
  }

  const { data: session, error } = await (sb.from("mock_inspection_sessions") as SB)
    .insert({
      home_id: input.homeId,
      started_by: input.startedBy,
      inspection_focus: focus,
      status: "active",
    })
    .select("*")
    .single();

  if (error || !session) throw new Error(error?.message ?? "Failed to start mock inspection.");

  const questions = raw.questions?.length ? raw.questions : [];

  if (questions.length) {
    await (sb.from("mock_inspection_questions") as SB).insert(
      questions.map((q) => ({
        home_id: input.homeId,
        session_id: session.id,
        question: q.question,
        expected_evidence: q.expectedEvidence ?? [],
      }))
    );
  }

  return { session, questions };
}
