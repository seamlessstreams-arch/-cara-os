// ══════════════════════════════════════════════════════════════════════════════
// CARA — stored-document path helpers (client-safe, pure)
//
// A document's stored_file_path is one of:
//   • "data:…"          — the file inline as a base64 data URL (small files)
//   • "storage:docs/…"  — an object in the private Supabase bucket
//   • ""                — nothing stored (name/text-only upload)
// These helpers are the one place that vocabulary lives. No server imports —
// this file is used by client components.
// ══════════════════════════════════════════════════════════════════════════════

export const STORAGE_SENTINEL = "storage:";

/** The private bucket name — needed client-side for uploadToSignedUrl. */
export const DOCUMENT_BUCKET = "cara-documents";

export function isInlineData(storedPath: string | null | undefined): boolean {
  return !!storedPath && storedPath.startsWith("data:");
}

export function isStorageBacked(storedPath: string | null | undefined): boolean {
  return !!storedPath && storedPath.startsWith(STORAGE_SENTINEL);
}

/**
 * The href a download link should use for a stored document, or null when
 * nothing is stored. Inline files download directly; storage-backed files go
 * via the API route, which redirects to a short-lived signed URL.
 */
export function documentDownloadHref(storedPath: string | null | undefined): string | null {
  if (isInlineData(storedPath)) return storedPath as string;
  if (isStorageBacked(storedPath)) {
    return `/api/v1/doc-intelligence/file?path=${encodeURIComponent(storedPath as string)}`;
  }
  return null;
}
