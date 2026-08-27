// ══════════════════════════════════════════════════════════════════════════════
// API: GET /api/cara/providers — List available providers and capabilities
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { errorStatus } from "@/lib/http/error-message";
import { getAvailableProviders } from "@/lib/cara/providers";
import { sanitiseErrorForClient } from "@/lib/cara/core/errors";

export async function GET(_req: NextRequest) {
  try {
    const providers = getAvailableProviders();

    const result = providers.map(p => ({
      name: p.name,
      displayName: p.displayName,
      available: p.isAvailable(),
      capabilities: p.getCapabilities(),
      models: p.getAvailableModels(),
      defaultModel: p.getDefaultModel(),
    }));

    return NextResponse.json({ providers: result, total: result.length });
  } catch (error) {
    const safe = sanitiseErrorForClient(error);
    return NextResponse.json({ error: safe.message, code: safe.code }, { status: errorStatus(error, 500) });
  }
}
