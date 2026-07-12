import type { Metadata } from "next";

export const metadata: Metadata = { title: "Welcome Packs · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
