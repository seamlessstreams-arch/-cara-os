// How the Linked Records panel reads a stored smart_record_links row.
//
// The route returns rows exactly as stored, in snake_case. The panel used to
// read them as camelCase, so every field came back undefined: an existing link
// never matched its suggestion, and the panel offered — and auto-created — the
// same link again each time the record was opened.

export interface DisplayLink {
  id: string;
  sourceType: string;
  targetType: string;
  relationship: string;
  createdAt?: string;
  suggestedBy?: string;
}

const text = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export function toDisplayLink(row: Record<string, unknown>): DisplayLink {
  return {
    id: String(row.id ?? ""),
    sourceType: text(row.source_type) ?? text(row.sourceType) ?? "",
    targetType: text(row.target_type) ?? text(row.targetType) ?? "",
    relationship: text(row.relationship) ?? "",
    createdAt: text(row.created_at) ?? text(row.createdAt),
    suggestedBy: text(row.suggested_by) ?? text(row.suggestedBy),
  };
}
