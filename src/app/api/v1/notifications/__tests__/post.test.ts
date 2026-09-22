import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/v1/notifications/route";

// The rota's "offer shift to bank staff" POSTs here. When the dedicated route
// replaced the catch-all for GET/PATCH it did not carry POST → 405.
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(new Request("http://t/api/v1/notifications", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));

describe("POST /api/v1/notifications (demo mode)", () => {
  it("400s without recipient_id / title", async () => {
    expect((await POST(req({ title: "x" }))).status).toBe(400);
    expect((await POST(req({ recipient_id: "staff_b" }))).status).toBe(400);
  });

  it("creates a notification the recipient can then read", async () => {
    const res = await POST(req({ recipient_id: "staff_b", title: "Open shift available", body: "Sat 09:00–17:00", type: "system", priority: "normal", entity_type: "shift" }));
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(data.recipient_id).toBe("staff_b");
    expect(data.read).toBe(false);

    const list = await GET(new NextRequest(new Request("http://t/api/v1/notifications", { headers: { "x-user-id": "staff_b" } })));
    const body = await list.json();
    expect(body.data.some((n: { id: string }) => n.id === data.id)).toBe(true);
  });
});
