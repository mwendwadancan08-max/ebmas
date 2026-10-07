import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EBMAS | Examination Booklet Management & Accountability System",
  description: "Examination Booklet Management & Accountability System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
