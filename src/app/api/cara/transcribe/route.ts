// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/transcribe
//
// GET   /api/cara/transcribe   — capability probe. Returns { configured: bool }
//                                without requiring auth. Used by the client to
//                                decide whether to use server or browser speech.
// POST  /api/cara/transcribe   — multipart/form-data upload of an audio file.
//                                Server validates auth, permission, mime, size,
//                                and calls the provider. Audio is discarded
//                                after transcription.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { transcribeAudio, getCaraProviderConfig } from "@/lib/cara/cara-provider";
import { checkCaraAccess, type CaraActor, type CaraRole } from "@/lib/cara/cara-permissions";
import { writeAuditEvent } from "@/lib/cara/cara-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

const ALLOWED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mpga",
]);

const ALLOWED_EXT = /\.(webm|ogg|wav|mp3|mpeg|mpga|m4a|mp4)$/i;

function normaliseMime(mime: string): string {
  // Browsers append codecs to the mime ("audio/webm;codecs=opus"). Strip for
  // membership checks but keep the original to send to the provider.
  return mime.split(";")[0].trim().toLowerCase();
}

// ─── GET: capability probe ───────────────────────────────────────────────────

export function GET() {
  const config = getCaraProviderConfig();
  return NextResponse.json(
    { configured: config.configured, providerId: config.providerId },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

// ─── POST: transcribe audio ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const providerConfig = getCaraProviderConfig();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const actorUserId = String(form.get("actorUserId") ?? "");
  const actorRole = (String(form.get("actorRole") ?? "none") as CaraRole) || "none";
  const homeId = (form.get("homeId") as string | null) ?? undefined;
  const organisationId = (form.get("organisationId") as string | null) ?? undefined;
  const sourceModule = (form.get("sourceModule") as string | null) ?? undefined;
  const sourceField = (form.get("sourceField") as string | null) ?? undefined;
  const durationMs = Number.parseInt(String(form.get("durationMs") ?? "0"), 10) || undefined;

  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }

  const actor: CaraActor = {
    userId: actorUserId,
    role: actorRole,
    organisationId,
    homeId,
  };

  const access = checkCaraAccess(actor, {
    permission: "cara.transcribe",
    organisationId,
    homeId,
  });
  if (!access.allowed) {
    await writeAuditEvent({
      requestId: null,
      outputId: null,
      actorUserId,
      actorRole,
      eventType: "permission_denied",
      eventDetail: { route: "transcribe", reason: access.reason },
    });
    return NextResponse.json(
      { error: "Access denied", reason: access.reason },
      { status: 403 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required (multipart field 'file')" }, { status: 400 });
  }

  const fileSize = file.size;
  const fileName = file.name || "recording.webm";
  const fileMime = file.type || "application/octet-stream";

  if (fileSize === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (fileSize > providerConfig.maxAudioBytes) {
    return NextResponse.json(
      {
        error: `Audio file is too large. Limit is ${Math.floor(
          providerConfig.maxAudioBytes / (1024 * 1024),
        )} MB.`,
      },
      { status: 413 },
    );
  }
  const baseMime = normaliseMime(fileMime);
  if (!ALLOWED_MIME_TYPES.has(baseMime) && !ALLOWED_EXT.test(fileName)) {
    return NextResponse.json(
      { error: `Unsupported audio type: ${fileMime}` },
      { status: 415 },
    );
  }

  if (!providerConfig.configured || providerConfig.providerId === "anthropic") {
    // Transcription requires OpenAI Whisper — Anthropic does not support audio.
    // Fail safely. The UI falls back to browser-based speech recognition.
    const reason = providerConfig.providerId === "anthropic"
      ? "Voice transcription requires OpenAI (Whisper). Your AI provider (Anthropic) does not support audio transcription. Browser speech recognition will be used instead."
      : "Transcription is not configured. Set up an AI provider server-side to enable Cara voice dictation.";
    return NextResponse.json(
      {
        error: reason,
        providerConfigured: providerConfig.configured,
        transcriptionAvailable: false,
      },
      { status: 503 },
    );
  }

  // Read bytes once; provider call uses them and we then drop them.
  let audioBytes: Buffer;
  try {
    audioBytes = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read audio bytes" }, { status: 400 });
  }

  const result = await transcribeAudio({
    audio: audioBytes,
    fileName,
    mimeType: fileMime,
  });

  // Persist the transcription record (without audio).
  let transcriptionId: string | undefined;
  if (isSupabaseEnabled()) {
    const supabaseRaw = createServerClient();
    if (supabaseRaw) {
      const supabase = loose(supabaseRaw);
      transcriptionId = `cara_tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await supabase.from("cara_transcriptions").insert({
        id: transcriptionId,
        user_id: actorUserId,
        organisation_id: organisationId ?? null,
        home_id: homeId ?? null,
        source_module: sourceModule ?? null,
        source_field: sourceField ?? null,
        duration_ms: durationMs ?? null,
        bytes: fileSize,
        mime_type: fileMime,
        transcript_text: result.transcript,
        provider_id: result.providerId,
        model_id: result.modelId,
        status: result.transcript ? "complete" : "failed",
        error_detail: result.transcript ? null : "Transcription returned empty text",
      });
      await writeAuditEvent({
        requestId: null,
        outputId: null,
        actorUserId,
        actorRole,
        eventType: result.transcript ? "transcribed" : "failed",
        eventDetail: {
          transcriptionId,
          providerId: result.providerId,
          modelId: result.modelId,
          bytes: fileSize,
          mime: fileMime,
          sourceModule,
          sourceField,
        },
      });
    }
  }

  // Discard the in-memory audio explicitly. The Buffer is local to this
  // function and goes out of scope; we do not write it to disk or to any
  // long-term store.
  audioBytes = Buffer.alloc(0);

  if (!result.transcript) {
    return NextResponse.json(
      {
        error: "Transcription failed. Please try again.",
        providerConfigured: providerConfig.configured,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    data: {
      transcriptionId,
      transcript: result.transcript,
      providerId: result.providerId,
      modelId: result.modelId,
      llmUsed: result.llmUsed,
      persisted: !!transcriptionId,
    },
  });
}
