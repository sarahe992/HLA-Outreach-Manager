import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HLA Outreach Manager",
  description: "Healthcare Leadership Association – BYU Outreach Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
