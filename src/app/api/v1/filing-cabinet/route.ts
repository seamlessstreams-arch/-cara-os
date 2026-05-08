import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

// ── GET /api/v1/filing-cabinet ────────────────────────────────────────────────
// Returns all filing cabinet items, optionally filtered.
// Query params: category, child_id, verified, search

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const category    = searchParams.get("category");
    const childId     = searchParams.get("child_id");
    const verifiedStr = searchParams.get("verified");
    const search      = searchParams.get("search")?.toLowerCase();

    let items = db.filingCabinet.findByHome("home_oak");

    if (category)     items = items.filter((i) => i.category === category);
    if (childId)      items = items.filter((i) => i.child_id === childId);
    if (verifiedStr !== null) {
      const verified = verifiedStr === "true";
      items = items.filter((i) => i.is_verified === verified);
    }
    if (search) {
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(search) ||
          (i.description ?? "").toLowerCase().includes(search) ||
          i.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    // Enrich with source care event summary
    const enriched = items.map((item) => {
      const careEvent = db.careEvents.findById(item.care_event_id);
      return {
        ...item,
        care_event: careEvent
          ? {
              id: careEvent.id,
              title: careEvent.title,
              category: careEvent.category,
              status: careEvent.status,
              event_date: careEvent.event_date,
              staff_id: careEvent.staff_id,
            }
          : null,
      };
    });

    // Sort newest filed first
    enriched.sort((a, b) => b.filed_at.localeCompare(a.filed_at));

    // Category counts
    const categoryCounts: Record<string, number> = {};
    for (const item of enriched) {
      categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;
    }

    return NextResponse.json({
      items: enriched,
      meta: {
        total: enriched.length,
        verified: enriched.filter((i) => i.is_verified).length,
        unverified: enriched.filter((i) => !i.is_verified).length,
        category_counts: categoryCounts,
      },
    });
  } catch (err) {
    console.error("[filing-cabinet GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH /api/v1/filing-cabinet ──────────────────────────────────────────────
// Actions: verify

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      id: string;
      action: "verify";
      verified_by: string;
    };

    const { id, action, verified_by } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action are required" }, { status: 400 });
    }

    if (action === "verify") {
      const updated = db.filingCabinet.patch(id, {
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by,
      });
      if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      return NextResponse.json({ item: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[filing-cabinet PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
