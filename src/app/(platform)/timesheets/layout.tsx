import type { Metadata } from "next";

export const metadata: Metadata = { title: "Timesheets · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
