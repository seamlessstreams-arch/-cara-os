// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/history
// GET — returns a user's recent Cara interactions (requests + outputs).
// Powers the "My Cara History" view and the Cara audit timeline component.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

import { seedDay } from "@/lib/seed-date";
import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

export interface HistoryEntry {
  requestId: string;
  commandId: string;
  module: string;
  createdAt: string;
  output: {
    id: string;
    status: string;
    confidence: string;
    generatedTextPreview: string;
    guardrailFlagged: boolean;
  } | null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";
  const days = Math.min(
    Number.parseInt(url.searchParams.get("days") ?? "30", 10) || 30,
    90,
  );
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    200,
  );

  if (!userId) {
    return NextResponse.json(
      { error: "userId query param is required" },
      { status: 400 },
    );
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ data: getDemoHistory() });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ data: getDemoHistory() });
  }
  const supabase = loose(supabaseRaw);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await ((supabase.from("cara_requests")))
    .select(
      "id, command_id, module, created_at, cara_outputs(id, status, confidence, generated_text, guardrail_flagged)",
    )
    .eq("user_id", userId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
      // A failed read is not an absence of records, and it is certainly not
      // these invented ones. The table has no migration, so on live this is
      // the path that runs — it used to answer with demo content that the
      // page renders exactly as it renders real data.
    return storageFailure("Cara history", error);
  }

  /** Snake-case row for the cara_requests select — only the columns read. */
  interface HistoryRow {
    id: string;
    command_id: string;
    module: string | null;
    created_at: string;
    cara_outputs?: {
      id: string;
      status: string;
      confidence: string | null;
      generated_text: string | null;
      guardrail_flagged: boolean | null;
    }[];
  }
  const entries: HistoryEntry[] = (((data) as HistoryRow[] | null) ?? []).map((row) => {
    const output = row.cara_outputs?.[0] ?? null;
    return {
      requestId: row.id,
      commandId: row.command_id,
      module: row.module ?? "general",
      createdAt: row.created_at,
      output: output
        ? {
            id: output.id,
            status: output.status,
            confidence: output.confidence ?? "medium",
            generatedTextPreview: (output.generated_text ?? "").slice(0, 120),
            guardrailFlagged: output.guardrail_flagged ?? false,
          }
        : null,
    };
  });

  return NextResponse.json({ data: entries });
}

export function getDemoHistory(): HistoryEntry[] {
  return [
    {
      requestId: "req_h1",
      commandId: "improve_writing",
      module: "daily_log",
      createdAt: `${seedDay(-27)}T14:00:00Z`,
      output: {
        id: "out_h1",
        status: "committed",
        confidence: "high",
        generatedTextPreview:
          "Jayden had a settled morning. He engaged well with his online English lesson and showed...",
        guardrailFlagged: false,
      },
    },
    {
      requestId: "req_h2",
      commandId: "draft_management_oversight",
      module: "incident",
      createdAt: `${seedDay(-27)}T11:30:00Z`,
      output: {
        id: "out_h2",
        status: "approved",
        confidence: "high",
        generatedTextPreview:
          "Management oversight recorded for INC-2026-047. The incident was handled appropriately...",
        guardrailFlagged: false,
      },
    },
    {
      requestId: "req_h3",
      commandId: "incident_risk_analysis",
      module: "incident",
      createdAt: `${seedDay(-27)}T10:00:00Z`,
      output: {
        id: "out_h3",
        status: "rejected",
        confidence: "medium",
        generatedTextPreview:
          "Risk analysis suggests this incident represents an escalating pattern of...",
        guardrailFlagged: true,
      },
    },
    {
      requestId: "req_h4",
      commandId: "summarise_text",
      module: "key_work",
      createdAt: `${seedDay(-28)}T16:00:00Z`,
      output: {
        id: "out_h4",
        status: "committed",
        confidence: "high",
        generatedTextPreview:
          "Key work session focused on Amara's transition plan. She expressed confidence in...",
        guardrailFlagged: false,
      },
    },
    {
      requestId: "req_h5",
      commandId: "extract_actions",
      module: "supervision",
      createdAt: `${seedDay(-28)}T14:00:00Z`,
      output: {
        id: "out_h5",
        status: "committed",
        confidence: "high",
        generatedTextPreview:
          "3 actions extracted from supervision session: 1) Complete safeguarding refresher by...",
        guardrailFlagged: false,
      },
    },
    {
      requestId: "req_h6",
      commandId: "draft_daily_log",
      module: "daily_log",
      createdAt: `${seedDay(-28)}T09:00:00Z`,
      output: null,
    },
  ];
}
