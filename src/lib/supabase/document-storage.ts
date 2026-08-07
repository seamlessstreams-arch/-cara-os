// ══════════════════════════════════════════════════════════════════════════════
// CARA — document object storage (server-side, degrade-to-null)
//
// Thin wrapper over the private `cara-documents` bucket. The server never
// carries file bytes: it issues signed UPLOAD urls (browser PUTs the file
// straight to the bucket) and signed DOWNLOAD urls (short-lived redirect
// targets). Every function returns null on any failure — demo mode, missing
// bucket, storage outage — so callers fall back to the inline-base64 path and
// the flow never crashes. Server-only: imports the service-role client.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { DOCUMENT_BUCKET, STORAGE_SENTINEL } from "@/lib/compliance/document-file";

export const STORAGE_PATH_PREFIX = "docs/";
const DOWNLOAD_URL_TTL_SECONDS = 600;

export function isDocumentStorageEnabled(): boolean {
  return isSupabaseEnabled();
}

/** A bucket path under docs/, safe to hand back to the client. */
function buildObjectPath(fileName: string): string {
  const safe = (fileName || "document")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(-80);
  const month = new Date().toISOString().slice(0, 7);
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${STORAGE_PATH_PREFIX}${month}/${unique}-${safe}`;
}

export interface DocumentUploadTarget {
  /** Bucket-relative object path (docs/…). */
  path: string;
  /** Token for supabase-js uploadToSignedUrl on the client. */
  token: string;
}

/** Issue a one-shot signed upload target, or null when storage is unavailable. */
export async function createDocumentUploadTarget(
  fileName: string,
): Promise<DocumentUploadTarget | null> {
  if (!isDocumentStorageEnabled()) return null;
  const sb = createServerClient();
  if (!sb) return null;
  try {
    const path = buildObjectPath(fileName);
    const { data, error } = await sb.storage.from(DOCUMENT_BUCKET).createSignedUploadUrl(path);
    if (error || !data?.token) return null;
    return { path: data.path ?? path, token: data.token };
  } catch {
    return null;
  }
}

/**
 * Accepts "storage:docs/…" or a bare "docs/…" path; anything else (including
 * traversal attempts and paths outside docs/) is rejected as null.
 */
export function normaliseStoredObjectPath(storedPath: string | null | undefined): string | null {
  if (!storedPath) return null;
  const bare = storedPath.startsWith(STORAGE_SENTINEL)
    ? storedPath.slice(STORAGE_SENTINEL.length)
    : storedPath;
  if (!bare.startsWith(STORAGE_PATH_PREFIX)) return null;
  if (bare.includes("..") || bare.includes("//") || bare.length > 300) return null;
  return bare;
}

/** Short-lived signed download URL for a stored object, or null. */
export async function createDocumentDownloadUrl(storedPath: string): Promise<string | null> {
  const objectPath = normaliseStoredObjectPath(storedPath);
  if (!objectPath || !isDocumentStorageEnabled()) return null;
  const sb = createServerClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(objectPath, DOWNLOAD_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
