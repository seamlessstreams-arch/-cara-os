// CARA STUDIO — GET /api/cara/library
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data: { resources: db.caraLibraryResources.findAll() } });
}
