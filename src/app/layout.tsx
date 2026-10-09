import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Broadwing Accounting", template: "%s · Broadwing Accounting" },
  description: "Simple accounting for small businesses — part of Broadwing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
