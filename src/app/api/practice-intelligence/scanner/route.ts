// ══════════════════════════════════════════════════════════════════════════════
// API — PRACTICE INTELLIGENCE: SCANNER
// GET  ?mode=latest        → get latest scan
// GET  ?mode=list&limit=x  → list recent scans
// POST { scanType }        → run a new scan
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  runPracticeIntelligenceScan,
  getLatestScan,
  listScans,
} from "@/lib/practice-intelligence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "latest";
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);

    if (mode === "list") {
      const scans = await listScans(undefined, limit);
      return NextResponse.json({ ok: true, data: scans });
    }

    const scan = await getLatestScan();
    return NextResponse.json({ ok: true, data: scan });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const scanType = body.scanType ?? "on_demand";

    const scan = await runPracticeIntelligenceScan(undefined, scanType);
    return NextResponse.json({ ok: true, data: scan });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
