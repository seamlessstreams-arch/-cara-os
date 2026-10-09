// CARA STUDIO — GET /api/cara/profile/[childId]/draft
// A DRAFT learning profile assembled from records the home already keeps, for
// staff to confirm or edit. Read-only; never writes (the profile PUT persists
// after a human has reviewed it). Live-safe via dal — see profile-autodraft.ts.
import { NextResponse, type NextRequest } from "next/server";
import { dal } from "@/lib/db/dal";
import { draftLearningProfileFromRecords } from "@/lib/cara-studio/profile-autodraft";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ childId: string }> }) {
  const { childId } = await ctx.params;
  const child = await dal.youngPeople.findById(childId);
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { draft } = await draftLearningProfileFromRecords(childId);
  return NextResponse.json({ data: { draft } });
}
