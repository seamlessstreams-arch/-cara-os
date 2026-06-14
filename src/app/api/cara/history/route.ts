// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/history
// GET — returns a user's recent Cara interactions (requests + outputs).
// Powers the "My Cara History" view and the Cara audit timeline component.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
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

  const { data, error } = await (supabase.from("cara_requests") as any)
    .select(
      "id, command_id, module, created_at, cara_outputs(id, status, confidence, generated_text, guardrail_flagged)",
    )
    .eq("user_id", userId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ data: getDemoHistory() });
  }

  const entries: HistoryEntry[] = ((data as any[]) ?? []).map((row) => {
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
      createdAt: "2026-05-12T14:00:00Z",
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
      createdAt: "2026-05-12T11:30:00Z",
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
      createdAt: "2026-05-12T10:00:00Z",
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
      createdAt: "2026-05-11T16:00:00Z",
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
      createdAt: "2026-05-11T14:00:00Z",
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
      createdAt: "2026-05-11T09:00:00Z",
      output: null,
    },
  ];
}
