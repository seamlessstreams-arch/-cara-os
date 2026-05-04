// ══════════════════════════════════════════════════════════════════════════════
// ARIA — UNIVERSAL SERVICE LAYER
//
// The orchestrator that every Aria-driven feature can route through. It
// authenticates, checks Aria permissions, builds safe context, calls the
// provider, validates the response, persists a draft, and writes the audit
// event. Domain engines (oversight, voice-of-child, HR Process Guardian)
// remain authoritative for their own deep checks; this service is the
// thin universal layer that makes Aria available across the rest of the
// platform with the same lifecycle.
//
// All output is "Aria suggested draft" until a human approves and commits.
// ══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  ARIA_WRITING_STYLE_PROMPT,
  applyAriaPostprocessor,
} from "@/lib/aria/writingStyleRules";
import {
  checkAriaAccess,
  type AriaActor,
  type AriaPermission,
} from "@/lib/aria/aria-permissions";
import {
  generateText,
  getAriaProviderConfig,
  type AriaProviderConfig,
} from "@/lib/aria/aria-provider";
import type {
  AriaCommandId,
  AriaCommandSpec,
  AriaConfidence,
  AriaGenerationResult,
  AriaInvocationInput,
} from "@/lib/aria/aria-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

// ─── Command registry ───────────────────────────────────────────────────────
// A focused subset of commands wired through the universal layer for Phase 1.
// Domain-specific commands (management oversight, voice of child, HR Process
// Guardian) keep their own deeper engines and are not duplicated here.

