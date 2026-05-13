import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listScreenings,
  createScreening,
  updateScreening,
  listLocalityRisks,
  createLocalityRisk,
  updateLocalityRisk,
  SCREENING_TYPES,
  RISK_LEVELS,
  EXPLOITATION_INDICATORS,
  LOCALITY_RISK_TYPES,
  LOCATION_TYPES,
} from "@/lib/services/contextual-safeguarding-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "screening_types") {
    return NextResponse.json({ ok: true, data: SCREENING_TYPES });
  }
  if (type === "risk_levels") {
    return NextResponse.json({ ok: true, data: RISK_LEVELS });
  }
  if (type === "indicators") {
    return NextResponse.json({ ok: true, data: EXPLOITATION_INDICATORS });
  }
  if (type === "locality_risk_types") {
    return NextResponse.json({ ok: true, data: LOCALITY_RISK_TYPES });
  }
  if (type === "location_types") {
    return NextResponse.json({ ok: true, data: LOCATION_TYPES });
  }

  // Locality risks
  if (type === "locality_risks") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listLocalityRisks(homeId, {
      riskLevel: (searchParams.get("riskLevel") as import("@/lib/services/contextual-safeguarding-service").LocalityRiskLevel) ?? undefined,
      status: (searchParams.get("status") as import("@/lib/services/contextual-safeguarding-service").LocalityRiskStatus) ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Screenings (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listScreenings(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    screeningType: (searchParams.get("screeningType") as import("@/lib/services/contextual-safeguarding-service").ScreeningType) ?? undefined,
    riskLevel: (searchParams.get("riskLevel") as import("@/lib/services/contextual-safeguarding-service").ScreeningRiskLevel) ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_screening") {
      const result = await createScreening({
        homeId,
        childId: body.childId,
        childName: body.childName,
        screeningDate: body.screeningDate,
        screenedBy: body.screenedBy,
        screeningType: body.screeningType,
        riskLevel: body.riskLevel ?? "no_concern",
        indicatorsIdentified: body.indicatorsIdentified ?? [],
        protectiveFactors: body.protectiveFactors ?? [],
        locationRisks: body.locationRisks ?? [],
        peerAssociations: body.peerAssociations ?? [],
        onlineRisksIdentified: body.onlineRisksIdentified ?? false,
        referralMade: body.referralMade ?? false,
        referralTo: body.referralTo,
        referralDate: body.referralDate,
        safetyPlanInPlace: body.safetyPlanInPlace ?? false,
        safetyPlanReviewDate: body.safetyPlanReviewDate,
        nextScreeningDate: body.nextScreeningDate,
        status: body.status ?? "completed",
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_screening") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateScreening(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_locality_risk") {
      const result = await createLocalityRisk({
        homeId,
        locationName: body.locationName,
        locationType: body.locationType,
        riskType: body.riskType,
        riskLevel: body.riskLevel ?? "low",
        description: body.description ?? "",
        mitigationMeasures: body.mitigationMeasures ?? [],
        lastReviewedDate: body.lastReviewedDate,
        reviewedBy: body.reviewedBy,
        nextReviewDate: body.nextReviewDate,
        status: body.status ?? "active",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_locality_risk") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateLocalityRisk(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_screening, update_screening, create_locality_risk, or update_locality_risk" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
