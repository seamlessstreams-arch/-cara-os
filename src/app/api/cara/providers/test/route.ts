// ══════════════════════════════════════════════════════════════════════════════
// API: POST /api/cara/providers/test — Test provider connectivity
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { testProviderConnection } from "@/lib/cara/providers";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";
import type { CaraProviderName } from "@/lib/cara/core/types";

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    if (!body.provider) {
      return NextResponse.json({ error: "Missing provider name" }, { status: 400 });
    }

    const result = await testProviderConnection(body.provider as CaraProviderName);

    return NextResponse.json({
      provider: body.provider,
      ...result,
    });
  } catch (error: any) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: error?.statusCode ?? 500 });
  }
}
