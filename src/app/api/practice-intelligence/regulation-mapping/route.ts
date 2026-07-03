// ══════════════════════════════════════════════════════════════════════════════
// API — PRACTICE INTELLIGENCE: REGULATION MAPPING
// GET  ?mode=coverage       → regulation coverage summary
// GET  ?mode=sccif          → SCCIF readiness summary
// GET  ?mode=mappings       → list framework mappings
// POST { artifactType, ... }→ map artifact to regulations
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  mapArtifactToRegulations,
  createFrameworkMapping,
  listFrameworkMappings,
  getRegulationCoverage,
  getSCCIFReadiness,
} from "@/lib/practice-intelligence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "coverage";

    if (mode === "sccif") {
      const readiness = await getSCCIFReadiness();
      return NextResponse.json({ ok: true, data: readiness });
    }

    if (mode === "mappings") {
      const mappings = await listFrameworkMappings({
        framework: (searchParams.get("framework") as any) ?? undefined,
        sccifTheme: (searchParams.get("sccifTheme") as any) ?? undefined,
        artifactType: searchParams.get("artifactType") ?? undefined,
        limit: parseInt(searchParams.get("limit") ?? "50", 10),
      });
      return NextResponse.json({ ok: true, data: mappings });
    }

    const coverage = await getRegulationCoverage();
    return NextResponse.json({ ok: true, data: coverage });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;

    if (body.artifactType && body.autoMap) {
      const refs = mapArtifactToRegulations(body.artifactType, body.content);
      return NextResponse.json({ ok: true, data: refs });
    }

    const { framework, regulation, qualityStandard, sccifTheme, evidenceText, artifactId, artifactType } = body;

    if (!framework) {
      return NextResponse.json({ ok: false, error: "framework is required" }, { status: 400 });
    }

    const mapping = await createFrameworkMapping({
      artifactId,
      artifactType,
      framework,
      regulation,
      qualityStandard,
      sccifTheme,
      evidenceText,
    });

    return NextResponse.json({ ok: true, data: mapping });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
