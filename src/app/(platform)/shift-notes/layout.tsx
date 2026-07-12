import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shift Notes · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
