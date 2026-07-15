"use client";

// CARA HQ — customers (list + provision)

import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HqBoundaryNote, HqStatusBadge } from "@/components/hq/hq-bits";
import { useHqCustomers, useProvisionCustomer } from "@/hooks/use-hq";

const PLANS = ["pilot", "essentials", "professional", "group"] as const;

const inputCls =
  "w-full rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] px-3 py-2 text-sm text-[var(--cs-navy)] outline-none focus-visible:border-[var(--cs-teal)]";
const labelCls = "mb-1 block text-xs font-semibold text-[var(--cs-text-secondary)]";

export default function HqCustomersPage() {
  const { data, isLoading } = useHqCustomers();
  const provision = useProvisionCustomer();
  const EMPTY = {
    org_name: "",
    first_home_name: "",
    first_home_address: "",
    first_home_ofsted_urn: "",
    first_home_max_beds: "3",
    plan: "pilot",
    manager_name: "",
    manager_email: "",
  };
  const [form, setForm] = useState(EMPTY);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    provision.mutate(form, { onSuccess: () => setForm(EMPTY) });
  };

  const customers = data?.customers ?? [];
  const homes = data?.homes ?? [];
  const homeForOrg = (orgId: string) => homes.find((h) => h.org_id === orgId) ?? null;

  return (
    <PageShell
      title="Customers"
      subtitle="Provision and manage Cara customer organisations."
      showQuickCreate={false}
    >
      <div className="space-y-6">
        <HqBoundaryNote />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Provision a new customer</CardTitle>
          </CardHeader>
          <CardContent>
            {provision.isSuccess && provision.data ? (
              <div className="rounded-xl bg-[var(--cs-success-bg)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--cs-navy)]">
                  {provision.data.customer.name} created
                </p>
                <p className="mt-1 text-xs text-[var(--cs-text-secondary)]">
                  {provision.data.home.name} is provisioned at {provision.data.home.address}
                  {provision.data.home.ofsted_urn ? ` (URN ${provision.data.home.ofsted_urn})` : ""},
                  with {provision.data.home.max_beds} bed
                  {provision.data.home.max_beds === 1 ? "" : "s"}. Manager contact recorded:{" "}
                  {provision.data.customer.primary_contact_name} (
                  {provision.data.customer.primary_contact_email}).
                </p>
                {/* The home id is what a tenant deployment is pointed at, so it is the one
                    thing here worth copying out. */}
                <p className="mt-2 font-mono text-[11px] text-[var(--cs-text-muted)] break-all">
                  SUPABASE_HOME_ID={provision.data.home.id}
                </p>
                <p className="mt-2 text-xs text-[var(--cs-text-secondary)]">
                  Set that on the home&rsquo;s deployment, along with
                  <span className="font-mono"> NEXT_PUBLIC_CARA_MODE=live</span>, and it starts
                  empty rather than seeded. Manager sign-in still needs an auth user — no
                  credentials are generated here.
                </p>
                <button
                  onClick={() => provision.reset()}
                  className="mt-2 text-xs font-semibold text-[var(--cs-teal)] hover:underline"
                >
                  Provision another
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Customer / organisation name</label>
                    <input
                      required
                      value={form.org_name}
                      onChange={(e) => set("org_name")(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>First home / site name</label>
                    <input
                      required
                      value={form.first_home_name}
                      onChange={(e) => set("first_home_name")(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Home address</label>
                    <input
                      required
                      value={form.first_home_address}
                      onChange={(e) => set("first_home_address")(e.target.value)}
                      className={inputCls}
                      placeholder="Building, street, town, postcode"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Ofsted URN <span className="font-normal opacity-60">— optional</span>
                    </label>
                    <input
                      value={form.first_home_ofsted_urn}
                      onChange={(e) => set("first_home_ofsted_urn")(e.target.value)}
                      className={inputCls}
                      placeholder="SC123456"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Beds</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={form.first_home_max_beds}
                      onChange={(e) => set("first_home_max_beds")(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Plan</label>
                    <select
                      value={form.plan}
                      onChange={(e) => set("plan")(e.target.value)}
                      className={inputCls}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p} className="capitalize">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Registered manager name</label>
                    <input
                      required
                      value={form.manager_name}
                      onChange={(e) => set("manager_name")(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Registered manager email</label>
                    <input
                      required
                      type="email"
                      value={form.manager_email}
                      onChange={(e) => set("manager_email")(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                {provision.isError && (
                  <p className="text-sm text-[var(--cs-warning)]">{(provision.error as Error).message}</p>
                )}
                <button
                  type="submit"
                  disabled={provision.isPending}
                  className="rounded-xl bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {provision.isPending ? "Provisioning…" : "Create customer"}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm">All customers</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] text-left text-[11px] uppercase tracking-wide text-[var(--cs-text-muted)]">
                    <th className="px-5 py-2.5 font-semibold">Customer</th>
                    <th className="px-5 py-2.5 font-semibold">Plan</th>
                    <th className="px-5 py-2.5 font-semibold">Status</th>
                    <th className="px-5 py-2.5 font-semibold">First home</th>
                    <th className="px-5 py-2.5 font-semibold">Manager contact</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--cs-border-subtle)]">
                      <td className="px-5 py-3">
                        <Link
                          href={`/hq/customers/${c.id}`}
                          className="font-semibold text-[var(--cs-teal)] hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 capitalize text-[var(--cs-text-secondary)]">{c.plan}</td>
                      <td className="px-5 py-3">
                        <HqStatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3 text-[var(--cs-text-secondary)]">
                        {(() => {
                          const h = homeForOrg(c.id);
                          // A customer provisioned before homes were real records has a
                          // name but no row. Say which it is rather than render both the
                          // same — one of them a deployment can actually be pointed at.
                          if (!h) {
                            return c.first_home_name ? (
                              <>
                                {c.first_home_name}
                                <span className="block text-xs text-[var(--cs-text-muted)]">
                                  name only — no home record
                                </span>
                              </>
                            ) : (
                              "—"
                            );
                          }
                          return (
                            <>
                              {h.name}
                              <span className="block text-xs text-[var(--cs-text-gentle)]">{h.address}</span>
                              <span className="block font-mono text-[10px] text-[var(--cs-text-muted)] break-all">
                                {h.id}
                              </span>
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-[var(--cs-text-secondary)]">
                        {c.primary_contact_name ?? "—"}
                        {c.primary_contact_email && (
                          <span className="block text-xs text-[var(--cs-text-gentle)]">{c.primary_contact_email}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-[var(--cs-text-muted)]">
                        No customers yet — provision your first above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
