import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

const FLAG = "CARA_CRON_ENABLED";
const SECRET = "CRON_SECRET";
afterEach(() => {
  delete process.env[FLAG];
  delete process.env[SECRET];
});

const req = (auth?: string) =>
  new NextRequest("http://localhost/api/cron", auth ? { headers: { authorization: auth } } : undefined);

describe("Phase 1 infra · 3/3 — scheduled jobs endpoint gating", () => {
  it("is a 200 no-op when the cron_scheduler flag is off (demo default)", async () => {
    delete process.env[FLAG];
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ran: false });
    expect(body.reason).toContain("flag is off");
  });

  it("500s when enabled but CRON_SECRET is not configured", async () => {
    process.env[FLAG] = "true";
    delete process.env[SECRET];
    const res = await GET(req());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ ran: false });
    expect(body.error).toContain("CRON_SECRET");
  });

  it("401s when enabled + secret set but the Authorization header is missing/wrong", async () => {
    process.env[FLAG] = "true";
    process.env[SECRET] = "s3cret";
    expect((await GET(req())).status).toBe(401); // no header
    expect((await GET(req("Bearer wrong")).then((r) => r.status))).toBe(401); // wrong secret
  });

  it("runs the jobs when enabled + secret set + correct Bearer header", async () => {
    process.env[FLAG] = "true";
    process.env[SECRET] = "s3cret";
    const res = await GET(req("Bearer s3cret"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ran).toBe(true);
    expect(typeof body.at).toBe("string");
    const reminders = body.jobs.find((j: { name: string }) => j.name === "due_reminders");
    expect(reminders).toBeTruthy();
    expect(reminders.ok).toBe(true);
    expect(typeof reminders.detail.fired).toBe("number"); // runDueReminders returns { fired }
  });
});
