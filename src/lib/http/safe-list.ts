// ─────────────────────────────────────────────────────────────────────────────
// Reading a list without pretending a failure was an empty result.
//
// Fifty routes grew their own copy of this:
//
//     async function safeList(p) { try { return await p; } catch { return []; } }
//
// It keeps a route alive when one source is unavailable, which is worth having.
// What it also does is turn a failed read into an empty collection — and an
// empty collection is an answer. A medication route counting doses given
// without a witness reports none when the read failed; a home-summary counts
// zero incidents. The concern does not appear as unknown, it disappears.
//
// This keeps the resilience and records the failure, so the route can say which
// sources it could not read instead of reporting a clean result it cannot
// support.
// ─────────────────────────────────────────────────────────────────────────────

export interface SafeReader {
  /** Read a list; on failure record the source name and yield []. */
  list<T>(source: string, p: Promise<T[]>): Promise<T[]>;
  /** The sources that could not be read, in the order they failed. */
  failures(): string[];
  /** True when any source failed — the result is incomplete. */
  incomplete(): boolean;
}

export function createSafeReader(): SafeReader {
  const failures: string[] = [];
  return {
    async list<T>(source: string, p: Promise<T[]>): Promise<T[]> {
      try {
        const r = await p;
        return Array.isArray(r) ? r : [];
      } catch (err) {
        console.error(`[safe-list] could not read ${source}:`, err);
        failures.push(source);
        return [];
      }
    },
    failures: () => [...failures],
    incomplete: () => failures.length > 0,
  };
}

/**
 * The sentence a surface should carry when a source was unreadable. Naming the
 * sources matters: "incidents could not be read" is actionable, "some data is
 * missing" is not.
 */
export function incompleteNote(failures: readonly string[]): string {
  const list = failures.length === 1 ? failures[0] : `${failures.slice(0, -1).join(", ")} and ${failures.at(-1)}`;
  return `This is incomplete — ${list} could not be read, so anything counted from ${failures.length === 1 ? "it" : "them"} is missing rather than absent.`;
}
