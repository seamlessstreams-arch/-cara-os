import type { Metadata } from "next";

export const metadata: Metadata = { title: "Writing to the Child · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
