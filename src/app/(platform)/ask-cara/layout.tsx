import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ask Cara · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
