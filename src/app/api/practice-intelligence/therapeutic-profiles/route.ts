// ══════════════════════════════════════════════════════════════════════════════
// API — PRACTICE INTELLIGENCE: THERAPEUTIC PROFILES
// GET  ?childId=x          → get active profile for a child
// GET  (no params)         → list all profiles for the home
// POST { childId, data }   → create new profile
// PUT  { profileId, data } → update existing profile
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  getTherapeuticProfile,
  listTherapeuticProfiles,
  createTherapeuticProfile,
  updateTherapeuticProfile,
  approveTherapeuticProfile,
  buildProfileFromEvidence,
} from "@/lib/practice-intelligence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("childId");
    const mode = searchParams.get("mode"); // "build_from_evidence"

    if (childId && mode === "build_from_evidence") {
      const partial = await buildProfileFromEvidence(childId);
      return NextResponse.json({ ok: true, data: partial });
    }

    if (childId) {
      const profile = await getTherapeuticProfile(childId);
      return NextResponse.json({ ok: true, data: profile });
    }

    const profiles = await listTherapeuticProfiles();
    return NextResponse.json({ ok: true, data: profiles });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { childId, data } = body;

    if (!childId) {
      return NextResponse.json({ ok: false, error: "childId is required" }, { status: 400 });
    }

    const profile = await createTherapeuticProfile({
      childId,
      createdBy: body.createdBy ?? "system",
      data,
    });

    return NextResponse.json({ ok: true, data: profile });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const __jb1 = await readJsonBody(req); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    const { profileId, action, approvedBy, ...updates } = body;

    if (!profileId) {
      return NextResponse.json({ ok: false, error: "profileId is required" }, { status: 400 });
    }

    if (action === "approve") {
      const profile = await approveTherapeuticProfile(profileId, approvedBy ?? "system");
      return NextResponse.json({ ok: true, data: profile });
    }

    const profile = await updateTherapeuticProfile(profileId, updates);
    return NextResponse.json({ ok: true, data: profile });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
