import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  generateWhistleblowingConcernsIntelligence,
  getDemoWhistleblowingConcernsData,
  getConcernCategoryLabel,
  getConcernSeverityLabel,
  getConcernStatusLabel,
  getResolutionOutcomeLabel,
  getProtectionStatusLabel,
  getReporterTypeLabel,
} from "@/lib/whistleblowing-concerns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) {
    return NextResponse.json({ error: "homeId required" }, { status: 400 });
  }

  // Label lookups
  if (type === "category_labels") {
    const categories = [
      "safeguarding", "practice_standards", "regulatory_breach",
      "bullying_harassment", "fraud_financial", "health_safety",
      "data_protection", "discrimination", "management_conduct", "staffing_levels",
    ] as const;
    const labels = categories.map((c) => ({ value: c, label: getConcernCategoryLabel(c) }));
    return NextResponse.json({ ok: true, data: labels });
  }

  if (type === "severity_labels") {
    const severities = ["critical", "high", "medium", "low"] as const;
    const labels = severities.map((s) => ({ value: s, label: getConcernSeverityLabel(s) }));
    return NextResponse.json({ ok: true, data: labels });
  }

  if (type === "status_labels") {
    const statuses = [
      "received", "acknowledged", "investigating", "resolved",
      "escalated", "closed_no_action", "withdrawn",
    ] as const;
    const labels = statuses.map((s) => ({ value: s, label: getConcernStatusLabel(s) }));
    return NextResponse.json({ ok: true, data: labels });
  }

  if (type === "outcome_labels") {
    const outcomes = [
      "substantiated", "partially_substantiated", "unsubstantiated",
      "inconclusive", "withdrawn",
    ] as const;
    const labels = outcomes.map((o) => ({ value: o, label: getResolutionOutcomeLabel(o) }));
    return NextResponse.json({ ok: true, data: labels });
  }

  if (type === "protection_labels") {
    const statuses = [
      "fully_protected", "partially_protected", "not_protected", "retaliation_reported",
    ] as const;
    const labels = statuses.map((s) => ({ value: s, label: getProtectionStatusLabel(s) }));
    return NextResponse.json({ ok: true, data: labels });
  }

  if (type === "reporter_labels") {
    const types = [
      "staff_member", "anonymous", "external_professional",
      "child", "parent_carer", "visitor",
    ] as const;
    const labels = types.map((t) => ({ value: t, label: getReporterTypeLabel(t) }));
    return NextResponse.json({ ok: true, data: labels });
  }

  // Default: generate intelligence from demo data
  const periodStart = searchParams.get("periodStart") ?? "2026-01-01";
  const periodEnd = searchParams.get("periodEnd") ?? "2026-05-18";

  const demo = getDemoWhistleblowingConcernsData();
  const result = generateWhistleblowingConcernsIntelligence(
    demo.concerns,
    demo.protections,
    demo.policy,
    demo.culture,
    homeId,
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ ok: true, data: result });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const {
      concerns,
      protections,
      policy,
      culture,
      homeId,
      periodStart,
      periodEnd,
    } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }
    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "periodStart and periodEnd required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(concerns)) {
      return NextResponse.json(
        { error: "concerns must be an array" },
        { status: 400 },
      );
    }

    const result = generateWhistleblowingConcernsIntelligence(
      concerns,
      protections ?? [],
      policy ?? null,
      culture ?? null,
      homeId,
      periodStart,
      periodEnd,
    );

    return NextResponse.json({ ok: true, data: result });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
