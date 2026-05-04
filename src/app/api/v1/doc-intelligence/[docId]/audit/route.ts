import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  const doc = db.uploadedDocuments.findById(docId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const log = db.documentAuditLog.findByDocument(docId);
  return NextResponse.json({ data: log.sort((a, b) => b.timestamp.localeCompare(a.timestamp)) });
}
