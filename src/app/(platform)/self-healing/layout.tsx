import type { Metadata } from "next";

export const metadata: Metadata = { title: "Self-Healing · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
