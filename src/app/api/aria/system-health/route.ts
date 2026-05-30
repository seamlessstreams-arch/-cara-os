// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/system-health — Aria System Configuration Health Check
//
// GET /api/aria/system-health
// Returns system configuration status — no secrets exposed.
// Response: { configured, provider, model, missing[], databaseConnected,
//             toolsEnabled, timestamp }
//
// NOTE: /api/aria/health is the child health intelligence endpoint (CHR 2015
// Reg 6(2)(b)). This route is for Aria system infrastructure health only.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAriaProviderConfig } from "@/lib/aria/aria-provider";
import { getAriaConfig, getToolRegistry } from "@/lib/aria/aria-config";
import { getStore } from "@/lib/db/store";

export async function GET() {
  try {
    const providerConfig = getAriaProviderConfig();
    const ariaConfig = getAriaConfig();
    const toolRegistry = getToolRegistry();

    // ── Check provider configuration ──────────────────────────────────────
    const missing: string[] = [];

    if (!providerConfig.configured) {
      if (providerConfig.providerId === "anthropic") {
        missing.push("ANTHROPIC_API_KEY");
      } else if (providerConfig.providerId === "openai") {
        missing.push("OPENAI_API_KEY");
      } else {
        missing.push("ARIA_PROVIDER (valid provider not configured)");
      }
    }

    if (!ariaConfig.enabled) {
      missing.push("ARIA_AI_ENABLED (currently set to false)");
    }

    // ── Check database connectivity ───────────────────────────────────────
    let databaseConnected = false;
    try {
      const store = getStore();
      databaseConnected = store != null && typeof store === "object";
    } catch {
      databaseConnected = false;
      missing.push("Database (in-memory store unavailable)");
    }

    // ── Check tool registry ───────────────────────────────────────────────
    const toolsEnabled = toolRegistry.length > 0;
    const enabledToolCount = toolRegistry.filter((t) => t.enabled).length;

    if (!toolsEnabled) {
      missing.push("Tool registry (no tools registered)");
    }

    // ── Build response — NEVER include API key values ─────────────────────
    const configured = providerConfig.configured && ariaConfig.enabled && databaseConnected;

    return NextResponse.json({
      configured,
      provider: providerConfig.providerId,
      model: providerConfig.textModel,
      missing,
      databaseConnected,
      toolsEnabled,
      enabledToolCount,
      totalToolCount: toolRegistry.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[aria/system-health] Error:", err);
    return NextResponse.json(
      {
        error: "System health check failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
