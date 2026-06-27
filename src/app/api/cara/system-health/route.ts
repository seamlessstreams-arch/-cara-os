// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/system-health — Cara System Configuration Health Check
//
// GET /api/cara/system-health
// Returns system configuration status — no secrets exposed.
// Response: { configured, provider, model, missing[], databaseConnected,
//             toolsEnabled, timestamp }
//
// NOTE: /api/cara/health is the child health intelligence endpoint (CHR 2015
// Reg 6(2)(b)). This route is for Cara system infrastructure health only.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCaraProviderConfig } from "@/lib/cara/cara-provider";
import { getCaraConfig, getToolRegistry } from "@/lib/cara/cara-config";
import { getStore } from "@/lib/db/store";

export async function GET() {
  try {
    const providerConfig = getCaraProviderConfig();
    const caraConfig = getCaraConfig();
    const toolRegistry = getToolRegistry();

    // ── Check provider configuration ──────────────────────────────────────
    const missing: string[] = [];

    if (!providerConfig.configured) {
      if (providerConfig.providerId === "anthropic") {
        missing.push("ANTHROPIC_API_KEY");
      } else {
        missing.push("CARA_PROVIDER (valid provider not configured)");
      }
    }

    if (!caraConfig.enabled) {
      missing.push("CARA_AI_ENABLED (currently set to false)");
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

    // ── Live provider connectivity test (lightweight, no cost) ─────────────
    let providerReachable = false;
    let providerError: string | null = null;

    if (providerConfig.configured && providerConfig.providerId === "anthropic") {
      try {
        const testUrl = "https://api.anthropic.com/v1/messages";

        const testHeaders: Record<string, string> = {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        };

        const testBody = { model: providerConfig.textModel, max_tokens: 1, messages: [{ role: "user", content: "ping" }] };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(testUrl, {
          method: "POST",
          headers: testHeaders,
          body: JSON.stringify(testBody),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          providerReachable = true;
        } else {
          const detail = await res.text();
          const lower = detail.toLowerCase();
          if (lower.includes("credit") || lower.includes("billing")) {
            providerError = "Account requires credits — please top up your AI provider billing";
          } else if (res.status === 401) {
            providerError = "API key is invalid or expired";
          } else if (res.status === 429) {
            providerError = "Rate limited — try again shortly";
            providerReachable = true; // key works, just rate limited
          } else {
            providerError = `Provider returned HTTP ${res.status}`;
          }
        }
      } catch (err) {
        providerError = err instanceof Error && err.name === "AbortError"
          ? "Provider timed out"
          : "Could not reach provider";
      }

      if (providerError && !providerReachable) {
        missing.push(`Provider issue: ${providerError}`);
      }
    }

    // ── Build response — NEVER include API key values ─────────────────────
    const configured = providerConfig.configured && caraConfig.enabled && databaseConnected && providerReachable;

    return NextResponse.json({
      configured,
      provider: providerConfig.providerId,
      model: providerConfig.textModel,
      missing,
      databaseConnected,
      toolsEnabled,
      enabledToolCount,
      totalToolCount: toolRegistry.length,
      providerReachable,
      providerError,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cara/system-health] Error:", err);
    return NextResponse.json(
      {
        error: "System health check failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
