// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT VERSIONING SPINE (Doc-Version-Workflow · Module 2)
//
// The generic capability the scoping audit found missing everywhere: nothing in
// Cara can say "version N+1 supersedes version N, and here is the chain". Real
// snapshot history exists only for Cara Studio artifacts; SoP/Guide have a
// manual "superseded" status with no row chain; a policy update overwrites.
//
// This spine generalises the two proven in-repo templates (CaraArtifactVersion
// snapshots + the CareEvent is_current_version idiom) into ONE collection any
// document type can opt into. PURE here: planning and reading. The store applies
// the plan; the route gates the write (flag + MANAGE_DOCUMENTS). Ships DARK —
// zero consumers until Module 3 (policies adopt).
//
// Honesty rules: a version row is only ever CREATED, never edited — history is
// append-only. Supersession is computed, not guessed: the new row chains to the
// current row and exactly that row loses is_current. Duplicate labels against
// the current version are refused, named.
// ══════════════════════════════════════════════════════════════════════════════

export interface DocVersionRecord {
  id: string;
  /** Which document family (e.g. "home_policy", "statement_of_purpose"). Open —
   *  the spine is generic; adopters register their own type strings. */
  doc_type: string;
  doc_id: string;
  version_label: string;
  /** JSON/text snapshot of the version's content; null for binary/file docs
   *  (metadata-only history). */
  content_snapshot: string | null;
  change_summary: string;
  changed_by: string;
  changed_at: string;
  previous_version_id: string | null;
  is_current: boolean;
}

// ── Version-label derivation (total, deterministic) ──────────────────────────

/**
 * Derive the next label from the current one. Explicit labels always win at the
 * call site — this is only the fallback. "3.1"→"3.2" (trailing integer bumps),
 * "v3"→"v4", "7"→"8"; no current → "1.0"; no trailing number → "<label>.1".
 */
export function nextVersionLabel(current: string | null | undefined): string {
  if (!current || !current.trim()) return "1.0";
  const m = current.trim().match(/^(.*?)(\d+)$/);
  if (m) return `${m[1]}${Number(m[2]) + 1}`;
  return `${current.trim()}.1`;
}

// ── Planning a new version (pure) ────────────────────────────────────────────

export interface NewVersionInput {
  doc_type: string;
  doc_id: string;
  /** Optional — derived from the current version's label when omitted. */
  version_label?: string | null;
  content_snapshot?: string | null;
  change_summary: string;
  changed_by: string;
  nowIso: string;
}

export type VersionPlan =
  | {
      ok: true;
      /** The row to create (store adds the id). */
      record: Omit<DocVersionRecord, "id">;
      /** Exactly the version ids that lose is_current when this is applied. */
      supersede_ids: string[];
    }
  | { ok: false; errors: string[] };

/** Rows for one document, robust to unsorted input. */
function forDoc(versions: readonly DocVersionRecord[], doc_type: string, doc_id: string): DocVersionRecord[] {
  return versions.filter((v) => v.doc_type === doc_type && v.doc_id === doc_id);
}

/** The current version of a document (or null — never guessed from ordering alone). */
export function currentOf(
  versions: readonly DocVersionRecord[],
  doc_type: string,
  doc_id: string,
): DocVersionRecord | null {
  return forDoc(versions, doc_type, doc_id).find((v) => v.is_current) ?? null;
}

/** Full history, newest first (by changed_at, then chain-tie-break on id). */
export function getHistory(
  versions: readonly DocVersionRecord[],
  doc_type: string,
  doc_id: string,
): DocVersionRecord[] {
  return forDoc(versions, doc_type, doc_id).sort(
    (a, b) => b.changed_at.localeCompare(a.changed_at) || b.id.localeCompare(a.id),
  );
}

/**
 * Plan recording a new version. Pure — computes the append-only row + exactly
 * which prior rows lose is_current. Every failing rule is named.
 */
export function planNewVersion(
  existing: readonly DocVersionRecord[],
  input: NewVersionInput,
): VersionPlan {
  const errors: string[] = [];
  if (!input.doc_type?.trim()) errors.push("doc_type is required");
  if (!input.doc_id?.trim()) errors.push("doc_id is required");
  if (!input.change_summary?.trim()) errors.push("change_summary is required — every version says what changed");
  if (!input.changed_by?.trim()) errors.push("changed_by is required — a named person owns the change");
  if (errors.length) return { ok: false, errors };

  const current = currentOf(existing, input.doc_type, input.doc_id);
  const label = input.version_label?.trim() || nextVersionLabel(current?.version_label ?? null);

  if (current && current.version_label === label) {
    return {
      ok: false,
      errors: [`version_label "${label}" is already the current version — a new version needs a new label`],
    };
  }

  return {
    ok: true,
    record: {
      doc_type: input.doc_type,
      doc_id: input.doc_id,
      version_label: label,
      content_snapshot: input.content_snapshot ?? null,
      change_summary: input.change_summary.trim(),
      changed_by: input.changed_by,
      changed_at: input.nowIso,
      previous_version_id: current?.id ?? null,
      is_current: true,
    },
    supersede_ids: current ? [current.id] : [],
  };
}
