import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMPULSE Portal MVP",
  description: "IMPULSE diagnostics and transformation portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
