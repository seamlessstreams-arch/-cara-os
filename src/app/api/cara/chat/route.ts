// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/chat — Cara Conversational Chat Endpoint
//
// POST /api/cara/chat
// Body: { message: string, childId?: string, conversationId?: string,
//         context?: string }
// Returns: { response: string, llmUsed: boolean, provider: string,
//            model: string, conversationId: string }
//
// Provides a conversational interface to Cara with role-aware behaviour,
// system profile enforcement, safety rules, and full audit logging.
// All outputs are "Cara suggested draft" — advisory only.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getCaraProviderConfig,
} from "@/lib/cara/cara-provider";
import { isAiKillSwitchOn } from "@/lib/cara/ai-availability";
import { invokeAiGateway } from "@/lib/cara/ai-gateway";
import {
  getActiveSystemProfile,
  logInteraction,
} from "@/lib/cara/cara-config";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  message: string;
  childId?: string;
  conversationId?: string;
  context?: string;
}

type UserRole =
  | "support_worker"
  | "team_leader"
  | "deputy_manager"
  | "registered_manager"
  | "responsible_individual";

const VALID_ROLES: UserRole[] = [
  "support_worker",
  "team_leader",
  "deputy_manager",
  "registered_manager",
  "responsible_individual",
];

// ─── Helpers ────────────────────────────────────────────────────────────────

// Activated mode (Supabase): role from the validated session, not the X-User-Role
// header; no session / unrecognised role → the lowest role. Demo mode: header.
async function extractUserRole(req: NextRequest): Promise<UserRole> {
  const { isSupabaseEnabled } = await import("@/lib/supabase/server");
  if (isSupabaseEnabled()) {
    const { resolveStaffSession } = await import("@/lib/supabase/auth");
    let session: Awaited<ReturnType<typeof resolveStaffSession>> | null = null;
    try {
      session = await resolveStaffSession(req);
    } catch {
      session = null;
    }
    if (session && VALID_ROLES.includes(session.role as UserRole)) return session.role as UserRole;
    return "support_worker";
  }
  const headerRole = req.headers.get("x-user-role");
  if (headerRole && VALID_ROLES.includes(headerRole as UserRole)) {
    return headerRole as UserRole;
  }
  return "support_worker";
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function summarise(text: string, maxLen: number = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

function assessRiskLevel(
  message: string,
  childId: string | null,
): "none" | "low" | "medium" | "high" {
  const lower = message.toLowerCase();

  // High-risk keywords that should always flag for review
  const highRiskTerms = [
    "safeguarding",
    "allegation",
    "abuse",
    "disclosure",
    "exploitation",
    "county lines",
    "self-harm",
    "suicide",
    "missing",
    "absconded",
    "radicalisation",
    "fgm",
    "forced marriage",
    "trafficking",
    "sexual",
  ];

  // Medium-risk keywords
  const mediumRiskTerms = [
    "incident",
    "restraint",
    "physical intervention",
    "risk assessment",
    "escalat",
    "concern",
    "injury",
    "medication error",
    "complaint",
    "grievance",
    "disciplinary",
  ];

  if (highRiskTerms.some((term) => lower.includes(term))) return "high";
  if (mediumRiskTerms.some((term) => lower.includes(term))) return "medium";
  if (childId) return "low";
  return "none";
}

// ─── POST Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Parse and validate request body ───────────────────────────────────
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
    return NextResponse.json(
      { error: "message is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  const message = body.message.trim();
  const childId = typeof body.childId === "string" ? body.childId : null;
  const conversationId =
    typeof body.conversationId === "string" && body.conversationId.length > 0
      ? body.conversationId
      : generateConversationId();
  const context = typeof body.context === "string" ? body.context : null;

  // ── Check if Cara AI is enabled ───────────────────────────────────────
  if (isAiKillSwitchOn()) {
    return NextResponse.json(
      {
        error: "Cara AI is currently disabled",
        detail:
          "Set CARA_AI_ENABLED to 'true' or remove the environment variable to enable Cara.",
      },
      { status: 503 },
    );
  }

  // ── Check provider configuration ──────────────────────────────────────
  const providerConfig = getCaraProviderConfig();
  if (!providerConfig.configured) {
    return NextResponse.json(
      {
        error: "Cara is not configured",
        detail:
          providerConfig.reason ??
          "The AI provider has not been configured. Add the required API key to the server environment.",
        provider: providerConfig.providerId,
      },
      { status: 503 },
    );
  }

  // ── Load system profile and build prompt ──────────────────────────────
  const profile = getActiveSystemProfile();
  const userRole = await extractUserRole(req);
  const roleRules = profile.role_rules[userRole] ?? profile.role_rules["support_worker"];

  // Build the system prompt from profile components
  const systemPromptParts: string[] = [
    profile.system_prompt,
    "",
    "=== SAFETY RULES ===",
    ...profile.safety_rules.map((rule, i) => `${i + 1}. ${rule}`),
    "",
    "=== YOUR CURRENT ROLE CONTEXT ===",
    roleRules,
    "",
    "=== EVIDENCE STANDARDS ===",
    ...profile.evidence_rules.map((rule, i) => `${i + 1}. ${rule}`),
  ];

  // Add child context note if applicable (no sensitive data in prompt)
  if (childId) {
    systemPromptParts.push(
      "",
      "=== CHILD CONTEXT ===",
      `This conversation relates to a specific child (ID: ${childId}). ` +
        "Ensure your responses are child-centred and reference this child's context. " +
        "Do not fabricate details about this child — work only with information " +
        "provided in the conversation.",
    );
  }

  // Add additional context if provided
  if (context) {
    systemPromptParts.push(
      "",
      "=== ADDITIONAL CONTEXT ===",
      context,
    );
  }

  const systemPrompt = systemPromptParts.join("\n");

  // ── Call the LLM ──────────────────────────────────────────────────────
  try {
    const result = await invokeAiGateway({
      purpose: "cara_chat",
      feature: "cara_chat",
      systemPrompt,
      userPrompt: message,
      temperature: 0.4,
      maxOutputTokens: 1500,
      identity: { userId: req.headers.get("x-user-id") ?? undefined, childId: childId ?? undefined },
    });

    // ── Assess risk and log the interaction ─────────────────────────────
    const riskLevel = assessRiskLevel(message, childId);
    const requiresReview = riskLevel === "high" || riskLevel === "medium";

    logInteraction({
      user_id: req.headers.get("x-user-id") ?? "unknown",
      child_id: childId,
      conversation_id: conversationId,
      request_type: "chat",
      prompt_summary: summarise(message),
      response_summary: summarise(result.output),
      tools_used: [],
      risk_level: riskLevel,
      requires_review: requiresReview,
    });

    // ── Return response ─────────────────────────────────────────────────
    return NextResponse.json({
      response: result.output,
      llmUsed: result.llmUsed,
      provider: result.providerId,
      model: result.modelId,
      conversationId,
    });
  } catch (err) {
    console.error("[cara/chat] Error:", err);
    return NextResponse.json(
      {
        error: "Chat request failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

// ── GET: Health/usage info ──────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/cara/chat",
    method: "POST",
    description: "Cara conversational chat endpoint. Send { message } to get a response.",
    status: "ready",
  });
}
