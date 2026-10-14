import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

export async function GET() {
  const swaps = await dal.shiftSwaps.findAll();
  return NextResponse.json({ data: swaps });
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { requester_id, target_staff_id, requester_shift_id, target_shift_id, reason } = body;

    if (!requester_id || !target_staff_id || !requester_shift_id || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: requester_id, target_staff_id, requester_shift_id, reason" },
        { status: 400 },
      );
    }

    const swap = await dal.shiftSwaps.create({
      requester_id,
      target_staff_id,
      requester_shift_id,
      target_shift_id: target_shift_id ?? null,
      status: "pending",
      reason,
      manager_notes: null,
      decided_by: null,
      decided_at: null,
    });

    return NextResponse.json({ data: swap }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create swap request" }, { status: 500 });
  }
}
