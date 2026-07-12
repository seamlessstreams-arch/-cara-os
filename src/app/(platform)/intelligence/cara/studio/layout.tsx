import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cara Studio · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
