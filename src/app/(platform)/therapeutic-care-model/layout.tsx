import type { Metadata } from "next";

export const metadata: Metadata = { title: "Care Model · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
