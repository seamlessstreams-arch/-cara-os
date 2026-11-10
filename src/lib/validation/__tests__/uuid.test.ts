import { describe, it, expect } from "vitest";
import { uuidLike } from "@/lib/validation/uuid";
import { libraryQuerySchema, profileBuildRequestSchema, approvalRequestSchema } from "@/lib/cara-studio/schemas";
import { isUUID } from "@/lib/supabase/id-mapping";

// Three of Oak House's four children have non-RFC-4122 seeded ids
// (c0000000-0000-0000-0000-00000000000N). Postgres and isUUID() accept them;
// z.string().uuid() does not. Validation must agree with the database, or those
// children's requests 400 before they reach it.
const SEED_CHILD = "c0000000-0000-0000-0000-000000000001"; // Alex
const RFC4122 = "44aeb910-4a20-4e90-bc66-2233080fc56e"; // Wesley

describe("uuidLike", () => {
  it("accepts the seeded child ids that z.string().uuid() rejects", () => {
    expect(uuidLike.safeParse(SEED_CHILD).success).toBe(true);
    expect(uuidLike.safeParse("c0000000-0000-0000-0000-000000000003").success).toBe(true);
  });

  it("accepts real RFC-4122 uuids, any case", () => {
    expect(uuidLike.safeParse(RFC4122).success).toBe(true);
    expect(uuidLike.safeParse(RFC4122.toUpperCase()).success).toBe(true);
  });

  it("still rejects anything that is not uuid-shaped", () => {
    for (const bad of ["yp_alex", "", "not-a-uuid", "c0000000-0000-0000-0000-00000000000", "'; drop table young_people;--", "c0000000000000000000000000000001"]) {
      expect(uuidLike.safeParse(bad).success).toBe(false);
    }
  });

  it("agrees with the persistence layer's isUUID()", () => {
    for (const id of [SEED_CHILD, RFC4122]) expect(isUUID(id)).toBe(uuidLike.safeParse(id).success);
    expect(isUUID("yp_alex")).toBe(false);
  });
});

describe("cara-studio schemas accept seeded child ids (the regression)", () => {
  it("libraryQuerySchema accepts a seeded childId", () => {
    const r = libraryQuerySchema.safeParse({ childId: SEED_CHILD });
    expect(r.success).toBe(true);
  });

  it("profileBuildRequestSchema accepts a seeded childId", () => {
    expect(profileBuildRequestSchema.safeParse({ childId: SEED_CHILD }).success).toBe(true);
  });

  it("generationId stays strict — a seed-shaped id is rejected there, a real uuid passes", () => {
    // generationId is always freshly generated (gen_random_uuid), never seeded,
    // so it keeps z.string().uuid(); the seed shape must not slip through. Only
    // the generationId value differs between these two, so it is the deciding
    // field.
    expect(approvalRequestSchema.safeParse({ generationId: SEED_CHILD, action: "approve" }).success).toBe(false);
    expect(approvalRequestSchema.safeParse({ generationId: RFC4122, action: "approve" }).success).toBe(true);
  });
});
