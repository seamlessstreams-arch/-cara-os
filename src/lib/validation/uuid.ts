import { z } from "zod";

// A database UUID — including the non-RFC-4122 ids the demo tenant was seeded
// with, e.g. c0000000-0000-0000-0000-000000000001 (Alex), ...0002 (Jordan),
// ...0003 (Casey). Three of Oak House's four children have ids like these.
//
// Postgres' `uuid` type accepts any 32 hex digits in the 8-4-4-4-12 shape; it
// does not check the RFC-4122 version and variant nibbles. `z.string().uuid()`
// does, so it rejects those seeded ids with "Invalid UUID" and the request
// 400s before it ever reaches the database — which is why a strict childId
// validation turned the Cara Studio notebook (and anything else keyed on a
// seeded child id) into a 400 for exactly the children the demo features.
//
// Validation must match what the database stores. `uuidLike` accepts the same
// shape `isUUID()` (src/lib/supabase/id-mapping.ts) and Postgres accept, while
// still rejecting anything that is not a uuid (names, slugs, injection). Use it
// for ids that reference stored entities (child, home, staff, source/target
// records). Ids that are always freshly generated (generationId, aiRunId) can
// keep z.string().uuid(); they are never seed-shaped.
const UUID_STRUCTURAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidLike = z.string().regex(UUID_STRUCTURAL, "Invalid UUID");
