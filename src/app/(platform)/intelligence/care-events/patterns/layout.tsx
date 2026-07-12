import type { Metadata } from "next";

export const metadata: Metadata = { title: "Care Event Patterns · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
