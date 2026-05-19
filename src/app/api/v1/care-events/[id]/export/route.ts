import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type { CareEvent, CareEventRoute, CareEventAuditLog, Reg45EvidenceItem, AnnexAEvidenceItem } from "@/types/care-events";

/**
 * GET /api/v1/care-events/[id]/export
 *
 * Export a care event as a structured evidence pack.
 *
 * Query params:
 *   ?format=json   — full evidence bundle (default)
 *   ?format=html   — print-ready HTML document (browser print → PDF)
 *
 * The evidence bundle includes:
 *   - Care event details
 *   - Routing results
 *   - Audit log
 *   - Regulation 45 evidence items
 *   - Annex A evidence items
 *
 * SECURITY: Requires VIEW_DAILY_LOG permission. Sensitive exports (safeguarding,
 * restraint) are accessible to the home's staff but should be further restricted
 * at the home level by managers.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermissionAsync(req, PERMISSIONS.VIEW_DAILY_LOG);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { id } = await params;

  const event = db.careEvents.findById(id);
  if (!event) {
    return NextResponse.json({ error: "Care event not found" }, { status: 404 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "json";

  // ── Collect evidence bundle ─────────────────────────────────────────────────

  const routes: CareEventRoute[] = db.careEventRoutes.findByCareEvent(id);
  const auditLog: CareEventAuditLog[] = db.careEventAuditLog.findByCareEvent(id);
  const reg45Items: Reg45EvidenceItem[] = db.reg45EvidenceQueue
    .findAll()
    .filter((e) => e.care_event_id === id);
  const annexAItems: AnnexAEvidenceItem[] = db.annexAEvidenceQueue
    .findAll()
    .filter((e) => e.care_event_id === id);

  // Lookup names for display
  const staff = event.staff_id ? db.staff.findById(event.staff_id) : null;
  const child = event.child_id ? db.youngPeople.findById(event.child_id) : null;
  const verifier = event.verified_by ? db.staff.findById(event.verified_by) : null;

  // Audit this export
  db.careEventAuditLog.append({
    care_event_id: id,
    home_id: event.home_id,
    actor_staff_id: userId,
    actor_role: null,
    action: "export_generated",
    detail: { format, exported_by: userId },
    ip_address: null,
  });

  // ── JSON evidence bundle ────────────────────────────────────────────────────

  if (format === "json") {
    const bundle = buildEvidenceBundle(event, routes, auditLog, reg45Items, annexAItems, {
      staffName: staff ? `${staff.first_name} ${staff.last_name}` : event.staff_id,
      childName: child ? `${child.first_name} ${child.last_name}` : event.child_id ?? "N/A",
      verifierName: verifier ? `${verifier.first_name} ${verifier.last_name}` : event.verified_by ?? null,
    });

    return NextResponse.json(bundle, {
      headers: {
        "Content-Disposition": `attachment; filename="care-event-${id}-evidence-pack.json"`,
        "Content-Type": "application/json",
      },
    });
  }

  // ── HTML print-ready export ─────────────────────────────────────────────────

  if (format === "html") {
    const html = buildHtmlExport(event, routes, auditLog, reg45Items, annexAItems, {
      staffName: staff ? `${staff.first_name} ${staff.last_name}` : event.staff_id,
      childName: child ? `${child.first_name} ${child.last_name}` : event.child_id ?? "N/A",
      verifierName: verifier ? `${verifier.first_name} ${verifier.last_name}` : event.verified_by ?? null,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="care-event-${id}-evidence-pack.html"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.json(
    { error: `Unknown format '${format}'. Supported: json, html` },
    { status: 400 }
  );
}

// ── Evidence bundle builder ───────────────────────────────────────────────────

interface Names {
  staffName: string;
  childName: string;
  verifierName: string | null;
}

function buildEvidenceBundle(
  event: CareEvent,
  routes: CareEventRoute[],
  auditLog: CareEventAuditLog[],
  reg45Items: Reg45EvidenceItem[],
  annexAItems: AnnexAEvidenceItem[],
  names: Names
) {
  return {
    export_metadata: {
      exported_at: new Date().toISOString(),
      export_version: "1.0",
      care_event_id: event.id,
      bundle_type: "evidence_pack",
    },
    care_event: {
      ...event,
      _display: {
        staff_name: names.staffName,
        child_name: names.childName,
        verifier_name: names.verifierName,
      },
    },
    routing: {
      summary: event.routing_summary,
      routes: routes.map((r) => ({
        route_type: r.route_type,
        status: r.status,
        linked_record_id: r.linked_record_id,
        linked_record_table: r.linked_record_table,
        processing_notes: r.processing_notes,
        updated_at: r.updated_at,
      })),
    },
    evidence: {
      reg45_items: reg45Items,
      annex_a_items: annexAItems,
    },
    audit_log: auditLog.map((e) => ({
      action: e.action,
      actor_staff_id: e.actor_staff_id,
      detail: e.detail,
      created_at: e.created_at,
    })),
    statutory_flags: {
      contributes_to_reg45: event.contributes_to_reg45,
      contributes_to_annex_a: event.contributes_to_annex_a,
      requires_reg40_triage: event.requires_reg40_triage,
      is_safeguarding: event.is_safeguarding,
      is_significant: event.is_significant,
    },
  };
}

// ── HTML export builder ───────────────────────────────────────────────────────

function esc(s: unknown): string {
  if (s === null || s === undefined) return "—";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function badge(status: string): string {
  const colours: Record<string, string> = {
    verified: "#166534",
    locked: "#1e40af",
    submitted: "#0369a1",
    routed: "#0369a1",
    draft: "#92400e",
    returned: "#7f1d1d",
    failed: "#7f1d1d",
    completed: "#166534",
    pending: "#92400e",
    approved: "#166534",
    rejected: "#7f1d1d",
  };
  const bg = colours[status] ?? "#374151";
  return `<span style="background:${bg};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase">${esc(status)}</span>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="font-weight:600;padding:6px 12px 6px 0;width:200px;color:#374151;vertical-align:top">${label}</td><td style="padding:6px 0;color:#111827">${value}</td></tr>`;
}

function section(title: string, content: string): string {
  return `
  <div style="margin-bottom:32px;page-break-inside:avoid">
    <h2 style="font-size:14px;font-weight:700;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:6px;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.05em">${esc(title)}</h2>
    ${content}
  </div>`;
}

function buildHtmlExport(
  event: CareEvent,
  routes: CareEventRoute[],
  auditLog: CareEventAuditLog[],
  reg45Items: Reg45EvidenceItem[],
  annexAItems: AnnexAEvidenceItem[],
  names: Names
): string {
  const exportedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ── Event details section ─────────────────────────────────────────────────
  const eventSection = section(
    "Care Event Details",
    `<table style="width:100%;border-collapse:collapse">
      ${row("Event ID", esc(event.id))}
      ${row("Title", esc(event.title))}
      ${row("Category", esc(event.category.replace(/_/g, " ")))}
      ${row("Status", badge(event.status))}
      ${row("Event Date", esc(event.event_date))}
      ${row("Event Time", esc(event.event_time))}
      ${row("Recorded by", esc(names.staffName))}
      ${row("Child / Young Person", esc(names.childName))}
      ${row("Version", esc(String(event.version)))}
      ${event.submitted_at ? row("Submitted", fmtDate(event.submitted_at)) : ""}
      ${event.verified_at ? row("Verified by", `${esc(names.verifierName)} on ${fmtDate(event.verified_at)}`) : ""}
      ${event.locked_at ? row("Locked", fmtDate(event.locked_at)) : ""}
      ${event.amendment_reason ? row("Amendment reason", esc(event.amendment_reason)) : ""}
    </table>
    <div style="margin-top:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px">
      <strong style="display:block;margin-bottom:8px;color:#374151">Entry</strong>
      <p style="margin:0;white-space:pre-wrap;line-height:1.6;color:#111827">${esc(event.content)}</p>
    </div>`
  );

  // ── Statutory flags ───────────────────────────────────────────────────────
  const flag = (label: string, val: boolean) =>
    `<span style="display:inline-block;margin:4px;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:600;background:${val ? "#dcfce7" : "#f3f4f6"};color:${val ? "#166534" : "#6b7280"}">${label}: ${val ? "Yes" : "No"}</span>`;

  const flagsSection = section(
    "Statutory Flags",
    `<div>
      ${flag("Significant event", event.is_significant)}
      ${flag("Regulation 45", event.contributes_to_reg45)}
      ${flag("Annex A", event.contributes_to_annex_a)}
      ${flag("Reg 40 triage", event.requires_reg40_triage)}
      ${flag("Safeguarding", event.is_safeguarding)}
      ${flag("Manager review", event.requires_manager_review)}
    </div>`
  );

  // ── Staff signature ───────────────────────────────────────────────────────
  const signatureSection = section(
    "Signatures",
    `<table style="width:100%;border-collapse:collapse">
      ${row("Staff signature", event.staff_signature ? `${esc(names.staffName)} signed ${fmtDate(event.staff_signed_at)}` : "Not signed")}
      ${row("Manager signature", event.manager_signature ? `${esc(names.verifierName)} signed ${fmtDate(event.manager_review_at)}` : "Not signed")}
      ${event.manager_notes ? row("Manager notes", esc(event.manager_notes)) : ""}
      ${event.return_reason ? row("Return reason", esc(event.return_reason)) : ""}
    </table>`
  );

  // ── Evidence prompts ──────────────────────────────────────────────────────
  let promptsHtml = "";
  if (event.evidence_prompts && event.evidence_prompts.length > 0) {
    const rows = event.evidence_prompts
      .map(
        (p) => `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:8px 12px 8px 0;vertical-align:top;width:40%">
            <span style="font-weight:600">${esc(p.question)}</span>
            ${p.required ? '<span style="color:#dc2626;margin-left:4px">*</span>' : ""}
          </td>
          <td style="padding:8px 0;vertical-align:top">
            ${p.completed ? esc(p.answer ?? "Completed") : '<span style="color:#9ca3af">Not answered</span>'}
          </td>
          <td style="padding:8px 0;text-align:right;vertical-align:top">
            ${p.completed ? badge("completed") : badge("pending")}
          </td>
        </tr>`
      )
      .join("");
    promptsHtml = section(
      "Evidence Prompts",
      `<table style="width:100%;border-collapse:collapse">${rows}</table>`
    );
  }

  // ── Routing results ───────────────────────────────────────────────────────
  let routesHtml = "";
  if (routes.length > 0) {
    const routeRows = routes
      .map(
        (r) => `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:8px 12px 8px 0;font-weight:600">${esc(r.route_type.replace(/_/g, " "))}</td>
          <td style="padding:8px 0">${badge(r.status)}</td>
          <td style="padding:8px 0;color:#6b7280;font-size:12px">${esc(r.processing_notes)}</td>
          <td style="padding:8px 0;color:#6b7280;font-size:12px">${fmtDate(r.updated_at)}</td>
        </tr>`
      )
      .join("");
    routesHtml = section(
      "Routing Results",
      `<table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid #e5e7eb">
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:12px;color:#6b7280">Route</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Status</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Notes</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Processed</th>
        </tr></thead>
        <tbody>${routeRows}</tbody>
      </table>`
    );
  }

  // ── Regulation 45 evidence ────────────────────────────────────────────────
  let reg45Html = "";
  if (reg45Items.length > 0) {
    const reg45Rows = reg45Items
      .map(
        (e) => `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:8px 12px 8px 0;vertical-align:top">
            <span style="font-weight:600">${esc(e.suggested_theme ?? e.suggested_section ?? "—")}</span>
          </td>
          <td style="padding:8px 0;vertical-align:top">${esc(e.suggested_text)}</td>
          <td style="padding:8px 0;vertical-align:top">${badge(e.manager_decision)}</td>
        </tr>`
      )
      .join("");
    reg45Html = section(
      "Regulation 45 Evidence",
      `<table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid #e5e7eb">
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:12px;color:#6b7280">Type</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Suggested content</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Decision</th>
        </tr></thead>
        <tbody>${reg45Rows}</tbody>
      </table>`
    );
  }

  // ── Annex A evidence ──────────────────────────────────────────────────────
  let annexAHtml = "";
  if (annexAItems.length > 0) {
    const annexARows = annexAItems
      .map(
        (e) => `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:8px 12px 8px 0">${esc(e.annex_section)}</td>
          <td style="padding:8px 0">${esc(e.suggested_text)}</td>
          <td style="padding:8px 0">${badge(e.manager_decision)}</td>
        </tr>`
      )
      .join("");
    annexAHtml = section(
      "Annex A Evidence",
      `<table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid #e5e7eb">
          <th style="text-align:left;padding:8px 12px 8px 0;font-size:12px;color:#6b7280">Section</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Suggested content</th>
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280">Decision</th>
        </tr></thead>
        <tbody>${annexARows}</tbody>
      </table>`
    );
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  let auditHtml = "";
  if (auditLog.length > 0) {
    const auditRows = auditLog
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(
        (e) => `<tr style="border-bottom:1px solid #e5e7eb">
          <td style="padding:6px 12px 6px 0;font-size:12px;color:#6b7280;white-space:nowrap">${fmtDate(e.created_at)}</td>
          <td style="padding:6px 12px 6px 0;font-weight:600;font-size:12px">${esc(e.action)}</td>
          <td style="padding:6px 0;font-size:12px;color:#6b7280">${esc(e.actor_staff_id)}</td>
          <td style="padding:6px 0;font-size:12px">${esc(e.detail)}</td>
        </tr>`
      )
      .join("");
    auditHtml = section(
      "Audit Trail",
      `<table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid #e5e7eb">
          <th style="text-align:left;padding:6px 12px 6px 0;font-size:11px;color:#6b7280">When</th>
          <th style="text-align:left;padding:6px 12px 6px 0;font-size:11px;color:#6b7280">Action</th>
          <th style="text-align:left;padding:6px 12px 6px 0;font-size:11px;color:#6b7280">By</th>
          <th style="text-align:left;padding:6px 0;font-size:11px;color:#6b7280">Detail</th>
        </tr></thead>
        <tbody>${auditRows}</tbody>
      </table>`
    );
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Care Event Evidence Pack — ${esc(event.id)}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      @page { margin: 20mm; size: A4; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #111827;
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    h1 { font-size: 20px; font-weight: 700; color: #1e3a5f; margin: 0 0 4px; }
    .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 32px; }
    .meta { color: #6b7280; font-size: 12px; margin-top: 4px; }
    .watermark {
      border: 2px solid #dc2626;
      color: #dc2626;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 12px;
      display: inline-block;
      margin-top: 8px;
    }
    .print-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      background: #1e3a5f;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 32px;
      color: #9ca3af;
      font-size: 11px;
      text-align: center;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <h1>Care Event Evidence Pack</h1>
    <div class="meta">
      Event ID: ${esc(event.id)} &bull;
      Exported: ${exportedAt} &bull;
      Status: ${badge(event.status)}
    </div>
    ${event.status !== "verified" && event.status !== "locked" ? '<div class="watermark">UNVERIFIED — NOT FOR STATUTORY USE</div>' : ""}
  </div>

  ${eventSection}
  ${flagsSection}
  ${signatureSection}
  ${promptsHtml}
  ${routesHtml}
  ${reg45Html}
  ${annexAHtml}
  ${auditHtml}

  <div class="footer">
    Cornerstone &bull; Care Event ${esc(event.id)} &bull; Exported ${exportedAt} &bull; Version ${esc(String(event.version))}
    <br>This document is generated from the live Cornerstone record. For statutory purposes, only verified and locked records are authoritative.
  </div>
</body>
</html>`;
}