export const ARIA_COMMANDS: Partial<Record<AriaCommandId, AriaCommandSpec>> = {
  improve_writing: {
    id: "improve_writing",
    label: "Improve writing",
    description: "Lift the wording into a clear, calm, professional tone without changing meaning.",
    modules: [],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Improve the wording of the source text. Preserve every fact. Do not add facts. Do not soften safeguarding language. Keep the child's voice if present.",
  },
  professionalise_record: {
    id: "professionalise_record",
    label: "Professionalise record",
    description: "Re-cast the record in a UK children's-home professional tone, evidenced and child-centred.",
    modules: ["daily_log", "shift_summary", "key_work", "incident", "complaint"],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Re-write the record in a UK residential childcare professional tone. Evidence-led, calm, warm, child-centred. Preserve every fact in the source. Make the child's voice and the staff response visible where the source supports it.",
  },
  simplify_language: {
    id: "simplify_language",
    label: "Simplify language",
    description: "Plain-English version that a young person, family member, or non-specialist could read.",
    modules: [],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Re-write the source in plain English. Keep the meaning. Avoid jargon. Use short sentences. Preserve safeguarding-relevant detail accurately.",
  },
  summarise_text: {
    id: "summarise_text",
    label: "Summarise",
    description: "Concise professional summary of the source text.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Summarise the source text in a calm, professional tone. Preserve significant facts and any safeguarding-relevant detail. Flag what is missing.",
  },
  extract_actions: {
    id: "extract_actions",
    label: "Extract actions",
    description: "Pull a list of suggested actions out of the source. The manager confirms before any task is created.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Extract suggested actions from the source as a numbered list. Each action should have a short title, a one-sentence description, a sensible priority (urgent/high/medium/low), and a suggested role to assign it to. Mark any safeguarding-touching actions as urgent. Do not invent actions that the source does not support.",
  },
  check_missing_information: {
    id: "check_missing_information",
    label: "Check missing information",
    description: "Flag what a manager would expect to see that the record does not yet contain.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Review the source and list what a UK Registered Manager would expect to see that is not yet captured. Examples to consider: child voice, dates, who was present, what was done, what was decided, what the next step is, plan linkage. Be specific. Do not pad the list.",
  },
  draft_handover: {
    id: "draft_handover",
    label: "Draft shift handover",
    description: "Produce a shift handover ready for review.",
    modules: ["shift", "shift_summary"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a UK children's-home shift handover. Keep it tight and useful for the next shift. Cover each child's mood/presentation, anything significant since the last handover, anything that needs to happen next shift, and any safeguarding considerations. Use the source only.",
  },
  convert_to_email: {
    id: "convert_to_email",
    label: "Draft email",
    description: "Convert source text into a professional email draft.",
    modules: [],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Convert the source text into a professional email draft suitable for a children's-home manager. Include subject line, greeting, body, and sign-off. Preserve every fact. Use plain English.",
  },
};

// ─── Public service entry points ────────────────────────────────────────────

export interface AriaInvokeArgs extends AriaInvocationInput {
  actor: AriaActor;
}

export interface AriaInvokeOutcome {
  ok: boolean;
  result?: AriaGenerationResult;
  errorReason?: string;
  status: number;
  providerConfig: AriaProviderConfig;
}

export async function invokeAriaCommand(
  args: AriaInvokeArgs,
): Promise<AriaInvokeOutcome> {
  const providerConfig = getAriaProviderConfig();
  const command = ARIA_COMMANDS[args.commandId];
  if (!command) {
    return {
      ok: false,
      errorReason: `Unknown or unsupported command: ${args.commandId}`,
      status: 400,
      providerConfig,
    };
  }

  // Permission check
  const access = checkAriaAccess(args.actor, {
    permission: command.requiredPermission,
    organisationId: args.organisationId,
    homeId: args.homeId,
    childId: args.childId,
    staffId: args.staffId,
    isSafeguardingSensitive: command.riskLevel === "high",
  });
  if (!access.allowed) {
    await writeAuditEvent({
      requestId: null,
      outputId: null,
      actorUserId: args.actor.userId,
      actorRole: args.actor.role,
      eventType: "permission_denied",
      eventDetail: { reason: access.reason, commandId: command.id },
    });
    return {
      ok: false,
      errorReason: access.reason ?? "Access denied",
      status: 403,
      providerConfig,
    };
  }

  // Build the prompts
  const systemPrompt = buildSystemPrompt(command);
  const userPrompt = buildUserPrompt(args);

  // Persist the request (best effort — if Supabase is not configured, we
  // still call the provider and return the draft, but with persisted=false).
  const requestId = `aria_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const supabaseRaw = createServerClient();
  const supabase = supabaseRaw ? loose(supabaseRaw) : null;

  if (supabase) {
    await supabase.from("aria_requests").insert({
      id: requestId,
      organisation_id: args.organisationId ?? null,
      home_id: args.homeId ?? null,
      child_id: args.childId ?? null,
      staff_id: args.staffId ?? null,
      source_module: args.sourceModule ?? null,
      source_record_type: args.sourceRecordType ?? null,
      source_record_id: args.sourceRecordId ?? null,
      command_id: command.id,
      user_id: args.actor.userId,
      user_role: args.actor.role,
      input_text: args.inputText ?? null,
      input_metadata: args.inputMetadata ?? {},
      status: "context_built",
      llm_used: false,
      provider_id: providerConfig.providerId,
      model_id: providerConfig.textModel,
    });
  }

  // Provider call
  const generation = await generateText({
    systemPrompt,
    userPrompt,
    expectJson: false,
  });

  const cleanedText = applyAriaPostprocessor(generation.text);
  const confidence = inferConfidence(command, cleanedText);
  const outputId = `aria_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (supabase) {
    await supabase
      .from("aria_requests")
      .update({
        status: generation.llmUsed ? "complete" : "provider_failed",
        llm_used: generation.llmUsed,
      })
      .eq("id", requestId);

    await supabase.from("aria_outputs").insert({
      id: outputId,
      request_id: requestId,
      generated_text: cleanedText,
      structured_output: {},
      approval_required: command.approvalRequired,
      status: "draft",
      confidence,
      redacted_context_summary: redactedContextSummaryFor(args),
      context_record_ids: contextRecordIdsFor(args),
    });

    await writeAuditEvent({
      requestId,
      outputId,
      actorUserId: args.actor.userId,
      actorRole: args.actor.role,
      eventType: generation.llmUsed ? "generated" : "failed",
      eventDetail: {
        commandId: command.id,
        providerId: generation.providerId,
        modelId: generation.modelId,
        configured: providerConfig.configured,
      },
    });
  }

  return {
    ok: true,
    result: {
      requestId,
      outputId: supabase ? outputId : undefined,
      generatedText: cleanedText,
      structuredOutput: {},
      confidence,
      redactedContextSummary: redactedContextSummaryFor(args),
      contextRecordIds: contextRecordIdsFor(args),
      ariaLabel: "Aria suggested draft",
      llmUsed: generation.llmUsed,
      providerId: generation.providerId,
      modelId: generation.modelId,
      approvalRequired: command.approvalRequired,
      persisted: !!supabase,
    },
    status: 200,
    providerConfig,
  };
}

// ─── Audit helper ────────────────────────────────────────────────────────────

export interface WriteAuditEventArgs {
  requestId: string | null;
  outputId: string | null;
  actorUserId: string;
  actorRole?: string;
  eventType:
    | "generated"
    | "edited"
    | "submitted_for_approval"
    | "approved"
    | "rejected"
    | "committed"
    | "transcribed"
    | "copied_to_field"
    | "task_created"
    | "context_viewed"
    | "failed"
    | "permission_denied"
    | "withdrawn";
  eventDetail?: Record<string, unknown>;
}

export async function writeAuditEvent(args: WriteAuditEventArgs): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return;
  const supabase = loose(supabaseRaw);
  await supabase.from("aria_audit_events").insert({
    id: `aria_aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    request_id: args.requestId,
    output_id: args.outputId,
    actor_user_id: args.actorUserId,
    actor_role: args.actorRole ?? null,
    event_type: args.eventType,
    event_detail: args.eventDetail ?? {},
  });
}

// ─── Approval lifecycle ────────────────────────────────────────────────────

export type AriaApprovalDecision = "approve" | "reject" | "request_changes" | "commit" | "withdraw";

export interface ApplyApprovalArgs {
  outputId: string;
  decision: AriaApprovalDecision;
  decisionText?: string;
  editedText?: string;
  committedRecordType?: string;
  committedRecordId?: string;
  actor: AriaActor;
  requiredPermission: AriaPermission;
}

export async function applyApprovalDecision(args: ApplyApprovalArgs): Promise<{
  ok: boolean;
  status: number;
  errorReason?: string;
}> {
  const access = checkAriaAccess(args.actor, { permission: args.requiredPermission });
  if (!access.allowed) {
    return { ok: false, status: 403, errorReason: access.reason ?? "Access denied" };
  }

  if (!isSupabaseEnabled()) {
    return { ok: false, status: 501, errorReason: "Persistence not configured" };
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return { ok: false, status: 501, errorReason: "Persistence not configured" };
  }
  const supabase = loose(supabaseRaw);

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  switch (args.decision) {
    case "approve":
      updates.status = "approved";
      updates.approved_by = args.actor.userId;
      updates.approved_at = now;
      if (args.editedText) updates.edited_text = args.editedText;
      break;
    case "reject":
      updates.status = "rejected";
      updates.rejected_by = args.actor.userId;
      updates.rejected_at = now;
      updates.rejection_reason = args.decisionText ?? "";
      break;
    case "request_changes":
      updates.status = "edited";
      if (args.editedText) updates.edited_text = args.editedText;
      break;
    case "commit":
      updates.status = "committed";
      updates.committed_record_type = args.committedRecordType ?? null;
      updates.committed_record_id = args.committedRecordId ?? null;
      break;
    case "withdraw":
      updates.status = "archived";
      break;
  }

  const { data: updated, error: updateError } = await supabase
    .from("aria_outputs")
    .update(updates)
    .eq("id", args.outputId)
    .select()
    .single();
  if (updateError) {
    return { ok: false, status: 500, errorReason: updateError.message };
  }

  await supabase.from("aria_approvals").insert({
    id: `aria_appr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    output_id: args.outputId,
    decision: args.decision,
    decided_by: args.actor.userId,
    decided_role: args.actor.role,
    decision_text: args.decisionText ?? null,
  });

  await writeAuditEvent({
    requestId: updated?.request_id ?? null,
    outputId: args.outputId,
    actorUserId: args.actor.userId,
    actorRole: args.actor.role,
    eventType:
      args.decision === "approve"
        ? "approved"
        : args.decision === "reject"
          ? "rejected"
          : args.decision === "request_changes"
            ? "edited"
            : args.decision === "commit"
              ? "committed"
              : "withdrawn",
    eventDetail: { decisionText: args.decisionText },
  });

  return { ok: true, status: 200 };
}

