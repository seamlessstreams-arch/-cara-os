import type { Metadata } from "next";

export const metadata: Metadata = { title: "ABC Patterns · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
