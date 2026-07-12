import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kitchen Hygiene · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
