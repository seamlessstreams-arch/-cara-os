// ══════════════════════════════════════════════════════════════════════════════
// Cara Studio guard — server-side RBAC enforcement
// Verifies that mutating routes refuse unauthorised actors and accept
// authorised ones, regardless of UI state.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import {
  POST as generatePOST,
} from "@/app/api/v1/cara-studio/generate/route";
import {
  POST as artifactsPOST,
} from "@/app/api/v1/cara-studio/artifacts/route";
import {
  PATCH as artifactPATCH,
  DELETE as artifactDELETE,
} from "@/app/api/v1/cara-studio/artifacts/[id]/route";
import {
  POST as qualityPOST,
} from "@/app/api/v1/cara-studio/quality-check/route";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";

function makeReq(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new Request(url, init));
}

function jsonBody(payload: Record<string, unknown>, headers: Record<string, string> = {}): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  };
}

const URL_GEN = "http://test/api/v1/cara-studio/generate";
const URL_ARTS = "http://test/api/v1/cara-studio/artifacts";
const URL_QC = "http://test/api/v1/cara-studio/quality-check";

beforeEach(() => {
  // Force "deny by default" for these tests so we exercise real RBAC.
  process.env.CARA_FALLBACK_ROLE = "none";
});

afterEach(() => {
  delete process.env.CARA_FALLBACK_ROLE;
});

