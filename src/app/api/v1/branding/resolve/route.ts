// ── GET /api/v1/branding/resolve ─────────────────────────────────────────────
// Resolves the correct branding for the given context.
// Returns a complete ResolvedBranding object.
//
// Query params:
//   organisation_id — optional
//   home_id         — optional
//   document_type   — optional
//   document_id     — optional (triggers a snapshot to be saved)

import { NextRequest, NextResponse } from "next/server";
import { resolveBranding, snapshotBranding, checkBrandingCompleteness } from "@/lib/branding/resolver";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const organisation_id = searchParams.get("organisation_id") ?? undefined;
  const home_id         = searchParams.get("home_id") ?? undefined;
  const document_type   = searchParams.get("document_type") ?? undefined;
  const document_id     = searchParams.get("document_id") ?? undefined;
  const snapshot        = searchParams.get("snapshot") === "true";
  const generated_by    = searchParams.get("generated_by") ?? undefined;

  let branding;

  if (snapshot && document_id && document_type) {
    // Create a snapshot and return the resolved branding
    branding = snapshotBranding({
      document_id,
      document_type,
      organisation_id,
      home_id,
      generated_by,
    });
  } else {
    branding = resolveBranding({ organisation_id, home_id, document_type, document_id });
  }

  const completeness = checkBrandingCompleteness(branding);

  return NextResponse.json({ data: branding, completeness });
}