// ─── Internals ──────────────────────────────────────────────────────────────

function buildSystemPrompt(command: AriaCommandSpec): string {
  return [
    "You are Aria, the universal Aria assistant for Cornerstone, the operating system for UK residential children's homes.",
    "",
    "Universal rules:",
    "- Output is always labelled as an Aria suggested draft. The Registered Manager remains the decision-maker and the author.",
    "- Use only the source provided. Do not invent facts. Do not invent chronology. Do not invent quotes from children or staff.",
    "- Never declare high confidence on safeguarding-, HR-, or legal-sensitive content unless the source evidence is unambiguous.",
    "",
    "Command-specific guidance:",
    command.systemPromptFragment,
    "",
    ARIA_WRITING_STYLE_PROMPT,
  ].join("\n");
}

function buildUserPrompt(args: AriaInvokeArgs): string {
  const lines: string[] = [];
  lines.push(`COMMAND: ${args.commandId}`);
  if (args.homeId) lines.push(`HOME: ${args.homeId}`);
  if (args.childId) lines.push(`CHILD REFERENCE: ${args.childId}`);
  if (args.sourceModule) lines.push(`SOURCE MODULE: ${args.sourceModule}`);
  if (args.sourceRecordId) lines.push(`SOURCE RECORD: ${args.sourceRecordType ?? ""} ${args.sourceRecordId}`);
  lines.push("");
  lines.push("USER INPUT (the source text Aria should work from):");
  lines.push(args.inputText ?? "(no input text provided)");
  if (args.inputMetadata && Object.keys(args.inputMetadata).length > 0) {
    lines.push("");
    lines.push("ADDITIONAL CONTEXT (metadata, do not invent beyond this):");
    lines.push(JSON.stringify(args.inputMetadata, null, 2));
  }
  return lines.join("\n");
}

function inferConfidence(command: AriaCommandSpec, text: string): AriaConfidence {
  if (command.riskLevel === "high") return "low";
  if (command.riskLevel === "medium") return "medium";
  if (text.length < 60) return "low";
  return "medium";
}

function redactedContextSummaryFor(args: AriaInvokeArgs): string {
  const parts: string[] = [];
  if (args.homeId) parts.push(`home=${args.homeId}`);
  if (args.childId) parts.push(`child=${args.childId}`);
  if (args.sourceModule) parts.push(`module=${args.sourceModule}`);
  if (args.sourceRecordId) parts.push(`record=${args.sourceRecordId}`);
  if (args.inputText) parts.push(`inputText=${args.inputText.length}_chars`);
  return parts.join("; ");
}

function contextRecordIdsFor(args: AriaInvokeArgs): string[] {
  const ids: string[] = [];
  if (args.sourceRecordId) ids.push(args.sourceRecordId);
  return ids;
}
