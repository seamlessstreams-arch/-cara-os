import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listProfiles,
  createProfile,
  updateProfile,
  listMeals,
  createMeal,
  listHygieneChecks,
  createHygieneCheck,
  DIETARY_REQUIREMENTS,
  MEAL_TYPES,
  SATISFACTION_RATINGS,
  HYGIENE_CHECK_RESULTS,
} from "@/lib/services/food-nutrition-service";
import type {
  MealType,
  HygieneCheckResult,
} from "@/lib/services/food-nutrition-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "dietary_requirements") {
    return NextResponse.json({ ok: true, data: DIETARY_REQUIREMENTS });
  }
  if (type === "meal_types") {
    return NextResponse.json({ ok: true, data: MEAL_TYPES });
  }
  if (type === "satisfaction_ratings") {
    return NextResponse.json({ ok: true, data: SATISFACTION_RATINGS });
  }
  if (type === "hygiene_check_results") {
    return NextResponse.json({ ok: true, data: HYGIENE_CHECK_RESULTS });
  }

  // Meals
  if (type === "meals") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMeals(homeId, {
      mealType: (searchParams.get("mealType") ?? undefined) as MealType | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Hygiene checks
  if (type === "hygiene_checks") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listHygieneChecks(homeId, {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      result: (searchParams.get("result") ?? undefined) as HygieneCheckResult | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Profiles (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listProfiles(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_profile") {
    const result = await createProfile(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_profile") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateProfile(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_meal") {
    const result = await createMeal(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "create_hygiene_check") {
    const result = await createHygieneCheck(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
