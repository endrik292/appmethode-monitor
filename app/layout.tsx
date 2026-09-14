import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppMethode Monitor",
  description: "Live-Status fuer appmethode.com"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
