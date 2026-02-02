import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearPolicy AI",
  description: "Policy document Q&A prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
