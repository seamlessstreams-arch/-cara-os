// CARA STUDIO NOTEBOOK — POST /api/cara/notebook/[childId]/ask
// A grounded, deterministic Q&A about the child — reuses the Ask CARA engine
// with a LIVE-SAFE snapshot. Every answer line is epistemically labelled and
// cites the record types it drew on. No model call; it cannot hallucinate.
import { NextResponse, type NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { answerNotebookQuestion } from "@/lib/cara-studio/notebook/notebook-ask";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const question = typeof parsed.data.question === "string" ? parsed.data.question.trim() : "";
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 422 });
  const role = typeof parsed.data.role === "string" ? parsed.data.role : undefined;

  const answer = await answerNotebookQuestion({ childId, question, role });
  return NextResponse.json({ data: { answer } });
}