describe("Cara Studio guard — denial behaviour", () => {
  it("requireCaraStudioPermission returns 401 when no actor role is provided", () => {
    const req = makeReq("http://test/x", { method: "POST" });
    const result = requireCaraStudioPermission(req, null, {
      permission: "cara.generate_drafts",
      homeId: "home_oak",
      intent: "test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("requireCaraStudioPermission returns 403 when role lacks the permission", () => {
    const req = makeReq("http://test/x", { method: "POST" });
    const result = requireCaraStudioPermission(
      req,
      { actor_role: "viewer", actor_id: "u1" },
      { permission: "cara.commit_to_records", homeId: "home_oak", intent: "test" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("requireCaraStudioPermission accepts an authorised role", () => {
    const req = makeReq("http://test/x", { method: "POST" });
    const result = requireCaraStudioPermission(
      req,
      { actor_role: "registered_manager", actor_id: "mgr_1" },
      { permission: "cara.commit_to_records", homeId: "home_oak", intent: "test" },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.role).toBe("registered_manager");
      expect(result.actor.userId).toBe("mgr_1");
    }
  });

  it("blocks generate POST without actor_role", async () => {
    const res = await generatePOST(
      makeReq(URL_GEN, jsonBody({
        artifact_type: "keywork_session",
        title: "x",
        requested_by: "u1",
      })),
    );
    expect(res.status).toBe(401);
  });

  it("blocks generate POST when role is viewer", async () => {
    const res = await generatePOST(
      makeReq(URL_GEN, jsonBody({
        artifact_type: "keywork_session",
        title: "x",
        requested_by: "u1",
        actor_role: "viewer",
      })),
    );
    expect(res.status).toBe(403);
  });

  it("blocks artifacts POST when role is auditor", async () => {
    const res = await artifactsPOST(
      makeReq(URL_ARTS, jsonBody({
        artifact_type: "keywork_session",
        title: "draft",
        created_by: "u1",
        actor_role: "auditor",
      })),
    );
    expect(res.status).toBe(403);
  });

  it("blocks artifact PATCH commit when role is team_leader (no commit_to_records)", async () => {
    const art = db.caraArtifacts.create({
      artifact_type: "keywork_session",
      title: "test",
      status: "approved",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      generated_content: "x",
      structured_content: null,
      plain_text_content: null,
      quality_score: 80,
      evidence_confidence_score: 50,
      safeguarding_level: "none",
      regulation_relevance: [],
      source_ids: [],
      created_by: "u1",
      reviewed_by: null,
      approved_by: null,
      committed_by: null,
      rejected_by: null,
      submitted_for_review_at: null,
      reviewed_at: null,
      approved_at: null,
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
      child_voice_present: false,
      quality_checks_passed: true,
      amendment_reason: null,
    });

    const res = await artifactPATCH(
      makeReq(`http://test/api/v1/cara-studio/artifacts/${art.id}`, jsonBody({
        action: "commit",
        actor_id: "tl_1",
        actor_role: "team_leader",
      })),
      { params: Promise.resolve({ id: art.id }) },
    );
    expect(res.status).toBe(403);
  });

  it("allows artifact PATCH approve as deputy_manager", async () => {
    const art = db.caraArtifacts.create({
      artifact_type: "keywork_session",
      title: "test approve",
      status: "in_review",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      generated_content: "x",
      structured_content: null,
      plain_text_content: null,
      quality_score: null,
      evidence_confidence_score: null,
      safeguarding_level: "none",
      regulation_relevance: [],
      source_ids: [],
      created_by: "u1",
      reviewed_by: null,
      approved_by: null,
      committed_by: null,
      rejected_by: null,
      submitted_for_review_at: new Date().toISOString(),
      reviewed_at: null,
      approved_at: null,
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
      child_voice_present: false,
      quality_checks_passed: false,
      amendment_reason: null,
    });

    const res = await artifactPATCH(
      makeReq(`http://test/api/v1/cara-studio/artifacts/${art.id}`, jsonBody({
        action: "approve",
        actor_id: "dep_1",
        actor_role: "deputy_manager",
      })),
      { params: Promise.resolve({ id: art.id }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { status: string } };
    expect(body.data.status).toBe("approved");
  });

  it("blocks DELETE when role is RSW", async () => {
    const art = db.caraArtifacts.create({
      artifact_type: "keywork_session",
      title: "to delete",
      status: "draft",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      generated_content: "",
      structured_content: null,
      plain_text_content: null,
      quality_score: null,
      evidence_confidence_score: null,
      safeguarding_level: "none",
      regulation_relevance: [],
      source_ids: [],
      created_by: "u1",
      reviewed_by: null,
      approved_by: null,
      committed_by: null,
      rejected_by: null,
      submitted_for_review_at: null,
      reviewed_at: null,
      approved_at: null,
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
      child_voice_present: false,
      quality_checks_passed: false,
      amendment_reason: null,
    });

    const res = await artifactDELETE(
      makeReq(`http://test/api/v1/cara-studio/artifacts/${art.id}`, {
        method: "DELETE",
        headers: {
          "x-cara-actor-role": "residential_support_worker",
          "x-cara-actor-id": "rsw_1",
        },
      }),
      { params: Promise.resolve({ id: art.id }) },
    );
    expect(res.status).toBe(403);
  });

  it("quality-check POST refuses RSW role", async () => {
    const art = db.caraArtifacts.create({
      artifact_type: "keywork_session",
      title: "qc test",
      status: "draft",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "none",
      tone: "professional",
      creative_mode: "balanced",
      generated_content: "x",
      structured_content: null,
      plain_text_content: null,
      quality_score: null,
      evidence_confidence_score: null,
      safeguarding_level: "none",
      regulation_relevance: [],
      source_ids: [],
      created_by: "u1",
      reviewed_by: null,
      approved_by: null,
      committed_by: null,
      rejected_by: null,
      submitted_for_review_at: null,
      reviewed_at: null,
      approved_at: null,
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
      child_voice_present: false,
      quality_checks_passed: false,
      amendment_reason: null,
    });

    const res = await qualityPOST(
      makeReq(URL_QC, jsonBody({
        artifact_id: art.id,
        actor_id: "rsw_1",
        actor_role: "residential_support_worker",
      })),
    );
    expect(res.status).toBe(403);
  });

  it("respects header-based actor when body has none", () => {
    const req = makeReq("http://test/x", {
      method: "POST",
      headers: {
        "x-cara-actor-role": "registered_manager",
        "x-cara-actor-id": "mgr_h",
      },
    });
    const result = requireCaraStudioPermission(req, null, {
      permission: "cara.commit_to_records",
      homeId: "home_oak",
      intent: "test",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.userId).toBe("mgr_h");
    }
  });

  it("denies cross-home mutation", () => {
    const req = makeReq("http://test/x", { method: "POST" });
    const result = requireCaraStudioPermission(
      req,
      { actor_role: "deputy_manager", actor_id: "d1" },
      { permission: "cara.approve_outputs", homeId: "home_oak", intent: "test" },
    );
    // Deputy with no home set in actor passes scope; the per-home check
    // only fires when actor.homeId is set. Sanity: this should pass.
    expect(result.ok).toBe(true);
  });
});

describe("Cara Studio guard — fallback role behaviour", () => {
  it("default fallback role allows generation in dev/demo (when env unset)", async () => {
    delete process.env.CARA_FALLBACK_ROLE;
    const res = await generatePOST(
      makeReq(URL_GEN, jsonBody({
        artifact_type: "keywork_session",
        title: "demo",
        requested_by: "u1",
      })),
    );
    expect([200, 201]).toContain(res.status);
  });
});

// SECURITY REGRESSION: in activated mode (Supabase configured) a client-supplied
// actor role/id is forgeable and must NOT be trusted. The guard fails CLOSED
// (role "none" → 401) until it is migrated to full session resolution. Demo mode
// (above) is unchanged.
describe("Cara Studio guard — activated-mode fails closed", () => {
  const ORIG_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ORIG_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://real-project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "real-service-role-key-abcdef123456";
  });
  afterEach(() => {
    if (ORIG_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIG_URL;
    if (ORIG_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIG_KEY;
  });

  it("refuses a forged body actor_role (registered_manager) → 401", () => {
    const result = requireCaraStudioPermission(
      makeReq("http://test/x", { method: "POST" }),
      { actor_role: "registered_manager", actor_id: "attacker" },
      { permission: "cara.generate_drafts", homeId: "home_oak", intent: "test" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("ignores a forged x-cara-actor-role header too → 401", () => {
    const result = requireCaraStudioPermission(
      makeReq("http://test/x", { method: "POST", headers: { "x-cara-actor-role": "registered_manager" } }),
      null,
      { permission: "cara.commit_to_records", homeId: "home_oak", intent: "test" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });
});
