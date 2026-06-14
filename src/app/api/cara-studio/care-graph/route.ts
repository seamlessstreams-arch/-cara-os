// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/care-graph — Care knowledge graph
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  getChildKnowledgeGraph,
  getNodesByType,
  autoPopulateGraphForChild,
} from "@/lib/cara-studio/care-graph.service";
import type { CaraStudioNodeType } from "@/types/cara-studio";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id");
    const nodeType = searchParams.get("node_type") as CaraStudioNodeType | null;

    if (childId) {
      const graph = await getChildKnowledgeGraph(childId);
      return NextResponse.json({ data: graph });
    }

    if (nodeType) {
      const nodes = await getNodesByType(nodeType);
      return NextResponse.json({ data: nodes });
    }

    return NextResponse.json(
      { error: "Provide child_id or node_type as query parameter" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[cara-studio/care-graph] GET error:", err);
    return NextResponse.json({ error: "Failed to query care graph" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.child_id) {
      return NextResponse.json({ error: "child_id is required" }, { status: 400 });
    }

    const result = await autoPopulateGraphForChild(body.child_id);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    console.error("[cara-studio/care-graph] POST error:", err);
    return NextResponse.json({ error: "Failed to populate care graph" }, { status: 500 });
  }
}
