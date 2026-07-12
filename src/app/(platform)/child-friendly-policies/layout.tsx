import type { Metadata } from "next";

export const metadata: Metadata = { title: "Child-Friendly Policies · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
