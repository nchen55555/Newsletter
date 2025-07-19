import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Newsletter",
  description: "A simple newsletter application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={mono.variable}>
      <body className={`antialiased font-mono bg-[#FFFCF8] min-h-screen ${mono.className}`}>
        {children}
      </body>
    </html>
  );
}
