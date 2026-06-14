// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/sleep-patterns — Sleep Pattern Intelligence
//
// Analyses sleep duration, quality, disruption patterns, and daytime impact.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 6 alignment (Quality of Care — Health & Well-being).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseSleepPatterns } from "@/lib/cara/sleep-pattern-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { SleepInput, SleepNight } from "@/lib/cara/sleep-pattern-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    // ── Fetch or demo ───────────────────────────────────────────────────────
    const sb = createServerClient();
    let input: SleepInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchSleepData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    // ── Run intelligence engine ─────────────────────────────────────────────
    const assessment = analyseSleepPatterns(input);

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    console.error("[cara/sleep-patterns] Error:", err);
    return NextResponse.json(
      { error: "Sleep pattern intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchSleepData(sb: any, childId: string): Promise<SleepInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 14;

  // Fetch health context
  const { data: healthRecord } = await (sb.from("health_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch sleep nights (last 28 days)
  const cutoff = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
  const { data: rawNights } = await (sb.from("sleep_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const nights: SleepNight[] = (rawNights ?? []).map((n: any) => ({
    date: n.date,
    bedtime: n.bedtime ?? "21:00",
    settledTime: n.settled_time ?? n.bedtime ?? "21:15",
    wakeTime: n.wake_time ?? "07:00",
    nightWakings: n.night_wakings ?? 0,
    nightmares: n.nightmares ?? false,
    nightTerrors: n.night_terrors ?? false,
    wetBed: n.wet_bed ?? false,
    sleepwalking: n.sleepwalking ?? false,
    medicationGiven: n.medication_given ?? false,
    medicationName: n.medication_name ?? undefined,
    resistedBedtime: n.resisted_bedtime ?? false,
    environmentalDisruption: n.environmental_disruption ?? false,
    moodOnWake: n.mood_on_wake ?? "neutral",
    staffNotes: n.staff_notes ?? undefined,
    nextDayImpact: n.next_day_impact ?? undefined,
  }));

  return {
    childId,
    childName,
    age,
    nights: nights.length > 0 ? nights : buildDemoNights(childId),
    knownConditions: healthRecord?.conditions ?? [],
    currentMedications: healthRecord?.medications ?? [],
    hasHealthPlan: healthRecord?.has_health_plan ?? false,
    gpNotifiedOfSleepIssues: healthRecord?.gp_notified_sleep ?? false,
    sleepHygienePlanInPlace: healthRecord?.sleep_plan_in_place ?? false,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): SleepInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  return {
    childId,
    childName: isJordan ? "Jordan" : "Sam",
    age: isJordan ? 15 : 14,
    nights: buildDemoNights(childId),
    knownConditions: isJordan ? ["ADHD", "anxiety"] : [],
    currentMedications: isJordan ? ["Melatonin 3mg"] : [],
    hasHealthPlan: true,
    gpNotifiedOfSleepIssues: isJordan ? true : false,
    sleepHygienePlanInPlace: isJordan ? true : false,
  };
}

function buildDemoNights(childId: string): SleepNight[] {
  const isJordan = childId.includes("jordan") || childId === "child_1";
  const nights: SleepNight[] = [];

  for (let i = 0; i < 21; i++) {
    const date = new Date(2026, 4, 1 + i).toISOString().slice(0, 10);

    if (isJordan) {
      // Jordan: disrupted sleep, improving trend with melatonin
      const isEarlyPeriod = i < 10;
      const bedtime = isEarlyPeriod ? "22:30" : "22:00";
      const settlingDelay = isEarlyPeriod ? 45 : 20;
      const [bh, bm] = bedtime.split(":").map(Number);
      const settledTotal = bh * 60 + bm + settlingDelay;
      const settledH = Math.floor(settledTotal / 60) % 24;
      const settledM = settledTotal % 60;
      const settledTime = `${String(settledH).padStart(2, "0")}:${String(settledM).padStart(2, "0")}`;

      nights.push({
        date,
        bedtime,
        settledTime,
        wakeTime: isEarlyPeriod ? "06:30" : "07:00",
        nightWakings: isEarlyPeriod ? (i % 2 === 0 ? 2 : 1) : (i % 3 === 0 ? 1 : 0),
        nightmares: i === 2 || i === 7 || i === 14,
        nightTerrors: false,
        wetBed: false,
        sleepwalking: false,
        medicationGiven: i >= 7,
        medicationName: i >= 7 ? "Melatonin 3mg" : undefined,
        resistedBedtime: isEarlyPeriod ? i % 3 === 0 : false,
        environmentalDisruption: i === 4 || i === 11,
        moodOnWake: isEarlyPeriod ? (i % 2 === 0 ? "poor" : "neutral") : (i % 3 === 0 ? "neutral" : "good"),
        nextDayImpact: isEarlyPeriod ? (i % 3 === 0 ? "moderate" : "mild") : "none",
      });
    } else {
      // Sam: generally good sleep
      nights.push({
        date,
        bedtime: "21:30",
        settledTime: "21:45",
        wakeTime: "07:15",
        nightWakings: i === 5 || i === 12 ? 1 : 0,
        nightmares: i === 8,
        nightTerrors: false,
        wetBed: false,
        sleepwalking: false,
        medicationGiven: false,
        resistedBedtime: i === 14,
        environmentalDisruption: false,
        moodOnWake: "good",
        nextDayImpact: "none",
      });
    }
  }

  return nights;
}
