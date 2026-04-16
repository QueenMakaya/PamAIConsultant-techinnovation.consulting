import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Innovation Consulting",
  description: "AI-powered consulting solutions for forward-thinking businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
